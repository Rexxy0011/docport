import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import axios from "axios";
import sweepExpiredOnlineBookings from "../utils/sweepExpiredBookings.js";

const TOKEN_TTL = "7d";
const GENERIC_ERROR = "Something went wrong";
// Window for the user to complete online payment before the slot is released.
const ONLINE_PAYMENT_TTL_MS = 15 * 60 * 1000;

const parseAddressField = (address) => {
  if (!address) return undefined;
  if (typeof address === "object") return address;
  try {
    return JSON.parse(address);
  } catch {
    return null;
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !password || !email) {
      return res
        .status(400)
        .json({ success: false, message: "Missing details" });
    }
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Enter a valid email" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ success: false, message: "Enter a strong password" });
    }

    const existing = await userModel.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: TOKEN_TTL,
    });

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: GENERIC_ERROR });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing credentials" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: TOKEN_TTL,
    });

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: GENERIC_ERROR });
  }
};

const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;

    const userData = await userModel.findById(userId).select("-password");

    res.json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: GENERIC_ERROR });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;

    if (!name || !phone || !dob || !gender) {
      return res
        .status(400)
        .json({ success: false, message: "Data missing" });
    }

    const updatePayload = { name, phone, dob, gender };

    if (address) {
      const parsed = parseAddressField(address);
      if (parsed === null) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid address format" });
      }
      updatePayload.address = parsed;
    }

    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      updatePayload.image = imageUpload.secure_url;
    }

    await userModel.findByIdAndUpdate(userId, updatePayload);

    return res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: GENERIC_ERROR });
  }
};

const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime, paymentMethod } = req.body;

    if (!docId || !slotDate || !slotTime) {
      return res
        .status(400)
        .json({ success: false, message: "Missing booking details" });
    }
    if (!["online", "cash"].includes(paymentMethod)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment method" });
    }

    // Reclaim slots from abandoned online checkouts before we check availability.
    await sweepExpiredOnlineBookings({ docId });

    // Atomic slot reservation: add slotTime to slots_booked[slotDate]
    // only if the doctor is available AND that time isn't already booked.
    const reserved = await doctorModel.findOneAndUpdate(
      {
        _id: docId,
        available: true,
        [`slots_booked.${slotDate}`]: { $ne: slotTime },
      },
      { $addToSet: { [`slots_booked.${slotDate}`]: slotTime } },
      { new: true }
    );

    if (!reserved) {
      const docExists = await doctorModel.findById(docId).select("available");
      if (!docExists) {
        return res
          .status(404)
          .json({ success: false, message: "Doctor not found" });
      }
      if (!docExists.available) {
        return res
          .status(409)
          .json({ success: false, message: "Doctor is not available" });
      }
      return res
        .status(409)
        .json({ success: false, message: "Slot not available" });
    }

    const userData = await userModel.findById(userId).select("-password");
    const docData = reserved.toObject();
    delete docData.slots_booked;
    delete docData.password;

    const paymentExpiresAt =
      paymentMethod === "online"
        ? new Date(Date.now() + ONLINE_PAYMENT_TTL_MS)
        : undefined;

    try {
      await appointmentModel.create({
        userId,
        docId,
        userData,
        docData,
        amount: docData.fees,
        slotDate,
        slotTime,
        date: Date.now(),
        paymentMethod,
        paymentExpiresAt,
      });
    } catch (createErr) {
      await doctorModel.findByIdAndUpdate(docId, {
        $pull: { [`slots_booked.${slotDate}`]: slotTime },
      });
      throw createErr;
    }

    res.json({
      success: true,
      message:
        paymentMethod === "online"
          ? "Appointment reserved — complete payment within 15 minutes"
          : "Appointment Booked Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: GENERIC_ERROR });
  }
};

const listAppointment = async (req, res) => {
  try {
    const { userId } = req.body;

    const appointments = await appointmentModel.find({ userId });
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: GENERIC_ERROR });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }
    if (String(appointmentData.userId) !== String(userId)) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized action" });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    const { docId, slotDate, slotTime } = appointmentData;
    await doctorModel.findByIdAndUpdate(docId, {
      $pull: { [`slots_booked.${slotDate}`]: slotTime },
    });

    res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: GENERIC_ERROR });
  }
};

// ======================== PAYSTACK PAYMENT ========================

const initiatePayment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;

    if (!appointmentId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing appointmentId" });
    }

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }
    if (String(appointment.userId) !== String(userId)) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized action" });
    }
    if (appointment.cancelled) {
      return res
        .status(409)
        .json({ success: false, message: "Appointment is cancelled" });
    }
    if (appointment.payment) {
      return res
        .status(409)
        .json({ success: false, message: "Appointment already paid" });
    }
    if (appointment.paymentMethod !== "online") {
      return res.status(409).json({
        success: false,
        message: "This appointment is set to pay at visit",
      });
    }
    if (
      appointment.paymentExpiresAt &&
      appointment.paymentExpiresAt.getTime() < Date.now()
    ) {
      return res
        .status(409)
        .json({ success: false, message: "Payment window expired" });
    }

    const user = await userModel.findById(userId).select("email");
    if (!user?.email) {
      return res
        .status(400)
        .json({ success: false, message: "User email missing" });
    }

    const callbackUrl =
      process.env.PAYMENT_CALLBACK_URL ||
      "https://docport-eta.vercel.app/payment-success";

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: user.email,
        amount: Math.round(appointment.amount * 100), // paystack uses kobo
        metadata: { appointmentId: String(appointment._id) },
        callback_url: callbackUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      success: true,
      authorization_url: response.data.data.authorization_url,
    });
  } catch (error) {
    console.log(error.response?.data || error);
    res
      .status(500)
      .json({ success: false, message: "Payment initialization failed" });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { userId, reference } = req.body;

    if (!reference) {
      return res
        .status(400)
        .json({ success: false, message: "Missing payment reference" });
    }

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = response.data.data;
    if (data.status !== "success") {
      return res
        .status(402)
        .json({ success: false, message: "Payment not successful" });
    }

    const appointmentId = data.metadata?.appointmentId;
    if (!appointmentId) {
      return res
        .status(400)
        .json({ success: false, message: "Transaction missing appointment" });
    }

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }
    if (String(appointment.userId) !== String(userId)) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized action" });
    }

    // Confirm Paystack charged the expected amount (kobo).
    const expectedAmount = Math.round(appointment.amount * 100);
    if (Number(data.amount) !== expectedAmount) {
      return res
        .status(409)
        .json({ success: false, message: "Payment amount mismatch" });
    }

    if (!appointment.payment) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        payment: true,
        $unset: { paymentExpiresAt: "" },
      });
    }

    return res.json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    console.log(error?.response?.data || error);
    return res
      .status(500)
      .json({ success: false, message: "Payment verification failed" });
  }
};

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  initiatePayment,
  verifyPayment,
};

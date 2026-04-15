import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AppointmentModel from "../models/appointmentModel.js";
import sweepExpiredOnlineBookings from "../utils/sweepExpiredBookings.js";

const TOKEN_TTL = "7d";
const GENERIC_ERROR = "Something went wrong";

const changeAvailability = async (req, res) => {
  try {
    const { docId } = req.body;

    const docData = await doctorModel.findById(docId);
    if (!docData) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }
    await doctorModel.findByIdAndUpdate(docId, {
      available: !docData.available,
    });

    res.json({ success: true, message: "Availability Changed" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: GENERIC_ERROR });
  }
};

const doctorList = async (req, res) => {
  try {
    await sweepExpiredOnlineBookings();
    const doctors = await doctorModel.find({}).select(["-password", "-email"]);

    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: GENERIC_ERROR });
  }
};

const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing credentials" });
    }

    const doctor = await doctorModel.findOne({ email });
    if (!doctor) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET, {
      expiresIn: TOKEN_TTL,
    });

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: GENERIC_ERROR });
  }
};

const appointmentsDoctor = async (req, res) => {
  try {
    const { docId } = req.body;

    const appointments = await AppointmentModel.find({ docId });

    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: GENERIC_ERROR });
  }
};

const appointmentComplete = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;

    const appointmentData = await AppointmentModel.findById(appointmentId);
    if (!appointmentData || String(appointmentData.docId) !== String(docId)) {
      return res
        .status(403)
        .json({ success: false, message: "Mark failed" });
    }

    await AppointmentModel.findByIdAndUpdate(appointmentId, {
      isCompleted: true,
    });
    return res.json({ success: true, message: "Appointment completed" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: GENERIC_ERROR });
  }
};

const appointmentCancel = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;

    const appointmentData = await AppointmentModel.findById(appointmentId);
    if (!appointmentData || String(appointmentData.docId) !== String(docId)) {
      return res
        .status(403)
        .json({ success: false, message: "Cancellation Failed" });
    }

    await AppointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });
    return res.json({ success: true, message: "Appointment cancelled" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: GENERIC_ERROR });
  }
};

const doctorDashboard = async (req, res) => {
  try {
    const { docId } = req.body;

    const appointments = await AppointmentModel.find({ docId });
    let earnings = 0;

    appointments.forEach((item) => {
      if (item.isCompleted || item.payment) {
        earnings += item.amount;
      }
    });

    const patients = [];
    appointments.forEach((item) => {
      if (!patients.includes(item.userId)) {
        patients.push(item.userId);
      }
    });

    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patients.length,
      latestAppointments: [...appointments].reverse().slice(0, 5),
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: GENERIC_ERROR });
  }
};

const doctorProfile = async (req, res) => {
  try {
    const { docId } = req.body;

    const profileData = await doctorModel.findById(docId).select("-password");

    res.json({ success: true, profileData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: GENERIC_ERROR });
  }
};

const updateDoctorProfile = async (req, res) => {
  try {
    const { docId, fees, address, available } = req.body;

    await doctorModel.findByIdAndUpdate(docId, {
      fees,
      address,
      available,
    });

    res.json({ success: true, message: "Profile Updated Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: GENERIC_ERROR });
  }
};

export {
  changeAvailability,
  doctorList,
  loginDoctor,
  appointmentsDoctor,
  appointmentComplete,
  appointmentCancel,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
};

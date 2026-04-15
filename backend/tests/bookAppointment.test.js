import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";
import bcrypt from "bcrypt";
import request from "supertest";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "test-secret";
process.env.PAYSTACK_SECRET_KEY = "sk_test_xyz";

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: { upload: vi.fn().mockResolvedValue({ secure_url: "x" }) },
  },
}));

const { default: userRouter } = await import("../routes/userRoute.js");
const { default: doctorRouter } = await import("../routes/doctorRoute.js");
const { default: doctorModel } = await import("../models/doctorModel.js");
const { default: userModel } = await import("../models/userModel.js");
const { default: appointmentModel } = await import(
  "../models/appointmentModel.js"
);

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/user", userRouter);
  app.use("/api/doctor", doctorRouter);
  return app;
};

const seedDoctor = async (overrides = {}) =>
  doctorModel.create({
    name: "Dr. Test",
    email: `dr${Date.now()}${Math.random()}@test.com`,
    password: await bcrypt.hash("password1", 10),
    image: "img",
    speciality: "General Physician",
    degree: "MBBS",
    experience: "3 Years",
    about: "test",
    fees: 500,
    address: { line1: "1", line2: "2" },
    date: Date.now(),
    ...overrides,
  });

const seedUser = async () =>
  userModel.create({
    name: "Test User",
    email: `user${Date.now()}${Math.random()}@test.com`,
    password: await bcrypt.hash("password1", 10),
  });

const userToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET);

describe("bookAppointment — race safety", () => {
  let app;
  beforeEach(() => {
    app = buildApp();
  });

  it("only lets one of two concurrent bookings win the same slot", async () => {
    const doctor = await seedDoctor();
    const userA = await seedUser();
    const userB = await seedUser();

    const body = {
      docId: String(doctor._id),
      slotDate: "2030-1-1",
      slotTime: "10:00",
      paymentMethod: "cash",
    };

    const [resA, resB] = await Promise.all([
      request(app)
        .post("/api/user/book-appointment")
        .set("Authorization", `Bearer ${userToken(userA._id)}`)
        .send(body),
      request(app)
        .post("/api/user/book-appointment")
        .set("Authorization", `Bearer ${userToken(userB._id)}`)
        .send(body),
    ]);

    const successes = [resA.body, resB.body].filter((b) => b.success).length;
    expect(successes).toBe(1);

    const appts = await appointmentModel.find({ docId: doctor._id });
    expect(appts).toHaveLength(1);
  });

  it("rejects booking when doctor is unavailable", async () => {
    const doctor = await seedDoctor({ available: false });
    const user = await seedUser();

    const res = await request(app)
      .post("/api/user/book-appointment")
      .set("Authorization", `Bearer ${userToken(user._id)}`)
      .send({
        docId: String(doctor._id),
        slotDate: "2030-1-1",
        slotTime: "10:00",
        paymentMethod: "cash",
      });

    expect(res.body.success).toBe(false);
  });
});

describe("doctor login — regression for inverted-logic bug", () => {
  let app;
  beforeEach(() => {
    app = buildApp();
  });

  it("issues a token on the correct password", async () => {
    const doc = await seedDoctor();
    const res = await request(app)
      .post("/api/doctor/login")
      .send({ email: doc.email, password: "password1" });
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
  });

  it("rejects the wrong password", async () => {
    const doc = await seedDoctor();
    const res = await request(app)
      .post("/api/doctor/login")
      .send({ email: doc.email, password: "wrong-password" });
    expect(res.body.success).toBe(false);
    expect(res.body.token).toBeUndefined();
  });
});

describe("initiatePayment — trust boundary", () => {
  let app;
  beforeEach(() => {
    app = buildApp();
    vi.resetModules();
  });

  it("ignores a client-supplied amount and uses the appointment's stored amount", async () => {
    // Spy on axios.post to intercept the Paystack call.
    const axios = (await import("axios")).default;
    const spy = vi.spyOn(axios, "post").mockResolvedValue({
      data: { data: { authorization_url: "https://paystack/redir" } },
    });

    const doctor = await seedDoctor({ fees: 500 });
    const user = await seedUser();
    const appointment = await appointmentModel.create({
      userId: user._id,
      docId: doctor._id,
      slotDate: "2030-1-1",
      slotTime: "10:00",
      userData: { email: user.email },
      docData: { fees: 500 },
      amount: 500,
      date: Date.now(),
      paymentMethod: "online",
      paymentExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    await request(app)
      .post("/api/user/initiate-payment")
      .set("Authorization", `Bearer ${userToken(user._id)}`)
      .send({ appointmentId: String(appointment._id), amount: 1 });

    // Server must use 500 * 100 (kobo), not 1 * 100.
    const call = spy.mock.calls[0];
    expect(call?.[1]?.amount).toBe(50000);
    spy.mockRestore();
  });
});

describe("expired online bookings — lazy sweep", () => {
  let app;
  beforeEach(() => {
    app = buildApp();
  });

  it("releases the slot so a second user can book it", async () => {
    const { default: sweep } = await import(
      "../utils/sweepExpiredBookings.js"
    );

    const userA = await seedUser();
    const userB = await seedUser();
    const doctor = await seedDoctor({
      slots_booked: { "2030-1-1": ["10:00"] },
    });

    // Create an expired online appointment holding the slot.
    await appointmentModel.create({
      userId: userA._id,
      docId: doctor._id,
      userData: { name: "a" },
      docData: { fees: 500 },
      amount: 500,
      slotDate: "2030-1-1",
      slotTime: "10:00",
      date: Date.now(),
      paymentMethod: "online",
      paymentExpiresAt: new Date(Date.now() - 1000),
    });

    const released = await sweep();
    expect(released).toBe(1);

    const res = await request(app)
      .post("/api/user/book-appointment")
      .set("Authorization", `Bearer ${userToken(userB._id)}`)
      .send({
        docId: String(doctor._id),
        slotDate: "2030-1-1",
        slotTime: "10:00",
        paymentMethod: "cash",
      });
    expect(res.body.success).toBe(true);
  });

  it("does not sweep cash bookings or unexpired online bookings", async () => {
    const { default: sweep } = await import(
      "../utils/sweepExpiredBookings.js"
    );

    const user = await seedUser();
    const doctor = await seedDoctor();

    await appointmentModel.create({
      userId: user._id,
      docId: doctor._id,
      userData: { name: "a" },
      docData: { fees: 500 },
      amount: 500,
      slotDate: "2030-1-1",
      slotTime: "10:00",
      date: Date.now(),
      paymentMethod: "cash",
    });
    await appointmentModel.create({
      userId: user._id,
      docId: doctor._id,
      userData: { name: "b" },
      docData: { fees: 500 },
      amount: 500,
      slotDate: "2030-1-1",
      slotTime: "11:00",
      date: Date.now(),
      paymentMethod: "online",
      paymentExpiresAt: new Date(Date.now() + 60 * 1000),
    });

    const released = await sweep();
    expect(released).toBe(0);
  });
});

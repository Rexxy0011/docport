import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  initiatePayment,
  verifyPayment,
} from "../controllers/userController.js";
import authUser from "../middleware/authUser.js";
import upload from "../middleware/multer.js";
import { authLimiter } from "../middleware/rateLimiters.js";

const userRouter = express.Router();

userRouter.post("/register", authLimiter, registerUser);
userRouter.post("/login", authLimiter, loginUser);
userRouter.post("/get-profile", authUser, getProfile);
userRouter.post("/book-appointment", authUser, bookAppointment);
userRouter.get("/appointments", authUser, listAppointment);
userRouter.post("/cancel-appointment", authUser, cancelAppointment);
userRouter.post("/initiate-payment", authUser, initiatePayment);
userRouter.post("/verify-payment", authUser, verifyPayment);

userRouter.post(
  "/update-profile",
  authUser,
  upload.single("image"),
  updateProfile
);

export default userRouter;

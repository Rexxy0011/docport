import rateLimit from "express-rate-limit";

// Tight limiter for credential endpoints (login, register).
// 10 attempts per IP per 15 minutes.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again later.",
  },
});

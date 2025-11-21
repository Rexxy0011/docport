import jwt from "jsonwebtoken";

// Doctor authentication middleware
const authDoctor = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.json({
        success: false,
        message: "Not Authorized, Login Again",
      });
    }

    // Bearer TOKEN
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.json({
        success: false,
        message: "Not Authorized, Login Again",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!req.body) req.body = {};

    // Attach doctor id
    req.body.docId = decoded.id;

    next();
  } catch (error) {
    console.log("Doctor Auth Error:", error);
    res.json({ success: false, message: error.message });
  }
};

export default authDoctor;

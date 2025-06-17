const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = {
        id: user._id.toString(), // Convert to string for consistent comparison
        email: user.email,
        role: user.role,
      };
      
      next();
    } catch (verifyError) {
      return res.status(401).json({
        message: "Token verification failed",
        error: verifyError.message,
      });
    }
  } catch (error) {
    console.error("Auth middleware: General error:", error);
    res
      .status(401)
      .json({ message: "Please authenticate", error: error.message });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

module.exports = { auth, checkRole };
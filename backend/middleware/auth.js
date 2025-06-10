const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    console.log(
      "Auth middleware: Request headers:",
      JSON.stringify(req.headers)
    );
    const authHeader = req.header("Authorization");
    console.log("Auth middleware: Authorization header:", authHeader);

    if (!authHeader) {
      console.log("Auth middleware: No Authorization header found");
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.replace("Bearer ", "");
    console.log(
      "Auth middleware: Extracted token:",
      token ? "Token present" : "No token"
    );
    console.log(
      "Auth middleware: JWT_SECRET:",
      process.env.JWT_SECRET ? "Secret present" : "No secret"
    );

    if (!token) {
      console.log("Auth middleware: No token found after Bearer removal");
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Auth middleware: Token decoded successfully:", decoded);
      const user = await User.findById(decoded.userId);
      console.log("Auth middleware: User found:", user ? "Yes" : "No");

      if (!user) {
        console.log("Auth middleware: User not found for ID:", decoded.userId);
        return res.status(401).json({ message: "User not found" });
      }

      req.user = {
        id: user._id,
        email: user.email,
        role: user.role,
      };
      console.log("Auth middleware: User attached to request:", req.user);
      next();
    } catch (verifyError) {
      console.error(
        "Auth middleware: Token verification failed:",
        verifyError.message
      );
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

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = (req, res, next) => {
  try {
    // Check for token in cookies first, then fallback to Authorization header
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({ message: "No token provided, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token is not valid" });
  }
};

auth.requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user?.id).select("role");
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Administrator access required" });
    }
    req.admin = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unable to verify administrator" });
  }
};

module.exports = auth;

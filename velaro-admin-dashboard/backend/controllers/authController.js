const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ msg: "User already exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hash
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    // 🍪 Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // true in production
      maxAge: 24 * 60 * 60 * 1000
    });
    
    // Send email
    const emailService = require("../utils/emailService");
    await emailService.sendAccountCreated(user).catch(console.error);

    res.json({ message: "User Registered Successfully", _id: user._id, name: user.name, email: user.email, role: user.role });

  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Wrong password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    // 🍪 Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ message: "Login Successful", _id: user._id, name: user.name, email: user.email, role: user.role });

  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};

// LOGOUT
exports.logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
};

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
    const emailService = require("../utils/emailService");
    await emailService.sendForgotPassword(user.email, resetLink).catch(console.error);
    res.json({ message: "Reset link sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};
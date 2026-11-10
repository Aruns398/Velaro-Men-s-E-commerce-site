const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  name: String,
  email: String,
  phone: String,
  date: String,
  time: String,
  service: String,
  status: { type: String, enum: ["Pending", "Confirmed", "Completed", "Cancelled"], default: "Pending" },
  adminNote: { type: String, maxlength: 1000 }
}, { timestamps: true });

module.exports = mongoose.model("Appointment", appointmentSchema);

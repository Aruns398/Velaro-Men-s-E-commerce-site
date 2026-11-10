const Appointment = require("../models/Appointment");
const { sendAppointmentEmail } = require("../utils/emailService");

exports.createAppointment = async (req, res) => {
  try {
    const data = await Appointment.create(req.body);

    // Send automated appointment booking receipt to client
    sendAppointmentEmail({
      appointment: data,
      status: data.status || "Pending"
    }).catch((emailErr) => {
      console.error("[Email Notification Error - Appointment Booked]:", emailErr.message);
    });

    res.json({ message: "Appointment Booked", data });
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.getAppointments = async (req, res) => {
  const data = await Appointment.find();
  res.json(data);
};
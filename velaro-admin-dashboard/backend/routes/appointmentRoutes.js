const router = require("express").Router();
const { createAppointment, getAppointments } = require("../controllers/appointmentController");
const auth = require("../middleware/authmiddleware");

router.post("/", createAppointment);
router.get("/", auth, auth.requireAdmin, getAppointments);

module.exports = router;

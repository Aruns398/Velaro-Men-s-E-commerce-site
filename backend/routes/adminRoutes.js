const router = require("express").Router();
const auth = require("../middleware/authmiddleware");
const admin = require("../controllers/adminController");

router.use(auth, auth.requireAdmin);
router.get("/me", admin.adminProfile);
router.get("/dashboard", admin.overview);
router.get("/analytics", admin.analytics);
router.get("/orders", admin.listOrders);
router.patch("/orders/:orderId", admin.updateOrder);
router.get("/customers", admin.listCustomers);
router.get("/appointments", admin.listAppointments);
router.patch("/appointments/:id", admin.updateAppointment);

module.exports = router;

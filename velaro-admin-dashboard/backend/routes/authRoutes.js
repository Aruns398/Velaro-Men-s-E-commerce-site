const router = require("express").Router();
const { register, login, logout, forgotPassword } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);

module.exports = router;
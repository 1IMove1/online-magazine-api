const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const upload = require("../middleware/upload");

router.post("/register", upload.single("avatar"), authController.register);
router.get("/confirm", authController.confirm);
router.post("/login", authController.login);
router.post("/resend-confirmation", authController.resendConfirmation);

module.exports = router;

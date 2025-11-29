const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const transporter = require("../config/mailer");
const { registerSchema, loginSchema } = require("../validations/auth");
const { confirmationEmail } = require("../utils/emailTemplates");
const { secret, expiresIn } = require("../config/jwt");
const crypto = require("crypto");
const dns = require("dns").promises;

module.exports = {
  register: async (req, res) => {
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, email, password } = req.body;
    try {
      const domain = email.split("@")[1];
      if (!domain) return res.status(400).json({ error: "Invalid email" });
      const mx = await dns.resolveMx(domain).catch(() => []);
      if (!mx || mx.length === 0) return res.status(400).json({ error: "Email domain does not accept mail" });
      if (await User.findOne({ email })) return res.status(409).json({ error: "Email already registered" });
      const hashed = await bcrypt.hash(password, 10);
      const confirmationToken = crypto.randomBytes(32).toString("hex");
      let avatar = req.file ? `/uploads/avatars/${req.file.filename}` : undefined;
      const user = await User.create({
        name,
        email,
        password: hashed,
        avatar,
        confirmationToken,
      });
      try {
        await transporter.sendMail({
          to: user.email,
          subject: "Confirm your email",
          html: confirmationEmail(user.name, confirmationToken),
        });
        res.status(201).json({ message: "Registration successful. Please check your email to confirm." });
      } catch (mailErr) {
        console.error("Email send error (registration):", mailErr);
        res.status(201).json({ message: "Registration successful, but confirmation email failed to send. Contact admin or try resending confirmation." });
      }
    } catch (err) {
      console.error("Registration error:", err);
      res.status(500).json({ error: "Registration failed" });
    }
  },

  confirm: async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Missing token" });
    try {
      const user = await User.findOne({ confirmationToken: token });
      if (!user) return res.status(400).json({ error: "Invalid or expired token" });
      user.isConfirmed = true;
      user.confirmationToken = undefined;
      await user.save();
      res.json({ message: "Email confirmed. You can now log in." });
    } catch (err) {
      console.error("Confirmation error:", err);
      res.status(500).json({ error: "Confirmation failed" });
    }
  },

  login: async (req, res) => {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ error: "Invalid credentials" });
      if (!user.isConfirmed) return res.status(403).json({ error: "Email not confirmed" });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: "Invalid credentials" });
      const token = jwt.sign({ id: user._id }, secret, { expiresIn });
      res.json({token});
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Login failed" });
    }
  },
  resendConfirmation: async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.isConfirmed) return res.status(400).json({ error: "Already confirmed" });
      const token = user.confirmationToken || crypto.randomBytes(32).toString("hex");
      user.confirmationToken = token;
      await user.save();
      try {
        await transporter.sendMail({
          to: user.email,
          subject: "Confirm your email",
          html: confirmationEmail(user.name, token),
        });
        res.json({ message: "Confirmation email sent" });
      } catch (mailErr) {
        console.error("Email send error (resend):", mailErr);
        res.status(500).json({ error: "Failed to send confirmation email" });
      }
    } catch (err) {
      console.error("Resend error:", err);
      res.status(500).json({ error: "Resend failed" });
    }
  },
};

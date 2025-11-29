const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 2 },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: String,
    isConfirmed: { type: Boolean, default: false },
    confirmationToken: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);

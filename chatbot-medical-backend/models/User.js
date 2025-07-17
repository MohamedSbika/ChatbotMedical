const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    match: [/^[A-Za-zÀ-ÿ\s]+$/, "Le prénom ne doit contenir que des lettres"],
  },
  familyName: {
    type: String,
    required: true,
    match: [/^[A-Za-zÀ-ÿ\s]+$/, "Le nom ne doit contenir que des lettres"],
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Email invalide"],
  },
  password: {
    type: String,
    required: true,
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;

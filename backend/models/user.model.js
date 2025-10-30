const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  date: { type: Date, default: Date.now },
  text: { type: String, required: true }
});

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  resumes: [ResumeSchema]
});

module.exports = mongoose.model("User", UserSchema);
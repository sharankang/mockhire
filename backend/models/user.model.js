const mongoose = require("mongoose");

const SimulationSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  chatHistory: [
    {
      role: String,
      content: String
    }
  ],
  feedback: { type: String, required: true }
});

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
  resumes: [ResumeSchema],
  simulations: [SimulationSchema]
});

module.exports = mongoose.model("User", UserSchema);
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const User = require("../models/user.model");


router.use(authMiddleware);


router.post("/save", async (req, res) => {
  const { chatHistory, feedback } = req.body;
  if (!chatHistory || !feedback) {
    return res.status(400).json({ msg: "Missing chat history or feedback" });
  }

  try {
    const user = await User.findById(req.user.id);

    const newSimulation = {
      chatHistory: chatHistory,
      feedback: feedback
    };

    user.simulations.push(newSimulation);
    await user.save();

    res.status(201).json({ msg: "Simulation saved" });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


router.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("simulations");
    const sortedSimulations = user.simulations.sort((a, b) => b.date - a.date);
    res.json(sortedSimulations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
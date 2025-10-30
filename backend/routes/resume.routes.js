const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const User = require("../models/user.model");


router.use(authMiddleware);


router.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("resumes");
    res.json(user.resumes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


router.post("/upload", async (req, res) => {
  const { filename, text } = req.body;
  if (!filename || !text) {
    return res.status(400).json({ msg: "Filename and text are required" });
  }

  try {
    const user = await User.findById(req.user.id);

    const newResume = {
      filename: filename,
      text: text
    };

    user.resumes.push(newResume);
    await user.save();


    res.status(201).json(user.resumes[user.resumes.length - 1]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.resumes.pull({ _id: req.params.id });

    await user.save();
    res.json({ msg: "Resume deleted" });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const User = require("../models/user.model");


const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


router.use(authMiddleware);


router.post("/questions", async (req, res) => {
  const { jdText } = req.body;
  if (!jdText) {
    return res.status(400).json({ msg: "Job description text is required" });
  }

  const prompt = `
  You are an interview coach. Based on this job description:
  ${jdText}
  Generate 8-10 structured interview questions in markdown format, grouped into:
  - Technical Questions
  - Behavioral Questions
  - Situational / Problem-solving Questions
  `;

  try {
    const result = await model.generateContent(prompt);
    const output = (await result.response.text()).trim();
    res.json({ markdown: output });
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).send("Error generating questions.");
  }
});


router.post("/evaluate", async (req, res) => {
  const { jdText, resumeId } = req.body;

  try {
    const user = await User.findById(req.user.id);
    const resume = user.resumes.id(resumeId);

    if (!resume) {
      return res.status(404).json({ msg: "Resume not found" });
    }
    const resumeText = resume.text;

    const prompt = `
    You are an ATS evaluator. Compare this resume against this job description.
    Provide feedback in markdown... (rest of your prompt from jd.js)

    Resume:
    ${resumeText}

    Job description:
    ${jdText}
    `;

    const result = await model.generateContent(prompt);
    const output = (await result.response.text()).trim();
    res.json({ markdown: output });

  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).send("Error evaluating resume.");
  }
});


router.post("/interview/next", async (req, res) => {
  const { jdContext, chatHistory, lastAnswer } = req.body;

  const prompt = `
  You are an interviewer. Based on the job description:
  ${jdContext}
  
  The candidate's previous answer was: "${lastAnswer}"

  Here is the chat history so far:
  ${chatHistory.map(h => `${h.role}: ${h.content}`).join("\n")}
  
  Ask the next realistic interview question (short and natural). Do not repeat questions.
  `;

  try {
    const result = await model.generateContent(prompt);
    const nextQuestion = (await result.response.text()).trim();
    res.json({ question: nextQuestion });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ msg: "Sorry, I had trouble generating the next question." });
  }
});


router.post("/interview/feedback", async (req, res) => {
  const { jdContext, chatHistory } = req.body;

  const prompt = `
  You are an interview coach. Based on this interview simulation:

  Job Description: ${jdContext}
  Interview Transcript:
  ${chatHistory.map(h => `${h.role}: ${h.content}`).join("\n")}

  Provide feedback in this structured markdown format:

  ### Strengths
  - bullet points

  ### Weaknesses
  - bullet points

  ### Suggestions
  - bullet points

  ### Final Score
  - Score: XX/100
  `;

  try {
    const result = await model.generateContent(prompt);
    const feedback = (await result.response.text()).trim();
    res.json({ feedback: feedback });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ msg: "Error generating feedback." });
  }
});

module.exports = router;
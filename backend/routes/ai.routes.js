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
You are a strict ATS (Applicant Tracking System) evaluator. Compare the resume against the job description and return your evaluation in EXACTLY the following markdown format. Do not deviate from this structure.

---

## ATS Evaluation: [Candidate Name] vs. [Job Title]

**Overall ATS Score: [X]/100**

[One short paragraph summarizing the overall match.]

---

## Strengths
- [Strength 1]
- [Strength 2]
- [Strength 3]

## Areas for Improvement
- [Gap 1]
- [Gap 2]
- [Gap 3]

## Keyword & Skill Alignment

| Skill/Keyword | Job Description Match | Resume Presence | Score | Notes |
|---|---|---|---|---|
| [Skill 1] | High/Medium/Low | High/Medium/Low/Missing | [X]/5 | [Brief note] |
| [Skill 2] | High/Medium/Low | High/Medium/Low/Missing | [X]/5 | [Brief note] |

## Recommendations
- [Specific actionable suggestion 1]
- [Specific actionable suggestion 2]
- [Specific actionable suggestion 3]

---

STRICT RULES:
- The Overall ATS Score MUST always be out of 100. Never use /5, /10, percentages, or vague labels like "high match".
- Each row in the Keyword table MUST have a score out of 5.
- Always use the exact section headers shown above.
- Be specific and honest. Do not pad the evaluation.

Resume:
${resumeText}

Job Description:
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
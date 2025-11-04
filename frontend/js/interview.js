function getToken() {
  return localStorage.getItem("mockhireToken");
}

if (!getToken()) {
  alert("You must log in first.");
  window.location.href = "login.html";
}

let jdContext = "";
let chatHistory = [];
let questionCount = 0;
let maxQuestions = 4;
let videoStream = null;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synthesis = window.speechSynthesis;
let recognition = null;
let isListening = false;

if (!SpeechRecognition) {
  console.warn("Speech recognition not supported by this browser.");
} else {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
}

if (!synthesis) {
  console.warn("Speech synthesis not supported by this browser.");
}

const jdForm = document.getElementById("jdForm");
const jdSubtitle = document.getElementById("jdSubtitle");

const interviewChoice = document.getElementById("interviewChoice");
const startTextBtn = document.getElementById("startTextBtn");
const startVideoBtn = document.getElementById("startVideoBtn");

const chatContainer = document.getElementById("chat-container");
const chatBox = document.getElementById("chat-box");
const userAnswerInput = document.getElementById("userAnswer");
const sendBtn = document.getElementById("sendAnswer");

const videoContainer = document.getElementById("videoContainer");
const videoStatus = document.getElementById("videoStatus");
const userVideo = document.getElementById("userVideo");
const aiQuestionText = document.getElementById("aiQuestionText");

const finalScoreEl = document.getElementById("finalScore");


jdForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = document.getElementById("jdFile").files[0];
  jdContext = document.getElementById("jdText").value.trim();

  if (file) {
    jdForm.querySelector('.btn-primary').textContent = "Reading PDF...";
    jdContext = await extractTextFromPDF(file);
  }

  if (!jdContext) {
    alert("Please upload or paste a job description first.");
    return;
  }

  jdSubtitle.style.display = "none";
  jdForm.style.display = "none";
  interviewChoice.style.display = "block";
});

startTextBtn.addEventListener("click", () => {
  interviewChoice.style.display = "none";
  chatContainer.style.display = "block";
  startTextSimulation();
});

startVideoBtn.addEventListener("click", () => {
  if (!recognition || !synthesis) {
    alert("Your browser doesn't support the Speech API. Please use Chrome or Edge. Starting text interview instead.");
    startTextBtn.click();
    return;
  }
  interviewChoice.style.display = "none";
  startVideoSimulation();
});


function startTextSimulation() {
  const firstQuestion = "Let's start your interview! First question: <em>Tell me about yourself.</em>";
  chatBox.innerHTML = "";
  appendMessage("AI", firstQuestion);
  chatHistory.push({ role: "AI", content: firstQuestion });
}

sendBtn.addEventListener("click", async () => {
  const answer = userAnswerInput.value.trim();
  if (!answer) return;

  appendMessage("You", answer);
  chatHistory.push({ role: "You", content: answer });
  userAnswerInput.value = "";
  sendBtn.disabled = true;

  questionCount++;

  if (questionCount >= maxQuestions) {
    await giveFinalFeedback();
    return;
  }

  try {
    const nextQuestion = await getNextAiQuestion(answer);
    chatBox.innerHTML = "";
    appendMessage("AI", nextQuestion);
    chatHistory.push({ role: "AI", content: nextQuestion });
  } catch (err) {
    chatBox.innerHTML = "";
    appendMessage("AI", "Sorry, I had trouble generating the next question.");
  }
  sendBtn.disabled = false;
  userAnswerInput.focus();
});


async function startVideoSimulation() {
  videoContainer.style.display = "block";
  videoStatus.textContent = "Requesting camera access...";
  
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    userVideo.srcObject = videoStream;
    userVideo.play();
  } catch (err) {
    console.error("Camera access denied:", err);
    videoStatus.textContent = "Camera access denied. Please refresh and allow access.";
    return;
  }
  
  recognition.onresult = (event) => {
    const answer = event.results[0][0].transcript;
    console.log("User said:", answer);
    isListening = false;
    recognition.stop();
    handleVideoAnswer(answer);
  };
  
  recognition.onend = () => {
    if (isListening) {
      // User just stopped talking, but maybe they're gonna continue?
      // Could restart it, but let's just stop for now
      isListening = false;
      videoStatus.textContent = "Stopped listening.";
    }
  };
  
  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    isListening = false;
    videoStatus.textContent = "Error listening. Please try again.";
  };

  const firstQuestion = "Let's start your interview! First question: Tell me about yourself.";
  chatHistory.push({ role: "AI", content: firstQuestion });
  askVideoQuestion(firstQuestion);
}

function askVideoQuestion(questionText) {
  aiQuestionText.textContent = questionText;
  videoStatus.textContent = "AI is asking a question...";
  
  const utterance = new SpeechSynthesisUtterance(questionText);
  
  utterance.onend = () => {
    videoStatus.textContent = "Listening for your answer...";
    isListening = true;
    recognition.start();
  };
  
  synthesis.speak(utterance);
}

async function handleVideoAnswer(answer) {
  videoStatus.textContent = "AI is thinking...";
  aiQuestionText.textContent = `You said: "${answer}"`; 
  chatHistory.push({ role: "You", content: answer });
  questionCount++;

  if (questionCount >= maxQuestions) {
    await giveFinalFeedback();
    return;
  }
  
  try {
    const nextQuestion = await getNextAiQuestion(answer);
    chatHistory.push({ role: "AI", content: nextQuestion });
    
    setTimeout(() => {
      askVideoQuestion(nextQuestion);
    }, 1500);

  } catch (err) {
    askVideoQuestion("Sorry, I had an error. Let's try that again.");
  }
}

async function getNextAiQuestion(lastAnswer) {
  const res = await fetch("https://mockhire-backend.onrender.com/api/ai/interview/next", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getToken()}`
    },
    body: JSON.stringify({
      jdContext,
      chatHistory,
      lastAnswer: lastAnswer
    })
  });

  if (!res.ok) {
    throw new Error("API Error");
  }
  
  const data = await res.json();
  return data.question;
}

async function giveFinalFeedback() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    userVideo.srcObject = null;
  }
  if (isListening) {
    recognition.stop();
  }
  synthesis.cancel(); 

  chatContainer.style.display = "none";
  videoContainer.style.display = "none";
  
  finalScoreEl.style.display = "block";
  finalScoreEl.textContent = "Generating feedback...";
  
  let feedbackMarkdown = ""; 

  try {
    const res = await fetch("https://mockhire-backend.onrender.com/api/ai/interview/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
      },
      body: JSON.stringify({ jdContext, chatHistory })
    });

    if (!res.ok) throw new Error("API Error getting feedback");

    const data = await res.json();
    feedbackMarkdown = data.feedback; 
    finalScoreEl.innerHTML = marked.parse(feedbackMarkdown);

    const feedbackSummary = "Great job, your feedback is ready. You can review the full report on screen.";
    const utterance = new SpeechSynthesisUtterance(feedbackSummary);
    synthesis.speak(utterance);

  } catch (err) {
    console.error("Error:", err);
    finalScoreEl.textContent = "Error generating feedback.";
    return;
  }

  try {
    await fetch("https://mockhire-backend.onrender.com/api/simulations/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
      },
      body: JSON.stringify({ 
        chatHistory: chatHistory,
        feedback: feedbackMarkdown
      })
    });
    console.log("Simulation saved successfully.");
  } catch (err) {
    console.error("Error saving simulation:", err);
  }
}

function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("chat-message");
  msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function extractTextFromPDF(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async function() {
      try {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map(item => item.str);
          text += strings.join(" ") + "\n";
        }
        resolve(text);
      } catch (e) {
        console.error("PDF read error:", e);
        resolve(null);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
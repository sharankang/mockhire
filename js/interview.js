// --- Helper function & Auth (No change) ---
function getToken() {
  return localStorage.getItem("mockhireToken");
}

if (!getToken()) {
  alert("You must log in first.");
  window.location.href = "login.html";
}

// --- Global Variables ---
let jdContext = "";
let chatHistory = []; // Always stores the full transcript for the backend
let questionCount = 0;
let maxQuestions = 1;
let videoStream = null; // To hold the user's camera stream

// --- NEW: Speech API Setup ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synthesis = window.speechSynthesis;
let recognition = null;
let isListening = false;

if (!SpeechRecognition) {
  console.warn("Speech recognition not supported by this browser.");
} else {
  recognition = new SpeechRecognition();
  recognition.continuous = false; // Stop listening after one phrase
  recognition.interimResults = false; // Get final result
}

if (!synthesis) {
  console.warn("Speech synthesis not supported by this browser.");
}

// --- Get All DOM Elements ---
const jdForm = document.getElementById("jdForm");
const jdSubtitle = document.getElementById("jdSubtitle");

// Interview Choice
const interviewChoice = document.getElementById("interviewChoice");
const startTextBtn = document.getElementById("startTextBtn");
const startVideoBtn = document.getElementById("startVideoBtn");

// Text Chat
const chatContainer = document.getElementById("chat-container");
const chatBox = document.getElementById("chat-box");
const userAnswerInput = document.getElementById("userAnswer");
const sendBtn = document.getElementById("sendAnswer");

// Video Chat
const videoContainer = document.getElementById("videoContainer");
const videoStatus = document.getElementById("videoStatus");
const userVideo = document.getElementById("userVideo");
const aiQuestionText = document.getElementById("aiQuestionText");

// Final Score
const finalScoreEl = document.getElementById("finalScore");


// --- 1. JD Form Submission (UPDATED) ---
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

  // Hide the form and show the choice buttons
  jdSubtitle.style.display = "none";
  jdForm.style.display = "none";
  interviewChoice.style.display = "block";
});

// --- 2. Start Interview (Choice Buttons) ---
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


// --- 3. TEXT SIMULATION (No major changes) ---
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
    await giveFinalFeedback(); // This is the shared feedback function
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


// --- 4. NEW: VIDEO SIMULATION ---
async function startVideoSimulation() {
  videoContainer.style.display = "block";
  videoStatus.textContent = "Requesting camera access...";
  
  try {
    // Get camera and mic
    videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    userVideo.srcObject = videoStream;
    userVideo.play(); // Ensure video plays
  } catch (err) {
    console.error("Camera access denied:", err);
    videoStatus.textContent = "Camera access denied. Please refresh and allow access.";
    return;
  }
  
  // Setup Speech Recognition Listeners
  recognition.onresult = (event) => {
    const answer = event.results[0][0].transcript;
    console.log("User said:", answer);
    isListening = false;
    recognition.stop();
    handleVideoAnswer(answer);
  };
  
  recognition.onend = () => {
    if (isListening) {
      // User just stopped talking, but maybe not on purpose
      // You could restart it, but for a simple case, we'll just stop
      isListening = false;
      videoStatus.textContent = "Stopped listening.";
    }
  };
  
  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    isListening = false;
    videoStatus.textContent = "Error listening. Please try again.";
  };

  // Start the interview
  const firstQuestion = "Let's start your interview! First question: Tell me about yourself.";
  chatHistory.push({ role: "AI", content: firstQuestion });
  askVideoQuestion(firstQuestion);
}

function askVideoQuestion(questionText) {
  aiQuestionText.textContent = questionText;
  videoStatus.textContent = "AI is asking a question...";
  
  // Speak the question
  const utterance = new SpeechSynthesisUtterance(questionText);
  
  // When the AI finishes speaking, start listening
  utterance.onend = () => {
    videoStatus.textContent = "Listening for your answer...";
    isListening = true;
    recognition.start();
  };
  
  synthesis.speak(utterance);
}

async function handleVideoAnswer(answer) {
  videoStatus.textContent = "AI is thinking...";
  aiQuestionText.textContent = `You said: "${answer}"`; // Show user what was heard
  
  // Log answer
  chatHistory.push({ role: "You", content: answer });
  questionCount++;

  if (questionCount >= maxQuestions) {
    await giveFinalFeedback(); // Call shared feedback function
    return;
  }
  
  // Get next question
  try {
    const nextQuestion = await getNextAiQuestion(answer);
    chatHistory.push({ role: "AI", content: nextQuestion });
    
    // Wait a moment before asking
    setTimeout(() => {
      askVideoQuestion(nextQuestion);
    }, 1500); // 1.5 second pause

  } catch (err) {
    askVideoQuestion("Sorry, I had an error. Let's try that again.");
  }
}

// --- 5. SHARED BACKEND LOGIC ---

// NEW: Refactored network call
async function getNextAiQuestion(lastAnswer) {
  const res = await fetch("http://localhost:5000/api/ai/interview/next", {
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
  return data.question; // Returns the next question string
}

// UPDATED: This function is now shared by both modes
async function giveFinalFeedback() {
  // Stop all media
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    userVideo.srcObject = null;
  }
  if (isListening) {
    recognition.stop();
  }
  synthesis.cancel(); // Stop any speaking

  // Hide all interview UI
  chatContainer.style.display = "none";
  videoContainer.style.display = "none";
  
  // Show and populate final score
  finalScoreEl.style.display = "block";
  finalScoreEl.textContent = "Generating feedback...";
  
  let feedbackMarkdown = ""; 

  try {
    // 1. Get feedback from the AI
    const res = await fetch("http://localhost:5000/api/ai/interview/feedback", {
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

    // NEW: Speak a summary of the feedback
    const feedbackSummary = "Great job, your feedback is ready. You can review the full report on screen.";
    const utterance = new SpeechSynthesisUtterance(feedbackSummary);
    synthesis.speak(utterance);

  } catch (err) {
    console.error("Error:", err);
    finalScoreEl.textContent = "Error generating feedback.";
    return;
  }

  // 2. Save the simulation (shared)
  try {
    await fetch("http://localhost:5000/api/simulations/save", {
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

// --- SHARED HELPER FUNCTIONS (No change) ---
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
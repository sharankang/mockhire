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
let maxQuestions = 5;

const jdForm = document.getElementById("jdForm");
const chatContainer = document.getElementById("chat-container");
const chatBox = document.getElementById("chat-box");
const userAnswerInput = document.getElementById("userAnswer");
const sendBtn = document.getElementById("sendAnswer");
const finalScoreEl = document.getElementById("finalScore");

jdForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = document.getElementById("jdFile").files[0];
  jdContext = document.getElementById("jdText").value.trim();

  if (file) {
    chatBox.textContent = "Reading PDF...";
    jdContext = await extractTextFromPDF(file);
  }

  if (!jdContext) {
    alert("Please upload or paste a job description first.");
    return;
  }
  const jdSubtitle = document.getElementById("jdSubtitle");
  if (jdSubtitle) {
      jdSubtitle.style.display = "none"; 
  }
  jdForm.style.display = "none";
  chatContainer.style.display = "block";
  startSimulation();
});

function startSimulation() {
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
    const res = await fetch("http://localhost:5000/api/ai/interview/next", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        jdContext,
        chatHistory,
        lastAnswer: answer
      })
    });

    if (!res.ok) throw new Error("API Error");

    const data = await res.json();

    chatBox.innerHTML = ""; 

    appendMessage("AI", data.question);

    chatHistory.push({ role: "AI", content: data.question });

  } catch (err) {
    console.error("Error:", err);

    chatBox.innerHTML = "";
    appendMessage("AI", "Sorry, I had trouble generating the next question.");
  }

  sendBtn.disabled = false;
  userAnswerInput.focus();
});

async function giveFinalFeedback() {
  appendMessage("AI", "Great job! That's the end of the simulation. Generating your feedback...");

  setTimeout(async () => {
    chatContainer.style.display = "none";
    finalScoreEl.style.display = "block";
    finalScoreEl.textContent = "Generating feedback...";

    try {
      const res = await fetch("http://localhost:5000/api/ai/interview/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({ jdContext, chatHistory })
      });

      if (!res.ok) throw new Error("API Error");

      const data = await res.json();
      finalScoreEl.innerHTML = marked.parse(data.feedback);

    } catch (err) {
      console.error("Error:", err);
      finalScoreEl.textContent = "Error generating feedback.";
    }
  }, 2000);
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
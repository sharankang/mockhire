function getToken() {
  return localStorage.getItem("mockhireToken");
}

if (!getToken()) {
  alert("You must log in first.");
  window.location.href = "login.html";
}

document.getElementById("questionForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  const file = document.getElementById("jdFile").files[0];
  let jdText = document.getElementById("jdText").value.trim();
  const resultEl = document.getElementById("result");

  if (file) {
    resultEl.textContent = "📄 Reading JD PDF...";
    jdText = await extractTextFromPDF(file);
  }

  if (!jdText) {
    resultEl.textContent = "Please upload JD PDF or paste text!";
    return;
  }

  resultEl.textContent = "Generating questions with AI...";

  try {
    const res = await fetch("http://localhost:5000/api/ai/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
      },
      body: JSON.stringify({ jdText })
    });

    if (!res.ok) {
      throw new Error("Failed to generate questions");
    }

    const data = await res.json();

    resultEl.innerHTML = `
      <h2 class="suggestions-title">Suggested Interview Questions</h2>
      <div class="suggestions-text">${marked.parse(data.markdown)}</div>
    `;
  } catch (err) {
    console.error("Error:", err);
    resultEl.textContent = "Error generating questions.";
  }
});

async function extractTextFromPDF(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async function() {
      try {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        let text = "";
        for(let i=1; i<=pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map(item => item.str);
          text += strings.join(" ") + "\n";
        }
        resolve(text.trim());
      } catch(e) {
        console.error("PDF read error:", e);
        resolve(null);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

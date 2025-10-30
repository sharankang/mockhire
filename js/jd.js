if (!localStorage.getItem("mockhireToken")) {
  alert("You must log in first.");
  window.location.href = "index.html";
}

const urlParams = new URLSearchParams(window.location.search);
const resumeId = urlParams.get("resumeId");

if (!resumeId) {
  alert("No resume selected. Please upload from the ATS page first.");
  window.location.href = "ats.html";
}

document.getElementById("jdForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const file = document.getElementById("jdFile").files[0];
  let jdText = document.getElementById("jdText").value.trim();
  const resultEl = document.getElementById("result");

  if (file) {
    resultEl.textContent = "Reading JD PDF...";
    jdText = await extractTextFromPDF(file);
  }

  if (!jdText) {
    resultEl.textContent = "Please upload JD PDF or paste text.";
    return;
  }

  const resumeText = localStorage.getItem("resumeText");
  if (!resumeText) {
    resultEl.textContent = "Resume not found. Please upload resume again.";
    return;
  }

  resultEl.textContent = "Evaluating with AI...";
try {
    const res = await fetch("http://localhost:5000/api/ai/evaluate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("mockhireToken")}`
      },
      body: JSON.stringify({ jdText, resumeId })
    });

    if (!res.ok) throw new Error("Evaluation failed");

    const data = await res.json();
    resultEl.innerHTML = marked.parse(data.markdown);
  } catch (err) {
    console.error("Error:", err);
    resultEl.textContent = "Error evaluating resume.";
  }
});

async function extractTextFromPDF(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async function () {
      try {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item) => item.str);
          text += strings.join(" ") + "\n";
        }
        resolve(text.trim());
      } catch (e) {
        console.error("PDF read error:", e);
        resolve(null);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

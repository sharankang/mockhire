function getToken() {
  return localStorage.getItem("mockhireToken");
}

if (!getToken()) {
  alert("You must log in first.");
  window.location.href = "login.html";
}

document.getElementById("resumeForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  const fileInput = document.getElementById("resumeFile");
  const resultEl = document.getElementById("validationResult");

  if (fileInput.files.length === 0) {
    resultEl.textContent = "Please select a PDF file!";
    return;
  }

  const file = fileInput.files[0];
  resultEl.textContent = "Reading PDF...";
  const text = await extractTextFromPDF(file);

  if (!text) {
    resultEl.textContent = "Could not read PDF.";
    return;
  }


  try {
    resultEl.textContent = "Uploading resume to profile...";

    const res = await fetch("http://localhost:5000/api/resumes/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
      },
      body: JSON.stringify({ filename: file.name, text: text })
    });

    if (!res.ok) {
      throw new Error("Failed to upload resume");
    }

    const newResume = await res.json(); 
    window.location.href = `jd.html?resumeId=${newResume._id}`;

  } catch (err) {
    console.error(err);
    resultEl.textContent = "Error uploading resume.";
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
        console.error(e);
        resolve(null);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

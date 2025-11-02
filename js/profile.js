function getToken() {
  return localStorage.getItem("mockhireToken");
}

if (!getToken()) {
  alert("You must log in first.");
  window.location.href = "login.html";
}


let allResumes = [];
let allSimulations = [];

document.addEventListener("DOMContentLoaded", async () => {
  const resumeListEl = document.getElementById("resumeList");
  const simListEl = document.getElementById("simulationList");
  
  const token = getToken();


  const modal = document.getElementById("viewModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  const closeModal = document.querySelector(".close-btn");


  try {
    const res = await fetch("http://localhost:5000/api/resumes", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Could not fetch resumes");
    
    allResumes = await res.json();
    renderResumes(allResumes, resumeListEl);

  } catch (err) {
    console.error(err);
    resumeListEl.textContent = "Error loading resumes.";
  }
  

  try {
    const res = await fetch("http://localhost:5000/api/simulations", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Could not fetch simulations");
    
    allSimulations = await res.json();
    renderSimulations(allSimulations, simListEl);

  } catch (err) {
    console.error(err);
    simListEl.textContent = "Error loading simulations.";
  }


  closeModal.onclick = () => modal.style.display = "none";
  window.onclick = (e) => {
    if (e.target == modal) modal.style.display = "none";
  };
});


function renderResumes(resumes, listEl) {
  if (resumes.length === 0) {
    listEl.textContent = "You haven’t uploaded any resumes yet.";
    return;
  }

  const ul = document.createElement("ul");
  resumes.forEach((resume) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${resume.filename}</strong> 
      <small>(${new Date(resume.date).toLocaleString()})</small>
      <button data-id="${resume._id}" class="view-btn view-resume">View</button>
      <button data-id="${resume._id}" class="delete-btn delete-resume">Delete</button>
    `;
    ul.appendChild(li);
  });
  listEl.innerHTML = '';
  listEl.appendChild(ul);

  listEl.addEventListener("click", (e) => {
    const id = e.target.getAttribute("data-id");
    
    if (e.target.classList.contains("view-resume")) {
      const resume = allResumes.find(r => r._id === id);
      if (resume) showResumeModal(resume);
    }
    
    if (e.target.classList.contains("delete-resume")) {
      if (confirm("Are you sure you want to delete this resume?")) {
        deleteResume(id);
      }
    }
  });
}


function renderSimulations(simulations, listEl) {
  if (simulations.length === 0) {
    listEl.textContent = "You haven't completed any simulations yet.";
    return;
  }

  const ul = document.createElement("ul");
  simulations.forEach((sim) => {
    const li = document.createElement("li");
    const simDate = new Date(sim.date).toLocaleString();
    li.innerHTML = `
      <strong>Simulation</strong> 
      <small>(${simDate})</small>
      <button data-id="${sim._id}" class="view-btn view-simulation">View</button>
    `;
    ul.appendChild(li);
  });
  listEl.innerHTML = '';
  listEl.appendChild(ul);


  listEl.addEventListener("click", (e) => {
    if (e.target.classList.contains("view-simulation")) {
      const id = e.target.getAttribute("data-id");
      const sim = allSimulations.find(s => s._id === id);
      if (sim) showSimulationModal(sim);
    }
  });
}


function showResumeModal(resume) {
  document.getElementById("modalTitle").textContent = resume.filename;

  document.getElementById("modalBody").innerHTML = `<pre>${resume.text}</pre>`;
  document.getElementById("viewModal").style.display = "block";
}

function showSimulationModal(sim) {
  document.getElementById("modalTitle").textContent = `Simulation - ${new Date(sim.date).toLocaleString()}`;
  

  const transcript = sim.chatHistory.map(msg => {

    const content = msg.content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<div><strong>${msg.role}:</strong> <div style="margin-left: 10px;">${content}</div></div>`;
  }).join('<br>');
  

  const feedback = `
    <hr style="margin: 20px 0;">
    <h3>Final Feedback</h3>
    ${marked.parse(sim.feedback)}
  `;

  document.getElementById("modalBody").innerHTML = transcript + feedback;
  document.getElementById("viewModal").style.display = "block";
}


async function deleteResume(id) {
  try {
    const res = await fetch(`http://localhost:5000/api/resumes/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error("Failed to delete");
    location.reload();
  } catch (err) {
    console.error(err);
    alert("Could not delete resume.");
  }
}
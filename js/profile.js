function getToken() {
  return localStorage.getItem("mockhireToken");
}

if (!getToken()) {
  alert("You must log in first.");
  window.location.href = "login.html";
}

let resumeData = [];

document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("resumeList");
  
  const modal = document.getElementById("resumeModal");
  const modalText = document.getElementById("modalResumeText");
  const closeModal = document.querySelector(".close-btn");

  try {
    const res = await fetch("http://localhost:5000/api/resumes", {
      headers: { "Authorization": `Bearer ${getToken()}` }
    });
    
    if (!res.ok) throw new Error("Could not fetch resumes");
    
    resumeData = await res.json(); 

    if (resumeData.length === 0) {
      listEl.textContent = "You haven’t uploaded any resumes yet.";
      return;
    }

    const ul = document.createElement("ul");
    resumeData.forEach((resume) => {
      const li = document.createElement("li");
      
      li.innerHTML = `
        <strong>${resume.filename}</strong> 
        <small>(${new Date(resume.date).toLocaleString()})</small>
        <button data-id="${resume._id}" class="view-btn">View</button>
        <button data-id="${resume._id}" class="delete-btn">Delete</button>
      `;
      ul.appendChild(li);
    });
    listEl.innerHTML = '';
    listEl.appendChild(ul);

  } catch (err) {
    console.error(err);
    listEl.textContent = "Error loading resumes.";
  }

  listEl.addEventListener("click", (e) => {
    const id = e.target.getAttribute("data-id");
    
    if (e.target.classList.contains("view-btn")) {
      const resume = resumeData.find(r => r._id === id);
      if (resume) {
        modalText.textContent = resume.text; 
        modal.style.display = "block";
      }
    }
    
    if (e.target.classList.contains("delete-btn")) {
      if (confirm("Are you sure you want to delete this resume?")) {
        deleteResume(id);
      }
    }
  });

  closeModal.onclick = () => {
    modal.style.display = "none";
  }
  
  window.onclick = (e) => {
    if (e.target == modal) {
      modal.style.display = "none";
    }
  }
});

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
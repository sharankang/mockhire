function getToken() {
  return localStorage.getItem("mockhireToken");
}

if (!getToken()) {
  alert("You must log in first.");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("resumeList");

  try {
    const res = await fetch("http://localhost:5000/api/resumes", {
      headers: { "Authorization": `Bearer ${getToken()}` }
    });

    if (!res.ok) throw new Error("Could not fetch resumes");

    const resumeList = await res.json();

    if (resumeList.length === 0) {
      listEl.textContent = "You haven’t uploaded any resumes yet.";
      return;
    }

    const ul = document.createElement("ul");
    resumeList.forEach((resume) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${resume.filename}</strong> 
        <small>(${new Date(resume.date).toLocaleString()})</small>
        <button data-id="${resume._id}" class="delete-btn">Delete</button>
      `;
      ul.appendChild(li);
    });
    listEl.innerHTML = '';
    listEl.appendChild(ul);

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        if (confirm("Are you sure you want to delete this resume?")) {
          await deleteResume(id);
        }
      });
    });

  } catch (err) {
    console.error(err);
    listEl.textContent = "Error loading resumes.";
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
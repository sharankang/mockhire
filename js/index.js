document.addEventListener("DOMContentLoaded", () => {
  const authBtn = document.getElementById("auth-btn");
  const getStartedBtn = document.querySelector(".hero-content a[href='login.html']");

  const token = localStorage.getItem("mockhireToken");
  const username = localStorage.getItem("mockhireUser");

  if (token && username) {
    authBtn.textContent = `Log Out (${username})`;
    authBtn.href = "#";
    
    if (getStartedBtn) {
      getStartedBtn.style.display = "none"; 
    }

    authBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("mockhireToken");
      localStorage.removeItem("mockhireUser");
      window.location.href = "login.html";
    });

  } else {
    authBtn.textContent = "Sign In";
    authBtn.href = "login.html";
    if (getStartedBtn) {
      getStartedBtn.style.display = "inline-block";
    }
  }
});
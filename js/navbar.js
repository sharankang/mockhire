(function () {
  const token    = localStorage.getItem("mockhireToken");
  const username = localStorage.getItem("mockhireUser");

  const currentPage = window.location.pathname.split("/").pop();

  function navLink(href, label) {
    const active = currentPage === href ? "nav-link active" : "nav-link";
    return `<a href="${href}" class="${active}">${label}</a>`;
  }

  const authHTML = token && username
    ? `<span class="nav-user">👤 ${username}</span>
       <a href="#" class="nav-btn" id="nav-logout">Log Out</a>`
    : `<a href="login.html" class="nav-btn">Sign In</a>`;

  const navbar = `
    <nav class="navbar">
      <a href="index.html" class="nav-brand">Mock<span>Hire</span></a>
      <div class="nav-links">
        ${navLink("ats.html",       "ATS Evaluator")}
        ${navLink("questions.html", "Questions")}
        ${navLink("interview.html", "Simulation")}
        ${navLink("resume.html",    "Templates")}
        ${navLink("profile.html",   "Profile")}
      </div>
      <div class="nav-auth">
        ${authHTML}
      </div>
      <button class="nav-hamburger" id="nav-hamburger" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </nav>
  `;

  document.body.insertAdjacentHTML("afterbegin", navbar);

  // Logout handler
  const logoutBtn = document.getElementById("nav-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("mockhireToken");
      localStorage.removeItem("mockhireUser");
      window.location.href = "login.html";
    });
  }

  // Hamburger toggle
  const hamburger = document.getElementById("nav-hamburger");
  const navLinks  = document.querySelector(".nav-links");
  if (hamburger) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("open");
      hamburger.classList.toggle("open");
    });
  }
})();
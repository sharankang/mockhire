const API_URL = "http://localhost:5000/api/auth";

const signInBtn = document.getElementById("signInBtn");
const signUpBtn = document.getElementById("signUpBtn");
const authForm = document.getElementById("authForm");
const authMessage = document.getElementById("authMessage");

let mode = "signin";

signInBtn.addEventListener("click", () => {
  mode = "signin";
  signInBtn.classList.add("active");
  signUpBtn.classList.remove("active");
  authForm.querySelector(".btn-primary").textContent = "Sign In";
  authMessage.textContent = "";
});

signUpBtn.addEventListener("click", () => {
  mode = "signup";
  signUpBtn.classList.add("active");
  signInBtn.classList.remove("active");
  authForm.querySelector(".btn-primary").textContent = "Sign Up";
  authMessage.textContent = "";
});

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    authMessage.textContent = "Please enter username and password.";
    return;
  }

  const url = (mode === "signin") ? `${API_URL}/login` : `${API_URL}/register`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      authMessage.textContent = data.msg || "An error occurred.";
      return;
    }

    if (mode === "signup") {
      authMessage.textContent = data.msg;
      signInBtn.click();
    } else if (mode === "signin") {
      authMessage.textContent = "Login successful!";
      localStorage.setItem("mockhireToken", data.token);
      localStorage.setItem("mockhireUser", data.username);
      window.location.href = "index.html";
    }

  } catch (err) {
    console.error("Auth error:", err);
    authMessage.textContent = "Could not connect to server.";
  }
});
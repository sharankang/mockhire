if (localStorage.getItem("isLoggedIn") !== "true") {
  alert("You must log in first.");
  window.location.href = "login.html";
}

const activeUser = localStorage.getItem("activeUser");
let users = JSON.parse(localStorage.getItem("mockhireUsers") || "{}");

if (!activeUser || !users[activeUser]) {
  alert("Invalid session. Please log in again.");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("activeUser");
  window.location.href = "login.html";
}

console.log("Resume templates page loaded for:", activeUser);

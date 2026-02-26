if (!localStorage.getItem("mockhireToken")) {
  alert("You must log in first.");
  window.location.href = "login.html";
}

const activeUser = localStorage.getItem("mockhireUser");
console.log("Resume templates page loaded for:", activeUser);
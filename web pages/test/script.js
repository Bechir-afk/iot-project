// Dark Mode Toggle
function toggleDarkMode() {
  const body = document.body;
  body.classList.toggle("dark-mode");

  const darkModeText = document.getElementById("dark-mode-text");
  if (body.classList.contains("dark-mode")) {
    darkModeText.textContent = "Toggle Light Mode";
  } else {
    darkModeText.textContent = "Toggle Dark Mode";
  }
}

// Login Function
document.getElementById("login-btn").addEventListener("click", function () {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  if (username && password) {
    alert("Login successful!");
    // Redirect to another page or perform further actions
  } else {
    alert("Please enter username and password.");
  }
});

// Forgot Password Function
document.getElementById("forgot-password").addEventListener("click", function () {
  alert("Forgot Password functionality not implemented yet.");
});

// Signup Function
document.getElementById("signup-btn").addEventListener("click", function () {
  const username = document.getElementById("signup-username").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById("signup-confirm-password").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  if (username && email && password) {
    alert("Signup successful!");
    // Redirect to another page or perform further actions
  } else {
    alert("Please fill in all fields.");
  }
});
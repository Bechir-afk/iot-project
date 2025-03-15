// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAtj5j3xYmxRMOMR6ZOy8ucoqqhsD0jlZo",
  authDomain: "fdhf-4403b.firebaseapp.com",
  databaseURL: "https://fdhf-4403b-default-rtdb.firebaseio.com",
  projectId: "fdhf-4403b",
  storageBucket: "fdhf-4403b.appspot.com",
  messagingSenderId: "805654928789",
  appId: "1:805654928789:web:c7d541db0c1f92196e2a9c",
  measurementId: "G-KZNZ6JQ4FL",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Check authentication state
auth.onAuthStateChanged(function (user) {
  if (user) {
    // User is signed in
    console.log("User is signed in:", user.email);
    document.getElementById("menu-user-name").textContent =
      user.displayName || "User";
    document.getElementById("menu-user-email").textContent = user.email;

    // Load user data and time tracking info
    loadUserData(user.uid);
    loadLoginHistory(user.uid);
    initializeChart();
  } else {
    // User is signed out, redirect to login page
    window.location.href = "index.html";
  }
});

// Toggle dropdown menu
document.getElementById("user-menu-btn").addEventListener("click", function () {
  document.getElementById("user-menu-dropdown").classList.toggle("hidden");
});

// Logout functionality
document.getElementById("logout-btn").addEventListener("click", function () {
  // Record logout time
  const user = auth.currentUser;
  if (user) {
    recordLogoutTime(user.uid).then(() => {
      // Sign out and redirect
      auth.signOut().then(() => {
        window.location.href = "index.html";
      });
    });
  }
});

// Log time button functionality
document.getElementById("log-time-btn").addEventListener("click", function () {
  const user = auth.currentUser;
  const button = this;
  if (user) {
    if (button.textContent === "Log Time Out") {
      recordLogoutTime(user.uid).then(() => {
        document.getElementById("time-out").textContent = formatTime(
          new Date()
        );
        document.getElementById("time-out-date").textContent = formatDate(
          new Date()
        );
        button.textContent = "Log Time In";
        loadLoginHistory(user.uid); // Reload the history
      });
    } else {
      recordLoginTime(user.uid).then(() => {
        document.getElementById("time-in").textContent = formatTime(new Date());
        document.getElementById("time-in-date").textContent = formatDate(
          new Date()
        );
        button.textContent = "Log Time Out";
        loadLoginHistory(user.uid); // Reload the history
      });
    }
  }
});

// Load user data and check if already logged in today
function loadUserData(userId) {
  // Get the start of today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  db.collection("timeTracking")
    .where("userId", "==", userId)
    .where("loginTime", ">=", today)
    .orderBy("loginTime", "desc")
    .limit(1)
    .get()
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
        // User has logged in today
        const doc = querySnapshot.docs[0].data();
        document.getElementById("time-in").textContent = formatTime(
          doc.loginTime.toDate()
        );
        document.getElementById("time-in-date").textContent = formatDate(
          doc.loginTime.toDate()
        );

        if (doc.logoutTime) {
          // User has also logged out
          document.getElementById("time-out").textContent = formatTime(
            doc.logoutTime.toDate()
          );
          document.getElementById("time-out-date").textContent = formatDate(
            doc.logoutTime.toDate()
          );
          document.getElementById("log-time-btn").textContent = "Log Time In";
        } else {
          // User hasn't logged out yet
          document.getElementById("log-time-btn").textContent = "Log Time Out";
        }
      } else {
        // No login today, record initial login
        recordLoginTime(userId).then(() => {
          const now = new Date();
          document.getElementById("time-in").textContent = formatTime(now);
          document.getElementById("time-in-date").textContent = formatDate(now);
          document.getElementById("log-time-btn").textContent = "Log Time Out";
        });
      }
    })
    .catch((error) => {
      console.error("Error loading user data:", error);
    });
}

// Record login time
function recordLoginTime(userId) {
  return db.collection("timeTracking").add({
    userId: userId,
    loginTime: firebase.firestore.FieldValue.serverTimestamp(),
    logoutTime: null,
    duration: 0,
  });
}

// Record logout time
function recordLogoutTime(userId) {
  // Get the most recent login without a logout
  return db
    .collection("timeTracking")
    .where("userId", "==", userId)
    .where("logoutTime", "==", null)
    .orderBy("loginTime", "desc")
    .limit(1)
    .get()
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const loginTime = doc.data().loginTime;
        const logoutTime = firebase.firestore.FieldValue.serverTimestamp();

        // Calculate duration in minutes when the data is retrieved
        return doc.ref.update({
          logoutTime: logoutTime,
          duration: firebase.firestore.FieldValue.increment(1), // This will be updated with the correct duration when retrieved
        });
      }
    })
    .catch((error) => {
      console.error("Error recording logout time:", error);
    });
}

// Load login history
function loadLoginHistory(userId) {
  // Get the last 7 days of login history
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  db.collection("timeTracking")
    .where("userId", "==", userId)
    .where("loginTime", ">=", sevenDaysAgo)
    .orderBy("loginTime", "desc")
    .limit(10)
    .get()
    .then((querySnapshot) => {
      const historyTable = document.getElementById("login-history");

      if (querySnapshot.empty) {
        historyTable.innerHTML = `
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400" colspan="4">No login history found</td>
            </tr>
          `;
        return;
      }

      let tableContent = "";
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const loginDate = data.loginTime.toDate();

        // Format duration
        let duration = "Still logged in";
        let logoutTime = "Active";

        if (data.logoutTime) {
          const logoutDate = data.logoutTime.toDate();
          const durationMs = logoutDate - loginDate;
          const durationMinutes = Math.floor(durationMs / (1000 * 60));
          const hours = Math.floor(durationMinutes / 60);
          const minutes = durationMinutes % 60;

          duration = `${hours}h ${minutes}m`;
          logoutTime = formatTime(logoutDate);
        }

        tableContent += `
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">${formatDate(
                loginDate
              )}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${formatTime(
                loginDate
              )}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${logoutTime}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${duration}</td>
            </tr>
          `;
      });

      historyTable.innerHTML = tableContent;
    })
    .catch((error) => {
      console.error("Error loading login history:", error);
    });
}

// Initialize chart
function initializeChart() {
  const ctx = document.getElementById("timeChart").getContext("2d");

  // Get day labels for the last 7 days
  const days = [];
  const dayLabels = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(dayLabels[date.getDay()]);
  }

  // Sample data - in a real app, this would come from your database
  const hours = [0, 0, 0, 0, 0, 0, 0];

  // Get the current user
  const user = auth.currentUser;
  if (user) {
    // Calculate the date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Query for time tracking records in the last 7 days
    db.collection("timeTracking")
      .where("userId", "==", user.uid)
      .where("loginTime", ">=", sevenDaysAgo)
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.loginTime && data.logoutTime) {
            const loginDate = data.loginTime.toDate();
            const logoutDate = data.logoutTime.toDate();
            const dayIndex =
              6 - Math.floor((new Date() - loginDate) / (1000 * 60 * 60 * 24));

            if (dayIndex >= 0 && dayIndex < 7) {
              const durationHours = (logoutDate - loginDate) / (1000 * 60 * 60);
              hours[dayIndex] += durationHours;
            }
          }
        });

        // Round hours to 2 decimal places
        const roundedHours = hours.map((h) => parseFloat(h.toFixed(2)));

        // Create the chart
        const timeChart = new Chart(ctx, {
          type: "bar",
          data: {
            labels: days,
            datasets: [
              {
                label: "Hours",
                data: roundedHours,
                backgroundColor: "rgba(59, 130, 246, 0.5)",
                borderColor: "rgba(59, 130, 246, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Hours",
                },
              },
            },
          },
        });
      })
      .catch((error) => {
        console.error("Error loading chart data:", error);
      });
  }
}

// Helper function to format time
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Helper function to format date
function formatDate(date) {
  return date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// Check for login success message
document.addEventListener("DOMContentLoaded", function () {
  if (sessionStorage.getItem("loginSuccess") === "true") {
    const welcomeBanner = document.getElementById("welcome-banner");
    const welcomeMessage = document.getElementById("welcome-message");
    const loginTimestamp = document.getElementById("login-timestamp");

    // Get login email and time
    const email = sessionStorage.getItem("loginEmail");
    const loginTime = new Date(sessionStorage.getItem("loginTime"));

    // Update message
    welcomeMessage.textContent = `Welcome back, ${email}!`;
    loginTimestamp.textContent = `Logged in at ${loginTime.toLocaleTimeString()}`;

    // Show banner
    welcomeBanner.classList.remove("hidden");

    // Clear the flag to prevent showing on refresh
    sessionStorage.removeItem("loginSuccess");

    // Auto-hide after 5 seconds
    setTimeout(() => {
      welcomeBanner.classList.add(
        "opacity-0",
        "transition-opacity",
        "duration-1000"
      );
      setTimeout(() => {
        welcomeBanner.classList.add("hidden");
      }, 1000);
    }, 5000);
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // Weekly attendance chart
  const weeklyCtx = document
    .getElementById("weeklyAttendanceChart")
    .getContext("2d");
  const weeklyChart = new Chart(weeklyCtx, {
    type: "bar",
    data: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      datasets: [
        {
          label: "Present",
          data: [18, 20, 15, 19],
          backgroundColor: "rgba(34, 197, 94, 0.5)",
          borderColor: "rgb(34, 197, 94)",
          borderWidth: 1,
        },
        {
          label: "Absent",
          data: [2, 0, 5, 1],
          backgroundColor: "rgba(239, 68, 68, 0.5)",
          borderColor: "rgb(239, 68, 68)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(156, 163, 175, 0.1)",
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    },
  });

  // Punctuality chart
  const punctualityCtx = document
    .getElementById("punctualityChart")
    .getContext("2d");
  const punctualityChart = new Chart(punctualityCtx, {
    type: "doughnut",
    data: {
      labels: [
        "Early (>5 mins)",
        "On Time (±5 mins)",
        "Late (5-15 mins)",
        "Very Late (>15 mins)",
      ],
      datasets: [
        {
          data: [12, 25, 7, 3],
          backgroundColor: [
            "rgba(34, 197, 94, 0.6)",
            "rgba(59, 130, 246, 0.6)",
            "rgba(245, 158, 11, 0.6)",
            "rgba(239, 68, 68, 0.6)",
          ],
          borderColor: [
            "rgb(34, 197, 94)",
            "rgb(59, 130, 246)",
            "rgb(245, 158, 11)",
            "rgb(239, 68, 68)",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "#E5E7EB"
              : "#4B5563",
          },
        },
      },
    },
  });
});

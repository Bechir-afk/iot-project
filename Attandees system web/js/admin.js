// Import utility functions
import { formatTime, formatDate, calculateDuration, showNotification } from './utils.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAtj5j3xYmxRMOMR6ZOy8ucoqqhsD0jlZo",
  authDomain: "fdhf-4403b.firebaseapp.com",
  databaseURL: "https://fdhf-4403b-default-rtdb.firebaseio.com",
  projectId: "fdhf-4403b",
  storageBucket: "fdhf-4403b",
  messagingSenderId: "805654928789",
  appId: "1:805654928789:web:c7d541db0c1f92196e2a9c",
  measurementId: "G-KZNZ6JQ4FL",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Monitor connection status
const connectedRef = firebase.database().ref(".info/connected");
connectedRef.on("value", (snap) => {
  if (snap.val() === true) {
    console.log("Connected to Firebase RTDB");
  } else {
    console.log("Not connected to Firebase RTDB");
  }
});

// Helper functions
function createAuthAccount(email, password) {
  return auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log("Authentication account created:", userCredential.user.uid);
      return userCredential.user;
    })
    .catch((error) => {
      console.error("Error creating authentication account:", error);
      throw error;
    });
}

function translateFirebaseError(errorCode) {
  switch (errorCode) {
    case "EMAIL_EXISTS":
      return "This email address is already in use.";
    case "OPERATION_NOT_ALLOWED":
      return "Email/password accounts are not enabled.";
    case "TOO_MANY_ATTEMPTS_TRY_LATER":
      return "Too many attempts. Try again later.";
    case "WEAK_PASSWORD":
      return "Password should be at least 6 characters.";
    case "INVALID_EMAIL":
      return "Invalid email address format.";
    default:
      return errorCode;
  }
}

function reAuthenticateUser() {
  const email = prompt("For security reasons, please re-enter your email:");
  const password = prompt("Please enter your password:");

  if (!email || !password) {
    return Promise.reject(new Error("Re-authentication canceled"));
  }

  const credential = firebase.auth.EmailAuthProvider.credential(email, password);

  return auth.currentUser.reauthenticateWithCredential(credential)
    .then(() => {
      console.log("Re-authentication successful");
      return auth.currentUser.getIdToken(true);
    });
}

function syncUserToRTDB(userId, userData) {
  const rtdbRef = firebase.database().ref(`users/${userId}`);
  return rtdbRef.set(userData)
    .then(() => {
      console.log("Successfully synced to RTDB:", userId);
    })
    .catch((error) => {
      console.error("Error syncing to RTDB:", error);
      throw error;
    });
}

// DOM Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Add student form submission
  document.getElementById("add-student-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const form = this;
    const name = document.getElementById("student-name").value;
    const email = document.getElementById("student-email").value;
    const password = document.getElementById("student-password").value;
    const rfid = document.getElementById("rfid-badge").value;

    const isEditMode = form.dataset.mode === "edit";
    const studentId = form.dataset.id;

    if (isEditMode && studentId) {
      db.collection("users")
        .doc(studentId)
        .update({
          name: name,
          email: email,
          rfid: rfid,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        })
        .then(() => {
          alert("Student updated successfully!");
          form.reset();
          delete form.dataset.mode;
          delete form.dataset.id;
          form.querySelector('button[type="submit"]').textContent = "Add Student";
          loadStudents();
        })
        .catch((error) => {
          console.error("Error updating student:", error);
          alert(`Error updating student: ${error.message}`);
        });
    } else {
      createAuthAccount(email, password)
        .then((authData) => {
          const authUid = authData.uid;
          return db.collection("users").doc(rfid).set({
            name: name,
            email: email,
            password: password,
            rfid: rfid,
            role: "student",
            authUid: authUid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
        })
        .then(() => {
          alert("Student added successfully!");
          form.reset();
          loadStudents();
        })
        .catch((error) => {
          console.error("Error adding student:", error);
          alert(`Error adding student: ${error.message}`);
        });
    }
  });

  // Cancel edit button
  document.getElementById("cancel-edit-btn").addEventListener("click", function () {
    const form = document.getElementById("add-student-form");
    form.reset();
    delete form.dataset.mode;
    delete form.dataset.id;
    form.querySelector('button[type="submit"]').textContent = "Add Student";
    this.classList.add("hidden");
  });

  // Logout functionality
  document.getElementById("menu-logout").addEventListener("click", function () {
    auth.signOut().then(() => {
      window.location.href = "../html/login.html";
    });
  });

  // Authentication state observer
  auth.onAuthStateChanged((user) => {
    if (user) {
      loadStudents();
    } else {
      window.location.href = "../html/login.html";
    }
  });
});

// Load students
function loadStudents() {
  const tableBody = document.getElementById("student-table-body");
  tableBody.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";

  db.collection("users")
    .where("role", "==", "student")
    .get()
    .then((snapshot) => {
      tableBody.innerHTML = "";
      snapshot.forEach((doc) => {
        const student = doc.data();
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${student.name}</td>
          <td>${student.email}</td>
          <td>${doc.id}</td>
          <td>
            <button class="edit-btn" data-id="${doc.id}">Edit</button>
            <button class="delete-btn" data-id="${doc.id}">Delete</button>
          </td>
        `;
        tableBody.appendChild(row);
      });
      addButtonEventListeners();
    })
    .catch((error) => {
      console.error("Error loading students:", error);
      showNotification("Error loading students", "error");
    });
}

// Add event listeners to buttons
function addButtonEventListeners() {
  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const studentId = this.dataset.id;
      db.collection("users")
        .doc(studentId)
        .get()
        .then((doc) => {
          if (doc.exists) {
            const student = doc.data();
            document.getElementById("student-name").value = student.name;
            document.getElementById("student-email").value = student.email;
            document.getElementById("student-password").value = student.password;
            document.getElementById("rfid-badge").value = student.rfid;

            const form = document.getElementById("add-student-form");
            form.dataset.mode = "edit";
            form.dataset.id = studentId;
            form.querySelector('button[type="submit"]').textContent = "Update Student";
            document.getElementById("cancel-edit-btn").classList.remove("hidden");
          }
        });
    });
  });

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const studentId = this.dataset.id;
      db.collection("users")
        .doc(studentId)
        .delete()
        .then(() => {
          loadStudents();
        });
    });
  });
}
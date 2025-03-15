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

// DOM Elements
const attendanceTableBody = document.querySelector('#attendance-table-body');
const summaryEarly = document.querySelector('#summary-early');
const summaryLate = document.querySelector('#summary-late');
const summaryAttendance = document.querySelector('#summary-attendance');
const welcomeUserName = document.getElementById('welcome-user-name');
const currentDateElement = document.getElementById('current-date');
const todayDateElement = document.getElementById('today-date');
const userMenuBtn = document.getElementById('user-menu-btn');
const userMenuDropdown = document.getElementById('user-menu-dropdown');
const menuUserName = document.getElementById('menu-user-name');
const menuUserEmail = document.getElementById('menu-user-email');
const logoutBtn = document.getElementById('logout-btn');
const menuLogout = document.getElementById('menu-logout');

// Global variables
let currentUser = null;
let totalEarlyMinutes = 0;
let totalLateMinutes = 0;
let attendanceCount = 0;
let attendanceTotal = 0;

// Authentication State Observer
auth.onAuthStateChanged(function(user) {
  if (user) {
    currentUser = user;
    
    // Update user info in dropdown
    menuUserEmail.textContent = user.email;
    
    // Get user profile from Firestore
    db.collection('users').doc(user.uid).get()
      .then((doc) => {
        if (doc.exists) {
          const userData = doc.data();
          const fullName = userData.firstName && userData.lastName ? 
            `${userData.firstName} ${userData.lastName}` : user.displayName || user.email;
          
          welcomeUserName.textContent = fullName;
          menuUserName.textContent = fullName;
        }
      })
      .catch((error) => {
        console.error("Error getting user data:", error);
      });
    
    // Update dates
    updateDates();
    
    // Load attendance data
    loadAttendanceData();
  } else {
    // Redirect to login
    window.location.href = 'login.html';
  }
});

// Utility Functions
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function updateDates() {
  const now = new Date();
  currentDateElement.textContent = formatDate(now);
  todayDateElement.textContent = formatDate(now);
}

// Toggle dropdown menu
userMenuBtn.addEventListener('click', function() {
  userMenuDropdown.classList.toggle('hidden');
});

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
  if (!userMenuBtn.contains(event.target) && !userMenuDropdown.contains(event.target)) {
    userMenuDropdown.classList.add('hidden');
  }
});

// Logout function
function logoutUser() {
  auth.signOut()
    .then(() => {
      window.location.href = 'login.html';
    })
    .catch((error) => {
      console.error("Error signing out: ", error);
    });
}

if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);
if (menuLogout) menuLogout.addEventListener('click', logoutUser);

// Load Attendance Data from Firebase
function loadAttendanceData() {
  if (!currentUser) return;
  
  // Clear existing rows
  while (attendanceTableBody.firstChild) {
    attendanceTableBody.removeChild(attendanceTableBody.firstChild);
  }
  
  // Calculate date range (last 7 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  
  // Reset totals
  totalEarlyMinutes = 0;
  totalLateMinutes = 0;
  attendanceCount = 0;
  attendanceTotal = 0;
  
  // Query for attendance records
  db.collection('attendance')
    .where('userId', '==', currentUser.uid)
    .where('date', '>=', startDate.toLocaleDateString())
    .where('date', '<=', endDate.toLocaleDateString())
    .orderBy('date', 'desc')
    .get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        // No data
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `
          <td colspan="6" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
            No attendance records found for the last 7 days.
          </td>
        `;
        attendanceTableBody.appendChild(noDataRow);
        updateSummaryRow();
        return;
      }
      
      // Process attendance records
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Create table row for each record
        const row = createAttendanceRow(data);
        attendanceTableBody.appendChild(row);
        
        // Update totals
        attendanceTotal++;
        if (data.clockInTime) {
          attendanceCount++;
        }
        
        // Update early/late minutes
        if (data.earlyLateStatus === 'early') {
          totalEarlyMinutes += data.earlyLateMinutes || 0;
        } else if (data.earlyLateStatus === 'late') {
          totalLateMinutes += data.earlyLateMinutes || 0;
        }
      });
      
      // Update summary row
      updateSummaryRow();
    })
    .catch((error) => {
      console.error("Error loading attendance data:", error);
      const errorRow = document.createElement('tr');
      errorRow.innerHTML = `
        <td colspan="6" class="px-6 py-4 whitespace-nowrap text-sm text-red-500 dark:text-red-400 text-center">
          Error loading attendance data: ${error.message}
        </td>
      `;
      attendanceTableBody.appendChild(errorRow);
    });
}

function createAttendanceRow(data) {
  const row = document.createElement('tr');
  
  // Format date
  const displayDate = data.date;
  
  // Format times and status
  const clockInDisplay = data.clockInTime ? formatTime(data.clockInTime.toDate()) : '--:--';
  
  // Get class name (if stored) or default to subject
  const className = data.className || getCourseNameForDate(data.date);
  
  // Determine status class and text
  let statusClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  let statusText = 'Unknown';
  let minutesDisplay = '--';
  
  if (data.earlyLateStatus === 'early') {
    statusClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    statusText = 'Early';
    minutesDisplay = `<span class="text-green-500 dark:text-green-400">${data.earlyLateMinutes || 0} mins early</span>`;
  } else if (data.earlyLateStatus === 'late') {
    statusClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    statusText = 'Late';
    minutesDisplay = `<span class="text-red-500 dark:text-red-400">${data.earlyLateMinutes || 0} mins late</span>`;
  } else if (!data.clockInTime) {
    statusText = 'Absent';
    minutesDisplay = '--';
  }
  
  // Determine attendance status
  const attendanceIcon = data.clockInTime ? 
    '<span class="material-symbols-outlined text-green-500">check_circle</span>' : 
    '<span class="material-symbols-outlined text-red-500">cancel</span>';
  
  // Create row
  row.innerHTML = `
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${displayDate}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${className}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${clockInDisplay}</td>
    <td class="px-6 py-4 whitespace-nowrap">
      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
        ${statusText}
      </span>
    </td>
    <td class="px-6 py-4 whitespace-nowrap text-sm">${minutesDisplay}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm">
      ${attendanceIcon}
    </td>
  `;
  
  return row;
}

function updateSummaryRow() {
  // Update early/late minutes
  summaryEarly.textContent = `${totalEarlyMinutes} mins early`;
  summaryLate.textContent = `${totalLateMinutes} mins late`;
  
  // Update attendance percentage
  const attendancePercentage = attendanceTotal > 0 ? 
    Math.round((attendanceCount / attendanceTotal) * 100) : 0;
  
  summaryAttendance.textContent = `${attendanceCount}/${attendanceTotal} (${attendancePercentage}%)`;
}

// Helper function to get a default class name based on date
function getCourseNameForDate(dateStr) {
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();
  
  // Simple mapping of days to default subjects
  const subjects = [
    "Weekend", // Sunday
    "Mathematics", // Monday
    "Physics", // Tuesday
    "Computer Science", // Wednesday
    "Chemistry", // Thursday
    "Biology", // Friday
    "Weekend" // Saturday
  ];
  
  return subjects[dayOfWeek];
}
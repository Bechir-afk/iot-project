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

// Global variables
let currentUser = null;
let chartInstances = {};

// DOM References - will be populated after DOM loads
let domElements = {};

// Utility Functions
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

// Authentication State Observer
auth.onAuthStateChanged(function(user) {
  if (user) {
    console.log("User authenticated:", user.uid);
    currentUser = user;
    
    // Initialize UI when DOM is ready
    if (document.readyState === "complete" || document.readyState === "interactive") {
      initializeUI();
    } else {
      document.addEventListener("DOMContentLoaded", initializeUI);
    }
  } else {
    // Redirect to login
    window.location.href = 'login.html';
  }
});

// Initialize UI elements and load data
function initializeUI() {
  console.log("Initializing UI...");
  
  // Initialize DOM references
  initializeDOMReferences();
  
  // Update user info in dropdown and welcome banner
  loadUserProfile();
  
  // Update current date
  updateCurrentDate();
  
  // Setup event listeners
  setupEventListeners();
  
  // Load all dynamic data
  loadAllData();
}

// Initialize all DOM references
function initializeDOMReferences() {
  domElements = {
    // User info elements
    welcomeUserName: document.getElementById('welcome-user-name'),
    currentDate: document.getElementById('current-date'),
    todayDate: document.getElementById('today-date'),
    userMenuBtn: document.getElementById('user-menu-btn'),
    userMenuDropdown: document.getElementById('user-menu-dropdown'),
    menuUserName: document.getElementById('menu-user-name'),
    menuUserEmail: document.getElementById('menu-user-email'),
    menuUserRole: document.getElementById('menu-user-role'),
    userAvatar: document.getElementById('user-avatar'),
    
    // Stats elements
    attendanceRate: document.getElementById('attendance-rate'),
    absenceCount: document.getElementById('absence-count'),
    lateCount: document.getElementById('late-count'),
    earlyCount: document.getElementById('early-count'),
    
    // Schedule elements
    todaySchedule: document.querySelector('#today-schedule'),
    
    // Attendance table
    attendanceTableBody: document.querySelector('#attendance-table-body'),
    
    // Charts
    weeklyAttendanceChart: document.getElementById('weeklyAttendanceChart'),
    punctualityChart: document.getElementById('punctualityChart'),
    
    // Notifications
    notificationsList: document.querySelector('#notifications-list'),
    
    // Logout buttons
    logoutBtn: document.getElementById('logout-btn'),
    menuLogout: document.getElementById('menu-logout')
  };
}

// Load user profile data
function loadUserProfile() {
  if (!currentUser) return;
  
  // Update email in dropdown
  if (domElements.menuUserEmail) {
    domElements.menuUserEmail.textContent = currentUser.email;
  }
  
  // Get user profile from Firestore
  db.collection('users').doc(currentUser.uid).get()
    .then((doc) => {
      if (doc.exists) {
        const userData = doc.data();
        const fullName = userData.firstName && userData.lastName ? 
          `${userData.firstName} ${userData.lastName}` : currentUser.displayName || currentUser.email;
        
        // Update name in welcome banner
        if (domElements.welcomeUserName) {
          domElements.welcomeUserName.textContent = fullName;
        }
        
        // Update name in dropdown
        if (domElements.menuUserName) {
          domElements.menuUserName.textContent = fullName;
        }
        
        // Update role in dropdown
        if (domElements.menuUserRole && userData.role) {
          domElements.menuUserRole.textContent = userData.role;
        }
        
        // Update avatar if available
        if (domElements.userAvatar && userData.profileImage) {
          domElements.userAvatar.src = userData.profileImage;
        }
      }
    })
    .catch((error) => {
      console.error("Error loading user profile:", error);
    });
}

// Update current date in UI
function updateCurrentDate() {
  const now = new Date();
  
  if (domElements.currentDate) {
    domElements.currentDate.textContent = formatDate(now);
  }
  
  if (domElements.todayDate) {
    domElements.todayDate.textContent = formatDate(now);
  }
}

// Set up all event listeners
function setupEventListeners() {
  // Toggle dropdown menu
  if (domElements.userMenuBtn && domElements.userMenuDropdown) {
    domElements.userMenuBtn.addEventListener('click', function() {
      domElements.userMenuDropdown.classList.toggle('hidden');
    });
  }
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(event) {
    if (domElements.userMenuBtn && domElements.userMenuDropdown &&
        !domElements.userMenuBtn.contains(event.target) && 
        !domElements.userMenuDropdown.contains(event.target)) {
      domElements.userMenuDropdown.classList.add('hidden');
    }
  });
  
  // Logout function
  if (domElements.logoutBtn) {
    domElements.logoutBtn.addEventListener('click', logoutUser);
  }
  
  if (domElements.menuLogout) {
    domElements.menuLogout.addEventListener('click', logoutUser);
  }
}

// Logout function
function logoutUser() {
  auth.signOut()
    .then(() => {
      window.location.href = 'login.html';
    })
    .catch((error) => {
      console.error("Error signing out:", error);
    });
}

// Load all data from Firebase
function loadAllData() {
  if (!currentUser) return;
  
  // Load attendance statistics
  loadAttendanceStats();
  
  // Load today's schedule
  loadTodaySchedule();
  
  // Load attendance history
  loadAttendanceHistory();
  
  // Initialize and load charts
  initializeCharts();
  
  // Load notifications
  loadNotifications();
}

// Load attendance statistics
function loadAttendanceStats() {
  if (!currentUser || !domElements.attendanceRate) return;
  
  db.collection('attendance')
    .where('userId', '==', currentUser.uid)
    .get()
    .then((snapshot) => {
      console.log("Found attendance records:", snapshot.size);
      
      if (snapshot.empty) {
        updateStatsUI(0, 0, 0, 0);
        return;
      }
      
      // Initialize counters
      let totalClasses = snapshot.size;
      let presentCount = 0;
      let earlyCount = 0;
      let lateCount = 0;
      
      // Process each record
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        if (data.clockInTime) {
          presentCount++;
          
          if (data.earlyLateStatus === 'early') {
            earlyCount++;
          } else if (data.earlyLateStatus === 'late') {
            lateCount++;
          }
        }
      });
      
      // Calculate final stats
      const absenceCount = totalClasses - presentCount;
      const attendanceRate = totalClasses > 0 ? 
        Math.round((presentCount / totalClasses) * 100) : 0;
      
      // Update UI with stats
      updateStatsUI(attendanceRate, absenceCount, lateCount, earlyCount);
    })
    .catch((error) => {
      console.error("Error loading attendance stats:", error);
      updateStatsUI(0, 0, 0, 0);
    });
}

// Update statistics UI
function updateStatsUI(attendanceRate, absenceCount, lateCount, earlyCount) {
  if (domElements.attendanceRate) {
    domElements.attendanceRate.textContent = `${attendanceRate}%`;
  }
  
  if (domElements.absenceCount) {
    domElements.absenceCount.textContent = absenceCount;
  }
  
  if (domElements.lateCount) {
    domElements.lateCount.textContent = lateCount;
  }
  
  if (domElements.earlyCount) {
    domElements.earlyCount.textContent = earlyCount;
  }
}

// Load today's schedule
function loadTodaySchedule() {
  if (!currentUser || !domElements.todaySchedule) return;
  
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Skip if weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    domElements.todaySchedule.innerHTML = `
      <li class="p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="ml-4">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white">No classes scheduled (Weekend)</h4>
            </div>
          </div>
        </div>
      </li>
    `;
    return;
  }
  
  // Query schedule collection for today's classes
  db.collection('schedules')
    .where('userId', '==', currentUser.uid)
    .where('dayOfWeek', '==', dayOfWeek)
    .orderBy('startTime', 'asc')
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        // No classes found
        domElements.todaySchedule.innerHTML = `
          <li class="p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="ml-4">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white">No classes scheduled for today</h4>
                </div>
              </div>
            </div>
          </li>
        `;
        return;
      }
      
      // Get current time to determine class status
      const currentTime = today.getHours() * 60 + today.getMinutes();
      let scheduleHTML = '';
      
      snapshot.forEach((doc) => {
        const classData = doc.data();
        
        // Parse start and end times (format: "HH:MM")
        const [startHour, startMin] = classData.startTime.split(':').map(Number);
        const [endHour, endMin] = classData.endTime.split(':').map(Number);
        
        const startTimeMinutes = startHour * 60 + startMin;
        const endTimeMinutes = endHour * 60 + endMin;
        
        // Determine class status
        let statusClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        let statusText = 'Upcoming';
        let rowClass = '';
        
        if (currentTime > endTimeMinutes) {
          // Class is over
          statusClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
          statusText = 'Completed';
        } else if (currentTime >= startTimeMinutes && currentTime <= endTimeMinutes) {
          // Class is in progress
          statusClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
          statusText = 'In Progress';
          rowClass = 'bg-green-50 dark:bg-green-900/10';
        }
        
        // Create HTML for this class
        scheduleHTML += `
          <li class="p-4 ${rowClass}">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="flex-shrink-0 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                  <span class="material-symbols-outlined text-blue-500">school</span>
                </div>
                <div class="ml-4">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white">${classData.subject}</h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400">${classData.startTime} - ${classData.endTime} • ${classData.location || 'Room TBD'}</p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                  ${statusText}
                </span>
              </div>
            </div>
          </li>
        `;
      });
      
      // Update schedule in UI
      domElements.todaySchedule.innerHTML = scheduleHTML;
    })
    .catch((error) => {
      console.error("Error loading schedule:", error);
      
      // Show error message
      domElements.todaySchedule.innerHTML = `
        <li class="p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="ml-4">
                <h4 class="text-sm font-medium text-red-500">Error loading schedule</h4>
              </div>
            </div>
          </div>
        </li>
      `;
    });
}

// Load attendance history
function loadAttendanceHistory() {
  if (!currentUser || !domElements.attendanceTableBody) return;
  
  // Clear existing table content
  domElements.attendanceTableBody.innerHTML = '';
  
  // Create loading indicator
  const loadingRow = document.createElement('tr');
  loadingRow.innerHTML = `
    <td colspan="5" class="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
      <div class="flex justify-center items-center">
        <svg class="animate-spin h-5 w-5 mr-3 text-blue-500" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading attendance data...
      </div>
    </td>
  `;
  domElements.attendanceTableBody.appendChild(loadingRow);
  
  // Calculate date range (last 7 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  
  // Query for recent attendance records
  db.collection('attendance')
    .where('userId', '==', currentUser.uid)
    .orderBy('dateTimestamp', 'desc')
    .limit(7)
    .get()
    .then((snapshot) => {
      // Clear loading indicator
      domElements.attendanceTableBody.innerHTML = '';
      
      if (snapshot.empty) {
        // No data
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `
          <td colspan="5" class="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
            No attendance records found
          </td>
        `;
        domElements.attendanceTableBody.appendChild(noDataRow);
        return;
      }
      
      // Process attendance records
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Create table row
        const row = document.createElement('tr');
        
        // Format date
        const displayDate = data.date;
        
        // Format time and status
        const clockInTime = data.clockInTime ? formatTime(data.clockInTime.toDate()) : '--:--';
        
        // Status indicator
        let statusClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        let statusText = 'Unknown';
        
        if (!data.clockInTime) {
          statusClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
          statusText = 'Absent';
        } else if (data.earlyLateStatus === 'early') {
          statusClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
          statusText = `${data.earlyLateMinutes}m early`;
        } else if (data.earlyLateStatus === 'late') {
          statusClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
          statusText = `${data.earlyLateMinutes}m late`;
        } else {
          statusClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
          statusText = 'On Time';
        }
        
        // Build row content
        row.innerHTML = `
          <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${displayDate}</td>
          <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${data.subject || 'Class'}</td>
          <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${clockInTime}</td>
          <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">
            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
              ${statusText}
            </span>
          </td>
          <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
            ${data.clockInTime ? 
              '<span class="text-green-500 dark:text-green-400">✓ Present</span>' : 
              '<span class="text-red-500 dark:text-red-400">✗ Absent</span>'}
          </td>
        `;
        
        // Add row to table
        domElements.attendanceTableBody.appendChild(row);
      });
    })
    .catch((error) => {
      console.error("Error loading attendance history:", error);
      
      // Show error message
      domElements.attendanceTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="px-4 py-3 text-center text-red-500">
            Error loading attendance data: ${error.message}
          </td>
        </tr>
      `;
    });
}

// Initialize charts
function initializeCharts() {
  if (!currentUser) return;
  
  // Load chart data
  loadWeeklyAttendanceData();
  loadPunctualityData();
}

// Load weekly attendance chart data
function loadWeeklyAttendanceData() {
  if (!domElements.weeklyAttendanceChart) return;
  
  // Get data for the last 4 weeks
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 28); // 4 weeks
  
  // Query for attendance records
  db.collection('attendance')
    .where('userId', '==', currentUser.uid)
    .where('dateTimestamp', '>=', firebase.firestore.Timestamp.fromDate(startDate))
    .get()
    .then((snapshot) => {
      // Initialize data structure for weeks
      const weeks = [
        { present: 0, absent: 0, total: 0 },
        { present: 0, absent: 0, total: 0 },
        { present: 0, absent: 0, total: 0 },
        { present: 0, absent: 0, total: 0 }
      ];
      
      // Process attendance records
      snapshot.forEach((doc) => {
        const data = doc.data();
        const date = data.dateTimestamp.toDate();
        
        // Determine which week the record belongs to
        const daysDiff = Math.floor((endDate - date) / (1000 * 60 * 60 * 24));
        const weekIndex = Math.min(3, Math.floor(daysDiff / 7));
        
        weeks[weekIndex].total++;
        
        if (data.clockInTime) {
          weeks[weekIndex].present++;
        } else {
          weeks[weekIndex].absent++;
        }
      });
      
      // Create chart data
      const chartData = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'].reverse(),
        datasets: [
          {
            label: 'Present',
            data: weeks.map(w => w.present).reverse(),
            backgroundColor: 'rgba(34, 197, 94, 0.5)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 1
          },
          {
            label: 'Absent',
            data: weeks.map(w => w.absent).reverse(),
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 1
          }
        ]
      };
      
      // Create or update chart
      if (chartInstances.weeklyChart) {
        chartInstances.weeklyChart.data = chartData;
        chartInstances.weeklyChart.update();
      } else {
        const ctx = domElements.weeklyAttendanceChart.getContext('2d');
        chartInstances.weeklyChart = new Chart(ctx, {
          type: 'bar',
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(156, 163, 175, 0.1)'
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            }
          }
        });
      }
    })
    .catch((error) => {
      console.error("Error loading weekly attendance data:", error);
    });
}

// Load punctuality chart data
function loadPunctualityData() {
  if (!domElements.punctualityChart) return;
  
  // Query for attendance records
  db.collection('attendance')
    .where('userId', '==', currentUser.uid)
    .where('clockInTime', '!=', null)
    .get()
    .then((snapshot) => {
      // Initialize counters
      let earlyCount = 0;
      let onTimeCount = 0;
      let lateCount = 0;
      let veryLateCount = 0;
      
      // Process attendance records
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        if (data.earlyLateStatus === 'early') {
          earlyCount++;
        } else if (data.earlyLateStatus === 'late') {
          // Classify as "late" or "very late" based on minutes
          if (data.earlyLateMinutes > 15) {
            veryLateCount++;
          } else {
            lateCount++;
          }
        } else {
          onTimeCount++;
        }
      });
      
      // Create chart data
      const chartData = {
        labels: ['Early (>5 mins)', 'On Time (±5 mins)', 'Late (5-15 mins)', 'Very Late (>15 mins)'],
        datasets: [{
          data: [earlyCount, onTimeCount, lateCount, veryLateCount],
          backgroundColor: [
            'rgba(34, 197, 94, 0.6)',
            'rgba(59, 130, 246, 0.6)',
            'rgba(245, 158, 11, 0.6)',
            'rgba(239, 68, 68, 0.6)'
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(59, 130, 246)',
            'rgb(245, 158, 11)',
            'rgb(239, 68, 68)'
          ],
          borderWidth: 1
        }]
      };
      
      // Create or update chart
      if (chartInstances.punctualityChart) {
        chartInstances.punctualityChart.data = chartData;
        chartInstances.punctualityChart.update();
      } else {
        const ctx = domElements.punctualityChart.getContext('2d');
        chartInstances.punctualityChart = new Chart(ctx, {
          type: 'doughnut',
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#E5E7EB' : '#4B5563'
                }
              }
            }
          }
        });
      }
    })
    .catch((error) => {
      console.error("Error loading punctuality data:", error);
    });
}

// Load notifications
function loadNotifications() {
  if (!currentUser || !domElements.notificationsList) return;
  
  // Clear existing notifications
  domElements.notificationsList.innerHTML = '';
  
  // Query for notifications
  db.collection('notifications')
    .where('userId', '==', currentUser.uid)
    .orderBy('timestamp', 'desc')
    .limit(4)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        // No notifications
        domElements.notificationsList.innerHTML = `
          <li class="p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <span class="material-symbols-outlined text-gray-400">notifications</span>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-900 dark:text-white">No notifications</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">You're all caught up!</p>
              </div>
            </div>
          </li>
        `;
        return;
      }
      
      // Process notifications
      snapshot.forEach((doc) => {
        const notification = doc.data();
        
        // Determine notification type/style
        let typeClass = '';
        let iconName = 'info';
        
        switch (notification.type) {
          case 'warning':
            typeClass = 'bg-yellow-50 dark:bg-yellow-900/10';
            iconName = 'warning';
            break;
          case 'success':
            typeClass = 'bg-green-50 dark:bg-green-900/10';
            iconName = 'check_circle';
            break;
          case 'error':
            typeClass = 'bg-red-50 dark:bg-red-900/10';
            iconName = 'error';
            break;
          default:
            typeClass = '';
            iconName = 'notifications';
        }
        
        // Format date
        const formattedDate = notification.timestamp ? 
          formatDate(notification.timestamp.toDate()) : '';
        
        // Create notification item
        const notificationItem = document.createElement('li');
        notificationItem.className = `p-4 ${typeClass}`;
        notificationItem.innerHTML = `
          <div class="flex">
            <div class="flex-shrink-0">
              <span class="material-symbols-outlined text-${notification.type === 'warning' ? 'yellow' : notification.type === 'success' ? 'green' : notification.type === 'error' ? 'red' : 'blue'}-500">${iconName}</span>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-900 dark:text-white">${notification.title || 'Notification'}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">${notification.message}</p>
              ${formattedDate ? `<p class="text-xs text-gray-400 dark:text-gray-500 mt-1">${formattedDate}</p>` : ''}
            </div>
          </div>
        `;
        
        // Add to notifications list
        domElements.notificationsList.appendChild(notificationItem);
      });
    })
    .catch((error) => {
      console.error("Error loading notifications:", error);
      
      // Show error message
      domElements.notificationsList.innerHTML = `
        <li class="p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <span class="material-symbols-outlined text-red-500">error</span>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-red-500">Error loading notifications</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">${error.message}</p>
            </div>
          </div>
        </li>
      `;
    });
}

// Make sure charts update if the theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  // Reload charts with appropriate colors
  if (chartInstances.weeklyChart || chartInstances.punctualityChart) {
    loadWeeklyAttendanceData();
    loadPunctualityData();
  }
});

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM fully loaded");
  
  // If user is already authenticated, initialize UI
  if (currentUser) {
    initializeUI();
  }
  
  // Update charts if window is resized
  window.addEventListener('resize', function() {
    if (chartInstances.weeklyChart) {
      chartInstances.weeklyChart.resize();
    }
    if (chartInstances.punctualityChart) {
      chartInstances.punctualityChart.resize();
    }
  });
});
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
  const rtdb = firebase.database();
  
  // DOM Elements
  const currentTimeElem = document.getElementById('current-time');
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userMenuDropdown = document.getElementById('user-menu-dropdown');
  const menuUserName = document.getElementById('menu-user-name');
  const menuUserEmail = document.getElementById('menu-user-email');
  const menuUserRole = document.getElementById('menu-user-role');
  const userAvatar = document.getElementById('user-avatar');
  let logoutBtn, menuLogout;
  
  // Add this after the other DOM Elements
  const autoScanButton = document.getElementById('auto-scan-button');
  
  // Status elements
  const statusNotClocked = document.getElementById('status-not-clocked');
  const statusClockedIn = document.getElementById('status-clocked-in');
  const statusClockedOut = document.getElementById('status-clocked-out');
  const clockInTime = document.getElementById('clock-in-time');
  const durationTime = document.getElementById('duration-time');
  const summaryInTime = document.getElementById('summary-in-time');
  const summaryOutTime = document.getElementById('summary-out-time');
  const summaryDuration = document.getElementById('summary-duration');
  
  // RFID simulator elements
  const rfidInput = document.getElementById('rfid-input');
  const scanButton = document.getElementById('scan-button');
  const scanLog = document.getElementById('scan-log');
  
  // Attendance history elements
  const refreshHistoryBtn = document.getElementById('refresh-history');
  const attendanceHistory = document.getElementById('attendance-history');
  const loadingRow = document.getElementById('loading-row');
  const noDataRow = document.getElementById('no-data-row');
  
  // Summary elements
  const summaryEarly = document.getElementById('summary-early');
  const summaryLate = document.getElementById('summary-late');
  const summaryAttendance = document.getElementById('summary-attendance');
  
  // Global variables
  let currentUser = null;
  let clockInInterval = null;
  let clockInTime8AM = null;
  let totalEarlyMinutes = 0;
  let totalLateMinutes = 0;
  let attendanceCount = 0;
  let attendanceTotal = 0;
  let assignedRfid = null;
  
  // Import utility functions
  import { formatTime, formatDate, calculateDuration, showNotification } from './utils.js';
  
  // Utility Functions
  
  function getEarlyLateStatus(timeStr) {
    const time = new Date(`1970-01-01T${timeStr}`);
    const target = new Date(`1970-01-01T08:00:00`);
    const diffMinutes = Math.floor((time - target) / 60000);
    
    if (diffMinutes <= 0) {
      return {
        status: 'early',
        minutes: Math.abs(diffMinutes)
      };
    } else {
      return {
        status: 'late',
        minutes: diffMinutes
      };
    }
  }
  
  function updateCurrentTime() {
    const now = new Date();
    currentTimeElem.textContent = `Current Time: ${formatDate(now)} ${formatTime(now)}`;
  }
  
  // Authentication State Observer
  auth.onAuthStateChanged(function(user) {
    if (user) {
      currentUser = user;
      
      // Update user info in dropdown
      menuUserEmail.textContent = user.email;
      
      // Get user profile from Firestore and retrieve assigned RFID
      db.collection('users').doc(user.uid).get()
        .then((doc) => {
          if (doc.exists) {
            const userData = doc.data();
            
            // Store the assigned RFID
            assignedRfid = userData.rfid;
            console.log("Assigned RFID:", assignedRfid);
            
            // Update the auto-scan button based on RFID availability
            if (autoScanButton) {
              if (assignedRfid) {
                autoScanButton.disabled = false;
                autoScanButton.title = "Click to use your assigned RFID: " + assignedRfid;
              } else {
                autoScanButton.disabled = true;
                autoScanButton.classList.add('bg-gray-400', 'cursor-not-allowed');
                autoScanButton.classList.remove('bg-green-600', 'hover:bg-green-700');
                autoScanButton.title = "No RFID assigned to your account";
              }
            }
            
            // Display user info
            if (userData.name) {
              menuUserName.textContent = userData.name;
            }
            
            if (userData.role) {
              menuUserRole.textContent = userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
              menuUserRole.className = `mt-1 inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
            }
            
            if (userData.profileImage) {
              userAvatar.src = userData.profileImage;
            }
          }
        })
        .catch((error) => {
          console.error("Error getting user data:", error);
        });
      
      // Check if already clocked in today
      checkClockInStatus();
      
      // Load attendance history
      loadAttendanceHistory();
      
      // Load chart data
      loadChartData();
      
      // Set up RFID listener for real-time detection
      setupRFIDListener();
    } else {
      // Redirect to login
      window.location.href = 'login.html';
    }
  });
  
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
  
  // Logout functions
  function logoutUser() {
    auth.signOut()
      .then(() => {
        window.location.href = 'login.html';
      })
      .catch((error) => {
        console.error("Error signing out: ", error);
      });
  }
  
  // Clock In/Out Functions
  function checkClockInStatus() {
    const today = new Date().toLocaleDateString();
    
    if (currentUser) {
      db.collection('attendance')
        .where('userId', '==', currentUser.uid)
        .where('date', '==', today)
        .limit(1)
        .get()
        .then((querySnapshot) => {
          if (!querySnapshot.empty) {
            const attendanceData = querySnapshot.docs[0].data();
            
            if (attendanceData.clockInTime && !attendanceData.clockOutTime) {
              // User is clocked in but not clocked out
              showClockedInStatus(attendanceData.clockInTime.toDate());
            } else if (attendanceData.clockInTime && attendanceData.clockOutTime) {
              // User has already clocked in and out today
              showClockedOutStatus(
                attendanceData.clockInTime.toDate(),
                attendanceData.clockOutTime.toDate()
              );
            } else {
              // Strange state - reset to not clocked
              showNotClockedStatus();
            }
          } else {
            // No attendance record for today
            showNotClockedStatus();
          }
        })
        .catch((error) => {
          console.error("Error checking clock status:", error);
          showNotClockedStatus();
        });
    }
  }
  
  function clockIn(rfidTag) {
    if (!currentUser) return;
    
    const now = new Date();
    const today = now.toLocaleDateString();
    
    // Reference for the target time (8:00 AM today)
    const todayAt8AM = new Date(now);
    todayAt8AM.setHours(8, 0, 0, 0);
    clockInTime8AM = todayAt8AM;
    
    // Calculate early/late status
    const earlyLateMinutes = Math.round((now - todayAt8AM) / 60000);
    const earlyLateStatus = earlyLateMinutes <= 0 ? 'early' : 'late';
    const earlyLateValue = Math.abs(earlyLateMinutes);
    
    db.collection('attendance')
      .where('userId', '==', currentUser.uid)
      .where('date', '==', today)
      .limit(1)
      .get()
      .then((querySnapshot) => {
        if (querySnapshot.empty) {
          // Create new attendance record
          return db.collection('attendance').add({
            userId: currentUser.uid,
            userEmail: currentUser.email,
            date: today,
            dateTimestamp: firebase.firestore.Timestamp.fromDate(new Date(today)),
            clockInTime: firebase.firestore.Timestamp.fromDate(now),
            rfidTag: rfidTag,
            earlyLateStatus: earlyLateStatus,
            earlyLateMinutes: earlyLateValue,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        } else {
          // User already has an attendance record for today
          scanLog.textContent = 'You have already clocked in for today.';
          return null;
        }
      })
      .then((docRef) => {
        if (docRef) {
          // Log RFID activity
          rtdb.ref('rfidActivity').push({
            userId: currentUser.uid,
            userEmail: currentUser.email,
            rfidTag: rfidTag,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            action: 'clockIn',
            earlyLateStatus: earlyLateStatus,
            earlyLateMinutes: earlyLateValue
          });
          
          // Show clocked in status
          showClockedInStatus(now);
          
          scanLog.textContent = `Successfully clocked in with RFID tag: ${rfidTag}`;
          
          // Add this line to refresh the attendance history
          loadAttendanceHistory();
        }
      })
      .catch((error) => {
        console.error("Error clocking in:", error);
        scanLog.textContent = `Error: ${error.message}`;
      });
  }
  
  function clockOut(rfidTag) {
    if (!currentUser) return;
    
    const now = new Date();
    const today = now.toLocaleDateString();
    
    db.collection('attendance')
      .where('userId', '==', currentUser.uid)
      .where('date', '==', today)
      .limit(1)
      .get()
      .then((querySnapshot) => {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const attendanceData = doc.data();
          
          if (attendanceData.clockInTime && !attendanceData.clockOutTime) {
            // Update record with clock out time
            const clockInDate = attendanceData.clockInTime.toDate();
            const durationMinutes = Math.round((now - clockInDate) / 60000);
            
            return doc.ref.update({
              clockOutTime: firebase.firestore.Timestamp.fromDate(now),
              durationMinutes: durationMinutes,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          } else if (attendanceData.clockOutTime) {
            scanLog.textContent = 'You have already clocked out for today.';
            return null;
          } else {
            scanLog.textContent = 'Cannot clock out without clocking in first.';
            return null;
          }
        } else {
          scanLog.textContent = 'No clock-in record found for today.';
          return null;
        }
      })
      .then((docRef) => {
        if (docRef !== null) {
          // Log RFID activity
          rtdb.ref('rfidActivity').push({
            userId: currentUser.uid,
            userEmail: currentUser.email,
            rfidTag: rfidTag,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            action: 'clockOut'
          });
          
          // Stop the interval for duration update
          if (clockInInterval) {
            clearInterval(clockInInterval);
            clockInInterval = null;
          }
          
          // Show clocked out status
          db.collection('attendance')
            .where('userId', '==', currentUser.uid)
            .where('date', '==', today)
            .limit(1)
            .get()
            .then((querySnapshot) => {
              if (!querySnapshot.empty) {
                const attendanceData = querySnapshot.docs[0].data();
                showClockedOutStatus(
                  attendanceData.clockInTime.toDate(),
                  attendanceData.clockOutTime.toDate()
                );
              }
            });
          
          scanLog.textContent = `Successfully clocked out with RFID tag: ${rfidTag}`;
          
          // Reload attendance history
          loadAttendanceHistory();
        }
      })
      .catch((error) => {
        console.error("Error clocking out:", error);
        scanLog.textContent = `Error: ${error.message}`;
      });
  }
  
  // UI Status Functions
  function showNotClockedStatus() {
    statusNotClocked.classList.remove('hidden');
    statusClockedIn.classList.add('hidden');
    statusClockedOut.classList.add('hidden');
    
    // Stop the interval if it's running
    if (clockInInterval) {
      clearInterval(clockInInterval);
      clockInInterval = null;
    }
  }
  
  function showClockedInStatus(inTime) {
    statusNotClocked.classList.add('hidden');
    statusClockedIn.classList.remove('hidden');
    statusClockedOut.classList.add('hidden');
    
    // Display clock in time
    clockInTime.textContent = formatTime(inTime);
    
    // Start interval to update duration
    if (clockInInterval) {
      clearInterval(clockInInterval);
    }
    
    updateDuration(inTime);
    clockInInterval = setInterval(() => {
      updateDuration(inTime);
    }, 60000); // Update every minute
  }
  
  function showClockedOutStatus(inTime, outTime) {
    statusNotClocked.classList.add('hidden');
    statusClockedIn.classList.add('hidden');
    statusClockedOut.classList.remove('hidden');
    
    // Display summary
    summaryInTime.textContent = formatTime(inTime);
    summaryOutTime.textContent = formatTime(outTime);
    summaryDuration.textContent = calculateDuration(inTime, outTime);
    
    // Stop the interval if it's running
    if (clockInInterval) {
      clearInterval(clockInInterval);
      clockInInterval = null;
    }
  }
  
  function updateDuration(startTime) {
    const now = new Date();
    durationTime.textContent = calculateDuration(startTime, now);
  }
  
  // RFID Scanner Simulator
  scanButton.addEventListener('click', function() {
    const rfidValue = rfidInput.value.trim();
    
    if (!rfidValue) {
      scanLog.textContent = 'Please enter an RFID tag ID.';
      return;
    }
    
    handleRFIDScan(rfidValue);
  });
  
  // Also allow Enter key in input field
  rfidInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      scanButton.click();
    }
  });
  
  // Process RFID scan
  function handleRFIDScan(rfidTag) {
    // Check if the user is authenticated
    if (!currentUser) {
      scanLog.textContent = 'Error: Not logged in. Please refresh the page.';
      return;
    }
    
    // Check if the scanned RFID matches the assigned RFID
    if (assignedRfid && rfidTag !== assignedRfid) {
      scanLog.textContent = `Error: The scanned RFID (${rfidTag}) does not match your assigned RFID tag.`;
      
      // Add visual feedback - flash the scan area red
      const scannerArea = document.querySelector('.mt-6.bg-gray-50');
      scannerArea.classList.add('bg-red-50', 'dark:bg-red-900/20');
      scannerArea.classList.remove('bg-gray-50', 'dark:bg-gray-700/50');
      
      setTimeout(() => {
        scannerArea.classList.remove('bg-red-50', 'dark:bg-red-900/20');
        scannerArea.classList.add('bg-gray-50', 'dark:bg-gray-700/50');
      }, 2000);
      
      return;
    }
    
    const today = new Date().toLocaleDateString();
    
    // Check if already clocked in/out today
    db.collection('attendance')
      .where('userId', '==', currentUser.uid)
      .where('date', '==', today)
      .limit(1)
      .get()
      .then((querySnapshot) => {
        if (querySnapshot.empty) {
          // No record for today, clock in
          clockIn(rfidTag);
        } else {
          // Already have a record for today
          const attendanceData = querySnapshot.docs[0].data();
          
          if (attendanceData.clockInTime && !attendanceData.clockOutTime) {
            // Clocked in but not clocked out, so clock out
            clockOut(rfidTag);
          } else if (attendanceData.clockInTime && attendanceData.clockOutTime) {
            // Already clocked in and out
            scanLog.textContent = 'You have already completed your attendance for today.';
          }
        }
      })
      .catch((error) => {
        console.error("Error processing RFID scan:", error);
        scanLog.textContent = `Error: ${error.message}`;
      });
  }
  
  // Attendance History Functions
  function loadAttendanceHistory() {
    if (!currentUser) return;
    
    // Show loading state
    loadingRow.style.display = '';
    noDataRow.style.display = 'none';
    
    // Clear existing rows except loading and no-data rows
    const existingRows = document.querySelectorAll('#attendance-history tr:not(#loading-row):not(#no-data-row)');
    existingRows.forEach(row => row.remove());
    
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
      .where('dateTimestamp', '>=', firebase.firestore.Timestamp.fromDate(startDate))
      .where('dateTimestamp', '<=', firebase.firestore.Timestamp.fromDate(endDate))
      .orderBy('dateTimestamp', 'desc')
      .get()
      .then((querySnapshot) => {
        // Hide loading state
        loadingRow.style.display = 'none';
        
        if (querySnapshot.empty) {
          // Show no data message
          noDataRow.style.display = '';
          updateSummaryRow();
          return;
        }
        
        // Process attendance records
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const row = createAttendanceRow(data);
          attendanceHistory.appendChild(row);
          
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
        console.error("Error loading attendance history:", error);
        loadingRow.style.display = 'none';
        
        // Show error message
        const errorRow = document.createElement('tr');
        errorRow.innerHTML = `
          <td colspan="6" class="px-6 py-4 whitespace-nowrap text-sm text-red-500 dark:text-red-400 text-center">
            Error loading attendance data: ${error.message}
          </td>
        `;
        attendanceHistory.appendChild(errorRow);
      });
  }
  
  function createAttendanceRow(data) {
    const row = document.createElement('tr');
    
    // Format date
    const displayDate = data.date;
    
    // Format times and status
    const clockInDisplay = data.clockInTime ? formatTime(data.clockInTime.toDate()) : '--:--';
    const clockOutDisplay = data.clockOutTime ? formatTime(data.clockOutTime.toDate()) : '--:--';
    
    // Calculate duration
    let durationDisplay = '--';
    if (data.clockInTime && data.clockOutTime) {
      durationDisplay = calculateDuration(
        data.clockInTime.toDate(),
        data.clockOutTime.toDate()
      );
    }
    
    // Determine status class and text
    let statusClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    let statusText = 'Unknown';
    
    if (data.earlyLateStatus === 'early') {
      statusClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      statusText = `${data.earlyLateMinutes || 0}m early`;
    } else if (data.earlyLateStatus === 'late') {
      statusClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      statusText = `${data.earlyLateMinutes || 0}m late`;
    } else if (!data.clockInTime) {
      statusText = 'Not Clocked In';
    }
    
    // Determine attendance status
    let attendanceClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    let attendanceText = 'Unknown';
    
    if (data.clockInTime) {
      attendanceClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      attendanceText = 'Present';
    } else {
      attendanceClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      attendanceText = 'Absent';
    }
    
    // Create row
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${displayDate}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${clockInDisplay}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${clockOutDisplay}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${durationDisplay}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
          ${statusText}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${attendanceClass}">
          ${attendanceText}
        </span>
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
  
  // Chart Data Functions
  function loadChartData() {
    if (!currentUser) return;
    
    // Get the last 4 weeks of data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28); // 4 weeks
    
    db.collection('attendance')
      .where('userId', '==', currentUser.uid)
      .where('date', '>=', startDate.toLocaleDateString())
      .where('date', '<=', endDate.toLocaleDateString())
      .get()
      .then((querySnapshot) => {
        // Prepare data structure for weeks
        const weeks = [
          { present: 0, absent: 0, early: 0, onTime: 0, late: 0, veryLate: 0 },
          { present: 0, absent: 0, early: 0, onTime: 0, late: 0, veryLate: 0 },
          { present: 0, absent: 0, early: 0, onTime: 0, late: 0, veryLate: 0 },
          { present: 0, absent: 0, early: 0, onTime: 0, late: 0, veryLate: 0 }
        ];
        
        // Process each attendance record
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const recordDate = new Date(data.date);
          
          // Calculate week index (0-3, with 0 being oldest)
          const daysSinceStart = Math.floor((recordDate - startDate) / (1000 * 60 * 60 * 24));
          const weekIndex = Math.min(3, Math.floor(daysSinceStart / 7));
          
          // Update weekly data
          if (data.clockInTime) {
            weeks[weekIndex].present++;
            
            // Categorize punctuality
            if (data.earlyLateStatus === 'early' && data.earlyLateMinutes >= 5) {
              weeks[weekIndex].early++;
            } else if (
              (data.earlyLateStatus === 'early' && data.earlyLateMinutes < 5) || 
              (data.earlyLateStatus === 'late' && data.earlyLateMinutes <= 5)
            ) {
              weeks[weekIndex].onTime++;
            } else if (data.earlyLateStatus === 'late' && data.earlyLateMinutes <= 15) {
              weeks[weekIndex].late++;
            } else if (data.earlyLateStatus === 'late' && data.earlyLateMinutes > 15) {
              weeks[weekIndex].veryLate++;
            }
          } else {
            weeks[weekIndex].absent++;
          }
        });
        
        // Update weekly attendance chart
        if (window.weeklyChart) {
          window.weeklyChart.data.datasets[0].data = weeks.map(w => w.present);
          window.weeklyChart.data.datasets[1].data = weeks.map(w => w.absent);
          window.weeklyChart.update();
        }
        
        // Update punctuality chart
        if (window.punctualityChart) {
          // Calculate totals across all weeks
          const earlyTotal = weeks.reduce((sum, week) => sum + week.early, 0);
          const onTimeTotal = weeks.reduce((sum, week) => sum + week.onTime, 0);
          const lateTotal = weeks.reduce((sum, week) => sum + week.late, 0);
          const veryLateTotal = weeks.reduce((sum, week) => sum + week.veryLate, 0);
          
          window.punctualityChart.data.datasets[0].data = [
            earlyTotal,
            onTimeTotal,
            lateTotal,
            veryLateTotal
          ];
          window.punctualityChart.update();
        }
      })
      .catch((error) => {
        console.error("Error loading chart data:", error);
      });
  }
  
  // Event Listeners
  document.addEventListener('DOMContentLoaded', function() {
    // Update current time
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000); // Update every minute
    
    // Get DOM elements after page has loaded
    logoutBtn = document.getElementById('logout-btn');
    menuLogout = document.getElementById('menu-logout');
    
    // Add event listeners
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logoutUser);
    } else {
      console.error("Error: logout-btn element not found");
    }
    
    if (menuLogout) {
      menuLogout.addEventListener('click', logoutUser);
    } else {
      console.error("Error: menu-logout element not found");
    }
    
    // Refresh history button
    if (refreshHistoryBtn) {
      refreshHistoryBtn.addEventListener('click', loadAttendanceHistory);
    }
    
    // Auto-scan button
    if (autoScanButton) {
      autoScanButton.addEventListener('click', function() {
        if (!assignedRfid) {
          scanLog.textContent = 'Error: No RFID assigned to your account. Please contact an administrator.';
          return;
        }
        
        // Fill in the input field with the assigned RFID
        if (rfidInput) {
          rfidInput.value = assignedRfid;
        }
        
        // Simulate the scan with visual feedback
        autoScanButton.classList.add('animate-pulse');
        scanLog.textContent = `Auto-scanning with your assigned RFID: ${assignedRfid}...`;
        
        // Process the RFID scan after a small delay for visual effect
        setTimeout(() => {
          handleRFIDScan(assignedRfid);
          autoScanButton.classList.remove('animate-pulse');
        }, 800);
      });
    }
  });

function setupRFIDListener() {
  console.log("Setting up RFID scanner listener...");
  
  try {
    // Reference to the latest_scan node
    const latestScanRef = rtdb.ref('/latest_scan');
    
    // Listen for changes and handle permission errors
    latestScanRef.on('value', 
      (snapshot) => {
        const scanData = snapshot.val();
        
        if (scanData && scanData.uid) {
          // Process the RFID scan as before
          handleRFIDScan(scanData.uid);
        }
      },
      (error) => {
        console.error("Error accessing RFID scan data:", error.message);
        scanLog.textContent = "Using manual mode: RFID scanner access unavailable";
        
        // Show a user-friendly message in the scanner area
        const scannerArea = document.querySelector('.mt-6.bg-gray-50');
        if (scannerArea) {
          // Add a yellow warning background
          scannerArea.classList.add('bg-yellow-50', 'dark:bg-yellow-900/20');
          scannerArea.classList.remove('bg-gray-50', 'dark:bg-gray-700/50');
          
          // Add a suggestion to use the auto-scan feature if RFID is assigned
          if (assignedRfid) {
            scanLog.textContent = "Hardware scanner unavailable. Use the 'Use My RFID' button instead.";
            // Make the auto-scan button more noticeable
            if (autoScanButton) {
              autoScanButton.classList.add('ring-2', 'ring-yellow-400');
            }
          } else {
            scanLog.textContent = "Hardware scanner unavailable. Please enter your RFID manually.";
          }
          
          // Focus on the manual input field as fallback
          if (rfidInput) {
            rfidInput.focus();
            rfidInput.placeholder = "Enter RFID manually (RFID hardware unavailable)";
          }
        }
      }
    );
  } catch (err) {
    console.error("Failed to set up RFID listener:", err);
    // Fall back to manual mode only
    const scannerArea = document.querySelector('.mt-6.bg-gray-50');
    if (scannerArea) {
      scannerArea.querySelector('#scan-log').textContent = 
        "Manual mode only: Please enter your RFID number above";
    }
  }
}
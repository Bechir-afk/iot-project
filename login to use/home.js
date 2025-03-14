// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAtj5j3xYmxRMOMR6ZOy8ucoqqhsD0jlZo",
    authDomain: "fdhf-4403b.firebaseapp.com",
    databaseURL: "https://fdhf-4403b-default-rtdb.firebaseio.com",
    projectId: "fdhf-4403b",
    storageBucket: "fdhf-4403b.appspot.com",
    messagingSenderId: "805654928789",
    appId: "1:805654928789:web:c7d541db0c1f92196e2a9c",
    measurementId: "G-KZNZ6JQ4FL"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  
  // DOM Elements
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userMenuDropdown = document.getElementById('user-menu-dropdown');
  const logoutBtn = document.getElementById('logout-btn');
  const menuLogoutBtn = document.getElementById('menu-logout');
  const userEmail = document.getElementById('menu-user-email');
  const userName = document.getElementById('menu-user-name');
  const welcomeUserName = document.getElementById('welcome-user-name');
  const currentDateElem = document.getElementById('current-date');
  const upcomingCountElem = document.getElementById('upcoming-count');
  const pendingCountElem = document.getElementById('pending-count');
  
  // Current Date Formatting
  function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }
  
  // Set current date
  if (currentDateElem) {
    currentDateElem.textContent = formatDate(new Date());
  }
  
  // Toggle user menu dropdown
  if (userMenuBtn) {
    userMenuBtn.addEventListener('click', () => {
      userMenuDropdown.classList.toggle('hidden');
    });
  }
  
  // Close dropdown when clicking outside
  window.addEventListener('click', (e) => {
    if (userMenuDropdown && !userMenuBtn?.contains(e.target) && !userMenuDropdown.contains(e.target)) {
      userMenuDropdown.classList.add('hidden');
    }
  });
  
  // Logout function
  function logout() {
    auth.signOut().then(() => {
      window.location.href = 'index.html';
    }).catch((error) => {
      console.error('Logout error:', error);
      alert('Error logging out: ' + error.message);
    });
  }
  
  // Add event listeners for logout buttons
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
  if (menuLogoutBtn) menuLogoutBtn.addEventListener('click', logout);
  
  // Auth state observer
  auth.onAuthStateChanged((user) => {
    if (user) {
      // User is signed in
      if (userEmail) userEmail.textContent = user.email;
      
      // Get user data from Firestore
      db.collection('users').doc(user.uid).get()
        .then((doc) => {
          if (doc.exists) {
            const userData = doc.data();
            const displayName = userData.name || user.email.split('@')[0];
            
            // Update user info in the menu
            if (userName) userName.textContent = displayName;
            
            // Update welcome message
            if (welcomeUserName) welcomeUserName.textContent = displayName;
            
            // Set user role if available
            const roleElement = document.getElementById('menu-user-role');
            if (roleElement && userData.role) {
              roleElement.textContent = userData.role;
            }
          } else {
            console.log("No user document found!");
            
            // Create a new user document if none exists
            db.collection('users').doc(user.uid).set({
              email: user.email,
              name: user.displayName || user.email.split('@')[0],
              role: 'Teacher', // Default role
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
              console.log("User document created successfully");
            })
            .catch((error) => {
              console.error("Error creating user document:", error);
            });
          }
          
          // After user data is loaded, fetch classroom data
          fetchClassroomData(user.uid);
        })
        .catch((error) => {
          console.error("Error getting user document:", error);
        });
    } else {
      // User is not signed in, redirect to login
      window.location.href = 'index.html';
    }
  });
  
  // Fetch classroom data (classes, assignments, etc.)
  function fetchClassroomData(userId) {
    // Fetch classes for today's schedule
    fetchTodayClasses(userId);
    
    // Fetch assignments
    fetchRecentAssignments(userId);
    
    // Initialize performance chart
    initializePerformanceChart();
  }
  
  // Fetch today's classes
  function fetchTodayClasses(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
    
    // In a real app, you would fetch this from Firestore
    // This is a placeholder using mock data
    
    // Simulate a database call delay
    setTimeout(() => {
      // Update upcoming classes count in welcome banner
      if (upcomingCountElem) {
        const upcomingCount = 5; // From your HTML mock data
        upcomingCountElem.textContent = upcomingCount;
      }
      
      // In a real app, you would update the schedule UI with fetched data
      updateClassStatus();
    }, 500);
  }
  
  // Update class status based on current time
  function updateClassStatus() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute; // Time in minutes since midnight
    
    // Get all schedule items
    const scheduleItems = document.querySelectorAll('ul[role="list"] li');
    
    scheduleItems.forEach(item => {
      const statusBadge = item.querySelector('.rounded-full');
      if (!statusBadge) return;
      
      // Extract time from the schedule item
      const timeElem = item.querySelector('.flex-shrink-0 p-2');
      if (!timeElem) return;
      
      const startTimeText = timeElem.querySelector('p:first-child').textContent;
      const endTimeText = timeElem.querySelector('p:last-child').textContent;
      
      // Parse times (assuming format is "HH:MM")
      const [startHour, startMinute] = startTimeText.split(':').map(Number);
      const [endHour, endMinute] = endTimeText.split(':').map(Number);
      
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;
      
      // Update status based on current time
      if (currentTime >= startTime && currentTime <= endTime) {
        statusBadge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        statusBadge.textContent = 'In Progress';
      } else if (currentTime < startTime) {
        statusBadge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        statusBadge.textContent = 'Upcoming';
      } else {
        statusBadge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        statusBadge.textContent = 'Completed';
      }
    });
  }
  
  // Fetch recent assignments
  function fetchRecentAssignments(userId) {
    // In a real app, you would fetch this from Firestore
    // This is a placeholder using mock data
    
    // Simulate a database call delay
    setTimeout(() => {
      // Update pending assignments count in welcome banner
      if (pendingCountElem) {
        const pendingCount = 3; // From your HTML mock data
        pendingCountElem.textContent = pendingCount;
      }
      
      // In a real app, you would update the assignments UI with fetched data
    }, 700);
    
    // Add event listeners to assignment action buttons
    setupAssignmentActions();
  }
  
  // Setup assignment action buttons
  function setupAssignmentActions() {
    // Grade now buttons
    const gradeButtons = document.querySelectorAll('a[href^="grade-assignment.html"]');
    gradeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        // In a real app, this would navigate to the grading page
        // For now, just prevent the default navigation since the page doesn't exist
        e.preventDefault();
        const assignmentId = button.getAttribute('href').split('=')[1];
        console.log(`Opening grading interface for assignment ${assignmentId}`);
        alert(`Opening grading interface for assignment ${assignmentId}`);
      });
    });
    
    // Edit assignment buttons
    const editButtons = document.querySelectorAll('a[href^="edit-assignment.html"]');
    editButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const assignmentId = button.getAttribute('href').split('=')[1];
        console.log(`Opening editor for assignment ${assignmentId}`);
        alert(`Opening editor for assignment ${assignmentId}`);
      });
    });
    
    // View results buttons
    const viewButtons = document.querySelectorAll('a[href^="view-grades.html"]');
    viewButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const assignmentId = button.getAttribute('href').split('=')[1];
        console.log(`Viewing results for assignment ${assignmentId}`);
        alert(`Viewing results for assignment ${assignmentId}`);
      });
    });
  }
  
  // Initialize performance chart
  function initializePerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;
    
    // Sample data for the chart
    const chartData = {
      labels: ['Mathematics', 'Physics', 'Computer Science', 'English', 'History'],
      datasets: [
        {
          label: 'Average Grade (%)',
          data: [87, 82, 91, 78, 85],
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: '#3B82F6',
          borderWidth: 1
        },
        {
          label: 'Class Average (%)',
          data: [80, 79, 88, 81, 83],
          backgroundColor: 'rgba(156, 163, 175, 0.5)',
          borderColor: '#6B7280',
          borderWidth: 1
        }
      ]
    };
    
    // Check if dark mode is enabled
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Create the chart
    new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: isDarkMode ? 'rgba(156, 163, 175, 0.1)' : 'rgba(156, 163, 175, 0.2)'
            },
            ticks: {
              color: isDarkMode ? '#9CA3AF' : '#6B7280'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: isDarkMode ? '#9CA3AF' : '#6B7280'
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: isDarkMode ? '#E5E7EB' : '#4B5563'
            }
          }
        }
      }
    });
  }
  
  // Setup quick action buttons
  function setupQuickActions() {
    // These would handle navigation to the respective pages
    // For now they're just placeholders since those pages don't exist yet
    
    const createClassBtn = document.querySelector('a[href="create-class.html"]');
    if (createClassBtn) {
      createClassBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log("Create class action triggered");
        alert("Create class feature coming soon!");
      });
    }
    
    const newAssignmentBtn = document.querySelector('a[href="assignments.html?new=true"]');
    if (newAssignmentBtn) {
      newAssignmentBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log("New assignment action triggered");
        alert("New assignment feature coming soon!");
      });
    }
    
    const attendanceBtn = document.querySelector('a[href="attendance.html"]');
    if (attendanceBtn) {
      attendanceBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log("Take attendance action triggered");
        alert("Attendance feature coming soon!");
      });
    }
    
    const messagingBtn = document.querySelector('a[href="messaging.html"]');
    if (messagingBtn) {
      messagingBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log("Send message action triggered");
        alert("Messaging feature coming soon!");
      });
    }
  }
  
  // Initialize the page when DOM is fully loaded
  document.addEventListener('DOMContentLoaded', () => {
    // Setup quick action buttons
    setupQuickActions();
    
    // Setup attendance buttons in schedule
    const attendanceButtons = document.querySelectorAll('button:has(span.material-symbols-outlined:contains("fact_check"))');
    attendanceButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const className = e.target.closest('li').querySelector('.font-medium').textContent;
        console.log(`Taking attendance for ${className}`);
        alert(`Taking attendance for ${className}`);
      });
    });
    
    // Setup materials buttons in schedule
    const materialsButtons = document.querySelectorAll('button:has(span.material-symbols-outlined:contains("file_download"))');
    materialsButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const className = e.target.closest('li').querySelector('.font-medium').textContent;
        console.log(`Downloading materials for ${className}`);
        alert(`Downloading materials for ${className}`);
      });
    });
    
    // Check for dark mode preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      // Re-initialize chart with updated colors
      initializePerformanceChart();
    });
  });
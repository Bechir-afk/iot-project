
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
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const menuLogout = document.getElementById('menu-logout');
    const menuUserName = document.getElementById('menu-user-name');
    const menuUserEmail = document.getElementById('menu-user-email');
    const menuUserRole = document.getElementById('menu-user-role');
    const userAvatar = document.getElementById('user-avatar');
    
    // Chart instances
    let attendanceTrendChart;
    let punctualityDistributionChart;
    let courseComparisonChart;
    let weeklyPatternChart;
    let timeOfDayChart;
    
    // Date range selections
    const dateRangeSelect = document.getElementById('date-range');
    const customDateRange = document.getElementById('custom-date-range');
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');
    const applyDateRange = document.getElementById('apply-date-range');
    
    // Export and share buttons
    const exportPdfBtn = document.getElementById('export-pdf');
    const exportCsvBtn = document.getElementById('export-csv');
    const shareReportBtn = document.getElementById('share-report');
    
    // Toggle view button
    const trendViewToggle = document.getElementById('trend-view-toggle');
    
    // Authentication state observer
    auth.onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in
        console.log("User is signed in:", user.email);
        
        // Update user email in dropdown
        menuUserEmail.textContent = user.email;
        
        // Get user profile from Firestore
        db.collection('users').doc(user.uid).get()
          .then((doc) => {
            if (doc.exists) {
              const userData = doc.data();
              const fullName = userData.firstName && userData.lastName ? 
                `${userData.firstName} ${userData.lastName}` : user.displayName || user.email;
              
              menuUserName.textContent = fullName;
              
              if (userData.role) {
                menuUserRole.textContent = userData.role;
              }
              
              if (userData.profileImage) {
                userAvatar.src = userData.profileImage;
              }
            }
          })
          .catch((error) => {
            console.error("Error getting user data:", error);
          });
          
        // Load analytics data
        loadAnalyticsData();
      } else {
        // User is signed out, redirect to login page
        window.location.href = 'login.html';
      }
    });
    
    // Toggle dropdown menu
    userMenuBtn.addEventListener('click', function() {
      userMenuDropdown.classList.toggle('hidden');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
      if (userMenuBtn && userMenuDropdown && 
          !userMenuBtn.contains(event.target) && 
          !userMenuDropdown.contains(event.target)) {
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
          showNotification('Error signing out. Please try again.', 'error');
        });
    }
    
    // Add event listeners for logout
    if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);
    if (menuLogout) menuLogout.addEventListener('click', logoutUser);
    
    // Date range change handler
    dateRangeSelect.addEventListener('change', function() {
      if (this.value === 'custom') {
        customDateRange.classList.remove('hidden');
      } else {
        customDateRange.classList.add('hidden');
        loadAnalyticsData();
      }
    });
    
    // Apply custom date range
    if (applyDateRange) {
      applyDateRange.addEventListener('click', function() {
        if (dateFrom.value && dateTo.value) {
          loadAnalyticsData();
        } else {
          // Show error notification
          console.error("Please select both start and end dates");
        }
      });
    }
    
    // Toggle chart view
    if (trendViewToggle) {
      trendViewToggle.addEventListener('click', function() {
        const currentType = attendanceTrendChart.config.type;
        const newType = currentType === 'bar' ? 'line' : 'bar';
        
        // Update button text
        this.textContent = newType === 'bar' ? 'Show as Line' : 'Show as Bar';
        
        // Update chart type
        attendanceTrendChart.destroy();
        createAttendanceTrendChart(newType);
      });
    }
    
    // Load analytics data based on selected date range
    function loadAnalyticsData() {
      const user = auth.currentUser;
      if (!user) return;
      
      const dateRange = dateRangeSelect.value;
      let startDate, endDate;
      
      // Get appropriate date range
      switch(dateRange) {
        case 'week':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          endDate = new Date();
          break;
        case 'month':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          endDate = new Date();
          break;
        case 'semester':
          // Assuming semester starts in January or September
          startDate = new Date();
          const currentMonth = startDate.getMonth();
          if (currentMonth >= 0 && currentMonth < 6) {
            // Spring semester
            startDate.setMonth(0, 1); // Jan 1
          } else {
            // Fall semester
            startDate.setMonth(8, 1); // Sep 1
          }
          endDate = new Date();
          break;
        case 'year':
          startDate = new Date();
          startDate.setMonth(0, 1); // Jan 1 of current year
          endDate = new Date();
          break;
        case 'custom':
          startDate = new Date(dateFrom.value);
          endDate = new Date(dateTo.value);
          endDate.setHours(23, 59, 59, 999); // End of the selected day
          break;
        default:
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          endDate = new Date();
      }
      
      // Convert to Firestore timestamps
      const startTimestamp = firebase.firestore.Timestamp.fromDate(startDate);
      const endTimestamp = firebase.firestore.Timestamp.fromDate(endDate);
      
      console.log("Loading analytics data from", startDate, "to", endDate);
      
      // Update summary statistics
      loadSummaryStats(user.uid, startTimestamp, endTimestamp);
      
      // Load attendance trend data
      loadAttendanceTrendData(user.uid, startTimestamp, endTimestamp);
      
      // Load punctuality distribution data
      loadPunctualityData(user.uid, startTimestamp, endTimestamp);
      
      // Load course comparison data
      loadCourseComparisonData(user.uid, startTimestamp, endTimestamp);
      
      // Load weekly pattern data
      loadWeeklyPatternData(user.uid, startTimestamp, endTimestamp);
      
      // Load time of day pattern data
      loadTimeOfDayData(user.uid, startTimestamp, endTimestamp);
      
      // Generate insights and recommendations (this would typically use AI/ML in a real system)
      generateInsightsAndRecommendations(user.uid, startTimestamp, endTimestamp);
    }
    
    // Load summary statistics
    function loadSummaryStats(userId, startTimestamp, endTimestamp) {
      db.collection('attendance')
        .where('userId', '==', userId)
        .where('dateTimestamp', '>=', startTimestamp)
        .where('dateTimestamp', '<=', endTimestamp)
        .get()
        .then((snapshot) => {
          // Sample data processing - in a real app, this would process real data
          const totalClasses = snapshot.size;
          let presentCount = 0;
          let totalEarlyLateMinutes = 0;
          let earlyDays = 0;
          let lateDays = 0;
          let onTimeDays = 0;
          
          // Process each attendance record
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            if (data.clockInTime) {
              presentCount++;
              
              if (data.earlyLateStatus === 'early') {
                totalEarlyLateMinutes -= data.earlyLateMinutes || 0;
                earlyDays++;
              } else if (data.earlyLateStatus === 'late') {
                totalEarlyLateMinutes += data.earlyLateMinutes || 0;
                lateDays++;
              } else {
                onTimeDays++;
              }
            }
          });
          
          // Calculate statistics
          const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
          const absenceCount = totalClasses - presentCount;
          const avgEarlyLate = presentCount > 0 ? Math.round(totalEarlyLateMinutes / presentCount) : 0;
          
          // Calculate consistency score (higher when attendance and punctuality are consistent)
          const attendanceConsistency = presentCount / totalClasses;
          const punctualityConsistency = (earlyDays + onTimeDays) / (earlyDays + onTimeDays + lateDays);
          const consistencyScore = Math.round(((attendanceConsistency * 0.6) + (punctualityConsistency * 0.4)) * 100);
          
          // Update UI
          document.getElementById('attendance-rate').textContent = `${attendanceRate}%`;
          document.getElementById('absence-count').textContent = absenceCount;
          document.getElementById('avg-arrival').textContent = avgEarlyLate > 0 ? `+${avgEarlyLate}m` : `${avgEarlyLate}m`;
          document.getElementById('consistency-score').textContent = `${consistencyScore}%`;
          
          // Set appropriate colors based on values
          document.getElementById('avg-arrival').style.color = avgEarlyLate <= 0 ? '#059669' : '#DC2626';
        })
        .catch((error) => {
          console.error("Error loading summary stats:", error);
        });
    }
    
    // Create attendance trend chart
    function createAttendanceTrendChart(type = 'bar') {
      const ctx = document.getElementById('attendanceTrendChart').getContext('2d');
      
      // Sample data - in a real app, this would come from Firebase
      const labels = ['Mar 28', 'Mar 29', 'Mar 30', 'Mar 31', 'Apr 1', 'Apr 2', 'Apr 3'];
      const data = [1, 0, 1, 1, 1, 0, 1]; // 1 = present, 0 = absent
      
      attendanceTrendChart = new Chart(ctx, {
        type: type,
        data: {
          labels: labels,
          datasets: [{
            label: 'Attendance',
            data: data,
            backgroundColor: data.map(value => value === 1 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'),
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: type === 'line' ? 2 : 1,
            tension: 0.2,
            fill: type === 'line' ? false : true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 1,
              ticks: {
                stepSize: 1,
                callback: function(value) {
                  return value === 0 ? 'Absent' : 'Present';
                }
              },
              grid: {
                color: 'rgba(156, 163, 175, 0.1)'
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.raw === 1 ? 'Present' : 'Absent';
                }
              }
            }
          }
        }
      });
    }
    
    // Load attendance trend data
    function loadAttendanceTrendData(userId, startTimestamp, endTimestamp) {
      // In a real application, fetch data from Firebase and update the chart
      // For now, just create a sample chart
      if (attendanceTrendChart) {
        attendanceTrendChart.destroy();
      }
      createAttendanceTrendChart('bar');
    }
    
    // Load punctuality distribution data
    function loadPunctualityData(userId, startTimestamp, endTimestamp) {
      const ctx = document.getElementById('punctualityDistributionChart').getContext('2d');
      
      // Sample data - in a real app, this would come from Firebase
      const data = {
        labels: [
          'Very Early (>15 mins)',
          'Early (5-15 mins)',
          'On Time (±5 mins)',
          'Late (5-15 mins)',
          'Very Late (>15 mins)'
        ],
        datasets: [{
          data: [5, 12, 20, 7, 3],
          backgroundColor: [
            'rgba(16, 185, 129, 0.7)',
            'rgba(34, 197, 94, 0.7)',
            'rgba(59, 130, 246, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(239, 68, 68, 0.7)'
          ],
          borderWidth: 1
        }]
      };
      
      if (punctualityDistributionChart) {
        punctualityDistributionChart.destroy();
      }
      
      punctualityDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
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
    
    // Load course comparison data
    function loadCourseComparisonData(userId, startTimestamp, endTimestamp) {
      const ctx = document.getElementById('courseComparisonChart').getContext('2d');
      
      // Sample data - in a real app, this would come from Firebase
      const data = {
        labels: [
          'Data Structures',
          'Web Development',
          'Database Systems',
          'Operating Systems',
          'Computer Networks',
          'AI Fundamentals'
        ],
        datasets: [
          {
            label: 'Attendance Rate',
            data: [95, 87, 78, 92, 88, 94],
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            order: 2
          },
          {
            label: 'Avg. Arrival (mins relative to start)',
            data: [-5, 3, 8, -2, 1, -4],
            type: 'line',
            borderColor: 'rgba(245, 158, 11, 1)',
            backgroundColor: 'rgba(245, 158, 11, 0.5)',
            borderWidth: 2,
            order: 1,
            yAxisID: 'y1'
          }
        ]
      };
      
      if (courseComparisonChart) {
        courseComparisonChart.destroy();
      }
      
      courseComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Attendance Rate (%)'
              },
              grid: {
                color: 'rgba(156, 163, 175, 0.1)'
              }
            },
            y1: {
              position: 'right',
              beginAtZero: false,
              min: -15,
              max: 15,
              title: {
                display: true,
                text: 'Avg. Arrival Time (mins)'
              },
              grid: {
                display: false
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
    
    // Load weekly pattern data
    function loadWeeklyPatternData(userId, startTimestamp, endTimestamp) {
      const ctx = document.getElementById('weeklyPatternChart').getContext('2d');
      
      // Sample data - in a real app, this would come from Firebase
      const data = {
        labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        datasets: [
          {
            label: 'Attendance Rate',
            data: [83, 92, 97, 90, 88],
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            order: 2
          }
        ]
      };
      
      if (weeklyPatternChart) {
        weeklyPatternChart.destroy();
      }
      
      weeklyPatternChart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Attendance Rate (%)'
              },
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
    
    // Load time of day pattern data
    function loadTimeOfDayData(userId, startTimestamp, endTimestamp) {
      const ctx = document.getElementById('timeOfDayChart').getContext('2d');
      
      // Sample data - in a real app, this would come from Firebase
      const data = {
        labels: ['8-10 AM', '10-12 PM', '12-2 PM', '2-4 PM', '4-6 PM'],
        datasets: [
          {
            label: 'Attendance Rate',
            data: [85, 93, 90, 95, 88],
            backgroundColor: 'rgba(16, 185, 129, 0.5)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 1,
            order: 2
          },
          {
            label: 'Avg. Arrival Time (mins)',
            data: [7, 2, -3, -5, 1],
            type: 'line',
            borderColor: 'rgba(245, 158, 11, 1)',
            backgroundColor: 'rgba(245, 158, 11, 0.5)',
            borderWidth: 2,
            order: 1,
            yAxisID: 'y1'
          }
        ]
      };
      
      if (timeOfDayChart) {
        timeOfDayChart.destroy();
      }
      
      timeOfDayChart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Attendance Rate (%)'
              },
              grid: {
                color: 'rgba(156, 163, 175, 0.1)'
              }
            },
            y1: {
              position: 'right',
              beginAtZero: false,
              min: -10,
              max: 10,
              title: {
                display: true,
                text: 'Avg. Arrival (mins)'
              },
              grid: {
                display: false
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
    
    // Generate insights and recommendations based on data analysis
    function generateInsightsAndRecommendations(userId, startTimestamp, endTimestamp) {
      // In a real application, this would analyze data and generate insights
      // For now, we'll just use the static examples in the HTML
      console.log("Generating insights for user", userId);
    }
    
    // Export PDF report
    if (exportPdfBtn) {
      exportPdfBtn.addEventListener('click', function() {
        console.log("Export PDF functionality would be implemented here");
        alert("This feature would generate a PDF report of your attendance analytics.");
      });
    }
    
    // Export CSV data
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', function() {
        console.log("Export CSV functionality would be implemented here");
        alert("This feature would export your raw attendance data as a CSV file.");
      });
    }
    
    // Share report
    if (shareReportBtn) {
      shareReportBtn.addEventListener('click', function() {
        console.log("Share report functionality would be implemented here");
        alert("This feature would allow you to share your analytics report with instructors or advisors.");
      });
    }
    
    // Initialize page when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
      console.log("Analytics page loaded");
      
      // Set default date range values for custom range
      const today = new Date();
      const lastMonth = new Date();
      lastMonth.setDate(lastMonth.getDate() - 30);
      
      if (dateFrom) dateFrom.valueAsDate = lastMonth;
      if (dateTo) dateTo.valueAsDate = today;
    });
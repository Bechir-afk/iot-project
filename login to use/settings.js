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
  let currentUser = null;
  
  // DOM Elements
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userMenuDropdown = document.getElementById('user-menu-dropdown');
  const logoutBtn = document.getElementById('logout-btn');
  const menuLogout = document.getElementById('menu-logout');
  const menuUserName = document.getElementById('menu-user-name');
  const menuUserEmail = document.getElementById('menu-user-email');
  const menuUserRole = document.getElementById('menu-user-role');
  const userAvatar = document.getElementById('user-avatar');
  
  // Settings form elements
  const firstNameInput = document.getElementById('first-name');
  const lastNameInput = document.getElementById('last-name');
  const emailInput = document.getElementById('email');
  const studentIdInput = document.getElementById('student-id');
  const currentPasswordInput = document.getElementById('current-password');
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  
  // Settings tab buttons and content
  const settingsTabs = document.querySelectorAll('.settings-tab');
  const settingsContents = document.querySelectorAll('.settings-content');
  
  // Save buttons
  const saveProfileBtn = document.getElementById('save-profile');
  const changePasswordBtn = document.getElementById('change-password-btn');
  const saveNotificationsBtn = document.getElementById('save-notifications');
  const saveAppearanceBtn = document.getElementById('save-appearance');
  const savePrivacyBtn = document.getElementById('save-privacy');
  const deleteAccountBtn = document.getElementById('delete-account-btn');
  
  // Authentication state observer
  auth.onAuthStateChanged(function(user) {
    if (user) {
      currentUser = user;
      loadUserData();
      setupEventListeners();
    } else {
      // Redirect to login if not authenticated
      window.location.href = 'login.html';
    }
  });
  
  // Load user data from Firebase
  function loadUserData() {
    if (!currentUser) return;
    
    // Update user email
    if (menuUserEmail) menuUserEmail.textContent = currentUser.email;
    if (emailInput) emailInput.value = currentUser.email;
    
    // Get user profile from Firestore
    db.collection('users').doc(currentUser.uid).get()
      .then((doc) => {
        if (doc.exists) {
          const userData = doc.data();
          
          // Update display name
          const fullName = userData.firstName && userData.lastName ? 
            `${userData.firstName} ${userData.lastName}` : 
            currentUser.displayName || currentUser.email;
          
          if (menuUserName) menuUserName.textContent = fullName;
          
          // Update form fields
          if (firstNameInput) firstNameInput.value = userData.firstName || '';
          if (lastNameInput) lastNameInput.value = userData.lastName || '';
          if (studentIdInput) studentIdInput.value = userData.studentId || '';
          
          // Update role display
          if (menuUserRole && userData.role) {
            menuUserRole.textContent = userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
          }
          
          // Load saved preferences
          loadUserPreferences(userData);
        }
      })
      .catch((error) => {
        console.error("Error getting user data:", error);
        showNotification('Error loading profile data', 'error');
      });
  }
  
  // Load user preferences
  function loadUserPreferences(userData) {
    const prefs = userData.preferences || {};
    
    // Load notification preferences
    const emailNotif = document.getElementById('email-notifications');
    const attendanceAlerts = document.getElementById('attendance-alerts');
    const scheduleChanges = document.getElementById('schedule-changes');
    const systemAnnouncements = document.getElementById('system-announcements');
    
    if (emailNotif) emailNotif.checked = prefs.emailNotifications !== false;
    if (attendanceAlerts) attendanceAlerts.checked = prefs.attendanceAlerts !== false;
    if (scheduleChanges) scheduleChanges.checked = prefs.scheduleChanges !== false;
    if (systemAnnouncements) systemAnnouncements.checked = prefs.systemAnnouncements !== false;
    
    // Load privacy settings
    const dataSharing = document.getElementById('data-sharing');
    const locationServices = document.getElementById('location-services');
    const deviceIdentification = document.getElementById('device-identification');
    
    if (dataSharing) dataSharing.checked = prefs.dataSharing !== false;
    if (locationServices) locationServices.checked = prefs.locationServices === true;
    if (deviceIdentification) deviceIdentification.checked = prefs.deviceIdentification !== false;
    
    // Load appearance settings
    const theme = prefs.theme || 'system';
    document.querySelectorAll('.theme-option').forEach(option => {
      if (option.dataset.theme === theme) {
        option.querySelector('button').classList.add('ring-2', 'ring-blue-500');
      }
    });
    
    const fontSize = prefs.fontSize || 'md';
    document.querySelectorAll('.font-size-option').forEach(option => {
      if (option.dataset.size === fontSize) {
        option.classList.add('ring-2', 'ring-blue-500');
      }
    });
  }
  
  // Setup event listeners
  function setupEventListeners() {
    // Toggle dropdown menu
    if (userMenuBtn && userMenuDropdown) {
      userMenuBtn.addEventListener('click', function() {
        userMenuDropdown.classList.toggle('hidden');
      });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
      if (userMenuBtn && userMenuDropdown && 
          !userMenuBtn.contains(event.target) && 
          !userMenuDropdown.contains(event.target)) {
        userMenuDropdown.classList.add('hidden');
      }
    });
    
    // Logout buttons
    if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);
    if (menuLogout) menuLogout.addEventListener('click', logoutUser);
    
    // Settings tab navigation
    settingsTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const tabId = this.dataset.tab;
        
        // Update active tab styling
        settingsTabs.forEach(t => {
          t.classList.remove('text-blue-600', 'dark:text-blue-400', 'border-b-2', 'border-blue-500');
          t.classList.add('text-gray-500', 'dark:text-gray-400');
        });
        
        this.classList.remove('text-gray-500', 'dark:text-gray-400');
        this.classList.add('text-blue-600', 'dark:text-blue-400', 'border-b-2', 'border-blue-500');
        
        // Show/hide tab content
        settingsContents.forEach(content => {
          content.classList.add('hidden');
        });
        
        document.getElementById(`${tabId}-tab`).classList.remove('hidden');
      });
    });
    
    // Save profile information
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', saveProfileInfo);
    }
    
    // Change password
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener('click', changePassword);
    }
    
    // Save notification preferences
    if (saveNotificationsBtn) {
      saveNotificationsBtn.addEventListener('click', saveNotifications);
    }
    
    // Save appearance settings
    if (saveAppearanceBtn) {
      saveAppearanceBtn.addEventListener('click', saveAppearance);
    }
    
    // Save privacy settings
    if (savePrivacyBtn) {
      savePrivacyBtn.addEventListener('click', savePrivacy);
    }
    
    // Delete account
    if (deleteAccountBtn) {
      deleteAccountBtn.addEventListener('click', confirmDeleteAccount);
    }
    
    // Theme options - REPLACE the existing event listener
    document.querySelectorAll('.theme-option').forEach(option => {
      option.addEventListener('click', function() {
        const selectedTheme = this.dataset.theme;
        
        // Update UI
        document.querySelectorAll('.theme-option button').forEach(btn => {
          btn.classList.remove('ring-2', 'ring-blue-500');
        });
        this.querySelector('button').classList.add('ring-2', 'ring-blue-500');
        
        // Apply theme immediately
        applyTheme(selectedTheme);
        
        // Save to localStorage for persistence
        localStorage.setItem('theme', selectedTheme);
      });
    });
    
    // Font size options - REPLACE the existing event listener
    document.querySelectorAll('.font-size-option').forEach(option => {
      option.addEventListener('click', function() {
        const selectedSize = this.dataset.size;
        
        // Update UI
        document.querySelectorAll('.font-size-option').forEach(opt => {
          opt.classList.remove('ring-2', 'ring-blue-500');
        });
        this.classList.add('ring-2', 'ring-blue-500');
        
        // Apply font size immediately
        applyFontSize(selectedSize);
        
        // Save to localStorage for persistence
        localStorage.setItem('fontSize', selectedSize);
      });
    });
  }
  
  // Save profile information
  function saveProfileInfo() {
    if (!currentUser) return;
    
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    
    // Validate
    if (!firstName || !lastName) {
      showNotification('Please fill in all required fields', 'warning');
      return;
    }
    
    // Update Firestore
    db.collection('users').doc(currentUser.uid).update({
      firstName: firstName,
      lastName: lastName,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      // Update display name in auth
      currentUser.updateProfile({
        displayName: `${firstName} ${lastName}`
      }).then(() => {
        // Update UI
        if (menuUserName) menuUserName.textContent = `${firstName} ${lastName}`;
        showNotification('Profile updated successfully', 'success');
      });
    })
    .catch((error) => {
      console.error("Error updating profile:", error);
      showNotification('Error updating profile', 'error');
    });
  }
  
  // Change password
  function changePassword() {
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Validate
    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification('Please fill in all password fields', 'warning');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showNotification('New passwords do not match', 'warning');
      return;
    }
    
    if (newPassword.length < 6) {
      showNotification('Password must be at least 6 characters', 'warning');
      return;
    }
    
    // Re-authenticate user
    const credential = firebase.auth.EmailAuthProvider.credential(
      currentUser.email,
      currentPassword
    );
    
    currentUser.reauthenticateWithCredential(credential)
      .then(() => {
        // Change password
        return currentUser.updatePassword(newPassword);
      })
      .then(() => {
        // Clear form fields
        currentPasswordInput.value = '';
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
        
        showNotification('Password updated successfully', 'success');
      })
      .catch((error) => {
        console.error("Error updating password:", error);
        if (error.code === 'auth/wrong-password') {
          showNotification('Current password is incorrect', 'error');
        } else {
          showNotification('Error updating password: ' + error.message, 'error');
        }
      });
  }
  
  // Save notification preferences
  function saveNotifications() {
    if (!currentUser) return;
    
    const preferences = {
      emailNotifications: document.getElementById('email-notifications').checked,
      attendanceAlerts: document.getElementById('attendance-alerts').checked,
      scheduleChanges: document.getElementById('schedule-changes').checked,
      systemAnnouncements: document.getElementById('system-announcements').checked
    };
    
    updateUserPreferences({ notifications: preferences });
  }
  
  // Save appearance settings
  function saveAppearance() {
    if (!currentUser) return;
    
    let selectedTheme = 'system';
    document.querySelectorAll('.theme-option').forEach(option => {
      if (option.querySelector('button').classList.contains('ring-2')) {
        selectedTheme = option.dataset.theme;
      }
    });
    
    let selectedFontSize = 'md';
    document.querySelectorAll('.font-size-option').forEach(option => {
      if (option.classList.contains('ring-2')) {
        selectedFontSize = option.dataset.size;
      }
    });
    
    const preferences = {
      theme: selectedTheme,
      fontSize: selectedFontSize
    };
    
    // Save to localStorage for persistence between page loads
    localStorage.setItem('theme', selectedTheme);
    localStorage.setItem('fontSize', selectedFontSize);
    
    // Save to Firestore for persistence across devices
    updateUserPreferences({ appearance: preferences });
    
    // Apply theme and font size immediately
    applyTheme(selectedTheme);
    applyFontSize(selectedFontSize);
    
    showNotification('Appearance settings saved successfully', 'success');
  }
  
  // Save privacy settings
  function savePrivacy() {
    if (!currentUser) return;
    
    const preferences = {
      dataSharing: document.getElementById('data-sharing').checked,
      locationServices: document.getElementById('location-services').checked,
      deviceIdentification: document.getElementById('device-identification').checked
    };
    
    updateUserPreferences({ privacy: preferences });
  }
  
  // Update user preferences in Firestore
  function updateUserPreferences(prefsToUpdate) {
    if (!currentUser) return;
    
    // Get current preferences first
    db.collection('users').doc(currentUser.uid).get()
      .then((doc) => {
        const userData = doc.exists ? doc.data() : {};
        const currentPrefs = userData.preferences || {};
        
        // Merge with new preferences
        const mergedPrefs = { ...currentPrefs };
        
        if (prefsToUpdate.notifications) {
          mergedPrefs.emailNotifications = prefsToUpdate.notifications.emailNotifications;
          mergedPrefs.attendanceAlerts = prefsToUpdate.notifications.attendanceAlerts;
          mergedPrefs.scheduleChanges = prefsToUpdate.notifications.scheduleChanges;
          mergedPrefs.systemAnnouncements = prefsToUpdate.notifications.systemAnnouncements;
        }
        
        if (prefsToUpdate.appearance) {
          mergedPrefs.theme = prefsToUpdate.appearance.theme;
          mergedPrefs.fontSize = prefsToUpdate.appearance.fontSize;
        }
        
        if (prefsToUpdate.privacy) {
          mergedPrefs.dataSharing = prefsToUpdate.privacy.dataSharing;
          mergedPrefs.locationServices = prefsToUpdate.privacy.locationServices;
          mergedPrefs.deviceIdentification = prefsToUpdate.privacy.deviceIdentification;
        }
        
        // Update in Firestore
        return db.collection('users').doc(currentUser.uid).update({
          preferences: mergedPrefs,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      })
      .then(() => {
        showNotification('Preferences updated successfully', 'success');
      })
      .catch((error) => {
        console.error("Error updating preferences:", error);
        showNotification('Error updating preferences', 'error');
      });
  }
  
  // Apply theme based on preference
  function applyTheme(theme) {
    // First, remove any existing theme-related classes
    document.documentElement.classList.remove('dark', 'light', 'system-theme');
    document.body.classList.remove('dark-theme', 'light-theme');
    
    console.log(`Applying theme: ${theme}`);
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-theme');
    } else if (theme === 'light') {
      // Light theme is the default, so just make sure dark is removed
      document.documentElement.classList.remove('dark');
      document.body.classList.add('light-theme');
    } else {
      // System theme
      document.documentElement.classList.add('system-theme');
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark-theme');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.add('light-theme');
      }
      
      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (localStorage.getItem('theme') !== 'system') return;
        
        if (event.matches) {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark-theme');
          document.body.classList.remove('light-theme');
        } else {
          document.documentElement.classList.remove('dark');
          document.body.classList.add('light-theme');
          document.body.classList.remove('dark-theme');
        }
      });
    }
    
    // For debugging
    const isDark = document.documentElement.classList.contains('dark');
    console.log(`Dark mode applied: ${isDark}`);
  }
  
  // Apply font size based on preference
  function applyFontSize(size) {
    // Store the size identifier as a data attribute
    document.body.dataset.fontSize = size;
    
    // Map size identifiers to actual values
    const sizeMap = {
      'sm': '0.875rem',
      'md': '1rem',
      'lg': '1.125rem',
      'xl': '1.25rem'
    };
    
    // Set CSS variables for font sizes
    document.documentElement.style.setProperty('--base-font-size', sizeMap[size] || '1rem');
    document.documentElement.style.setProperty('--small-font-size', `calc(${sizeMap[size]} * 0.875)` || '0.875rem');
    document.documentElement.style.setProperty('--large-font-size', `calc(${sizeMap[size]} * 1.125)` || '1.125rem');
    
    // Apply CSS class to trigger styles
    document.body.classList.remove('font-sm', 'font-md', 'font-lg', 'font-xl');
    document.body.classList.add(`font-${size}`);
    
    // Log the font size change
    console.log("Font size applied:", size);
  }
  
  // Confirm account deletion
  function confirmDeleteAccount() {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone!")) {
      deleteAccount();
    }
  }
  
  // Delete account
  function deleteAccount() {
    if (!currentUser) return;
    
    // First delete user data from Firestore
    db.collection('users').doc(currentUser.uid).delete()
      .then(() => {
        // Then delete attendance records
        return db.collection('attendance')
          .where('userId', '==', currentUser.uid)
          .get()
          .then((snapshot) => {
            const batch = db.batch();
            snapshot.forEach((doc) => {
              batch.delete(doc.ref);
            });
            return batch.commit();
          });
      })
      .then(() => {
        // Finally delete the auth account
        return currentUser.delete();
      })
      .then(() => {
        window.location.href = 'login.html';
      })
      .catch((error) => {
        console.error("Error deleting account:", error);
        
        if (error.code === 'auth/requires-recent-login') {
          showNotification('Please log out and log in again to delete your account', 'warning');
        } else {
          showNotification('Error deleting account: ' + error.message, 'error');
        }
      });
  }
  
  // Logout function
  function logoutUser() {
    auth.signOut()
      .then(() => {
        window.location.href = 'login.html';
      })
      .catch((error) => {
        console.error("Error signing out: ", error);
        showNotification('Error signing out', 'error');
      });
  }
  
  // Show notification
  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 rounded-md shadow-lg p-4 max-w-md transform transition-all duration-300 ease-in-out translate-y-0';
    
    // Set background color based on type
    switch(type) {
      case 'success':
        notification.classList.add('bg-green-500', 'text-white');
        break;
      case 'error':
        notification.classList.add('bg-red-500', 'text-white');
        break;
      case 'warning':
        notification.classList.add('bg-yellow-500', 'text-white');
        break;
      default:
        notification.classList.add('bg-blue-500', 'text-white');
    }
    
    notification.innerHTML = `
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <span class="material-symbols-outlined">${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info'}</span>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">${message}</p>
        </div>
        <div class="ml-auto pl-3">
          <button type="button" class="inline-flex text-white focus:outline-none">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Set up close button
    notification.querySelector('button').addEventListener('click', () => {
      notification.classList.add('opacity-0', '-translate-y-4');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('opacity-0', '-translate-y-4');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 5000);
  }
  
  // Add CSS for switch toggle (if not in your CSS file)
  document.head.insertAdjacentHTML('beforeend', `
  
  `);
  
  // Initialize user interface when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    // Apply user's saved theme and font size if available
    const userTheme = localStorage.getItem('theme');
    const userFontSize = localStorage.getItem('fontSize');
    
    if (userTheme) applyTheme(userTheme);
    if (userFontSize) applyFontSize(userFontSize);
  });

// MODIFY the DOMContentLoaded event handler to properly apply saved settings
document.addEventListener('DOMContentLoaded', function() {
  // Get user's saved preferences from localStorage or cookies
  const userTheme = localStorage.getItem('theme') || 'system';
  const userFontSize = localStorage.getItem('fontSize') || 'md';
  
  // Apply saved preferences
  applyTheme(userTheme);
  applyFontSize(userFontSize);
  
  // Update UI to match settings
  // For theme
  document.querySelectorAll('.theme-option').forEach(option => {
    const btn = option.querySelector('button');
    if (option.dataset.theme === userTheme) {
      btn.classList.add('ring-2', 'ring-blue-500');
    } else {
      btn.classList.remove('ring-2', 'ring-blue-500');
    }
  });
  
  // For font size
  document.querySelectorAll('.font-size-option').forEach(option => {
    if (option.dataset.size === userFontSize) {
      option.classList.add('ring-2', 'ring-blue-500');
    } else {
      option.classList.remove('ring-2', 'ring-blue-500');
    }
  });
  
  console.log("Initial preferences applied:", { theme: userTheme, fontSize: userFontSize });
});
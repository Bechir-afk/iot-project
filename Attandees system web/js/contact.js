
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
    const contactForm = document.getElementById('contact-form');
    const sendMessageBtn = document.getElementById('send-message-btn');

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
              
              menuUserName.textContent = fullName;
              menuUserRole.textContent = userData.role || 'Student';
              
              // Pre-fill contact form with user info
              document.getElementById('full-name').value = fullName;
              document.getElementById('email').value = user.email;
            }
          })
          .catch((error) => {
            console.error("Error getting user data:", error);
          });
      } else {
        // Redirect to login if not authenticated
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

    // Logout functionality
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

    if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);
    if (menuLogout) menuLogout.addEventListener('click', logoutUser);

    // Contact form submission
    contactForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      if (!currentUser) {
        showNotification('You must be logged in to send a message', 'error');
        return;
      }
      
      const fullName = document.getElementById('full-name').value.trim();
      const email = document.getElementById('email').value.trim();
      const subject = document.getElementById('subject').value.trim();
      const message = document.getElementById('message').value.trim();
      const sendCopy = document.getElementById('copy-to-email').checked;
      
      // Validate inputs
      if (!fullName || !email || !subject || !message) {
        showNotification('Please fill in all required fields', 'error');
        return;
      }
      
      // Disable button and show loading state
      sendMessageBtn.disabled = true;
      sendMessageBtn.innerHTML = '<span class="material-symbols-outlined animate-spin mr-2">sync</span>Sending...';
      
      // Prepare email parameters
      const emailParams = {
        from_name: fullName,
        from_email: email,
        to_email: 'islem.bousleh@etudiant-fst.utm.tn',
        subject: subject,
        message: message,
        reply_to: email,
        user_id: currentUser.uid
      };
      
      // Send email using EmailJS
      emailjs.send('service_oy1s3ik', 'template_k3j6iar', emailParams)
        .then(function() {
          // Success handling
          contactForm.reset();
          showNotification('Message sent successfully!', 'success');
          
          // Reset button state
          sendMessageBtn.disabled = false;
          sendMessageBtn.innerHTML = '<span class="material-symbols-outlined mr-2">send</span>Send Message';
        })
        .catch((error) => {
          console.error("Error sending message:", error);
          showNotification('Error sending message. Please try again later.', 'error');
          
          // Reset button state
          sendMessageBtn.disabled = false;
          sendMessageBtn.innerHTML = '<span class="material-symbols-outlined mr-2">send</span>Send Message';
        });
    });

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
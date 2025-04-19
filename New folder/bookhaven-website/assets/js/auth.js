/**
 * BookHaven - Authentication Module
 * Handles login, signup, and user session management
 */

document.addEventListener('DOMContentLoaded', function() {
  // Handle login form submission
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Setup password visibility toggle
  const togglePassword = document.querySelector('.toggle-password');
  if (togglePassword) {
    togglePassword.addEventListener('click', function() {
      const passwordInput = document.getElementById('password');
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      this.querySelector('i').classList.toggle('bi-eye');
      this.querySelector('i').classList.toggle('bi-eye-slash');
    });
  }

  // Check if user is already logged in
  checkLoginStatus();
});

/**
 * Handle login form submission
 */
function handleLogin(event) {
  event.preventDefault();
  
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberMe = document.getElementById('remember-me');
  const errorBox = document.getElementById('login-error');
  
  // Basic validation
  if (!emailInput.value || !passwordInput.value) {
    showError(errorBox, 'Please enter both email and password');
    return;
  }
  
  // Clear previous errors
  hideError(errorBox);
  
  // Show loading state
  const submitButton = loginForm.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.innerHTML;
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
  submitButton.disabled = true;
  
  // Simulate login API request (replace with actual API call)
  setTimeout(function() {
    // Demo accounts for testing - in a real app this would be handled by backend
    const demoAccounts = [
      { email: 'user@example.com', password: 'password123' },
      { email: 'admin@bookhaven.com', password: 'admin123' }
    ];
    
    const account = demoAccounts.find(acc => 
      acc.email === emailInput.value && acc.password === passwordInput.value
    );
    
    if (account) {
      // Successful login
      const userData = {
        email: account.email,
        name: account.email.split('@')[0],
        loginTime: new Date().toISOString()
      };
      
      // Store user data
      if (rememberMe.checked) {
        localStorage.setItem('bookhavenUser', JSON.stringify(userData));
      } else {
        sessionStorage.setItem('bookhavenUser', JSON.stringify(userData));
      }
      
      // Redirect to homepage or previous page
      const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
      window.location.href = redirectUrl;
    } else {
      // Failed login
      showError(errorBox, 'Invalid email or password');
      
      // Reset button
      submitButton.innerHTML = originalButtonText;
      submitButton.disabled = false;
    }
  }, 1000);
}

/**
 * Check if user is already logged in
 */
function checkLoginStatus() {
  const user = JSON.parse(localStorage.getItem('bookhavenUser')) || 
               JSON.parse(sessionStorage.getItem('bookhavenUser'));
  
  if (user) {
    // Update UI for logged in user
    updateUIForLoggedInUser(user);
    
    // If on login page, redirect to home
    if (window.location.pathname.includes('login.html')) {
      window.location.href = 'index.html';
    }
  }
}

/**
 * Update UI elements for logged in user
 */
function updateUIForLoggedInUser(user) {
  const authButtons = document.querySelector('.auth-buttons');
  if (authButtons) {
    authButtons.innerHTML = `
      <div class="dropdown">
        <button class="btn btn-outline-dark dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-person-circle me-1"></i> ${user.name}
        </button>
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
          <li><a class="dropdown-item" href="profile.html"><i class="bi bi-person me-2"></i>My Profile</a></li>
          <li><a class="dropdown-item" href="orders.html"><i class="bi bi-bag me-2"></i>My Orders</a></li>
          <li><a class="dropdown-item" href="wishlist.html"><i class="bi bi-heart me-2"></i>Wishlist</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#" id="logout-btn"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
        </ul>
      </div>
    `;
    
    // Add logout functionality
    document.getElementById('logout-btn').addEventListener('click', function(event) {
      event.preventDefault();
      localStorage.removeItem('bookhavenUser');
      sessionStorage.removeItem('bookhavenUser');
      window.location.reload();
    });
  }
}

/**
 * Show error message
 */
function showError(element, message) {
  element.textContent = message;
  element.classList.remove('d-none');
}

/**
 * Hide error message
 */
function hideError(element) {
  element.textContent = '';
  element.classList.add('d-none');
}
// Function to toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const darkModeText = document.getElementById('dark-mode-text');
    if (document.body.classList.contains('dark-mode')) {
        darkModeText.textContent = 'Light Mode';
        showNotification('Dark mode enabled.', 'success');
    } else {
        darkModeText.textContent = 'Dark Mode';
        showNotification('Light mode enabled.', 'success');
    }
}

// Function to handle login
function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        showNotification('Please enter both email and password.', 'error');
        return;
    }

    // Simulate login (replace with actual authentication logic)
    showNotification('Login successful!', 'success');
    // Example: Redirect to dashboard after login
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 2000);
}

// Function to handle signup
function signup() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        showNotification('Please enter both email and password.', 'error');
        return;
    }

    // Simulate signup (replace with actual signup logic)
    showNotification('Signup successful! Please verify your email.', 'success');
}

// Function to reset password
function resetPassword() {
    const email = document.getElementById('email').value.trim();

    if (!email) {
        showNotification('Please enter your email address.', 'error');
        return;
    }

    // Simulate password reset (replace with actual password reset logic)
    showNotification('Password reset email sent!', 'success');
}

// Function to handle clock in
function clockIn() {
    const userId = document.getElementById('user-id').value.trim();

    if (!userId) {
        showNotification('Please enter a User ID.', 'error');
        return;
    }

    // Simulate clock-in (replace with actual logic)
    showNotification(`User ${userId} clocked in successfully.`, 'success');
}

// Function to handle clock out
function clockOut() {
    const userId = document.getElementById('user-id').value.trim();

    if (!userId) {
        showNotification('Please enter a User ID.', 'error');
        return;
    }

    // Simulate clock-out (replace with actual logic)
    showNotification(`User ${userId} clocked out successfully.`, 'success');
}

// Function to filter records by User ID
function filterByUserId() {
    const userId = document.getElementById('filter-user-id').value.trim();

    if (!userId) {
        showNotification('Please enter a User ID to filter.', 'error');
        return;
    }

    // Simulate filtering (replace with actual logic)
    showNotification(`Filtering records for User ID: ${userId}`, 'success');
}

// Function to reset filters
function resetFilters() {
    document.getElementById('filter-user-id').value = '';
    document.getElementById('filter-date').value = '';
    showNotification('Filters reset successfully.', 'success');
}

// Function to export data to Excel
function exportToExcel() {
    // Simulate export (replace with actual export logic using XLSX library)
    showNotification('Data exported to Excel successfully.', 'success');
}

// Function to update language
function updateLanguage() {
    const language = document.getElementById('language-selector').value;
    showNotification(`Language updated to: ${language}`, 'success');
}

// Function to toggle password visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const togglePasswordText = document.getElementById('toggle-password-text');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        togglePasswordText.textContent = 'Hide Password';
    } else {
        passwordInput.type = 'password';
        togglePasswordText.textContent = 'Show Password';
    }
}

// Function to handle logout
function logout() {
    // Simulate logout (replace with actual logout logic)
    showNotification('Logged out successfully.', 'success');
    setTimeout(() => {
        window.location.href = 'login.html'; // Redirect to login page
    }, 2000);
}

// Helper function to show notifications
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
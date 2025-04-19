/**
 * BookHaven - Signup Page Functionality
 * Handles form validation, password strength checking, and form submission
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('signup-form');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm-password');
    const togglePassword = document.querySelector('.toggle-password');
    const strengthMeter = document.querySelector('.password-strength-meter');
    const strengthText = document.querySelector('.password-strength-text');
    const strengthSections = document.querySelectorAll('.strength-section');
    
    // Password visibility toggle
    togglePassword.addEventListener('click', function() {
      const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
      password.setAttribute('type', type);
      this.querySelector('i').classList.toggle('bi-eye');
      this.querySelector('i').classList.toggle('bi-eye-slash');
    });
    
    // Password strength checker
    password.addEventListener('input', function() {
      const value = password.value;
      const lengthValid = value.length >= 8;
      const uppercaseValid = /[A-Z]/.test(value);
      const numberValid = /[0-9]/.test(value);
      const specialValid = /[^A-Za-z0-9]/.test(value);
      
      document.getElementById('length-check').classList.toggle('text-success', lengthValid);
      document.getElementById('uppercase-check').classList.toggle('text-success', uppercaseValid);
      document.getElementById('number-check').classList.toggle('text-success', numberValid);
      document.getElementById('special-check').classList.toggle('text-success', specialValid);
      
      let strength = 0;
      if (value.length > 0) strength++;
      if (lengthValid && uppercaseValid) strength++;
      if (numberValid && specialValid) strength++;
      
      // Update strength meter
      strengthSections.forEach((section, index) => {
        section.className = 'strength-section';
        if (index < strength) {
          if (strength === 1) section.classList.add('bg-danger');
          if (strength === 2) section.classList.add('bg-warning');
          if (strength === 3) section.classList.add('bg-success');
        } else {
          section.classList.add('bg-light');
        }
      });
      
      // Update strength text
      if (value.length === 0) {
        strengthText.textContent = 'Password strength';
        strengthText.className = 'password-strength-text text-muted';
      } else if (strength === 1) {
        strengthText.textContent = 'Weak';
        strengthText.className = 'password-strength-text text-danger';
      } else if (strength === 2) {
        strengthText.textContent = 'Medium';
        strengthText.className = 'password-strength-text text-warning';
      } else {
        strengthText.textContent = 'Strong';
        strengthText.className = 'password-strength-text text-success';
      }
    });
    
    // Form validation
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      
      if (!form.checkValidity()) {
        event.stopPropagation();
        form.classList.add('was-validated');
        return;
      }
      
      // Check if passwords match
      if (password.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity('Passwords do not match');
        form.classList.add('was-validated');
        return;
      } else {
        confirmPassword.setCustomValidity('');
      }
      
      // If validation passed, submit the form (or simulate submission)
      showSuccessMessage();
    });
    
    // Show success message after form submission
    function showSuccessMessage() {
      const formContainer = form.parentElement;
      formContainer.innerHTML = `
        <div class="text-center py-5">
          <div class="mb-4 text-success">
            <i class="bi bi-check-circle-fill" style="font-size: 5rem;"></i>
          </div>
          <h2 class="mb-3">Account Created Successfully!</h2>
          <p class="mb-4">Thank you for joining BookHaven. A confirmation email has been sent to your email address.</p>
          <div class="d-grid gap-2 col-md-6 mx-auto">
            <a href="index.html" class="btn btn-primary">Go to Homepage</a>
            <a href="shop.html" class="btn btn-outline-primary">Start Shopping</a>
          </div>
        </div>
      `;
    }
    
    // Confirm password validation
    confirmPassword.addEventListener('input', function() {
      if (password.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity('Passwords do not match');
      } else {
        confirmPassword.setCustomValidity('');
      }
    });
  });
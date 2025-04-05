// Theme management for the entire application

// Function to apply theme across the application
function applyTheme(theme) {
  // First, remove any existing theme-related classes
  document.documentElement.classList.remove('dark', 'light', 'system-theme');
  document.body.classList.remove('dark-theme', 'light-theme');
  
  console.log(`Applying theme: ${theme}`);
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark-theme');
  } else if (theme === 'light') {
    // Light theme is the default
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
}

// Function to apply font size across the application
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
}

// Initialize theme as early as possible
(function initTheme() {
  // Get user's saved preferences from localStorage
  const userTheme = localStorage.getItem('theme') || 'system';
  const userFontSize = localStorage.getItem('fontSize') || 'md';
  
  // Apply saved preferences
  applyTheme(userTheme);
  applyFontSize(userFontSize);
  
  // Make functions available globally
  window.applyTheme = applyTheme;
  window.applyFontSize = applyFontSize;
})();

// Add event listener for when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get user's saved preferences again (in case they changed)
  const userTheme = localStorage.getItem('theme') || 'system';
  const userFontSize = localStorage.getItem('fontSize') || 'md';
  
  // Update UI to match settings if on settings page
  if (window.location.pathname.includes('settings')) {
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
  }
  
  console.log("Theme initialized:", userTheme);
});
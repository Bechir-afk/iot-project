// Utility Functions

// Format time as HH:MM
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Format date as Weekday, Month Day
function formatDate(date) {
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

// Calculate duration between two times
function calculateDuration(startTime, endTime) {
  const diff = Math.floor((endTime - startTime) / 60000); // difference in minutes
  if (diff < 60) {
    return `${diff}m`;
  } else {
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes}m`;
  }
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = 'fixed bottom-4 right-4 rounded-md shadow-lg p-4 max-w-md transform transition-all duration-300 ease-in-out translate-y-0';

  // Set background color based on type
  switch (type) {
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

// Export functions for use in other files
export { formatTime, formatDate, calculateDuration, showNotification };
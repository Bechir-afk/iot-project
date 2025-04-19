function showNotification(message, type) {
    const notification = document.createElement("div");
    notification.classList.add("notification", type);
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("show");
    }, 10);

    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 3000);
  }
  window.showNotification = showNotification;
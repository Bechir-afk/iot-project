// Firebase configuration
const firebaseConfig = {
  apiKey: "Owh7MHTxs5FTxQ4KHPF885cFknNZlusGWhgHRB1i",
  authDomain: "fdhf-4403b.firebaseapp.com",
  databaseURL: "https://fdhf-4403b-default-rtdb.firebaseio.com/",
  projectId: "fdhf-4403b",
  storageBucket: "fdhf-4403b.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

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


  // Firebase login
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      showNotification('Login successful!', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html'; // Redirect to dashboard after login
      }, 2000);
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      showNotification(`Login failed: ${errorMessage}`, 'error');
    });


// Function to handle signup
function signup() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    showNotification('Please enter both email and password.', 'error');
    return;
  }

  // Firebase signup
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      showNotification('Signup successful! Please verify your email.', 'success');
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      showNotification(`Signup failed: ${errorMessage}`, 'error');
    });
}

// Function to reset password
function resetPassword() {
  const email = document.getElementById('email').value.trim();

  if (!email) {
    showNotification('Please enter your email address.', 'error');
    return;
  }

  // Firebase password reset
  auth.sendPasswordResetEmail(email)
    .then(() => {
      showNotification('Password reset email sent!', 'success');
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      showNotification(`Error sending password reset email: ${errorMessage}`, 'error');
    });
}

// Function to handle login
function login() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  if (!email || !password) {
    showNotification('Please enter both email and password.', 'error');
    return;
  }

  // Check if email and password are "admine"
  if (email === "admine" && password === "admine") {
    // Firebase login (if needed)
    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        showNotification('Login successful!', 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html'; // Redirect to dashboard after login
        }, 2000);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        showNotification(`Login failed: ${errorMessage}`, 'error');
      });
  } else {
    // Show alert for "false response"
    alert("false response");
  }
}

// Function to toggle password visibility
function togglePasswordVisibility() {
  const passwordInput = document.getElementById('login-password');
  const togglePasswordText = document.getElementById('toggle-password-text');

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    togglePasswordText.textContent = 'Hide Password';
  } else {
    passwordInput.type = 'password';
    togglePasswordText.textContent = 'Show Password';
  }
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

// Attach event listeners
document.getElementById('login-btn').addEventListener('click', login);
document.getElementById('forgot-password').addEventListener('click', resetPassword);
document.getElementById('toggle-password').addEventListener('click', togglePasswordVisibility);


  gsap.registerPlugin(ScrambleTextPlugin, MorphSVGPlugin);

const BLINK_SPEED = 0.075;
const TOGGLE_SPEED = 0.125;
const ENCRYPT_SPEED = 1;

let busy = false;

const EYE = document.querySelector('.eye');
const TOGGLE = document.querySelector('button');
const INPUT = document.querySelector('#login-password');
const PROXY = document.createElement('div');

const chars =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`~,.<>?/;":][}{+_)(*&^%$#@!±=-§';

let blinkTl;
const BLINK = () => {
  const delay = gsap.utils.random(2, 8);
  const duration = BLINK_SPEED;
  const repeat = Math.random() > 0.5 ? 3 : 1;
  blinkTl = gsap.timeline({
    delay,
    onComplete: () => BLINK(),
    repeat,
    yoyo: true
  }).

    to('.lid--upper', {
      morphSVG: '.lid--lower',
      duration
    }).

    to('#eye-open path', {
      morphSVG: '#eye-closed path',
      duration
    },
      0);
};

BLINK();

const posMapper = gsap.utils.mapRange(-100, 100, 30, -30);
let reset;

const MOVE_EYE = ({ x, y }) => {
  if (reset) reset.kill();
  reset = gsap.delayedCall(2, () => {
    gsap.to('.eye', { xPercent: 0, yPercent: 0, duration: 0.2 });
  });
  const BOUNDS = EYE.getBoundingClientRect();
  gsap.set('.eye', {
    xPercent: gsap.utils.clamp(-30, 30, posMapper(BOUNDS.x - x)),
    yPercent: gsap.utils.clamp(-30, 30, posMapper(BOUNDS.y - y))
  });
};

window.addEventListener('pointermove', MOVE_EYE);

TOGGLE.addEventListener('click', () => {
  if (busy) return;
  const isText = INPUT.matches('[type=password]');
  const val = INPUT.value;
  busy = true;
  TOGGLE.setAttribute('aria-pressed', isText);
  const duration = TOGGLE_SPEED;

  if (isText) {
    if (blinkTl) blinkTl.kill();

    gsap.timeline({
      onComplete: () => {
        busy = false;
      }
    })

      .to('.lid--upper', {
        morphSVG: '.lid--lower',
        duration
      }).

      to('#eye-open path', {
        morphSVG: '#eye-closed path',
        duration
      },
        0)
      .to(PROXY, {
        duration: ENCRYPT_SPEED,
        onStart: () => {
          INPUT.type = 'text';
        },
        onComplete: () => {
          PROXY.innerHTML = '';
          INPUT.value = val;
        },
        scrambleText: {
          chars,
          text:
            INPUT.value.charAt(INPUT.value.length - 1) === ' ' ?
              `${INPUT.value.slice(0, INPUT.value.length - 1)}${chars.charAt(
                Math.floor(Math.random() * chars.length))
              }` :
              INPUT.value
        },

        onUpdate: () => {
          const len = val.length - PROXY.innerText.length;
          INPUT.value = `${PROXY.innerText}${new Array(len).fill('•').join('')}`;
        }
      },
        0);
  } else {
    gsap.timeline({
      onComplete: () => {
        BLINK();
        busy = false;
      }
    }).

      to('.lid--upper', {
        morphSVG: '.lid--upper',
        duration
      }).

      to('#eye-open path', {
        morphSVG: '#eye-open path',
        duration
      },
        0).
      to(PROXY, {
        duration: ENCRYPT_SPEED,
        onComplete: () => {
          INPUT.type = 'password';
          INPUT.value = val;
          PROXY.innerHTML = '';
        },
        scrambleText: {
          chars,
          text: new Array(INPUT.value.length).fill('•').join('')
        },

        onUpdate: () => {
          INPUT.value = `${PROXY.innerText}${val.slice(
            PROXY.innerText.length,
            val.length)
            }`;
        }
      },
        0);
  }
});

const FORM = document.querySelector('form');
FORM.addEventListener('submit', event => event.preventDefault());
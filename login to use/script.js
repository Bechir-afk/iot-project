// Firebase configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAtj5j3xYmxRMOMR6ZOy8ucoqqhsD0jlZo",
  authDomain: "fdhf-4403b.firebaseapp.com",
  databaseURL: "https://fdhf-4403b-default-rtdb.firebaseio.com",
  projectId: "fdhf-4403b",
  storageBucket: "fdhf-4403b.appspot.com",
  messagingSenderId: "805654928789",
  appId: "1:805654928789:web:c7d541db0c1f92196e2a9c",
  measurementId: "G-KZNZ6JQ4FL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
window.firebaseApp = { app, auth, db, storage };

// Notification Function (if not already defined in HTML)
function showNotification(message, type) {
  if (window.showNotification) {
    // If already defined in HTML, use that
    window.showNotification(message, type);
    return;
  }
  
  const notification = document.createElement("div");
  notification.classList.add("notification", type);
  notification.textContent = message;

  document.body.appendChild(notification);

  // Show the notification
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  // Hide the notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 500); // Wait for the fade-out animation to complete
  }, 3000);
}

// Add firebase event handlers and animation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Login Function
  const loginBtn = document.getElementById("login-btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", function (e) {
      e.preventDefault();

      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;

      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          showNotification("Login successful!", "success");
          setTimeout(() => {
            try {
              window.location = new URL("profile.html", window.location.href).href;
            } catch(e) {
              console.error("Navigation error:", e);
              showNotification("Failed to navigate to profile page", "error");
            }
          }, 1500);
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;

          if (errorCode === "auth/wrong-password") {
            showNotification("Incorrect password.", "error");
          } else if (errorCode === "auth/user-not-found") {
            showNotification("User not found.", "error");
          } else {
            showNotification(`Login failed: ${errorMessage}`, "error");
          }
        });
    });
  }

  // Forgot Password Function
  const forgotPasswordLink = document.getElementById("forgot-password");
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", function (e) {
      e.preventDefault();

      const email = prompt("Please enter your email address:");

      if (email) {
        sendPasswordResetEmail(auth, email)
          .then(() => {
            showNotification("Password reset email sent. Check your inbox.", "success");
          })
          .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;

            if (errorCode === "auth/user-not-found") {
              showNotification("User not found.", "error");
            } else {
              showNotification(`Error sending password reset email: ${errorMessage}`, "error");
            }
          });
      } else {
        showNotification("Please enter a valid email address.", "error");
      }
    });
  }

  // Password Reveal Animation - Move all animation code inside DOMContentLoaded
  if (typeof gsap !== 'undefined' && gsap.registerPlugin) {
    gsap.registerPlugin(ScrambleTextPlugin, MorphSVGPlugin);
    
    const BLINK_SPEED = 0.075;
    const TOGGLE_SPEED = 0.125;
    const ENCRYPT_SPEED = 1;
    
    let busy = false;
    
    const EYE = document.querySelector('.eye');
    const TOGGLE = document.querySelector('button');
    const INPUT = document.querySelector('#login-password');
    const PROXY = document.createElement('div');
    
    // Make sure all required elements exist
    if (EYE && TOGGLE && INPUT) {
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
    }
    
    const FORM = document.querySelector('form');
    if (FORM) {
      FORM.addEventListener('submit', event => event.preventDefault());
    }
  }
});

// Export any functions you need to access from other scripts
export { showNotification };
// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence, sendPasswordResetEmail, sendEmailVerification, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, orderBy, where, serverTimestamp, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-analytics.js";

// Firebase configuration
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
const analytics = getAnalytics(app);

console.log("Firebase initialized:", app);

// Language translations
const translations = {
    en: {
        headerTitle: "Attendance Management System",
        darkModeText: "Toggle Dark Mode",
        logoutText: "Logout",
        authTitle: "Login / Signup",
        emailPlaceholder: "Email",
        passwordPlaceholder: "Password",
        togglePasswordText: "Show/Hide Password",
        loginText: "Login",
        signupText: "Signup",
        rememberMeText: "Remember Me",
        resetPasswordText: "Forgot Password",
        updateProfileText: "Update Profile",
        attendanceTitle: "Attendance Records",
        userIDPlaceholder: "User ID",
        clockInText: "Clock In",
        clockOutText: "Clock Out",
        userIDHeader: "User ID",
        timeInHeader: "Time In",
        timeOutHeader: "Time Out",
        actionsHeader: "Actions",
        resetText: "Reset Filters",
        exportText: "Export Excel",
        adminTitle: "Admin Dashboard",
        welcomeAdmin: "Welcome Admin",
        welcomeStudent: "Welcome Student",
        roleAdmin: "Role: Admin",
        roleStudent: "Role: Student",
    },
    es: {
        headerTitle: "Sistema de Gestión de Asistencia",
        darkModeText: "Alternar Modo Oscuro",
        logoutText: "Cerrar Sesión",
        authTitle: "Iniciar Sesión / Registrarse",
        emailPlaceholder: "Correo Electrónico",
        passwordPlaceholder: "Contraseña",
        togglePasswordText: "Mostrar/Ocultar Contraseña",
        loginText: "Iniciar Sesión",
        signupText: "Registrarse",
        rememberMeText: "Recuérdame",
        resetPasswordText: "Olvidé mi Contraseña",
        updateProfileText: "Actualizar Perfil",
        attendanceTitle: "Registros de Asistencia",
        userIDPlaceholder: "ID de Usuario",
        clockInText: "Registrar Entrada",
        clockOutText: "Registrar Salida",
        userIDHeader: "ID de Usuario",
        timeInHeader: "Hora de Entrada",
        timeOutHeader: "Hora de Salida",
        actionsHeader: "Acciones",
        resetText: "Restablecer Filtros",
        exportText: "Exportar CSV",
        adminTitle: "Panel de Administración",
        welcomeAdmin: "Bienvenido Administrador",
        welcomeStudent: "Bienvenido Estudiante",
        roleAdmin: "Rol: Administrador",
        roleStudent: "Rol: Estudiante",
    },
    ar: {
        headerTitle: "نظام إدارة الحضور",
        darkModeText: "تبديل الوضع الليلي",
        logoutText: "تسجيل الخروج",
        authTitle: "تسجيل الدخول / التسجيل",
        emailPlaceholder: "البريد الإلكتروني",
        passwordPlaceholder: "كلمة المرور",
        togglePasswordText: "إظهار/إخفاء كلمة المرور",
        loginText: "تسجيل الدخول",
        signupText: "التسجيل",
        rememberMeText: "تذكرني",
        resetPasswordText: "نسيت كلمة المرور",
        updateProfileText: "تحديث الملف الشخصي",
        attendanceTitle: "سجلات الحضور",
        userIDPlaceholder: "معرف المستخدم",
        clockInText: "تسجيل الدخول",
        clockOutText: "تسجيل الخروج",
        userIDHeader: "معرف المستخدم",
        timeInHeader: "وقت الدخول",
        timeOutHeader: "وقت الخروج",
        actionsHeader: "الإجراءات",
        resetText: "إعادة تعيين الفلاتر",
        exportText: "تصدير CSV",
        adminTitle: "لوحة الإدارة",
        welcomeAdmin: "مرحبًا بك يا مدير",
        welcomeStudent: "مرحبًا بك يا طالب",
        roleAdmin: "الدور: مدير",
        roleStudent: "الدور: طالب",
    },
};

// Set default language to English
let currentLanguage = "en";

// Function to update the UI with the selected language
function updateLanguage(lang) {
    currentLanguage = lang;
    const translation = translations[lang];
    document.getElementById("header-title").textContent = translation.headerTitle;
    document.getElementById("dark-mode-text").textContent = translation.darkModeText;
    document.getElementById("logout-text").textContent = translation.logoutText;
    document.getElementById("auth-title").textContent = translation.authTitle;
    document.getElementById("email").placeholder = translation.emailPlaceholder;
    document.getElementById("password").placeholder = translation.passwordPlaceholder;
    document.getElementById("toggle-password-text").textContent = translation.togglePasswordText;
    document.getElementById("login-text").textContent = translation.loginText;
    document.getElementById("signup-text").textContent = translation.signupText;
    document.getElementById("remember-me-text").textContent = translation.rememberMeText;
    document.getElementById("reset-password-text").textContent = translation.resetPasswordText;
    document.getElementById("attendance-title").textContent = translation.attendanceTitle;
    document.getElementById("user-id").placeholder = translation.userIDPlaceholder;
    document.getElementById("clock-in-text").textContent = translation.clockInText;
    document.getElementById("clock-out-text").textContent = translation.clockOutText;
    document.getElementById("user-id-header").textContent = translation.userIDHeader;
    document.getElementById("time-in-header").textContent = translation.timeInHeader;
    document.getElementById("time-out-header").textContent = translation.timeOutHeader;
    document.getElementById("actions-header").textContent = translation.actionsHeader;
    document.getElementById("reset-text").textContent = translation.resetText;
    document.getElementById("export-text").textContent = translation.exportText;
    document.getElementById("admin-title").textContent = translation.adminTitle;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    const authContainer = document.getElementById('auth-container');
    const attendanceContainer = document.getElementById('attendance-container');
    const adminDashboard = document.getElementById('admin-dashboard');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const userIdInput = document.getElementById('user-id');
    const filterUserIdInput = document.getElementById('filter-user-id');
    const filterDateInput = document.getElementById('filter-date');
    const clockInBtn = document.getElementById('clock-in-btn');
    const clockOutBtn = document.getElementById('clock-out-btn');
    const exportBtn = document.getElementById('export-btn');
    const resetBtn = document.getElementById('reset-btn');
    const attendanceTableBody = document.querySelector('#attendance-table tbody');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const resetPasswordBtn = document.getElementById('reset-password-btn');
    const authNotification = document.getElementById('auth-notification');
    const attendanceNotification = document.getElementById('attendance-notification');
    const loadingSpinner = document.getElementById('loading-spinner');
    const tableHeaders = document.querySelectorAll('#attendance-table th');
    const languageSelector = document.getElementById('language-selector');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const userRole = document.getElementById('user-role');
    const profileNameInput = document.getElementById('profile-name');
    const profileEmailInput = document.getElementById('profile-email');
    const updateProfileBtn = document.getElementById('update-profile-btn');
    const avatarUpload = document.getElementById('avatar-upload');
    const attendanceChart = document.getElementById('attendance-chart').getContext('2d');
    const logoutBtn = document.getElementById('logout-btn');

    let currentUser = null;
    let sortField = 'timestampIn';
    let sortDirection = 'asc';
    let filterDate = null;
    let filterUserId = null;
    let isAdmin = false;

    // Set default language
    updateLanguage(currentLanguage);

    // Language selector event listener
    languageSelector.addEventListener('change', (event) => {
        const selectedLanguage = event.target.value;
        updateLanguage(selectedLanguage);
    });

    // Toggle Password Visibility
    togglePasswordBtn.addEventListener('click', () => {
        console.log("Toggle password visibility");
        passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    });

    // Dark Mode Toggle
    darkModeToggle.addEventListener('click', () => {
        console.log("Toggle dark mode");
        document.body.classList.toggle('dark-mode');
        document.querySelectorAll('input, button, th, td, .container, header, .notification').forEach(el => {
            el.classList.toggle('dark-mode');
        });
        darkModeToggle.innerHTML = document.body.classList.contains('dark-mode') ? '<i class="fas fa-sun"></i> ' + translations[currentLanguage].darkModeText : '<i class="fas fa-moon"></i> ' + translations[currentLanguage].darkModeText;
    });

    // Show Loading Spinner
    function showLoadingSpinner() {
        loadingSpinner.classList.remove('hidden');
    }

    // Hide Loading Spinner
    function hideLoadingSpinner() {
        loadingSpinner.classList.add('hidden');
    }

    // Show Notification
    function showNotification(element, message, type) {
        element.textContent = message;
        element.classList.remove('hidden', 'success', 'error');
        element.classList.add(type);
        setTimeout(() => {
            element.classList.add('fade-out');
            setTimeout(() => {
                element.classList.add('hidden');
                element.classList.remove('fade-out');
            }, 300);
        }, 3000);
    }

    // Validate Email
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    // Validate Password
    function isValidPassword(password) {
        return password.length >= 6;
    }

    // Login
    loginBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!isValidEmail(email)) {
            showNotification(authNotification, translations[currentLanguage].emailError || 'Please enter a valid email address', 'error');
            return;
        }

        if (!isValidPassword(password)) {
            showNotification(authNotification, translations[currentLanguage].passwordError || 'Password must be at least 6 characters long', 'error');
            return;
        }

        try {
            showLoadingSpinner();
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            currentUser = userCredential.user;
            checkAdmin(currentUser.email);
            showNotification(authNotification, translations[currentLanguage].loginSuccess || 'Login successful!', 'success');
        } catch (error) {
            showNotification(authNotification, error.message, 'error');
        } finally {
            hideLoadingSpinner();
        }
    });

    // Signup
    signupBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!isValidEmail(email)) {
            showNotification(authNotification, translations[currentLanguage].emailError || 'Please enter a valid email address', 'error');
            return;
        }

        if (!isValidPassword(password)) {
            showNotification(authNotification, translations[currentLanguage].passwordError || 'Password must be at least 6 characters long', 'error');
            return;
        }

        try {
            showLoadingSpinner();
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            currentUser = userCredential.user;
            if (rememberMeCheckbox.checked) {
                await setPersistence(auth, browserLocalPersistence);
            } else {
                await setPersistence(auth, browserSessionPersistence);
            }
            await sendEmailVerification(currentUser);

            // Check if this is the first user (admin)
            const usersSnapshot = await getDocs(query(collection(db, 'users'), orderBy('createdAt')));
            if (usersSnapshot.empty) {
                // First user is the admin
                await setDoc(doc(db, 'users', currentUser.uid), {
                    email: email,
                    role: 'admin',
                    createdAt: serverTimestamp()
                });
                isAdmin = true;
            } else {
                // Subsequent users are students
                await setDoc(doc(db, 'users', currentUser.uid), {
                    email: email,
                    role: 'student',
                    createdAt: serverTimestamp()
                });
                isAdmin = false;
            }

            showNotification(authNotification, translations[currentLanguage].signupSuccess || 'Signup successful! Please verify your email.', 'success');
        } catch (error) {
            showNotification(authNotification, error.message, 'error');
        } finally {
            hideLoadingSpinner();
        }
    });

    // Reset Password
    resetPasswordBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();

        if (!isValidEmail(email)) {
            showNotification(authNotification, translations[currentLanguage].emailError || 'Please enter a valid email address', 'error');
            return;
        }

        try {
            showLoadingSpinner();
            await sendPasswordResetEmail(auth, email);
            showNotification(authNotification, translations[currentLanguage].resetPasswordSuccess || 'Password reset email sent!', 'success');
        } catch (error) {
            showNotification(authNotification, error.message, 'error');
        } finally {
            hideLoadingSpinner();
        }
    });

    // Logout
    logoutBtn.addEventListener('click', async () => {
        try {
            showLoadingSpinner();
            await signOut(auth);
            showNotification(authNotification, translations[currentLanguage].logoutSuccess || 'Logged out successfully!', 'success');
            authContainer.classList.remove('hidden');
            attendanceContainer.classList.add('hidden');
            adminDashboard.classList.add('hidden');
            logoutBtn.classList.add('hidden');
        } catch (error) {
            showNotification(authNotification, error.message, 'error');
        } finally {
            hideLoadingSpinner();
        }
    });

    // Check if the user is an admin
    async function checkAdmin(email) {
        const usersSnapshot = await getDocs(query(collection(db, 'users'), orderBy('createdAt')));
        if (!usersSnapshot.empty) {
            const firstUser = usersSnapshot.docs[0].data();
            if (firstUser.email === email) {
                isAdmin = true;
                userRole.textContent = translations[currentLanguage].roleAdmin || 'Role: Admin';
                showNotification(authNotification, translations[currentLanguage].welcomeAdmin || 'Welcome Admin', 'success');
                showAdminFeatures();
            } else {
                isAdmin = false;
                userRole.textContent = translations[currentLanguage].roleStudent || 'Role: Student';
                showNotification(authNotification, translations[currentLanguage].welcomeStudent || 'Welcome Student', 'success');
                showStudentFeatures();
            }
        }
    }

    // Show Admin Features
    function showAdminFeatures() {
        authContainer.classList.add('hidden');
        attendanceContainer.classList.remove('hidden');
        adminDashboard.classList.remove('hidden');
        exportBtn.classList.remove('hidden');
        loadAttendanceRecords();
        loadAttendanceChart();
    }

    // Show Student Features
    function showStudentFeatures() {
        authContainer.classList.add('hidden');
        attendanceContainer.classList.remove('hidden');
        adminDashboard.classList.add('hidden');
        exportBtn.classList.add('hidden');
        loadAttendanceRecords();
    }

    // Load Attendance Records with Client-Side Sorting
    async function loadAttendanceRecords() {
        const user = auth.currentUser;
        if (user) {
            try {
                showLoadingSpinner();
                const q = query(collection(db, 'attendance'));
                const querySnapshot = await getDocs(q);
                let records = [];
                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    records.push({
                        id: doc.id,
                        userId: data.userId,
                        timestampIn: data.timestampIn ? new Date(data.timestampIn.seconds * 1000) : null,
                        timestampOut: data.timestampOut ? new Date(data.timestampOut.seconds * 1000) : null,
                        date: data.date
                    });
                });

                // Apply filters
                if (filterDate) {
                    records = records.filter(record => record.date === filterDate);
                }
                if (filterUserId) {
                    records = records.filter(record => record.userId === filterUserId);
                }

                // Apply sorting
                records.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a[sortField] - b[sortField];
                    } else {
                        return b[sortField] - a[sortField];
                    }
                });

                // Render records
                attendanceTableBody.innerHTML = '';
                records.forEach(record => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${record.userId}</td>
                        <td>${record.timestampIn ? record.timestampIn.toLocaleString() : 'N/A'}</td>
                        <td>${record.timestampOut ? record.timestampOut.toLocaleString() : 'N/A'}</td>
                        <td>
                            ${isAdmin ? `<button onclick="deleteRecord('${record.id}')">${translations[currentLanguage].deleteText || 'Delete'}</button>` : ''}
                        </td>
                    `;
                    attendanceTableBody.appendChild(row);
                });
            } catch (error) {
                showNotification(attendanceNotification, error.message, 'error');
            } finally {
                hideLoadingSpinner();
            }
        }
    }

    // Delete Record
    window.deleteRecord = async function (recordId) {
        try {
            showLoadingSpinner();
            await deleteDoc(doc(db, 'attendance', recordId));
            showNotification(attendanceNotification, translations[currentLanguage].deleteSuccess || 'Record deleted successfully!', 'success');
            loadAttendanceRecords();
        } catch (error) {
            showNotification(attendanceNotification, error.message, 'error');
        } finally {
            hideLoadingSpinner();
        }
    };

    // Clock In
    clockInBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        const userId = userIdInput.value.trim();
        if (user) {
            try {
                showLoadingSpinner();
                const docRef = doc(db, 'attendance', userId);
                await setDoc(docRef, {
                    userId: userId,
                    timestampIn: serverTimestamp(),
                    timestampOut: null,
                    date: new Date().toISOString().split('T')[0]
                }, { merge: true });
                showNotification(attendanceNotification, translations[currentLanguage].clockInSuccess || 'Clocked in successfully!', 'success');
                loadAttendanceRecords();
            } catch (error) {
                showNotification(attendanceNotification, error.message, 'error');
            } finally {
                hideLoadingSpinner();
            }
        }
    });

    // Clock Out
    clockOutBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        const userId = userIdInput.value.trim();
        if (user) {
            try {
                showLoadingSpinner();
                const docRef = doc(db, 'attendance', userId);
                await updateDoc(docRef, {
                    timestampOut: serverTimestamp()
                });
                showNotification(attendanceNotification, translations[currentLanguage].clockOutSuccess || 'Clocked out successfully!', 'success');
                loadAttendanceRecords();
            } catch (error) {
                showNotification(attendanceNotification, error.message, 'error');
            } finally {
                hideLoadingSpinner();
            }
        }
    });

    // Reset Filters
    resetBtn.addEventListener('click', () => {
        filterDateInput.value = '';
        filterUserIdInput.value = '';
        filterDate = null;
        filterUserId = null;
        loadAttendanceRecords();
    });

    // Export Excel
    exportBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (user) {
            try {
                showLoadingSpinner();
                const q = query(collection(db, 'attendance'), orderBy(sortField, sortDirection));
                const querySnapshot = await getDocs(q);
                const data = [];
                querySnapshot.forEach(doc => {
                    const record = doc.data();
                    data.push({
                        'User ID': record.userId,
                        'Time In': record.timestampIn ? new Date(record.timestampIn.seconds * 1000).toLocaleString() : 'N/A',
                        'Time Out': record.timestampOut ? new Date(record.timestampOut.seconds * 1000).toLocaleString() : 'N/A',
                    });
                });

                const worksheet = XLSX.utils.json_to_sheet(data);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Records');
                XLSX.writeFile(workbook, 'attendance_records.xlsx');
                showNotification(attendanceNotification, translations[currentLanguage].exportSuccess || 'Excel exported successfully!', 'success');
            } catch (error) {
                showNotification(attendanceNotification, error.message, 'error');
            } finally {
                hideLoadingSpinner();
            }
        }
    });

    // Load Attendance Chart
    async function loadAttendanceChart() {
        const user = auth.currentUser;
        if (user) {
            try {
                showLoadingSpinner();
                const q = query(collection(db, 'attendance'), orderBy('timestampIn', 'asc'));
                const querySnapshot = await getDocs(q);
                const attendanceData = {
                    Monday: 0,
                    Tuesday: 0,
                    Wednesday: 0,
                    Thursday: 0,
                    Friday: 0,
                    Saturday: 0,
                    Sunday: 0
                };

                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    const day = new Date(data.timestampIn.seconds * 1000).toLocaleString('en-US', { weekday: 'long' });
                    attendanceData[day]++;
                });

                const chart = new Chart(attendanceChart, {
                    type: 'bar',
                    data: {
                        labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                        datasets: [{
                            label: 'Attendance',
                            data: [
                                attendanceData.Monday,
                                attendanceData.Tuesday,
                                attendanceData.Wednesday,
                                attendanceData.Thursday,
                                attendanceData.Friday,
                                attendanceData.Saturday,
                                attendanceData.Sunday
                            ],
                            backgroundColor: 'rgba(98, 0, 234, 0.2)',
                            borderColor: 'rgba(98, 0, 234, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            } catch (error) {
                showNotification(attendanceNotification, error.message, 'error');
            } finally {
                hideLoadingSpinner();
            }
        }
    }

    // Initialize
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            checkAdmin(user.email);
            logoutBtn.classList.remove('hidden');
        } else {
            authContainer.classList.remove('hidden');
            attendanceContainer.classList.add('hidden');
            adminDashboard.classList.add('hidden');
            logoutBtn.classList.add('hidden');
        }
    });

    // Filter by User ID
    filterUserIdInput.addEventListener('input', () => {
        filterUserId = filterUserIdInput.value.trim();
        loadAttendanceRecords();
    });

    // Filter by Date
    filterDateInput.addEventListener('change', () => {
        filterDate = filterDateInput.value;
        loadAttendanceRecords();
    });

    // Add event listener for the filter button
    const filterUserIdBtn = document.getElementById('filter-user-id-btn');
    filterUserIdBtn.addEventListener('click', () => {
        filterUserId = filterUserIdInput.value.trim();
        loadAttendanceRecords();
    });
});
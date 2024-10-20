// Reference to the laps data in Firebase
const lapsRef = firebase.database().ref('laps');

// Listen for changes in real-time
lapsRef.on('value', (snapshot) => {
    const totalLaps = snapshot.val();
    document.querySelector('.stats-number').textContent = totalLaps + '+';
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC3g85grffiBMjSWQ-1XMljIlEU6_bt_w8",
    authDomain: "chikane-e5fa1.firebaseapp.com",
    projectId: "chikane-e5fa1",
    storageBucket: "chikane-e5fa1.appspot.com",
    messagingSenderId: "989422231159",
    appId: "1:989422231159:web:2895f389094dcccb9d3072",
    measurementId: "G-GX4ZZW6EXK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
    console.log("Firebase app initialized:", app);

    // Registration
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const email = document.getElementById("register-email").value;
            const password = document.getElementById("register-password").value;
            console.log("Attempting to register with:", email);

            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    console.log("Registration successful:", userCredential.user);
                    window.location.href = "dashboard.html";
                })
                .catch((error) => {
                    console.error("Registration error:", error.message);
                    alert(`Registration error: ${error.message}`);
                });
        });
    }

    // Login
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            console.log("Attempting to log in with:", email);

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    console.log("Login successful:", userCredential.user);
                    window.location.href = "dashboard.html";
                })
                .catch((error) => {
                    console.error("Login error:", error.message);
                    alert(`Login error: ${error.message}`);
                });
        });
    }

    // Dashboard access
    const dashboardPage = document.querySelector('.dashboard');
    if (dashboardPage) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("User is logged in:", user.email);
            } else {
                console.log("User not logged in, redirecting to login.");
                window.location.href = "login.html";
            }
        });
    }
});
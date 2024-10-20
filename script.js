// Reference to the laps data in Firebase
const lapsRef = firebase.database().ref('laps');

// Listen for changes in real-time
lapsRef.on('value', (snapshot) => {
    const totalLaps = snapshot.val();
    document.querySelector('.stats-number').textContent = totalLaps + '+';
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js";

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
const db = getDatabase(app); // Initialize Realtime Database


// Listen for changes in real-time
onValue(lapsRef, (snapshot) => {
    const totalLaps = snapshot.val();
    document.querySelector('.stats-number').textContent = totalLaps + '+';
});

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Registration Form Handling
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", (event) => {
            event.preventDefault(); // Prevent page refresh

            const email = document.getElementById("register-email").value;
            const password = document.getElementById("register-password").value;

            // Register the user with Firebase Auth
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    console.log("Registration successful!");
                    window.location.href = "dashboard.html";
                })
                .catch((error) => {
                    console.error("Registration error: ", error.message);
                    document.getElementById("register-error").textContent = error.message;
                    document.getElementById("register-error").style.display = "block";
                });
        });
    }

    // Login Form Handling
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault(); // Prevent page refresh

            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            // Log the user in with Firebase Auth
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    console.log("Login successful!");
                    window.location.href = "dashboard.html";
                })
                .catch((error) => {
                    console.error("Login error: ", error.message);
                    document.getElementById("login-error").textContent = error.message;
                    document.getElementById("login-error").style.display = "block";
                });
        });
    }

    // Dashboard Access Control
    const dashboardPage = document.querySelector('.dashboard');
    if (dashboardPage) {
        onAuthStateChanged(auth, (user) => {
            if (!user) {
                window.location.href = "login.html";
            }
        });
    }

    // Logout Handling
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
        logoutButton.addEventListener("click", (event) => {
            event.preventDefault();

            signOut(auth)
                .then(() => {
                    console.log("Logout successful!");
                    window.location.href = "login.html";
                })
                .catch((error) => {
                    console.error("Logout error: ", error.message);
                });
        });
    }
});
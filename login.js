// login.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";

// Firebase config
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

// Check if user is already logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is already logged in, redirecting to dashboard...");
        window.location.href = 'dashboard.html';
    }
});

// Login form handler
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const errorElement = document.getElementById('login-error');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log("Login successful, redirecting...");
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error("Login error:", error);
                errorElement.textContent = getErrorMessage(error.code);
                errorElement.style.display = 'block';
            }
        });
    }
});

// Helper function to get user-friendly error messages
function getErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'Invalid email address';
        case 'auth/user-disabled':
            return 'This account has been disabled';
        case 'auth/user-not-found':
            return 'No account found with this email';
        case 'auth/wrong-password':
            return 'Incorrect password';
        default:
            return 'An error occurred during login. Please try again.';
    }
}
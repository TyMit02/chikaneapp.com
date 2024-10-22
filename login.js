import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { initializeAuthHandler } from './auth-handler.js';

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

document.addEventListener('DOMContentLoaded', function() {
    // Initialize auth handler
    initializeAuthHandler();

    const loginForm = document.getElementById('login-form');
    const errorElement = document.getElementById('login-error');
    const loginButton = document.querySelector('.login-button');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Reset error message
            if (errorElement) {
                errorElement.style.display = 'none';
            }
            
            // Disable button and show loading state
            if (loginButton) {
                loginButton.disabled = true;
                loginButton.classList.add('loading');
            }
            
            const email = document.getElementById('email')?.value;
            const password = document.getElementById('password')?.value;

            if (!email || !password) {
                showError('Please enter both email and password');
                resetButton();
                return;
            }
            
            try {
                await signInWithEmailAndPassword(auth, email, password);
                // Successful login - auth handler will handle redirect
            } catch (error) {
                console.error("Login error:", error);
                showError(getErrorMessage(error.code));
                resetButton();
            }
        });
    }

    function showError(message) {
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    function resetButton() {
        if (loginButton) {
            loginButton.disabled = false;
            loginButton.classList.remove('loading');
        }
    }
});

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
        case 'auth/too-many-requests':
            return 'Too many login attempts. Please try again later.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.';
        default:
            return 'An error occurred during login. Please try again.';
    }
}
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

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
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('register-form');
    const errorElement = document.getElementById('register-error');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const username = document.getElementById('username').value;

            // Reset error message
            errorElement.style.display = 'none';
            
            // Validate passwords match
            if (password !== confirmPassword) {
                errorElement.textContent = "Passwords do not match";
                errorElement.style.display = 'block';
                return;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Create user profile in Firestore
                await setDoc(doc(db, "users", user.uid), {
                    username: username,
                    email: email,
                    createdAt: new Date(),
                    trackDaysCount: 0,
                    totalLaps: 0
                });

                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error("Registration error:", error);
                errorElement.textContent = getErrorMessage(error.code);
                errorElement.style.display = 'block';
            }
        });
    }
});

function getErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/email-already-in-use':
            return 'An account with this email already exists';
        case 'auth/invalid-email':
            return 'Invalid email address';
        case 'auth/operation-not-allowed':
            return 'Email/password accounts are not enabled';
        case 'auth/weak-password':
            return 'Password is too weak';
        default:
            return 'An error occurred during registration. Please try again.';
    }
}
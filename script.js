// Reference to the laps data in Firebase
const lapsRef = firebase.database().ref('laps');

// Listen for changes in real-time
lapsRef.on('value', (snapshot) => {
    const totalLaps = snapshot.val();
    document.querySelector('.stats-number').textContent = totalLaps + '+';
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";

// Firebase Config
const firebaseConfig = { /* Your Firebase Config Here */ };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Registration Handler
document.getElementById("register-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const plan = document.getElementById("plan").value;

    // Stripe Integration
    fetch('/create-checkout-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan, email })
    })
    .then(response => response.json())
    .then(data => {
        window.location.href = data.url; // Redirect to Stripe checkout
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById("register-error").textContent = error.message;
    });
});

// Login Handler
document.getElementById("login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            window.location.href = "dashboard.html";
        })
        .catch((error) => {
            document.getElementById("login-error").textContent = error.message;
        });
});
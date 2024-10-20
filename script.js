// Reference to the laps data in Firebase
const lapsRef = firebase.database().ref('laps');

// Listen for changes in real-time
lapsRef.on('value', (snapshot) => {
    const totalLaps = snapshot.val();
    document.querySelector('.stats-number').textContent = totalLaps + '+';
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC3g85grffiBMjSWQ-1XMljIlEU6_bt_w8",
    authDomain: "chikane-e5fa1.firebaseapp.com",
    projectId: "chikane-e5fa1",
    storageBucket: "chikane-e5fa1.appspot.com",
    messagingSenderId: "989422231159",
    appId: "1:989422231159:web:2895f389094dcccb9d3072",
    measurementId: "G-GX4ZZW6EXK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {

    // Initialize Stripe
    const stripe = Stripe('pk_test_51QC5hpCvERe5npglcf7g6p1WvYWNqKu1SVgwYGyxH90PLYop5z3ie16qVhNGAC8RUqLmvRiIM6Pjd6zo53b7Fl1F00jBIq0mAL'); // Replace with your Stripe public key

    // Registration Form Handling
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", (event) => {
            event.preventDefault(); // Prevent form refresh

            const email = document.getElementById("register-email").value;
            const password = document.getElementById("register-password").value;
            const plan = document.getElementById("plan").value; // Get the selected plan

            // Validate plan selection
            if (!plan) {
                alert("Please select a subscription plan.");
                return;
            }

            // Firebase registration
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // Firebase registration successful
                    console.log("Registration successful!");

                    // Redirect to Stripe checkout
                    initiateStripeCheckout(plan, userCredential.user.uid);
                })
                .catch((error) => {
                    console.error("Registration error: ", error.message);
                    document.getElementById("register-error").textContent = error.message;
                    document.getElementById("register-error").style.display = "block";
                });
        });
    }

    // Stripe Checkout
    function initiateStripeCheckout(plan, userId) {
        // Define price IDs for each plan
        const priceIds = {
            basic: 'PRICE_ID_BASIC',
            standard: 'PRICE_ID_STANDARD',
            premium: 'PRICE_ID_PREMIUM'
        };

        const selectedPriceId = priceIds[plan];

        // Call server-side endpoint to create checkout session
        fetch('/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ priceId: selectedPriceId, userId: userId })
        })
        .then(response => response.json())
        .then(data => {
            // Redirect to Stripe Checkout
            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error("Error creating Stripe checkout session: ", data.error);
            }
        })
        .catch(error => {
            console.error("Stripe checkout error: ", error);
        });
    }

    // Login Form Handling
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault(); // Prevent form refresh

            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            signInWithEmailAndPassword(auth, email, password)
                .then(() => {
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
});
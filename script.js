// Reference to the laps data in Firebase
const lapsRef = firebase.database().ref('laps');

// Listen for changes in real-time
lapsRef.on('value', (snapshot) => {
    const totalLaps = snapshot.val();
    document.querySelector('.stats-number').textContent = totalLaps + '+';
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

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
const db = getFirestore(app);

// Handle login
document.getElementById("login-form").addEventListener("submit", function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Successful login
            window.location.href = "dashboard.html";
        })
        .catch((error) => {
            // Handle errors
            const errorCode = error.code;
            const errorMessage = error.message;
            document.getElementById("login-error").style.display = "block";
            document.getElementById("login-error").textContent = errorMessage;
        });
});

import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";

// Handle registration
document.getElementById("register-form").addEventListener("submit", function(event) {
    event.preventDefault();

    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Successful registration
            window.location.href = "dashboard.html";
        })
        .catch((error) => {
            // Handle errors
            const errorCode = error.code;
            const errorMessage = error.message;
            document.getElementById("register-error").style.display = "block";
            document.getElementById("register-error").textContent = errorMessage;
        });
});

import { addDoc, collection } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

// Handle event creation
document.getElementById("create-event-form").addEventListener("submit", function(event) {
    event.preventDefault();

    const eventName = document.getElementById("event-name").value;
    const eventDate = document.getElementById("event-date").value;
    const eventDescription = document.getElementById("event-description").value;

    addDoc(collection(db, "events"), {
        name: eventName,
        date: eventDate,
        description: eventDescription
    })
    .then(() => {
        alert("Event created successfully!");
        document.getElementById("create-event-form").reset();
    })
    .catch((error) => {
        console.error("Error creating event: ", error);
    });
});
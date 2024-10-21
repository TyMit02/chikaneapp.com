import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC3g85grffiBMjSWQ-1XMljIlEU6_bt_w8",
    authDomain: "chikane-e5fa1.firebaseapp.com",
    databaseURL: "https://chikane-e5fa1-default-rtdb.firebaseio.com/",
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
const rtdb = getDatabase(app);

// Ensure the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Handle registration form
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const email = document.getElementById("register-email").value;
            const password = document.getElementById("register-password").value;

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log("Registration successful:", userCredential.user);
                window.location.href = "dashboard.html";
            } catch (error) {
                console.error("Registration error:", error.message);
                alert(`Registration error: ${error.message}`);
            }
        });
    }

    // Handle login form
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log("Login successful:", userCredential.user);
                window.location.href = "dashboard.html";
            } catch (error) {
                console.error("Login error:", error.message);
                alert(`Login error: ${error.message}`);
            }
        });
    }

    // Handle auth state change
    onAuthStateChanged(auth, (user) => {
        const dashboardPage = document.querySelector('.dashboard');
        const loginPage = document.querySelector('.login-section');

        if (user) {
            console.log("User is logged in:", user.email);

            // Redirect to dashboard if on login page
            if (loginPage) {
                window.location.href = "dashboard.html";
            }

            // Load dashboard data if on dashboard page
            if (dashboardPage) {
                loadDashboard(user);
                setupEventCreation(user);
                loadRealTimeData();
            }
        } else {
            console.log("User not logged in");

            // Redirect to login only if on dashboard
            if (dashboardPage) {
                window.location.href = "login.html";
            }
        }
    });

    // Handle logout
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            try {
                await signOut(auth);
                console.log("Logout successful!");
                window.location.href = "login.html";
            } catch (error) {
                console.error("Logout error:", error.message);
            }
        });
    }
});

// Load real-time laps data from Firebase Realtime Database
function loadRealTimeData() {
    const lapsRef = ref(rtdb, 'laps');

    onValue(lapsRef, (snapshot) => {
        const totalLaps = snapshot.val() || 0;
        document.querySelector('.stats-number').textContent = totalLaps + '+';
    });
}

// Load dashboard data from Firestore
async function loadDashboard(user) {
    try {
        const eventsRef = collection(db, `users/${user.uid}/events`);
        const eventSnapshot = await getDocs(eventsRef);
        const eventContainer = document.getElementById("event-container");

        eventSnapshot.forEach((doc) => {
            const eventData = doc.data();

            // Create event card
            const eventCard = document.createElement("div");
            eventCard.classList.add("event-card");
            eventCard.innerHTML = `
                <h3>${eventData.name}</h3>
                <p>Date: ${eventData.date}</p>
                <p>Participants: ${eventData.participants || 0}</p>
            `;
            eventContainer.appendChild(eventCard);
        });
    } catch (error) {
        console.error("Error loading dashboard:", error.message);
    }
}

// Set up event creation form
function setupEventCreation(user) {
    const createEventForm = document.getElementById("create-event-form");
    if (createEventForm) {
        createEventForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const eventName = document.getElementById("event-name").value;
            const eventDate = document.getElementById("event-date").value;
            const eventDescription = document.getElementById("event-description").value;

            try {
                await addDoc(collection(db, `users/${user.uid}/events`), {
                    name: eventName,
                    date: eventDate,
                    description: eventDescription,
                    status: "upcoming"
                });
                console.log("Event created successfully!");
                alert("Event created successfully!");
                createEventForm.reset();
                window.location.reload();
            } catch (error) {
                console.error("Error creating event:", error.message);
                alert(`Error creating event: ${error.message}`);
            }
        });
    }
}
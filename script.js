import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

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
const db = getFirestore(app);
const auth = getAuth(app);

// Authentication & Dashboard Initialization
document.addEventListener('DOMContentLoaded', () => {
    const dashboardPage = document.querySelector('.dashboard');
    if (dashboardPage) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("User is logged in:", user.email);
                loadDashboard(user);
            } else {
                console.log("User not logged in, redirecting to login.");
                window.location.href = "login.html";
            }
        });
    }

    const createEventForm = document.getElementById("create-event-form");
    if (createEventForm) {
        setupEventCreation();
    }
});

// Load dashboard data
async function loadDashboard(user) {
    try {
        const eventsRef = collection(db, `users/${user.uid}/events`);
        const eventSnapshot = await getDocs(eventsRef);
        const eventContainer = document.getElementById("event-container");
        eventContainer.innerHTML = ""; // Clear previous content

        eventSnapshot.forEach((doc) => {
            const eventData = doc.data();

            // Create event card
            const eventCard = document.createElement("div");
            eventCard.classList.add("event-card");
            eventCard.innerHTML = `
                <h3>${eventData.name}</h3>
                <p>Date: ${eventData.date}</p>
                <p>Track: ${eventData.track}</p>
                <button onclick="viewEventDetails('${doc.id}')">View Details</button>
                <button onclick="editEvent('${doc.id}')">Edit</button>
                <button onclick="deleteEvent('${doc.id}')">Delete</button>
            `;
            eventContainer.appendChild(eventCard);
        });

    } catch (error) {
        console.error("Error loading dashboard:", error.message);
    }
}

// Setup event creation form
function setupEventCreation() {
    const createEventForm = document.getElementById("create-event-form");
    if (createEventForm) {
        createEventForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const eventName = document.getElementById("event-name").value;
            const eventDate = document.getElementById("event-date").value;
            const eventCode = document.getElementById("event-code").value;
            const trackName = document.getElementById("track-name").value;
            const trackId = document.getElementById("track-id").value;
            const organizerId = auth.currentUser.uid;

            try {
                await addDoc(collection(db, `users/${organizerId}/events`), {
                    name: eventName,
                    date: eventDate,
                    eventCode: eventCode,
                    track: trackName,
                    trackId: trackId,
                    organizerId: organizerId,
                    participants: [],
                    status: "upcoming"
                });
                console.log("Event created successfully!");
                alert("Event created successfully!");
                window.location.reload();
            } catch (error) {
                console.error("Error creating event:", error.message);
                alert(`Error creating event: ${error.message}`);
            }
        });
    }
}

// View event details
function viewEventDetails(eventId) {
    window.location.href = `event-details.html?eventId=${eventId}`;
}
window.viewEventDetails = viewEventDetails;

// Edit event
function editEvent(eventId) {
    alert(`Edit event: ${eventId}`);
}

// Delete event
async function deleteEvent(eventId) {
    const userId = auth.currentUser.uid;
    try {
        await deleteDoc(doc(db, `users/${userId}/events/${eventId}`));
        console.log("Event deleted successfully!");
        alert("Event deleted successfully!");
        window.location.reload();
    } catch (error) {
        console.error("Error deleting event:", error.message);
        alert(`Error deleting event: ${error.message}`);
    }
}
window.deleteEvent = deleteEvent;

// Handle registration
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

// Handle login
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
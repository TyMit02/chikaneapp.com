import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

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

// Handle page load and user authentication state
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        const currentPath = window.location.pathname;

        // Redirect to dashboard if user is logged in and not on the dashboard page
        if (user && !currentPath.includes("dashboard.html")) {
            window.location.href = "dashboard.html";
        }
        // Redirect to login if user is not logged in and trying to access a protected page
        else if (!user && currentPath.includes("dashboard.html")) {
            window.location.href = "login.html";
        }
    });

    setupEventHandlers();
});

// Set up event handlers for registration, login, logout, and event management
function setupEventHandlers() {
    // Registration
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

    // Login
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

    // Logout
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

    // Event creation
    const createEventForm = document.getElementById("create-event-form");
    if (createEventForm) {
        createEventForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const eventName = document.getElementById("event-name").value;
            const eventDate = document.getElementById("event-date").value;
            const eventCode = document.getElementById("event-code").value;
            const trackName = document.getElementById("track-name").value;
            const trackId = document.getElementById("track-id").value;

            try {
                await addDoc(collection(db, `users/${auth.currentUser.uid}/events`), {
                    name: eventName,
                    date: eventDate,
                    code: eventCode,
                    trackName: trackName,
                    trackId: trackId,
                    status: "upcoming"
                });
                alert("Event created successfully!");
                createEventForm.reset();
                loadDashboard(auth.currentUser); // Refresh events list
            } catch (error) {
                console.error("Error creating event:", error.message);
                alert(`Error creating event: ${error.message}`);
            }
        });
    }
}

// Load dashboard events
async function loadDashboard(user) {
    try {
        const eventsRef = collection(db, `users/${user.uid}/events`);
        const eventSnapshot = await getDocs(eventsRef);
        const eventContainer = document.getElementById("event-container");
        eventContainer.innerHTML = ""; // Clear previous events
        eventSnapshot.forEach((doc) => {
            displayEventCard(doc.id, doc.data());
        });
    } catch (error) {
        console.error("Error loading dashboard:", error.message);
    }
}

// Display event card
function displayEventCard(eventId, eventData) {
    const eventContainer = document.getElementById("event-container");
    const eventCard = document.createElement("div");
    eventCard.classList.add("event-card");
    eventCard.innerHTML = `
        <h3>${eventData.name}</h3>
        <p>Date: ${eventData.date}</p>
        <p>Participants: ${eventData.participants || 0}</p>
        <p>Status: ${eventData.status}</p>
        <button onclick="editEvent('${eventId}', '${eventData.name}', '${eventData.date}')">Edit</button>
        <button onclick="deleteEvent('${eventId}')">Delete</button>
    `;
    eventContainer.appendChild(eventCard);
}

// Event editing
window.editEvent = function(eventId, currentName, currentDate) {
    const newName = prompt("Edit Event Name:", currentName);
    const newDate = prompt("Edit Event Date:", currentDate);
    if (newName && newDate) {
        const eventRef = doc(db, `users/${auth.currentUser.uid}/events`, eventId);
        updateDoc(eventRef, { name: newName, date: newDate })
            .then(() => {
                alert("Event updated successfully!");
                loadDashboard(auth.currentUser); // Refresh events list
            })
            .catch((error) => {
                console.error("Error updating event:", error.message);
            });
    }
};

// Event deletion
window.deleteEvent = function(eventId) {
    if (confirm("Are you sure you want to delete this event?")) {
        const eventRef = doc(db, `users/${auth.currentUser.uid}/events`, eventId);
        deleteDoc(eventRef)
            .then(() => {
                alert("Event deleted successfully!");
                loadDashboard(auth.currentUser); // Refresh events list
            })
            .catch((error) => {
                console.error("Error deleting event:", error.message);
            });
    }
};
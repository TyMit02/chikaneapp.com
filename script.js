import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

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

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is logged in:", user.email);
            loadDashboard(user);
            setupEventCreation(user);
        } else {
            console.log("User not logged in, redirecting to login.");
            window.location.href = "login.html";
        }
    });

    // Handle Logout
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

// Load dashboard data
async function loadDashboard(user) {
    try {
        const eventsRef = collection(db, `users/${user.uid}/events`);
        const eventSnapshot = await getDocs(eventsRef);
        const eventContainer = document.getElementById("event-container");

        // Reset container to avoid duplicates
        eventContainer.innerHTML = "";

        let totalEvents = 0;
        let totalParticipants = 0;
        let completedSessions = 0;

        eventSnapshot.forEach((doc) => {
            totalEvents++;
            const eventData = doc.data();
            totalParticipants += eventData.participants || 0;
            if (eventData.status === "completed") completedSessions++;

            // Create event card
            const eventCard = document.createElement("div");
            eventCard.classList.add("event-card");
            eventCard.innerHTML = `
                <h3>${eventData.name}</h3>
                <p>Date: ${eventData.date}</p>
                <p>Participants: ${eventData.participants || 0}</p>
                <button onclick="editEvent('${doc.id}')">Edit</button>
                <button onclick="deleteEvent('${doc.id}')">Delete</button>
            `;
            eventContainer.appendChild(eventCard);
        });

        // Update dashboard summary
        document.getElementById("total-events").textContent = totalEvents;
        document.getElementById("total-participants").textContent = totalParticipants;
        document.getElementById("completed-sessions").textContent = completedSessions;
    } catch (error) {
        console.error("Error loading dashboard:", error.message);
    }
}

// Set up event creation form
function setupEventCreation(user) {
    const createEventForm = document.getElementById("create-event-form");
    if (createEventForm) {
        createEventForm.addEventListener("submit", async (event) => {
            event.preventDefault(); // Prevent page refresh

            const eventName = document.getElementById("event-name").value;
            const eventDate = document.getElementById("event-date").value;
            const eventDescription = document.getElementById("event-description").value;
            const eventParticipants = parseInt(document.getElementById("event-participants").value, 10) || 0;

            try {
                // Add new event to Firestore
                await addDoc(collection(db, `users/${user.uid}/events`), {
                    name: eventName,
                    date: eventDate,
                    description: eventDescription,
                    participants: eventParticipants,
                    status: "upcoming"
                });
                console.log("Event created successfully!");
                alert("Event created successfully!");
                createEventForm.reset();
                loadDashboard(user); // Refresh dashboard
            } catch (error) {
                console.error("Error creating event:", error.message);
                alert(`Error creating event: ${error.message}`);
            }
        });
    }
}

// Placeholder functions for editing and deleting events
function editEvent(eventId) {
    alert(`Edit event: ${eventId}`);
}

function deleteEvent(eventId) {
    alert(`Delete event: ${eventId}`);
}
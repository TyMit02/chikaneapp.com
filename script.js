import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

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
        let totalEvents = 0;
        let totalParticipants = 0;
        let completedSessions = 0;

        eventContainer.innerHTML = ""; // Clear previous event cards

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
                <a href="event-details.html?eventId=${doc.id}" class="view-event-button">View Event</a>
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

// Fetch event details based on URL parameter
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('eventId');

    if (eventId) {
        loadEventDetails(eventId);
    }
});

// Load event details
async function loadEventDetails(eventId) {
    const user = auth.currentUser;
    if (user) {
        try {
            const eventRef = doc(db, `users/${user.uid}/events/${eventId}`);
            const eventDoc = await getDoc(eventRef);

            if (eventDoc.exists()) {
                const eventData = eventDoc.data();
                document.getElementById('event-name').textContent = eventData.name;
                document.getElementById('event-date').textContent = `Date: ${eventData.date}`;
                document.getElementById('event-description').textContent = `Description: ${eventData.description}`;
                
                // Fetch and display participants
                loadParticipants(eventId, user.uid);
            } else {
                console.log("No such event!");
            }
        } catch (error) {
            console.error("Error fetching event details:", error.message);
        }
    }
}

// Load participants for an event
async function loadParticipants(eventId, userId) {
    const participantsContainer = document.getElementById('participants-container');
    participantsContainer.innerHTML = "";

    const participantsRef = collection(db, `users/${userId}/events/${eventId}/participants`);
    const participantsSnapshot = await getDocs(participantsRef);

    participantsSnapshot.forEach((doc) => {
        const participantData = doc.data();
        const participantCard = document.createElement("div");
        participantCard.classList.add("participant-card");
        participantCard.innerHTML = `
            <p>Name: ${participantData.name}</p>
            <p>Vehicle: ${participantData.vehicle}</p>
            <p>Email: ${participantData.email}</p>
        `;
        participantsContainer.appendChild(participantCard);
    });
}

// Placeholder functions for editing and deleting events
function editEvent(eventId) {
    alert(`Edit event: ${eventId}`);
}

function deleteEvent(eventId) {
    alert(`Delete event: ${eventId}`);
}
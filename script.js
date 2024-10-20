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
const realTimeDb = getDatabase(app);

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
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
        eventContainer.innerHTML = ''; // Clear existing events

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
                <button onclick="editEvent('${doc.id}', '${user.uid}')">Edit</button>
                <button onclick="deleteEvent('${doc.id}', '${user.uid}')">Delete</button>
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
            const eventParticipants = parseInt(document.getElementById("event-participants").value, 10);

            try {
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
                window.location.reload();
            } catch (error) {
                console.error("Error creating event:", error.message);
                alert(`Error creating event: ${error.message}`);
            }
        });
    }
}

// Edit event
window.editEvent = async function(eventId, userId) {
    const eventRef = doc(db, `users/${userId}/events`, eventId);
    const eventDoc = await getDocs(eventRef);

    if (eventDoc.exists()) {
        const eventData = eventDoc.data();

        // Prefill the edit form
        document.getElementById("edit-event-name").value = eventData.name;
        document.getElementById("edit-event-date").value = eventData.date;
        document.getElementById("edit-event-description").value = eventData.description;
        document.getElementById("edit-event-participants").value = eventData.participants || 0;

        // Show the edit form
        document.getElementById("edit-event-modal").style.display = "block";

        // Handle event update
        document.getElementById("edit-event-form").addEventListener("submit", async (event) => {
            event.preventDefault();

            try {
                await updateDoc(eventRef, {
                    name: document.getElementById("edit-event-name").value,
                    date: document.getElementById("edit-event-date").value,
                    description: document.getElementById("edit-event-description").value,
                    participants: parseInt(document.getElementById("edit-event-participants").value, 10),
                });
                console.log("Event updated successfully!");
                alert("Event updated successfully!");
                window.location.reload();
            } catch (error) {
                console.error("Error updating event:", error.message);
                alert(`Error updating event: ${error.message}`);
            }
        });
    } else {
        console.error("No such event found.");
        alert("No such event found.");
    }
};

// Delete event
window.deleteEvent = async function(eventId, userId) {
    const eventRef = doc(db, `users/${userId}/events`, eventId);

    if (confirm("Are you sure you want to delete this event?")) {
        try {
            await deleteDoc(eventRef);
            console.log("Event deleted successfully!");
            alert("Event deleted successfully!");
            window.location.reload();
        } catch (error) {
            console.error("Error deleting event:", error.message);
            alert(`Error deleting event: ${error.message}`);
        }
    }
};

// Realtime Database Listener for Laps (if applicable)
const lapsRef = ref(realTimeDb, 'laps');
onValue(lapsRef, (snapshot) => {
    const totalLaps = snapshot.val() || 0; // Default to 0 if no data
    document.querySelector('.stats-number').textContent = totalLaps + '+';
});
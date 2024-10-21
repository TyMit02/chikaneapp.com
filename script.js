import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

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
            setupEventFiltering(user);
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

        eventContainer.innerHTML = ""; // Clear existing events

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
                <p>Status: ${eventData.status}</p>
                <button onclick="editEvent('${doc.id}', '${eventData.name}', '${eventData.date}', '${eventData.status}')">Edit</button>
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
            const eventCode = document.getElementById("event-code").value;
            const trackName = document.getElementById("track-name").value;
            const trackId = document.getElementById("track-id").value;

            try {
                await addDoc(collection(db, `users/${user.uid}/events`), {
                    name: eventName,
                    date: eventDate,
                    code: eventCode,
                    trackName: trackName,
                    trackId: trackId,
                    status: "upcoming"
                });
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

// Edit event function
async function editEvent(eventId, eventName, eventDate, eventStatus) {
    const newName = prompt("Edit Event Name:", eventName);
    const newDate = prompt("Edit Event Date:", eventDate);
    const newStatus = prompt("Edit Event Status:", eventStatus);

    if (newName && newDate && newStatus) {
        try {
            const eventRef = doc(db, `users/${auth.currentUser.uid}/events/${eventId}`);
            await updateDoc(eventRef, {
                name: newName,
                date: newDate,
                status: newStatus
            });
            alert("Event updated successfully!");
            window.location.reload();
        } catch (error) {
            console.error("Error updating event:", error.message);
        }
    }
}

// Delete event function
async function deleteEvent(eventId) {
    if (confirm("Are you sure you want to delete this event?")) {
        try {
            const eventRef = doc(db, `users/${auth.currentUser.uid}/events/${eventId}`);
            await deleteDoc(eventRef);
            alert("Event deleted successfully!");
            window.location.reload();
        } catch (error) {
            console.error("Error deleting event:", error.message);
        }
    }
}

// Set up event filtering and search
function setupEventFiltering(user) {
    const searchInput = document.getElementById("search-input");
    const filterStatus = document.getElementById("filter-status");

    searchInput.addEventListener("input", () => filterEvents(user));
    filterStatus.addEventListener("change", () => filterEvents(user));
}

// Filter events based on search and status
async function filterEvents(user) {
    const searchValue = document.getElementById("search-input").value.toLowerCase();
    const selectedStatus = document.getElementById("filter-status").value;

    const eventsRef = collection(db, `users/${user.uid}/events`);
    let eventQuery = eventsRef;

    if (selectedStatus) {
        eventQuery = query(eventsRef, where("status", "==", selectedStatus));
    }

    const eventSnapshot = await getDocs(eventQuery);
    const eventContainer = document.getElementById("event-container");
    eventContainer.innerHTML = ""; // Clear existing events

    eventSnapshot.forEach((doc) => {
        const eventData = doc.data();
        if (eventData.name.toLowerCase().includes(searchValue)) {
            const eventCard = document.createElement("div");
            eventCard.classList.add("event-card");
            eventCard.innerHTML = `
                <h3>${eventData.name}</h3>
                <p>Date: ${eventData.date}</p>
                <p>Status: ${eventData.status}</p>
                <button onclick="editEvent('${doc.id}', '${eventData.name}', '${eventData.date}', '${eventData.status}')">Edit</button>
                <button onclick="deleteEvent('${doc.id}')">Delete</button>
            `;
            eventContainer.appendChild(eventCard);
        }
    });
}
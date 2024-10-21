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
        eventContainer.innerHTML = ''; // Clear container

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
                <button onclick="viewEventDetails('${doc.id}')">View Details</button>
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
            const organizerId = user.uid;

            // Log the form data
            console.log("Creating event with data:", {
                eventName, eventDate, eventCode, trackName, trackId, organizerId
            });

            if (!eventName || !eventDate || !eventCode || !trackName || !trackId) {
                alert("Please fill in all fields.");
                return;
            }

            try {
                await addDoc(collection(db, `users/${organizerId}/events`), {
                    name: eventName,
                    date: eventDate,
                    code: eventCode,
                    trackName: trackName,
                    trackId: trackId,
                    organizerId: organizerId,
                    participants: 0,
                    status: "upcoming"
                });

                console.log("Event created successfully!");
                alert("Event created successfully!");
                createEventForm.reset();
                loadDashboard(user); // Refresh the dashboard with the new event
            } catch (error) {
                console.error("Error creating event:", error.message);
                alert(`Error creating event: ${error.message}`);
            }
        });
    }
}

// View event details
window.viewEventDetails = async function (eventId) {
    try {
        const user = auth.currentUser;
        const eventDocRef = doc(db, `users/${user.uid}/events/${eventId}`);
        const eventDoc = await getDoc(eventDocRef);

        if (eventDoc.exists()) {
            const eventData = eventDoc.data();
            alert(`Event: ${eventData.name}\nDate: ${eventData.date}\nParticipants: ${eventData.participants}`);
            // Redirect to event details page (to be implemented)
        } else {
            console.error("No such event!");
        }
    } catch (error) {
        console.error("Error fetching event details:", error.message);
    }
}
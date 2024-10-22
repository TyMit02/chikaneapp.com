import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { getFirestore, doc, collection, addDoc, getDocs, deleteDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";


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

    // Event search and filter setup
    document.getElementById('search-participant').addEventListener('input', searchParticipants);
    document.getElementById('filter-participant-status').addEventListener('change', filterParticipants);
});
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

// Check if user is logged in
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is logged in:", user.email);
            loadEventDetails(user);
            setupParticipantManagement(user);
        } else {
            console.log("User not logged in, redirecting to login.");
            window.location.href = "login.html";
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

// Load event details and participants
async function loadEventDetails(user) {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get("eventId");

    if (eventId) {
        try {
            const eventRef = doc(db, `users/${user.uid}/events`, eventId);
            const eventSnap = await getDoc(eventRef);

            if (eventSnap.exists()) {
                const eventData = eventSnap.data();
                document.getElementById("event-name").textContent = eventData.name;
                document.getElementById("event-date").textContent = eventData.date;
                document.getElementById("event-description").textContent = eventData.description;

                loadParticipants(user, eventId);
            } else {
                console.error("No event found!");
            }
        } catch (error) {
            console.error("Error loading event details:", error.message);
        }
    } else {
        console.error("Event ID not found in URL.");
    }
}

// Load participants for an event
async function loadParticipants(user, eventId) {
    try {
        const participantsRef = collection(db, `users/${user.uid}/events/${eventId}/participants`);
        const participantSnapshot = await getDocs(participantsRef);
        const participantList = document.getElementById("participants-list");

        // Check if the participant list element exists
        if (!participantList) {
            console.error("Participant list element not found on the page.");
            return;
        }

        participantList.innerHTML = ""; // Clear existing list

        // Iterate through participants
        participantSnapshot.forEach((doc) => {
            const participantData = doc.data();

            // Create participant item
            const participantItem = document.createElement("div");
            participantItem.classList.add("participant-item");
            participantItem.innerHTML = `
                <p>${participantData.name}</p>
                <button onclick="editParticipant('${user.uid}', '${eventId}', '${doc.id}', '${participantData.name}')">Edit</button>
                <button onclick="removeParticipant('${user.uid}', '${eventId}', '${doc.id}')">Remove</button>
            `;
            participantList.appendChild(participantItem);
        });
    } catch (error) {
        console.error("Error loading participants:", error.message);
    }
}

// Add a new participant to an event
async function addParticipant(user, eventId) {
    const participantName = document.getElementById("participant-name").value;
    if (!participantName.trim()) return alert("Please enter a participant name.");

    try {
        await addDoc(collection(db, `users/${user.uid}/events/${eventId}/participants`), {
            name: participantName,
            registrationDate: new Date().toISOString(),
            status: "active" // New field for participant status
        });
        console.log("Participant added successfully!");
        document.getElementById("participant-name").value = ""; // Clear input field
        loadParticipants(user, eventId); // Refresh participant list
    } catch (error) {
        console.error("Error adding participant:", error.message);
    }
}

// Edit a participant's name
async function editParticipant(userId, eventId, participantId, currentName) {
    const newName = prompt("Edit participant name:", currentName);
    if (!newName || newName.trim() === currentName) return;

    try {
        const participantRef = doc(db, `users/${userId}/events/${eventId}/participants`, participantId);
        await updateDoc(participantRef, { name: newName });
        console.log("Participant name updated successfully!");
        loadParticipants({ uid: userId }, eventId); // Refresh participant list
    } catch (error) {
        console.error("Error updating participant:", error.message);
    }
}

// Remove a participant from an event
async function removeParticipant(userId, eventId, participantId) {
    try {
        const participantRef = doc(db, `users/${userId}/events/${eventId}/participants`, participantId);
        await deleteDoc(participantRef);
        console.log("Participant removed successfully!");
        loadParticipants({ uid: userId }, eventId); // Refresh participant list
    } catch (error) {
        console.error("Error removing participant:", error.message);
    }
}

// Setup participant management
function setupParticipantManagement(user) {
    const addParticipantForm = document.getElementById("add-participant-form");
    if (addParticipantForm) {
        addParticipantForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const urlParams = new URLSearchParams(window.location.search);
            const eventId = urlParams.get("eventId");
            addParticipant(user, eventId);
        });
    }
}

// Load event details
async function loadEventDetails(eventId) {
    const eventTitleElement = document.getElementById("event-title");
    const eventDescriptionElement = document.getElementById("event-description");

    if (!eventTitleElement || !eventDescriptionElement) {
        console.error("Event detail elements not found on the page.");
        return;
    }

    try {
        // Fetch event details from Firestore
        const eventRef = doc(db, `users/${auth.currentUser.uid}/events`, eventId);
        const eventSnapshot = await getDoc(eventRef);

        if (eventSnapshot.exists()) {
            const eventData = eventSnapshot.data();
            eventTitleElement.textContent = eventData.name || "No Title";
            eventDescriptionElement.textContent = eventData.description || "No Description";
        } else {
            console.error("Event does not exist.");
        }
    } catch (error) {
        console.error("Error loading event details:", error.message);
    }
}

// Initialize participant management once the user is authenticated
document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const urlParams = new URLSearchParams(window.location.search);
            const eventId = urlParams.get("eventId");

            if (eventId) {
                setupParticipantManagement(user);
                loadParticipants(user, eventId);
                loadEventDetails(eventId);
            }
        } else {
            window.location.href = "login.html";
        }
    });
});
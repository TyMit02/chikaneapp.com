import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
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

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is logged in:", user.email);

            const urlParams = new URLSearchParams(window.location.search);
            const eventId = urlParams.get("eventId");

            if (eventId) {
                loadEventDetails(user, eventId);
                setupScheduleManagement(user, eventId);
                setupParticipantManagement(user, eventId);
            } else {
                setupEventCreation(user);
                loadEvents(user);
            }
        } else {
            console.log("User not logged in");
            window.location.href = "login.html";
        }
    });

    // Logout functionality
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

// Load event details
async function loadEventDetails(user, eventId) {
    try {
        const eventRef = doc(db, `users/${user.uid}/events/${eventId}`);
        const eventDoc = await getDoc(eventRef);

        if (eventDoc.exists()) {
            const eventData = eventDoc.data();
            document.getElementById("event-title").textContent = eventData.name || "No title";
            document.getElementById("event-description").textContent = eventData.description || "No description";
            loadSchedules(user, eventId);
            loadParticipants(user, eventId);
        } else {
            console.error("Event not found!");
        }
    } catch (error) {
        console.error("Error loading event details:", error.message);
    }
}

// Load schedules for an event
async function loadSchedules(user, eventId) {
    const scheduleList = document.getElementById("schedules-list");
    if (!scheduleList) {
        console.warn("Schedule list element not found.");
        return;
    }

    try {
        const schedulesRef = collection(db, `users/${user.uid}/events/${eventId}/schedules`);
        const scheduleSnapshot = await getDocs(schedulesRef);
        scheduleList.innerHTML = ""; // Clear existing list

        scheduleSnapshot.forEach((doc) => {
            const scheduleData = doc.data();
            const scheduleItem = document.createElement("div");
            scheduleItem.classList.add("schedule-item");
            scheduleItem.innerHTML = `
                <p>${scheduleData.name} - ${scheduleData.time}</p>
                <button onclick="removeSchedule('${user.uid}', '${eventId}', '${doc.id}')">Remove</button>
            `;
            scheduleList.appendChild(scheduleItem);
        });
    } catch (error) {
        console.error("Error loading schedules:", error.message);
    }
}

// Add a schedule
function setupScheduleManagement(user, eventId) {
    const addScheduleForm = document.getElementById("add-schedule-form");

    if (addScheduleForm) {
        addScheduleForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const scheduleName = document.getElementById("schedule-name").value;
            const scheduleTime = document.getElementById("schedule-time").value;

            if (!scheduleName || !scheduleTime) {
                return alert("Please fill out all schedule fields.");
            }

            try {
                await addDoc(collection(db, `users/${user.uid}/events/${eventId}/schedules`), {
                    name: scheduleName,
                    time: scheduleTime,
                    createdAt: new Date().toISOString(),
                });
                alert("Schedule added successfully!");
                loadSchedules(user, eventId);
                addScheduleForm.reset();
            } catch (error) {
                console.error("Error adding schedule:", error.message);
            }
        });
    }

    loadSchedules(user, eventId);
}

// Remove a schedule from an event
async function removeSchedule(userId, eventId, scheduleId) {
    try {
        await deleteDoc(doc(db, `users/${userId}/events/${eventId}/schedules`, scheduleId));
        console.log("Schedule removed successfully!");
        loadSchedules({ uid: userId }, eventId);
    } catch (error) {
        console.error("Error removing schedule:", error.message);
    }
}

// Load participants for an event
async function loadParticipants(user, eventId) {
    try {
        const participantsRef = collection(db, `users/${user.uid}/events/${eventId}/participants`);
        const participantSnapshot = await getDocs(participantsRef);
        const participantList = document.getElementById("participants-list");

        if (!participantList) {
            console.warn("Participants list element not found.");
            return;
        }

        participantList.innerHTML = ""; // Clear existing list

        participantSnapshot.forEach((doc) => {
            const participantData = doc.data();

            // Create participant item
            const participantItem = document.createElement("div");
            participantItem.classList.add("participant-item");
            participantItem.innerHTML = `
                <p>${participantData.name}</p>
                <button onclick="removeParticipant('${user.uid}', '${eventId}', '${doc.id}')">Remove</button>
            `;
            participantList.appendChild(participantItem);
        });
    } catch (error) {
        console.error("Error loading participants:", error.message);
    }
}

// Add a new participant to an event
function setupParticipantManagement(user, eventId) {
    const addParticipantForm = document.getElementById("add-participant-form");

    if (addParticipantForm) {
        addParticipantForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const participantName = document.getElementById("participant-name").value;

            if (participantName.trim() === "") {
                return alert("Please enter a participant name.");
            }

            try {
                await addDoc(collection(db, `users/${user.uid}/events/${eventId}/participants`), {
                    name: participantName,
                    registrationDate: new Date().toISOString()
                });
                console.log("Participant added successfully!");
                loadParticipants(user, eventId);
                addParticipantForm.reset();
            } catch (error) {
                console.error("Error adding participant:", error.message);
            }
        });
    }

    loadParticipants(user, eventId);
}

// Remove a participant from an event
async function removeParticipant(userId, eventId, participantId) {
    try {
        await deleteDoc(doc(db, `users/${userId}/events/${eventId}/participants`, participantId));
        console.log("Participant removed successfully!");
        loadParticipants({ uid: userId }, eventId);
    } catch (error) {
        console.error("Error removing participant:", error.message);
    }
}

// Setup event creation form
function setupEventCreation(user) {
    document.addEventListener('DOMContentLoaded', () => {
        const createEventForm = document.getElementById("create-event-form");

        if (createEventForm) {
            createEventForm.addEventListener("submit", async (event) => {
                event.preventDefault();

                // Get input values safely
                const eventNameInput = document.getElementById("event-name");
                const eventDateInput = document.getElementById("event-date");
                const eventDescriptionInput = document.getElementById("event-description");

                // Check if inputs exist
                if (!eventNameInput || !eventDateInput || !eventDescriptionInput) {
                    console.error("One or more input fields not found.");
                    return;
                }

                const eventName = eventNameInput.value;
                const eventDate = eventDateInput.value;
                const eventDescription = eventDescriptionInput.value;

                // Validate input fields
                if (!eventName || !eventDate || !eventDescription) {
                    return alert("Please fill out all event fields.");
                }

                try {
                    await addDoc(collection(db, `users/${user.uid}/events`), {
                        name: eventName,
                        date: eventDate,
                        description: eventDescription,
                        createdAt: new Date().toISOString(),
                    });
                    console.log("Event created successfully!");
                    alert("Event created successfully!");
                    loadEvents(user);
                    createEventForm.reset();
                } catch (error) {
                    console.error("Error creating event:", error.message);
                }
            });
        } else {
            console.warn("Create Event form not found.");
        }
    });
}
// Load events for the user
async function loadEvents(user) {
    try {
        const eventsRef = collection(db, `users/${user.uid}/events`);
        const eventSnapshot = await getDocs(eventsRef);
        const eventContainer = document.getElementById("event-container");

        if (!eventContainer) {
            console.warn("Event container not found.");
            return;
        }

        eventContainer.innerHTML = ""; // Clear existing events

        eventSnapshot.forEach((doc) => {
            const eventData = doc.data();
            const eventCard = document.createElement("div");
            eventCard.classList.add("event-card");
            eventCard.innerHTML = `
                <h3>${eventData.name}</h3>
                <p>Date: ${eventData.date}</p>
                <p>${eventData.description}</p>
                <button onclick="viewEventDetails('${doc.id}')">View Details</button>
            `;
            eventContainer.appendChild(eventCard);
        });
    } catch (error) {
        console.error("Error loading events:", error.message);
    }
}

// View event details
function viewEventDetails(eventId) {
    window.location.href = `event-details.html?eventId=${eventId}`;
}
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
                setupEventDetails(user, eventId);
                setupParticipantManagement(user, eventId);
                setupScheduleManagement(user, eventId);
            } else {
                setupEventCreation(user);
                loadEvents(user);
            }
        } else {
            console.log("User not logged in");
            window.location.href = "login.html";
        }
    });
});

// Setup event creation
function setupEventCreation(user) {
    const createEventForm = document.getElementById("create-event-form");
    if (createEventForm) {
        createEventForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const eventName = document.getElementById("event-name").value;
            const eventDate = document.getElementById("event-date").value;
            const eventDescription = document.getElementById("event-description").value;

            if (eventName && eventDate && eventDescription) {
                try {
                    await addDoc(collection(db, `users/${user.uid}/events`), {
                        name: eventName,
                        date: eventDate,
                        description: eventDescription,
                        createdAt: new Date().toISOString(),
                    });
                    alert("Event created successfully!");
                    loadEvents(user);
                    createEventForm.reset();
                } catch (error) {
                    console.error("Error creating event:", error.message);
                }
            } else {
                alert("All fields are required.");
            }
        });
    }
}

// Load events
async function loadEvents(user) {
    try {
        const eventsRef = collection(db, `users/${user.uid}/events`);
        const eventSnapshot = await getDocs(eventsRef);
        const eventContainer = document.getElementById("event-container");

        eventContainer.innerHTML = "";
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
window.viewEventDetails = function(eventId) {
    window.location.href = `event-details.html?eventId=${eventId}`;
}

// Setup event details page
function setupEventDetails(user, eventId) {
    loadEventDetails(user, eventId);
    setupParticipantManagement(user, eventId);
    setupScheduleManagement(user, eventId);
}

// Load event details
async function loadEventDetails(user, eventId) {
    const eventTitle = document.getElementById("event-title");
    const eventCode = document.getElementById("event-code");
    const trackName = document.getElementById("track-name");

    if (!eventTitle || !eventCode || !trackName) {
        console.error("Event detail elements not found on the page.");
        return;
    }

    try {
        const eventDoc = await getDoc(doc(db, `users/${user.uid}/events`, eventId));
        if (eventDoc.exists()) {
            const eventData = eventDoc.data();
            eventTitle.textContent = eventData.name;
            eventCode.textContent = eventData.code || "N/A";
            trackName.textContent = eventData.track || "N/A";
        } else {
            console.error("No such event found.");
        }
    } catch (error) {
        console.error("Error loading event details:", error.message);
    }
}

// Setup participant management
function setupParticipantManagement(user, eventId) {
    const participantForm = document.getElementById("add-participant-form");
    if (participantForm) {
        participantForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const participantName = document.getElementById("participant-name").value;
            if (participantName) {
                try {
                    await addDoc(collection(db, `users/${user.uid}/events/${eventId}/participants`), {
                        name: participantName,
                    });
                    alert("Participant added successfully!");
                    loadParticipants(user, eventId);
                    participantForm.reset();
                } catch (error) {
                    console.error("Error adding participant:", error.message);
                }
            } else {
                alert("Please enter a participant name.");
            }
        });
    }

    loadParticipants(user, eventId);
}

// Load participants
async function loadParticipants(user, eventId) {
    const participantList = document.getElementById("participants-list");
    if (!participantList) {
        console.error("Participant list element not found.");
        return;
    }

    participantList.innerHTML = "";
    try {
        const participantsRef = collection(db, `users/${user.uid}/events/${eventId}/participants`);
        const participantSnapshot = await getDocs(participantsRef);

        participantSnapshot.forEach((doc) => {
            const participantData = doc.data();
            const participantItem = document.createElement("div");
            participantItem.textContent = participantData.name;
            participantList.appendChild(participantItem);
        });
    } catch (error) {
        console.error("Error loading participants:", error.message);
    }
}

// Setup schedule management
function setupScheduleManagement(user, eventId) {
    const scheduleForm = document.getElementById("add-schedule-form");
    if (scheduleForm) {
        scheduleForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const scheduleTitle = document.getElementById("schedule-title").value;
            const scheduleDate = document.getElementById("schedule-date").value;

            if (scheduleTitle && scheduleDate) {
                try {
                    await addDoc(collection(db, `users/${user.uid}/events/${eventId}/schedules`), {
                        title: scheduleTitle,
                        date: scheduleDate,
                    });
                    alert("Schedule added successfully!");
                    loadSchedules(user, eventId);
                    scheduleForm.reset();
                } catch (error) {
                    console.error("Error adding schedule:", error.message);
                }
            } else {
                alert("Please fill out all fields.");
            }
        });
    }

    loadSchedules(user, eventId);
}

// Load schedules
async function loadSchedules(user, eventId) {
    const schedulesList = document.getElementById("schedules-list");
    if (!schedulesList) {
        console.error("Schedules list element not found.");
        return;
    }

    schedulesList.innerHTML = "";
    try {
        const schedulesRef = collection(db, `users/${user.uid}/events/${eventId}/schedules`);
        const scheduleSnapshot = await getDocs(schedulesRef);

        scheduleSnapshot.forEach((doc) => {
            const scheduleData = doc.data();
            const scheduleItem = document.createElement("div");
            scheduleItem.textContent = `${scheduleData.title} - ${scheduleData.date}`;
            schedulesList.appendChild(scheduleItem);
        });
    } catch (error) {
        console.error("Error loading schedules:", error.message);
    }
}

// Logout functionality
const logoutButton = document.getElementById("logout-button");
if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "login.html";
        } catch (error) {
            console.error("Error during logout:", error.message);
        }
    });
}
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
            const urlParams = new URLSearchParams(window.location.search);
            const eventId = urlParams.get("eventId");

            if (eventId) {
                loadEventDetails(user, eventId);
                setupParticipantManagement(user, eventId);
                setupScheduleManagement(user, eventId);
            } else {
                setupEventCreation(user);
                loadEvents(user);
            }
        } else {
            window.location.href = "login.html";
        }
    });
});

// Event creation
function setupEventCreation(user) {
    const createEventForm = document.getElementById("create-event-form");
    if (createEventForm) {
        createEventForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = document.getElementById("event-name").value;
            const date = document.getElementById("event-date").value;
            const description = document.getElementById("event-description").value;

            if (name && date && description) {
                try {
                    await addDoc(collection(db, `users/${user.uid}/events`), {
                        name,
                        date,
                        description,
                        createdAt: new Date().toISOString()
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
                        name: participantName
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
}

// Load participants
async function loadParticipants(user, eventId) {
    const participantList = document.getElementById("participants-list");
    if (!participantList) return;

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

            const title = document.getElementById("schedule-title").value;
            const date = document.getElementById("schedule-date").value;
            if (title && date) {
                try {
                    await addDoc(collection(db, `users/${user.uid}/events/${eventId}/schedules`), {
                        title,
                        date
                    });
                    alert("Schedule added successfully!");
                    loadSchedules(user, eventId);
                    scheduleForm.reset();
                } catch (error) {
                    console.error("Error adding schedule:", error.message);
                }
            } else {
                alert("All schedule fields are required.");
            }
        });
    }
}

// Load schedules
async function loadSchedules(user, eventId) {
    const schedulesList = document.getElementById("schedules-list");
    if (!schedulesList) return;

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
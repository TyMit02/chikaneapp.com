import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

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

// Load event details when the page is loaded
document.addEventListener('DOMContentLoaded', () => {
    const eventId = new URLSearchParams(window.location.search).get('eventId');
    loadEventDetails(eventId);
    setupEventModals();
    handleLogout();
});

// Load event details from Firestore
async function loadEventDetails(eventId) {
    if (!eventId) return;
    
    try {
        const eventDoc = await getDoc(doc(db, "events", eventId));
        if (!eventDoc.exists()) {
            console.error("Event not found");
            return;
        }

        const eventData = eventDoc.data();
        document.getElementById("event-name").textContent = eventData.name;
        document.getElementById("event-date").textContent = `Event Date: ${eventData.date}`;
        document.getElementById("event-code").textContent = `Event Code: ${eventData.eventCode}`;
        document.getElementById("track-name").textContent = `Track: ${eventData.track}`;

        loadParticipants(eventId);
        loadSchedule(eventId);
    } catch (error) {
        console.error("Error loading event details:", error.message);
    }
}

// Load participants from Firestore
async function loadParticipants(eventId) {
    try {
        const participantsRef = collection(db, `events/${eventId}/participants`);
        const participantsSnapshot = await getDocs(participantsRef);
        const participantsList = document.getElementById("participants-list");
        participantsList.innerHTML = "";

        participantsSnapshot.forEach((doc) => {
            const participant = doc.data();
            const participantItem = document.createElement("div");
            participantItem.textContent = participant.name;
            participantsList.appendChild(participantItem);
        });
    } catch (error) {
        console.error("Error loading participants:", error.message);
    }
}

// Load schedule from Firestore
async function loadSchedule(eventId) {
    try {
        const scheduleRef = collection(db, `events/${eventId}/schedule`);
        const scheduleSnapshot = await getDocs(scheduleRef);
        const scheduleList = document.getElementById("schedule-list");
        scheduleList.innerHTML = "";

        scheduleSnapshot.forEach((doc) => {
            const scheduleItem = doc.data();
            const scheduleElement = document.createElement("div");
            scheduleElement.textContent = `${scheduleItem.name} at ${scheduleItem.time}`;
            scheduleList.appendChild(scheduleElement);
        });
    } catch (error) {
        console.error("Error loading schedule:", error.message);
    }
}

// Setup modals for adding participants and schedule items
function setupEventModals() {
    const addParticipantButton = document.getElementById("add-participant-button");
    const addScheduleItemButton = document.getElementById("add-schedule-item-button");
    const addParticipantModal = document.getElementById("add-participant-modal");
    const addScheduleItemModal = document.getElementById("add-schedule-item-modal");

    addParticipantButton.addEventListener("click", () => {
        addParticipantModal.style.display = "block";
    });

    addScheduleItemButton.addEventListener("click", () => {
        addScheduleItemModal.style.display = "block";
    });

    const closeButtons = document.querySelectorAll(".close-button");
    closeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            addParticipantModal.style.display = "none";
            addScheduleItemModal.style.display = "none";
        });
    });
}

// Handle user logout
function handleLogout() {
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            try {
                await signOut(auth);
                window.location.href = "login.html";
            } catch (error) {
                console.error("Logout error:", error.message);
            }
        });
    }
}
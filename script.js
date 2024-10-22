import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy,
    serverTimestamp,
    arrayUnion,
    arrayRemove 
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { 
    initializeAuthHandler, 
    requireAuth, 
    getCurrentUser, 
    getCurrentUserEmail 
} from './auth-handler.js';

// Initialize Firebase with your config
const firebaseConfig = {
    apiKey: "AIzaSyC3g85grffiBMjSWQ-1XMljIlEU6_bt_w8",
    authDomain: "chikane-e5fa1.firebaseapp.com",
    projectId: "chikane-e5fa1",
    storageBucket: "chikane-e5fa1.appspot.com",
    messagingSenderId: "989422231159",
    appId: "1:989422231159:web:2895f389094dcccb9d3072",
    measurementId: "G-GX4ZZW6EXK"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Add this to show who is logged in (for debugging)
function displayCurrentUser() {
    const userEmail = getCurrentUserEmail();
    console.log('Currently logged in as:', userEmail);
    
    // If you want to display it on the page
    const userDisplay = document.createElement('div');
    userDisplay.style.position = 'fixed';
    userDisplay.style.top = '10px';
    userDisplay.style.right = '10px';
    userDisplay.style.padding = '10px';
    userDisplay.style.background = 'rgba(0,0,0,0.7)';
    userDisplay.style.color = 'white';
    userDisplay.style.borderRadius = '5px';
    userDisplay.textContent = `Logged in as: ${userEmail}`;
    document.body.appendChild(userDisplay);
}

// DOM Content Loaded Event Listener
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Document loaded, initializing auth handler...');
    
    try {
        // Initialize auth handler
        initializeAuthHandler();
        
        // Check if we're on a protected page
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const protectedPages = ['dashboard.html', 'event-details.html', 'create-event.html'];
        
        if (protectedPages.includes(currentPage)) {
            console.log('Protected page detected, verifying auth...');
            // Ensure user is authenticated
            await requireAuth();
            // Show who is logged in
            displayCurrentUser();
        }
        
        // Rest of your initialization code...
        console.log('Initializing page functionality...');
        initializePageFunctionality(currentPage);
        
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});

// Initialize page-specific functionality
async function initializePageFunctionality(currentPage) {
    const user = getCurrentUser();
    if (!user) return;

    switch(currentPage) {
        case 'dashboard.html':
            await loadEvents();
            break;
        case 'event-details.html':
            const urlParams = new URLSearchParams(window.location.search);
            const eventId = urlParams.get('eventId');
            if (eventId) {
                await loadEventDetails(eventId);
            }
            break;
        case 'create-event.html':
            setupEventForm();
            break;
    }
}

function switchView(viewName) {
    // Hide all views
    const views = document.querySelectorAll('.view-container');
    views.forEach(view => view.style.display = 'none');

    // Show selected view
    const selectedView = document.getElementById(`${viewName}-view`);
    if (selectedView) {
        selectedView.style.display = 'block';
        // Update URL hash without page reload
        window.location.hash = viewName;
        
        // Initialize view-specific functionality
        if (viewName === 'dashboard') {
            loadEvents();
        }
    }
}


// Initialize application (renamed from initializeApp to avoid conflict)
function initializeEventManagement() {
    setupEventForm();
    setupParticipantForm();
    setupScheduleForm();
    loadDashboardSummary();
    
    // Check if we're on the event details page
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('eventId');
    if (eventId && window.location.pathname.includes('event-details.html')) {
        currentEventId = eventId;
        loadEventDetails(eventId);
    } else {
        loadEvents();
    }

    // Setup logout button
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
        logoutButton.addEventListener("click", handleLogout);
    }
}

// Event Form Setup
function setupEventForm() {
    const createEventForm = document.getElementById("create-event-form");
    if (createEventForm) {
        createEventForm.addEventListener("submit", handleEventSubmit);
    }
}

// Event Creation Handler
async function handleEventSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const eventName = form.querySelector("#event-name").value;
    const eventDate = form.querySelector("#event-date").value;
    const eventCode = form.querySelector("#event-code").value;
    const trackName = form.querySelector("#track-name").value;
    const trackId = form.querySelector("#track-id").value;

    try {
        // Validate event code
        const isCodeValid = await validateEventCode(eventCode);
        if (!isCodeValid) {
            showError("Event code already exists. Please choose another.");
            return;
        }

        // Create event
        const eventData = {
            name: eventName,
            date: new Date(eventDate),
            track: trackName,
            trackId: trackId,
            organizerId: currentUser.uid,
            eventCode: eventCode,
            participants: [],
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, "events"), eventData);
        
        showSuccess("Event created successfully!");
        form.reset();
        
        // Reload data
        await Promise.all([
            loadEvents(),
            loadDashboardSummary()
        ]);

    } catch (error) {
        console.error("Error creating event:", error);
        showError("Failed to create event: " + error.message);
    }
}


// Event Code Validation
async function validateEventCode(eventCode) {
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, where("eventCode", "==", eventCode));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
}

// Load Events
async function loadEvents() {
    const eventsContainer = document.getElementById('eventsContainer');
    if (!eventsContainer) return;

    try {
        const user = auth.currentUser;
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const eventsRef = collection(db, 'events');
        const q = query(eventsRef, where("organizerId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const events = [];
        querySnapshot.forEach((doc) => {
            events.push({
                id: doc.id,
                ...doc.data()
            });
        });

        if (events.length === 0) {
            eventsContainer.innerHTML = `
                <div class="no-events-message">
                    <p>No events found. Create your first event to get started!</p>
                </div>
            `;
            return;
        }

        sortAndDisplayEvents(events);

    } catch (error) {
        console.error("Error loading events:", error);
        eventsContainer.innerHTML = `
            <div class="error-message">
                <p>Error loading events. Please try again later.</p>
            </div>
        `;
    }
}

// Load Event Details
async function loadEventDetails(eventId) {
    try {
        const eventDoc = await getDoc(doc(db, "events", eventId));
        if (!eventDoc.exists()) {
            showError("Event not found");
            return;
        }

        const event = eventDoc.data();
        
        // Update UI elements
        updateElement("event-title", event.name);
        updateElement("code-value", event.eventCode);
        updateElement("track-value", event.track);
        
        // Load participants list
        const participantsList = document.getElementById("participants-list");
        if (participantsList) {
            participantsList.innerHTML = "";
            
            if (event.participants && event.participants.length > 0) {
                event.participants.forEach(participant => {
                    const participantEl = createElement('div', {
                        className: 'participant-item',
                        innerHTML: `
                            <span>${participant}</span>
                            <button class="remove-participant" data-participant="${participant}">
                                Remove
                            </button>
                        `
                    });
                    
                    const removeButton = participantEl.querySelector('.remove-participant');
                    removeButton.addEventListener('click', () => removeParticipant(eventId, participant));
                    
                    participantsList.appendChild(participantEl);
                });
            } else {
                participantsList.innerHTML = "<p>No participants yet</p>";
            }
        }
        
        // Load schedules
        loadSchedules(eventId);
        
    } catch (error) {
        console.error("Error loading event details:", error);
        showError("Failed to load event details");
    }
}

// Participant Management
function setupParticipantForm() {
    const participantForm = document.getElementById("add-participant-form");
    if (participantForm) {
        participantForm.addEventListener("submit", handleParticipantSubmit);
    }
}

async function handleParticipantSubmit(event) {
    event.preventDefault();
    
    const participantName = document.getElementById("participant-name").value;
    if (!participantName) return;

    try {
        const eventRef = doc(db, "events", currentEventId);
        await updateDoc(eventRef, {
            participants: arrayUnion(participantName)
        });
        
        showSuccess("Participant added successfully");
        event.target.reset();
        loadEventDetails(currentEventId);
        
    } catch (error) {
        console.error("Error adding participant:", error);
        showError("Failed to add participant");
    }
}

async function removeParticipant(eventId, participantName) {
    try {
        const eventRef = doc(db, "events", eventId);
        await updateDoc(eventRef, {
            participants: arrayRemove(participantName)
        });
        
        showSuccess("Participant removed successfully");
        loadEventDetails(eventId);
        
    } catch (error) {
        console.error("Error removing participant:", error);
        showError("Failed to remove participant");
    }
}

// Schedule Management
function setupScheduleForm() {
    const scheduleForm = document.getElementById("add-schedule-form");
    if (scheduleForm) {
        scheduleForm.addEventListener("submit", handleScheduleSubmit);
    }
}

async function handleScheduleSubmit(event) {
    event.preventDefault();
    
    const title = document.getElementById("schedule-title").value;
    const date = document.getElementById("schedule-date").value;
    
    if (!title || !date) return;

    try {
        const scheduleData = {
            title,
            date: new Date(date),
            createdAt: serverTimestamp()
        };
        
        const eventRef = doc(db, "events", currentEventId);
        const schedulesRef = collection(eventRef, "schedules");
        await addDoc(schedulesRef, scheduleData);
        
        showSuccess("Schedule added successfully");
        event.target.reset();
        loadSchedules(currentEventId);
        
    } catch (error) {
        console.error("Error adding schedule:", error);
        showError("Failed to add schedule");
    }
}

async function loadSchedules(eventId) {
    const schedulesList = document.getElementById("schedules-list");
    if (!schedulesList) return;

    try {
        const eventRef = doc(db, "events", eventId);
        const schedulesRef = collection(eventRef, "schedules");
        const q = query(schedulesRef, orderBy("date", "asc"));
        
        const querySnapshot = await getDocs(q);
        
        schedulesList.innerHTML = "";
        
        if (querySnapshot.empty) {
            schedulesList.innerHTML = "<p>No schedules yet</p>";
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const schedule = doc.data();
            const scheduleDate = schedule.date.toDate();
            
            const scheduleEl = createElement('div', {
                className: 'schedule-item',
                innerHTML: `
                    <h4>${schedule.title}</h4>
                    <p>${scheduleDate.toLocaleString()}</p>
                    <button class="delete-schedule" data-schedule-id="${doc.id}">
                        Delete
                    </button>
                `
            });
            
            const deleteButton = scheduleEl.querySelector('.delete-schedule');
            deleteButton.addEventListener('click', () => deleteSchedule(eventId, doc.id));
            
            schedulesList.appendChild(scheduleEl);
        });
        
    } catch (error) {
        console.error("Error loading schedules:", error);
        showError("Failed to load schedules");
    }
}

async function deleteSchedule(eventId, scheduleId) {
    try {
        const eventRef = doc(db, "events", eventId);
        const scheduleRef = doc(collection(eventRef, "schedules"), scheduleId);
        await deleteDoc(scheduleRef);
        
        showSuccess("Schedule deleted successfully");
        loadSchedules(eventId);
        
    } catch (error) {
        console.error("Error deleting schedule:", error);
        showError("Failed to delete schedule");
    }
}

// Dashboard Summary
async function loadDashboardSummary() {
    try {
        const eventsRef = collection(db, "events");
        const q = query(eventsRef, where("organizerId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        let totalEvents = 0;
        let totalParticipants = 0;
        let completedSessions = 0;
        
        querySnapshot.forEach((doc) => {
            const event = doc.data();
            totalEvents++;
            totalParticipants += event.participants?.length || 0;
        });
        
        // Update dashboard elements
        updateElement("total-events", totalEvents);
        updateElement("total-participants", totalParticipants);
        updateElement("completed-sessions", completedSessions);
        
    } catch (error) {
        console.error("Error loading dashboard summary:", error);
        showError("Failed to load dashboard summary");
    }
}

// Utility Functions
function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    if (options.className) element.className = options.className;
    if (options.innerHTML) element.innerHTML = options.innerHTML;
    return element;
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

function showSuccess(message) {
    // You can implement your preferred success display method
    alert(message);
}

async function handleLogout() {
    try {
        await signOut(auth);
        window.location.href = "login.html";
    } catch (error) {
        console.error("Error during logout:", error);
        showError("Failed to log out");
    }
}


// Export functions that need to be accessed from HTML
window.viewEventDetails = function(eventId) {
    window.location.href = `event-details.html?eventId=${eventId}`;
};

function sortAndDisplayEvents(events) {
    const currentDate = new Date();
    
    // Add status and sort events
    const processedEvents = events.map(event => ({
        ...event,
        status: new Date(event.date) > currentDate ? 'upcoming' : 'past',
        dateObj: new Date(event.date)
    })).sort((a, b) => {
        // Sort upcoming events first, then by date
        if (a.status === 'upcoming' && b.status === 'past') return -1;
        if (a.status === 'past' && b.status === 'upcoming') return 1;
        return a.dateObj - b.dateObj;
    });

    const eventsContainer = document.getElementById('eventsContainer');
    eventsContainer.innerHTML = '';

    processedEvents.forEach(event => {
        const formattedDate = new Date(event.date).toLocaleDateString();
        const eventCard = `
            <div class="event-card">
                <span class="event-status status-${event.status}">
                    ${event.status === 'upcoming' ? 'Upcoming' : 'Past'}
                </span>
                <h2>${event.name}</h2>
                <div class="event-info">
                    <div class="event-detail">
                        <span class="label">Date:</span>
                        <span class="value">${formattedDate}</span>
                    </div>
                    <div class="event-detail">
                        <span class="label">Track:</span>
                        <span class="value">${event.track}</span>
                    </div>
                    <div class="event-detail">
                        <span class="label">Event Code:</span>
                        <span class="value">${event.eventCode}</span>
                    </div>
                    <div class="event-detail">
                        <span class="label">Participants:</span>
                        <span class="value">${event.participants ? event.participants.length : 0}</span>
                    </div>
                </div>
                <div class="event-actions">
                    <a href="event-details.html?eventId=${event.id}" class="view-details-button">
                        View Details
                    </a>
                </div>
            </div>
        `;
        eventsContainer.innerHTML += eventCard;
    });
}

// Add event listener for filter changes
document.getElementById('eventFilter')?.addEventListener('change', (e) => {
    const filter = e.target.value;
    const currentDate = new Date();
    
    let filteredEvents = [...events]; // Your events array
    
    if (filter === 'upcoming') {
        filteredEvents = events.filter(event => new Date(event.date) > currentDate);
    } else if (filter === 'past') {
        filteredEvents = events.filter(event => new Date(event.date) <= currentDate);
    }
    
    sortAndDisplayEvents(filteredEvents);
});


window.handleLogout = handleLogout;
window.viewEventDetails = function(eventId) {
    window.location.href = `event-details.html?eventId=${eventId}`;
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;

// Display the current user
function displayCurrentUser() {
    if (currentUser) {
        const userEmail = currentUser.email;
        console.log('Currently logged in as:', userEmail);
    }
}

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Document loaded, initializing...');
    
    try {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                currentUser = user;
                displayCurrentUser();
                initializePageFunctionality();
            } else {
                window.location.href = 'login.html';
            }
        });
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});

// Initialize page-specific functionality
function initializePageFunctionality() {
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'dashboard.html') {
        loadEvents();
    } else if (currentPage === 'event-details.html') {
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('eventId');
        if (eventId) {
            loadEventDetails(eventId);
        }
    } else if (currentPage === 'create-event.html') {
        setupEventForm();
        loadTrackOptions();
    }
}

// Setup Event Form
function setupEventForm() {
    const createEventForm = document.getElementById("create-event-form");
    if (createEventForm) {
        createEventForm.addEventListener("submit", handleEventSubmit);
    }
}

// Handle Event Creation
async function handleEventSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const eventName = form.querySelector("#event-name").value;
    const eventDate = form.querySelector("#event-date").value;
    const eventCode = form.querySelector("#event-code").value;
    const trackSelect = form.querySelector("#track-name");
    const trackName = trackSelect.options[trackSelect.selectedIndex].text;
    const trackId = form.querySelector("#track-id").value;

    if (!eventName || !eventDate || !eventCode || !trackId) {
        showError("Please fill in all required fields");
        return;
    }

    try {
        const eventData = {
            name: eventName,
            date: new Date(eventDate),
            track: trackName,
            trackId: trackId,
            organizerId: currentUser.uid,
            eventCode: eventCode.toUpperCase(),
            participants: [],
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, "events"), eventData);
        showSuccess("Event created successfully!");
        form.reset();

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);

    } catch (error) {
        console.error("Error creating event:", error);
        showError("Failed to create event");
    }
}

// Load Events
async function loadEvents() {
    const eventsContainer = document.getElementById('eventsContainer');
    if (!eventsContainer) return;

    try {
        const q = query(
            collection(db, 'events'), 
            where("organizerId", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);

        const events = [];
        querySnapshot.forEach((doc) => {
            events.push({ id: doc.id, ...doc.data() });
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
        showError("Failed to load events");
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
        updateElement("event-title", event.name);
        updateElement("code-value", event.eventCode);
        updateElement("track-value", event.track);

        loadParticipants(eventId);
        loadSchedules(eventId);
    } catch (error) {
        console.error("Error loading event details:", error);
        showError("Failed to load event details");
    }
}

// Load Participants
async function loadParticipants(eventId) {
    const participantsList = document.getElementById("participants-list");
    if (!participantsList) return;

    try {
        const eventDoc = await getDoc(doc(db, "events", eventId));
        const eventData = eventDoc.data();

        participantsList.innerHTML = "";
        if (eventData.participants && eventData.participants.length > 0) {
            eventData.participants.forEach(participant => {
                const participantEl = document.createElement('div');
                participantEl.className = 'participant-item';
                participantEl.textContent = participant;
                participantsList.appendChild(participantEl);
            });
        } else {
            participantsList.innerHTML = "<p>No participants yet</p>";
        }
    } catch (error) {
        console.error("Error loading participants:", error);
        showError("Failed to load participants");
    }
}

// Load Track Options
async function loadTrackOptions() {
    const trackSelect = document.getElementById('track-name');
    if (!trackSelect) return;

    try {
        const response = await fetch('custom_tracks.json');
        const tracks = await response.json();

        trackSelect.innerHTML = '<option value="">Select a track</option>';
        tracks.forEach(track => {
            const option = document.createElement('option');
            option.value = track.id;
            option.textContent = `${track.name} - ${track.configuration}`;
            trackSelect.appendChild(option);
        });

        trackSelect.addEventListener('change', () => {
            const selectedTrack = tracks.find(t => t.id === trackSelect.value);
            if (selectedTrack) {
                document.getElementById('track-id').value = selectedTrack.id;
            }
        });
    } catch (error) {
        console.error("Error loading track data:", error);
        showError("Failed to load track list");
    }
}

// Utility Functions
function showError(message) {
    alert(message); // Temporary solution; improve this to show errors in UI
}

function showSuccess(message) {
    alert(message); // Temporary solution; improve this to show success in UI
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}
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

// Get Firebase services
const db = getFirestore();
const auth = getAuth();

// Add this to show who is logged in (for debugging)
function displayCurrentUser() {
    const userEmail = getCurrentUserEmail();
    console.log('Currently logged in as:', userEmail);
}

// DOM Content Loaded Event Listener
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Document loaded, starting initialization...');

    try {
        // Initialize Firebase app and authentication handler
        initializeAuthHandler();

        // Get the current page name
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const protectedPages = ['dashboard.html', 'event-details.html', 'create-event.html'];

        // If the current page requires authentication, ensure the user is logged in
        if (protectedPages.includes(currentPage)) {
            console.log(`Accessing protected page: ${currentPage}, verifying auth...`);
            const user = await requireAuth();

            if (user) {
                console.log(`User logged in as: ${user.email}`);
                displayCurrentUser();

                // Initialize page-specific functionality
                initializePageFunctionality(currentPage, user);
            } else {
                console.warn('User not logged in, redirecting to login...');
                window.location.href = 'login.html';
                return;
            }
        } else {
            console.log(`Non-protected page detected: ${currentPage}`);
            initializePageFunctionality(currentPage);
        }

    } catch (error) {
        console.error('Error during initialization:', error);
        showError('Failed to initialize the application.');
    }
});

// Initialize page functionality based on the current page
function initializePageFunctionality(currentPage, user) {
    switch (currentPage) {
        case 'dashboard.html':
            loadDashboard(user);
            setupEventManagement(user);
            setupFinancialMetrics(user); // New function for collapsible financial metrics
            initializeRevenueSection();
            break;


        case 'event-details.html':
            const eventId = new URLSearchParams(window.location.search).get('eventId');
            if (eventId) {
                loadEventDetails(user, eventId);
                setupParticipantManagement(user, eventId);
                setupScheduleManagement(user, eventId);
            }
            break;

        case 'create-event.html':
            setupEventCreation(user);
            break;

        default:
            console.log('No specific functionality for this page.');
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

    // Get the current user
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showError("You must be logged in to create an event");
        return;
    }

    // Get submit button to show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('loading');
    }

    const form = event.target;
    const eventName = form.querySelector("#event-name").value;
    const eventDate = form.querySelector("#event-date").value;
    const eventCode = form.querySelector("#event-code").value;
    const trackSelect = form.querySelector("#track-name");
    const trackName = trackSelect.options[trackSelect.selectedIndex].text;
    const trackId = form.querySelector("#track-id").value;

    try {
        // Basic validation
        if (!eventName || !eventDate || !eventCode || !trackId) {
            throw new Error("Please fill in all required fields");
        }

        // Validate event code format (optional)
        if (!/^[A-Z0-9]{6}$/.test(eventCode)) {
            throw new Error("Event code must be 6 characters (letters and numbers only)");
        }

        // Validate event code uniqueness
        const isCodeValid = await validateEventCode(eventCode);
        if (!isCodeValid) {
            throw new Error("Event code already exists. Please choose another.");
        }

        // Create event
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

        const docRef = await addDoc(collection(db, "events"), eventData);
        
        showSuccess("Event created successfully!");
        form.reset();
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);

    } catch (error) {
        console.error("Error creating event:", error);
        showError(error.message);
    } finally {
        // Reset button state
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.classList.remove('loading');
        }
    }
}

// Updated the success method to use a proper message display
function showSuccess(message) {
    const successElement = document.getElementById('success-message');
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
        setTimeout(() => {
            successElement.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

// Event Code Validation
async function validateEventCode(eventCode) {
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, where("eventCode", "==", eventCode.toUpperCase()));
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
async function loadEventDetails(user, eventId) {
    try {
        if (!eventId) {
            throw new Error('No event ID provided');
        }

        const eventRef = doc(db, "events", eventId);
        const eventDoc = await getDoc(eventRef);

        if (!eventDoc.exists()) {
            showError("Event not found");
            return;
        }

        const event = eventDoc.data();
        
        // Update basic event info
        updateElement("event-title", event.name || 'Untitled Event');
        updateElement("code-value", event.eventCode || 'N/A');
        updateElement("track-value", event.track || 'N/A');

        // Convert Firestore timestamp to Date
        const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date);
        updateElement("event-date", formatDate(eventDate));

        // Load participants
        await loadParticipants(eventId);
        // Load schedules
        await loadSchedules(eventId);

        // Initialize management functions
        setupParticipantManagement(eventId);
        setupScheduleManagement(eventId);

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

async function handleScheduleSubmit(e, eventId) {
    e.preventDefault();
    
    try {
        const startTime = document.getElementById('schedule-start').value;
        const endTime = document.getElementById('schedule-end').value;
        const title = document.getElementById('schedule-title').value;
        const description = document.getElementById('schedule-description').value;

        if (!startTime || !endTime || !title) {
            showError('Please fill in all required fields');
            return;
        }

        const scheduleData = {
            title,
            description,
            startTime: Timestamp.fromDate(new Date(startTime)),
            endTime: Timestamp.fromDate(new Date(endTime)),
            createdAt: serverTimestamp()
        };

        const scheduleRef = collection(db, 'events', eventId, 'schedules');
        await addDoc(scheduleRef, scheduleData);

        showSuccess('Schedule added successfully');
        e.target.reset();
        await loadSchedules(eventId);

    } catch (error) {
        console.error('Error adding schedule:', error);
        showError('Failed to add schedule');
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

async function handleDeleteSchedule(eventId, scheduleId) {
    try {
        if (!confirm('Are you sure you want to delete this schedule?')) {
            return;
        }

        const scheduleRef = doc(db, 'events', eventId, 'schedules', scheduleId);
        await deleteDoc(scheduleRef);

        showSuccess('Schedule deleted successfully');
        await loadSchedules(eventId);

    } catch (error) {
        console.error('Error deleting schedule:', error);
        showError('Failed to delete schedule');
    }
}

// Load the dashboard data
async function loadDashboard(user) {
    try {
        // Fetch events from Firestore
        const eventsSnapshot = await getDocs(collection(db, `users/${user.uid}/events`));

        // Check if events container exists
        const eventsContainer = document.getElementById("eventsContainer");
        if (!eventsContainer) {
            console.error("Events container not found.");
            return;
        }

        eventsContainer.innerHTML = ""; // Clear existing content

        if (eventsSnapshot.empty) {
            eventsContainer.innerHTML = "<p>No events found.</p>";
            return;
        }

        // Loop through events and render each event card
        eventsSnapshot.forEach((doc) => {
            const eventData = doc.data();
            renderEventCard(eventData, doc.id); // Call the function to render event card
        });
    } catch (error) {
        console.error("Error loading dashboard:", error);
    }
}


// Initialize charts (Ensure this is defined)
function initializeCharts() {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [{
                label: 'Revenue',
                data: [12, 19, 3, 5, 2, 3, 7],
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
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

// Track Loading
async function loadTrackOptions() {
    const trackSelect = document.getElementById('track-name');
    const trackIdInput = document.getElementById('track-id');
    
    if (!trackSelect) return;

    try {
        const response = await fetch('custom_tracks.json');
        const tracks = await response.json();
        
        // Clear existing options
        trackSelect.innerHTML = '<option value="">Select a track</option>';
        
        // Sort tracks by name
        tracks.sort((a, b) => a.name.localeCompare(b.name));
        
        tracks.forEach(track => {
            const option = document.createElement('option');
            option.value = track.id;
            option.textContent = `${track.name} - ${track.configuration}`;
            trackSelect.appendChild(option);
        });
        
        // Add change event listener
        trackSelect.addEventListener('change', () => {
            const selectedTrack = tracks.find(t => t.id === trackSelect.value);
            if (selectedTrack) {
                trackIdInput.value = selectedTrack.id;
            }
        });
    } catch (error) {
        console.error('Error loading track data:', error);
        showError('Failed to load track list. Please try again.');
    }
}


// Load Financial Data
async function loadFinancialData(eventId = null) {
    try {
        const userId = getCurrentUser()?.uid;
        if (!userId) return;

        let query = collection(db, "transactions");
        
        if (eventId) {
            query = query.where("eventId", "==", eventId);
        }
        query = query.where("organizerId", "==", userId);

        const querySnapshot = await getDocs(query);
        const transactions = [];
        let totalRevenue = 0;
        let pendingPayouts = 0;

        querySnapshot.forEach((doc) => {
            const transaction = doc.data();
            transactions.push({
                id: doc.id,
                ...transaction
            });
            
            if (transaction.status === 'completed') {
                totalRevenue += transaction.amount;
            } else if (transaction.status === 'pending') {
                pendingPayouts += transaction.amount;
            }
        });

        // Update UI
        updateFinancialUI(totalRevenue, pendingPayouts, transactions);
        
        // Update charts
        updateCharts(transactions);

    } catch (error) {
        console.error("Error loading financial data:", error);
        showError("Failed to load financial data");
    }
}

// Continuing from previous financial handlers...

function updateFinancialUI(totalRevenue, pendingPayouts, transactions) {
    // Update summary cards
    const totalRevenueElement = document.getElementById('total-revenue');
    if (totalRevenueElement) {
        totalRevenueElement.textContent = formatCurrency(totalRevenue);
    }
    const anotherElement = document.getElementById('another-element');
    if (anotherElement) {
        anotherElement.textContent = someValue;
    }
    
    // Update transaction list
    const transactionList = document.getElementById('transaction-list');
    const transactionTable = document.getElementById('transaction-tbody');
    
    if (transactionList) {
        transactionList.innerHTML = transactions
            .slice(0, 5) // Show only last 5 transactions in dashboard
            .map(transaction => `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <span class="transaction-date">${formatDate(transaction.createdAt)}</span>
                        <span class="transaction-type">${transaction.type}</span>
                    </div>
                    <div class="transaction-amount ${transaction.type === 'refund' ? 'negative' : ''}">
                        ${formatCurrency(transaction.amount)}
                    </div>
                </div>
            `).join('');
    }
    
    if (transactionTable) {
        transactionTable.innerHTML = transactions.map(transaction => `
            <tr>
                <td>${formatDate(transaction.createdAt)}</td>
                <td>${transaction.participantName}</td>
                <td>${transaction.type}</td>
                <td class="${transaction.type === 'refund' ? 'negative' : ''}">${formatCurrency(transaction.amount)}</td>
                <td>
                    <span class="status-badge status-${transaction.status}">
                        ${transaction.status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button onclick="viewTransactionDetails('${transaction.id}')" class="action-button">
                            View
                        </button>
                        ${transaction.status === 'completed' ? `
                            <button onclick="initiateRefund('${transaction.id}')" class="action-button refund">
                                Refund
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Update event-specific metrics if on event details page
    if (window.location.pathname.includes('event-details.html')) {
        updateEventMetrics(transactions);
    }
}

// Update Event-specific Metrics
function updateEventMetrics(transactions) {
    const eventTransactions = transactions.filter(t => t.eventId === currentEventId);
    
    // Calculate metrics
    const metrics = calculateEventMetrics(eventTransactions);
    
    // Update UI elements
    const eventTotalRevenueElement = document.getElementById('event-total-revenue');
    if (eventTotalRevenueElement) {
        eventTotalRevenueElement.textContent = formatCurrency(metrics.totalRevenue);
    }
    
    const registrationCountElement = document.getElementById('registration-count');
    if (registrationCountElement) {
        registrationCountElement.textContent = `${metrics.registrationCount}/${metrics.maxRegistrations}`;
    }
    
    const avgTicketPriceElement = document.getElementById('avg-ticket-price');
    if (avgTicketPriceElement) {
        avgTicketPriceElement.textContent = formatCurrency(metrics.avgTicketPrice);
    }
    
    const garageRevenueElement = document.getElementById('garage-revenue');
    if (garageRevenueElement) {
        garageRevenueElement.textContent = formatCurrency(metrics.garageRevenue);
    }
    
    const addonRevenueElement = document.getElementById('addon-revenue');
    if (addonRevenueElement) {
        addonRevenueElement.textContent = formatCurrency(metrics.addonRevenue);
    }
    
    const refundAmountElement = document.getElementById('refund-amount');
    if (refundAmountElement) {
        refundAmountElement.textContent = formatCurrency(metrics.refundAmount);
    }
}

// Calculate Event Metrics
function calculateEventMetrics(transactions) {
    return {
        totalRevenue: transactions
            .filter(t => t.status === 'completed' && t.type !== 'refund')
            .reduce((sum, t) => sum + t.amount, 0),
        registrationCount: transactions
            .filter(t => t.type === 'registration' && t.status === 'completed')
            .length,
        maxRegistrations: 50, // This should come from event settings
        avgTicketPrice: calculateAverageTicketPrice(transactions),
        garageRevenue: transactions
            .filter(t => t.type === 'garage' && t.status === 'completed')
            .reduce((sum, t) => sum + t.amount, 0),
        addonRevenue: transactions
            .filter(t => t.type === 'addon' && t.status === 'completed')
            .reduce((sum, t) => sum + t.amount, 0),
        refundAmount: Math.abs(transactions
            .filter(t => t.type === 'refund')
            .reduce((sum, t) => sum + t.amount, 0))
    };
}

// Transaction Management Functions
async function viewTransactionDetails(transactionId) {
    try {
        const transaction = await getTransactionDetails(transactionId);
        showTransactionModal(transaction);
    } catch (error) {
        console.error("Error loading transaction details:", error);
        showError("Failed to load transaction details");
    }
}

async function initiateRefund(transactionId) {
    try {
        const confirmed = await showConfirmationDialog({
            title: "Confirm Refund",
            message: "Are you sure you want to process this refund?",
            confirmText: "Process Refund",
            cancelText: "Cancel"
        });

        if (confirmed) {
            const refund = await processRefund(transactionId);
            showSuccess("Refund processed successfully");
            await loadFinancialData(currentEventId);
        }
    } catch (error) {
        console.error("Error processing refund:", error);
        showError("Failed to process refund");
    }
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount / 100); // Assuming amounts are stored in cents
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDateTime(date) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(date);
}

function calculateAverageTicketPrice(transactions) {
    const registrations = transactions.filter(t => t.type === 'registration' && t.status === 'completed');
    if (registrations.length === 0) return 0;
    return registrations.reduce((sum, t) => sum + t.amount, 0) / registrations.length;
}

// Export Functions
window.viewTransactionDetails = viewTransactionDetails;
window.initiateRefund = initiateRefund;

// Initialize Financial Dashboard
document.addEventListener('DOMContentLoaded', async function() {
    // ... (previous initialization code)

    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'dashboard.html' || currentPage === 'event-details.html') {
        initializeCharts();
        await loadFinancialData(currentPage === 'event-details.html' ? currentEventId : null);
        
        // Set up time period filter listeners
        const timePeriodSelect = document.getElementById('time-period');
        if (timePeriodSelect) {
            timePeriodSelect.addEventListener('change', () => {
                loadFinancialData(currentEventId);
            });
        }
        
        // Set up export button listener
        const exportButton = document.getElementById('export-financials');
        if (exportButton) {
            exportButton.addEventListener('click', () => {
                exportFinancialReport(currentEventId);
            });
        }
    }
});

// Add this CSS for the new financial components
const style = document.createElement('style');
style.textContent = `
    .transaction-item {
        display: flex;
        justify-content: space-between;
        padding: 12px;
        border-bottom: 1px solid #2e3b4e;
    }

    .transaction-info {
        display: flex;
        flex-direction: column;
    }

    .transaction-date {
        font-size: 0.9rem;
        color: #8899A6;
    }

    .transaction-type {
        font-size: 1.1rem;
        color: #E6F0FF;
    }

    .transaction-amount {
        font-size: 1.1rem;
        font-weight: bold;
    }

    .transaction-amount.negative {
        color: #F44336;
    }

    .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.9rem;
    }

    .status-completed {
        background: #4CAF50;
        color: white;
    }

    .status-pending {
        background: #FFC107;
        color: black;
    }

    .status-failed {
        background: #F44336;
        color: white;
    }

    .action-buttons {
        display: flex;
        gap: 8px;
    }

    .action-button {
        padding: 4px 8px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background-color 0.2s;
    }

    .action-button.refund {
        background: #F44336;
        color: white;
    }

    .action-button:hover {
        opacity: 0.9;
    }
`;

document.head.appendChild(style);

async function setupEventManagement(user) {
    console.log('Setting up event management for:', user.email);

    // Load events for the organizer
    await loadEvents(user);

    // Set up event creation form
    const createEventForm = document.getElementById("create-event-form");
    if (createEventForm) {
        createEventForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            // Gather input values
            const eventName = document.getElementById("event-name").value;
            const eventDate = document.getElementById("event-date").value;
            const eventCode = document.getElementById("event-code").value;
            const trackName = document.getElementById("track-name").value;
            const trackId = document.getElementById("track-id").value;
            
            // Validate inputs
            if (!eventName || !eventDate || !eventCode || !trackName || !trackId) {
                alert("Please fill out all fields.");
                return;
            }

            try {
                // Add event to Firestore under the user's collection
                await addDoc(collection(db, `users/${user.uid}/events`), {
                    name: eventName,
                    date: eventDate,
                    eventCode: eventCode,
                    track: trackName,
                    trackId: trackId,
                    organizerId: user.uid,
                    createdAt: serverTimestamp(),
                    participants: []
                });
                
                alert("Event created successfully!");
                loadEvents(user); // Reload events
                createEventForm.reset(); // Clear form fields
            } catch (error) {
                console.error("Error creating event:", error);
                alert("Failed to create event.");
            }
        });
    }
}



// Function to delete an event
async function deleteEvent(eventId) {
    try {
        const user = getAuth().currentUser;
        if (confirm("Are you sure you want to delete this event?")) {
            await deleteDoc(doc(db, `users/${user.uid}/events`, eventId));
            alert("Event deleted successfully!");
            loadEvents(user);
        }
    } catch (error) {
        console.error("Error deleting event:", error);
    }
}

// Function to view event details
function viewEventDetails(eventId) {
    window.location.href = `event-details.html?eventId=${eventId}`;
}

// Function to render an individual event card
function renderEventCard(eventData, eventId) {
    // Create event card container
    const eventCard = document.createElement("div");
    eventCard.classList.add("event-card");

    // Set inner HTML for the event card
    eventCard.innerHTML = `
        <h3>${eventData.name}</h3>
        <p>Date: ${eventData.date}</p>
        <p>Code: ${eventData.eventCode}</p>
        <button onclick="viewEventDetails('${eventId}')">View Details</button>
        <button onclick="editEvent('${eventId}')">Edit</button>
        <button onclick="deleteEvent('${eventId}')">Delete</button>
    `;

    // Append the event card to the container
    const eventsContainer = document.getElementById("eventsContainer");
    if (eventsContainer) {
        eventsContainer.appendChild(eventCard);
    } else {
        console.error("Events container not found.");
    }
}

// Function to set up financial metrics on the dashboard
function setupFinancialMetrics() {
    // Fetch financial data from Firestore or other source
    const totalRevenueElement = document.getElementById('total-revenue');
    const pendingPayoutsElement = document.getElementById('pending-payouts');
    const activeRegistrationsElement = document.getElementById('active-registrations');
    const stripeStatusElement = document.getElementById('stripe-status');

    if (!totalRevenueElement || !pendingPayoutsElement || !activeRegistrationsElement || !stripeStatusElement) {
        console.error("Financial metrics elements not found on the page.");
        return;
    }

    // Simulate fetching financial data (replace with real data fetching logic)
    totalRevenueElement.textContent = "$10,000.00";
    pendingPayoutsElement.textContent = "$2,000.00";
    activeRegistrationsElement.textContent = "50";
    stripeStatusElement.textContent = "Connected";

    console.log("Financial metrics set up successfully.");
}

// Function to set up event creation form
function setupEventCreation(user) {
    const createEventForm = document.getElementById("create-event-form");

    if (!createEventForm) {
        console.warn("Create Event form not found.");
        return;
    }

    createEventForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Get input values from the form
        const eventName = document.getElementById("event-name").value;
        const eventDate = document.getElementById("event-date").value;
        const eventCode = document.getElementById("event-code").value;
        const trackName = document.getElementById("track-name").value;
        const trackId = document.getElementById("track-id").value;
        const organizerId = user.uid;

        // Validate input fields
        if (!eventName || !eventDate || !eventCode || !trackName || !trackId) {
            alert("Please fill out all fields.");
            return;
        }

        try {
            // Add the new event to Firestore
            await addDoc(collection(db, `users/${organizerId}/events`), {
                name: eventName,
                date: eventDate,
                eventCode: eventCode,
                track: trackName,
                trackId: trackId,
                organizerId: organizerId,
                participants: [], // Initialize empty participants array
                createdAt: serverTimestamp()
            });
            console.log("Event created successfully!");
            alert("Event created successfully!");
            createEventForm.reset(); // Clear the form after successful submission
            loadDashboard(user); // Refresh dashboard after event creation
        } catch (error) {
            console.error("Error creating event:", error);
            alert("Error creating event.");
        }
    });
}

function setupParticipantManagement(user, eventId) {
    // Setup add participant form
    const addParticipantForm = document.getElementById('add-participant-form');
    if (addParticipantForm) {
        addParticipantForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const participantInput = document.getElementById('participant-name');
            if (!participantInput || !participantInput.value.trim()) return;

            try {
                const eventRef = doc(db, "events", eventId);
                await updateDoc(eventRef, {
                    participants: arrayUnion(participantInput.value.trim())
                });

                // Refresh the participants list
                await loadEventDetails(eventId);
                participantInput.value = '';
                showSuccess('Participant added successfully');
            } catch (error) {
                console.error('Error adding participant:', error);
                showError('Failed to add participant');
            }
        });
    }

    // Setup participant removal
    async function removeParticipant(eventId, participantName) {
        try {
            const eventRef = doc(db, "events", eventId);
            await updateDoc(eventRef, {
                participants: arrayRemove(participantName)
            });

            await loadEventDetails(eventId);
            showSuccess('Participant removed successfully');
        } catch (error) {
            console.error('Error removing participant:', error);
            showError('Failed to remove participant');
        }
    }

    // Expose removeParticipant function globally
    window.removeParticipant = removeParticipant;

    // Setup participant filtering
    const searchInput = document.getElementById('participant-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const participants = document.querySelectorAll('.participant-item');
            
            participants.forEach(participant => {
                const name = participant.querySelector('span').textContent.toLowerCase();
                if (name.includes(searchTerm)) {
                    participant.style.display = '';
                } else {
                    participant.style.display = 'none';
                }
            });
        });
    }
}

// Function to fetch revenue data
async function fetchRevenueData(timeframe = '6months') {
    try {
        const user = auth.currentUser;
        if (!user) return [];

        const today = new Date();
        let startDate = new Date();
        
        // Set the date range based on timeframe
        switch(timeframe) {
            case '30days':
                startDate.setDate(today.getDate() - 30);
                break;
            case '6months':
                startDate.setMonth(today.getMonth() - 6);
                break;
            case '1year':
                startDate.setFullYear(today.getFullYear() - 1);
                break;
            default:
                startDate.setMonth(today.getMonth() - 6);
        }

        // Query Firestore for transactions
        const transactionsRef = collection(db, 'events');
        const q = query(
            transactionsRef,
            where('organizerId', '==', user.uid),
            where('date', '>=', startDate),
            where('date', '<=', today),
            orderBy('date', 'asc')
        );

        const querySnapshot = await getDocs(q);
        
        // Process the data into monthly revenue
        const revenueByMonth = {};
        
        querySnapshot.forEach((doc) => {
            const event = doc.data();
            const date = event.date.toDate();
            const month = date.toLocaleString('default', { month: 'short' });
            
            // Calculate total revenue for this event
            const revenue = calculateEventRevenue(event);
            
            if (revenueByMonth[month]) {
                revenueByMonth[month] += revenue;
            } else {
                revenueByMonth[month] = revenue;
            }
        });

        // Convert to array format for the chart
        return Object.entries(revenueByMonth).map(([month, revenue]) => ({
            month,
            revenue: Number(revenue.toFixed(2))
        }));

    } catch (error) {
        console.error('Error fetching revenue data:', error);
        showError('Failed to load revenue data');
        return [];
    }
}

// Helper function to calculate event revenue
function calculateEventRevenue(event) {
    let total = 0;
    
    // Add registration fees
    if (event.participants) {
        total += event.participants.length * (event.registrationFee || 0);
    }
    
    // Add garage revenue
    if (event.garageBookings) {
        total += event.garageBookings.length * (event.garageFee || 0);
    }
    
    // Add any additional revenue sources
    if (event.additionalRevenue) {
        total += event.additionalRevenue;
    }
    
    return total;
}

// Initialize the revenue section
async function initializeRevenueSection() {
    const timeframeSelect = document.querySelector('[data-revenue-timeframe]');
    if (timeframeSelect) {
        // Add event listener for timeframe changes
        timeframeSelect.addEventListener('change', async (e) => {
            const data = await fetchRevenueData(e.target.value);
            updateRevenueChart(data);
        });
    }

    // Initial load
    const initialData = await fetchRevenueData('6months');
    updateRevenueChart(initialData);
}

// Function to update the revenue chart with new data
function updateRevenueChart(data) {
    const chartContainer = document.getElementById('revenue-chart-root');
    if (!chartContainer) return;

    // The chart will be automatically updated through React
    const event = new CustomEvent('updateRevenueData', { detail: data });
    chartContainer.dispatchEvent(event);
}


function setupScheduleManagement(eventId) {
    const scheduleForm = document.getElementById('schedule-form');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', (e) => handleScheduleSubmit(e, eventId));
    }

    // Setup delete schedule buttons
    document.querySelectorAll('.delete-schedule-btn').forEach(btn => {
        btn.addEventListener('click', () => handleDeleteSchedule(eventId, btn.dataset.scheduleId));
    });
}

async function loadParticipants(eventId) {
    try {
        const participantsList = document.getElementById('participants-list');
        if (!participantsList) return;

        const eventRef = doc(db, 'events', eventId);
        const eventDoc = await getDoc(eventRef);
        const participants = eventDoc.data()?.participants || [];

        if (participants.length === 0) {
            participantsList.innerHTML = '<div class="empty-state">No participants yet</div>';
            return;
        }

        participantsList.innerHTML = participants.map(participant => `
            <div class="participant-item">
                <span class="participant-name">${participant}</span>
                <button class="delete-participant-btn" data-participant-id="${participant}">
                    Remove
                </button>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading participants:', error);
        showError('Failed to load participants');
    }
}

function createScheduleElement(id, schedule) {
    const div = document.createElement('div');
    div.className = 'schedule-item';
    
    const startTime = schedule.startTime.toDate();
    const endTime = schedule.endTime.toDate();

    div.innerHTML = `
        <div class="schedule-info">
            <h4>${schedule.title}</h4>
            <p>${formatDateTime(startTime)} - ${formatDateTime(endTime)}</p>
            ${schedule.description ? `<p class="description">${schedule.description}</p>` : ''}
        </div>
        <button class="delete-schedule-btn" data-schedule-id="${id}">
            Delete
        </button>
    `;

    return div;
}

export {
    loadEventDetails,
    setupParticipantManagement,
    setupScheduleManagement,
    loadSchedules,
    loadParticipants
};

async function initializeWaiverSection(eventId) {
    const waiverSystem = new WaiverManagementSystem(db, currentUser.uid);
    
    // Setup event listeners
    document.getElementById('waiver-template-select').addEventListener('change', handleTemplateSelection);
    document.getElementById('preview-waiver-btn').addEventListener('click', () => previewWaiver(eventId));
    document.getElementById('assign-waiver-btn').addEventListener('click', () => assignWaiver(eventId));
    document.getElementById('send-reminders-btn').addEventListener('click', () => sendWaiverReminders(eventId));

    // Load initial waiver status
    await loadWaiverStatus(eventId);
}

async function handleTemplateSelection(e) {
    const selectedTemplate = e.target.value;
    const previewBtn = document.getElementById('preview-waiver-btn');
    const assignBtn = document.getElementById('assign-waiver-btn');

    if (selectedTemplate === 'custom') {
        // Redirect to waiver creation page or open modal
        window.location.href = `waiver-editor.html?eventId=${eventId}`;
    } else {
        previewBtn.disabled = !selectedTemplate;
        assignBtn.disabled = !selectedTemplate;
    }
}

async function previewWaiver(eventId) {
    const templateSelect = document.getElementById('waiver-template-select');
    const selectedTemplate = templateSelect.value;

    if (!selectedTemplate) return;

    try {
        // Get event details for template variables
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        const eventData = eventDoc.data();

        // Generate waiver preview
        const waiver = generateWaiver(selectedTemplate, {
            eventName: eventData.name,
            organizerName: eventData.organizerName,
            eventDate: eventData.date.toDate().toLocaleDateString(),
            // Add other event-specific data
        });

        // Show preview modal
        const modal = document.getElementById('waiver-preview-modal');
        const content = document.getElementById('waiver-preview-content');
        content.innerHTML = `<div class="waiver-content">${waiver.content}</div>`;
        modal.style.display = 'flex';

    } catch (error) {
        console.error('Error previewing waiver:', error);
        showError('Failed to preview waiver');
    }
}

async function assignWaiver(eventId) {
    const templateSelect = document.getElementById('waiver-template-select');
    const selectedTemplate = templateSelect.value;

    if (!selectedTemplate) return;

    try {
        await waiverSystem.assignToEvent(eventId, selectedTemplate, {
            requiresRenewal: false,
            validityPeriod: 24, // hours
            minimumAge: 18
        });

        showSuccess('Waiver assigned successfully');
        await loadWaiverStatus(eventId);

        // Optional: Send notifications to participants
        await sendWaiverNotifications(eventId);

    } catch (error) {
        console.error('Error assigning waiver:', error);
        showError('Failed to assign waiver');
    }
}

async function loadWaiverStatus(eventId) {
    try {
        const waiverStatus = await waiverSystem.getEventWaiverStatus(eventId);
        
        // Update status counts
        document.getElementById('signed-count').textContent = waiverStatus.signedCount;
        document.getElementById('pending-count').textContent = waiverStatus.pendingCount;
        document.getElementById('minor-count').textContent = waiverStatus.minorCount;

        // Update participant list
        const listContainer = document.getElementById('participant-waiver-list');
        listContainer.innerHTML = waiverStatus.participants.map(participant => `
            <div class="waiver-list-item">
                <div class="participant-info">
                    <span class="participant-name">${participant.name}</span>
                    <span class="waiver-status status-${participant.waiverStatus}">
                        ${formatWaiverStatus(participant.waiverStatus)}
                    </span>
                </div>
                <div class="actions">
                    ${getWaiverActionButton(participant)}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading waiver status:', error);
        showError('Failed to load waiver status');
    }
}

function formatWaiverStatus(status) {
    const statusMap = {
        signed: 'Signed',
        pending: 'Pending',
        expired: 'Expired',
        minor_pending: 'Minor Waiver Pending'
    };
    return statusMap[status] || status;
}

function getWaiverActionButton(participant) {
    switch (participant.waiverStatus) {
        case 'signed':
            return `<button class="secondary-button" onclick="viewSignedWaiver('${participant.id}')">View</button>`;
        case 'pending':
            return `<button class="primary-button" onclick="sendWaiverReminder('${participant.id}')">Send Reminder</button>`;
        case 'expired':
            return `<button class="primary-button" onclick="requestNewWaiver('${participant.id}')">Request New</button>`;
        default:
            return '';
    }
}
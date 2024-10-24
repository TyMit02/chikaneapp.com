

import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    getDoc, 
    getDocs,
    query, 
    where, 
    orderBy,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

import { 
    getAuth 
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";

import { 
    initializeApp 
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";

import { WaiverManagementSystem } from './waiver-management.js';


// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC3g85grffiBMjSWQ-1XMljIlEU6_bt_w8",
    authDomain: "chikane-e5fa1.firebaseapp.com",
    projectId: "chikane-e5fa1",
    storageBucket: "chikane-e5fa1.appspot.com",
    messagingSenderId: "989422231159",
    appId: "1:989422231159:web:2895f389094dcccb9d3072",
    measurementId: "G-GX4ZZW6EXK"
};




document.addEventListener('DOMContentLoaded', function() {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    let waiverSystem;

    // Initialize waiver system when user is authenticated
    auth.onAuthStateChanged(user => {
        if (user) {
            waiverSystem = new WaiverManagementSystem(db, user.uid);
            initializeWaiverPage();
        } else {
            window.location.href = 'login.html';
        }
    });

    // Initialize page elements
    function initializeWaiverPage() {
        loadTemplates();
        setupEventListeners();
        loadSignedWaivers();
        loadEmergencyContacts();
    }

    // Setup event listeners
    function setupEventListeners() {
        // Create template button
        document.getElementById('create-template-btn').addEventListener('click', () => {
            openModal('template-modal');
        });

        // Template form submission
        document.getElementById('template-form').addEventListener('submit', handleTemplateSubmit);

        // Close modal button
        document.querySelector('.close-modal').addEventListener('click', () => {
            closeModal('template-modal');
        });

        // Template filter
        document.getElementById('template-filter').addEventListener('change', (e) => {
            loadTemplates(e.target.value);
        });

        // Event filter for signed waivers
        document.getElementById('event-filter').addEventListener('change', (e) => {
            loadSignedWaivers(e.target.value);
        });

        // Export contacts button
        document.getElementById('export-contacts').addEventListener('click', exportEmergencyContacts);
    }

    // Handle template form submission
    async function handleTemplateSubmit(e) {
        e.preventDefault();
        const form = e.target;
        
        try {
            const templateData = {
                name: form.querySelector('#template-name').value,
                content: form.querySelector('#template-content').value,
                requiredFields: Array.from(form.querySelectorAll('input[name="required-fields"]:checked'))
                    .map(checkbox => checkbox.value)
            };

            await waiverSystem.createTemplate(templateData);
            showSuccess('Template created successfully');
            closeModal('template-modal');
            loadTemplates();
            form.reset();
        } catch (error) {
            showError('Failed to create template');
            console.error(error);
        }
    }

    // Load and display templates
    async function loadTemplates(filter = 'all') {
        try {
            const templates = await waiverSystem.getTemplates();
            const container = document.getElementById('templates-container');
            
            const filteredTemplates = filter === 'all' ? 
                templates : 
                templates.filter(t => t.status === filter);

            container.innerHTML = filteredTemplates.map(template => `
                <div class="template-card">
                    <h3 class="title">${template.name}</h3>
                    <div class="meta">
                        <span>Version ${template.version}</span>
                        <span>·</span>
                        <span>Created ${new Date(template.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                    </div>
                    <div class="template-actions">
                        <button onclick="editTemplate('${template.id}')" class="secondary-button">
                            Edit
                        </button>
                        <button onclick="previewTemplate('${template.id}')" class="secondary-button">
                            Preview
                        </button>
                        <button onclick="assignTemplate('${template.id}')" class="primary-button">
                            Assign
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            showError('Failed to load templates');
            console.error(error);
        }
    }

    // Load and display signed waivers
    async function loadSignedWaivers(eventId = 'all') {
        try {
            const waivers = eventId === 'all' ?
                await waiverSystem.getAllSignedWaivers() :
                await waiverSystem.getEventWaivers(eventId);

            const container = document.getElementById('signed-waivers-container');
            
            container.innerHTML = waivers.map(waiver => `
                <div class="waiver-item">
                    <div class="waiver-info">
                        <div>${waiver.participantName}</div>
                        <div class="date">Signed: ${new Date(waiver.signedAt?.seconds * 1000).toLocaleDateString()}</div>
                    </div>
                    <div class="waiver-actions">
                        <button onclick="viewWaiver('${waiver.id}')" class="secondary-button">
                            View
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            showError('Failed to load signed waivers');
            console.error(error);
        }
    }

    // Load and display emergency contacts
    async function loadEmergencyContacts() {
        try {
            const contacts = await waiverSystem.getEmergencyContacts();
            const tbody = document.querySelector('#emergency-contacts-table tbody');
            
            tbody.innerHTML = contacts.map(contact => `
                <tr>
                    <td>${contact.participantName}</td>
                    <td>${contact.emergencyContacts[0]?.name || '-'}</td>
                    <td>${contact.emergencyContacts[0]?.relationship || '-'}</td>
                    <td>${contact.emergencyContacts[0]?.phone || '-'}</td>
                    <td>${contact.emergencyContacts[0]?.email || '-'}</td>
                    <td>
                        <button onclick="viewContacts('${contact.participantId}')" class="secondary-button">
                            View All
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            showError('Failed to load emergency contacts');
            console.error(error);
        }
    }

    // Utility functions
    function openModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
    }

    function closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    function showSuccess(message) {
        const alert = document.getElementById('success-message');
        alert.textContent = message;
        alert.style.display = 'block';
        setTimeout(() => alert.style.display = 'none', 3000);
    }

    function showError(message) {
        const alert = document.getElementById('error-message');
        alert.textContent = message;
        alert.style.display = 'block';
        setTimeout(() => alert.style.display = 'none', 3000);
    }

    // Export functions to global scope for button onclick handlers
    window.editTemplate = async (templateId) => {
        // Implementation for editing template
    };

    window.previewTemplate = async (templateId) => {
        // Implementation for previewing template
    };

    window.assignTemplate = async (templateId) => {
        // Implementation for assigning template
    };

    window.viewWaiver = async (waiverId) => {
        // Implementation for viewing signed waiver
    };

    window.viewContacts = async (participantId) => {
        // Implementation for viewing all contacts
    };
});

// Add to your waivers.js or create a new modal-handler.js
class ModalHandler {
    constructor() {
        this.initialize();
    }

    initialize() {
        // Modal elements
        this.modal = document.getElementById('waiver-preview-modal');
        this.closeButtons = document.querySelectorAll('.close-modal, .modal-close');
        this.modalContent = document.querySelector('.modal-content');
        
        // Bind event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close button click
        this.closeButtons.forEach(button => {
            button.addEventListener('click', () => this.closeModal());
        });

        // Click outside modal
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // Escape key press
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // Modal action buttons
        const actionButtons = document.querySelectorAll('.modal-actions button');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleModalAction(action);
            });
        });
    }

    openModal(content) {
        if (this.modal) {
            // Update modal content
            const contentContainer = document.getElementById('waiver-preview-content');
            if (contentContainer) {
                contentContainer.innerHTML = content;
            }

            // Show modal
            this.modal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }
    }

    handleModalAction(action) {
        switch (action) {
            case 'edit':
                // Handle edit action
                this.closeModal();
                // Implement edit functionality
                break;
            case 'assign':
                // Handle assign action
                this.closeModal();
                // Implement assign functionality
                break;
            default:
                this.closeModal();
                break;
        }
    }
}

// Update your waiver preview function
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
        });

        // Create modal content
        const modalContent = `
            <div class="waiver-preview">
                <div class="waiver-content">
                    ${waiver.content}
                </div>
                <div class="waiver-meta">
                    <div class="meta-item">
                        <span class="label">Template:</span>
                        <span class="value">${waiver.name}</span>
                    </div>
                    <div class="meta-item">
                        <span class="label">Version:</span>
                        <span class="value">${waiver.version}</span>
                    </div>
                </div>
            </div>
        `;

        // Use modal handler to show preview
        const modalHandler = new ModalHandler();
        modalHandler.openModal(modalContent);

    } catch (error) {
        console.error('Error previewing waiver:', error);
        showError('Failed to preview waiver');
    }
}

// Add some CSS for the modal
const style = document.createElement('style');
style.textContent = `
    .waiver-preview {
        padding: 20px;
        max-height: 70vh;
        overflow-y: auto;
    }

    .waiver-content {
        white-space: pre-wrap;
        font-family: 'Arial', sans-serif;
        line-height: 1.6;
        color: #E6F0FF;
        margin-bottom: 20px;
    }

    .waiver-meta {
        border-top: 1px solid #2e3b4e;
        padding-top: 20px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 10px;
    }

    .meta-item {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .meta-item .label {
        color: #8899A6;
        font-size: 0.875rem;
    }

    .meta-item .value {
        color: #E6F0FF;
        font-weight: 500;
    }
`;

document.head.appendChild(style);
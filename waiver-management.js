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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
/**
 * WaiverManagementSystem handles all waiver-related operations
 * including template management, waiver assignments, and verification.
 */
class WaiverManagementSystem {
    /**
     * Initialize the waiver management system
     * @param {Object} db - Firestore database instance
     * @param {string} organizerId - ID of the current organizer
     */
    constructor(db, organizerId) {
        this.db = db;
        this.organizerId = organizerId;
        this.waiverTemplatesRef = collection(db, 'waiverTemplates');
        this.signedWaiversRef = collection(db, 'signedWaivers');
        this.eventWaiversRef = collection(db, 'eventWaivers');
    }

    /**
     * Create a new waiver template
     * @param {Object} templateData - The template data
     * @param {string} templateData.name - Template name
     * @param {string} templateData.content - Template content/text
     * @param {Array} templateData.requiredFields - Required fields for the waiver
     * @param {Array} templateData.customClauses - Custom clauses for the waiver
     * @returns {Promise<Object>} Created template data with ID
     */
    async createTemplate(templateData) {
        try {
            const template = {
                ...templateData,
                version: 1,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                organizerId: this.organizerId,
                isDefault: false,
                status: 'active'
            };

            const docRef = await addDoc(this.waiverTemplatesRef, template);
            return { id: docRef.id, ...template };
        } catch (error) {
            console.error('Error creating waiver template:', error);
            throw new Error('Failed to create waiver template');
        }
    }

    /**
     * Update an existing waiver template
     * @param {string} templateId - ID of the template to update
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated template data
     */
    async updateTemplate(templateId, updates) {
        try {
            const templateRef = doc(this.waiverTemplatesRef, templateId);
            const templateDoc = await getDoc(templateRef);

            if (!templateDoc.exists()) {
                throw new Error('Template not found');
            }

            const currentData = templateDoc.data();
            
            // Increment version if content is changed
            const newVersion = updates.content !== currentData.content ? 
                currentData.version + 1 : currentData.version;

            const updateData = {
                ...updates,
                version: newVersion,
                updatedAt: serverTimestamp()
            };

            await updateDoc(templateRef, updateData);
            return { id: templateId, ...updateData };
        } catch (error) {
            console.error('Error updating waiver template:', error);
            throw new Error('Failed to update waiver template');
        }
    }

    /**
     * Assign a waiver template to an event
     * @param {string} eventId - ID of the event
     * @param {string} templateId - ID of the template to assign
     * @param {Object} requirements - Waiver requirements for the event
     * @returns {Promise<Object>} Assignment details
     */
    async assignToEvent(eventId, templateId, requirements = {}) {
        try {
            const assignment = {
                templateId,
                eventId,
                organizerId: this.organizerId,
                requirements: {
                    validityPeriod: requirements.validityPeriod || 24,
                    requiresRenewal: requirements.requiresRenewal || false,
                    additionalClauses: requirements.additionalClauses || [],
                    minimumAge: requirements.minimumAge || 18
                },
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(this.eventWaiversRef, assignment);
            return { id: docRef.id, ...assignment };
        } catch (error) {
            console.error('Error assigning waiver to event:', error);
            throw new Error('Failed to assign waiver to event');
        }
    }

    /**
     * Get all waiver templates for the organizer
     * @returns {Promise<Array>} List of waiver templates
     */
    async getTemplates() {
        try {
            const q = query(
                this.waiverTemplatesRef,
                where('organizerId', '==', this.organizerId),
                where('status', '==', 'active'),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching waiver templates:', error);
            throw new Error('Failed to fetch waiver templates');
        }
    }

    /**
     * Get all signed waivers for an event
     * @param {string} eventId - ID of the event
     * @returns {Promise<Array>} List of signed waivers
     */
    async getEventWaivers(eventId) {
        try {
            const q = query(
                this.signedWaiversRef,
                where('eventId', '==', eventId),
                orderBy('signedAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching signed waivers:', error);
            throw new Error('Failed to fetch signed waivers');
        }
    }

    /**
     * Verify waiver status for a participant
     * @param {string} eventId - ID of the event
     * @param {string} userId - ID of the participant
     * @returns {Promise<Object>} Waiver status details
     */
    async verifyWaiverStatus(eventId, userId) {
        try {
            const q = query(
                this.signedWaiversRef,
                where('eventId', '==', eventId),
                where('userId', '==', userId),
                where('status', '==', 'active')
            );

            const querySnapshot = await getDocs(q);
            const waivers = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return {
                hasSigned: waivers.length > 0,
                waivers,
                lastSigned: waivers[0]?.signedAt || null
            };
        } catch (error) {
            console.error('Error verifying waiver status:', error);
            throw new Error('Failed to verify waiver status');
        }
    }

    /**
     * Get emergency contacts for all event participants
     * @param {string} eventId - ID of the event
     * @returns {Promise<Array>} List of emergency contacts
     */
    async getEmergencyContacts(eventId) {
        try {
            const q = query(
                this.signedWaiversRef,
                where('eventId', '==', eventId)
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                participantId: doc.data().userId,
                emergencyContacts: doc.data().emergencyContacts
            }));
        } catch (error) {
            console.error('Error fetching emergency contacts:', error);
            throw new Error('Failed to fetch emergency contacts');
        }
    }
}

export default WaiverManagementSystem;
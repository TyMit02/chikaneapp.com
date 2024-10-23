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

    // Add these methods to your WaiverManagementSystem class

/**
 * Validate waiver template before creation/update
 * @param {Object} templateData - Template data to validate
 * @returns {Object} Validation result
 */
async validateTemplate(templateData) {
    const requiredFields = ['name', 'content'];
    const errors = [];

    // Check required fields
    requiredFields.forEach(field => {
        if (!templateData[field]) {
            errors.push(`Missing required field: ${field}`);
        }
    });

    // Validate content length
    if (templateData.content && templateData.content.length < 100) {
        errors.push('Waiver content must be at least 100 characters long');
    }

    // Check for required legal clauses
    const requiredClauses = [
        'assumption of risk',
        'release of liability',
        'indemnification'
    ];

    const contentLower = templateData.content.toLowerCase();
    requiredClauses.forEach(clause => {
        if (!contentLower.includes(clause)) {
            errors.push(`Missing required clause: ${clause}`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Handle minor participant waiver requirements
 * @param {string} eventId - Event ID
 * @param {Object} participantData - Participant data including age
 * @returns {Object} Waiver requirements for the participant
 */
async getParticipantWaiverRequirements(eventId, participantData) {
    const isMinor = participantData.age < 18;
    const eventWaiverRef = doc(this.eventWaiversRef, eventId);
    const eventWaiver = await getDoc(eventWaiverRef);

    if (!eventWaiver.exists()) {
        throw new Error('No waiver assigned to this event');
    }

    const requirements = eventWaiver.data().requirements;

    return {
        ...requirements,
        requiresGuardian: isMinor,
        additionalForms: isMinor ? ['parentalConsent', 'guardianIdentification'] : [],
        minimumAge: requirements.minimumAge || 18
    };
}

/**
 * Batch process waivers for multiple participants
 * @param {string} eventId - Event ID
 * @param {Array} participants - Array of participant IDs
 * @param {string} action - Action to perform ('remind', 'verify', etc.)
 * @returns {Object} Processing results
 */
async batchProcessWaivers(eventId, participants, action) {
    const results = {
        successful: [],
        failed: [],
        skipped: []
    };

    const batch = writeBatch(this.db);

    try {
        for (const participantId of participants) {
            switch (action) {
                case 'remind':
                    // Add to notification queue
                    const notificationRef = doc(collection(this.db, 'notificationQueue'));
                    batch.set(notificationRef, {
                        type: 'waiverReminder',
                        eventId,
                        participantId,
                        createdAt: serverTimestamp()
                    });
                    results.successful.push(participantId);
                    break;

                case 'verify':
                    // Check waiver status
                    const status = await this.verifyWaiverStatus(eventId, participantId);
                    if (status.hasSigned) {
                        results.successful.push(participantId);
                    } else {
                        results.failed.push(participantId);
                    }
                    break;

                default:
                    results.skipped.push(participantId);
            }
        }

        // Commit batch if there are changes
        if (results.successful.length > 0) {
            await batch.commit();
        }

        return results;
    } catch (error) {
        console.error('Error in batch processing:', error);
        throw new Error('Failed to process waivers batch');
    }
}

/**
 * Get waiver analytics for an event
 * @param {string} eventId - Event ID
 * @returns {Object} Analytics data
 */
async getWaiverAnalytics(eventId) {
    try {
        const waivers = await this.getEventWaivers(eventId);
        
        return {
            totalParticipants: waivers.length,
            signedWaivers: waivers.filter(w => w.status === 'signed').length,
            pendingWaivers: waivers.filter(w => w.status === 'pending').length,
            minorWaivers: waivers.filter(w => w.isMinor).length,
            completionRate: waivers.length > 0 ? 
                (waivers.filter(w => w.status === 'signed').length / waivers.length) * 100 : 0,
            averageSigningTime: this.calculateAverageSigningTime(waivers),
            waiverStatuses: this.getWaiverStatusBreakdown(waivers)
        };
    } catch (error) {
        console.error('Error getting waiver analytics:', error);
        throw new Error('Failed to get waiver analytics');
    }
}

/**
 * Calculate average time to sign waivers
 * @private
 */
calculateAverageSigningTime(waivers) {
    const signedWaivers = waivers.filter(w => 
        w.status === 'signed' && w.createdAt && w.signedAt
    );

    if (signedWaivers.length === 0) return 0;

    const totalTime = signedWaivers.reduce((sum, waiver) => {
        const createdTime = waiver.createdAt.seconds;
        const signedTime = waiver.signedAt.seconds;
        return sum + (signedTime - createdTime);
    }, 0);

    return totalTime / signedWaivers.length; // Average time in seconds
}

/**
 * Get breakdown of waiver statuses
 * @private
 */
getWaiverStatusBreakdown(waivers) {
    const breakdown = {
        signed: 0,
        pending: 0,
        expired: 0,
        rejected: 0
    };

    waivers.forEach(waiver => {
        if (breakdown.hasOwnProperty(waiver.status)) {
            breakdown[waiver.status]++;
        }
    });

    return breakdown;
}

}

export default WaiverManagementSystem;
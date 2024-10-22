// stripe-config.js
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51QC5hpCvERe5npglcf7g6p1WvYWNqKu1SVgwYGyxH90PLYop5z3ie16qVhNGAC8RUqLmvRiIM6Pjd6zo53b7Fl1F00jBIq0mAL');

// Stripe webhook secret for backend
const endpointSecret = 'your_webhook_secret';

export class PaymentManager {
    constructor() {
        this.stripe = stripePromise;
    }

    // Create payment intent for event registration
    async createRegistrationPayment(eventId, userId, registrationDetails) {
        try {
            const eventData = await this.getEventPricing(eventId);
            const amount = this.calculateTotalAmount(eventData, registrationDetails);
            
            const paymentIntent = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount,
                    eventId,
                    userId,
                    registrationDetails
                }),
            }).then(r => r.json());

            return paymentIntent;
        } catch (error) {
            console.error('Payment creation failed:', error);
            throw new Error('Failed to create payment');
        }
    }

    // Process registration after successful payment
    async processRegistration(eventId, userId, paymentIntentId) {
        try {
            const registration = await fetch('/api/complete-registration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    eventId,
                    userId,
                    paymentIntentId
                }),
            }).then(r => r.json());

            return registration;
        } catch (error) {
            console.error('Registration processing failed:', error);
            throw new Error('Failed to process registration');
        }
    }
}

// Registration system that integrates with payments
export class RegistrationSystem {
    constructor() {
        this.paymentManager = new PaymentManager();
    }

    // Start registration process
    async startRegistration(eventId, userId, registrationData) {
        try {
            // Validate registration data
            await this.validateRegistration(registrationData);

            // Create temporary registration record
            const registrationRecord = await this.createRegistrationRecord(eventId, userId, registrationData);

            // Create payment intent
            const paymentIntent = await this.paymentManager.createRegistrationPayment(
                eventId,
                userId,
                registrationData
            );

            return {
                registrationId: registrationRecord.id,
                clientSecret: paymentIntent.client_secret,
                amount: paymentIntent.amount,
            };
        } catch (error) {
            console.error('Registration failed:', error);
            throw new Error('Failed to start registration');
        }
    }

    // Complete registration after successful payment
    async completeRegistration(registrationId, paymentIntentId) {
        try {
            // Verify payment was successful
            const paymentVerified = await this.verifyPayment(paymentIntentId);
            if (!paymentVerified) {
                throw new Error('Payment verification failed');
            }

            // Update registration status
            const registration = await this.finalizeRegistration(registrationId);

            // Send confirmation email
            await this.sendConfirmationEmail(registration);

            // Create garage allocation if requested
            if (registration.garageRequested) {
                await this.allocateGarage(registration);
            }

            // Process any add-ons
            await this.processAddOns(registration);

            return registration;
        } catch (error) {
            console.error('Registration completion failed:', error);
            throw new Error('Failed to complete registration');
        }
    }
}

// Event management system
export class EventManager {
    constructor() {
        this.registrationSystem = new RegistrationSystem();
    }

    // Create new event with pricing tiers
    async createEvent(eventData) {
        try {
            const event = await this.validateAndCreateEvent(eventData);
            
            // Set up Stripe products and prices
            await this.setupStripePricing(event);

            // Create run groups
            await this.createRunGroups(event);

            // Set up digital waivers
            await this.setupWaivers(event);

            return event;
        } catch (error) {
            console.error('Event creation failed:', error);
            throw new Error('Failed to create event');
        }
    }

    // Manage run groups
    async manageRunGroups(eventId) {
        try {
            const event = await this.getEvent(eventId);
            const registrations = await this.getEventRegistrations(eventId);

            // Balance run groups based on experience and car type
            const groups = await this.balanceRunGroups(registrations);

            // Update run group assignments
            await this.updateRunGroupAssignments(groups);

            return groups;
        } catch (error) {
            console.error('Run group management failed:', error);
            throw new Error('Failed to manage run groups');
        }
    }
}

// Digital waiver system
export class WaiverSystem {
    async createWaiver(eventId, waiverData) {
        try {
            const waiver = await this.generateWaiver(waiverData);
            
            // Store waiver template
            await this.storeWaiverTemplate(eventId, waiver);

            return waiver;
        } catch (error) {
            console.error('Waiver creation failed:', error);
            throw new Error('Failed to create waiver');
        }
    }

    async processWaiverSignature(waiverId, userId, signatureData) {
        try {
            // Validate signature data
            await this.validateSignature(signatureData);

            // Store signed waiver
            const signedWaiver = await this.storeSignedWaiver(waiverId, userId, signatureData);

            return signedWaiver;
        } catch (error) {
            console.error('Waiver signature failed:', error);
            throw new Error('Failed to process waiver signature');
        }
    }
}

// Garage allocation system
export class GarageManager {
    async allocateGarage(eventId, registrationId) {
        try {
            const registration = await this.getRegistration(registrationId);
            const garageMap = await this.getGarageMap(eventId);

            // Find available garage based on vehicle type and preferences
            const allocation = await this.findAvailableGarage(garageMap, registration);

            // Update garage allocation
            await this.updateGarageAllocation(eventId, registrationId, allocation);

            return allocation;
        } catch (error) {
            console.error('Garage allocation failed:', error);
            throw new Error('Failed to allocate garage');
        }
    }
}
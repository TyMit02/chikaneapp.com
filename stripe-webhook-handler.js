// stripe-webhook-handler.js
import { initializeApp } from "firebase/app";
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    updateDoc, 
    getDoc,
    serverTimestamp 
} from "firebase/firestore";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const db = getFirestore();

export class StripeWebhookHandler {
    constructor() {
        this.handlers = {
            'customer.subscription.created': this.handleSubscriptionCreated,
            'customer.subscription.updated': this.handleSubscriptionUpdated,
            'customer.subscription.deleted': this.handleSubscriptionDeleted,
            'invoice.paid': this.handleInvoicePaid,
            'invoice.payment_failed': this.handlePaymentFailed,
            'checkout.session.completed': this.handleCheckoutCompleted,
            'account.updated': this.handleConnectAccountUpdated,
        };
    }

    async handleWebhook(event) {
        try {
            const handler = this.handlers[event.type];
            if (handler) {
                await handler.call(this, event.data.object);
                return { success: true };
            }
            console.log(`Unhandled event type: ${event.type}`);
            return { success: true };
        } catch (error) {
            console.error(`Error handling webhook ${event.type}:`, error);
            throw error;
        }
    }

    // Handle new subscription created
    async handleSubscriptionCreated(subscription) {
        try {
            const { customer, metadata } = subscription;
            const userId = metadata.userId;

            if (!userId) {
                throw new Error('No userId in metadata');
            }

            // Update user's subscription in Firestore
            await setDoc(doc(db, 'subscriptions', userId), {
                stripeSubscriptionId: subscription.id,
                stripePriceId: subscription.items.data[0].price.id,
                stripeCustomerId: customer,
                status: subscription.status,
                planName: metadata.planName,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Update user's status
            await updateDoc(doc(db, 'users', userId), {
                subscriptionStatus: subscription.status,
                subscriptionPlan: metadata.planName,
                updatedAt: serverTimestamp()
            });

        } catch (error) {
            console.error('Error in handleSubscriptionCreated:', error);
            throw error;
        }
    }

    // Handle subscription updates
    async handleSubscriptionUpdated(subscription) {
        try {
            const { metadata } = subscription;
            const userId = metadata.userId;

            if (!userId) {
                throw new Error('No userId in metadata');
            }

            // Update subscription record
            await updateDoc(doc(db, 'subscriptions', userId), {
                status: subscription.status,
                stripePriceId: subscription.items.data[0].price.id,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                updatedAt: serverTimestamp()
            });

            // Update user record
            await updateDoc(doc(db, 'users', userId), {
                subscriptionStatus: subscription.status,
                subscriptionPlan: metadata.planName,
                updatedAt: serverTimestamp()
            });

        } catch (error) {
            console.error('Error in handleSubscriptionUpdated:', error);
            throw error;
        }
    }

    // Handle subscription cancellations
    async handleSubscriptionDeleted(subscription) {
        try {
            const { metadata } = subscription;
            const userId = metadata.userId;

            if (!userId) {
                throw new Error('No userId in metadata');
            }

            // Update subscription status
            await updateDoc(doc(db, 'subscriptions', userId), {
                status: 'canceled',
                canceledAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Update user status
            await updateDoc(doc(db, 'users', userId), {
                subscriptionStatus: 'canceled',
                subscriptionPlan: null,
                updatedAt: serverTimestamp()
            });

        } catch (error) {
            console.error('Error in handleSubscriptionDeleted:', error);
            throw error;
        }
    }

    // Handle successful payments
    async handleInvoicePaid(invoice) {
        try {
            const { customer, subscription, metadata } = invoice;
            const userId = metadata.userId;

            if (!userId) {
                throw new Error('No userId in metadata');
            }

            // Store invoice record
            await setDoc(doc(collection(db, 'users', userId, 'invoices')), {
                stripeInvoiceId: invoice.id,
                stripeCustomerId: customer,
                stripeSubscriptionId: subscription,
                amount: invoice.amount_paid,
                status: invoice.status,
                billingReason: invoice.billing_reason,
                invoiceUrl: invoice.hosted_invoice_url,
                pdfUrl: invoice.invoice_pdf,
                createdAt: serverTimestamp()
            });

            // Update subscription status if needed
            if (invoice.billing_reason === 'subscription_create') {
                await updateDoc(doc(db, 'subscriptions', userId), {
                    status: 'active',
                    updatedAt: serverTimestamp()
                });
            }

        } catch (error) {
            console.error('Error in handleInvoicePaid:', error);
            throw error;
        }
    }

    // Handle failed payments
    async handlePaymentFailed(invoice) {
        try {
            const { metadata } = invoice;
            const userId = metadata.userId;

            if (!userId) {
                throw new Error('No userId in metadata');
            }

            // Update subscription status
            await updateDoc(doc(db, 'subscriptions', userId), {
                status: 'past_due',
                updatedAt: serverTimestamp()
            });

            // Store failed payment record
            await setDoc(doc(collection(db, 'users', userId, 'paymentFailures')), {
                stripeInvoiceId: invoice.id,
                amount: invoice.amount_due,
                failureReason: invoice.last_payment_error?.message || 'Unknown error',
                createdAt: serverTimestamp()
            });

        } catch (error) {
            console.error('Error in handlePaymentFailed:', error);
            throw error;
        }
    }

    // Handle successful checkout
    async handleCheckoutCompleted(session) {
        try {
            const { metadata, customer } = session;
            const userId = metadata.userId;

            if (!userId) {
                throw new Error('No userId in metadata');
            }

            // Update user's customer ID if needed
            await updateDoc(doc(db, 'users', userId), {
                stripeCustomerId: customer,
                updatedAt: serverTimestamp()
            });

        } catch (error) {
            console.error('Error in handleCheckoutCompleted:', error);
            throw error;
        }
    }

    // Handle Connect account updates
    async handleConnectAccountUpdated(account) {
        try {
            const { metadata } = account;
            const organizerId = metadata.organizerId;

            if (!organizerId) {
                throw new Error('No organizerId in metadata');
            }

            // Update organizer's Stripe status
            await updateDoc(doc(db, 'organizers', organizerId), {
                stripeConnected: account.charges_enabled,
                stripeDetailsSubmitted: account.details_submitted,
                stripePolicyAccepted: account.tos_acceptance?.date ? true : false,
                updatedAt: serverTimestamp()
            });

        } catch (error) {
            console.error('Error in handleConnectAccountUpdated:', error);
            throw error;
        }
    }
}
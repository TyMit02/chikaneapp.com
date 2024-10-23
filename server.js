// server.js
import express from 'express';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { StripeWebhookHandler } from './stripe-webhook-handler';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import cors from 'cors';

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Initialize Stripe - Replace this with your Stripe secret key
const stripe = new Stripe('sk_test_51QC5hpCvERe5npgleCPuYc3x3DXkEUNozANTJbQZXX4mUVsMJ5i3jeYKvwNHGadpQPNHkwKvcB4hS9bzmMP6AYHK00zrYqj5lY');

// Initialize Firestore
const db = getFirestore();

// Initialize webhook handler
const webhookHandler = new StripeWebhookHandler();

// Middleware
app.use(cors());
app.use(express.static('public'));

// Use raw body for webhook endpoint
app.use('https://chikaneapp.com/stripe/webhook', express.raw({ type: 'application/json' }));
// Use JSON parsing for all other endpoints
app.use((req, res, next) => {
    if (req.originalUrl === '/stripe/webhook') {
        next();
    } else {
        express.json()(req, res, next);
    }
});

// Webhook endpoint
app.post('https://chikaneapp.com/stripe/webhook', async (req, res) => {
    // Replace this with your webhook signing secret from Stripe dashboard
    const webhookSecret = 'whsec_DojYOeXhjnufgV98a9hAiaBaw4QDULGP';
    
    try {
        const sig = req.headers['stripe-signature'];
        const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        
        await webhookHandler.handleWebhook(event);
        res.json({ received: true });
    } catch (err) {
        console.error('Webhook error:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

// Create Connect account link
app.post('/api/create-connect-account', async (req, res) => {
    try {
        const { organizerId } = req.body;

        // Create a Connect account
        const account = await stripe.accounts.create({
            type: 'standard',
            metadata: { organizerId }
        });

        // Create an account link
        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${process.env.APP_URL}/organizer-settings.html`,
            return_url: `${process.env.APP_URL}/organizer-settings.html`,
            type: 'account_onboarding',
        });

        // Store the account ID in Firestore
        await updateDoc(doc(db, 'organizers', organizerId), {
            stripeAccountId: account.id,
            stripeConnected: false,
            updatedAt: new Date()
        });

        res.json({ accountLink: accountLink.url });
    } catch (error) {
        console.error('Error creating connect account:', error);
        res.status(500).json({ error: error.message });
    }
});

// Check Connect account status
app.get('/api/check-connect-status/:organizerId', async (req, res) => {
    try {
        const { organizerId } = req.params;
        
        // Get organizer document from Firestore
        const organizerDoc = await getDoc(doc(db, 'organizers', organizerId));
        
        if (!organizerDoc.exists()) {
            return res.status(404).json({ error: 'Organizer not found' });
        }

        const stripeAccountId = organizerDoc.data().stripeAccountId;
        
        if (!stripeAccountId) {
            return res.json({ connected: false });
        }

        const account = await stripe.accounts.retrieve(stripeAccountId);
        
        res.json({
            connected: account.charges_enabled,
            detailsSubmitted: account.details_submitted
        });
    } catch (error) {
        console.error('Error checking connect status:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { eventId, userId, priceId } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.APP_URL}/event-success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.APP_URL}/event-cancel.html`,
            metadata: {
                eventId,
                userId
            }
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create Subscription
app.post('/api/create-subscription', async (req, res) => {
    try {
        const { userId, priceId } = req.body;

        // Get or create customer
        const userDoc = await getDoc(doc(db, 'users', userId));
        let customerId = userDoc.data()?.stripeCustomerId;

        if (!customerId) {
            const customer = await stripe.customers.create({
                metadata: { userId }
            });
            customerId = customer.id;
            
            await updateDoc(doc(db, 'users', userId), {
                stripeCustomerId: customerId
            });
        }

        // Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            expand: ['latest_invoice.payment_intent'],
            metadata: { userId }
        });

        res.json({
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice.payment_intent.client_secret
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ error: error.message });
    }
});

// Cancel Subscription
app.post('/api/cancel-subscription', async (req, res) => {
    try {
        const { subscriptionId } = req.body;
        
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true
        });

        res.json({ subscription });
    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create Portal Session
app.post('/api/create-portal-session', async (req, res) => {
    try {
        const { customerId } = req.body;

        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.APP_URL}/dashboard.html`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating portal session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
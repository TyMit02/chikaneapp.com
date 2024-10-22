// api/create-payment-intent.js
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createPaymentIntent(req, res) {
    try {
        const { amount, eventId, userId, registrationDetails } = req.body;

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            metadata: {
                eventId,
                userId,
                registrationType: registrationDetails.type
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            amount: amount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// api/webhook.js
export async function handleStripeWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            await handleSuccessfulPayment(paymentIntent);
            break;
        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            await handleFailedPayment(failedPayment);
            break;
    }

    res.json({ received: true });
}
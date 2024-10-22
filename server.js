import express from 'express';
import dotenv from 'dotenv';
import Stripe from 'stripe';

// Load environment variables
dotenv.config();

const app = express();
const stripe = new Stripe(process.env.sk_test_51QC5hpCvERe5npgleCPuYc3x3DXkEUNozANTJbQZXX4mUVsMJ5i3jeYKvwNHGadpQPNHkwKvcB4hS9bzmMP6AYHK00zrYqj5lY);

app.use(express.json());
app.use(express.static('public'));

// Create Connect account link
app.post('/api/create-connect-account', async (req, res) => {
    try {
        const { organizerId } = req.body;

        // Create a Connect account
        const account = await stripe.accounts.create({
            type: 'standard',
            metadata: {
                organizerId
            }
        });

        // Create an account link
        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${process.env.APP_URL}/organizer-settings.html`,
            return_url: `${process.env.APP_URL}/organizer-settings.html`,
            type: 'account_onboarding',
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
        
        // Get the account ID from your database using organizerId
        // This is just an example, implement your database lookup
        const accountId = await getStripeAccountId(organizerId);
        
        if (!accountId) {
            return res.json({ connected: false });
        }

        const account = await stripe.accounts.retrieve(accountId);
        
        res.json({
            connected: account.charges_enabled,
            detailsSubmitted: account.details_submitted
        });
    } catch (error) {
        console.error('Error checking connect status:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
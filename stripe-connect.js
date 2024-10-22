// stripe-connect.js
export async function initStripeConnect() {
    const connectButton = document.getElementById('connectStripeBtn');
    const statusDiv = document.getElementById('stripeStatus');
    
    // Check if already connected
    const organizerId = getCurrentUser()?.uid;
    if (!organizerId) return;

    try {
        const organizerDoc = await getDoc(doc(db, "organizers", organizerId));
        const stripeConnected = organizerDoc.data()?.stripeConnected;
        
        if (stripeConnected) {
            // Show connected status
            statusDiv.innerHTML = `
                <div class="connected-status">
                    <span class="status-badge success">Connected</span>
                    <p>Your Stripe account is connected and ready to receive payments.</p>
                    <button onclick="manageStripeAccount()" class="secondary-button">
                        Manage Stripe Account
                    </button>
                </div>
            `;
            connectButton.style.display = 'none';
        } else {
            // Show connect button
            connectButton.addEventListener('click', initiateStripeConnect);
        }
    } catch (error) {
        console.error("Error checking Stripe connection:", error);
        showError("Failed to check payment processor connection");
    }
}

async function initiateStripeConnect() {
    try {
        // Get the connection URL from your backend
        const response = await fetch('/api/create-connect-account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                organizerId: getCurrentUser()?.uid
            }),
        });

        const data = await response.json();
        
        // Redirect to Stripe Connect onboarding
        window.location.href = data.accountLink;
    } catch (error) {
        console.error("Error initiating Stripe connection:", error);
        showError("Failed to connect payment processor");
    }
}

// Update the event creation to use organizer's Stripe account
export async function createEventWithPricing(eventData, pricing) {
    try {
        const organizerId = getCurrentUser()?.uid;
        const organizerDoc = await getDoc(doc(db, "organizers", organizerId));
        const stripeAccountId = organizerDoc.data()?.stripeAccountId;
        
        if (!stripeAccountId) {
            throw new Error("Please connect your Stripe account before creating events");
        }

        // Create the event with pricing info
        const eventWithPricing = {
            ...eventData,
            pricing: {
                ...pricing,
                stripeAccountId
            }
        };

        const eventRef = await addDoc(collection(db, "events"), eventWithPricing);
        return eventRef;
    } catch (error) {
        console.error("Error creating event with pricing:", error);
        throw error;
    }
}
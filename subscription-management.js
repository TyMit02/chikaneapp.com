// subscription-management.js

document.addEventListener('DOMContentLoaded', function() {
    // Initialize subscription management
    initializeSubscriptionView();
});

async function initializeSubscriptionView() {
    try {
        // Get current user's subscription
        const subscription = await getCurrentSubscription();
        updateCurrentPlanDisplay(subscription);
        updateUsageStats(subscription);
        await loadBillingHistory();
    } catch (error) {
        console.error('Error initializing subscription view:', error);
        showError('Failed to load subscription information');
    }
}

async function getCurrentSubscription() {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');

        const docRef = doc(db, 'subscriptions', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting subscription:', error);
        throw error;
    }
}

function updateCurrentPlanDisplay(subscription) {
    const currentPlanDetails = document.getElementById('current-plan-details');
    if (!currentPlanDetails) return;

    if (subscription) {
        currentPlanDetails.innerHTML = `
            <div>
                <p class="text-[#E6F0FF] text-lg">${subscription.planName}</p>
                <p class="text-[#8899A6]">$${subscription.amount}/month</p>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-green-400">
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </span>
                <span class="text-[#E6F0FF]">Active</span>
            </div>
        `;
    } else {
        currentPlanDetails.innerHTML = `
            <div class="w-full bg-[#0A1828] p-4 rounded-lg text-[#8899A6]">
                No active subscription. Choose a plan below to get started.
            </div>
        `;
    }
}

function updateUsageStats(subscription) {
    if (!subscription) return;

    const eventsCount = document.getElementById('events-count');
    const participantsCount = document.getElementById('participants-count');
    const nextBillingDate = document.getElementById('next-billing-date');

    if (eventsCount) {
        const limit = subscription.planName === 'Enterprise' ? '∞' : 
                     subscription.planName === 'Professional' ? '5' : '2';
        eventsCount.textContent = `${subscription.eventsThisMonth || 0} / ${limit}`;
    }

    if (participantsCount) {
        participantsCount.textContent = subscription.totalParticipants || 0;
    }

    if (nextBillingDate && subscription.currentPeriodEnd) {
        const date = new Date(subscription.currentPeriodEnd);
        nextBillingDate.textContent = date.toLocaleDateString();
    }
}

async function loadBillingHistory() {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');

        const billingHistoryElement = document.getElementById('billing-history');
        if (!billingHistoryElement) return;

        // Get billing history from Firestore
        const invoicesRef = collection(db, 'users', user.uid, 'invoices');
        const querySnapshot = await getDocs(invoicesRef);

        if (querySnapshot.empty) {
            billingHistoryElement.innerHTML = `
                <tr>
                    <td class="py-4" colspan="4">No billing history available</td>
                </tr>
            `;
            return;
        }

        billingHistoryElement.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const invoice = doc.data();
            billingHistoryElement.innerHTML += `
                <tr>
                    <td class="py-4">${new Date(invoice.date).toLocaleDateString()}</td>
                    <td class="py-4">$${(invoice.amount / 100).toFixed(2)}</td>
                    <td class="py-4">
                        <span class="px-2 py-1 rounded-full text-sm ${
                            invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                            invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                        }">
                            ${invoice.status}
                        </span>
                    </td>
                    <td class="py-4">
                        <a href="${invoice.invoiceUrl}" target="_blank" class="text-[#FF4500] hover:text-[#FF6533]">
                            Download
                        </a>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error loading billing history:', error);
        showError('Failed to load billing history');
    }
}

async function selectPlan(planName) {
    try {
        const user = auth.currentUser;
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        // Start loading state
        const button = event.target;
        button.disabled = true;
        button.innerHTML = 'Processing...';

        // Create checkout session
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                planName,
                userId: user.uid
            })
        });

        const session = await response.json();

        if (session.error) {
            throw new Error(session.error);
        }

        // Redirect to checkout
        window.location.href = session.url;
    } catch (error) {
        console.error('Error selecting plan:', error);
        showError('Failed to process plan selection');
        // Reset button state
        button.disabled = false;
        button.innerHTML = 'Select Plan';
    }
}

// Modal handlers
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
}

async function confirmCancelSubscription() {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');

        const response = await fetch('/api/cancel-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: user.uid
            })
        });

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        // Close modal and refresh page
        closeModal('cancel-subscription-modal');
        window.location.reload();
    } catch (error) {
        console.error('Error canceling subscription:', error);
        showError('Failed to cancel subscription');
    }
}
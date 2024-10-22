// Organizer subscription tiers
const SUBSCRIPTION_TIERS = {
    BASIC: {
        name: 'Basic',
        price: 199, // $199/month
        features: {
            maxEventsPerMonth: 2,
            maxParticipantsPerEvent: 50,
            supportResponse: '48h',
            customBranding: false,
            analytics: 'basic',
            exportReports: false
        }
    },
    PRO: {
        name: 'Professional',
        price: 399, // $399/month
        features: {
            maxEventsPerMonth: 5,
            maxParticipantsPerEvent: 150,
            supportResponse: '24h',
            customBranding: true,
            analytics: 'advanced',
            exportReports: true
        }
    },
    ENTERPRISE: {
        name: 'Enterprise',
        price: 999, // $999/month
        features: {
            maxEventsPerMonth: 'unlimited',
            maxParticipantsPerEvent: 'unlimited',
            supportResponse: '4h',
            customBranding: true,
            analytics: 'premium',
            exportReports: true,
            dedicatedSupport: true,
            apiAccess: true
        }
    }
};
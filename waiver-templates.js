// Standard templates for different waiver types
const WAIVER_TEMPLATES = {
    // Standard liability waiver
    standard: {
        name: "Standard Liability Waiver",
        content: `RELEASE AND WAIVER OF LIABILITY, ASSUMPTION OF RISK, AND INDEMNITY AGREEMENT

In consideration of participating in motorsport activities at {eventName}, I represent that:

1. I understand the nature of motorsport activities and that I am qualified, in good health, and in proper physical condition to participate in such activities.

2. I acknowledge that motorsport activities are inherently dangerous and involve risks of serious bodily injury, including permanent disability, paralysis and death, which may be caused by my own actions, or inactions, those of others participating in the event, the conditions in which the event takes place, or the negligence of the "Releasees" named below.

3. I fully accept and assume all such risks and all responsibility for losses, costs, and damages I incur as a result of my participation in the activity.

{additionalClauses}

I HAVE READ THIS RELEASE AND WAIVER OF LIABILITY, ASSUMPTION OF RISK, AND INDEMNITY AGREEMENT. I FULLY UNDERSTAND ITS TERMS, UNDERSTAND THAT I HAVE GIVEN UP SUBSTANTIAL RIGHTS BY SIGNING IT, AND SIGN IT FREELY AND VOLUNTARILY WITHOUT ANY INDUCEMENT.`,
        requiredFields: ["fullName", "dateOfBirth", "address", "emergencyContact"],
        version: 1
    },

    // Minor participant waiver
    minor: {
        name: "Minor Participant Waiver",
        content: `PARENTAL CONSENT AND RELEASE FOR MINOR

I, {parentName}, am the parent or legal guardian of {minorName}, a minor under the age of 18 years. I hereby consent to their participation in motorsport activities at {eventName}.

I acknowledge that motorsport activities are inherently dangerous and involve risks of serious bodily injury. I understand and assume all risks on behalf of my minor child/ward.

{additionalClauses}

I HAVE READ THIS RELEASE AND WAIVER OF LIABILITY. I UNDERSTAND THAT BY SIGNING THIS AGREEMENT I GIVE UP SUBSTANTIAL RIGHTS THAT MY MINOR CHILD/WARD OR I WOULD OTHERWISE HAVE TO RECOVER DAMAGES FOR LOSSES OCCASIONED BY THE RELEASEES' FAULT.`,
        requiredFields: ["parentName", "minorName", "dateOfBirth", "address", "emergencyContact"],
        version: 1
    },

    // Media release waiver
    media: {
        name: "Media Release Waiver",
        content: `MEDIA RELEASE AND CONSENT FORM

I, {fullName}, hereby grant permission to {organizerName} and its representatives to take and use photographs/digital images, videotape, and/or audio recordings of me for use in:

1. Promotional or educational materials
2. Social media content
3. Website materials
4. Other lawful purposes

I waive any right to inspect or approve the finished photographs/images, audio, or video recordings.

{additionalClauses}

I HAVE READ AND UNDERSTAND THE ABOVE MEDIA RELEASE AND CONSENT FORM. I AFFIRM THAT I AM AT LEAST 18 YEARS OF AGE, OR IF I AM UNDER 18 YEARS OF AGE, I HAVE OBTAINED THE REQUIRED CONSENT OF MY PARENTS/GUARDIANS.`,
        requiredFields: ["fullName", "email"],
        version: 1
    }
};

// Helper function to generate a complete waiver from a template
function generateWaiver(templateType, eventData) {
    const template = WAIVER_TEMPLATES[templateType];
    if (!template) throw new Error('Template not found');

    let content = template.content;
    
    // Replace placeholders with actual data
    Object.entries(eventData).forEach(([key, value]) => {
        content = content.replace(`{${key}}`, value);
    });

    return {
        ...template,
        content,
        generatedAt: new Date()
    };
}

export { WAIVER_TEMPLATES, generateWaiver };
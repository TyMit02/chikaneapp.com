// run-groups.js

class RunGroupManager {
    constructor() {
        this.groups = [];
        this.participants = [];
        this.draggedParticipant = null;
    }

    async initialize(eventId) {
        try {
            // Fetch existing groups and participants
            const groupsRef = collection(db, 'events', eventId, 'runGroups');
            const participantsRef = collection(db, 'events', eventId, 'participants');
            
            const [groupsSnapshot, participantsSnapshot] = await Promise.all([
                getDocs(groupsRef),
                getDocs(participantsRef)
            ]);

            this.groups = groupsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.participants = participantsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.renderGroups();
            this.initializeDragAndDrop();
        } catch (error) {
            console.error('Error initializing run groups:', error);
            showError('Failed to load run groups');
        }
    }

    renderGroups() {
        const grid = document.getElementById('run-groups-grid');
        grid.innerHTML = '';

        this.groups.forEach(group => {
            const groupEl = this.createGroupElement(group);
            grid.appendChild(groupEl);
        });
    }

    createGroupElement(group) {
        const div = document.createElement('div');
        div.className = 'bg-[#1A2838] rounded-lg p-6 border border-[#2e3b4e]';
        div.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full" style="background-color: ${group.color}"></div>
                    <h3 class="text-lg font-bold text-[#E6F0FF]">${group.name}</h3>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-[#8899A6] text-sm">
                        ${group.participants?.length || 0}/${group.maxParticipants}
                    </span>
                    <button onclick="editGroup('${group.id}')" class="p-1 hover:bg-[#2e3b4e] rounded">
                        <svg class="w-4 h-4 text-[#E6F0FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="text-[#8899A6] text-sm mb-4">
                <div class="flex items-center gap-2 mb-1">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>${this.formatSessionTimes(group.sessionTimes)}</span>
                </div>
                <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>${group.experienceLevel} Experience Required</span>
                </div>
            </div>

            <div class="space-y-2 participant-list" data-group-id="${group.id}">
                ${this.renderParticipants(group.participants || [])}
            </div>

            ${this.renderGroupRequirements(group)}
        `;

        return div;
    }

    renderParticipants(participants) {
        return participants.map(participant => `
            <div class="participant-card bg-[#0A1828] p-3 rounded-lg" 
                 draggable="true" 
                 data-participant-id="${participant.id}">
                <div class="flex justify-between items-center">
                    <div>
                        <div class="text-[#E6F0FF] font-medium">${participant.name}</div>
                        <div class="text-[#8899A6] text-sm">${participant.car}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-[#8899A6] text-sm">${participant.experience} track days</div>
                        ${participant.instructor ? '<span class="bg-[#FF4500] text-white text-xs px-2 py-1 rounded">Instructor</span>' : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderGroupRequirements(group) {
        const requirements = [];
        if (group.instructorRequired) requirements.push('Instructor Required');
        if (group.safetyCheck) requirements.push('Safety Check Required');
        if (group.timingRequired) requirements.push('Timing Required');

        if (requirements.length === 0) return '';

        return `
            <div class="mt-4 pt-4 border-t border-[#2e3b4e]">
                <div class="flex flex-wrap gap-2">
                    ${requirements.map(req => `
                        <span class="bg-[#0A1828] text-[#8899A6] text-xs px-2 py-1 rounded">
                            ${req}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    initializeDragAndDrop() {
        const participantCards = document.querySelectorAll('.participant-card');
        const participantLists = document.querySelectorAll('.participant-list');

        participantCards.forEach(card => {
            card.addEventListener('dragstart', this.handleDragStart.bind(this));
            card.addEventListener('dragend', this.handleDragEnd.bind(this));
        });

        participantLists.forEach(list => {
            list.addEventListener('dragover', this.handleDragOver.bind(this));
            list.addEventListener('drop', this.handleDrop.bind(this));
        });
    }

    async handleDrop(e) {
        e.preventDefault();
        const groupId = e.currentTarget.dataset.groupId;
        const participantId = this.draggedParticipant;

        if (!groupId || !participantId) return;

        try {
            await this.moveParticipantToGroup(participantId, groupId);
            this.renderGroups();
        } catch (error) {
            console.error('Error moving participant:', error);
            showError('Failed to move participant');
        }
    }

    async autoBalanceGroups() {
        try {
            const participantsSnapshot = await getDocs(collection(db, 'participants'));
            const participants = participantsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort participants by experience level
            participants.sort((a, b) => b.experience - a.experience);

            // Get all groups and their capacities
            const groupsSnapshot = await getDocs(collection(db, 'runGroups'));
            const groups = groupsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                participants: []
            }));

            // Distribute participants evenly while considering experience levels
            participants.forEach((participant, index) => {
                // Find the most appropriate group based on experience level and current capacity
                const targetGroup = groups.reduce((best, current) => {
                    if (current.participants.length >= current.maxParticipants) return best;
                    if (!best) return current;
                    
                    const currentMatch = this.getExperienceMatch(participant, current);
                    const bestMatch = this.getExperienceMatch(participant, best);
                    
                    if (currentMatch > bestMatch) return current;
                    if (currentMatch === bestMatch) {
                        return current.participants.length < best.participants.length ? current : best;
                    }
                    return best;
                }, null);

                if (targetGroup) {
                    targetGroup.participants.push(participant);
                }
            });

            // Update all groups in Firestore
            await Promise.all(groups.map(group => 
                updateDoc(doc(db, 'runGroups', group.id), {
                    participants: group.participants
                })
            ));

            this.renderGroups();
            showSuccess('Groups have been automatically balanced');
        } catch (error) {
            console.error('Error auto-balancing groups:', error);
            showError('Failed to auto-balance groups');
        }
    }

    getExperienceMatch(participant, group) {
        const expLevels = {
            'novice': [0, 2],
            'intermediate': [3, 10],
            'advanced': [11, 20],
            'expert': [21, Infinity]
        };

        const groupRange = expLevels[group.experienceLevel];
        const exp = participant.experience;

        if (exp >= groupRange[0] && exp <= groupRange[1]) return 3;
        if (exp < groupRange[0]) return 1;
        return 2;
    }

    async moveParticipantToGroup(participantId, newGroupId) {
        try {
            const batch = writeBatch(db);

            // Remove from old group
            const oldGroupDoc = this.groups.find(g => 
                g.participants?.some(p => p.id === participantId)
            );
            if (oldGroupDoc) {
                const updatedParticipants = oldGroupDoc.participants.filter(p => p.id !== participantId);
                batch.update(doc(db, 'runGroups', oldGroupDoc.id), { participants: updatedParticipants });
            }

            // Add to new group
            const participant = this.participants.find(p => p.id === participantId);
            const newGroup = this.groups.find(g => g.id === newGroupId);
            
            if (!participant || !newGroup) throw new Error('Participant or group not found');

            // Validate move
            if (this.validateGroupMove(participant, newGroup)) {
                const updatedParticipants = [...(newGroup.participants || []), participant];
                batch.update(doc(db, 'runGroups', newGroupId), { participants: updatedParticipants });
                
                await batch.commit();
                this.renderGroups();
            }
        } catch (error) {
            console.error('Error moving participant:', error);
            throw error;
        }
    }

    validateGroupMove(participant, group) {
        // Check group capacity
        if (group.participants?.length >= group.maxParticipants) {
            showError('Group is at maximum capacity');
            return false;
        }

        // Check experience requirements
        const expLevels = {
            'novice': 0,
            'intermediate': 3,
            'advanced': 11,
            'expert': 21
        };

        if (participant.experience < expLevels[group.experienceLevel]) {
            showError('Participant does not meet experience requirements for this group');
            return false;
        }

        // Check instructor requirements
        if (group.instructorRequired && !participant.isInstructor) {
            showError('This group requires an instructor');
            return false;
        }

        return true;
    }

    async createGroup(groupData) {
        try {
            const docRef = await addDoc(collection(db, 'runGroups'), {
                ...groupData,
                participants: [],
                createdAt: serverTimestamp()
            });

            showSuccess('Group created successfully');
            await this.initialize();
        } catch (error) {
            console.error('Error creating group:', error);
            showError('Failed to create group');
        }
    }

    formatSessionTimes(times) {
        if (!times || !times.length) return 'No sessions scheduled';
        return times.map(time => {
            const t = new Date(time);
            return t.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
        }).join(', ');
    }

    // Event Handlers
    handleDragStart(e) {
        this.draggedParticipant = e.target.dataset.participantId;
        e.target.classList.add('dragging');
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedParticipant = null;
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const runGroupManager = new RunGroupManager();
    const eventId = new URLSearchParams(window.location.search).get('eventId');
    if (eventId) {
        runGroupManager.initialize(eventId);
    }
});

// Modal Handlers
function openModal(groupId = null) {
    const modal = document.getElementById('group-modal');
    const title = document.getElementById('modal-title');
    
    if (groupId) {
        title.textContent = 'Edit Run Group';
        // Populate form with existing group data
        const group = runGroupManager.groups.find(g => g.id === groupId);
        if (group) {
            document.getElementById('group-name').value = group.name;
            document.getElementById('group-color').value = group.color;
            document.getElementById('group-experience').value = group.experienceLevel;
            document.getElementById('group-max').value = group.maxParticipants;
        }
    } else {
        title.textContent = 'Create Run Group';
        document.getElementById('group-modal').reset();
    }
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('group-modal').classList.add('hidden');
}

function addSessionTime() {
    const container = document.querySelector('.session-times');
    const timeInput = document.createElement('div');
    timeInput.className = 'flex gap-2 mt-2';
    timeInput.innerHTML = `
        <input type="time" class="flex-1 bg-[#0A1828] border border-[#2e3b4e] rounded-lg px-4 py-2 text-[#E6F0FF]">
        <button onclick="this.parentElement.remove()" class="bg-red-600 text-white p-2 rounded-lg">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>
    `;
    container.appendChild(timeInput);
}
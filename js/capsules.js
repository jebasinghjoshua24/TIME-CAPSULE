// capsules.js - All capsule operations

// ==================== Initialize Capsules ====================
function initializeCapsules() {
    if (!currentUser) return;
    
    initializeCapsuleTracking();
    initializeFriendSystem();
    checkForNewNotifications();
    
    const capsuleForm = document.getElementById('capsule-form');
    if (capsuleForm) {
        capsuleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleCreateCapsule(e);
        });
    }
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            applyFilters();
        });
    }
    
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            applyFilters();
        });
    }
    
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            applyFilters();
        });
    }
    
    const favoritesFilterBtn = document.getElementById('favorites-filter');
    if (favoritesFilterBtn) {
        favoritesFilterBtn.addEventListener('click', function() {
            favoritesFilter = !favoritesFilter;
            this.classList.toggle('active');
            const icon = this.querySelector('i');
            if (icon) {
                icon.className = favoritesFilter ? 'fas fa-star' : 'far fa-star';
            }
            applyFilters();
        });
    }
    
    const exportBtn = document.getElementById('export-data');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportCapsules);
    }
    
    const importBtn = document.getElementById('import-data');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            document.getElementById('import-file').click();
        });
    }
    
    const importFile = document.getElementById('import-file');
    if (importFile) {
        importFile.addEventListener('change', importCapsules);
    }
    
    const profileBtn = document.getElementById('profile-btn');
    if (!profileBtn) {
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            const profileBtn = document.createElement('button');
            profileBtn.id = 'profile-btn';
            profileBtn.className = 'admin-btn';
            profileBtn.innerHTML = '<i class="fas fa-user"></i> Profile';
            profileBtn.style.background = 'linear-gradient(135deg, #6c5ce7, #a55eea)';
            profileBtn.addEventListener('click', showUserProfile);
            navLinks.appendChild(profileBtn);
        }
    }
    
    if (currentUser.isAdmin) {
        addAdminButton();
    }
    
    renderAll();
    startCountdownUpdates();
    startLiveCountdownUpdates();
    initializeAutoSave();
    loadDraft();
    
    checkReminders();
    setInterval(checkReminders, 60000);
}

// ==================== Create Capsule ====================
function handleCreateCapsule(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const message = document.getElementById('message').value;
    const category = document.getElementById('category').value;
    const unlockDate = document.getElementById('unlock-date').value;
    const mood = document.getElementById('mood')?.value || 'happy';
    
    if (!title || !message || !unlockDate) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    const unlockDateTime = new Date(unlockDate).getTime();
    const now = new Date().getTime();
    
    if (unlockDateTime <= now) {
        showToast('Unlock date must be in the future', 'error');
        return;
    }
    
    if (!currentUser) {
        showToast('You must be logged in', 'error');
        return;
    }
    
    const collaborationType = document.getElementById('collaboration-type')?.value || 'private';
    let collaborators = [];
    let groupId = null;

    if (collaborationType === 'specific') {
        collaborators = getSelectedFriends();
    } else if (collaborationType === 'group') {
        const groupName = document.getElementById('group-name').value;
        if (groupName) {
            groupId = createGroup(groupName, [currentUser.id, ...getSelectedFriends()]);
        }
    }

    const newCapsule = {
    id: generateId(),
    title,
    description,
    message,
    category,
    tags: [],
    mood: mood,
    createdAt: new Date().toISOString(),
    unlockDate: new Date(unlockDate).toISOString(),
    isLocked: true,
    isFavorite: false,
    isArchived: false,
    isPinned: false,
    accessAttempts: [],
    ownerId: currentUser.id,
    ownerUsername: currentUser.username,
    // NEW COLLABORATION FIELDS
    isCollaborative: false,
    collaborators: [], // Array of user IDs who can access
    collaboratorRequests: [], // Pending requests
    allowedUsers: [currentUser.id], // Users who can view (owner + collaborators)
    collaborationType: 'private', // 'private', 'friends', 'public'
    groupId: null, // For group collaborations
    contributions: [], // For multi-contributor capsules
    reactions: { '❤️': 0, '😂': 0, '😮': 0, '😢': 0, '👏': 0 },
    comments: [],
    version: 1
};
    
    capsules.push(newCapsule);
    saveVersion(newCapsule.id);
    
    e.target.reset();
    
    showToast('Capsule created successfully! 📦', 'success');
    
    activityLog.unshift({
        id: generateId(),
        capsuleId: newCapsule.id,
        type: 'capsule_created',
        timestamp: new Date().toISOString(),
        details: `Created capsule: ${title}`
    });
    
    saveToStorage();
    
    renderAll();
}

// ==================== Collaboration Functions ====================

// Toggle collaboration fields based on selection
function toggleCollaborationFields() {
    const type = document.getElementById('collaboration-type').value;
    const friendSelector = document.getElementById('friend-selector');
    const groupInput = document.getElementById('group-input');
    
    friendSelector.style.display = 'none';
    groupInput.style.display = 'none';
    
    if (type === 'specific') {
        friendSelector.style.display = 'block';
        loadFriendsForCollaboration();
    } else if (type === 'group') {
        groupInput.style.display = 'block';
    }
}

// Load friends for collaboration selection
function loadFriendsForCollaboration() {
    const container = document.getElementById('friends-list-container');
    if (!container) return;
    
    // Get user's friends
    const userFriends = friends.filter(f => 
        f.userId1 === currentUser.id || f.userId2 === currentUser.id
    ).map(f => {
        const friendId = f.userId1 === currentUser.id ? f.userId2 : f.userId1;
        const friend = users.find(u => u.id === friendId);
        return friend;
    }).filter(f => f); // Remove any undefined
    
    if (userFriends.length === 0) {
        container.innerHTML = '<p style="color: var(--dark-text-muted); padding: 10px;">No friends yet. <a href="#" onclick="showUserProfile()">Add friends</a> first.</p>';
        return;
    }
    
    container.innerHTML = userFriends.map(friend => `
        <label style="display: flex; align-items: center; gap: 10px; padding: 8px; cursor: pointer; border-bottom: 1px solid var(--dark-border);">
            <input type="checkbox" class="friend-checkbox" value="${friend.id}" style="width: 18px; height: 18px;">
            <i class="fas fa-user-circle" style="color: var(--dark-accent-primary);"></i>
            <span style="color: var(--dark-text-primary);">${friend.username}</span>
        </label>
    `).join('');
}

// Get selected friends for collaboration
function getSelectedFriends() {
    const checkboxes = document.querySelectorAll('.friend-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// Create a group
function createGroup(groupName, members) {
    const groups = JSON.parse(localStorage.getItem('timeCapsule_groups') || '[]');
    
    const newGroup = {
        id: generateId(),
        name: groupName,
        createdBy: currentUser.id,
        createdByUsername: currentUser.username,
        members: members,
        createdAt: new Date().toISOString(),
        capsules: []
    };
    
    groups.push(newGroup);
    localStorage.setItem('timeCapsule_groups', JSON.stringify(groups));
    
    return newGroup.id;
}

// Check if user can access collaborative capsule
function canAccessCapsule(capsule, userId) {
    // Owner always has access
    if (capsule.ownerId === userId) return true;
    
    // Check collaboration type
    if (capsule.collaborationType === 'public') {
        return true;
    }
    
    if (capsule.collaborationType === 'friends') {
        // Check if user is a friend of owner
        return friends.some(f => 
            (f.userId1 === capsule.ownerId && f.userId2 === userId) ||
            (f.userId2 === capsule.ownerId && f.userId1 === userId)
        );
    }
    
    if (capsule.collaborationType === 'specific') {
        return capsule.collaborators?.includes(userId) || false;
    }
    
    if (capsule.collaborationType === 'group' && capsule.groupId) {
        const groups = JSON.parse(localStorage.getItem('timeCapsule_groups') || '[]');
        const group = groups.find(g => g.id === capsule.groupId);
        return group?.members?.includes(userId) || false;
    }
    
    return false;
}


// ==================== Check Collaborative Capsule Access ====================
function canAccessCapsule(capsule, userId) {
    if (!capsule || !userId) return false;
    
    // Owner always has access
    if (capsule.ownerId === userId) return true;
    
    // Check if user is in collaborators list
    if (capsule.collaborators && capsule.collaborators.includes(userId)) return true;
    
    // Check if capsule is public
    if (capsule.collaborationType === 'public') return true;
    
    // Check friends-only access
    if (capsule.collaborationType === 'friends') {
        return friends.some(f => 
            (f.userId1 === capsule.ownerId && f.userId2 === userId) ||
            (f.userId2 === capsule.ownerId && f.userId1 === userId)
        );
    }
    
    return false;
}

// ==================== Get Collaborative Capsules ====================
function getCollaborativeCapsules(userId) {
    if (!userId) return [];
    
    return capsules.filter(c => 
        c.isCollaborative && 
        !c.isArchived &&
        canAccessCapsule(c, userId)
    );
}

// Get collaborative capsules for a user
function getCollaborativeCapsules(userId) {
    return capsules.filter(c => 
        canAccessCapsule(c, userId) && !c.isArchived
    );
}

// ==================== Open Capsule ====================
function handleOpenCapsule(capsuleId) {
    const capsule = capsules.find(c => c.id === capsuleId);
    if (!capsule) return;
    
    const now = new Date().getTime();
    const unlockTime = new Date(capsule.unlockDate).getTime();
    
    capsule.accessAttempts = capsule.accessAttempts || [];
    capsule.accessAttempts.push({
        timestamp: new Date().toISOString(),
        success: now >= unlockTime
    });
    
    if (now < unlockTime) {
        const prematureAttempts = capsule.accessAttempts.filter(a => !a.success).length;
        
        activityLog.unshift({
            id: generateId(),
            capsuleId: capsule.id,
            type: 'self_destruct_warning',
            timestamp: new Date().toISOString(),
            details: `⚠️ Attempted early access on "${capsule.title}" (Attempt #${prematureAttempts})`
        });
        
        saveToStorage();
        
        showMemeModal(capsule, unlockTime - now);
        
        if (prematureAttempts >= 3) {
            triggerSelfDestruct(capsuleId, 'multiple_premature_attempts');
            showToast('💥 CAPSULE SELF-DESTRUCTED! Nice try!', 'error');
        }
        
        return;
    }
    
    // Check if this is the first time opening this capsule
    const isFirstOpen = !isCapsuleOpened(capsuleId);
    
    showCapsuleContent(capsule);
    
    if (isFirstOpen) {
        showConfetti();
        markCapsuleAsOpened(capsuleId);
        showToast('🎉 Congratulations! You opened your time capsule!', 'success', 5000);
    }
    
    if (capsule.isLocked) {
        capsule.isLocked = false;
        
        activityLog.unshift({
            id: generateId(),
            capsuleId: capsule.id,
            type: 'capsule_unlocked',
            timestamp: new Date().toISOString(),
            details: `🎉 Capsule unlocked: ${capsule.title}`
        });
        
        saveToStorage();
    }
    
    renderAll();
}

// ==================== View Capsule Details ====================
function viewCapsuleDetails(capsuleId) {
    const capsule = capsules.find(c => c.id === capsuleId);
    if (!capsule) return;
    
    const owner = users.find(u => u.id === capsule.ownerId);
    const versions = JSON.parse(localStorage.getItem(`capsule_versions_${capsuleId}`) || '[]');
    
    const modal = document.createElement('div');
    modal.className = 'capsule-details-modal';
    modal.innerHTML = `
        <div class="capsule-details-content">
            <h2><i class="fas fa-capsules"></i> ${capsule.title}</h2>
            <div class="details-grid">
                <div class="detail-item">
                    <label>Owner:</label>
                    <span>${owner ? owner.username : 'Unknown'}</span>
                </div>
                <div class="detail-item">
                    <label>Category:</label>
                    <span>${capsule.category}</span>
                </div>
                <div class="detail-item">
                    <label>Created:</label>
                    <span>${new Date(capsule.createdAt).toLocaleString()}</span>
                </div>
                <div class="detail-item">
                    <label>Unlock Date:</label>
                    <span>${new Date(capsule.unlockDate).toLocaleString()}</span>
                </div>
                <div class="detail-item">
                    <label>Status:</label>
                    <span class="status-badge ${capsule.isLocked ? 'locked' : 'unlocked'}">
                        ${capsule.isLocked ? '🔒 Locked' : '🔓 Unlocked'}
                    </span>
                </div>
                <div class="detail-item">
                    <label>Access Attempts:</label>
                    <span>${capsule.accessAttempts?.length || 0}</span>
                </div>
            </div>
            
            <div class="detail-section">
                <label>Mood:</label>
                <span class="mood-tag mood-${capsule.mood || 'happy'}">${moodOptions.find(m => m.value === capsule.mood)?.label || '😊 Happy'}</span>
            </div>
            
            <div class="detail-section">
                <label>Tags:</label>
                <div class="tags-container">
                    ${capsule.tags ? capsule.tags.map(tag => `
                        <span class="tag">${tag}</span>
                    `).join('') : 'No tags'}
                </div>
            </div>
            
            <div class="detail-section">
                <label>Description:</label>
                <p>${capsule.description || 'No description'}</p>
            </div>
            
            <div class="detail-section">
                <label>Message:</label>
                <div class="message-box">${capsule.message}</div>
            </div>
            
            <div class="reactions-container">
                ${Object.entries(capsule.reactions || {}).map(([emoji, count]) => `
                    <button class="reaction-btn" onclick="addReaction('${capsule.id}', '${emoji}')">
                        ${emoji} <span class="reaction-count">${count}</span>
                    </button>
                `).join('')}
            </div>
            
            <div class="share-link-container">
                <input type="text" class="share-link-input" value="${window.location.origin}/capsule.html?id=${capsule.id}" readonly>
                <button class="copy-share-btn" onclick="copyShareLink(this)"><i class="fas fa-copy"></i></button>
            </div>
            
            ${versions.length > 0 ? `
                <button onclick="showVersionHistory('${capsule.id}')" class="btn-secondary">
                    <i class="fas fa-history"></i> Version History (${versions.length})
                </button>
            ` : ''}
            
            <button onclick="this.closest('.capsule-details-modal').remove()" class="btn-primary" style="margin-top: 10px;">Close</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Add these functions to capsules.js

// ==================== Edit Capsule ====================
// In capsules.js - Update editCapsule function

function editCapsule(capsuleId) {
    const capsule = capsules.find(c => c.id === capsuleId);
    if (!capsule) return;
    
    // Check if user owns this capsule
    if (capsule.ownerId !== currentUser?.id) {
        showToast('You can only edit your own capsules', 'error');
        return;
    }
    
    // Check if capsule is locked
    if (capsule.isLocked) {
        showToast('Cannot edit a locked capsule', 'error');
        return;
    }
    
    // CHECK EDIT LIMIT
    if (capsule.editLocked) {
        showToast('This capsule has reached its maximum edit limit (3 edits)', 'error');
        return;
    }
    
    if (capsule.editCount >= capsule.maxEdits) {
        showToast(`This capsule has reached its maximum edit limit (${capsule.maxEdits} edits)`, 'error');
        return;
    }
    
    const editsRemaining = capsule.maxEdits - capsule.editCount;
    
    // Create edit modal
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
        <div class="admin-modal-content" style="max-width: 600px;">
            <h3><i class="fas fa-edit" style="color: #feca57;"></i> Edit Capsule: "${capsule.title}"</h3>
            
            <!-- EDIT LIMIT WARNING -->
            <div style="
                background: ${editsRemaining === 1 ? 'rgba(255, 107, 107, 0.1)' : 'rgba(254, 202, 87, 0.1)'};
                border-left: 4px solid ${editsRemaining === 1 ? '#ff6b6b' : '#feca57'};
                padding: 12px;
                margin-bottom: 20px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                gap: 10px;
            ">
                <i class="fas ${editsRemaining === 1 ? 'fa-exclamation-triangle' : 'fa-info-circle'}" 
                   style="color: ${editsRemaining === 1 ? '#ff6b6b' : '#feca57'}; font-size: 1.2rem;"></i>
                <div>
                    <strong style="color: ${editsRemaining === 1 ? '#ff6b6b' : '#feca57'};">
                        ${editsRemaining} edit${editsRemaining !== 1 ? 's' : ''} remaining
                    </strong>
                    <p style="color: var(--dark-text-secondary); font-size: 0.9rem; margin-top: 2px;">
                        You can edit this capsule ${editsRemaining} more time${editsRemaining !== 1 ? 's' : ''}. 
                        After that, it will be locked permanently.
                    </p>
                </div>
            </div>
            
            <div style="margin: 20px 0;">
                <div class="form-group">
                    <label for="edit-title">Title</label>
                    <input type="text" id="edit-title" value="${capsule.title.replace(/"/g, '&quot;')}" required>
                </div>
                
                <div class="form-group">
                    <label for="edit-description">Description</label>
                    <textarea id="edit-description" rows="3">${capsule.description || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="edit-message">Message</label>
                    <textarea id="edit-message" rows="5" required>${capsule.message.replace(/"/g, '&quot;')}</textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-category">Category</label>
                        <select id="edit-category">
                            <option value="personal" ${capsule.category === 'personal' ? 'selected' : ''}>Personal</option>
                            <option value="work" ${capsule.category === 'work' ? 'selected' : ''}>Work</option>
                            <option value="family" ${capsule.category === 'family' ? 'selected' : ''}>Family</option>
                            <option value="friends" ${capsule.category === 'friends' ? 'selected' : ''}>Friends</option>
                            <option value="memories" ${capsule.category === 'memories' ? 'selected' : ''}>Memories</option>
                            <option value="goals" ${capsule.category === 'goals' ? 'selected' : ''}>Goals</option>
                            <option value="other" ${capsule.category === 'other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-mood">Mood</label>
                        <select id="edit-mood">
                            <option value="happy" ${capsule.mood === 'happy' ? 'selected' : ''}>😊 Happy</option>
                            <option value="sad" ${capsule.mood === 'sad' ? 'selected' : ''}>😢 Sad</option>
                            <option value="excited" ${capsule.mood === 'excited' ? 'selected' : ''}>🎉 Excited</option>
                            <option value="thankful" ${capsule.mood === 'thankful' ? 'selected' : ''}>🙏 Thankful</option>
                            <option value="nostalgic" ${capsule.mood === 'nostalgic' ? 'selected' : ''}>📸 Nostalgic</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="edit-tags">Tags (comma separated)</label>
                    <input type="text" id="edit-tags" value="${(capsule.tags || []).join(', ')}" placeholder="goals, future, memories">
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="cancel-btn">Cancel</button>
                <button class="confirm-delete-btn" id="confirm-edit" style="background: #feca57;">
                    <i class="fas fa-save"></i> Save Changes (${editsRemaining} left)
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.querySelector('#confirm-edit').addEventListener('click', () => {
        const newTitle = document.getElementById('edit-title').value.trim();
        const newDescription = document.getElementById('edit-description').value.trim();
        const newMessage = document.getElementById('edit-message').value.trim();
        const newCategory = document.getElementById('edit-category').value;
        const newMood = document.getElementById('edit-mood').value;
        const tagsInput = document.getElementById('edit-tags').value;
        
        // Parse tags
        const newTags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
        
        if (!newTitle || !newMessage) {
            showToast('Title and message are required', 'error');
            return;
        }
        
        // Save current state to history before updating
        const editRecord = {
            timestamp: new Date().toISOString(),
            previousData: {
                title: capsule.title,
                description: capsule.description,
                message: capsule.message,
                category: capsule.category,
                mood: capsule.mood,
                tags: [...(capsule.tags || [])]
            },
            newData: {
                title: newTitle,
                description: newDescription,
                message: newMessage,
                category: newCategory,
                mood: newMood,
                tags: newTags
            }
        };
        
        // Update capsule
        const capsuleIndex = capsules.findIndex(c => c.id === capsuleId);
        if (capsuleIndex !== -1) {
            const newEditCount = (capsules[capsuleIndex].editCount || 0) + 1;
            const editLocked = newEditCount >= (capsules[capsuleIndex].maxEdits || 3);
            
            capsules[capsuleIndex] = {
                ...capsules[capsuleIndex],
                title: newTitle,
                description: newDescription,
                message: newMessage,
                category: newCategory,
                mood: newMood,
                tags: newTags,
                version: (capsules[capsuleIndex].version || 1) + 1,
                updatedAt: new Date().toISOString(),
                // Update edit tracking
                editCount: newEditCount,
                editLocked: editLocked,
                editHistory: [...(capsules[capsuleIndex].editHistory || []), editRecord]
            };
            
            // Save version history
            saveVersion(capsuleId);
            
            // Add to activity log
            activityLog.unshift({
                id: generateId(),
                capsuleId: capsuleId,
                type: 'capsule_edited',
                timestamp: new Date().toISOString(),
                details: `Edited capsule: ${newTitle} (Edit ${newEditCount}/${capsules[capsuleIndex].maxEdits || 3})`
            });
            
            saveToStorage();
            renderAll();
            
            if (editLocked) {
                showToast('Capsule updated. This was your final edit - capsule is now locked.', 'warning', 5000);
            } else {
                showToast(`Capsule updated successfully! ${capsules[capsuleIndex].maxEdits - newEditCount} edits remaining.`, 'success');
            }
        }
        
        modal.remove();
    });
}

// ==================== Delete Capsule (Owner) ====================
function deleteOwnCapsule(capsuleId) {
    const capsule = capsules.find(c => c.id === capsuleId);
    if (!capsule) return;
    
    // Check if user owns this capsule
    if (capsule.ownerId !== currentUser?.id) {
        showToast('You can only delete your own capsules', 'error');
        return;
    }
    
    // Create confirmation modal
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
        <div class="admin-modal-content" style="max-width: 450px;">
            <h3><i class="fas fa-exclamation-triangle" style="color: #ff6b6b;"></i> Delete Capsule</h3>
            <p style="margin: 20px 0; color: var(--dark-text-secondary);">
                Are you sure you want to delete "<strong>${capsule.title}</strong>"? This action cannot be undone.
            </p>
            <div class="modal-actions">
                <button class="cancel-btn">Cancel</button>
                <button class="confirm-delete-btn" id="confirm-owner-delete">
                    <i class="fas fa-trash"></i> Delete Permanently
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.querySelector('#confirm-owner-delete').addEventListener('click', () => {
        // Remove capsule
        const capsuleIndex = capsules.findIndex(c => c.id === capsuleId);
        if (capsuleIndex !== -1) {
            capsules.splice(capsuleIndex, 1);
            
            // Add to activity log
            activityLog.unshift({
                id: generateId(),
                capsuleId: capsuleId,
                type: 'capsule_deleted_by_owner',
                timestamp: new Date().toISOString(),
                details: `User deleted their capsule: ${capsule.title}`
            });
            
            saveToStorage();
            renderAll();
            
            showToast('Capsule deleted successfully', 'success');
        }
        
        modal.remove();
    });
}

// ==================== Show Capsule Content ====================
function showCapsuleContent(capsule) {
    const modal = document.createElement('div');
    modal.className = 'capsule-content-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    modal.innerHTML = `
        <div style="
            background: #1a1a2e;
            padding: 40px;
            border-radius: 20px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            color: white;
            box-shadow: 0 0 30px rgba(108, 92, 231, 0.5);
            animation: slideIn 0.3s ease;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: #6c5ce7;"><i class="fas fa-capsules"></i> ${capsule.title}</h2>
                <span onclick="this.closest('.capsule-content-modal').remove()" style="
                    font-size: 30px;
                    cursor: pointer;
                    color: #ff6b6b;
                ">&times;</span>
            </div>
            
            <div style="margin-bottom: 20px;">
                <span style="
                    background: #6c5ce7;
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-size: 14px;
                    margin-right: 10px;
                ">${capsule.category}</span>
                <span style="color: #a0a0a0;">Created: ${new Date(capsule.createdAt).toLocaleDateString()}</span>
            </div>
            
            ${capsule.tags ? `
                <div style="margin-bottom: 15px;">
                    ${capsule.tags.map(tag => `
                        <span class="tag" onclick="filterByTag('${tag}')">#${tag}</span>
                    `).join('')}
                </div>
            ` : ''}
            
            ${capsule.description ? `<p style="color: #b8b8d4; margin-bottom: 20px;">${capsule.description}</p>` : ''}
            
            <div style="
                background: #252542;
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 20px;
            ">
                <h3 style="color: #6c5ce7; margin-bottom: 10px;">Your Message:</h3>
                <p style="line-height: 1.6;">${capsule.message}</p>
            </div>
            
            <div class="reactions-container" style="justify-content: center;">
                ${Object.entries(capsule.reactions || {}).map(([emoji, count]) => `
                    <button class="reaction-btn" onclick="addReaction('${capsule.id}', '${emoji}')">
                        ${emoji} <span class="reaction-count">${count}</span>
                    </button>
                `).join('')}
            </div>
            
            <button onclick="this.closest('.capsule-content-modal').remove()" style="
                background: #6c5ce7;
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 25px;
                font-size: 16px;
                cursor: pointer;
                width: 100%;
                margin-top: 20px;
            ">Close</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ==================== Capsule Actions ====================
function toggleFavorite(capsuleId) {
    const capsule = capsules.find(c => c.id === capsuleId);
    if (capsule) {
        capsule.isFavorite = !capsule.isFavorite;
        
        activityLog.unshift({
            id: generateId(),
            capsuleId: capsule.id,
            type: capsule.isFavorite ? 'favorite_added' : 'favorite_removed',
            timestamp: new Date().toISOString(),
            details: `${capsule.isFavorite ? 'Added to' : 'Removed from'} favorites: ${capsule.title}`
        });
        
        saveToStorage();
        renderAll();
        showToast(capsule.isFavorite ? 'Added to favorites' : 'Removed from favorites', 'success');
    }
}

function togglePin(capsuleId) {
    const capsule = capsules.find(c => c.id === capsuleId);
    if (capsule) {
        capsule.isPinned = !capsule.isPinned;
        
        activityLog.unshift({
            id: generateId(),
            capsuleId: capsule.id,
            type: capsule.isPinned ? 'pinned' : 'unpinned',
            timestamp: new Date().toISOString(),
            details: `${capsule.isPinned ? 'Pinned' : 'Unpinned'} capsule: ${capsule.title}`
        });
        
        saveToStorage();
        renderAll();
        showToast(capsule.isPinned ? 'Capsule pinned' : 'Capsule unpinned', 'success');
    }
}

function archiveCapsule(capsuleId) {
    const capsule = capsules.find(c => c.id === capsuleId);
    if (capsule) {
        capsule.isArchived = true;
        
        activityLog.unshift({
            id: generateId(),
            capsuleId: capsule.id,
            type: 'capsule_archived',
            timestamp: new Date().toISOString(),
            details: `Archived capsule: ${capsule.title}`
        });
        
        saveToStorage();
        renderAll();
        showToast('Capsule archived', 'success');
    }
}

function unarchiveCapsule(capsuleId) {
    const capsule = capsules.find(c => c.id === capsuleId);
    if (capsule && confirm('Move this capsule out of archive?')) {
        capsule.isArchived = false;
        
        activityLog.unshift({
            id: generateId(),
            capsuleId: capsule.id,
            type: 'capsule_unarchived',
            timestamp: new Date().toISOString(),
            details: `Unarchived capsule: ${capsule.title}`
        });
        
        saveToStorage();
        renderAll();
        showToast('Capsule restored from archive', 'success');
    }
}

// ==================== Tags System ====================
function addTagToCapsule(capsuleId, tag) {
    const capsule = capsules.find(c => c.id === capsuleId);
    if (!capsule) return;
    
    if (!capsule.tags) capsule.tags = [];
    if (!capsule.tags.includes(tag)) {
        capsule.tags.push(tag);
        saveToStorage();
        renderAll();
        showToast('Tag added', 'success');
    }
}

function removeTagFromCapsule(capsuleId, tag) {
    const capsule = capsules.find(c => c.id === capsuleId);
    if (!capsule || !capsule.tags) return;
    
    capsule.tags = capsule.tags.filter(t => t !== tag);
    saveToStorage();
    renderAll();
    showToast('Tag removed', 'success');
}

function filterByTag(tag) {
    document.getElementById('search-input').value = '';
    document.getElementById('category-filter').value = 'all';
    document.getElementById('status-filter').value = 'all';
    favoritesFilter = false;
    
    const favBtn = document.getElementById('favorites-filter');
    if (favBtn) {
        favBtn.classList.remove('active');
        const icon = favBtn.querySelector('i');
        if (icon) icon.className = 'far fa-star';
    }
    
    const filtered = capsules.filter(c => c.tags && c.tags.includes(tag) && c.ownerId === currentUser?.id && !c.isArchived);
    
    const locked = filtered.filter(c => c.isLocked);
    const unlocked = filtered.filter(c => !c.isLocked);
    const favorites = filtered.filter(c => c.isFavorite);
    
    renderFilteredResults(locked, unlocked, favorites);
    showToast(`Filtering by tag: #${tag}`, 'info');
}

// ==================== Reactions System ====================
function addReaction(capsuleId, emoji) {
    const capsule = capsules.find(c => c.id === capsuleId);
    if (!capsule) return;
    
    if (!capsule.reactions) {
        capsule.reactions = { '❤️': 0, '😂': 0, '😮': 0, '😢': 0, '👏': 0 };
    }
    
    capsule.reactions[emoji] = (capsule.reactions[emoji] || 0) + 1;
    
    saveToStorage();
    
    const modal = document.querySelector('.capsule-details-modal');
    if (modal) {
        modal.remove();
        viewCapsuleDetails(capsuleId);
    }
    
    const contentModal = document.querySelector('.capsule-content-modal');
    if (contentModal) {
        contentModal.remove();
        showCapsuleContent(capsule);
    }
    
    showToast(`Added ${emoji} reaction`, 'success');
}

function copyShareLink(button) {
    const input = button.closest('.share-link-container').querySelector('input');
    input.select();
    document.execCommand('copy');
    showToast('Link copied to clipboard!', 'success');
}

// ==================== Version History ====================
function saveVersion(capsuleId) {
    const capsule = capsules.find(c => c.id === capsuleId);
    if (!capsule) return;
    
    const version = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        data: { ...capsule }
    };
    
    const versions = JSON.parse(localStorage.getItem(`capsule_versions_${capsuleId}`) || '[]');
    versions.unshift(version);
    
    if (versions.length > 5) versions.pop();
    
    localStorage.setItem(`capsule_versions_${capsuleId}`, JSON.stringify(versions));
}

function showVersionHistory(capsuleId) {
    const versions = JSON.parse(localStorage.getItem(`capsule_versions_${capsuleId}`) || '[]');
    
    const modal = document.createElement('div');
    modal.className = 'capsule-details-modal';
    modal.innerHTML = `
        <div class="capsule-details-content">
            <h2><i class="fas fa-history"></i> Version History</h2>
            <div class="version-history">
                ${versions.map((v, index) => `
                    <div class="version-item ${index === 0 ? 'current' : ''}" onclick="restoreVersion('${capsuleId}', '${v.id}')">
                        <strong>${new Date(v.timestamp).toLocaleString()}</strong>
                        <p>${v.data.title}</p>
                    </div>
                `).join('')}
            </div>
            <button onclick="this.closest('.capsule-details-modal').remove()">Close</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function restoreVersion(capsuleId, versionId) {
    const versions = JSON.parse(localStorage.getItem(`capsule_versions_${capsuleId}`) || '[]');
    const version = versions.find(v => v.id === versionId);
    
    if (version) {
        const capsuleIndex = capsules.findIndex(c => c.id === capsuleId);
        if (capsuleIndex >= 0) {
            capsules[capsuleIndex] = { ...version.data, version: (capsules[capsuleIndex].version || 1) + 1 };
            saveToStorage();
            renderAll();
            showToast('Version restored', 'success');
        }
    }
}

// ==================== Opened/Unopened Tracking ====================
function initializeCapsuleTracking() {
    const storedOpened = localStorage.getItem('timeCapsule_openedCapsules');
    if (storedOpened) {
        openedCapsules = JSON.parse(storedOpened);
    }
}

function markCapsuleAsOpened(capsuleId) {
    if (!openedCapsules.includes(capsuleId)) {
        openedCapsules.push(capsuleId);
        localStorage.setItem('timeCapsule_openedCapsules', JSON.stringify(openedCapsules));
    }
}

function isCapsuleOpened(capsuleId) {
    return openedCapsules.includes(capsuleId);
}

// ==================== Self-Destruct ====================
function triggerSelfDestruct(capsuleId, reason = 'premature_access') {
    const capsuleIndex = capsules.findIndex(c => c.id === capsuleId);
    
    if (capsuleIndex === -1) {
        return { success: false, message: 'Capsule not found' };
    }
    
    const destroyedCapsule = { ...capsules[capsuleIndex] };
    
    capsules.splice(capsuleIndex, 1);
    
    const selfDestructEvent = {
        id: generateId(),
        capsuleId: capsuleId,
        type: 'self_destruct',
        reason: reason,
        timestamp: new Date().toISOString(),
        details: `💥 Capsule "${destroyedCapsule.title}" self-destructed due to ${reason.replace('_', ' ')}`
    };
    
    activityLog.unshift(selfDestructEvent);
    saveToStorage();
    
    showSelfDestructAnimation(destroyedCapsule);
    
    if (document.getElementById('locked-space')) {
        renderAll();
    }
    
    return {
        success: true,
        message: 'Capsule self-destructed successfully'
    };
}

function showSelfDestructAnimation(capsule) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    overlay.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #ff6b6b, #c92a2a);
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            max-width: 500px;
            color: white;
            box-shadow: 0 0 50px rgba(255, 0, 0, 0.5);
            transform: scale(0.9);
            transition: transform 0.3s ease;
        ">
            <i class="fas fa-skull-crossbow" style="font-size: 80px; margin-bottom: 20px; color: #ffd700;"></i>
            <h2 style="font-size: 32px; margin-bottom: 15px; font-family: 'Orbitron', sans-serif;">SELF-DESTRUCT ACTIVATED</h2>
            <p style="font-size: 20px; margin-bottom: 20px;">"${capsule.title}" has been destroyed</p>
            <div style="width: 100%; height: 10px; background: rgba(255,255,255,0.3); border-radius: 5px; margin: 20px 0; overflow: hidden;">
                <div style="width: 0%; height: 100%; background: #ffd700; transition: width 3s linear;" class="progress-bar"></div>
            </div>
            <img src="${memeUrls[Math.floor(Math.random() * memeUrls.length)]}" 
                 style="max-width: 100%; border-radius: 10px; margin: 20px 0; border: 3px solid #ffd700;">
            <p style="font-size: 16px; margin: 10px 0;">Nice try! Capsule vaporized 💀</p>
            <p style="font-size: 14px; opacity: 0.8;">Reason: Premature access attempt detected</p>
            <button onclick="this.closest('.self-destruct-overlay').remove()" style="
                background: white;
                color: #c92a2a;
                border: none;
                padding: 12px 30px;
                border-radius: 25px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                margin-top: 20px;
                transition: transform 0.2s;
            ">I Understand</button>
        </div>
    `;
    
    overlay.className = 'self-destruct-overlay';
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        overlay.style.opacity = '1';
        overlay.querySelector('div').style.transform = 'scale(1)';
    }, 10);
    
    setTimeout(() => {
        const progressBar = overlay.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = '100%';
        }
    }, 50);
    
    setTimeout(() => {
        if (document.body.contains(overlay)) {
            overlay.remove();
        }
    }, 5000);
}

function showMemeModal(capsule, timeRemaining) {
    const modal = document.getElementById('meme-modal');
    if (!modal) return;
    
    const memeImage = document.getElementById('meme-image');
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const attempts = capsule.accessAttempts?.filter(a => !a.success).length || 0;
    
    memeImage.src = memeUrls[Math.floor(Math.random() * memeUrls.length)];
    
    const modalContent = modal.querySelector('.modal-content');
    let warningDiv = modalContent.querySelector('.self-destruct-warning');
    
    if (!warningDiv) {
        warningDiv = document.createElement('div');
        warningDiv.className = 'self-destruct-warning';
        modalContent.appendChild(warningDiv);
    }
    
    warningDiv.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #ff6b6b, #ff8787);
            color: white;
            padding: 15px;
            border-radius: 10px;
            margin: 15px 0;
            text-align: center;
        ">
            <i class="fas fa-skull-crossbow" style="font-size: 30px; margin-right: 10px;"></i>
            <span style="font-weight: bold; font-size: 18px;">SELF-DESTRUCT WARNING</span>
            <p style="margin: 10px 0;">This capsule is locked for another ${hours}h ${minutes}m</p>
            <p style="color: #fff3bf;">Force opening will trigger IMMEDIATE SELF-DESTRUCT!</p>
            <div style="margin-top: 15px;">
                <span>Attempts: ${attempts}/3</span>
                <div style="display: flex; gap: 5px; margin-top: 5px; justify-content: center;">
                    ${[1,2,3].map(i => `
                        <div style="
                            width: 30px;
                            height: 10px;
                            background: ${i <= attempts ? '#ffd700' : 'rgba(255,255,255,0.3)'};
                            border-radius: 5px;
                            transition: background 0.3s;
                        "></div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
    
    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    };
    
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// ==================== Import/Export ====================
function importCapsules(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            
            if (Array.isArray(imported)) {
                imported.forEach(capsule => {
                    if (!capsule.ownerId) {
                        capsule.ownerId = currentUser.id;
                    }
                    capsule.id = generateId();
                    capsules.push(capsule);
                });
                
                saveToStorage();
                renderAll();
                showToast(`Imported ${imported.length} capsules`, 'success');
            }
        } catch (error) {
            showToast('Invalid file format', 'error');
        }
    };
    reader.readAsText(file);
    
    event.target.value = '';
}

function exportCapsules() {
    const userCapsules = capsules.filter(c => c.ownerId === currentUser?.id);
    const dataStr = JSON.stringify(userCapsules, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `time-capsule-export-${currentUser?.username}-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('Capsules exported successfully!', 'success');
}

// ==================== Unlock Reminders ====================
function checkUpcomingUnlocks() {
    if (!currentUser) return;
    
    const now = new Date().getTime();
    const userCapsules = capsules.filter(c => c.ownerId === currentUser.id && c.isLocked);
    
    userCapsules.forEach(capsule => {
        const unlockTime = new Date(capsule.unlockDate).getTime();
        const timeUntilUnlock = unlockTime - now;
        
        // Check if unlocking in next 24 hours (and not already notified)
        if (timeUntilUnlock > 0 && timeUntilUnlock <= 24 * 60 * 60 * 1000) {
            const reminderKey = `reminder_sent_${capsule.id}`;
            if (!localStorage.getItem(reminderKey)) {
                // Show notification
                showToast(`🔔 Your capsule "${capsule.title}" will unlock in less than 24 hours!`, 'info', 10000);
                
                // Send email (opens mail client)
                const mailtoLink = sendEmailNotification(
                    currentUser.email || 'user@example.com',
                    `Your Time Capsule "${capsule.title}" Unlocks Soon!`,
                    `Hello ${currentUser.username},\n\n` +
                    `Your time capsule "${capsule.title}" will unlock in less than 24 hours!\n\n` +
                    `Unlock Date: ${new Date(capsule.unlockDate).toLocaleString()}\n\n` +
                    `Log in to TimeCapsule to view your memories when they unlock.\n\n` +
                    `- The TimeCapsule Team`
                );
                
                // Uncomment to actually open mail client
                // window.open(mailtoLink, '_blank');
                
                // Mark as notified
                localStorage.setItem(reminderKey, 'true');
            }
        }
        
        // Check if unlocked now
        if (timeUntilUnlock <= 0 && capsule.isLocked) {
            showToast(`🎉 Your capsule "${capsule.title}" has unlocked!`, 'success', 10000);
            
            // Send email notification
            const mailtoLink = sendEmailNotification(
                currentUser.email || 'user@example.com',
                `Your Time Capsule "${capsule.title}" Has Unlocked!`,
                `Hello ${currentUser.username},\n\n` +
                `Great news! Your time capsule "${capsule.title}" has now unlocked.\n\n` +
                `Log in to TimeCapsule to read your message from the past!\n\n` +
                `- The TimeCapsule Team`
            );
            
            // Uncomment to actually open mail client
            // window.open(mailtoLink, '_blank');
        }
    });
}

// Call this function periodically
setInterval(checkUpcomingUnlocks, 60 * 60 * 1000); // Check every hour

// Export functions
window.initializeCapsules = initializeCapsules;
window.handleCreateCapsule = handleCreateCapsule;
window.handleOpenCapsule = handleOpenCapsule;
window.viewCapsuleDetails = viewCapsuleDetails;
window.toggleFavorite = toggleFavorite;
window.togglePin = togglePin;
window.archiveCapsule = archiveCapsule;
window.unarchiveCapsule = unarchiveCapsule;
window.addTagToCapsule = addTagToCapsule;
window.removeTagFromCapsule = removeTagFromCapsule;
window.filterByTag = filterByTag;
window.addReaction = addReaction;
window.copyShareLink = copyShareLink;
window.showVersionHistory = showVersionHistory;
window.restoreVersion = restoreVersion;
window.triggerSelfDestruct = triggerSelfDestruct;
window.importCapsules = importCapsules;
window.exportCapsules = exportCapsules;
window.editCapsule = editCapsule;
window.deleteOwnCapsule = deleteOwnCapsule;
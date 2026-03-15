// users.js - User management, profiles, friends system

// ==================== User Profile ====================
function showUserProfile() {
    if (!currentUser) return;
    
    const userData = users.find(u => u.id === currentUser.id) || currentUser;
    const userCapsules = capsules.filter(c => c.ownerId === currentUser.id);
    const lockedCount = userCapsules.filter(c => c.isLocked).length;
    const unlockedCount = userCapsules.filter(c => !c.isLocked).length;
    const favoriteCount = userCapsules.filter(c => c.isFavorite).length;
    const archivedCount = userCapsules.filter(c => c.isArchived).length;
    
    const drafts = JSON.parse(localStorage.getItem('timeCapsule_drafts') || '[]');
    const userDrafts = drafts.filter(d => d.userId === currentUser?.id);
    
    const reminders = JSON.parse(localStorage.getItem('timeCapsule_reminders') || '[]');
    const userReminders = reminders.filter(r => r.userId === currentUser?.id);
    
    // Get avatar URL
    const avatarUrl = getUserAvatar(userData);
    
    const content = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="font-size: 2rem; margin-bottom: 10px; background: linear-gradient(135deg, var(--dark-accent-primary), var(--dark-accent-secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                <i class="fas fa-user-circle"></i> My Profile
            </h2>
        </div>
        
        <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 25px;">
            <div style="position: relative; width: 120px; height: 120px; margin-bottom: 15px;">
                <img src="${avatarUrl}" 
                     alt="Avatar" 
                     style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 3px solid var(--dark-accent-primary);"
                     id="profile-avatar">
                
                <!-- Avatar Actions -->
                <div style="position: absolute; bottom: 0; right: 0; display: flex; gap: 5px;">
                    <label for="avatar-upload" style="
                        background: var(--dark-accent-primary);
                        color: white;
                        width: 35px;
                        height: 35px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        border: 2px solid white;
                        transition: all 0.3s ease;
                    ">
                        <i class="fas fa-camera"></i>
                    </label>
                    
                    ${userData.avatar ? `
                        <button onclick="deleteAvatar()" style="
                            background: #ff6b6b;
                            color: white;
                            width: 35px;
                            height: 35px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            border: 2px solid white;
                            transition: all 0.3s ease;
                        ">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
                
                <input type="file" id="avatar-upload" accept="image/*" style="display: none;">
            </div>
            <h3 style="font-size: 1.5rem; color: var(--dark-text-primary);">${currentUser.username}</h3>
            <p style="color: var(--dark-text-secondary);">Member since: ${new Date(userData.createdAt).toLocaleDateString()}</p>
        </div>
        
        <!-- Stats Grid -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px;">
            <div style="background: var(--dark-bg-primary); padding: 15px; border-radius: 15px; text-align: center;">
                <i class="fas fa-capsules" style="color: var(--dark-accent-primary); font-size: 24px;"></i>
                <div style="font-size: 24px; font-weight: bold; color: var(--dark-text-primary);">${userCapsules.length}</div>
                <div style="color: var(--dark-text-secondary);">Total</div>
            </div>
            <div style="background: var(--dark-bg-primary); padding: 15px; border-radius: 15px; text-align: center;">
                <i class="fas fa-lock" style="color: #ff6b6b; font-size: 24px;"></i>
                <div style="font-size: 24px; font-weight: bold; color: var(--dark-text-primary);">${lockedCount}</div>
                <div style="color: var(--dark-text-secondary);">Locked</div>
            </div>
            <div style="background: var(--dark-bg-primary); padding: 15px; border-radius: 15px; text-align: center;">
                <i class="fas fa-unlock" style="color: #1dd1a1; font-size: 24px;"></i>
                <div style="font-size: 24px; font-weight: bold; color: var(--dark-text-primary);">${unlockedCount}</div>
                <div style="color: var(--dark-text-secondary);">Unlocked</div>
            </div>
            <div style="background: var(--dark-bg-primary); padding: 15px; border-radius: 15px; text-align: center;">
                <i class="fas fa-star" style="color: #feca57; font-size: 24px;"></i>
                <div style="font-size: 24px; font-weight: bold; color: var(--dark-text-primary);">${favoriteCount}</div>
                <div style="color: var(--dark-text-secondary);">Favorites</div>
            </div>
        </div>
        
        <!-- Deleted Capsules Button -->
        <div style="margin-bottom: 20px;">
            <button onclick="showDeletedCapsuleNotifications()" style="
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #ff6b6b, #c92a2a);
                color: white;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                font-size: 14px;
                transition: transform 0.3s ease;
            "
            onmouseover="this.style.transform='scale(1.02)'"
            onmouseout="this.style.transform='scale(1)'">
                <i class="fas fa-trash-alt"></i> View Deleted Capsules
            </button>
        </div>
        
        <div style="margin-bottom: 20px;">
            <button onclick="closeModal(); document.getElementById('archived-space')?.scrollIntoView({behavior: 'smooth'});" style="
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #6b6b8b, #8b8baa);
                color: white;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                font-size: 14px;
                transition: transform 0.3s ease;
            "
            onmouseover="this.style.transform='scale(1.02)'"
            onmouseout="this.style.transform='scale(1)'">
                <i class="fas fa-archive"></i> View Archived Capsules (${archivedCount})
            </button>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h3 style="display: flex; align-items: center; gap: 10px; color: var(--dark-text-primary); margin-bottom: 10px;">
                <i class="fas fa-pen" style="color: #feca57;"></i> Drafts
            </h3>
            <div id="drafts-list-popup" style="max-height: 150px; overflow-y: auto;">
                ${userDrafts.length === 0 ? 
                    '<p style="color: var(--dark-text-muted); text-align: center;">No drafts saved</p>' : 
                    userDrafts.map(draft => `
                        <div style="background: var(--dark-bg-primary); padding: 10px; border-radius: 10px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="color: var(--dark-text-primary);">${draft.title || 'Untitled'}</strong>
                                <div style="font-size: 11px; color: var(--dark-text-muted);">${new Date(draft.lastModified).toLocaleString()}</div>
                            </div>
                            <div>
                                <button onclick="loadDraft()" style="background: none; border: none; color: var(--dark-accent-primary); cursor: pointer; margin-right: 5px;">
                                    <i class="fas fa-upload"></i>
                                </button>
                                <button onclick="deleteDraft()" style="background: none; border: none; color: #ff6b6b; cursor: pointer;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h3 style="display: flex; align-items: center; gap: 10px; color: var(--dark-text-primary); margin-bottom: 10px;">
                <i class="fas fa-bell" style="color: #6c5ce7;"></i> Reminders
            </h3>
            <button onclick="showAddReminderModal()" style="
                width: 100%;
                padding: 8px;
                background: var(--dark-accent-primary);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
            ">
                <i class="fas fa-plus"></i> Add Reminder
            </button>
            <div id="reminders-list-popup" style="max-height: 150px; overflow-y: auto;">
                ${userReminders.length === 0 ?
                    '<p style="color: var(--dark-text-muted); text-align: center;">No reminders set</p>' :
                    userReminders.map(reminder => `
                        <div style="background: var(--dark-bg-primary); padding: 10px; border-radius: 10px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="color: var(--dark-text-primary);">${reminder.capsuleTitle}</strong>
                                <div style="font-size: 11px; color: var(--dark-accent-warning);">${new Date(reminder.time).toLocaleString()}</div>
                            </div>
                            <button onclick="deleteReminder('${reminder.id}')" style="background: none; border: none; color: #ff6b6b; cursor: pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join('')
                }
            </div>
        </div>
        
        <div style="background: var(--dark-bg-primary); padding: 15px; border-radius: 15px;">
            <h4 style="color: var(--dark-text-primary); margin-bottom: 10px;">Recent Activity</h4>
            <div style="max-height: 100px; overflow-y: auto;">
                ${activityLog.filter(log => log.details.includes(currentUser.username)).slice(0, 3).map(log => `
                    <div style="font-size: 12px; color: var(--dark-text-secondary); padding: 5px 0; border-bottom: 1px solid var(--dark-border);">
                        <i class="fas fa-circle" style="font-size: 6px; color: var(--dark-accent-primary); margin-right: 5px;"></i>
                        ${log.details}
                        <span style="float: right;">${new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Danger Zone - Delete Account -->
        <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid var(--dark-border);">
            <h3 style="color: #ff6b6b; margin-bottom: 1rem; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-exclamation-triangle"></i> Danger Zone
            </h3>
            
            <div style="background: rgba(255, 107, 107, 0.1); border-radius: 12px; padding: 1.5rem;">
                <p style="color: var(--dark-text-secondary); margin-bottom: 1rem;">
                    Once you delete your account, there is no going back. Please be certain.
                </p>
                
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    <button onclick="showExportBeforeDeleteModal()" class="btn-secondary" style="flex: 1; background: var(--dark-accent-primary);">
                        <i class="fas fa-download"></i> Export My Capsules
                    </button>
                    <button onclick="showDeleteAccountModal()" class="delete-user-btn" style="flex: 1; background: #ff6b6b;">
                        <i class="fas fa-trash"></i> Delete Account
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Create and open modal
    const modal = createModal(content, 'My Profile', { size: 'xxlarge' });
    openModal(modal, { size: 'xxlarge' });
    
    // Avatar upload handler
    setTimeout(() => {
        const avatarUpload = document.getElementById('avatar-upload');
        if (avatarUpload) {
            avatarUpload.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    // Check file size (max 2MB)
                    if (file.size > 2 * 1024 * 1024) {
                        showToast('Image too large. Max size is 2MB', 'error');
                        return;
                    }
                    
                    // Check file type
                    if (!file.type.startsWith('image/')) {
                        showToast('Please upload an image file', 'error');
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const avatarImg = document.getElementById('profile-avatar');
                        avatarImg.src = event.target.result;
                        
                        const user = users.find(u => u.id === currentUser.id);
                        if (user) {
                            user.avatar = event.target.result;
                            currentUser.avatar = event.target.result;
                            saveToStorage();
                            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                            showToast('Avatar updated successfully', 'success');
                            
                            // Refresh profile to show delete button
                            setTimeout(() => {
                                closeModal();
                                showUserProfile();
                            }, 1500);
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }, 100);
}

// ==================== Delete Avatar ====================
function deleteAvatar() {
    if (!currentUser) return;
    
    const content = `
        <div style="text-align: center;">
            <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ff6b6b; margin-bottom: 1rem;"></i>
            <h3 style="color: var(--dark-text-primary); margin-bottom: 1rem;">Remove Profile Picture?</h3>
            <p style="color: var(--dark-text-secondary); margin-bottom: 2rem;">
                Are you sure you want to remove your profile picture? This action cannot be undone.
            </p>
            <div class="modal-actions" style="justify-content: center;">
                <button class="cancel-btn" onclick="closeModal()">Cancel</button>
                <button class="confirm-delete-btn" onclick="confirmDeleteAvatar()" style="background: #ff6b6b;">
                    <i class="fas fa-trash"></i> Remove Photo
                </button>
            </div>
        </div>
    `;
    
    const modal = createModal(content, '', { size: 'small', showCloseButton: true });
    openModal(modal, { size: 'small' });
}

function confirmDeleteAvatar() {
    if (!currentUser) return;
    
    const user = users.find(u => u.id === currentUser.id);
    if (user) {
        // Remove avatar
        user.avatar = null;
        currentUser.avatar = null;
        
        // Save changes
        saveToStorage();
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showToast('Profile picture removed', 'success');
        closeModal();
        
        // Refresh profile
        setTimeout(() => {
            showUserProfile();
        }, 500);
    }
}

// ==================== Export Before Delete ====================
function showExportBeforeDeleteModal() {
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
        <div class="admin-modal-content" style="max-width: 500px;">
            <h3><i class="fas fa-download" style="color: #6c5ce7;"></i> Export Your Capsules</h3>
            <p style="margin: 1rem 0; color: var(--dark-text-secondary);">
                Download all your capsules before deleting your account. This will save your memories.
            </p>
            
            <div style="background: var(--dark-bg-primary); border-radius: 10px; padding: 1rem; margin: 1rem 0;">
                <p style="color: var(--dark-text-primary); margin-bottom: 0.5rem;">
                    <i class="fas fa-capsules"></i> Your Capsules: ${capsules.filter(c => c.ownerId === currentUser?.id).length}
                </p>
                <p style="color: var(--dark-text-secondary); font-size: 0.9rem;">
                    Export will download a JSON file with all your capsule data (excluding other users' data).
                </p>
            </div>
            
            <div class="modal-actions" style="justify-content: center; gap: 1rem;">
                <button class="cancel-btn" onclick="this.closest('.admin-modal').remove()">Cancel</button>
                <button class="confirm-delete-btn" onclick="exportUserCapsules()" style="background: #6c5ce7;">
                    <i class="fas fa-download"></i> Export Now
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Export user's capsules (separate from the general export)
function exportUserCapsules() {
    if (!currentUser) return;
    
    const userCapsules = capsules.filter(c => c.ownerId === currentUser.id);
    
    // Create export data with user info and capsules
    const exportData = {
        user: {
            username: currentUser.username,
            id: currentUser.id,
            joinedAt: users.find(u => u.id === currentUser.id)?.createdAt,
            exportDate: new Date().toISOString()
        },
        capsules: userCapsules.map(c => ({
            id: c.id,
            title: c.title,
            description: c.description,
            message: c.message,
            category: c.category,
            tags: c.tags,
            mood: c.mood,
            createdAt: c.createdAt,
            unlockDate: c.unlockDate,
            isLocked: c.isLocked,
            isFavorite: c.isFavorite,
            isArchived: c.isArchived,
            reactions: c.reactions
        }))
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `timecapsule-${currentUser.username}-export-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('Capsules exported successfully!', 'success');
    
    // Close any open modals
    document.querySelectorAll('.admin-modal').forEach(m => m.remove());
}

// ==================== Delete Account ====================
function showDeleteAccountModal() {
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
        <div class="admin-modal-content" style="max-width: 500px;">
            <h3><i class="fas fa-exclamation-triangle" style="color: #ff6b6b;"></i> Delete Account</h3>
            
            <div style="margin: 1.5rem 0;">
                <p style="color: var(--dark-text-secondary); margin-bottom: 1rem;">
                    This action <strong style="color: #ff6b6b;">CANNOT</strong> be undone. This will permanently delete:
                </p>
                <ul style="color: var(--dark-text-secondary); margin-left: 1.5rem; line-height: 1.8;">
                    <li>Your account and profile information</li>
                    <li>All your time capsules (${capsules.filter(c => c.ownerId === currentUser?.id).length} capsules)</li>
                    <li>All your comments and reactions</li>
                    <li>Your friend connections</li>
                </ul>
            </div>
            
            <div style="background: rgba(255, 107, 107, 0.1); border-radius: 10px; padding: 1rem; margin: 1rem 0;">
                <p style="color: var(--dark-text-primary); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-lightbulb"></i> <strong>Before you go:</strong>
                </p>
                <p style="color: var(--dark-text-secondary); font-size: 0.9rem;">
                    You can export your capsules first to keep your memories. Click "Export My Capsules" in the previous screen.
                </p>
            </div>
            
            <div style="margin: 1.5rem 0;">
                <label for="delete-reason" style="display: block; margin-bottom: 0.5rem; color: var(--dark-text-secondary); font-weight: 500;">
                    Why are you leaving? (optional)
                </label>
                <textarea id="delete-reason" placeholder="Tell us why you're deleting your account..." 
                    style="width: 100%; padding: 0.75rem; background: var(--dark-bg-primary); border: 2px solid var(--dark-border); border-radius: 8px; color: var(--dark-text-primary); resize: vertical; min-height: 80px;"></textarea>
            </div>
            
            <div style="margin: 1.5rem 0; padding: 1rem; background: var(--dark-bg-primary); border-radius: 8px;">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="checkbox" id="confirm-delete-checkbox" style="width: 18px; height: 18px;">
                    <span style="color: var(--dark-text-secondary);">
                        I understand that this action is permanent and cannot be undone
                    </span>
                </label>
            </div>
            
            <div class="modal-actions" style="justify-content: space-between;">
                <button class="cancel-btn" onclick="this.closest('.admin-modal').remove()">Cancel</button>
                <button class="confirm-delete-btn" id="final-delete-btn" disabled style="background: #ff6b6b; opacity: 0.5;">
                    <i class="fas fa-trash"></i> Permanently Delete Account
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Enable delete button only when checkbox is checked
    const checkbox = document.getElementById('confirm-delete-checkbox');
    const deleteBtn = document.getElementById('final-delete-btn');
    
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            deleteBtn.disabled = false;
            deleteBtn.style.opacity = '1';
        } else {
            deleteBtn.disabled = true;
            deleteBtn.style.opacity = '0.5';
        }
    });
    
    // Final delete action
    deleteBtn.addEventListener('click', function() {
        if (!checkbox.checked) return;
        
        const reason = document.getElementById('delete-reason').value.trim();
        deleteUserAccount(reason);
        modal.remove();
    });
}

// Actually delete the user account
function deleteUserAccount(reason = '') {
    if (!currentUser) return;
    
    const userId = currentUser.id;
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return;
    
    const deletedUser = users[userIndex];
    
    // Get user's capsules
    const userCapsules = capsules.filter(c => c.ownerId === userId);
    const capsuleCount = userCapsules.length;
    
    // Remove user's capsules
    capsules = capsules.filter(c => c.ownerId !== userId);
    
    // Remove user from friends lists
    friends = friends.filter(f => f.userId1 !== userId && f.userId2 !== userId);
    
    // Remove friend requests
    friendRequests = friendRequests.filter(r => r.fromUserId !== userId && r.toUserId !== userId);
    
    // Create deletion record (for admin reference)
    const deletionRecord = {
        id: generateId(),
        userId: userId,
        username: deletedUser.username,
        reason: reason || 'User self-deleted',
        deletedAt: new Date().toISOString(),
        deletedBy: 'user',
        capsuleCount: capsuleCount,
        accountAge: Math.floor((Date.now() - new Date(deletedUser.createdAt).getTime()) / (1000 * 60 * 60 * 24)) + ' days'
    };
    
    deletedUsers.push(deletionRecord);
    
    // Remove user
    users.splice(userIndex, 1);
    
    // Add to activity log
    activityLog.unshift({
        id: generateId(),
        type: 'user_deleted_self',
        timestamp: new Date().toISOString(),
        details: `User ${deletedUser.username} deleted their own account. Reason: ${reason || 'No reason provided'}`
    });
    
    // Save everything
    saveToStorage();
    
    // Show goodbye message
    showToast('Account deleted successfully. We\'re sorry to see you go!', 'info', 5000);
    
    // Clear current user and redirect to landing page
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    
    setTimeout(() => {
        window.location.href = 'landingpage.html';
    }, 2000);
}

// ==================== Show Deleted Capsule Notifications ====================
function showDeletedCapsuleNotifications() {
    if (!currentUser) return;
    
    // Get deleted capsules for current user
    const userDeletedCapsules = deletedCapsules.filter(dc => dc.ownerId === currentUser.id);
    
    if (userDeletedCapsules.length === 0) {
        showToast('No deleted capsules found', 'info');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'deleted-user-modal';
    modal.innerHTML = `
        <div class="deleted-user-modal-content" style="max-width: 600px;">
            <i class="fas fa-trash-alt" style="font-size: 60px; color: #ff6b6b; margin-bottom: 20px;"></i>
            <h2>Deleted Capsules</h2>
            <p>The following capsules have been removed:</p>
            <div style="max-height: 400px; overflow-y: auto; margin: 20px 0;">
                ${userDeletedCapsules.map(dc => `
                    <div style="
                        background: var(--dark-bg-primary);
                        border-radius: 10px;
                        padding: 15px;
                        margin-bottom: 10px;
                        border-left: 4px solid #ff6b6b;
                    ">
                        <h4 style="color: var(--dark-text-primary); margin-bottom: 5px;">${dc.capsuleTitle}</h4>
                        <p style="color: var(--dark-text-secondary); font-size: 0.9rem; margin-bottom: 8px;">
                            <i class="fas fa-calendar-alt"></i> Deleted: ${new Date(dc.deletedAt).toLocaleString()}
                        </p>
                        <p style="color: var(--dark-text-secondary); font-size: 0.9rem; margin-bottom: 8px;">
                            <i class="fas fa-user-shield"></i> Deleted by: ${dc.deletedByAdmin || dc.deletedBy || 'Unknown'}
                        </p>
                        <div style="
                            background: rgba(255, 107, 107, 0.1);
                            border-radius: 8px;
                            padding: 10px;
                            margin-top: 5px;
                        ">
                            <strong style="color: #ff6b6b;">Reason for deletion:</strong>
                            <p style="color: var(--dark-text-primary); margin-top: 5px;">${dc.reason}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button onclick="this.closest('.deleted-user-modal').remove()" style="
                padding: 12px 30px;
                background: linear-gradient(135deg, #6c5ce7, #a55eea);
                color: white;
                border: none;
                border-radius: 25px;
                font-size: 1rem;
                cursor: pointer;
                width: 100%;
            ">Got it</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ==================== Friend System ====================
function initializeFriendSystem() {
    if (!currentUser) return;
    
    loadFriends();
    renderFriendsSection();
    checkFriendRequests();
}

function loadFriends() {
    const storedFriends = localStorage.getItem('timeCapsule_friends');
    if (storedFriends) {
        friends = JSON.parse(storedFriends);
    }
    
    const storedRequests = localStorage.getItem('timeCapsule_friendRequests');
    if (storedRequests) {
        friendRequests = JSON.parse(storedRequests);
    }
    
    const storedNotifications = localStorage.getItem('timeCapsule_notifications');
    if (storedNotifications) {
        notifications = JSON.parse(storedNotifications);
    }
}

function saveFriends() {
    localStorage.setItem('timeCapsule_friends', JSON.stringify(friends));
    localStorage.setItem('timeCapsule_friendRequests', JSON.stringify(friendRequests));
    localStorage.setItem('timeCapsule_notifications', JSON.stringify(notifications));
}

function renderFriendsSection() {
    const container = document.getElementById('friends-section-container');
    if (!container) return;
    
    const pendingRequests = friendRequests.filter(r => r.toUserId === currentUser.id && r.status === 'pending');
    const sentRequests = friendRequests.filter(r => r.fromUserId === currentUser.id && r.status === 'pending');
    const confirmedFriends = friends.filter(f => f.userId1 === currentUser.id || f.userId2 === currentUser.id);
    
    container.innerHTML = `
        <div class="friends-section">
            <div class="friends-header">
                <h2><i class="fas fa-user-friends"></i> Friends</h2>
                <button class="add-friend-btn" onclick="showAddFriendModal()">
                    <i class="fas fa-user-plus"></i> Add Friend
                </button>
            </div>
            
            <div class="friends-tabs">
                <button class="friend-tab active" onclick="switchFriendTab('friends')">
                    Friends (${confirmedFriends.length})
                </button>
                <button class="friend-tab" onclick="switchFriendTab('requests')">
                    Requests
                    ${pendingRequests.length > 0 ? `<span class="friend-requests-badge">${pendingRequests.length}</span>` : ''}
                </button>
                <button class="friend-tab" onclick="switchFriendTab('sent')">
                    Sent
                    ${sentRequests.length > 0 ? `<span class="friend-requests-badge">${sentRequests.length}</span>` : ''}
                </button>
            </div>
            
            <div id="friends-tab-content" class="friends-list">
                ${renderFriendsTab('friends')}
            </div>
        </div>
    `;
}

function switchFriendTab(tab) {
    const tabs = document.querySelectorAll('.friend-tab');
    tabs.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    const content = document.getElementById('friends-tab-content');
    content.innerHTML = renderFriendsTab(tab);
}

function renderFriendsTab(tab) {
    switch(tab) {
        case 'friends':
            return renderFriendsList();
        case 'requests':
            return renderFriendRequests();
        case 'sent':
            return renderSentRequests();
        default:
            return '';
    }
}

function renderFriendsList() {
    const confirmedFriends = friends.filter(f => f.userId1 === currentUser.id || f.userId2 === currentUser.id);
    
    if (confirmedFriends.length === 0) {
        return '<p style="text-align: center; color: var(--dark-text-muted); padding: 2rem;">No friends yet. Add some friends!</p>';
    }
    
    return confirmedFriends.map(friendship => {
        const friendId = friendship.userId1 === currentUser.id ? friendship.userId2 : friendship.userId1;
        const friend = users.find(u => u.id === friendId);
        if (!friend) return '';
        
        const friendCapsules = capsules.filter(c => c.ownerId === friendId && !c.isArchived);
        const lockedCount = friendCapsules.filter(c => c.isLocked).length;
        const unlockedCount = friendCapsules.filter(c => !c.isLocked).length;
        
        return `
            <div class="friend-card" onclick="viewFriendProfile('${friendId}')">
                <div class="friend-avatar">
                    ${friend.username.charAt(0).toUpperCase()}
                </div>
                <div class="friend-info">
                    <h4>${friend.username}</h4>
                    <p>${friendCapsules.length} capsules • ${lockedCount} locked</p>
                    <span class="friend-status">
                        <i class="fas fa-circle"></i> Online
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

function renderFriendRequests() {
    const pendingRequests = friendRequests.filter(r => r.toUserId === currentUser.id && r.status === 'pending');
    
    if (pendingRequests.length === 0) {
        return '<p style="text-align: center; color: var(--dark-text-muted); padding: 2rem;">No pending friend requests</p>';
    }
    
    return pendingRequests.map(request => {
        const fromUser = users.find(u => u.id === request.fromUserId);
        if (!fromUser) return '';
        
        return `
            <div class="friend-request-card">
                <div class="friend-avatar">
                    ${fromUser.username.charAt(0).toUpperCase()}
                </div>
                <div class="friend-info">
                    <h4>${fromUser.username}</h4>
                    <p>Wants to be your friend</p>
                </div>
                <div class="request-actions">
                    <button class="accept-request-btn" onclick="acceptFriendRequest('${request.id}')">
                        <i class="fas fa-check"></i> Accept
                    </button>
                    <button class="decline-request-btn" onclick="declineFriendRequest('${request.id}')">
                        <i class="fas fa-times"></i> Decline
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderSentRequests() {
    const sentRequests = friendRequests.filter(r => r.fromUserId === currentUser.id && r.status === 'pending');
    
    if (sentRequests.length === 0) {
        return '<p style="text-align: center; color: var(--dark-text-muted); padding: 2rem;">No sent friend requests</p>';
    }
    
    return sentRequests.map(request => {
        const toUser = users.find(u => u.id === request.toUserId);
        if (!toUser) return '';
        
        return `
            <div class="friend-request-card">
                <div class="friend-avatar">
                    ${toUser.username.charAt(0).toUpperCase()}
                </div>
                <div class="friend-info">
                    <h4>${toUser.username}</h4>
                    <p>Request pending</p>
                </div>
                <button class="decline-request-btn" onclick="cancelFriendRequest('${request.id}')">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
        `;
    }).join('');
}

function showAddFriendModal() {
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
        <div class="admin-modal-content" style="max-width: 400px;">
            <h3><i class="fas fa-user-plus"></i> Add Friend</h3>
            <p>Enter the username of the person you want to add:</p>
            <input type="text" id="friend-username" placeholder="Username" style="
                width: 100%;
                padding: 10px;
                margin: 10px 0;
                background: var(--dark-bg-primary);
                border: 2px solid var(--dark-border);
                border-radius: 8px;
                color: var(--dark-text-primary);
            ">
            <div class="modal-actions">
                <button class="cancel-btn">Cancel</button>
                <button class="confirm-delete-btn" onclick="sendFriendRequest()">Send Request</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
        modal.remove();
    });
}

function sendFriendRequest() {
    const username = document.getElementById('friend-username').value;
    const modal = document.querySelector('.admin-modal');
    
    if (!username) {
        showToast('Please enter a username', 'error');
        return;
    }
    
    const friend = users.find(u => u.username === username);
    
    if (!friend) {
        showToast('User not found', 'error');
        return;
    }
    
    if (friend.id === currentUser.id) {
        showToast('You cannot add yourself as a friend', 'error');
        return;
    }
    
    // Check if already friends
    const alreadyFriends = friends.some(f => 
        (f.userId1 === currentUser.id && f.userId2 === friend.id) ||
        (f.userId1 === friend.id && f.userId2 === currentUser.id)
    );
    
    if (alreadyFriends) {
        showToast('You are already friends with this user', 'error');
        modal?.remove();
        return;
    }
    
    // Check if request already exists
    const existingRequest = friendRequests.find(r => 
        (r.fromUserId === currentUser.id && r.toUserId === friend.id && r.status === 'pending') ||
        (r.fromUserId === friend.id && r.toUserId === currentUser.id && r.status === 'pending')
    );
    
    if (existingRequest) {
        showToast('A friend request already exists', 'error');
        modal?.remove();
        return;
    }
    
    const request = {
        id: generateId(),
        fromUserId: currentUser.id,
        fromUsername: currentUser.username,
        toUserId: friend.id,
        toUsername: friend.username,
        status: 'pending',
        timestamp: new Date().toISOString()
    };
    
    friendRequests.push(request);
    
    // Add notification for the recipient
    notifications.push({
        id: generateId(),
        userId: friend.id,
        type: 'friend_request',
        message: `${currentUser.username} sent you a friend request`,
        requestId: request.id,
        read: false,
        timestamp: new Date().toISOString()
    });
    
    saveFriends();
    showToast(`Friend request sent to ${username}`, 'success');
    modal?.remove();
    renderFriendsSection();
}

function acceptFriendRequest(requestId) {
    const request = friendRequests.find(r => r.id === requestId);
    if (!request) return;
    
    request.status = 'accepted';
    
    // Create friendship
    friends.push({
        id: generateId(),
        userId1: request.fromUserId,
        userId2: request.toUserId,
        since: new Date().toISOString()
    });
    
    // Add notification for the sender
    notifications.push({
        id: generateId(),
        userId: request.fromUserId,
        type: 'friend_accepted',
        message: `${currentUser.username} accepted your friend request`,
        read: false,
        timestamp: new Date().toISOString()
    });
    
    saveFriends();
    showToast(`You are now friends with ${request.fromUsername}`, 'success');
    renderFriendsSection();
}

function declineFriendRequest(requestId) {
    const request = friendRequests.find(r => r.id === requestId);
    if (!request) return;
    
    request.status = 'declined';
    
    // Add notification for the sender
    notifications.push({
        id: generateId(),
        userId: request.fromUserId,
        type: 'friend_declined',
        message: `${currentUser.username} declined your friend request`,
        read: false,
        timestamp: new Date().toISOString()
    });
    
    saveFriends();
    showToast('Friend request declined', 'info');
    renderFriendsSection();
}

function cancelFriendRequest(requestId) {
    const index = friendRequests.findIndex(r => r.id === requestId);
    if (index !== -1) {
        friendRequests.splice(index, 1);
        saveFriends();
        showToast('Friend request cancelled', 'info');
        renderFriendsSection();
    }
}

function viewFriendProfile(friendId) {
    const friend = users.find(u => u.id === friendId);
    if (!friend) return;
    
    // Get friend's capsules (but not the actual messages)
    const friendCapsules = capsules.filter(c => c.ownerId === friendId && !c.isArchived);
    
    const modal = document.createElement('div');
    modal.className = 'friend-profile-modal';
    modal.innerHTML = `
        <div class="friend-profile-content">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2><i class="fas fa-user-circle"></i> ${friend.username}'s Profile</h2>
                <button onclick="this.closest('.friend-profile-modal').remove()" style="
                    background: none;
                    border: none;
                    color: var(--dark-text-muted);
                    font-size: 2rem;
                    cursor: pointer;
                ">&times;</button>
            </div>
            
            <div class="friend-profile-header">
                <div class="friend-profile-avatar">
                    ${friend.username.charAt(0).toUpperCase()}
                </div>
                <div class="friend-profile-info">
                    <h2>${friend.username}</h2>
                    <p>Member since: ${new Date(friend.createdAt).toLocaleDateString()}</p>
                    <p>Total Capsules: ${friendCapsules.length}</p>
                </div>
            </div>
            
            <h3 style="margin-bottom: 1rem; color: var(--dark-text-primary);">
                <i class="fas fa-capsules"></i> ${friend.username}'s Capsules
            </h3>
            
            <div class="friend-capsules-grid">
                ${friendCapsules.length === 0 ? 
                    '<p style="color: var(--dark-text-muted);">No capsules yet</p>' :
                    friendCapsules.map(capsule => `
                        <div class="friend-capsule-card">
                            <h4>${capsule.title}</h4>
                            <p>${capsule.description || 'No description'}</p>
                            <div class="friend-capsule-meta">
                                <span>
                                    <i class="fas fa-calendar"></i> 
                                    ${new Date(capsule.createdAt).toLocaleDateString()}
                                </span>
                                <span class="${capsule.isLocked ? 'friend-capsule-locked' : 'friend-capsule-unlocked'}">
                                    <i class="fas fa-${capsule.isLocked ? 'lock' : 'unlock'}"></i>
                                    ${capsule.isLocked ? 'Locked' : 'Unlocked'}
                                </span>
                            </div>
                            ${capsule.tags ? `
                                <div style="margin-top: 0.5rem;">
                                    ${capsule.tags.map(tag => `
                                        <span class="tag" style="font-size: 0.7rem;">#${tag}</span>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')
                }
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function checkFriendRequests() {
    const pendingCount = friendRequests.filter(r => r.toUserId === currentUser?.id && r.status === 'pending').length;
    
    // Update notification badge in nav if exists
    const friendTab = document.querySelector('.friend-tab:nth-child(2)');
    if (friendTab && pendingCount > 0) {
        let badge = friendTab.querySelector('.friend-requests-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'friend-requests-badge';
            friendTab.appendChild(badge);
        }
        badge.textContent = pendingCount;
    }
}

// ==================== Drafts and Reminders ====================
function deleteDraft() {
    localStorage.removeItem('timeCapsule_drafts');
    showToast('Draft deleted', 'success');
    
    const overlay = document.querySelector('.profile-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
            showUserProfile();
        }, 300);
    }
}

function loadDraft() {
    if (!currentUser) return;
    
    const drafts = JSON.parse(localStorage.getItem('timeCapsule_drafts') || '[]');
    const draft = drafts.find(d => d.userId === currentUser.id);
    
    if (draft) {
        if (confirm('You have a saved draft. Load it?')) {
            // Check if we're on the homepage with the form
            const titleInput = document.getElementById('title');
            const descriptionInput = document.getElementById('description');
            const messageInput = document.getElementById('message');
            const categorySelect = document.getElementById('category');
            const unlockDateInput = document.getElementById('unlock-date');
            const moodSelect = document.getElementById('mood');
            
            if (titleInput) titleInput.value = draft.title || '';
            if (descriptionInput) descriptionInput.value = draft.description || '';
            if (messageInput) messageInput.value = draft.message || '';
            if (categorySelect) categorySelect.value = draft.category || 'personal';
            if (unlockDateInput) unlockDateInput.value = draft.unlockDate || '';
            if (moodSelect) moodSelect.value = draft.mood || 'happy';
            
            showToast('Draft loaded', 'info');
        }
    }
}

function showAddReminderModal() {
    const userCapsules = capsules.filter(c => c.ownerId === currentUser?.id);
    
    const modal = document.createElement('div');
    modal.className = 'reminder-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 12000;
    `;
    
    modal.innerHTML = `
        <div style="
            background: var(--dark-card-bg);
            padding: 30px;
            border-radius: 20px;
            max-width: 400px;
            width: 90%;
            border: 2px solid var(--dark-accent-primary);
        ">
            <h3 style="color: var(--dark-text-primary); margin-bottom: 20px;">Set Reminder</h3>
            <select id="reminder-capsule" style="
                width: 100%;
                padding: 10px;
                margin-bottom: 15px;
                background: var(--dark-bg-primary);
                border: 1px solid var(--dark-border);
                color: var(--dark-text-primary);
                border-radius: 8px;
            ">
                <option value="">Select a capsule</option>
                ${userCapsules.map(c => `<option value="${c.id}">${c.title}</option>`).join('')}
            </select>
            <input type="datetime-local" id="reminder-time" style="
                width: 100%;
                padding: 10px;
                margin-bottom: 20px;
                background: var(--dark-bg-primary);
                border: 1px solid var(--dark-border);
                color: var(--dark-text-primary);
                border-radius: 8px;
            ">
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="this.closest('.reminder-modal').remove()" style="
                    padding: 8px 20px;
                    background: var(--dark-bg-primary);
                    color: var(--dark-text-primary);
                    border: 1px solid var(--dark-border);
                    border-radius: 8px;
                    cursor: pointer;
                ">Cancel</button>
                <button onclick="saveReminderFromPopup(this)" style="
                    padding: 8px 20px;
                    background: var(--dark-accent-primary);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                ">Save</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function saveReminderFromPopup(btn) {
    const modal = btn.closest('.reminder-modal');
    const capsuleId = document.getElementById('reminder-capsule')?.value;
    const time = document.getElementById('reminder-time')?.value;
    
    if (!capsuleId || !time) {
        showToast('Please select a capsule and time', 'error');
        return;
    }
    
    const capsule = capsules.find(c => c.id === capsuleId);
    
    const reminders = JSON.parse(localStorage.getItem('timeCapsule_reminders') || '[]');
    reminders.push({
        id: generateId(),
        userId: currentUser.id,
        capsuleId: capsuleId,
        capsuleTitle: capsule.title,
        time: new Date(time).toISOString()
    });
    
    localStorage.setItem('timeCapsule_reminders', JSON.stringify(reminders));
    
    modal.remove();
    
    const overlay = document.querySelector('.profile-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
            showUserProfile();
        }, 300);
    }
    
    showToast('Reminder set successfully', 'success');
}

function deleteReminder(reminderId) {
    const reminders = JSON.parse(localStorage.getItem('timeCapsule_reminders') || '[]');
    const newReminders = reminders.filter(r => r.id !== reminderId);
    localStorage.setItem('timeCapsule_reminders', JSON.stringify(newReminders));
    
    showToast('Reminder deleted', 'success');
    
    const overlay = document.querySelector('.profile-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
            showUserProfile();
        }, 300);
    }
}

function checkReminders() {
    const reminders = JSON.parse(localStorage.getItem('timeCapsule_reminders') || '[]');
    const now = new Date().getTime();
    
    reminders.forEach(reminder => {
        const reminderTime = new Date(reminder.time).getTime();
        if (reminderTime <= now && reminder.userId === currentUser?.id) {
            showToast(`🔔 Reminder: ${reminder.capsuleTitle}`, 'info', 10000);
            
            const newReminders = reminders.filter(r => r.id !== reminder.id);
            localStorage.setItem('timeCapsule_reminders', JSON.stringify(newReminders));
        }
    });
}

// Export functions
window.showUserProfile = showUserProfile;
window.initializeFriendSystem = initializeFriendSystem;
window.viewFriendProfile = viewFriendProfile;
window.acceptFriendRequest = acceptFriendRequest;
window.declineFriendRequest = declineFriendRequest;
window.cancelFriendRequest = cancelFriendRequest;
window.sendFriendRequest = sendFriendRequest;
window.showAddFriendModal = showAddFriendModal;
window.switchFriendTab = switchFriendTab;
window.deleteDraft = deleteDraft;
window.showAddReminderModal = showAddReminderModal;
window.saveReminderFromPopup = saveReminderFromPopup;
window.deleteReminder = deleteReminder;
window.loadDraft = loadDraft;
window.deleteAvatar = deleteAvatar;
window.confirmDeleteAvatar = confirmDeleteAvatar;
window.getUserAvatar = getUserAvatar;
window.showDeletedCapsuleNotifications = showDeletedCapsuleNotifications;
window.showDeleteAccountModal = showDeleteAccountModal;
window.showExportBeforeDeleteModal = showExportBeforeDeleteModal;
window.exportUserCapsules = exportUserCapsules;
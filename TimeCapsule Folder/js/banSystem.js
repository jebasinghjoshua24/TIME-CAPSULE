// banSystem.js - Complete Ban/Unban functionality

// ==================== Ban Status Helper ====================
function getBanStatusText(user) {
    if (!user || !user.isBanned) return null;
    
    if (!user.banExpiresAt) {
        return {
            text: 'Permanently Banned',
            color: '#ff6b6b',
            icon: 'fa-ban'
        };
    }
    
    const expiryDate = new Date(user.banExpiresAt);
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60));
    
    if (daysLeft > 0) {
        return {
            text: `Banned (${daysLeft} day${daysLeft > 1 ? 's' : ''} left)`,
            color: '#ffa502',
            icon: 'fa-clock'
        };
    } else {
        return {
            text: `Banned (${hoursLeft} hour${hoursLeft > 1 ? 's' : ''} left)`,
            color: '#ffa502',
            icon: 'fa-clock'
        };
    }
}

// ==================== Format Ban Duration ====================
function formatBanDuration(hours) {
    if (hours === 'permanent') return 'Permanent';
    if (hours === 1) return '1 hour';
    if (hours === 24) return '1 day';
    if (hours === 168) return '7 days';
    if (hours === 720) return '30 days';
    return `${hours} hours`;
}

// ==================== Ban User Modal ====================
function showBanUserModal(userId, username) {
    console.log('showBanUserModal called for:', username);
    
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
        <div class="admin-modal-content" style="max-width: 500px;">
            <h3><i class="fas fa-gavel" style="color: #ff6b6b;"></i> Ban User: ${username}</h3>
            
            <div style="margin: 20px 0;">
                <label style="display: block; margin-bottom: 10px; color: var(--dark-text-secondary);">
                    <strong>Ban Duration:</strong>
                </label>
                
                <select id="ban-duration" style="
                    width: 100%;
                    padding: 10px;
                    margin-bottom: 15px;
                    background: var(--dark-bg-primary);
                    border: 2px solid var(--dark-border);
                    border-radius: 8px;
                    color: var(--dark-text-primary);
                ">
                    <option value="1">1 Hour</option>
                    <option value="24">24 Hours (1 Day)</option>
                    <option value="168">7 Days (1 Week)</option>
                    <option value="720">30 Days (1 Month)</option>
                    <option value="permanent">Permanent</option>
                </select>
                
                <label style="display: block; margin-bottom: 10px; color: var(--dark-text-secondary);">
                    <strong>Ban Reason:</strong>
                </label>
                <textarea id="ban-reason" placeholder="Enter reason for ban..." rows="3" style="
                    width: 100%;
                    padding: 10px;
                    background: var(--dark-bg-primary);
                    border: 2px solid var(--dark-border);
                    border-radius: 8px;
                    color: var(--dark-text-primary);
                    margin-bottom: 15px;
                    resize: vertical;
                "></textarea>
                
                <div style="background: rgba(255, 107, 107, 0.1); padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                    <p style="color: var(--dark-text-secondary); font-size: 0.9rem;">
                        <i class="fas fa-info-circle" style="color: #ff6b6b;"></i>
                        Banned users cannot log in or access their capsules until the ban expires.
                    </p>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="cancel-btn">Cancel</button>
                <button class="confirm-delete-btn" id="confirm-ban" style="background: #ff6b6b;">
                    <i class="fas fa-gavel"></i> Ban User
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.querySelector('#confirm-ban').addEventListener('click', () => {
        const duration = document.getElementById('ban-duration').value;
        const reason = document.getElementById('ban-reason').value.trim();
        
        if (!reason) {
            if (typeof showToast === 'function') {
                showToast('Please provide a reason for the ban', 'error');
            } else {
                alert('Please provide a reason for the ban');
            }
            return;
        }
        
        banUser(userId, duration, reason);
        modal.remove();
        
        // Refresh admin panel
        const adminPanel = document.querySelector('.admin-panel');
        if (adminPanel) {
            adminPanel.remove();
            if (typeof showAdminDashboard === 'function') {
                showAdminDashboard();
            }
        }
    });
}

// ==================== Unban User Modal ====================
function showUnbanUserModal(userId, username) {
    console.log('showUnbanUserModal called for:', username);
    
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
        <div class="admin-modal-content" style="max-width: 500px;">
            <h3><i class="fas fa-check-circle" style="color: #1dd1a1;"></i> Unban User: ${username}</h3>
            
            <div style="margin: 20px 0;">
                <p style="color: var(--dark-text-secondary); margin-bottom: 15px;">
                    Are you sure you want to unban this user? They will be able to log in and access their capsules again.
                </p>
                
                <label style="display: block; margin-bottom: 10px; color: var(--dark-text-secondary);">
                    <strong>Unban Reason (optional):</strong>
                </label>
                <textarea id="unban-reason" placeholder="Enter reason for unban..." rows="2" style="
                    width: 100%;
                    padding: 10px;
                    background: var(--dark-bg-primary);
                    border: 2px solid var(--dark-border);
                    border-radius: 8px;
                    color: var(--dark-text-primary);
                    margin-bottom: 15px;
                    resize: vertical;
                "></textarea>
            </div>
            
            <div class="modal-actions">
                <button class="cancel-btn">Cancel</button>
                <button class="confirm-delete-btn" id="confirm-unban" style="background: #1dd1a1;">
                    <i class="fas fa-check-circle"></i> Unban User
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.querySelector('#confirm-unban').addEventListener('click', () => {
        const reason = document.getElementById('unban-reason').value.trim() || 'No reason provided';
        unbanUser(userId, reason);
        modal.remove();
        
        // Refresh admin panel
        const adminPanel = document.querySelector('.admin-panel');
        if (adminPanel) {
            adminPanel.remove();
            if (typeof showAdminDashboard === 'function') {
                showAdminDashboard();
            }
        }
    });
}

// ==================== Ban User Logic ====================
function banUser(userId, duration, reason) {
    console.log('banUser called:', { userId, duration, reason });
    
    // Find user
    const userIndex = typeof users !== 'undefined' ? users.findIndex(u => u.id === userId) : -1;
    if (userIndex === -1) {
        console.error('User not found:', userId);
        return;
    }
    
    const user = users[userIndex];
    
    // Calculate ban expiration
    let expiresAt = null;
    let durationText = '';
    
    if (duration === 'permanent') {
        expiresAt = null;
        durationText = 'Permanent';
    } else {
        const hours = parseInt(duration);
        expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
        durationText = formatBanDuration(hours);
    }
    
    // Store ban history
    const banRecord = {
        id: typeof generateId === 'function' ? generateId() : Date.now().toString(),
        bannedAt: new Date().toISOString(),
        bannedBy: typeof currentUser !== 'undefined' && currentUser ? currentUser.username : 'admin',
        bannedById: typeof currentUser !== 'undefined' && currentUser ? currentUser.id : null,
        reason: reason,
        duration: duration === 'permanent' ? 'permanent' : parseInt(duration),
        expiresAt: expiresAt,
        active: true
    };
    
    // Update user
    users[userIndex] = {
        ...user,
        isBanned: true,
        banExpiresAt: expiresAt,
        banReason: reason,
        banCount: (user.banCount || 0) + 1,
        previousBans: [...(user.previousBans || []), banRecord]
    };
    
    // Add to activity log
    if (typeof activityLog !== 'undefined' && typeof generateId === 'function') {
        activityLog.unshift({
            id: generateId(),
            type: 'user_banned',
            timestamp: new Date().toISOString(),
            details: `User ${user.username} was banned by ${currentUser?.username || 'admin'}. Reason: ${reason}. Duration: ${durationText}`
        });
    }
    
    // Create notification for user
    if (typeof notifications !== 'undefined' && typeof generateId === 'function') {
        notifications.push({
            id: generateId(),
            userId: user.id,
            type: 'account_banned',
            message: `Your account has been banned. Reason: ${reason}. Duration: ${durationText}`,
            data: {
                reason,
                duration: durationText,
                expiresAt,
                bannedBy: currentUser?.username || 'admin'
            },
            read: false,
            timestamp: new Date().toISOString()
        });
    }
    
    if (typeof saveToStorage === 'function') {
        saveToStorage();
    }
    
    if (typeof showToast === 'function') {
        showToast(`User ${user.username} has been banned`, 'success');
    }
}

// ==================== Unban User Logic ====================
function unbanUser(userId, reason) {
    console.log('unbanUser called:', { userId, reason });
    
    const userIndex = typeof users !== 'undefined' ? users.findIndex(u => u.id === userId) : -1;
    if (userIndex === -1) {
        console.error('User not found:', userId);
        return;
    }
    
    const user = users[userIndex];
    
    // Update the most recent ban record
    const previousBans = user.previousBans || [];
    if (previousBans.length > 0) {
        const lastBan = previousBans[previousBans.length - 1];
        lastBan.active = false;
        lastBan.unbannedAt = new Date().toISOString();
        lastBan.unbannedBy = typeof currentUser !== 'undefined' && currentUser ? currentUser.username : 'admin';
        lastBan.unbanReason = reason;
    }
    
    // Update user
    users[userIndex] = {
        ...user,
        isBanned: false,
        banExpiresAt: null,
        banReason: null,
        previousBans: previousBans
    };
    
    // Add to activity log
    if (typeof activityLog !== 'undefined' && typeof generateId === 'function') {
        activityLog.unshift({
            id: generateId(),
            type: 'user_unbanned',
            timestamp: new Date().toISOString(),
            details: `User ${user.username} was unbanned by ${currentUser?.username || 'admin'}. Reason: ${reason}`
        });
    }
    
    // Create notification for user
    if (typeof notifications !== 'undefined' && typeof generateId === 'function') {
        notifications.push({
            id: generateId(),
            userId: user.id,
            type: 'account_unbanned',
            message: `Your account has been unbanned. Reason: ${reason}`,
            data: {
                reason,
                unbannedBy: currentUser?.username || 'admin'
            },
            read: false,
            timestamp: new Date().toISOString()
        });
    }
    
    if (typeof saveToStorage === 'function') {
        saveToStorage();
    }
    
    if (typeof showToast === 'function') {
        showToast(`User ${user.username} has been unbanned`, 'success');
    }
}

// ==================== Check Ban Status ====================
function checkBanStatus(user) {
    if (!user || !user.isBanned) return { allowed: true };
    
    // Check if ban expired
    if (user.banExpiresAt) {
        const expiryDate = new Date(user.banExpiresAt);
        const now = new Date();
        
        if (now > expiryDate) {
            // Auto-unban - ban expired
            autoUnbanUser(user.id);
            return { allowed: true, autoUnbanned: true };
        }
    }
    
    // User is still banned
    return {
        allowed: false,
        reason: user.banReason,
        expiresAt: user.banExpiresAt,
        permanent: !user.banExpiresAt
    };
}

// ==================== Auto-Unban User ====================
function autoUnbanUser(userId) {
    const userIndex = typeof users !== 'undefined' ? users.findIndex(u => u.id === userId) : -1;
    if (userIndex === -1) return;
    
    const user = users[userIndex];
    
    // Update ban record
    const previousBans = user.previousBans || [];
    if (previousBans.length > 0) {
        const lastBan = previousBans[previousBans.length - 1];
        lastBan.active = false;
        lastBan.unbannedAt = new Date().toISOString();
        lastBan.unbannedBy = 'system';
        lastBan.unbanReason = 'Ban expired automatically';
    }
    
    // Update user
    users[userIndex] = {
        ...user,
        isBanned: false,
        banExpiresAt: null,
        banReason: null,
        previousBans: previousBans
    };
    
    // Add to activity log
    if (typeof activityLog !== 'undefined' && typeof generateId === 'function') {
        activityLog.unshift({
            id: generateId(),
            type: 'user_auto_unbanned',
            timestamp: new Date().toISOString(),
            details: `User ${user.username} was automatically unbanned (ban expired)`
        });
    }
    
    if (typeof saveToStorage === 'function') {
        saveToStorage();
    }
}

// ==================== Show Banned Account Modal ====================
function showBannedAccountModal(user, banCheck) {
    const modal = document.createElement('div');
    modal.className = 'deleted-user-modal';
    modal.innerHTML = `
        <div class="deleted-user-modal-content" style="max-width: 500px;">
            <i class="fas fa-ban" style="font-size: 60px; color: #ff6b6b; margin-bottom: 20px;"></i>
            <h2 style="color: #ff6b6b;">Account Banned</h2>
            <p>Your account "${user.username}" has been banned.</p>
            
            <div class="deletion-info" style="text-align: left;">
                <h3>Ban Details:</h3>
                <p><strong>Reason:</strong> ${banCheck.reason}</p>
                ${banCheck.permanent ? 
                    '<p><strong>Duration:</strong> Permanent</p>' : 
                    `<p><strong>Expires:</strong> ${new Date(banCheck.expiresAt).toLocaleString()}</p>
                     <p><strong>Time remaining:</strong> ${formatTimeRemaining ? formatTimeRemaining(new Date(banCheck.expiresAt).getTime() - Date.now()) : ''}</p>`
                }
                <p><strong>Banned on:</strong> ${new Date(user.previousBans?.[user.previousBans.length - 1]?.bannedAt).toLocaleString()}</p>
            </div>
            
            ${!banCheck.permanent ? `
                <p style="color: var(--dark-accent-warning); margin: 15px 0;">
                    <i class="fas fa-clock"></i> You will be automatically unbanned when the ban expires.
                </p>
            ` : ''}
            
            <p class="deletion-message">If you believe this is a mistake, please contact support.</p>
            <button onclick="this.closest('.deleted-user-modal').remove()" style="
                padding: 12px 30px;
                background: linear-gradient(135deg, #6c5ce7, #a55eea);
                color: white;
                border: none;
                border-radius: 25px;
                font-size: 1rem;
                cursor: pointer;
                width: 100%;
            ">I Understand</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ==================== Start Ban Checker ====================
function startBanChecker() {
    setInterval(() => {
        let needsUpdate = false;
        
        if (typeof users !== 'undefined') {
            users.forEach(user => {
                if (user.isBanned && user.banExpiresAt) {
                    const expiryDate = new Date(user.banExpiresAt);
                    const now = new Date();
                    
                    if (now > expiryDate) {
                        autoUnbanUser(user.id);
                        needsUpdate = true;
                    }
                }
            });
        }
        
        if (needsUpdate && typeof saveToStorage === 'function') {
            saveToStorage();
            // Refresh admin panel if open
            const adminPanel = document.querySelector('.admin-panel');
            if (adminPanel) {
                adminPanel.remove();
                if (typeof showAdminDashboard === 'function') {
                    showAdminDashboard();
                }
            }
        }
    }, 60000); // Check every minute
}

// ==================== Export all functions to global scope ====================
window.getBanStatusText = getBanStatusText;
window.formatBanDuration = formatBanDuration;
window.showBanUserModal = showBanUserModal;
window.showUnbanUserModal = showUnbanUserModal;
window.banUser = banUser;
window.unbanUser = unbanUser;
window.checkBanStatus = checkBanStatus;
window.autoUnbanUser = autoUnbanUser;
window.showBannedAccountModal = showBannedAccountModal;
window.startBanChecker = startBanChecker;

console.log('✅ banSystem.js loaded with all functions');
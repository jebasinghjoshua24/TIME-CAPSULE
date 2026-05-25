// admin.js - Admin dashboard and investigation

// ==================== Admin Access ====================
function checkAdminAccess() {
    return currentUser && currentUser.isAdmin;
}

function addAdminButton() {
    if (!currentUser || !currentUser.isAdmin) return;
    
    const path = window.location.pathname;
    const filename = path.split('/').pop() || path;
    if (filename !== 'Homepage.html') return;
    
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && !document.getElementById('admin-dashboard-btn')) {
        const adminBtn = document.createElement('button');
        adminBtn.id = 'admin-dashboard-btn';
        adminBtn.className = 'admin-btn';
        adminBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Admin';
        adminBtn.addEventListener('click', showAdminDashboard);
        navLinks.appendChild(adminBtn);
        
        const investBtn = document.createElement('button');
        investBtn.id = 'investigation-btn';
        investBtn.className = 'admin-btn';
        investBtn.innerHTML = '<i class="fas fa-search"></i> Investigate';
        investBtn.style.background = 'linear-gradient(135deg, #ff6b6b, #c92a2a)';
        investBtn.addEventListener('click', showInvestigationPanel);
        navLinks.appendChild(investBtn);
    }
}

// Add this function to admin.js (around line 400-450, before renderUsersList)

// ==================== Render Ban History ====================
function renderBanHistory() {
    const formatDuration = typeof window.formatBanDuration === 'function' 
        ? window.formatBanDuration 
        : (hours) => {
            if (hours === 'permanent') return 'Permanent';
            if (hours === 1) return '1 hour';
            if (hours === 24) return '1 day';
            if (hours === 168) return '7 days';
            if (hours === 720) return '30 days';
            return `${hours} hours`;
        };
    
    const allBans = (users || []).flatMap(user => 
        (user.previousBans || []).map(ban => ({
            ...ban,
            username: user.username,
            userId: user.id
        }))
    ).sort((a, b) => new Date(b.bannedAt) - new Date(a.bannedAt));
    
    if (allBans.length === 0) {
        return '<div style="text-align: center; color: var(--dark-text-muted); padding: 3rem;">No ban history</div>';
    }
    
    return allBans.map(ban => `
        <div class="user-card" style="flex-direction: column; align-items: flex-start; border-left: 4px solid ${ban.active ? '#ff6b6b' : '#1dd1a1'};">
            <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <i class="fas ${ban.active ? 'fa-ban' : 'fa-check-circle'}" 
                       style="color: ${ban.active ? '#ff6b6b' : '#1dd1a1'}; font-size: 1.5rem;"></i>
                    <h3 style="color: var(--dark-text-primary); margin: 0;">${ban.username}</h3>
                </div>
                <span class="user-badge" style="background: ${ban.active ? '#ff6b6b' : '#1dd1a1'}; color: white;">
                    ${ban.active ? 'ACTIVE' : 'INACTIVE'}
                </span>
            </div>
            
            <div class="user-stats" style="width: 100%; margin-bottom: 1rem;">
                <div class="user-stat">
                    <span class="stat-label">BANNED AT</span>
                    <span class="stat-value">${new Date(ban.bannedAt).toLocaleString()}</span>
                </div>
                <div class="user-stat">
                    <span class="stat-label">BANNED BY</span>
                    <span class="stat-value">${ban.bannedBy}</span>
                </div>
                <div class="user-stat">
                    <span class="stat-label">DURATION</span>
                    <span class="stat-value">${ban.duration === 'permanent' ? 'Permanent' : formatDuration(ban.duration)}</span>
                </div>
            </div>
            
            <div style="background: var(--dark-bg-primary); padding: 1rem; border-radius: 8px; width: 100%;">
                <p style="color: var(--dark-text-secondary); margin-bottom: 0.5rem;"><strong>Reason:</strong> ${ban.reason}</p>
                ${ban.unbannedAt ? `
                    <p style="color: var(--dark-text-secondary);"><strong>Unbanned:</strong> ${new Date(ban.unbannedAt).toLocaleString()} by ${ban.unbannedBy}</p>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// ==================== Admin Dashboard ====================
// admin.js - Update showAdminDashboard to use modal system

// admin.js - Updated Admin Dashboard with CSS classes

function showAdminDashboard() {
    if (!checkAdminAccess()) return;
    
    const content = `
        <div class="admin-panel-simple">
            <!-- Header -->
            <div class="admin-header">
                <h2>
                    <i class="fas fa-shield-alt"></i>
                    Admin Dashboard
                </h2>
            </div>
            
            <!-- Stats Grid -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${users?.length || 0}</div>
                        <div class="stat-label">TOTAL USERS</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-capsules"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${capsules?.length || 0}</div>
                        <div class="stat-label">TOTAL CAPSULES</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-trash-alt"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${deletedUsers?.length || 0}</div>
                        <div class="stat-label">DELETED USERS</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${capsules?.filter(c => c?.isLocked).length || 0}</div>
                        <div class="stat-label">LOCKED</div>
                    </div>
                </div>
            </div>
            
            <!-- Tabs -->
            <div class="tabs-container">
                <div class="tabs">
                    <button class="tab active" onclick="switchSimpleTab('users')">Users</button>
                    <button class="tab" onclick="switchSimpleTab('capsules')">All Capsules</button>
                    <button class="tab" onclick="switchSimpleTab('bans')">Ban History</button>
                    <button class="tab" onclick="switchSimpleTab('deleted')">Deleted Users</button>
                    <button class="tab" onclick="switchSimpleTab('activity')">System Activity</button>
                    <button class="tab" onclick="switchSimpleTab('backups')">Backups</button>
                </div>
            </div>
            
            <!-- Search -->
            <div class="search-container">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" id="simple-user-search" placeholder="Search users by username or ID...">
                </div>
            </div>
            
            <!-- Content -->
            <div id="simple-content-area" class="content-area">
                ${renderSimpleUsersList()}
            </div>
        </div>
    `;
    
    const modal = createModal(content, '', { 
        size: 'xxlarge', 
        showCloseButton: true,
        modalClass: 'admin-panel-modal'
    });
    
    openModal(modal, { size: 'xxlarge' });
    
    // Search functionality
    setTimeout(() => {
        const searchInput = document.getElementById('simple-user-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const filtered = users.filter(u => 
                    u.username.toLowerCase().includes(searchTerm) || 
                    u.id.toLowerCase().includes(searchTerm)
                );
                document.getElementById('simple-content-area').innerHTML = renderSimpleUsersList(filtered);
            });
        }
    }, 200);
}

// Simple tab switching
function switchSimpleTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    const content = document.getElementById('simple-content-area');
    
    switch(tab) {
        case 'users':
            content.innerHTML = renderSimpleUsersList();
            break;
        case 'capsules':
            content.innerHTML = renderAllCapsules();  // Using the updated function
            break;
        case 'bans':
            content.innerHTML = renderBanHistory();   // Using the updated function
            break;
        case 'deleted':
            content.innerHTML = renderDeletedUsers();  // Using the updated function
            break;
        case 'activity':
            content.innerHTML = renderAdminActivityLog();  // Using the updated function
            break;
        case 'backups':
            content.innerHTML = renderBackupList();  // Using the updated function
            break;
    }
}

// Simple user list renderer
function renderSimpleUsersList(filteredUsers = null) {
    const userList = filteredUsers || users || [];
    
    if (userList.length === 0) {
        return '<p style="text-align: center; color: var(--dark-text-muted); padding: 2rem;">No users found</p>';
    }
    
    return userList.map(user => {
        const isBanned = user.isBanned;
        const banStatus = typeof window.getBanStatusText === 'function' ? window.getBanStatusText(user) : null;
        
        return `
        <div class="user-card">
            <div class="user-info">
                <div class="user-avatar ${user.isAdmin ? 'admin' : ''}">
                    <i class="fas ${user.isAdmin ? 'fa-crown' : 'fa-user-circle'}"></i>
                </div>
                
                <div class="user-details">
                    <div class="user-header">
                        <span class="user-name">${user.username} ${user.isAdmin ? '(Admin)' : ''}</span>
                        ${isBanned ? `<span class="user-badge banned">BANNED</span>` : ''}
                    </div>
                    
                    <div class="user-stats">
                        <div class="user-stat">
                            <span class="stat-label">USER ID</span>
                            <span class="stat-value">${user.id.substring(0, 8)}...</span>
                        </div>
                        <div class="user-stat">
                            <span class="stat-label">JOINED</span>
                            <span class="stat-value">${new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div class="user-stat">
                            <span class="stat-label">CAPSULES</span>
                            <span class="stat-value">${capsules?.filter(c => c.ownerId === user.id).length || 0}</span>
                        </div>
                    </div>
                    
                    ${user.banReason ? `<div style="color: #ff6b6b; font-size: 0.8rem; margin-top: 0.5rem;">⚠️ ${user.banReason}</div>` : ''}
                </div>
            </div>
            
            <div class="user-actions">
                ${!user.isAdmin ? `
                    ${isBanned ? 
                        `<button class="action-btn unban-btn" onclick="showUnbanUserModal('${user.id}', '${user.username}')"><i class="fas fa-check-circle"></i> Unban</button>` :
                        `<button class="action-btn ban-btn" onclick="showBanUserModal('${user.id}', '${user.username}')"><i class="fas fa-gavel"></i> Ban</button>`
                    }
                    <button class="action-btn delete-btn" onclick="showDeleteUserModal('${user.id}', '${user.username}')"><i class="fas fa-trash"></i> Delete</button>
                ` : `
                    <div class="admin-protected"><i class="fas fa-crown"></i> Admin</div>
                `}
            </div>
        </div>
    `}).join('');
}
// Helper function to safely update content
function updateAdminContent(content) {
    const contentArea = document.getElementById('admin-tab-content');
    if (contentArea) {
        contentArea.innerHTML = content;
    } else {
        console.error('Content area not found, retrying...');
        // Retry after a short delay
        setTimeout(() => {
            const retryArea = document.getElementById('admin-tab-content');
            if (retryArea) {
                retryArea.innerHTML = content;
            } else {
                console.error('Content area still not found');
            }
        }, 100);
    }
}

// Update renderUsersList to use CSS classes
function renderUsersList(filteredUsers = null) {
    const userList = filteredUsers || users || [];
    
    if (userList.length === 0) {
        return '<p style="text-align: center; color: var(--dark-text-muted); padding: 2rem;">No users found</p>';
    }
    
    return userList.map(user => {
        const banStatus = typeof window.getBanStatusText === 'function' 
            ? window.getBanStatusText(user) 
            : null;
        
        const cardClass = user.isBanned ? 'admin-user-card banned' : 'admin-user-card';
        
        return `
        <div class="${cardClass}">
            <div class="admin-user-info">
                <i class="fas ${user.isAdmin ? 'fa-crown' : 'fa-user-circle'} admin-user-avatar ${user.isAdmin ? 'admin' : ''}"></i>
                
                <div class="admin-user-details">
                    <div class="admin-user-header">
                        <h3 class="admin-user-name">
                            ${user.username} ${user.isAdmin ? '(Admin)' : ''}
                        </h3>
                        
                        ${banStatus ? `
                            <span class="admin-user-badge ban-${banStatus.type || 'temporary'}" 
                                  style="background: ${banStatus.color}">
                                <i class="fas ${banStatus.icon}"></i> ${banStatus.text}
                            </span>
                        ` : user.isBanned ? `
                            <span class="admin-user-badge ban-temporary">
                                <i class="fas fa-ban"></i> Banned
                            </span>
                        ` : ''}
                    </div>
                    
                    <div class="admin-user-stats">
                        <div class="admin-user-stat">
                            <span class="admin-user-stat-label">User ID</span>
                            <span class="admin-user-stat-value">${user.id}</span>
                        </div>
                        <div class="admin-user-stat">
                            <span class="admin-user-stat-label">Joined</span>
                            <span class="admin-user-stat-value">${new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div class="admin-user-stat">
                            <span class="admin-user-stat-label">Capsules</span>
                            <span class="admin-user-stat-value">${capsules?.filter(c => c.ownerId === user.id).length || 0}</span>
                        </div>
                    </div>
                    
                    ${user.banReason ? `
                        <div class="admin-ban-reason">
                            <div class="admin-ban-reason-label">Ban Reason</div>
                            <div class="admin-ban-reason-text">${user.banReason}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="admin-actions">
                ${!user.isAdmin ? `
                    ${user.isBanned ? `
                        <button class="admin-btn admin-btn-unban" onclick="showUnbanUserModal('${user.id}', '${user.username}')">
                            <i class="fas fa-check-circle"></i> Unban
                        </button>
                    ` : `
                        <button class="admin-btn admin-btn-ban" onclick="showBanUserModal('${user.id}', '${user.username}')">
                            <i class="fas fa-gavel"></i> Ban
                        </button>
                    `}
                    <button class="admin-btn admin-btn-delete" onclick="showDeleteUserModal('${user.id}', '${user.username}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                ` : `
                    <div class="admin-badge-protected">
                        <i class="fas fa-crown"></i> Admin
                    </div>
                `}
            </div>
        </div>
    `}).join('');
}

// Update switchAdminTab function
// ==================== Tab Switching Function ====================
function switchAdminTab(tab) {
    console.log('Switching to tab:', tab); // Debug log
    
    // Update tab styles
    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked tab
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Get content area - try multiple possible IDs
    const contentArea = document.getElementById('admin-tab-content') || 
                        document.querySelector('.admin-content-area');
    
    if (!contentArea) {
        console.error('Content area not found!');
        return;
    }
    
    console.log('Content area found:', contentArea);
    
    // Render appropriate content
    switch(tab) {
        case 'users':
            contentArea.innerHTML = renderUsersList();
            break;
        case 'capsules':
            contentArea.innerHTML = renderAllCapsules();
            break;
        case 'bans':
            contentArea.innerHTML = renderBanHistory();
            break;
        case 'deleted':
            contentArea.innerHTML = renderDeletedUsers();
            break;
        case 'activity':
            contentArea.innerHTML = renderAdminActivityLog();
            break;
        case 'backups':
            contentArea.innerHTML = renderBackupList();
            break;
        default:
            console.warn('Unknown tab:', tab);
    }
}

// ==================== Ban History (Safe Version) ====================
// In admin.js - Update renderUsersList function

function renderUsersList(filteredUsers = null) {
    const userList = filteredUsers || users || [];
    
    if (userList.length === 0) {
        return '<div style="text-align: center; color: var(--dark-text-muted); padding: 3rem; width: 100%;">No users found</div>';
    }
    
    return userList.map(user => {
        const banStatus = typeof window.getBanStatusText === 'function' 
            ? window.getBanStatusText(user) 
            : null;
        
        return `
        <div class="admin-user-card">
            <div class="admin-user-info">
                <i class="fas ${user.isAdmin ? 'fa-crown' : 'fa-user-circle'} admin-user-avatar" 
                   style="color: ${user.isAdmin ? '#feca57' : 'var(--dark-accent-primary)'};"></i>
                
                <div class="admin-user-details">
                    <div class="admin-user-header">
                        <h3 class="admin-user-name">
                            ${user.username} ${user.isAdmin ? '(Admin)' : ''}
                        </h3>
                        
                        ${banStatus ? `
                            <span class="admin-user-badge" style="background: ${banStatus.color}">
                                <i class="fas ${banStatus.icon}"></i> ${banStatus.text}
                            </span>
                        ` : user.isBanned ? `
                            <span class="admin-user-badge" style="background: #ff6b6b">
                                <i class="fas fa-ban"></i> Banned
                            </span>
                        ` : ''}
                    </div>
                    
                    <div class="admin-user-stats">
                        <div class="admin-user-stat">
                            <span class="admin-user-stat-label">User ID</span>
                            <span class="admin-user-stat-value">${user.id}</span>
                        </div>
                        <div class="admin-user-stat">
                            <span class="admin-user-stat-label">Joined</span>
                            <span class="admin-user-stat-value">${new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div class="admin-user-stat">
                            <span class="admin-user-stat-label">Capsules</span>
                            <span class="admin-user-stat-value">${capsules?.filter(c => c.ownerId === user.id).length || 0}</span>
                        </div>
                    </div>
                    
                    ${user.banReason ? `
                        <div class="admin-ban-reason">
                            <div class="admin-ban-reason-label">Ban Reason</div>
                            <div class="admin-ban-reason-text">${user.banReason}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="admin-actions">
                ${!user.isAdmin ? `
                    ${user.isBanned ? `
                        <button class="admin-btn admin-btn-unban" onclick="showUnbanUserModal('${user.id}', '${user.username}')">
                            <i class="fas fa-check-circle"></i> Unban
                        </button>
                    ` : `
                        <button class="admin-btn admin-btn-ban" onclick="showBanUserModal('${user.id}', '${user.username}')">
                            <i class="fas fa-gavel"></i> Ban
                        </button>
                    `}
                    <button class="admin-btn admin-btn-delete" onclick="showDeleteUserModal('${user.id}', '${user.username}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                ` : `
                    <div class="admin-badge-protected">
                        <i class="fas fa-crown"></i> Protected Admin
                    </div>
                `}
            </div>
        </div>
    `}).join('');
}

// ==================== Wrapper Functions for Ban/Unban ====================
function showBanUserModalWrapper(userId, username) {
    if (typeof window.showBanUserModal === 'function') {
        window.showBanUserModal(userId, username);
    } else {
        alert(`Ban functionality not available. Please check if banSystem.js is loaded.`);
        console.error('showBanUserModal function not found');
    }
}

function showUnbanUserModalWrapper(userId, username) {
    if (typeof window.showUnbanUserModal === 'function') {
        window.showUnbanUserModal(userId, username);
    } else {
        alert(`Unban functionality not available. Please check if banSystem.js is loaded.`);
        console.error('showUnbanUserModal function not found');
    }
}

// ==================== Rest of your existing functions remain the same ====================
function renderAllCapsules() {
    if (!capsules || capsules.length === 0) {
        return '<div style="text-align: center; color: var(--dark-text-muted); padding: 3rem;">No capsules found</div>';
    }
    
    return capsules.map(capsule => {
        const owner = users?.find(u => u.id === capsule.ownerId);
        
        return `
        <div class="user-card" style="flex-direction: column; align-items: flex-start;">
            <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 1rem;">
                <span class="user-badge" style="background: var(--dark-accent-primary); color: white;">${capsule.category}</span>
                <span class="user-badge ${capsule.isLocked ? 'banned' : ''}" 
                      style="${!capsule.isLocked ? 'background: #1dd1a1; color: white;' : ''}">
                    ${capsule.isLocked ? '🔒 Locked' : '🔓 Unlocked'}
                </span>
            </div>
            
            <h3 style="color: var(--dark-text-primary); font-size: 1.3rem; margin-bottom: 0.5rem;">${capsule.title}</h3>
            <p style="color: var(--dark-text-secondary); margin-bottom: 1rem;">${capsule.description || 'No description'}</p>
            
            <div class="user-stats" style="width: 100%; margin-bottom: 1rem;">
                <div class="user-stat">
                    <span class="stat-label">OWNER</span>
                    <span class="stat-value">${owner ? owner.username : 'Unknown'}</span>
                </div>
                <div class="user-stat">
                    <span class="stat-label">CREATED</span>
                    <span class="stat-value">${new Date(capsule.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="user-stat">
                    <span class="stat-label">UNLOCKS</span>
                    <span class="stat-value">${new Date(capsule.unlockDate).toLocaleString()}</span>
                </div>
            </div>
            
            <div class="user-actions" style="flex-direction: row; width: 100%;">
                <button class="action-btn" style="background: var(--dark-accent-primary);" onclick="viewCapsuleDetails('${capsule.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="action-btn delete-btn" onclick="adminDeleteCapsule('${capsule.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `}).join('');
}

function renderDeletedUsers() {
    if (!deletedUsers || deletedUsers.length === 0) {
        return '<div style="text-align: center; color: var(--dark-text-muted); padding: 3rem;">No deleted users</div>';
    }
    
    return deletedUsers.map(record => `
        <div class="user-card" style="flex-direction: column; align-items: flex-start; border-left: 4px solid #ff6b6b;">
            <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <i class="fas fa-user-slash" style="color: #ff6b6b; font-size: 1.5rem;"></i>
                    <h3 style="color: var(--dark-text-primary); margin: 0;">${record.username}</h3>
                </div>
                <span class="user-badge" style="background: #ff6b6b; color: white;">DELETED</span>
            </div>
            
            <div class="user-stats" style="width: 100%; margin-bottom: 1rem;">
                <div class="user-stat">
                    <span class="stat-label">DELETED AT</span>
                    <span class="stat-value">${new Date(record.deletedAt).toLocaleString()}</span>
                </div>
                <div class="user-stat">
                    <span class="stat-label">DELETED BY</span>
                    <span class="stat-value">${record.deletedBy}</span>
                </div>
                <div class="user-stat">
                    <span class="stat-label">CAPSULES LOST</span>
                    <span class="stat-value">${record.capsuleCount || 0}</span>
                </div>
            </div>
            
            <div style="background: var(--dark-bg-primary); padding: 1rem; border-radius: 8px; width: 100%;">
                <p style="color: var(--dark-text-secondary);"><strong>Reason:</strong> ${record.reason}</p>
            </div>
        </div>
    `).join('');
}

function renderAdminActivityLog() {
    if (!activityLog || activityLog.length === 0) {
        return '<div style="text-align: center; color: var(--dark-text-muted); padding: 3rem;">No activity logs</div>';
    }
    
    return activityLog.slice(0, 20).map(activity => `
        <div class="user-card" style="flex-direction: column; align-items: flex-start; border-left: 4px solid var(--dark-accent-primary);">
            <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <i class="fas fa-${getActivityIcon(activity.type)}" style="color: var(--dark-accent-primary);"></i>
                    <span style="color: var(--dark-text-primary); font-weight: 500;">${activity.type.replace(/_/g, ' ')}</span>
                </div>
                <span style="color: var(--dark-text-muted); font-size: 0.85rem;">${new Date(activity.timestamp).toLocaleString()}</span>
            </div>
            <p style="color: var(--dark-text-secondary);">${activity.details}</p>
        </div>
    `).join('');
}

// Update renderBackupList to include the create backup button
function renderBackupList() {
    const backups = JSON.parse(localStorage.getItem('timeCapsule_backups') || '[]');
    
    const createBackupButton = `
        <div class="user-card" style="background: linear-gradient(135deg, var(--dark-accent-primary), var(--dark-accent-secondary)); margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <div>
                    <h3 style="color: white; margin-bottom: 0.5rem;">Create New Backup</h3>
                    <p style="color: rgba(255,255,255,0.8);">Save a snapshot of all users and capsules</p>
                </div>
                <button class="action-btn" onclick="createBackup()" style="background: white; color: var(--dark-accent-primary); width: auto; padding: 0.8rem 2rem; font-weight: bold;">
                    <i class="fas fa-save"></i> Create Backup Now
                </button>
            </div>
        </div>
    `;
    
    if (backups.length === 0) {
        return createBackupButton + '<div style="text-align: center; color: var(--dark-text-muted); padding: 3rem;">No backups found. Create your first backup above.</div>';
    }
    
    const backupList = backups.map(backup => `
        <div class="user-card" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h4 style="color: var(--dark-text-primary); margin-bottom: 0.5rem;">
                    <i class="fas fa-archive" style="color: var(--dark-accent-primary); margin-right: 0.5rem;"></i>
                    Backup ${new Date(backup.timestamp).toLocaleString()}
                </h4>
                <div style="display: flex; gap: 2rem;">
                    <span style="color: var(--dark-text-secondary);">
                        <i class="fas fa-users"></i> Users: ${backup.users?.length || 0}
                    </span>
                    <span style="color: var(--dark-text-secondary);">
                        <i class="fas fa-capsules"></i> Capsules: ${backup.capsules?.length || 0}
                    </span>
                </div>
            </div>
            <button class="action-btn" style="background: var(--dark-accent-primary); width: auto;" onclick="restoreBackup('${backup.id}')">
                <i class="fas fa-undo"></i> Restore
            </button>
        </div>
    `).join('');
    
    return createBackupButton + backupList;
}

// ==================== Delete User ====================
function showDeleteUserModal(userId, username) {
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
        <div class="admin-modal-content">
            <h3><i class="fas fa-exclamation-triangle"></i> Delete User: ${username}</h3>
            <p>Please provide a reason for deleting this user. This action cannot be undone.</p>
            <textarea id="delete-reason" placeholder="Enter deletion reason..." rows="4"></textarea>
            <div class="modal-actions">
                <button class="cancel-btn">Cancel</button>
                <button class="confirm-delete-btn">Delete User</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.querySelector('.confirm-delete-btn').addEventListener('click', () => {
        const reason = modal.querySelector('#delete-reason').value.trim();
        if (!reason) {
            alert('Please provide a reason for deletion');
            return;
        }
        deleteUser(userId, reason);
        modal.remove();
        
        const adminPanel = document.querySelector('.admin-panel');
        if (adminPanel) {
            adminPanel.remove();
            showAdminDashboard();
        }
    });
}

function deleteUser(userId, reason) {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return;
    
    const deletedUser = users[userIndex];
    
    const created = new Date(deletedUser.createdAt);
    const now = new Date();
    const accountAge = Math.floor((now - created) / (1000 * 60 * 60 * 24)) + ' days';
    
    const userCapsules = capsules.filter(c => c.ownerId === userId);
    const capsuleCount = userCapsules.length;
    
    capsules = capsules.filter(c => c.ownerId !== userId);
    
    const deletionRecord = {
        id: generateId(),
        userId: userId,
        username: deletedUser.username,
        reason: reason,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser ? currentUser.username : 'system',
        capsuleCount: capsuleCount,
        accountAge: accountAge
    };
    
    deletedUsers.push(deletionRecord);
    
    users.splice(userIndex, 1);
    
    activityLog.unshift({
        id: generateId(),
        type: 'user_deleted',
        timestamp: new Date().toISOString(),
        details: `User ${deletedUser.username} was deleted. Reason: ${reason}`
    });
    
    saveToStorage();
    showToast(`User ${deletedUser.username} has been deleted`, 'error');
}

// ==================== Delete Capsule (Admin) ====================
function adminDeleteCapsule(capsuleId) {
    if (!checkAdminAccess()) return;
    
    const capsule = capsules.find(c => c.id === capsuleId);
    if (!capsule) return;
    
    const owner = users.find(u => u.id === capsule.ownerId);
    
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
        <div class="admin-modal-content" style="max-width: 500px;">
            <h3><i class="fas fa-exclamation-triangle" style="color: #ff6b6b;"></i> Delete Capsule: "${capsule.title}"</h3>
            <p style="margin-bottom: 15px;">You are about to delete <strong>${capsule.title}</strong> owned by <strong>${owner ? owner.username : 'Unknown'}</strong>.</p>
            <p style="margin-bottom: 10px; color: var(--dark-text-secondary);">Please provide a reason for deletion. This will be shown to the user.</p>
            <textarea id="capsule-delete-reason" placeholder="Enter deletion reason (e.g., Inappropriate content, Duplicate, etc.)" rows="4" style="
                width: 100%;
                padding: 10px;
                background: var(--dark-bg-primary);
                border: 2px solid var(--dark-border);
                border-radius: 8px;
                color: var(--dark-text-primary);
                margin-bottom: 20px;
                resize: vertical;
            "></textarea>
            <div class="modal-actions">
                <button class="cancel-btn">Cancel</button>
                <button class="confirm-delete-btn" id="confirm-capsule-delete">Delete Capsule</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.querySelector('#confirm-capsule-delete').addEventListener('click', () => {
        const reason = document.getElementById('capsule-delete-reason').value.trim();
        
        if (!reason) {
            showToast('Please provide a reason for deletion', 'error');
            return;
        }
        
        const deletionRecord = {
            id: generateId(),
            capsuleId: capsule.id,
            capsuleTitle: capsule.title,
            ownerId: capsule.ownerId,
            ownerUsername: owner ? owner.username : 'Unknown',
            deletedBy: currentUser.username,
            deletedByAdmin: currentUser.username,
            reason: reason,
            deletedAt: new Date().toISOString(),
            capsuleData: { ...capsule }
        };
        
        deletedCapsules.push(deletionRecord);
        
        capsules = capsules.filter(c => c.id !== capsuleId);
        
        activityLog.unshift({
            id: generateId(),
            capsuleId: capsule.id,
            type: 'capsule_deleted_by_admin',
            timestamp: new Date().toISOString(),
            details: `Admin ${currentUser.username} deleted capsule "${capsule.title}" owned by ${owner ? owner.username : 'Unknown'}. Reason: ${reason}`
        });
        
        if (owner) {
            notifications.push({
                id: generateId(),
                userId: owner.id,
                type: 'capsule_deleted',
                message: `Your capsule "${capsule.title}" was deleted by an admin. Reason: ${reason}`,
                read: false,
                capsuleTitle: capsule.title,
                deletionReason: reason,
                deletedBy: currentUser.username,
                timestamp: new Date().toISOString()
            });
        }
        
        saveToStorage();
        
        modal.remove();
        
        const adminPanel = document.querySelector('.admin-panel');
        if (adminPanel) {
            adminPanel.remove();
            showAdminDashboard();
        }
        
        showToast(`Capsule "${capsule.title}" deleted successfully`, 'success');
    });
}

// ==================== Investigation Panel ====================
// admin.js - Update showInvestigationPanel to use modal system

// ==================== Investigation Panel ====================
function showInvestigationPanel() {
    if (!checkAdminAccess()) {
        showToast('Admin access required', 'error');
        return;
    }
    
    // Get security log from localStorage
    const securityLog = JSON.parse(localStorage.getItem('timeCapsule_securityLog') || '[]');
    
    // If no logs, add some sample data for testing
    if (securityLog.length === 0) {
        // Add sample data for demonstration
        const sampleLogs = [
            {
                username: 'admin',
                action: 'successful_login',
                details: 'Login successful',
                timestamp: new Date().toISOString(),
                userAgent: 'Chrome on Windows'
            },
            {
                username: 'testuser',
                action: 'failed_login',
                details: 'Failed login attempt #1',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                userAgent: 'Firefox on MacOS'
            },
            {
                username: 'demo',
                action: 'failed_login',
                details: 'Failed login attempt #3',
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                userAgent: 'Safari on iOS'
            }
        ];
        localStorage.setItem('timeCapsule_securityLog', JSON.stringify(sampleLogs));
        securityLog.push(...sampleLogs);
    }
    
    const content = `
        <div style="margin-bottom: 1.5rem;">
            <div style="display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
                <div class="search-bar" style="flex: 2; min-width: 250px; display: flex; align-items: center; background: var(--dark-card-bg); border: 2px solid var(--dark-border); border-radius: 8px; padding: 0 1rem;">
                    <i class="fas fa-search" style="color: var(--dark-text-muted);"></i>
                    <input type="text" id="investigation-search" placeholder="Search by username..." style="flex: 1; padding: 0.75rem 1rem; border: none; background: transparent; color: var(--dark-text-primary);">
                </div>
                <select id="investigation-action" style="flex: 1; min-width: 180px; padding: 0.75rem 1rem; background: var(--dark-card-bg); border: 2px solid var(--dark-border); border-radius: 8px; color: var(--dark-text-primary); cursor: pointer;">
                    <option value="all">All Actions</option>
                    <option value="successful_login">Successful Logins</option>
                    <option value="failed_login">Failed Attempts</option>
                </select>
            </div>
            
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
                <span style="color: var(--dark-text-secondary); font-size: 0.9rem; padding: 0.25rem 0;">
                    <i class="fas fa-database"></i> Total Logs: ${securityLog.length}
                </span>
                <button onclick="refreshInvestigationLogs()" style="margin-left: auto; padding: 0.5rem 1rem; background: var(--dark-accent-primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem;">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
        </div>
        
        <div id="investigation-results" style="max-height: 60vh; overflow-y: auto; padding-right: 0.5rem;">
            ${renderInvestigationResults(securityLog)}
        </div>
    `;
    
    const modal = createModal(content, 'Investigation Panel', { size: 'xxlarge', showCloseButton: true });
    openModal(modal, { size: 'xxlarge' });
    
    // Add event listeners after modal is open
    setTimeout(() => {
        const searchInput = document.getElementById('investigation-search');
        const actionSelect = document.getElementById('investigation-action');
        
        if (searchInput && actionSelect) {
            function filterResults() {
                const searchTerm = searchInput.value.toLowerCase();
                const action = actionSelect.value;
                
                let filtered = securityLog;
                
                if (searchTerm) {
                    filtered = filtered.filter(log => 
                        log.username && log.username.toLowerCase().includes(searchTerm)
                    );
                }
                
                if (action !== 'all') {
                    filtered = filtered.filter(log => log.action === action);
                }
                
                const resultsDiv = document.getElementById('investigation-results');
                if (resultsDiv) {
                    resultsDiv.innerHTML = renderInvestigationResults(filtered);
                }
            }
            
            let debounceTimer;
            searchInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(filterResults, 300);
            });
            
            actionSelect.addEventListener('change', filterResults);
        }
    }, 100);
}

// Add refresh function
function refreshInvestigationLogs() {
    const securityLog = JSON.parse(localStorage.getItem('timeCapsule_securityLog') || '[]');
    const resultsDiv = document.getElementById('investigation-results');
    if (resultsDiv) {
        resultsDiv.innerHTML = renderInvestigationResults(securityLog);
    }
    showToast('Logs refreshed', 'success');
}

// ==================== Deleted Capsule Notifications ====================
function showDeletedCapsuleNotifications() {
    if (!currentUser) return;
    
    const userDeletedCapsules = (deletedCapsules || []).filter(dc => dc.ownerId === currentUser.id);
    
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
            <p>The following capsules have been removed by admins:</p>
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
                            <i class="fas fa-user-shield"></i> Deleted by: ${dc.deletedBy}
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

// ==================== Restore Requests Management ====================
let restoreRequests = [];

function loadRestoreRequests() {
    const stored = localStorage.getItem('timeCapsule_restoreRequests');
    if (stored) {
        restoreRequests = JSON.parse(stored);
    }
    return restoreRequests;
}

function saveRestoreRequests() {
    localStorage.setItem('timeCapsule_restoreRequests', JSON.stringify(restoreRequests));
}

function showRestoreRequestsInAdmin() {
    if (!checkAdminAccess()) return;
    
    loadRestoreRequests();
    
    const adminContent = document.querySelector('.admin-content');
    if (!adminContent) return;
    
    // Check if restore tab exists, if not create it
    let restoreTab = document.querySelector('.tab-btn[data-tab="restore"]');
    if (!restoreTab) {
        const tabsContainer = document.querySelector('.admin-tabs');
        if (tabsContainer) {
            restoreTab = document.createElement('button');
            restoreTab.className = 'tab-btn';
            restoreTab.setAttribute('data-tab', 'restore');
            restoreTab.textContent = `Restore Requests (${restoreRequests.length})`;
            tabsContainer.appendChild(restoreTab);
            
            restoreTab.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                restoreTab.classList.add('active');
                document.getElementById('restore-tab').classList.add('active');
            });
        }
    } else {
        restoreTab.textContent = `Restore Requests (${restoreRequests.length})`;
    }
    
    // Create restore tab pane if it doesn't exist
    if (!document.getElementById('restore-tab')) {
        const restorePane = document.createElement('div');
        restorePane.className = 'tab-pane';
        restorePane.id = 'restore-tab';
        restorePane.innerHTML = `
            <div class="restore-requests-section">
                <h3><i class="fas fa-undo-alt"></i> Account Restore Requests</h3>
                <div id="restore-requests-list">
                    ${renderRestoreRequests()}
                </div>
            </div>
        `;
        document.querySelector('.admin-content').appendChild(restorePane);
    } else {
        document.getElementById('restore-requests-list').innerHTML = renderRestoreRequests();
    }
}

// ==================== Render Investigation Results ====================
function renderInvestigationResults(logs) {
    if (!logs || logs.length === 0) {
        return '<p style="text-align: center; color: var(--dark-text-muted); padding: 2rem;">No activity found matching your criteria</p>';
    }
    
    return logs.map(log => `
        <div class="investigation-card" style="
            background: var(--dark-card-bg);
            border-radius: 12px;
            padding: 1.25rem;
            margin-bottom: 1rem;
            border: 1px solid var(--dark-border);
            border-left: 4px solid ${log.action.includes('success') ? '#1dd1a1' : '#ff6b6b'};
            transition: all 0.3s ease;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <i class="fas fa-${log.action.includes('success') ? 'check-circle' : 'times-circle'}" 
                       style="color: ${log.action.includes('success') ? '#1dd1a1' : '#ff6b6b'}; font-size: 1.2rem;"></i>
                    <strong style="color: var(--dark-text-primary); font-size: 1.1rem;">${log.username}</strong>
                </div>
                <span style="color: var(--dark-text-muted); font-size: 0.85rem;">
                    <i class="fas fa-clock" style="margin-right: 4px;"></i>
                    ${new Date(log.timestamp).toLocaleString()}
                </span>
            </div>
            
            <div style="margin-bottom: 0.75rem; padding-left: 2rem;">
                <span class="action-badge" style="
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.4rem 1rem;
                    border-radius: 30px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    background: ${log.action.includes('success') ? 'rgba(29, 209, 161, 0.15)' : 'rgba(255, 107, 107, 0.15)'};
                    color: ${log.action.includes('success') ? '#1dd1a1' : '#ff6b6b'};
                    border: 1px solid ${log.action.includes('success') ? 'rgba(29, 209, 161, 0.3)' : 'rgba(255, 107, 107, 0.3)'};
                ">
                    <i class="fas fa-${log.action.includes('success') ? 'check-circle' : 'exclamation-circle'}"></i>
                    ${log.details}
                </span>
            </div>
            
            <div style="padding-left: 2rem;">
                <div style="
                    background: var(--dark-bg-primary);
                    border-radius: 8px;
                    padding: 0.75rem;
                    font-size: 0.8rem;
                    color: var(--dark-text-muted);
                    border-left: 2px solid var(--dark-accent-primary);
                    word-break: break-all;
                ">
                    <i class="fas fa-globe" style="margin-right: 8px; color: var(--dark-accent-primary);"></i>
                    ${log.userAgent || 'Unknown device'}
                </div>
            </div>
        </div>
    `).join('');
}

function renderRestoreRequests() {
    if (restoreRequests.length === 0) {
        return '<p style="text-align: center; color: var(--dark-text-muted); padding: 2rem;">No restore requests pending</p>';
    }
    
    return restoreRequests.map(request => `
        <div class="restore-request-card" data-request-id="${request.id}">
            <div class="restore-request-header">
                <h4><i class="fas fa-user"></i> ${request.username}</h4>
                <span class="restore-request-date">${new Date(request.requestedAt).toLocaleString()}</span>
            </div>
            <div class="restore-request-details">
                <p><strong>Email:</strong> ${request.email}</p>
                <p><strong>Deleted Username:</strong> ${request.deletedUsername}</p>
                <p><strong>Deleted At:</strong> ${new Date(request.deletedAt).toLocaleString()}</p>
            </div>
            <div class="restore-request-reason">
                <strong>Reason for restore:</strong>
                <p>${request.reason}</p>
            </div>
            <div class="restore-request-actions">
                <button class="approve-restore-btn" onclick="approveRestoreRequest('${request.id}')">
                    <i class="fas fa-check"></i> Approve Restore
                </button>
                <button class="reject-restore-btn" onclick="rejectRestoreRequest('${request.id}')">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        </div>
    `).join('');
}

function approveRestoreRequest(requestId) {
    const request = restoreRequests.find(r => r.id === requestId);
    if (!request) return;
    
    // Find the deleted user record
    const deletedRecord = (deletedUsers || []).find(d => d.username === request.deletedUsername);
    
    if (!deletedRecord) {
        showToast('Deleted user record not found', 'error');
        return;
    }
    
    // Recreate the user
    const restoredUser = {
        id: deletedRecord.userId || generateId(),
        username: deletedRecord.username,
        password: 'temporary123', // User will need to reset password
        isAdmin: false,
        createdAt: new Date().toISOString(),
        avatar: null,
        restoredAt: new Date().toISOString(),
        restoredFrom: request.deletedAt
    };
    
    users.push(restoredUser);
    
    // Remove from deleted users
    const deletedIndex = deletedUsers.findIndex(d => d.username === request.deletedUsername);
    if (deletedIndex !== -1) {
        deletedUsers.splice(deletedIndex, 1);
    }
    
    // Remove the request
    const requestIndex = restoreRequests.findIndex(r => r.id === requestId);
    if (requestIndex !== -1) {
        restoreRequests.splice(requestIndex, 1);
    }
    
    // Add notification for the user
    if (typeof notifications !== 'undefined') {
        notifications.push({
            id: generateId(),
            userId: restoredUser.id,
            type: 'account_restored',
            message: `Your account has been restored by an admin. Please login and reset your password.`,
            read: false,
            timestamp: new Date().toISOString()
        });
    }
    
    // Save everything
    saveToStorage();
    saveRestoreRequests();
    
    showToast(`User ${request.username} restored successfully`, 'success');
    
    // Refresh admin panel
    const adminPanel = document.querySelector('.admin-panel');
    if (adminPanel) {
        adminPanel.remove();
        showAdminDashboard();
    }
}

function rejectRestoreRequest(requestId) {
    if (!confirm('Are you sure you want to reject this restore request?')) return;
    
    const requestIndex = restoreRequests.findIndex(r => r.id === requestId);
    if (requestIndex !== -1) {
        const request = restoreRequests[requestIndex];
        
        // Add notification for the user
        if (typeof notifications !== 'undefined') {
            notifications.push({
                id: generateId(),
                userId: request.userId || 'unknown',
                type: 'account_restore_rejected',
                message: `Your account restore request has been rejected. Please contact support for more information.`,
                read: false,
                timestamp: new Date().toISOString()
            });
        }
        
        restoreRequests.splice(requestIndex, 1);
        saveRestoreRequests();
        
        showToast('Restore request rejected', 'info');
        
        // Refresh admin panel
        const adminPanel = document.querySelector('.admin-panel');
        if (adminPanel) {
            adminPanel.remove();
            showAdminDashboard();
        }
    }
}

// Update showAdminDashboard to include restore requests
const originalShowAdminDashboard = showAdminDashboard;
showAdminDashboard = function() {
    originalShowAdminDashboard();
    setTimeout(() => {
        showRestoreRequestsInAdmin();
    }, 100);
};

// Export functions
// Export functions
window.checkAdminAccess = checkAdminAccess;
window.addAdminButton = addAdminButton;
window.showAdminDashboard = showAdminDashboard;
window.showDeleteUserModal = showDeleteUserModal;
window.adminDeleteCapsule = adminDeleteCapsule;
window.showInvestigationPanel = showInvestigationPanel;
window.showDeletedCapsuleNotifications = showDeletedCapsuleNotifications;
window.renderInvestigationResults = renderInvestigationResults;
window.refreshInvestigationLogs = refreshInvestigationLogs;
window.switchAdminTab = switchAdminTab;
window.renderSimpleUsersList = renderSimpleUsersList;
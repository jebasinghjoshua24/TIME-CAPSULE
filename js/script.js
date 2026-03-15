// script.js - Complete Digital Time Capsule with All Features

// ==================== Global Variables ====================
let currentUser = null;
let capsules = [];
let users = [];
let activityLog = [];
let deletedUsers = [];
let favoritesFilter = false;
let currentMemeIndex = 0;
let loginAttempts = {};
let lockedAccounts = {};
let autoSaveTimer = null;
let hasUnsavedChanges = false;
let toastContainer = null;
let countdownInterval = null;

// Sample data for demonstration
const sampleUsers = [
    { id: '1', username: 'demo', password: 'demo123', isAdmin: false, createdAt: new Date().toISOString(), avatar: null },
    { id: '2', username: 'test', password: 'test123', isAdmin: false, createdAt: new Date().toISOString(), avatar: null },
    { id: '3', username: 'admin', password: 'admin123', isAdmin: true, createdAt: new Date().toISOString(), avatar: null }
];

const sampleCapsules = [
    {
        id: '1',
        title: 'Letter to Future Me',
        description: 'Personal thoughts and goals for the next year',
        message: 'Dear future me, I hope you\'ve achieved your dreams and found happiness.',
        category: 'personal',
        tags: ['goals', 'future'],
        mood: 'nostalgic',
        createdAt: new Date().toISOString(),
        unlockDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isLocked: true,
        isFavorite: false,
        isArchived: false,
        isPinned: false,
        isOpened: false,  // Add this
        accessAttempts: [],
        ownerId: '1',
        reactions: { '❤️': 0, '😂': 0, '😮': 0, '😢': 0, '👏': 0 },
        comments: [],
        version: 1
    },
    {
        id: '2',
        title: 'Vacation Memories 2024',
        description: 'Best summer vacation ever!',
        message: 'The sunset at the beach was absolutely breathtaking.',
        category: 'memories',
        tags: ['vacation', 'summer'],
        mood: 'happy',
        createdAt: new Date().toISOString(),
        unlockDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        isLocked: false,
        isFavorite: true,
        isArchived: false,
        isPinned: true,
        isOpened: true,  // This one has been opened before
        accessAttempts: [],
        ownerId: '1',
        reactions: { '❤️': 5, '😂': 2, '😮': 1, '😢': 0, '👏': 3 },
        comments: [],
        version: 1
    },
    {
        id: '3',
        title: 'Secret Recipe',
        description: 'Grandma\'s famous chocolate chip cookies',
        message: 'Secret ingredient: a pinch of love and double the vanilla!',
        category: 'family',
        tags: ['recipe', 'family'],
        mood: 'thankful',
        createdAt: new Date().toISOString(),
        unlockDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        isLocked: true,
        isFavorite: true,
        isArchived: false,
        isPinned: false,
        isOpened: false,  // Add this
        accessAttempts: [],
        ownerId: '1',
        reactions: { '❤️': 0, '😂': 0, '😮': 0, '😢': 0, '👏': 0 },
        comments: [],
        version: 1
    }
];

// Meme array for self-destruct/early access protection
const memeUrls = [
    'https://api.memegen.link/images/buzz/memes/you_shall_not_pass.png',
    'https://api.memegen.link/images/phd/sorry/this_capsule_is_not_ready.png',
    'https://api.memegen.link/images/fry/not_sure_if/too_early.png',
    'https://api.memegen.link/images/yoda/attempt_early_open/do_or_do_not.png',
    'https://api.memegen.link/images/spiderman/patience/young_padawan.png'
];

// Mood options
const moodOptions = [
    { value: 'happy', label: '😊 Happy', color: '#feca57' },
    { value: 'sad', label: '😢 Sad', color: '#54a0ff' },
    { value: 'excited', label: '🎉 Excited', color: '#ff6b6b' },
    { value: 'thankful', label: '🙏 Thankful', color: '#1dd1a1' },
    { value: 'nostalgic', label: '📸 Nostalgic', color: '#9b59b6' }
];

// ==================== LocalStorage Functions ====================

function loadFromStorage() {
    const storedUsers = localStorage.getItem('timeCapsule_users');
    if (storedUsers) {
        users = JSON.parse(storedUsers);
        
        const adminExists = users.some(u => u.isAdmin === true);
        if (!adminExists) {
            users.push({
                id: generateId(),
                username: 'admin',
                password: 'admin123',
                isAdmin: true,
                createdAt: new Date().toISOString(),
                avatar: null
            });
        }
    } else {
        users = [...sampleUsers];
        saveToStorage();
    }
    
    const storedCapsules = localStorage.getItem('timeCapsule_capsules');
    if (storedCapsules) {
        capsules = JSON.parse(storedCapsules);
    } else {
        capsules = [...sampleCapsules];
        saveToStorage();
    }
    
    const storedActivity = localStorage.getItem('timeCapsule_activity');
    if (storedActivity) {
        activityLog = JSON.parse(storedActivity);
    }
    
    const storedDeleted = localStorage.getItem('timeCapsule_deletedUsers');
    if (storedDeleted) {
        deletedUsers = JSON.parse(storedDeleted);
    }
    
    const storedAttempts = sessionStorage.getItem('loginAttempts');
    if (storedAttempts) {
        loginAttempts = JSON.parse(storedAttempts);
    }
}

function saveToStorage() {
    localStorage.setItem('timeCapsule_users', JSON.stringify(users));
    localStorage.setItem('timeCapsule_capsules', JSON.stringify(capsules));
    localStorage.setItem('timeCapsule_activity', JSON.stringify(activityLog));
    localStorage.setItem('timeCapsule_deletedUsers', JSON.stringify(deletedUsers));
}

// ==================== Toast Notification System ====================

function initializeToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
}

function showToast(message, type = 'info', duration = 3000) {
    initializeToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas fa-${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function showNotification(message, type = 'info') {
    showToast(message, type);
}

function showWarningMessage(message) {
    showToast(message, 'warning');
}

// ==================== Password Strength Checker ====================

function checkPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return { level: 'weak', message: 'Weak Password', score: 1 };
    if (strength <= 3) return { level: 'medium', message: 'Medium Password', score: 2 };
    if (strength <= 4) return { level: 'strong', message: 'Strong Password', score: 3 };
    return { level: 'very-strong', message: 'Very Strong Password', score: 4 };
}

function initializePasswordStrength() {
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function(e) {
            const strength = checkPasswordStrength(e.target.value);
            const indicator = document.getElementById('password-strength') || createPasswordStrengthIndicator();
            indicator.className = `password-strength strength-${strength.level}`;
            indicator.textContent = strength.message;
        });
    }
}

function createPasswordStrengthIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'password-strength';
    indicator.className = 'password-strength';
    
    const passwordInput = document.getElementById('password');
    passwordInput.parentNode.insertBefore(indicator, passwordInput.nextSibling);
    
    return indicator;
}

// ==================== Brute Force Protection ====================

function checkAccountLock(username) {
    if (lockedAccounts[username]) {
        const lockTime = lockedAccounts[username];
        const now = Date.now();
        const timeLeft = Math.ceil((lockTime - now) / 1000 / 60);
        
        if (now < lockTime) {
            showLockoutMessage(username, timeLeft);
            return true;
        } else {
            delete lockedAccounts[username];
            delete loginAttempts[username];
            sessionStorage.removeItem('loginAttempts');
        }
    }
    return false;
}

function recordFailedAttempt(username) {
    if (!loginAttempts[username]) {
        loginAttempts[username] = 0;
    }
    loginAttempts[username]++;
    
    sessionStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
    
    if (loginAttempts[username] >= 5) {
        lockedAccounts[username] = Date.now() + (15 * 60 * 1000);
        showToast(`Account locked for 15 minutes due to too many failed attempts`, 'error');
    }
    
    addSecurityLog(username, 'failed_login', `Failed login attempt #${loginAttempts[username]}`);
}

function showLockoutMessage(username, minutesLeft) {
    const modal = document.createElement('div');
    modal.className = 'lockout-message';
    modal.innerHTML = `
        <h3><i class="fas fa-lock"></i> Account Locked</h3>
        <p>Too many failed login attempts for "${username}".</p>
        <div class="lockout-timer">${minutesLeft} minutes remaining</div>
        <button onclick="this.closest('.lockout-message').remove()">OK</button>
    `;
    document.body.appendChild(modal);
}

function addSecurityLog(username, action, details) {
    const securityLog = JSON.parse(localStorage.getItem('timeCapsule_securityLog') || '[]');
    securityLog.unshift({
        username,
        action,
        details,
        timestamp: new Date().toISOString(),
        ip: 'localhost',
        userAgent: navigator.userAgent
    });
    
    if (securityLog.length > 100) securityLog.pop();
    
    localStorage.setItem('timeCapsule_securityLog', JSON.stringify(securityLog));
}

// ==================== Authentication Functions ====================

function initializeAuth() {
    loadFromStorage();
    
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
    
    const path = window.location.pathname;
    const filename = path.split('/').pop() || path;
    
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin(e);
        });
    }
    
    const signupForm = document.querySelector('.sign-up-form');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleSignUp(e);
        });
    }
    
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
    
    if (currentUser && currentUser.isAdmin && filename === 'Homepage.html') {
        addAdminButton();
    }
    
    if (filename === 'Homepage.html' && !currentUser) {
        window.location.href = 'login.html';
    }
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('error');
    
    if (checkAccountLock(username)) {
        return;
    }
    
    if (checkIfUserDeleted(username)) {
        return;
    }
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        delete loginAttempts[username];
        sessionStorage.removeItem('loginAttempts');
        addSecurityLog(username, 'successful_login', 'Login successful');
        
        currentUser = { 
            username: user.username, 
            id: user.id,
            isAdmin: user.isAdmin || false,
            avatar: user.avatar || null
        };
        
        activityLog.unshift({
            id: generateId(),
            type: 'login',
            timestamp: new Date().toISOString(),
            details: `User ${username} logged in`
        });
        
        saveToStorage();
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        window.location.href = 'Homepage.html';
    } else {
        errorElement.textContent = 'Invalid username or password';
        errorElement.style.color = '#ff6b6b';
        recordFailedAttempt(username);
        
        const remaining = 5 - (loginAttempts[username] || 0);
        if (remaining > 0) {
            showToast(`${remaining} attempts remaining before account lock`, 'warning');
        }
    }
}

function handleSignUp(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const errorElement = document.getElementById('error');
    
    if (checkIfUserDeleted(username)) {
        return;
    }
    
    if (password !== confirmPassword) {
        errorElement.textContent = 'Passwords do not match';
        return;
    }
    
    const strength = checkPasswordStrength(password);
    if (strength.score < 2) {
        errorElement.textContent = 'Password too weak. Please choose a stronger password.';
        return;
    }
    
    if (users.some(u => u.username === username)) {
        errorElement.textContent = 'Username already exists';
        return;
    }
    
    const newUser = {
        id: generateId(),
        username,
        password,
        isAdmin: false,
        createdAt: new Date().toISOString(),
        avatar: null
    };
    
    users.push(newUser);
    
    activityLog.unshift({
        id: generateId(),
        type: 'signup',
        timestamp: new Date().toISOString(),
        details: `New user registered: ${username}`
    });
    
    saveToStorage();
    
    showToast('Account created successfully! Please login.', 'success');
    
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1500);
}

function handleLogout() {
    if (currentUser) {
        activityLog.unshift({
            id: generateId(),
            type: 'logout',
            timestamp: new Date().toISOString(),
            details: `User ${currentUser.username} logged out`
        });
        saveToStorage();
    }
    
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// ==================== Admin Functions ====================

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

function showAdminDashboard() {
    if (!checkAdminAccess()) return;
    
    const adminPanel = document.createElement('div');
    adminPanel.className = 'admin-panel';
    adminPanel.innerHTML = `
        <div class="admin-header">
            <h2><i class="fas fa-shield-alt"></i> Admin Dashboard</h2>
            <button class="close-admin">&times;</button>
        </div>
        <div class="admin-stats">
            <div class="admin-stat-card">
                <i class="fas fa-users"></i>
                <div>
                    <span class="stat-value">${users.length}</span>
                    <span class="stat-label">Total Users</span>
                </div>
            </div>
            <div class="admin-stat-card">
                <i class="fas fa-capsules"></i>
                <div>
                    <span class="stat-value">${capsules.length}</span>
                    <span class="stat-label">Total Capsules</span>
                </div>
            </div>
            <div class="admin-stat-card">
                <i class="fas fa-trash-alt"></i>
                <div>
                    <span class="stat-value">${deletedUsers.length}</span>
                    <span class="stat-label">Deleted Users</span>
                </div>
            </div>
            <div class="admin-stat-card">
                <i class="fas fa-clock"></i>
                <div>
                    <span class="stat-value">${capsules.filter(c => c.isLocked).length}</span>
                    <span class="stat-label">Locked Capsules</span>
                </div>
            </div>
        </div>
        <div class="admin-tabs">
            <button class="tab-btn active" data-tab="users">Users</button>
            <button class="tab-btn" data-tab="capsules">All Capsules</button>
            <button class="tab-btn" data-tab="deleted">Deleted Users</button>
            <button class="tab-btn" data-tab="activity">System Activity</button>
            <button class="tab-btn" data-tab="backups">Backups</button>
        </div>
        <div class="admin-content">
            <div class="tab-pane active" id="users-tab">
                <div class="search-bar">
                    <i class="fas fa-search"></i>
                    <input type="text" id="admin-user-search" placeholder="Search users...">
                </div>
                <div class="users-list">
                    ${renderUsersList()}
                </div>
            </div>
            <div class="tab-pane" id="capsules-tab">
                <div class="admin-capsules-grid">
                    ${renderAllCapsules()}
                </div>
            </div>
            <div class="tab-pane" id="deleted-tab">
                <div class="deleted-users-list">
                    ${renderDeletedUsers()}
                </div>
            </div>
            <div class="tab-pane" id="activity-tab">
                <div class="admin-activity-log">
                    ${renderAdminActivityLog()}
                </div>
            </div>
            <div class="tab-pane" id="backups-tab">
                <div class="backup-controls">
                    <button class="btn-primary" onclick="createBackup()">
                        <i class="fas fa-save"></i> Create Backup
                    </button>
                </div>
                <div class="backup-list">
                    ${renderBackupList()}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(adminPanel);
    
    startLiveCountdownUpdates();
    
    adminPanel.querySelector('.close-admin').addEventListener('click', () => {
        adminPanel.remove();
    });
    
    adminPanel.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            adminPanel.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            adminPanel.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            adminPanel.querySelector(`#${btn.dataset.tab}-tab`).classList.add('active');
        });
    });
    
    const searchInput = adminPanel.querySelector('#admin-user-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredUsers = users.filter(u => 
                u.username.toLowerCase().includes(searchTerm) || 
                u.id.includes(searchTerm)
            );
            adminPanel.querySelector('.users-list').innerHTML = renderUsersList(filteredUsers);
        });
    }
}

function renderUsersList(filteredUsers = null) {
    const userList = filteredUsers || users;
    return userList.map(user => `
        <div class="user-card" data-user-id="${user.id}">
            <div class="user-info">
                <i class="fas ${user.isAdmin ? 'fa-crown' : 'fa-user'}" style="color: ${user.isAdmin ? '#feca57' : '#6c5ce7'}"></i>
                <div>
                    <h4>${user.username} ${user.isAdmin ? '(Admin)' : ''}</h4>
                    <p>ID: ${user.id}</p>
                    <p>Joined: ${new Date(user.createdAt).toLocaleDateString()}</p>
                    <p>Capsules: ${capsules.filter(c => c.ownerId === user.id).length}</p>
                </div>
            </div>
            ${!user.isAdmin ? `
                <div class="user-actions">
                    <button class="delete-user-btn" onclick="showDeleteUserModal('${user.id}', '${user.username}')">
                        <i class="fas fa-trash"></i> Delete User
                    </button>
                </div>
            ` : '<span class="admin-badge">Protected Admin</span>'}
        </div>
    `).join('');
}

function renderAllCapsules() {
    return capsules.map(capsule => {
        const owner = users.find(u => u.id === capsule.ownerId);
        const now = new Date().getTime();
        const unlockTime = new Date(capsule.unlockDate).getTime();
        const timeRemaining = unlockTime - now;
        const isExpired = timeRemaining <= 0;
        
        let countdownDisplay = '';
        let countdownClass = '';
        
        if (isExpired) {
            countdownDisplay = 'Unlocked';
            countdownClass = 'expired';
        } else {
            countdownClass = timeRemaining < 86400000 ? 'warning' : '';
            
            const seconds = Math.floor(timeRemaining / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            
            if (days > 0) {
                countdownDisplay = `${days}d ${hours % 24}h`;
            } else if (hours > 0) {
                countdownDisplay = `${hours}h ${minutes % 60}m`;
            } else if (minutes > 0) {
                countdownDisplay = `${minutes}m ${seconds % 60}s`;
            } else {
                countdownDisplay = `${seconds}s`;
            }
        }
        
        return `
            <div class="admin-capsule-card" data-id="${capsule.id}" data-unlock="${capsule.unlockDate}">
                <div class="capsule-header">
                    <span class="capsule-category">${capsule.category}</span>
                    <span class="capsule-status ${capsule.isLocked ? 'locked' : 'unlocked'}">
                        <i class="fas fa-${capsule.isLocked ? 'lock' : 'unlock-alt'}"></i>
                        ${capsule.isLocked ? 'Locked' : 'Unlocked'}
                    </span>
                </div>
                
                <h4>${capsule.title}</h4>
                
                <div class="capsule-owner">
                    <i class="fas fa-user"></i>
                    <span>${owner ? owner.username : 'Unknown'}</span>
                </div>
                
                <div class="capsule-date">
                    <i class="fas fa-calendar-plus"></i>
                    <span>${new Date(capsule.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div class="capsule-unlock">
                    <i class="fas fa-clock"></i>
                    <span>Unlocks: ${new Date(capsule.unlockDate).toLocaleString()}</span>
                </div>
                
                <div class="capsule-countdown ${countdownClass}" data-capsule-id="${capsule.id}">
                    <i class="fas fa-hourglass-half"></i>
                    <span class="time-value">${countdownDisplay}</span>
                </div>
                
                ${capsule.tags && capsule.tags.length > 0 ? `
                    <div class="capsule-tags">
                        ${capsule.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                    </div>
                ` : ''}
                
                <div class="admin-capsule-actions">
                    <button class="view-capsule-btn" onclick="viewCapsuleDetails('${capsule.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="delete-capsule-btn" onclick="adminDeleteCapsule('${capsule.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderDeletedUsers() {
    return deletedUsers.map(record => `
        <div class="deleted-user-record">
            <div class="deleted-user-header">
                <i class="fas fa-user-slash"></i>
                <h4>${record.username}</h4>
                <span class="deletion-date">${new Date(record.deletedAt).toLocaleString()}</span>
            </div>
            <div class="deletion-reason">
                <strong>Deletion Reason:</strong>
                <p>${record.reason}</p>
            </div>
            <div class="deleted-user-stats">
                <p>Capsules lost: ${record.capsuleCount}</p>
                <p>Account age: ${record.accountAge}</p>
            </div>
        </div>
    `).join('');
}

function renderAdminActivityLog() {
    return activityLog.slice(0, 20).map(activity => `
        <div class="admin-activity-item ${activity.type}">
            <i class="fas fa-${getActivityIcon(activity.type)}"></i>
            <div class="activity-details">
                <p>${activity.details}</p>
                <small>${new Date(activity.timestamp).toLocaleString()}</small>
            </div>
        </div>
    `).join('');
}

function renderBackupList() {
    const backups = JSON.parse(localStorage.getItem('timeCapsule_backups') || '[]');
    return backups.map(backup => `
        <div class="backup-item">
            <div>
                <strong>${new Date(backup.timestamp).toLocaleString()}</strong>
                <p>Users: ${backup.users.length}, Capsules: ${backup.capsules.length}</p>
            </div>
            <button onclick="restoreBackup('${backup.id}')" class="btn-secondary">
                <i class="fas fa-undo"></i> Restore
            </button>
        </div>
    `).join('');
}

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

function adminDeleteCapsule(capsuleId) {
    if (!checkAdminAccess()) return;
    
    if (confirm('Are you sure you want to delete this capsule? This action cannot be undone.')) {
        const capsule = capsules.find(c => c.id === capsuleId);
        capsules = capsules.filter(c => c.id !== capsuleId);
        
        if (capsule) {
            activityLog.unshift({
                id: generateId(),
                capsuleId: capsule.id,
                type: 'capsule_deleted',
                timestamp: new Date().toISOString(),
                details: `Admin ${currentUser.username} deleted capsule: ${capsule.title}`
            });
            
            saveToStorage();
        }
        
        const adminPanel = document.querySelector('.admin-panel');
        if (adminPanel) {
            adminPanel.remove();
            showAdminDashboard();
        }
        
        showToast('Capsule deleted successfully', 'success');
    }
}

// ==================== Admin Investigation Panel ====================

function showInvestigationPanel() {
    if (!checkAdminAccess()) return;
    
    const securityLog = JSON.parse(localStorage.getItem('timeCapsule_securityLog') || '[]');
    const panel = document.createElement('div');
    panel.className = 'investigation-panel';
    panel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 1000px;
        height: 80vh;
        background: var(--dark-card-bg);
        border-radius: 30px;
        box-shadow: 0 20px 60px var(--dark-shadow);
        z-index: 11000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 2px solid var(--dark-accent-primary);
    `;
    
    panel.innerHTML = `
        <div class="investigation-header">
            <h2><i class="fas fa-search"></i> Investigation Panel</h2>
            <button class="close-investigation">&times;</button>
        </div>
        
        <div class="investigation-filters">
            <div class="search-bar">
                <i class="fas fa-search"></i>
                <input type="text" id="investigation-search" placeholder="Search by username...">
            </div>
            <select id="investigation-action">
                <option value="all">All Actions</option>
                <option value="successful_login">Successful Logins</option>
                <option value="failed_login">Failed Attempts</option>
            </select>
        </div>
        
        <div class="investigation-results">
            ${renderInvestigationResults(securityLog)}
        </div>
    `;
    
    document.body.appendChild(panel);
    
    const closeBtn = panel.querySelector('.close-investigation');
    closeBtn.addEventListener('click', () => {
        panel.style.opacity = '0';
        panel.style.transform = 'translate(-50%, -60%)';
        setTimeout(() => panel.remove(), 300);
    });
    
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeBtn.click();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    const searchInput = panel.querySelector('#investigation-search');
    const actionSelect = panel.querySelector('#investigation-action');
    
    function filterResults() {
        const searchTerm = searchInput.value.toLowerCase();
        const action = actionSelect.value;
        
        let filtered = securityLog;
        
        if (searchTerm) {
            filtered = filtered.filter(log => log.username.toLowerCase().includes(searchTerm));
        }
        
        if (action !== 'all') {
            filtered = filtered.filter(log => log.action === action);
        }
        
        panel.querySelector('.investigation-results').innerHTML = renderInvestigationResults(filtered);
    }
    
    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(filterResults, 300);
    });
    
    actionSelect.addEventListener('change', filterResults);
}

function renderInvestigationResults(logs) {
    if (logs.length === 0) {
        return '<p>No activity found matching your criteria</p>';
    }
    
    return logs.map(log => `
        <div class="user-investigation-card">
            <div>
                <strong>${log.username}</strong>
                <span class="timestamp">${new Date(log.timestamp).toLocaleString()}</span>
            </div>
            <div class="action-badge ${log.action.includes('success') ? 'success' : 'failure'}">
                <i class="fas fa-${log.action.includes('success') ? 'check-circle' : 'times-circle'}"></i>
                ${log.details}
            </div>
            <div class="user-agent">
                <i class="fas fa-globe"></i> ${log.userAgent}
            </div>
        </div>
    `).join('');
}

// ==================== Live Countdown Timer Updates ====================

function startLiveCountdownUpdates() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    countdownInterval = setInterval(() => {
        const adminPanel = document.querySelector('.admin-panel');
        if (adminPanel && document.getElementById('capsules-tab')?.classList.contains('active')) {
            updateAllCountdowns();
        }
        
        if (document.getElementById('locked-space')) {
            updateDashboardCountdowns();
        }
    }, 1000);
}

function updateAllCountdowns() {
    const countdownElements = document.querySelectorAll('.capsule-countdown');
    
    countdownElements.forEach(element => {
        const capsuleId = element.dataset.capsuleId;
        const capsule = capsules.find(c => c.id === capsuleId);
        
        if (!capsule) return;
        
        const now = new Date().getTime();
        const unlockTime = new Date(capsule.unlockDate).getTime();
        const timeRemaining = unlockTime - now;
        const timeValueElement = element.querySelector('.time-value');
        
        if (timeRemaining <= 0) {
            timeValueElement.textContent = 'Unlocked';
            element.classList.add('expired');
            element.classList.remove('warning');
            
            const statusBadge = element.closest('.admin-capsule-card')?.querySelector('.capsule-status');
            if (statusBadge && capsule.isLocked) {
                statusBadge.innerHTML = '<i class="fas fa-unlock-alt"></i> Unlocked';
                statusBadge.classList.remove('locked');
                statusBadge.classList.add('unlocked');
                
                capsule.isLocked = false;
                saveToStorage();
            }
        } else {
            const seconds = Math.floor(timeRemaining / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            
            let display = '';
            if (days > 0) {
                display = `${days}d ${hours % 24}h`;
            } else if (hours > 0) {
                display = `${hours}h ${minutes % 60}m`;
            } else if (minutes > 0) {
                display = `${minutes}m ${seconds % 60}s`;
            } else {
                display = `${seconds}s`;
            }
            
            timeValueElement.textContent = display;
            
            if (timeRemaining < 86400000) {
                element.classList.add('warning');
            } else {
                element.classList.remove('warning');
            }
            
            element.classList.remove('expired');
        }
    });
}

function updateDashboardCountdowns() {
    const lockedCapsules = document.querySelectorAll('#locked-space [data-id]');
    
    lockedCapsules.forEach(capsuleCard => {
        const capsuleId = capsuleCard.dataset.id;
        const capsule = capsules.find(c => c.id === capsuleId);
        
        if (!capsule) return;
        
        // Use the class selector we added
        const timeElement = capsuleCard.querySelector('.capsule-timer span');
        if (!timeElement) return;
        
        const now = new Date().getTime();
        const unlockTime = new Date(capsule.unlockDate).getTime();
        const timeRemaining = unlockTime - now;
        
        if (timeRemaining <= 0) {
            capsule.isLocked = false;
            saveToStorage();
            renderAll();
        } else {
            const seconds = Math.floor(timeRemaining / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            
            let display = '';
            if (days > 0) {
                display = `${days}d ${hours % 24}h remaining`;
            } else if (hours > 0) {
                display = `${hours}h ${minutes % 60}m remaining`;
            } else if (minutes > 0) {
                display = `${minutes}m ${seconds % 60}s remaining`;
            } else {
                display = `${seconds}s remaining`;
            }
            
            timeElement.textContent = display;
        }
    });
}

// ==================== Check Deleted User ====================

function checkIfUserDeleted(username) {
    const deletedRecord = deletedUsers.find(record => record.username === username);
    if (deletedRecord) {
        showDeletedUserMessage(deletedRecord);
        return true;
    }
    return false;
}

function showDeletedUserMessage(record) {
    const modal = document.createElement('div');
    modal.className = 'deleted-user-modal';
    modal.innerHTML = `
        <div class="deleted-user-modal-content">
            <i class="fas fa-user-slash" style="font-size: 60px; color: #ff6b6b; margin-bottom: 20px;"></i>
            <h2>Account Deleted</h2>
            <p>Your account "${record.username}" has been deleted.</p>
            <div class="deletion-info">
                <h3>Deletion Details:</h3>
                <p><strong>Date:</strong> ${new Date(record.deletedAt).toLocaleString()}</p>
                <p><strong>Reason:</strong> ${record.reason}</p>
                <p><strong>Capsules lost:</strong> ${record.capsuleCount}</p>
                <p><strong>Account age:</strong> ${record.accountAge}</p>
            </div>
            <p class="deletion-message">If you believe this was a mistake, please contact support.</p>
            <button onclick="this.closest('.deleted-user-modal').remove()">I Understand</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        const errorElement = document.getElementById('error');
        errorElement.textContent = 'This account has been deleted. Please contact support.';
        errorElement.style.color = '#ff6b6b';
    }
}

// ==================== User Profile Popup ====================

// ==================== User Profile Popup ====================

function showUserProfile() {
    if (!currentUser) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'profile-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 11000;
        animation: fadeIn 0.3s ease;
    `;
    
    const popup = document.createElement('div');
    popup.className = 'profile-popup';
    popup.style.cssText = `
        background: var(--dark-card-bg);
        border-radius: 30px;
        padding: 30px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
        border: 2px solid var(--dark-accent-primary);
        box-shadow: 0 20px 60px var(--dark-shadow);
        animation: slideInPopup 0.3s ease;
    `;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'profile-close-btn';
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = `
        position: absolute;
        top: 15px;
        right: 20px;
        font-size: 28px;
        background: none;
        border: none;
        color: var(--dark-text-muted);
        cursor: pointer;
        transition: all 0.3s ease;
        z-index: 10;
    `;
    closeButton.onmouseover = () => {
        closeButton.style.color = 'var(--dark-accent-danger)';
        closeButton.style.transform = 'rotate(90deg)';
    };
    closeButton.onmouseout = () => {
        closeButton.style.color = 'var(--dark-text-muted)';
        closeButton.style.transform = 'rotate(0deg)';
    };
    closeButton.onclick = () => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 300);
    };
    
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }
    };
    
    const userData = users.find(u => u.id === currentUser.id) || currentUser;
    const userCapsules = capsules.filter(c => c.ownerId === currentUser.id);
    const lockedCount = userCapsules.filter(c => c.isLocked).length;
    const unlockedCount = userCapsules.filter(c => !c.isLocked).length;
    const favoriteCount = userCapsules.filter(c => c.isFavorite).length;
    const archivedCount = userCapsules.filter(c => c.isArchived).length;
    
    const reminders = JSON.parse(localStorage.getItem('timeCapsule_reminders') || '[]');
    const userReminders = reminders.filter(r => r.userId === currentUser?.id);
    
    popup.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="font-size: 2rem; margin-bottom: 10px; background: linear-gradient(135deg, var(--dark-accent-primary), var(--dark-accent-secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                <i class="fas fa-user-circle"></i> My Profile
            </h2>
        </div>
        
        <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 25px;">
            <div style="position: relative; width: 120px; height: 120px; margin-bottom: 15px;">
                <img src="${userData.avatar || 'https://via.placeholder.com/120?text=User'}" 
                     alt="Avatar" 
                     style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 3px solid var(--dark-accent-primary);"
                     id="profile-avatar">
                <label for="avatar-upload" style="
                    position: absolute;
                    bottom: 0;
                    right: 0;
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
                ">
                    <i class="fas fa-camera"></i>
                </label>
                <input type="file" id="avatar-upload" accept="image/*" style="display: none;">
            </div>
            <h3 style="font-size: 1.5rem; color: var(--dark-text-primary);">${currentUser.username}</h3>
            <p style="color: var(--dark-text-secondary);">Member since: ${new Date(userData.createdAt).toLocaleDateString()}</p>
        </div>
        
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
        
        <div style="margin-bottom: 20px;">
            <button onclick="document.querySelector('.profile-overlay').remove(); document.getElementById('archived-space')?.scrollIntoView({behavior: 'smooth'});" style="
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
    `;
    
    popup.appendChild(closeButton);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    if (!document.getElementById('popup-animations')) {
        const style = document.createElement('style');
        style.id = 'popup-animations';
        style.textContent = `
            @keyframes slideInPopup {
                from {
                    transform: translateY(-30px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            .profile-overlay {
                transition: opacity 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }
    
    const avatarUpload = document.getElementById('avatar-upload');
    if (avatarUpload) {
        avatarUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
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
                    }
                };
                reader.readAsDataURL(file);
            }
        });
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

// ==================== Capsule Management ====================

function initializeCapsules() {
    if (!currentUser) return;
    
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
    
    checkReminders();
    setInterval(checkReminders, 60000);
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

function applyFilters() {
    renderLockedCapsules();
    renderUnlockedCapsules();
    renderFavorites();
    renderArchivedCapsules();
}

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
        isOpened: false,  // Add this - new capsules haven't been opened yet
        accessAttempts: [],
        ownerId: currentUser.id,
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
    favoritesFilter = false;
    
    const filtered = capsules.filter(c => c.tags && c.tags.includes(tag));
    renderFilteredResults(filtered);
    showToast(`Filtering by tag: #${tag}`, 'info');
}

function renderFilteredResults(filteredCapsules) {
    const lockedContainer = document.getElementById('locked-space');
    const unlockedContainer = document.getElementById('unlocked-space');
    
    if (lockedContainer) {
        lockedContainer.innerHTML = filteredCapsules
            .filter(c => c.isLocked)
            .map(c => createCapsuleCard(c))
            .join('');
    }
    
    if (unlockedContainer) {
        unlockedContainer.innerHTML = filteredCapsules
            .filter(c => !c.isLocked)
            .map(c => createCapsuleCard(c))
            .join('');
    }
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

// ==================== Backup System ====================

function createBackup() {
    const backup = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        users: users,
        capsules: capsules,
        activityLog: activityLog,
        deletedUsers: deletedUsers
    };
    
    const backups = JSON.parse(localStorage.getItem('timeCapsule_backups') || '[]');
    backups.unshift(backup);
    
    if (backups.length > 10) backups.pop();
    
    localStorage.setItem('timeCapsule_backups', JSON.stringify(backups));
    showToast('Backup created successfully', 'success');
    
    const adminPanel = document.querySelector('.admin-panel');
    if (adminPanel) {
        adminPanel.remove();
        showAdminDashboard();
    }
    
    return backup.id;
}

function restoreBackup(backupId) {
    if (!confirm('Restoring a backup will overwrite all current data. Continue?')) return;
    
    const backups = JSON.parse(localStorage.getItem('timeCapsule_backups') || '[]');
    const backup = backups.find(b => b.id === backupId);
    
    if (backup) {
        users = backup.users;
        capsules = backup.capsules;
        activityLog = backup.activityLog;
        deletedUsers = backup.deletedUsers;
        
        saveToStorage();
        showToast('Backup restored successfully', 'success');
        
        if (document.getElementById('locked-space')) {
            location.reload();
        }
    }
}


// ==================== Import/Export Functions ====================

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

// ==================== Rendering Functions ====================

function renderAll() {
    renderStats();
    renderLockedCapsules();
    renderUnlockedCapsules();
    renderFavorites();
    renderPinnedCapsules();
    renderArchivedCapsules();
    renderActivityLog();
    renderTimelineView();
}

function renderStats() {
    const totalElement = document.getElementById('total-capsules');
    const lockedElement = document.getElementById('locked-capsules');
    const unlockedElement = document.getElementById('unlocked-capsules');
    const favoriteElement = document.getElementById('favorite-capsules');
    
    if (totalElement) totalElement.textContent = capsules.filter(c => c.ownerId === currentUser?.id).length;
    if (lockedElement) lockedElement.textContent = capsules.filter(c => c.ownerId === currentUser?.id && c.isLocked).length;
    if (unlockedElement) unlockedElement.textContent = capsules.filter(c => c.ownerId === currentUser?.id && !c.isLocked).length;
    if (favoriteElement) favoriteElement.textContent = capsules.filter(c => c.ownerId === currentUser?.id && c.isFavorite).length;
}

function renderLockedCapsules() {
    const container = document.getElementById('locked-space');
    if (!container) return;
    
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('category-filter')?.value || 'all';
    
    let filtered = capsules.filter(c => c.isLocked && c.ownerId === currentUser?.id && !c.isArchived);
    
    if (searchTerm) {
        filtered = filtered.filter(c => 
            c.title.toLowerCase().includes(searchTerm) ||
            (c.description && c.description.toLowerCase().includes(searchTerm)) ||
            (c.tags && c.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }
    
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(c => c.category === categoryFilter);
    }
    
    if (favoritesFilter) {
        filtered = filtered.filter(c => c.isFavorite);
    }
    
    filtered.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="color: #6b6b8b; text-align: center; padding: 20px;">No locked capsules found</p>';
    } else {
        container.innerHTML = filtered.map(capsule => createCapsuleCard(capsule)).join('');
    }
}

function renderUnlockedCapsules() {
    const container = document.getElementById('unlocked-space');
    if (!container) return;
    
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('category-filter')?.value || 'all';
    
    let filtered = capsules.filter(c => !c.isLocked && c.ownerId === currentUser?.id && !c.isArchived);
    
    if (searchTerm) {
        filtered = filtered.filter(c => 
            c.title.toLowerCase().includes(searchTerm) ||
            (c.description && c.description.toLowerCase().includes(searchTerm)) ||
            (c.tags && c.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }
    
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(c => c.category === categoryFilter);
    }
    
    if (favoritesFilter) {
        filtered = filtered.filter(c => c.isFavorite);
    }
    
    filtered.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="color: #6b6b8b; text-align: center; padding: 20px;">No unlocked capsules found</p>';
    } else {
        container.innerHTML = filtered.map(capsule => createCapsuleCard(capsule)).join('');
    }
}

function renderFavorites() {
    const container = document.getElementById('favorites-space');
    if (!container) return;
    
    const favorites = capsules.filter(c => c.isFavorite && c.ownerId === currentUser?.id && !c.isArchived);
    
    if (favorites.length === 0) {
        container.innerHTML = '<p style="color: #6b6b8b; text-align: center; padding: 20px;">No favorite capsules yet</p>';
    } else {
        container.innerHTML = favorites.map(capsule => createCapsuleCard(capsule)).join('');
    }
}

function renderPinnedCapsules() {
    const container = document.getElementById('pinned-space');
    if (!container) return;
    
    const pinned = capsules.filter(c => c.isPinned && c.ownerId === currentUser?.id && !c.isArchived);
    
    if (pinned.length === 0) {
        container.innerHTML = '<p style="color: #6b6b8b; text-align: center; padding: 20px;">No pinned capsules</p>';
    } else {
        container.innerHTML = pinned.map(capsule => createCapsuleCard(capsule)).join('');
    }
}

// ==================== Handle Opening Capsules ====================

function handleOpenCapsule(capsuleId) {
    console.log('Opening capsule:', capsuleId); // Debug log
    
    // Make sure currentUser exists
    if (!currentUser) {
        showToast('You must be logged in', 'error');
        return;
    }
    
    const capsule = capsules.find(c => c.id === capsuleId);
    if (!capsule) {
        showToast('Capsule not found', 'error');
        return;
    }
    
    const now = new Date().getTime();
    const unlockTime = new Date(capsule.unlockDate).getTime();
    
    // Initialize accessAttempts if it doesn't exist
    capsule.accessAttempts = capsule.accessAttempts || [];
    capsule.accessAttempts.push({
        timestamp: new Date().toISOString(),
        success: now >= unlockTime
    });
    
    // Check if capsule is still locked
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
    
    // Initialize isOpened property if it doesn't exist
    if (capsule.isOpened === undefined) {
        capsule.isOpened = false;
    }
    
    const isFirstTimeOpening = !capsule.isOpened;
    
    // Show the capsule content
    showCapsuleContent(capsule);
    
    // Unlock the capsule if it's still locked
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
    
    // If this is the first time opening, show confetti and mark as opened
    if (isFirstTimeOpening) {
        capsule.isOpened = true;
        
        // Show confetti animation
        showConfetti();
        showToast('🎉 Capsule opened for the first time! Congratulations!', 'success', 5000);
        
        activityLog.unshift({
            id: generateId(),
            capsuleId: capsule.id,
            type: 'first_opened',
            timestamp: new Date().toISOString(),
            details: `✨ First time opening capsule: ${capsule.title}`
        });
        
        saveToStorage();
    }
    
    // Re-render the view to update any UI changes
    renderAll();
}

function renderArchivedCapsules() {
    const container = document.getElementById('archived-space');
    if (!container) return;
    
    const archived = capsules.filter(c => c.isArchived && c.ownerId === currentUser?.id);
    
    if (archived.length === 0) {
        container.innerHTML = '<p class="empty-archive"><i class="fas fa-archive"></i> No archived capsules</p>';
    } else {
        container.innerHTML = archived.map(capsule => `
            <div style="
                background: #1e1e36;
                border-radius: 15px;
                padding: 20px;
                border: 1px solid #6b6b8b;
                opacity: 0.7;
                transition: all 0.3s ease;
                position: relative;
            " data-id="${capsule.id}">
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: #6b6b8b;
                "></div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span style="
                        background: #6b6b8b;
                        color: white;
                        padding: 5px 10px;
                        border-radius: 20px;
                        font-size: 12px;
                        text-transform: capitalize;
                    ">${capsule.category}</span>
                    <i class="fas fa-archive" style="color: #6b6b8b;"></i>
                </div>
                
                <h3 style="color: white; margin-bottom: 10px;">${capsule.title}</h3>
                <p style="color: #b8b8d4; font-size: 14px; margin-bottom: 15px;">${capsule.description || 'No description'}</p>
                
                <div style="color: #6b6b8b; font-size: 13px; margin-bottom: 15px;">
                    <i class="fas fa-calendar-alt"></i> Created: ${new Date(capsule.createdAt).toLocaleDateString()}
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button onclick="handleOpenCapsule('${capsule.id}')" style="
                        flex: 1;
                        padding: 10px;
                        background: #6b6b8b;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 5px;
                    ">
                        <i class="fas fa-${capsule.isLocked ? 'lock' : 'unlock'}"></i> ${capsule.isLocked ? 'View (Locked)' : 'Read'}
                    </button>
                    <button onclick="unarchiveCapsule('${capsule.id}')" style="
                        padding: 10px;
                        background: var(--dark-accent-primary);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                    ">
                        <i class="fas fa-undo"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
}

function renderTimelineView() {
    const container = document.getElementById('timeline-view');
    if (!container) return;
    
    const userCapsules = capsules.filter(c => c.ownerId === currentUser?.id)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    container.innerHTML = userCapsules.map(capsule => `
        <div class="timeline-item">
            <div class="timeline-date">${new Date(capsule.createdAt).toLocaleDateString()}</div>
            <div class="timeline-content" onclick="handleOpenCapsule('${capsule.id}')">
                <h4>${capsule.title}</h4>
                <p>${capsule.description || ''}</p>
                <span class="capsule-status ${capsule.isLocked ? 'locked' : 'unlocked'}">
                    ${capsule.isLocked ? '🔒 Locked' : '🔓 Unlocked'}
                </span>
            </div>
        </div>
    `).join('');
}

function renderActivityLog() {
    const container = document.getElementById('activity-list');
    if (!container) return;
    
    const userActivity = activityLog.filter(log => 
        log.details.includes(currentUser?.username) || (log.capsuleId && 
        capsules.some(c => c.id === log.capsuleId && c.ownerId === currentUser?.id))
    );
    
    if (userActivity.length === 0) {
        container.innerHTML = '<p style="color: #6b6b8b; text-align: center; padding: 20px;">No activity yet</p>';
        return;
    }
    
    container.innerHTML = userActivity.slice(0, 10).map(activity => `
        <div style="
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            background: #1e1e36;
            border-radius: 10px;
            border-left: 4px solid ${activity.type.includes('self_destruct') ? '#ff6b6b' : '#6c5ce7'};
            margin-bottom: 10px;
        ">
            <i class="fas fa-${getActivityIcon(activity.type)}" style="
                font-size: 20px;
                color: ${activity.type.includes('self_destruct') ? '#ff6b6b' : '#6c5ce7'};
            "></i>
            <div style="flex: 1;">
                <div style="font-weight: 500;">${activity.details}</div>
                <div style="color: #6b6b8b; font-size: 12px;">${new Date(activity.timestamp).toLocaleString()}</div>
            </div>
        </div>
    `).join('');
}

function createCapsuleCard(capsule) {
    const now = new Date().getTime();
    const unlockTime = new Date(capsule.unlockDate).getTime();
    const timeRemaining = unlockTime - now;
    const progress = Math.min(100, Math.max(0, ((now - new Date(capsule.createdAt).getTime()) / (unlockTime - new Date(capsule.createdAt).getTime())) * 100));
    const attempts = capsule.accessAttempts?.length || 0;
    const prematureAttempts = capsule.accessAttempts?.filter(a => !a.success).length || 0;
    
    return `
        <div class="capsule-flip-container" style="perspective: 1000px;">
            <div class="capsule-card" style="
                background: #1e1e36;
                border-radius: 15px;
                padding: 20px;
                border: 2px solid ${capsule.isFavorite ? '#feca57' : capsule.isPinned ? '#6c5ce7' : '#2d2d4a'};
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
                min-height: 380px;
                display: flex;
                flex-direction: column;
            " data-id="${capsule.id}">
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(135deg, ${capsule.isPinned ? '#feca57' : '#6c5ce7'}, ${capsule.isPinned ? '#ff9f43' : '#00d2d3'});
                "></div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span style="
                        background: #6c5ce7;
                        color: white;
                        padding: 5px 10px;
                        border-radius: 20px;
                        font-size: 12px;
                        text-transform: capitalize;
                        display: inline-block;
                    ">${capsule.category}</span>
                    <div style="display: flex; gap: 5px; min-width: 60px; justify-content: flex-end;">
                        <button onclick="toggleFavorite('${capsule.id}')" style="
                            background: none;
                            border: none;
                            color: ${capsule.isFavorite ? '#feca57' : '#6b6b8b'};
                            font-size: 18px;
                            cursor: pointer;
                            padding: 0 5px;
                            z-index: 10;
                        ">
                            <i class="fa${capsule.isFavorite ? 's' : 'r'} fa-star"></i>
                        </button>
                        <button onclick="togglePin('${capsule.id}')" style="
                            background: none;
                            border: none;
                            color: ${capsule.isPinned ? '#6c5ce7' : '#6b6b8b'};
                            font-size: 18px;
                            cursor: pointer;
                            padding: 0 5px;
                            z-index: 10;
                        ">
                            <i class="fas fa-thumbtack"></i>
                        </button>
                    </div>
                </div>
                
                <h3 style="color: white; margin-bottom: 10px; font-size: 1.2rem; line-height: 1.4;">${capsule.title}</h3>
                <p style="color: #b8b8d4; font-size: 14px; margin-bottom: 15px; line-height: 1.5; flex: 1;">${capsule.description || 'No description'}</p>
                
                ${capsule.tags && capsule.tags.length > 0 ? `
                    <div style="margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 5px;">
                        ${capsule.tags.map(tag => `
                            <span class="tag" onclick="event.stopPropagation(); filterByTag('${tag}')" style="
                                background: #2d2d4a;
                                color: #b8b8d4;
                                padding: 3px 8px;
                                border-radius: 15px;
                                font-size: 11px;
                                cursor: pointer;
                                transition: all 0.3s ease;
                            ">#${tag}</span>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div style="color: #6b6b8b; font-size: 13px; margin-bottom: 5px;">
                    <i class="fas fa-calendar-alt" style="width: 16px; display: inline-block;"></i> Created: ${new Date(capsule.createdAt).toLocaleDateString()}
                </div>
                <div style="color: #6b6b8b; font-size: 13px; margin-bottom: 5px; display: flex; align-items: center; gap: 4px;">
                    <i class="fas fa-clock" style="width: 16px; display: inline-block;"></i> 
                    <span>Unlocks: ${new Date(capsule.unlockDate).toLocaleString()}</span>
                </div>
                
                ${capsule.isLocked ? `
                    <div class="capsule-timer" style="color: #feca57; font-size: 13px; margin-bottom: 15px; display: flex; align-items: center; gap: 4px;">
                        <i class="fas fa-hourglass-half" style="width: 16px; display: inline-block;"></i>
                        <span>${formatTimeRemaining(timeRemaining)} remaining</span>
                    </div>
                ` : ''}
                
                <div class="progress-container" style="margin-bottom: 15px; width: 100%;">
                    <div class="progress-bar-fill" style="width: ${progress}%; height: 8px; background: linear-gradient(135deg, #6c5ce7, #00d2d3); border-radius: 4px;"></div>
                </div>
                
                ${capsule.isLocked ? `
                    <div style="display: flex; gap: 10px; margin-top: 5px;">
                        <button onclick="handleOpenCapsule('${capsule.id}')" style="
                            flex: 1;
                            padding: 12px 10px;
                            background: linear-gradient(135deg, #6c5ce7, #00d2d3);
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 600;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            transition: all 0.3s ease;
                            box-shadow: 0 4px 10px rgba(108, 92, 231, 0.3);
                        "
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 15px rgba(108, 92, 231, 0.4)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 10px rgba(108, 92, 231, 0.3)';">
                            <i class="fas fa-lock" style="font-size: 14px;"></i> Open (${attempts}/3)
                        </button>
                        <button onclick="archiveCapsule('${capsule.id}')" style="
                            padding: 12px 15px;
                            background: #6b6b8b;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 600;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.3s ease;
                            box-shadow: 0 4px 10px rgba(107, 107, 139, 0.3);
                        "
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.background='#7c7ca0';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.background='#6b6b8b';">
                            <i class="fas fa-archive"></i>
                        </button>
                    </div>
                    ${prematureAttempts > 0 ? `
                        <div style="margin-top: 10px; font-size: 12px; color: #ff6b6b; display: flex; align-items: center; gap: 5px;">
                            <i class="fas fa-exclamation-triangle"></i> ${prematureAttempts} premature ${prematureAttempts === 1 ? 'attempt' : 'attempts'}
                        </div>
                    ` : ''}
                ` : `
                    <div style="display: flex; gap: 10px; margin-top: 5px;">
                        <button onclick="handleOpenCapsule('${capsule.id}')" style="
                            flex: 1;
                            padding: 12px 10px;
                            background: linear-gradient(135deg, #1dd1a1, #10ac84);
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 600;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            transition: all 0.3s ease;
                            box-shadow: 0 4px 10px rgba(29, 209, 161, 0.3);
                        "
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 15px rgba(29, 209, 161, 0.4)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 10px rgba(29, 209, 161, 0.3)';">
                            <i class="fas fa-unlock-alt" style="font-size: 14px;"></i> Read
                        </button>
                        <button onclick="archiveCapsule('${capsule.id}')" style="
                            padding: 12px 15px;
                            background: #6b6b8b;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 600;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.3s ease;
                            box-shadow: 0 4px 10px rgba(107, 107, 139, 0.3);
                        "
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.background='#7c7ca0';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.background='#6b6b8b';">
                            <i class="fas fa-archive"></i>
                        </button>
                    </div>
                `}
            </div>
        </div>
    `;
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

function deleteCapsule(capsuleId) {
    showToast('Only admins can delete capsules', 'error');
}

// ==================== Self-Destruct Functions ====================

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

// ==================== Helper Functions ====================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function getActivityIcon(type) {
    const icons = {
        'capsule_created': 'plus-circle',
        'capsule_unlocked': 'unlock-alt',
        'capsule_deleted': 'trash',
        'capsule_archived': 'archive',
        'capsule_unarchived': 'box-open',
        'self_destruct': 'skull-crossbow',
        'self_destruct_warning': 'exclamation-triangle',
        'login': 'sign-in-alt',
        'logout': 'sign-out-alt',
        'signup': 'user-plus',
        'favorite_added': 'star',
        'favorite_removed': 'star-half-alt',
        'pinned': 'thumbtack',
        'unpinned': 'thumbtack',
        'user_deleted': 'user-slash'
    };
    return icons[type] || 'info-circle';
}

// ==================== Confetti Animation ====================

// ==================== Confetti Animation ====================

function showConfetti() {
    console.log('Showing confetti!'); // Debug log
    
    const colors = ['#6c5ce7', '#00d2d3', '#feca57', '#ff6b6b', '#1dd1a1', '#f368e0', '#54a0ff'];
    
    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            // Random styles
            const color = colors[Math.floor(Math.random() * colors.length)];
            const left = Math.random() * 100;
            const size = Math.random() * 10 + 5;
            const duration = Math.random() * 3 + 2;
            const delay = Math.random() * 2;
            
            confetti.style.cssText = `
                position: fixed;
                left: ${left}vw;
                top: -20px;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
                opacity: ${Math.random() * 0.7 + 0.3};
                z-index: 10001;
                pointer-events: none;
                transform: rotate(${Math.random() * 360}deg);
                animation: confettiFall ${duration}s ease-in forwards;
                animation-delay: ${delay}s;
            `;
            
            document.body.appendChild(confetti);
            
            // Remove after animation
            setTimeout(() => {
                if (confetti.parentNode) confetti.remove();
            }, (duration + delay) * 1000);
        }, i * 20); // Stagger the confetti creation
    }
}


function formatTimeRemaining(ms) {
    if (ms <= 0) return 'Unlocked';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

function startCountdownUpdates() {
    setInterval(() => {
        let needsUpdate = false;
        
        capsules.forEach(capsule => {
            if (capsule.isLocked) {
                const now = new Date().getTime();
                const unlockTime = new Date(capsule.unlockDate).getTime();
                
                if (now >= unlockTime) {
                    capsule.isLocked = false;
                    needsUpdate = true;
                    
                    activityLog.unshift({
                        id: generateId(),
                        capsuleId: capsule.id,
                        type: 'capsule_unlocked',
                        timestamp: new Date().toISOString(),
                        details: `🔓 Capsule automatically unlocked: ${capsule.title}`
                    });
                    
                    saveToStorage();
                }
            }
        });
        
        if (needsUpdate && document.getElementById('locked-space')) {
            renderAll();
        }
    }, 1000);
}


// ==================== Initialize Everything ====================

document.addEventListener('DOMContentLoaded', function() {
    loadFromStorage();
    initializeAuth();
    initializePasswordStrength();
    initializeToastContainer();
    
    if (document.getElementById('locked-space')) {
        initializeCapsules();
    }
    
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            document.getElementById('meme-modal').style.display = 'none';
        });
    }
});

// Make functions globally available
window.handleOpenCapsule = handleOpenCapsule;
window.toggleFavorite = toggleFavorite;
window.togglePin = togglePin;
window.archiveCapsule = archiveCapsule;
window.unarchiveCapsule = unarchiveCapsule;
window.deleteCapsule = deleteCapsule;
window.triggerSelfDestruct = triggerSelfDestruct;
window.showDeleteUserModal = showDeleteUserModal;
window.viewCapsuleDetails = viewCapsuleDetails;
window.adminDeleteCapsule = adminDeleteCapsule;
window.addTagToCapsule = addTagToCapsule;
window.removeTagFromCapsule = removeTagFromCapsule;
window.filterByTag = filterByTag;
window.addReaction = addReaction;
window.copyShareLink = copyShareLink;
window.showVersionHistory = showVersionHistory;
window.restoreVersion = restoreVersion;
window.createBackup = createBackup;
window.restoreBackup = restoreBackup;
window.showUserProfile = showUserProfile;
window.saveReminderFromPopup = saveReminderFromPopup;
window.deleteReminder = deleteReminder;
window.showConfetti = showConfetti;
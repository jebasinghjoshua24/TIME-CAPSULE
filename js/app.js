// ==================== Initialize Toast Container ====================
function initializeToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
}

// ==================== Initialize Password Strength ====================
function initializePasswordStrength() {
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function(e) {
            const strength = checkPasswordStrength(e.target.value);
            let indicator = document.getElementById('password-strength');
            
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'password-strength';
                indicator.className = 'password-strength';
                passwordInput.parentNode.insertBefore(indicator, passwordInput.nextSibling);
            }
            
            indicator.className = `password-strength strength-${strength.level}`;
            indicator.textContent = strength.message;
        });
    }
}

// ==================== Check Password Strength ====================
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

// ==================== Load from Storage ====================
function loadFromStorage() {
    // Users
    const storedUsers = localStorage.getItem('timeCapsule_users');
    if (storedUsers) {
        users = JSON.parse(storedUsers);
        
        // Ensure admin exists
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
    
    // Capsules
    const storedCapsules = localStorage.getItem('timeCapsule_capsules');
    if (storedCapsules) {
        capsules = JSON.parse(storedCapsules);
    } else {
        capsules = [...sampleCapsules];
        saveToStorage();
    }
    
    // Activity Log
    const storedActivity = localStorage.getItem('timeCapsule_activity');
    if (storedActivity) {
        activityLog = JSON.parse(storedActivity);
    }
    
    // Deleted Users
    const storedDeleted = localStorage.getItem('timeCapsule_deletedUsers');
    if (storedDeleted) {
        deletedUsers = JSON.parse(storedDeleted);
    }
    
    // Deleted Capsules
    const storedDeletedCapsules = localStorage.getItem('timeCapsule_deletedCapsules');
    if (storedDeletedCapsules) {
        deletedCapsules = JSON.parse(storedDeletedCapsules);
    }
    
    // Friend System
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
    
    // Opened Capsules Tracking
    const storedOpened = localStorage.getItem('timeCapsule_openedCapsules');
    if (storedOpened) {
        openedCapsules = JSON.parse(storedOpened);
    }
    
    // Login Attempts (session only)
    const storedAttempts = sessionStorage.getItem('loginAttempts');
    if (storedAttempts) {
        loginAttempts = JSON.parse(storedAttempts);
    }
}

// ==================== Save to Storage ====================
function saveToStorage() {
    localStorage.setItem('timeCapsule_users', JSON.stringify(users));
    localStorage.setItem('timeCapsule_capsules', JSON.stringify(capsules));
    localStorage.setItem('timeCapsule_activity', JSON.stringify(activityLog));
    localStorage.setItem('timeCapsule_deletedUsers', JSON.stringify(deletedUsers));
    localStorage.setItem('timeCapsule_deletedCapsules', JSON.stringify(deletedCapsules));
    localStorage.setItem('timeCapsule_friends', JSON.stringify(friends));
    localStorage.setItem('timeCapsule_friendRequests', JSON.stringify(friendRequests));
    localStorage.setItem('timeCapsule_notifications', JSON.stringify(notifications));
    localStorage.setItem('timeCapsule_openedCapsules', JSON.stringify(openedCapsules));
}

// ==================== Generate ID ====================
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ==================== Initialize Everything ====================
document.addEventListener('DOMContentLoaded', function() {
    // Load all data from storage
    loadFromStorage();
    
    // Initialize systems
    initializeAuth();
    initializePasswordStrength();
    initializeToastContainer();
    
    // Check if on homepage
    if (document.getElementById('locked-space')) {
        initializeCapsules();
    }
    
    // Meme modal close button
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            document.getElementById('meme-modal').style.display = 'none';
        });
    }

    if (typeof startBanChecker === 'function') {
        startBanChecker();
    }
});

// ==================== Page Transition Reveal ====================
document.addEventListener('DOMContentLoaded', function() {
    // Check if we just came from loading page
    const fromLoading = sessionStorage.getItem('fromLoading');
    if (fromLoading === 'true') {
        const overlay = document.getElementById('transition-overlay');
        if (overlay) {
            // Make sure overlay is visible and start reveal animation
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'none';
            overlay.classList.add('reveal');
            
            // Remove the flag
            sessionStorage.removeItem('fromLoading');
            
            // Clean up after animation
            setTimeout(() => {
                overlay.classList.remove('reveal');
                overlay.style.opacity = '0';
            }, 500);
        }
    }
});

// Make global variables available to other files
window.currentUser = currentUser;
window.capsules = capsules;
window.users = users;
window.activityLog = activityLog;
window.deletedUsers = deletedUsers;
window.deletedCapsules = deletedCapsules;
window.friendRequests = friendRequests;
window.friends = friends;
window.openedCapsules = openedCapsules;
window.notifications = notifications;
window.favoritesFilter = favoritesFilter;
window.loginAttempts = loginAttempts;
window.lockedAccounts = lockedAccounts;
window.autoSaveTimer = autoSaveTimer;
window.hasUnsavedChanges = hasUnsavedChanges;
window.toastContainer = toastContainer;
window.countdownInterval = countdownInterval;
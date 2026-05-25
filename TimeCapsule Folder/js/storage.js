// storage.js - All localStorage operations

// ==================== Load Data ====================
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

// ==================== Save Data ====================
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

// Export functions
window.loadFromStorage = loadFromStorage;
window.saveToStorage = saveToStorage;
window.createBackup = createBackup;
window.restoreBackup = restoreBackup;
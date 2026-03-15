// userbase.js - User Discovery and Friend Management

// ==================== Global Variables ====================
let currentFilter = 'all';
let searchTimeout = null;
let cachedUsers = [];

// ==================== Initialize User Base ====================
function initializeUserBase() {
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    loadUsers();
    updateStats();
    setupEventListeners();
}

// ==================== Load Users ====================
function loadUsers() {
    // Get all users except current user
    cachedUsers = (users || []).filter(u => u.id !== currentUser?.id);
    renderUsers(cachedUsers);
}

// ==================== Render Users Grid ====================
function renderUsers(usersToRender) {
    const grid = document.getElementById('users-grid');
    if (!grid) return;
    
    if (!usersToRender || usersToRender.length === 0) {
        grid.innerHTML = `
            <div class="userbase-empty">
                <i class="fas fa-user-slash"></i>
                <h3>No users found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = usersToRender.map(user => {
        const relationship = getUserRelationship(user.id);
        const friendStatus = getFriendStatusBadge(relationship);
        const userCapsules = capsules.filter(c => c.ownerId === user.id).length;
        const mutualFriends = getMutualFriendsCount(user.id);
        
        return `
        <div class="userbase-card ${relationship.status}" data-user-id="${user.id}">
            ${friendStatus}
            
            <div class="userbase-card-header">
                <div class="userbase-avatar">
                    ${user.username.charAt(0).toUpperCase()}
                </div>
                <div class="userbase-info">
                    <h3>
                        ${user.username}
                        ${user.isAdmin ? '<i class="fas fa-crown" style="color: #feca57;" title="Admin"></i>' : ''}
                    </h3>
                    <div class="user-meta">
                        <span><i class="fas fa-calendar-alt"></i> ${new Date(user.createdAt).toLocaleDateString()}</span>
                        <span><i class="fas fa-capsules"></i> ${userCapsules} capsules</span>
                    </div>
                </div>
            </div>
            
            <div class="userbase-stats-grid">
                <div class="userbase-stat-item">
                    <div class="stat-value">${mutualFriends}</div>
                    <div class="stat-label">Mutual</div>
                </div>
                <div class="userbase-stat-item">
                    <div class="stat-value">${userCapsules}</div>
                    <div class="stat-label">Capsules</div>
                </div>
                <div class="userbase-stat-item">
                    <div class="stat-value">${user.isOnline ? '🟢' : '⚪'}</div>
                    <div class="stat-label">Status</div>
                </div>
            </div>
            
            <div class="userbase-bio">
                ${user.bio || 'No bio yet. 🌟'}
            </div>
            
            <div class="userbase-actions">
                ${getActionButtons(user.id, relationship)}
            </div>
        </div>
    `}).join('');
}

// ==================== Get User Relationship ====================
function getUserRelationship(userId) {
    // Check if already friends
    const isFriend = friends.some(f => 
        (f.userId1 === currentUser.id && f.userId2 === userId) ||
        (f.userId2 === currentUser.id && f.userId1 === userId)
    );
    
    if (isFriend) {
        return { status: 'friend', text: 'Friends', action: 'remove' };
    }
    
    // Check if sent request pending
    const sentRequest = friendRequests.find(r => 
        r.fromUserId === currentUser.id && r.toUserId === userId && r.status === 'pending'
    );
    
    if (sentRequest) {
        return { status: 'pending', text: 'Request Sent', action: 'cancel', requestId: sentRequest.id };
    }
    
    // Check if received request pending
    const receivedRequest = friendRequests.find(r => 
        r.toUserId === currentUser.id && r.fromUserId === userId && r.status === 'pending'
    );
    
    if (receivedRequest) {
        return { status: 'received', text: 'Accept Request', action: 'respond', requestId: receivedRequest.id };
    }
    
    return { status: 'none', text: 'Add Friend', action: 'add' };
}

// ==================== Get Friend Status Badge ====================
function getFriendStatusBadge(relationship) {
    switch(relationship.status) {
        case 'friend':
            return `<span class="userbase-status friend"><i class="fas fa-check-circle"></i> Friends</span>`;
        case 'pending':
            return `<span class="userbase-status pending"><i class="fas fa-clock"></i> Pending</span>`;
        case 'received':
            return `<span class="userbase-status received"><i class="fas fa-inbox"></i> Request</span>`;
        default:
            return '';
    }
}

// ==================== Get Action Buttons ====================
function getActionButtons(userId, relationship) {
    switch(relationship.status) {
        case 'friend':
            return `
                <button class="userbase-btn userbase-btn-danger" onclick="removeFriend('${userId}')">
                    <i class="fas fa-user-minus"></i> Unfriend
                </button>
                <button class="userbase-btn userbase-btn-primary" onclick="viewUserProfile('${userId}')">
                    <i class="fas fa-eye"></i> View
                </button>
            `;
            
        case 'pending':
            return `
                <button class="userbase-btn userbase-btn-warning" onclick="cancelFriendRequest('${relationship.requestId}')">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="userbase-btn userbase-btn-primary" onclick="viewUserProfile('${userId}')" disabled>
                    <i class="fas fa-eye"></i> View
                </button>
            `;
            
        case 'received':
            return `
                <button class="userbase-btn userbase-btn-success" onclick="acceptFriendRequest('${relationship.requestId}')">
                    <i class="fas fa-check"></i> Accept
                </button>
                <button class="userbase-btn userbase-btn-danger" onclick="declineFriendRequest('${relationship.requestId}')">
                    <i class="fas fa-times"></i> Decline
                </button>
            `;
            
        default:
            return `
                <button class="userbase-btn userbase-btn-primary" onclick="sendFriendRequest('${userId}', '${getUsername(userId)}')">
                    <i class="fas fa-user-plus"></i> Add Friend
                </button>
                <button class="userbase-btn userbase-btn-secondary" onclick="viewUserProfile('${userId}')">
                    <i class="fas fa-eye"></i> View
                </button>
            `;
    }
}

// ==================== Get Username by ID ====================
function getUsername(userId) {
    const user = users.find(u => u.id === userId);
    return user ? user.username : 'Unknown';
}

// ==================== Get Mutual Friends Count ====================
function getMutualFriendsCount(userId) {
    const userFriends = friends.filter(f => f.userId1 === userId || f.userId2 === userId)
        .map(f => f.userId1 === userId ? f.userId2 : f.userId1);
    
    const currentUserFriends = friends.filter(f => f.userId1 === currentUser.id || f.userId2 === currentUser.id)
        .map(f => f.userId1 === currentUser.id ? f.userId2 : f.userId1);
    
    return userFriends.filter(id => currentUserFriends.includes(id)).length;
}

// ==================== Send Friend Request ====================
function sendFriendRequest(userId, username) {
    if (typeof window.showAddFriendModal === 'function') {
        // Use existing modal if available
        window.showAddFriendModal();
        document.getElementById('friend-username').value = username;
    } else {
        // Show custom modal
        showFriendRequestModal(userId, username);
    }
}

// ==================== Show Friend Request Modal ====================
function showFriendRequestModal(userId, username) {
    const modal = document.getElementById('friend-request-modal');
    const content = document.getElementById('friend-request-content');
    
    const user = users.find(u => u.id === userId);
    
    content.innerHTML = `
        <div class="friend-request-preview">
            <div class="userbase-avatar">${username.charAt(0).toUpperCase()}</div>
            <div class="preview-info">
                <h4>${username}</h4>
                <p>${user?.bio || 'No bio available'}</p>
            </div>
        </div>
        <p style="margin: 1rem 0; color: var(--dark-text-secondary);">
            Send friend request to ${username}?
        </p>
        <div style="display: flex; gap: 1rem;">
            <button class="userbase-btn userbase-btn-primary" style="flex: 1;" onclick="confirmSendRequest('${userId}')">
                <i class="fas fa-paper-plane"></i> Send Request
            </button>
            <button class="userbase-btn userbase-btn-danger" style="flex: 1;" onclick="closeFriendRequestModal()">
                <i class="fas fa-times"></i> Cancel
            </button>
        </div>
    `;
    
    modal.style.display = 'block';
}

// ==================== Confirm Send Request ====================
function confirmSendRequest(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // Check if already friends
    const alreadyFriends = friends.some(f => 
        (f.userId1 === currentUser.id && f.userId2 === userId) ||
        (f.userId1 === userId && f.userId2 === currentUser.id)
    );
    
    if (alreadyFriends) {
        showToast('You are already friends with this user', 'info');
        closeFriendRequestModal();
        return;
    }
    
    // Check if request already exists
    const existingRequest = friendRequests.find(r => 
        (r.fromUserId === currentUser.id && r.toUserId === userId && r.status === 'pending') ||
        (r.fromUserId === userId && r.toUserId === currentUser.id && r.status === 'pending')
    );
    
    if (existingRequest) {
        showToast('A friend request already exists', 'info');
        closeFriendRequestModal();
        return;
    }
    
    // Create request
    const request = {
        id: generateId(),
        fromUserId: currentUser.id,
        fromUsername: currentUser.username,
        toUserId: userId,
        toUsername: user.username,
        status: 'pending',
        timestamp: new Date().toISOString()
    };
    
    friendRequests.push(request);
    
    // Add notification
    notifications.push({
        id: generateId(),
        userId: userId,
        type: 'friend_request',
        message: `${currentUser.username} sent you a friend request`,
        requestId: request.id,
        read: false,
        timestamp: new Date().toISOString()
    });
    
    saveToStorage();
    
    showToast(`Friend request sent to ${user.username}`, 'success');
    closeFriendRequestModal();
    
    // Refresh the user list
    applyFilters();
}

// ==================== Accept Friend Request ====================
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
    
    // Add notification
    notifications.push({
        id: generateId(),
        userId: request.fromUserId,
        type: 'friend_accepted',
        message: `${currentUser.username} accepted your friend request`,
        read: false,
        timestamp: new Date().toISOString()
    });
    
    saveToStorage();
    showToast(`You are now friends with ${request.fromUsername}`, 'success');
    
    // Refresh
    applyFilters();
    updateStats();
}

// ==================== Decline Friend Request ====================
function declineFriendRequest(requestId) {
    const index = friendRequests.findIndex(r => r.id === requestId);
    if (index !== -1) {
        const request = friendRequests[index];
        friendRequests.splice(index, 1);
        
        showToast(`Friend request from ${request.fromUsername} declined`, 'info');
        saveToStorage();
        
        // Refresh
        applyFilters();
    }
}

// ==================== Cancel Friend Request ====================
function cancelFriendRequest(requestId) {
    const index = friendRequests.findIndex(r => r.id === requestId);
    if (index !== -1) {
        friendRequests.splice(index, 1);
        showToast('Friend request cancelled', 'info');
        saveToStorage();
        
        // Refresh
        applyFilters();
    }
}

// ==================== Remove Friend ====================
function removeFriend(userId) {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    
    // Remove friendship
    const index = friends.findIndex(f => 
        (f.userId1 === currentUser.id && f.userId2 === userId) ||
        (f.userId2 === currentUser.id && f.userId1 === userId)
    );
    
    if (index !== -1) {
        friends.splice(index, 1);
        showToast('Friend removed', 'info');
        saveToStorage();
        
        // Refresh
        applyFilters();
        updateStats();
    }
}

// ==================== View User Profile ====================
function viewUserProfile(userId) {
    if (typeof window.viewFriendProfile === 'function') {
        window.viewFriendProfile(userId);
    } else {
        showToast('Profile view coming soon!', 'info');
    }
}

// ==================== Close Friend Request Modal ====================
function closeFriendRequestModal() {
    document.getElementById('friend-request-modal').style.display = 'none';
}

// ==================== Apply Filters and Search ====================
function applyFilters() {
    let filtered = [...cachedUsers];
    const searchTerm = document.getElementById('user-search')?.value.toLowerCase() || '';
    
    // Apply search
    if (searchTerm) {
        filtered = filtered.filter(u => 
            u.username.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply relationship filter
    switch(currentFilter) {
        case 'friends':
            filtered = filtered.filter(u => {
                const rel = getUserRelationship(u.id);
                return rel.status === 'friend';
            });
            break;
        case 'pending':
            filtered = filtered.filter(u => {
                const rel = getUserRelationship(u.id);
                return rel.status === 'pending';
            });
            break;
        case 'received':
            filtered = filtered.filter(u => {
                const rel = getUserRelationship(u.id);
                return rel.status === 'received';
            });
            break;
        case 'new':
            filtered = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 10);
            break;
        default:
            // all users
            break;
    }
    
    renderUsers(filtered);
}

// ==================== Update Stats ====================
function updateStats() {
    document.getElementById('total-users').textContent = users?.length || 0;
    document.getElementById('your-friends').textContent = friends.filter(f => 
        f.userId1 === currentUser?.id || f.userId2 === currentUser?.id
    ).length || 0;
    document.getElementById('online-users').textContent = 
        Math.floor(Math.random() * 20) + 10; // Simulated online count
}

// ==================== Setup Event Listeners ====================
function setupEventListeners() {
    // Search input with debounce
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(applyFilters, 300);
        });
    }
    
    // Filter tags
    document.querySelectorAll('.userbase-filter-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            document.querySelectorAll('.userbase-filter-tag').forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            currentFilter = tag.dataset.filter;
            applyFilters();
        });
    });
}

// ==================== Show Toast ====================
function showToast(message, type = 'info') {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        alert(message);
    }
}

// ==================== Initialize on Page Load ====================
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    initializeUserBase();
});

// Export functions
window.sendFriendRequest = sendFriendRequest;
window.acceptFriendRequest = acceptFriendRequest;
window.declineFriendRequest = declineFriendRequest;
window.cancelFriendRequest = cancelFriendRequest;
window.removeFriend = removeFriend;
window.viewUserProfile = viewUserProfile;
window.closeFriendRequestModal = closeFriendRequestModal;
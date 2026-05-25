// ui.js - All DOM rendering and UI updates

// ==================== Main Render ====================
// Add to ui.js
function renderCollaborativeCapsules() {
    const container = document.getElementById('collaborative-space');
    if (!container) return;
    
    const collaborativeCaps = getCollaborativeCapsules(currentUser?.id)
        .filter(c => c.ownerId !== currentUser?.id); // Don't show own capsules here
    
    if (collaborativeCaps.length === 0) {
        container.innerHTML = '<p style="color: var(--dark-text-muted); text-align: center; padding: 20px;">No collaborative capsules yet</p>';
        return;
    }
    
    container.innerHTML = collaborativeCaps.map(capsule => {
        const owner = users.find(u => u.id === capsule.ownerId);
        
        return `
        <div class="capsule-card" style="border-color: #feca57;">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(135deg, #feca57, #ff9f43);"></div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="background: #feca57; color: white; padding: 3px 10px; border-radius: 15px; font-size: 11px;">
                    <i class="fas fa-users"></i> Collaborative
                </span>
                <span style="color: #feca57; font-size: 12px;">
                    <i class="fas fa-user"></i> ${owner?.username}
                </span>
            </div>
            
            <h3 style="color: white; margin-bottom: 10px;">${capsule.title}</h3>
            <p style="color: #b8b8d4; font-size: 14px; margin-bottom: 15px;">${capsule.description || ''}</p>
            
            <div style="color: #6b6b8b; font-size: 13px; margin-bottom: 10px;">
                <i class="fas fa-clock"></i> Unlocks: ${new Date(capsule.unlockDate).toLocaleString()}
            </div>
            
            <button onclick="handleOpenCapsule('${capsule.id}')" style="
                width: 100%;
                padding: 10px;
                background: linear-gradient(135deg, #feca57, #ff9f43);
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
                <i class="fas fa-${capsule.isLocked ? 'lock' : 'unlock'}"></i> 
                ${capsule.isLocked ? 'View (Locked)' : 'Read'}
            </button>
        </div>
    `}).join('');
}

// Update renderAll to include collaborative capsules
function renderAll() {
    renderStats();
    renderLockedCapsules();
    renderUnlockedCapsules();
    renderUnopenedCapsules();
    renderOpenedCapsules();
    renderFavorites();
    renderPinnedCapsules();
    renderArchivedCapsules();
    renderCollaborativeCapsules(); // Add this
    renderActivityLog();
    renderTimelineView();
    renderFriendsSection();
}

// ==================== Stats ====================
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

// ==================== Locked Capsules ====================
function renderLockedCapsules() {
    const container = document.getElementById('locked-space');
    if (!container) return;
    
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('category-filter')?.value || 'all';
    const statusFilter = document.getElementById('status-filter')?.value || 'all';
    
    if (statusFilter === 'unlocked') {
        container.innerHTML = '<p style="color: var(--dark-text-muted); text-align: center; padding: 20px;">No locked capsules found (filtered by status)</p>';
        return;
    }
    
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
        container.innerHTML = '<p style="color: var(--dark-text-muted); text-align: center; padding: 20px;">No locked capsules found</p>';
    } else {
        container.innerHTML = filtered.map(capsule => createCapsuleCard(capsule)).join('');
    }
}

// ==================== Unlocked Capsules ====================
function renderUnlockedCapsules() {
    const container = document.getElementById('unlocked-space');
    if (!container) return;
    
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('category-filter')?.value || 'all';
    const statusFilter = document.getElementById('status-filter')?.value || 'all';
    
    if (statusFilter === 'locked') {
        container.innerHTML = '<p style="color: var(--dark-text-muted); text-align: center; padding: 20px;">No unlocked capsules found (filtered by status)</p>';
        return;
    }
    
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
        container.innerHTML = '<p style="color: var(--dark-text-muted); text-align: center; padding: 20px;">No unlocked capsules found</p>';
    } else {
        container.innerHTML = filtered.map(capsule => createCapsuleCard(capsule)).join('');
    }
}

// ==================== Unopened Capsules ====================
function renderUnopenedCapsules() {
    const container = document.getElementById('unopened-space');
    if (!container) return;
    
    const unopened = capsules.filter(c => 
        !c.isLocked && 
        !isCapsuleOpened(c.id) && 
        c.ownerId === currentUser?.id && 
        !c.isArchived
    );
    
    if (unopened.length === 0) {
        container.innerHTML = '<p style="color: var(--dark-text-muted); text-align: center; padding: 20px;">No unopened capsules</p>';
    } else {
        container.innerHTML = unopened.map(capsule => createCapsuleCard(capsule, true)).join('');
    }
}

// ==================== Opened Capsules ====================
function renderOpenedCapsules() {
    const container = document.getElementById('opened-space');
    if (!container) return;
    
    const opened = capsules.filter(c => 
        !c.isLocked && 
        isCapsuleOpened(c.id) && 
        c.ownerId === currentUser?.id && 
        !c.isArchived
    );
    
    if (opened.length === 0) {
        container.innerHTML = '<p style="color: var(--dark-text-muted); text-align: center; padding: 20px;">No opened capsules</p>';
    } else {
        container.innerHTML = opened.map(capsule => createCapsuleCard(capsule)).join('');
    }
}

// ==================== Favorites ====================
function renderFavorites() {
    const container = document.getElementById('favorites-space');
    if (!container) return;
    
    const statusFilter = document.getElementById('status-filter')?.value || 'all';
    
    let favorites = capsules.filter(c => c.isFavorite && c.ownerId === currentUser?.id && !c.isArchived);
    
    if (statusFilter === 'locked') {
        favorites = favorites.filter(c => c.isLocked);
    } else if (statusFilter === 'unlocked') {
        favorites = favorites.filter(c => !c.isLocked);
    }
    
    if (favorites.length === 0) {
        container.innerHTML = '<p style="color: var(--dark-text-muted); text-align: center; padding: 20px;">No favorite capsules found</p>';
    } else {
        container.innerHTML = favorites.map(capsule => createCapsuleCard(capsule)).join('');
    }
}

// ==================== Pinned Capsules ====================
function renderPinnedCapsules() {
    const container = document.getElementById('pinned-space');
    if (!container) return;
    
    const pinned = capsules.filter(c => c.isPinned && c.ownerId === currentUser?.id && !c.isArchived);
    
    if (pinned.length === 0) {
        container.innerHTML = '<p style="color: var(--dark-text-muted); text-align: center; padding: 20px;">No pinned capsules</p>';
    } else {
        container.innerHTML = pinned.map(capsule => createCapsuleCard(capsule)).join('');
    }
}

// ==================== Archived Capsules ====================
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

// ==================== Timeline View ====================
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

// ==================== Activity Log ====================
function renderActivityLog() {
    const container = document.getElementById('activity-list');
    if (!container) return;
    
    const userActivity = activityLog.filter(log => 
        log.details.includes(currentUser?.username) || (log.capsuleId && 
        capsules.some(c => c.id === log.capsuleId && c.ownerId === currentUser?.id))
    );
    
    if (userActivity.length === 0) {
        container.innerHTML = '<p style="color: var(--dark-text-muted); text-align: center; padding: 20px;">No activity yet</p>';
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

// ==================== Create Capsule Card ====================
// ui.js - Update createCapsuleCard function

// ui.js - Complete createCapsuleCard function with owner buttons

// ui.js - Complete createCapsuleCard function with edit limit indicator and owner-only actions

function createCapsuleCard(capsule) {
    const now = new Date().getTime();
    const unlockTime = new Date(capsule.unlockDate).getTime();
    const timeRemaining = unlockTime - now;
    const progress = Math.min(100, Math.max(0, ((now - new Date(capsule.createdAt).getTime()) / (unlockTime - new Date(capsule.createdAt).getTime())) * 100));
    const attempts = capsule.accessAttempts?.length || 0;
    const prematureAttempts = capsule.accessAttempts?.filter(a => !a.success).length || 0;
    
    // Format the category with proper capitalization
    const categoryDisplay = capsule.category.charAt(0).toUpperCase() + capsule.category.slice(1);
    
    // Determine card classes
    const cardClasses = ['capsule-card'];
    if (capsule.isFavorite) cardClasses.push('favorite');
    if (capsule.isPinned) cardClasses.push('pinned');
    
    return `
        <div class="capsule-flip-container" style="perspective: 1000px;">
            <div class="${cardClasses.join(' ')}" data-id="${capsule.id}">
                
                <!-- Header with category and action buttons -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span class="capsule-category">${categoryDisplay}</span>
                    <div style="display: flex; gap: 8px;">
                        ${capsule.isPinned ? '<i class="fas fa-thumbtack" style="color: #feca57; font-size: 16px;"></i>' : ''}
                        <button onclick="toggleFavorite('${capsule.id}')" class="capsule-icon-btn ${capsule.isFavorite ? 'active' : ''}">
                            <i class="fa${capsule.isFavorite ? 's' : 'r'} fa-star"></i>
                        </button>
                        <button onclick="togglePin('${capsule.id}')" class="capsule-icon-btn ${capsule.isPinned ? 'pinned' : ''}">
                            <i class="fas fa-thumbtack"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Title and Description -->
                <h3 class="capsule-title">${capsule.title}</h3>
                ${capsule.description ? `<p class="capsule-description">${capsule.description}</p>` : ''}
                
                <!-- Tags -->
                ${capsule.tags && capsule.tags.length > 0 ? `
                    <div class="capsule-tags">
                        ${capsule.tags.map(tag => `
                            <span class="capsule-tag" onclick="event.stopPropagation(); filterByTag('${tag}')">#${tag}</span>
                        `).join('')}
                    </div>
                ` : ''}
                
                <!-- Meta Information -->
                <div class="capsule-meta">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Created: ${new Date(capsule.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="capsule-meta" style="margin-bottom: 15px;">
                    <i class="fas fa-clock"></i>
                    <span>Unlocks: ${new Date(capsule.unlockDate).toLocaleString()}</span>
                </div>
                
                <!-- Progress Bar -->
                <div class="capsule-progress">
                    <div class="capsule-progress-fill" style="width: ${progress}%;"></div>
                </div>
                
                <!-- LOCKED CAPSULE SECTION -->
                ${capsule.isLocked ? `
                    <!-- Countdown Timer -->
                    <div class="capsule-countdown">
                        <i class="fas fa-hourglass-half"></i>
                        <span class="time-value">${formatTimeRemaining(timeRemaining)}</span>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="capsule-actions">
                        <button onclick="handleOpenCapsule('${capsule.id}')" class="capsule-btn-primary">
                            <i class="fas fa-lock"></i> Open (${attempts}/3)
                        </button>
                        <button onclick="archiveCapsule('${capsule.id}')" class="capsule-btn-secondary">
                            <i class="fas fa-archive"></i>
                        </button>
                    </div>
                    
                    <!-- Premature Attempts Warning -->
                    ${prematureAttempts > 0 ? `
                        <div class="capsule-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <span>${prematureAttempts} premature ${prematureAttempts === 1 ? 'attempt' : 'attempts'} - ${3 - prematureAttempts} remaining before self-destruct</span>
                        </div>
                    ` : ''}
                    
                ` : `
                    <!-- UNLOCKED CAPSULE SECTION -->
                    
                    <!-- Status Badge (Opened/New) -->
                    <div class="capsule-status-container">
                        ${isCapsuleOpened(capsule.id) ? 
                            `<span class="capsule-badge opened">
                                <i class="fas fa-check-circle"></i> Opened
                            </span>` : 
                            `<span class="capsule-badge new">
                                <i class="fas fa-gift"></i> New! Unopened
                            </span>`
                        }
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="capsule-actions">
                        <button onclick="handleOpenCapsule('${capsule.id}')" class="capsule-btn-read">
                            <i class="fas fa-unlock"></i> Read
                        </button>
                        <button onclick="archiveCapsule('${capsule.id}')" class="capsule-btn-secondary">
                            <i class="fas fa-archive"></i>
                        </button>
                    </div>
                `}
                
                <!-- OWNER-ONLY ACTIONS (Edit/Delete) with Edit Limit Indicator -->
                ${currentUser && capsule.ownerId === currentUser.id ? `
                    <div class="capsule-owner-actions" style="flex-direction: column; margin-top: 15px; border-top: 1px solid var(--dark-border); padding-top: 15px;">
                        <!-- Edit Limit Indicator -->
                        <div class="edit-limit-container" style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 10px;
                            padding: 8px;
                            background: var(--dark-bg-primary);
                            border-radius: 8px;
                            font-size: 0.85rem;
                        ">
                            <span style="color: var(--dark-text-secondary);">
                                <i class="fas fa-pen"></i> Edits:
                            </span>
                            <div class="edit-dots" style="display: flex; gap: 5px; align-items: center;">
                                ${[1,2,3].map(i => {
                                    const isUsed = i <= (capsule.editCount || 0);
                                    const isWarning = isUsed && i === 3 && capsule.editCount >= 3;
                                    const bgColor = isUsed 
                                        ? (isWarning ? '#ff6b6b' : '#feca57') 
                                        : 'var(--dark-border)';
                                    const textColor = isUsed ? 'white' : 'var(--dark-text-muted)';
                                    
                                    return `
                                        <div style="
                                            width: 24px;
                                            height: 24px;
                                            border-radius: 50%;
                                            background: ${bgColor};
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            color: ${textColor};
                                            font-size: 0.8rem;
                                            font-weight: bold;
                                            transition: all 0.3s ease;
                                        ">
                                            ${i}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                        
                        <!-- Edit/Delete Buttons -->
                        <div style="display: flex; gap: 10px;">
                            <button onclick="editCapsule('${capsule.id}')" 
                                    class="capsule-edit-btn" 
                                    style="
                                        flex: 1; 
                                        padding: 8px; 
                                        background: linear-gradient(135deg, #feca57, #ff9f43);
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
                                        ${capsule.editLocked ? 'opacity: 0.5; cursor: not-allowed;' : ''}
                                    "
                                    ${capsule.editLocked ? 'disabled' : ''}>
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button onclick="deleteOwnCapsule('${capsule.id}')" 
                                    class="capsule-delete-btn"
                                    style="
                                        flex: 1; 
                                        padding: 8px;
                                        background: linear-gradient(135deg, #ff6b6b, #c92a2a);
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
                                    ">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                        
                        <!-- Locked Message -->
                        ${capsule.editLocked ? `
                            <div style="
                                margin-top: 8px;
                                font-size: 0.8rem;
                                color: #ff6b6b;
                                display: flex;
                                align-items: center;
                                gap: 5px;
                            ">
                                <i class="fas fa-lock"></i>
                                <span>Edit limit reached (3/3) - Capsule locked</span>
                            </div>
                        ` : capsule.editCount > 0 ? `
                            <div style="
                                margin-top: 8px;
                                font-size: 0.8rem;
                                color: #feca57;
                                display: flex;
                                align-items: center;
                                gap: 5px;
                            ">
                                <i class="fas fa-info-circle"></i>
                                <span>${capsule.editCount}/3 edits used - ${3 - capsule.editCount} remaining</span>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}



// ==================== Filter Functions ====================
function applyFilters() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('category-filter')?.value || 'all';
    const statusFilter = document.getElementById('status-filter')?.value || 'all';
    
    let userCapsules = capsules.filter(c => c.ownerId === currentUser?.id && !c.isArchived);
    
    if (searchTerm) {
        userCapsules = userCapsules.filter(c => 
            c.title.toLowerCase().includes(searchTerm) ||
            (c.description && c.description.toLowerCase().includes(searchTerm)) ||
            (c.tags && c.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }
    
    if (categoryFilter !== 'all') {
        userCapsules = userCapsules.filter(c => c.category === categoryFilter);
    }
    
    if (favoritesFilter) {
        userCapsules = userCapsules.filter(c => c.isFavorite);
    }
    
    let lockedCapsules = userCapsules.filter(c => c.isLocked);
    let unlockedCapsules = userCapsules.filter(c => !c.isLocked);
    let favoriteCapsules = userCapsules.filter(c => c.isFavorite);
    
    if (statusFilter === 'locked') {
        renderFilteredResults(lockedCapsules, [], favoriteCapsules);
    } else if (statusFilter === 'unlocked') {
        renderFilteredResults([], unlockedCapsules, favoriteCapsules);
    } else {
        renderFilteredResults(lockedCapsules, unlockedCapsules, favoriteCapsules);
    }
}

function renderFilteredResults(locked, unlocked, favorites) {
    const lockedContainer = document.getElementById('locked-space');
    const unlockedContainer = document.getElementById('unlocked-space');
    const favoritesContainer = document.getElementById('favorites-space');
    
    if (lockedContainer) {
        if (locked.length === 0) {
            lockedContainer.innerHTML = '<p style="color: var(--dark-text-muted); text-align: center; padding: 20px;">No locked capsules found</p>';
        } else {
            lockedContainer.innerHTML = locked.map(capsule => createCapsuleCard(capsule)).join('');
        }
    }
    
    if (unlockedContainer) {
        if (unlocked.length === 0) {
            unlockedContainer.innerHTML = '<p style="color: var(--dark-text-muted); text-align: center; padding: 20px;">No unlocked capsules found</p>';
        } else {
            unlockedContainer.innerHTML = unlocked.map(capsule => createCapsuleCard(capsule)).join('');
        }
    }
    
    if (favoritesContainer) {
        if (favorites.length === 0) {
            favoritesContainer.innerHTML = '<p style="color: var(--dark-text-muted); text-align: center; padding: 20px;">No favorite capsules found</p>';
        } else {
            favoritesContainer.innerHTML = favorites.map(capsule => createCapsuleCard(capsule)).join('');
        }
    }
}



// Export functions
window.renderAll = renderAll;
window.renderStats = renderStats;
window.renderLockedCapsules = renderLockedCapsules;
window.renderUnlockedCapsules = renderUnlockedCapsules;
window.renderUnopenedCapsules = renderUnopenedCapsules;
window.renderOpenedCapsules = renderOpenedCapsules;
window.renderFavorites = renderFavorites;
window.renderPinnedCapsules = renderPinnedCapsules;
window.renderArchivedCapsules = renderArchivedCapsules;
window.renderTimelineView = renderTimelineView;
window.renderActivityLog = renderActivityLog;
window.createCapsuleCard = createCapsuleCard;
window.applyFilters = applyFilters;
window.renderFilteredResults = renderFilteredResults;
window.renderCollaborativeCapsules = renderCollaborativeCapsules;
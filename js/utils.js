    // utils.js - Helper functions, constants, and utilities

    // ==================== Global Variables Declaration ====================
    let currentUser = null;
    let users = [];
    let capsules = [];
    let activityLog = [];
    let deletedUsers = [];
    let deletedCapsules = [];
    let friendRequests = [];
    let friends = [];
    let openedCapsules = [];
    let notifications = [];
    let loginAttempts = {};
    let lockedAccounts = {};
    let favoritesFilter = false;
    let autoSaveTimer = null;
    let hasUnsavedChanges = false;
    let toastContainer = null;
    let countdownInterval = null;

    // ==================== Modal Manager ====================
    let activeModal = null;
    let modalStack = [];

    // ==================== Default Avatar ====================
    const DEFAULT_AVATAR = 'data:image/svg+xml,' + encodeURIComponent(`
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="linear-gradient(135deg, #6c5ce7, #a55eea)"/>
        <circle cx="50" cy="35" r="15" fill="white" opacity="0.9"/>
        <circle cx="50" cy="80" r="25" fill="white" opacity="0.9"/>
        <circle cx="35" cy="30" r="3" fill="#2d3436"/>
        <circle cx="65" cy="30" r="3" fill="#2d3436"/>
        <path d="M40 45 Q50 55, 60 45" stroke="#2d3436" stroke-width="3" fill="none"/>
    </svg>
    `);

    // Helper function to get user avatar
    function getUserAvatar(user) {
        if (user && user.avatar) {
            return user.avatar;
        }
        return DEFAULT_AVATAR;
    }

    // ==================== Sample Data ====================
    const sampleUsers = [
        { 
            id: '1', 
            username: 'demo', 
            email: 'demo@example.com',
            password: 'demo123', 
            isAdmin: false, 
            createdAt: new Date().toISOString(), 
            avatar: null,
            isBanned: false,
            banExpiresAt: null,
            banReason: null,
            banCount: 0,
            previousBans: []
        },
        { 
            id: '2', 
            username: 'test', 
            email: 'test@example.com',
            password: 'test123', 
            isAdmin: false, 
            createdAt: new Date().toISOString(), 
            avatar: null,
            isBanned: false,
            banExpiresAt: null,
            banReason: null,
            banCount: 0,
            previousBans: []
        },
        { 
            id: '3', 
            username: 'admin', 
            email: 'admin@timecapsule.com',
            password: 'admin123', 
            isAdmin: true, 
            createdAt: new Date().toISOString(), 
            avatar: null,
            isBanned: false,
            banExpiresAt: null,
            banReason: null,
            banCount: 0,
            previousBans: []
        }
    ];

    // In utils.js - Update openModal function
    function openModal(modalElement, options = {}) {
        const {
            size = 'large',
            closeOnEsc = true,
            closeOnClickOutside = true,
            onClose = null,
            modalClass = ''
        } = options;

        // Close any existing modal first
        if (activeModal) {
            closeModal();
        }

        // Add classes
        modalElement.classList.add('modal-active');
        
        // Add size class
        const sizeClasses = {
            small: 'modal-small',
            medium: 'modal-medium',
            large: 'modal-large',
            xlarge: 'modal-xlarge',
            xxlarge: 'modal-xxlarge'
        };
        
        Object.values(sizeClasses).forEach(cls => modalElement.classList.remove(cls));
        modalElement.classList.add(sizeClasses[size] || 'modal-large');
        
        // Add custom class if provided
        if (modalClass) {
            modalElement.classList.add(modalClass);
        }
        
        // SPECIAL CASE: For admin panel, make it full screen
        if (modalClass === 'admin-panel-modal') {
            modalElement.style.position = 'fixed';
            modalElement.style.top = '0';
            modalElement.style.left = '0';
            modalElement.style.right = '0';
            modalElement.style.bottom = '0';
            modalElement.style.width = '100vw';
            modalElement.style.height = '100vh';
            modalElement.style.transform = 'none';
            modalElement.style.display = 'flex';
            modalElement.style.alignItems = 'center';
            modalElement.style.justifyContent = 'center';
        }
        
        // Add to body
        document.body.appendChild(modalElement);
        
        // Store modal reference
        activeModal = {
            element: modalElement,
            options: { closeOnEsc, closeOnClickOutside, onClose }
        };
        
        // Add backdrop
        let backdrop = document.querySelector('.modal-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            document.body.appendChild(backdrop);
            setTimeout(() => backdrop.classList.add('active'), 10);
        }
        
        // Add event listeners
        if (closeOnEsc) {
            document.addEventListener('keydown', handleEscKey);
        }
        
        if (closeOnClickOutside) {
            backdrop.addEventListener('click', handleBackdropClick);
        }
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        return modalElement;
    }

    function closeModal() {
        if (!activeModal) return;
        
        const { element, options } = activeModal;
        
        // Remove modal
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
        
        // Remove backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.classList.remove('active');
            setTimeout(() => {
                if (backdrop.parentNode) {
                    backdrop.parentNode.removeChild(backdrop);
                }
            }, 300);
        }
        
        // Remove event listeners
        document.removeEventListener('keydown', handleEscKey);
        
        if (backdrop) {
            backdrop.removeEventListener('click', handleBackdropClick);
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Call onClose callback if provided
        if (options && options.onClose) {
            options.onClose();
        }
        
        activeModal = null;
    }

    function handleEscKey(e) {
        if (e.key === 'Escape' && activeModal && activeModal.options.closeOnEsc) {
            closeModal();
        }
    }

    function handleBackdropClick() {
        if (activeModal && activeModal.options.closeOnClickOutside) {
            closeModal();
        }
    }

    // Helper function to create modal HTML with consistent structure
    function createModal(content, title = '', options = {}) {
        const {
            showCloseButton = true,
            closeButtonText = '&times;',
            size = 'large'
        } = options;
        
        const modal = document.createElement('div');
        modal.className = 'modal-container';
        
        modal.innerHTML = `
            <div class="modal-content-wrapper">
                ${showCloseButton ? `
                    <button class="modal-close-btn" onclick="closeModal()">${closeButtonText}</button>
                ` : ''}
                ${title ? `<h2 class="modal-title">${title}</h2>` : ''}
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        return modal;
    }

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
            accessAttempts: [],
            ownerId: '1',
            reactions: { '❤️': 0, '😂': 0, '😮': 0, '😢': 0, '👏': 0 },
            comments: [],
            version: 1
        }
    ];

    const memeUrls = [
        'https://api.memegen.link/images/buzz/memes/you_shall_not_pass.png',
        'https://api.memegen.link/images/phd/sorry/this_capsule_is_not_ready.png',
        'https://api.memegen.link/images/fry/not_sure_if/too_early.png',
        'https://api.memegen.link/images/yoda/attempt_early_open/do_or_do_not.png',
        'https://api.memegen.link/images/spiderman/patience/young_padawan.png'
    ];

    const moodOptions = [
        { value: 'happy', label: '😊 Happy', color: '#feca57' },
        { value: 'sad', label: '😢 Sad', color: '#54a0ff' },
        { value: 'excited', label: '🎉 Excited', color: '#ff6b6b' },
        { value: 'thankful', label: '🙏 Thankful', color: '#1dd1a1' },
        { value: 'nostalgic', label: '📸 Nostalgic', color: '#9b59b6' }
    ];

    // ==================== Toast Notifications ====================
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

    // ==================== Password Strength ====================
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

    // ==================== Countdown Updates ====================
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
            
            const timeElement = capsuleCard.querySelector('[style*="color: #feca57"]');
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
                
                timeElement.innerHTML = `<i class="fas fa-hourglass-half"></i> ${display}`;
            }
        });
    }

    // ==================== Auto-Save ====================
    function initializeAutoSave() {
        const capsuleForm = document.getElementById('capsule-form');
        if (capsuleForm) {
            capsuleForm.addEventListener('input', () => {
                hasUnsavedChanges = true;
                showAutoSaveIndicator();
                
                clearTimeout(autoSaveTimer);
                autoSaveTimer = setTimeout(() => {
                    if (hasUnsavedChanges) {
                        saveDraft();
                    }
                }, 3000);
            });
        }
    }

    function showAutoSaveIndicator() {
        let indicator = document.querySelector('.auto-save-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'auto-save-indicator';
            indicator.innerHTML = `
                <div class="auto-save-spinner"></div>
                <span>Auto-saving...</span>
            `;
            document.body.appendChild(indicator);
        }
        
        indicator.style.display = 'flex';
    }

    function hideAutoSaveIndicator() {
        const indicator = document.querySelector('.auto-save-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    function saveDraft() {
        const formData = {
            title: document.getElementById('title')?.value || '',
            description: document.getElementById('description')?.value || '',
            message: document.getElementById('message')?.value || '',
            category: document.getElementById('category')?.value || 'personal',
            unlockDate: document.getElementById('unlock-date')?.value || '',
            mood: document.getElementById('mood')?.value || 'happy'
        };
        
        const drafts = JSON.parse(localStorage.getItem('timeCapsule_drafts') || '[]');
        
        const existingDraftIndex = drafts.findIndex(d => d.userId === currentUser?.id);
        if (existingDraftIndex >= 0) {
            drafts[existingDraftIndex] = {
                ...formData,
                userId: currentUser?.id,
                lastModified: new Date().toISOString()
            };
        } else {
            drafts.push({
                ...formData,
                userId: currentUser?.id,
                lastModified: new Date().toISOString()
            });
        }
        
        localStorage.setItem('timeCapsule_drafts', JSON.stringify(drafts));
        hasUnsavedChanges = false;
        
        hideAutoSaveIndicator();
        showToast('Draft saved', 'success');
    }

    function loadDraft() {
        if (!currentUser) return;
        
        const drafts = JSON.parse(localStorage.getItem('timeCapsule_drafts') || '[]');
        const draft = drafts.find(d => d.userId === currentUser.id);
        
        if (draft) {
            if (confirm('You have a saved draft. Load it?')) {
                document.getElementById('title').value = draft.title || '';
                document.getElementById('description').value = draft.description || '';
                document.getElementById('message').value = draft.message || '';
                document.getElementById('category').value = draft.category || 'personal';
                document.getElementById('unlock-date').value = draft.unlockDate || '';
                if (document.getElementById('mood')) {
                    document.getElementById('mood').value = draft.mood || 'happy';
                }
                
                showToast('Draft loaded', 'info');
            }
        }
    }

    // ==================== Confetti ====================
    function showConfetti() {
        const colors = ['#6c5ce7', '#00d2d3', '#ff6b6b', '#feca57', '#1dd1a1', '#a55eea'];
        const confettiCount = 100;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.setProperty('--confetti-color', colors[Math.floor(Math.random() * colors.length)]);
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDuration = Math.random() * 3 + 2 + 's';
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.width = Math.random() * 10 + 5 + 'px';
            confetti.style.height = confetti.style.width;
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }
    }

    // ==================== Enhanced Notification System ====================

    // Show notifications modal
    function showNotifications() {
        if (!currentUser) return;
        
        const userNotifications = notifications.filter(n => n.userId === currentUser.id);
        const unreadCount = userNotifications.filter(n => !n.read).length;
        const readCount = userNotifications.filter(n => n.read).length;
        
        const content = `
            <div class="notifications-container">
                <!-- Header with tabs -->
                <div class="notifications-tabs">
                    <button class="notifications-tab active" onclick="switchNotificationTab('unread')">
                        Unread <span class="notification-badge">${unreadCount}</span>
                    </button>
                    <button class="notifications-tab" onclick="switchNotificationTab('read')">
                        Read <span class="notification-badge">${readCount}</span>
                    </button>
                    <button class="notifications-tab" onclick="switchNotificationTab('all')">
                        All <span class="notification-badge">${userNotifications.length}</span>
                    </button>
                </div>
                
                <!-- Mark all as read button (only show if unread > 0) -->
                ${unreadCount > 0 ? `
                    <div class="notifications-actions">
                        <button class="notifications-mark-read" onclick="markAllNotificationsRead()">
                            <i class="fas fa-check-double"></i> Mark All as Read
                        </button>
                    </div>
                ` : ''}
                
                <!-- Notifications list -->
                <div id="notifications-list" class="notifications-list">
                    ${renderNotificationsByType('unread')}
                </div>
                
                <!-- Empty state -->
                <div id="notifications-empty" class="notifications-empty" style="display: none;">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications to display</p>
                </div>
            </div>
        `;
        
        // Create and open modal using the modal system
        const modal = createModal(content, 'Notifications', { 
            size: 'large', 
            showCloseButton: true,
            modalClass: 'notifications-modal-container'
        });
        
        openModal(modal, { size: 'large' });
    }

    // Render notifications by type
    function renderNotificationsByType(type = 'unread') {
        if (!currentUser) return '';
        
        let filteredNotifications = notifications.filter(n => n.userId === currentUser.id);
        
        if (type === 'unread') {
            filteredNotifications = filteredNotifications.filter(n => !n.read);
        } else if (type === 'read') {
            filteredNotifications = filteredNotifications.filter(n => n.read);
        }
        
        filteredNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Fix: replace optional chaining with traditional check
        const emptyEl = document.getElementById('notifications-empty');
        if (filteredNotifications.length === 0) {
            if (emptyEl) emptyEl.style.display = 'flex';
            return '';
        }
        
        if (emptyEl) emptyEl.style.display = 'none';
        
        const grouped = groupNotificationsByDate(filteredNotifications);
        
        return Object.entries(grouped).map(([date, items]) => `
            <div class="notifications-date-group">
                <div class="notifications-date-header">${date}</div>
                <div class="notifications-group">
                    ${items.map(notification => `
                        <div class="notification-item ${notification.read ? 'read' : 'unread'} ${notification.type}" 
                            onclick="markNotificationRead('${notification.id}')"
                            data-id="${notification.id}">
                            <div class="notification-icon">
                                <i class="fas fa-${getNotificationIcon(notification.type)}"></i>
                            </div>
                            <div class="notification-content">
                                <div class="notification-header">
                                    <span class="notification-title">${getNotificationTitle(notification.type)}</span>
                                    <span class="notification-time">${formatNotificationTime(notification.timestamp)}</span>
                                </div>
                                <p class="notification-message">${notification.message}</p>
                                ${notification.deletionReason ? `
                                    <div class="notification-reason">
                                        <strong>Reason:</strong> ${notification.deletionReason}
                                    </div>
                                ` : ''}
                                ${notification.data ? `
                                    <div class="notification-data">
                                        ${Object.entries(notification.data).map(([key, value]) => `
                                            <span class="notification-data-item"><strong>${key}:</strong> ${value}</span>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                            <div class="notification-status">
                                ${!notification.read ? '<span class="unread-dot"></span>' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    // Switch between notification tabs
    function switchNotificationTab(tab) {
        // Update tab styles
        document.querySelectorAll('.notifications-tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
        
        // Render appropriate notifications
        const list = document.getElementById('notifications-list');
        if (list) {
            list.innerHTML = renderNotificationsByType(tab);
        }
    }

    // Group notifications by date
    function groupNotificationsByDate(notifications) {
        const groups = {};
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        notifications.forEach(notification => {
            const date = new Date(notification.timestamp).toDateString();
            let groupKey;
            
            if (date === today) {
                groupKey = 'Today';
            } else if (date === yesterday) {
                groupKey = 'Yesterday';
            } else {
                groupKey = new Date(notification.timestamp).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            }
            
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(notification);
        });
        
        return groups;
    }

    // Get notification icon based on type
    function getNotificationIcon(type) {
        const icons = {
            'friend_request': 'user-plus',
            'friend_accepted': 'user-check',
            'friend_declined': 'user-times',
            'capsule_deleted': 'trash-alt',
            'capsule_unlocked': 'unlock-alt',
            'account_banned': 'ban',
            'account_unbanned': 'check-circle',
            'account_restored': 'undo-alt',
            'account_restore_rejected': 'times-circle',
            'collaboration_request': 'users',
            'collaboration_accepted': 'user-friends',
            'system': 'cog'
        };
        return icons[type] || 'bell';
    }

    // Get notification title based on type
    function getNotificationTitle(type) {
        const titles = {
            'friend_request': 'Friend Request',
            'friend_accepted': 'Friend Request Accepted',
            'friend_declined': 'Friend Request Declined',
            'capsule_deleted': 'Capsule Deleted',
            'capsule_unlocked': 'Capsule Unlocked',
            'account_banned': 'Account Banned',
            'account_unbanned': 'Account Unbanned',
            'account_restored': 'Account Restored',
            'account_restore_rejected': 'Restore Request Rejected',
            'collaboration_request': 'Collaboration Invite',
            'collaboration_accepted': 'Collaboration Accepted',
            'system': 'System Notification'
        };
        return titles[type] || 'Notification';
    }

    // Format notification time
    function formatNotificationTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString();
    }

    // Mark single notification as read
    function markNotificationRead(notificationId) {
        const notification = notifications.find(n => n.id === notificationId);
        if (notification && !notification.read) {
            notification.read = true;
            saveToStorage();
            updateNotificationBadge();
            
            // Refresh current tab
            const activeTab = document.querySelector('.notifications-tab.active');
            if (activeTab) {
                const tab = activeTab.textContent.toLowerCase().includes('unread') ? 'unread' :
                        activeTab.textContent.toLowerCase().includes('read') ? 'read' : 'all';
                document.getElementById('notifications-list').innerHTML = renderNotificationsByType(tab);
            }
        }
    }

    // Mark all notifications as read
    function markAllNotificationsRead() {
        let marked = 0;
        notifications.forEach(n => {
            if (n.userId === currentUser.id && !n.read) {
                n.read = true;
                marked++;
            }
        });
        
        if (marked > 0) {
            saveToStorage();
            updateNotificationBadge();
            
            // Refresh current tab
            const activeTab = document.querySelector('.notifications-tab.active');
            if (activeTab) {
                const tab = activeTab.textContent.toLowerCase().includes('unread') ? 'unread' :
                        activeTab.textContent.toLowerCase().includes('read') ? 'read' : 'all';
                document.getElementById('notifications-list').innerHTML = renderNotificationsByType(tab);
            }
            
            showToast(`Marked ${marked} notification${marked > 1 ? 's' : ''} as read`, 'success');
        }
    }

    // Update notification badge
    function updateNotificationBadge() {
        if (!currentUser) return;
        
        const unreadCount = notifications.filter(n => n.userId === currentUser.id && !n.read).length;
        const badge = document.getElementById('notification-count');
        const bell = document.getElementById('notification-bell');
        
        if (badge && bell) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'inline';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    function checkForNewNotifications() {
        updateNotificationBadge();
        
        setInterval(() => {
            updateNotificationBadge();
        }, 30000);
    }

    // ==================== Email Notifications ====================
    function sendEmailNotification(to, subject, message) {
        const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        return mailtoLink;
    }

    function showRestoreRequestModal() {
        const modal = document.createElement('div');
        modal.className = 'restore-modal';
        modal.innerHTML = `
            <div class="restore-modal-content">
                <h2><i class="fas fa-undo-alt"></i> Request Account Restore</h2>
                <p>If your account was deleted and you believe this was a mistake, please fill out this form. Our admins will review your request.</p>
                <form id="restore-request-form">
                    <div class="form-group">
                        <label for="restore-username">Your Username *</label>
                        <input type="text" id="restore-username" required placeholder="Enter the username that was deleted">
                    </div>
                    <div class="form-group">
                        <label for="restore-email">Your Email *</label>
                        <input type="email" id="restore-email" required placeholder="Enter your email for contact">
                    </div>
                    <div class="form-group">
                        <label for="restore-reason">Reason for Restore *</label>
                        <textarea id="restore-reason" required placeholder="Explain why your account should be restored..."></textarea>
                    </div>
                    <div class="restore-modal-actions">
                        <button type="button" class="cancel-btn" onclick="this.closest('.restore-modal').remove()">Cancel</button>
                        <button type="submit" class="submit-btn">Submit Request</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('restore-request-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('restore-username').value;
            const email = document.getElementById('restore-email').value;
            const reason = document.getElementById('restore-reason').value;
            
            const deletedRecord = deletedUsers.find(d => d.username === username);
            
            if (!deletedRecord) {
                showToast('No deleted account found with that username', 'error');
                return;
            }
            
            const restoreRequest = {
                id: generateId(),
                username: username,
                email: email,
                deletedUsername: username,
                deletedAt: deletedRecord.deletedAt,
                reason: reason,
                requestedAt: new Date().toISOString(),
                status: 'pending'
            };
            
            let restoreRequests = JSON.parse(localStorage.getItem('timeCapsule_restoreRequests') || '[]');
            restoreRequests.push(restoreRequest);
            localStorage.setItem('timeCapsule_restoreRequests', JSON.stringify(restoreRequests));
            
            const mailtoLink = sendEmailNotification(
                'jebasinghjoshuaj@gmail.com',
                `Account Restore Request - ${username}`,
                `A user has requested account restoration:\n\n` +
                `Username: ${username}\n` +
                `Email: ${email}\n` +
                `Deleted at: ${new Date(deletedRecord.deletedAt).toLocaleString()}\n` +
                `Reason: ${reason}\n\n` +
                `Please review this request in the admin panel.`
            );
            
            window.open(mailtoLink, '_blank');
            
            showToast('Restore request submitted successfully! An admin will review it soon.', 'success');
            modal.remove();
        });
    }

    function showReportIssueModal() {
        const modal = document.createElement('div');
        modal.className = 'restore-modal';
        modal.innerHTML = `
            <div class="restore-modal-content">
                <h2><i class="fas fa-exclamation-triangle"></i> Report an Issue</h2>
                <p>Please describe the issue you're experiencing. Our team will get back to you as soon as possible.</p>
                <form id="report-issue-form">
                    <div class="form-group">
                        <label for="report-name">Your Name *</label>
                        <input type="text" id="report-name" required placeholder="Enter your name">
                    </div>
                    <div class="form-group">
                        <label for="report-email">Your Email *</label>
                        <input type="email" id="report-email" required placeholder="Enter your email">
                    </div>
                    <div class="form-group">
                        <label for="report-type">Issue Type *</label>
                        <select id="report-type" required>
                            <option value="">Select issue type</option>
                            <option value="bug">Bug / Technical Issue</option>
                            <option value="account">Account Problem</option>
                            <option value="capsule">Capsule Issue</option>
                            <option value="security">Security Concern</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="report-description">Description *</label>
                        <textarea id="report-description" required placeholder="Describe the issue in detail..."></textarea>
                    </div>
                    <div class="restore-modal-actions">
                        <button type="button" class="cancel-btn" onclick="this.closest('.restore-modal').remove()">Cancel</button>
                        <button type="submit" class="submit-btn">Submit Report</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('report-issue-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('report-name').value;
            const email = document.getElementById('report-email').value;
            const type = document.getElementById('report-type').value;
            const description = document.getElementById('report-description').value;
            
            const mailtoLink = sendEmailNotification(
                'jebasinghjoshuaj@gmail.com',
                `Issue Report: ${type} - ${name}`,
                `An issue has been reported:\n\n` +
                `Name: ${name}\n` +
                `Email: ${email}\n` +
                `Issue Type: ${type}\n` +
                `Description: ${description}\n\n` +
                `Please address this issue promptly.`
            );
            
            window.open(mailtoLink, '_blank');
            
            showToast('Issue reported successfully! We\'ll get back to you soon.', 'success');
            modal.remove();
        });
    }

    // Add event listeners for footer links
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.smooth-scroll').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId && targetId !== '#') {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
        
        const reportLink = document.getElementById('report-issue');
        if (reportLink) {
            reportLink.addEventListener('click', function(e) {
                e.preventDefault();
                showReportIssueModal();
            });
        }
        
        const restoreLink = document.getElementById('request-restore');
        if (restoreLink) {
            restoreLink.addEventListener('click', function(e) {
                e.preventDefault();
                showRestoreRequestModal();
            });
        }
    });

    function initializeDarkMode() {
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            const savedTheme = localStorage.getItem('timeCapsule_theme');
            const icon = darkModeToggle.querySelector('i');
            
            if (savedTheme === 'light') {
                document.body.classList.add('light-theme');
                if (icon) icon.className = 'fas fa-sun';
            } else {
                document.body.classList.remove('light-theme');
                if (icon) icon.className = 'fas fa-moon';
            }

            darkModeToggle.addEventListener('click', function(e) {
                e.preventDefault();
                document.body.classList.toggle('light-theme');
                const icon = this.querySelector('i');
                
                if (document.body.classList.contains('light-theme')) {
                    icon.className = 'fas fa-sun';
                    localStorage.setItem('timeCapsule_theme', 'light');
                    if (typeof showToast === 'function') showToast('Switched to Light Mode', 'info', 2000);
                } else {
                    icon.className = 'fas fa-moon';
                    localStorage.setItem('timeCapsule_theme', 'dark');
                    if (typeof showToast === 'function') showToast('Switched to Dark Mode', 'info', 2000);
                }
            });
        }
    }

    // Export all functions (ensure no stray characters)
    // ==================== Exports ====================
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.createModal = createModal;
    window.getUserAvatar = getUserAvatar;
    window.DEFAULT_AVATAR = DEFAULT_AVATAR;
    window.sampleUsers = sampleUsers;
    window.sampleCapsules = sampleCapsules;
    window.memeUrls = memeUrls;
    window.moodOptions = moodOptions;
    window.showToast = showToast;
    window.showNotification = showNotification;
    window.showWarningMessage = showWarningMessage;
    window.checkPasswordStrength = checkPasswordStrength;
    window.initializePasswordStrength = initializePasswordStrength;
    window.checkAccountLock = checkAccountLock;
    window.recordFailedAttempt = recordFailedAttempt;
    window.addSecurityLog = addSecurityLog;
    window.generateId = generateId;
    window.getActivityIcon = getActivityIcon;
    window.formatTimeRemaining = formatTimeRemaining;
    window.checkIfUserDeleted = checkIfUserDeleted;
    window.initializeDarkMode = initializeDarkMode;
    window.startCountdownUpdates = startCountdownUpdates;
    window.startLiveCountdownUpdates = startLiveCountdownUpdates;
    window.initializeAutoSave = initializeAutoSave;
    window.saveDraft = saveDraft;
    window.loadDraft = loadDraft;
    window.showConfetti = showConfetti;
    window.showNotifications = showNotifications;
    window.markNotificationRead = markNotificationRead;
    window.markAllNotificationsRead = markAllNotificationsRead;
    window.updateNotificationBadge = updateNotificationBadge;
    window.checkForNewNotifications = checkForNewNotifications;
    window.sendEmailNotification = sendEmailNotification;
    window.showRestoreRequestModal = showRestoreRequestModal;
window.showReportIssueModal = showReportIssueModal;
window.switchNotificationTab = switchNotificationTab;
window.renderNotificationsByType = renderNotificationsByType;
window.getNotificationIcon = getNotificationIcon;
window.getNotificationTitle = getNotificationTitle;
window.formatNotificationTime = formatNotificationTime;
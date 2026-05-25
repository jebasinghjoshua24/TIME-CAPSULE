// auth.js - Login, Signup, Logout

// ==================== DEBUG ====================
console.log('🔍 auth.js loaded');
console.log('Current URL:', window.location.href);
console.log('Pathname:', window.location.pathname);
console.log('Filename:', window.location.pathname.split('/').pop());

// ==================== Initialize Auth ====================
function initializeAuth() {
    console.log('🚀 initializeAuth() called');
    
    loadFromStorage();
    
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
    
    const path = window.location.pathname;
    const filename = path.split('/').pop() || path;
    
    // List of public pages
    const publicPages = ['landingpage.html', 'login.html', 'sign-up.html', 'about.html', 'contact.html', 'loading.html'];
    
    console.log('📄 Current filename:', filename);
    console.log('👤 User logged in:', !!currentUser);
    console.log('🔓 Is public page?', publicPages.includes(filename));
    
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
    
    // If user is not logged in
    if (!currentUser) {
        // Allow access to public pages, redirect to login for protected pages
        if (!publicPages.includes(filename)) {
            console.log('Redirecting to login - not logged in and page not public');
            navigateWithLoading('login.html', 'Redirecting to login');
        } else {
            console.log('Staying on public page - no redirect');
        }
    } 
    // If user IS logged in
    else {
        // Add admin button if needed
        if (currentUser.isAdmin && filename === 'Homepage.html') {
            addAdminButton();
        }
        
        // Redirect away from auth pages and landing page to homepage
        if (filename === 'login.html' || filename === 'sign-up.html' || filename === 'landingpage.html') {
            console.log('Redirecting to homepage - already logged in');
            window.location.href = 'Homepage.html';
        }
    }
}

// ==================== Login ====================
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
        // CHECK BAN STATUS
        const banCheck = checkBanStatus(user);
        
        if (!banCheck.allowed) {
            // User is banned
            const banMessage = banCheck.permanent ? 
                'Your account has been permanently banned.' : 
                `Your account is banned until ${new Date(banCheck.expiresAt).toLocaleString()}.`;
            
            errorElement.textContent = `Account banned. Reason: ${banCheck.reason}. ${banMessage}`;
            errorElement.style.color = '#ff6b6b';
            
            // Show detailed ban modal
            showBannedAccountModal(user, banCheck);
            return;
        }
        
        if (banCheck.autoUnbanned) {
            showToast('Your ban has expired. Welcome back!', 'success', 5000);
        }
        // END OF BAN CHECK
        
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
        
        navigateWithLoading('Homepage.html', 'Opening your capsules');
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

// ==================== Sign Up ====================
function handleSignUp(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const email = document.getElementById('email').value;
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
        email: username + '@user.local',
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

// ==================== Initialize Terms Checkbox ====================
function initializeTermsCheckbox() {
    const checkbox = document.getElementById('terms-checkbox');
    const submitBtn = document.getElementById('Sign-Up-Btn');
    
    if (checkbox && submitBtn) {
        submitBtn.disabled = !checkbox.checked;
        
        checkbox.addEventListener('change', function() {
            submitBtn.disabled = !this.checked;
            
            if (this.checked) {
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            }
        });
    }
}

// ==================== Logout ====================
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

// ==================== Forgot Password ====================
let resetRequests = {};

function initializeForgotPassword() {
    const forgotLink = document.getElementById('forgot-password-link');
    const modal = document.getElementById('forgot-password-modal');
    const closeBtn = document.getElementById('close-forgot-modal');
    const sendBtn = document.getElementById('send-reset-code');
    const verifyBtn = document.getElementById('verify-code');
    const resendBtn = document.getElementById('resend-code');
    const resetBtn = document.getElementById('reset-password-btn');
    
    if (forgotLink) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            showForgotPasswordStep(1);
            modal.style.display = 'block';
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            resetForgotPasswordModal();
        });
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            resetForgotPasswordModal();
        }
    });
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendResetCode);
    }
    
    if (verifyBtn) {
        verifyBtn.addEventListener('click', verifyResetCode);
    }
    
    if (resendBtn) {
        resendBtn.addEventListener('click', resendResetCode);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetPassword);
    }
}

function showForgotPasswordStep(step) {
    document.getElementById('forgot-step-1').style.display = step === 1 ? 'block' : 'none';
    document.getElementById('forgot-step-2').style.display = step === 2 ? 'block' : 'none';
    document.getElementById('forgot-step-3').style.display = step === 3 ? 'block' : 'none';
    
    if (step === 2) {
        startCodeTimer();
    }
}

function resetForgotPasswordModal() {
    showForgotPasswordStep(1);
    document.getElementById('reset-email').value = '';
    document.getElementById('verification-code').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-new-password').value = '';
    
    if (window.codeTimerInterval) {
        clearInterval(window.codeTimerInterval);
    }
}

function sendResetCode() {
    const email = document.getElementById('reset-email').value.trim();
    
    if (!email) {
        showToast('Please enter your email address', 'error');
        return;
    }
    
    const user = users.find(u => u.email === email);
    const userByUsername = users.find(u => u.username === email);
    
    if (!user && !userByUsername) {
        showToast('If an account exists with this email, a reset code will be sent', 'info');
        
        setTimeout(() => {
            showForgotPasswordStep(2);
        }, 1500);
        return;
    }
    
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + (15 * 60 * 1000);
    
    resetRequests[email] = {
        code: resetCode,
        expiry: expiry,
        userId: user ? user.id : (userByUsername ? userByUsername.id : null)
    };
    
    showToast(`🔐 DEMO MODE: Your verification code is: ${resetCode}`, 'info', 10000);
    console.log(`%c🔐 RESET CODE for ${email}: ${resetCode}`, 'background: #6c5ce7; color: white; font-size: 14px; padding: 4px;');
    
    showDemoEmailModal(email, resetCode);
    
    showForgotPasswordStep(2);
}

function showDemoEmailModal(email, code) {
    const demoModal = document.createElement('div');
    demoModal.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--dark-card-bg);
        border: 2px solid var(--dark-accent-primary);
        border-radius: 10px;
        padding: 1rem;
        max-width: 300px;
        box-shadow: 0 10px 30px var(--dark-shadow);
        z-index: 10001;
        animation: slideInRight 0.3s ease;
    `;
    
    demoModal.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <i class="fas fa-envelope" style="color: var(--dark-accent-primary); font-size: 1.5rem;"></i>
            <h4 style="color: var(--dark-text-primary); margin: 0;">Password Reset Email</h4>
            <button onclick="this.parentElement.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: var(--dark-text-muted); cursor: pointer;">&times;</button>
        </div>
        <p style="color: var(--dark-text-secondary); margin-bottom: 10px;"><strong>To:</strong> ${email}</p>
        <p style="color: var(--dark-text-secondary); margin-bottom: 10px;"><strong>Subject:</strong> Password Reset Code</p>
        <div style="background: var(--dark-bg-primary); padding: 1rem; border-radius: 8px;">
            <p style="color: var(--dark-text-primary); margin-bottom: 10px;">Your verification code is:</p>
            <p style="font-size: 2rem; font-weight: bold; color: var(--dark-accent-primary); text-align: center; letter-spacing: 5px;">${code}</p>
            <p style="color: var(--dark-text-muted); font-size: 0.8rem; text-align: center;">Code expires in 15 minutes</p>
        </div>
        <button onclick="this.parentElement.remove()" style="width: 100%; margin-top: 10px; padding: 0.5rem; background: var(--dark-accent-primary); color: white; border: none; border-radius: 5px; cursor: pointer;">OK</button>
    `;
    
    document.body.appendChild(demoModal);
    
    setTimeout(() => {
        if (document.body.contains(demoModal)) {
            demoModal.remove();
        }
    }, 10000);
}

function startCodeTimer() {
    const timerElement = document.getElementById('code-timer');
    let timeLeft = 15 * 60;
    
    if (window.codeTimerInterval) {
        clearInterval(window.codeTimerInterval);
    }
    
    window.codeTimerInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `Code expires in ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(window.codeTimerInterval);
            timerElement.textContent = 'Code expired! Please request a new one.';
            timerElement.style.color = 'var(--dark-accent-danger)';
        }
        
        timeLeft--;
    }, 1000);
}

function verifyResetCode() {
    const email = document.getElementById('reset-email').value.trim();
    const code = document.getElementById('verification-code').value.trim();
    
    if (!code || code.length !== 6) {
        showToast('Please enter a valid 6-digit code', 'error');
        return;
    }
    
    const resetRequest = resetRequests[email];
    
    if (!resetRequest) {
        showToast('No reset request found. Please request a new code.', 'error');
        return;
    }
    
    if (Date.now() > resetRequest.expiry) {
        showToast('Code has expired. Please request a new one.', 'error');
        delete resetRequests[email];
        showForgotPasswordStep(1);
        return;
    }
    
    if (resetRequest.code !== code) {
        showToast('Invalid verification code', 'error');
        return;
    }
    
    showToast('Code verified successfully!', 'success');
    showForgotPasswordStep(3);
}

function resendResetCode() {
    const email = document.getElementById('reset-email').value.trim();
    
    if (!email) {
        showToast('Please enter your email address', 'error');
        return;
    }
    
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + (15 * 60 * 1000);
    
    resetRequests[email] = {
        ...resetRequests[email],
        code: resetCode,
        expiry: expiry
    };
    
    showToast(`🔐 New code sent: ${resetCode}`, 'info', 5000);
    console.log(`%c🔐 NEW RESET CODE for ${email}: ${resetCode}`, 'background: #6c5ce7; color: white; font-size: 14px; padding: 4px;');
    
    startCodeTimer();
}

function resetPassword() {
    const email = document.getElementById('reset-email').value.trim();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    
    if (!newPassword || !confirmPassword) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    const strength = checkPasswordStrength(newPassword);
    if (strength.score < 2) {
        showToast('Password too weak. Please choose a stronger password.', 'error');
        return;
    }
    
    const resetRequest = resetRequests[email];
    
    if (!resetRequest || !resetRequest.userId) {
        showToast('Invalid reset request', 'error');
        return;
    }
    
    const user = users.find(u => u.id === resetRequest.userId);
    
    if (user) {
        user.password = newPassword;
        saveToStorage();
        
        showToast('Password reset successfully! You can now login with your new password.', 'success');
        
        document.getElementById('forgot-password-modal').style.display = 'none';
        resetForgotPasswordModal();
        
        delete resetRequests[email];
    } else {
        showToast('User not found', 'error');
    }
}

// ==================== Override initializeAuth ====================
const originalInitializeAuth = initializeAuth;
initializeAuth = function() {
    originalInitializeAuth();
    initializeForgotPassword();
    initializeTermsCheckbox();
};

// ==================== Login with Transition ====================
function handleLoginWithTransition(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('error');
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        const banCheck = checkBanStatus(user);
        
        if (!banCheck.allowed) {
            const banMessage = banCheck.permanent ? 
                'Your account has been permanently banned.' : 
                `Your account is banned until ${new Date(banCheck.expiresAt).toLocaleString()}.`;
            
            errorElement.textContent = `Account banned. Reason: ${banCheck.reason}. ${banMessage}`;
            errorElement.style.color = '#ff6b6b';
            showBannedAccountModal(user, banCheck);
            return;
        }
        
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
        
        navigateWithMatrixTransition('login.html', 'Homepage.html');
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

// ==================== Sign Up with Transition ====================
function handleSignUpWithTransition(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const termsCheckbox = document.getElementById('terms-checkbox');
    const errorElement = document.getElementById('error');
    
    if (!termsCheckbox.checked) {
        errorElement.textContent = 'You must agree to the Terms of Service and Privacy Policy';
        return;
    }
    
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
        email,
        password,
        isAdmin: false,
        createdAt: new Date().toISOString(),
        avatar: null,
        isBanned: false,
        banExpiresAt: null,
        banReason: null,
        banCount: 0,
        previousBans: []
    };
    
    users.push(newUser);
    
    activityLog.unshift({
        id: generateId(),
        type: 'signup',
        timestamp: new Date().toISOString(),
        details: `New user registered: ${username}`
    });
    
    saveToStorage();
    
    currentUser = { 
        username: newUser.username, 
        id: newUser.id,
        isAdmin: false,
        avatar: null
    };
    
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    showToast('Account created successfully!', 'success');
    
    navigateWithMatrixTransition('sign-up.html', 'Homepage.html');
}

// ==================== Export functions ====================
window.initializeAuth = initializeAuth;
window.handleLogin = handleLogin;
window.handleSignUp = handleSignUp;
window.handleLogout = handleLogout;
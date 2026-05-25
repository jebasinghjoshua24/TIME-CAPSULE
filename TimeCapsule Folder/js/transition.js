// transition.js - Matrix transition for specific navigation points

class MatrixTransition {
    constructor() {
        this.overlay = null;
        this.strip = null;
        this.stripCanvas = null;
        this.matrixRain = null;
        this.message = null;
        this.ctx = null;
        this.chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        this.fontSize = 16;
        this.drops = [];
        this.animationFrame = null;
        this.rainAnimationFrame = null;
        this.isActive = false;
    }
    
    createOverlay() {
        // Create overlay if it doesn't exist
        if (document.getElementById('matrix-transition-overlay')) {
            return;
        }
        
        const overlay = document.createElement('div');
        overlay.id = 'matrix-transition-overlay';
        overlay.className = 'matrix-transition-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: black;
            z-index: 999999;
            display: none;
            pointer-events: none;
        `;
        
        overlay.innerHTML = `
            <div class="matrix-strip" id="matrix-strip" style="
                position: absolute;
                top: -150px;
                left: 0;
                width: 100%;
                height: 150px;
                z-index: 1000000;
                box-shadow: 0 0 30px #00ff00;
                border-top: 2px solid #00ff00;
                border-bottom: 2px solid #00ff00;
                overflow: hidden;
            ">
                <canvas id="strip-canvas" style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 1000001;
                "></canvas>
            </div>
            <div id="matrix-rain" class="matrix-rain" style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 999999;
                opacity: 0.2;
                pointer-events: none;
                background: black;
            "></div>
            <div class="matrix-message" id="matrix-message" style="
                position: absolute;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                font-family: 'Orbitron', monospace;
                font-size: 1rem;
                color: #00ff00;
                text-shadow: 0 0 10px #00ff00;
                z-index: 1000002;
                letter-spacing: 2px;
                opacity: 0.5;
            ">INITIALIZING MATRIX...</div>
        `;
        
        document.body.appendChild(overlay);
        
        this.overlay = document.getElementById('matrix-transition-overlay');
        this.strip = document.getElementById('matrix-strip');
        this.stripCanvas = document.getElementById('strip-canvas');
        this.matrixRain = document.getElementById('matrix-rain');
        this.message = document.getElementById('matrix-message');
        this.ctx = this.stripCanvas?.getContext('2d');
        
        this.init();
    }
    
    init() {
        if (!this.overlay || !this.stripCanvas) return;
        
        window.addEventListener('resize', () => this.resize());
        this.resize();
        this.initDrops();
        this.startStripAnimation();
        this.startRainAnimation();
    }
    
    resize() {
        if (this.stripCanvas) {
            this.stripCanvas.width = window.innerWidth;
            this.stripCanvas.height = 150;
            this.initDrops();
        }
    }
    
    initDrops() {
        if (!this.stripCanvas) return;
        const columns = Math.floor(this.stripCanvas.width / this.fontSize);
        this.drops = [];
        for (let i = 0; i < columns; i++) {
            this.drops[i] = Math.random() * -30;
        }
    }
    
    startStripAnimation() {
        const animate = () => {
            if (!this.ctx || !this.stripCanvas || !this.isActive) return;
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.fillRect(0, 0, this.stripCanvas.width, this.stripCanvas.height);
            
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = `bold ${this.fontSize}px 'Orbitron', monospace`;
            this.ctx.shadowColor = '#00ff00';
            this.ctx.shadowBlur = 10;
            
            for (let i = 0; i < this.drops.length; i++) {
                const char = this.chars[Math.floor(Math.random() * this.chars.length)];
                const x = i * this.fontSize;
                const y = this.drops[i] * this.fontSize;
                
                if (y < 150 && y > 0) {
                    this.ctx.fillText(char, x, y);
                }
                
                if (y > 150 && Math.random() > 0.95) {
                    this.drops[i] = 0;
                }
                this.drops[i]++;
            }
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    startRainAnimation() {
        if (!this.matrixRain) return;
        
        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.opacity = '0.2';
        
        this.matrixRain.innerHTML = '';
        this.matrixRain.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        
        const resizeRain = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        resizeRain();
        window.addEventListener('resize', resizeRain);
        
        const columns = Math.floor(canvas.width / this.fontSize);
        const rainDrops = [];
        for (let i = 0; i < columns; i++) {
            rainDrops[i] = Math.random() * -100;
        }
        
        const animateRain = () => {
            if (!this.isActive) return;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#00ff00';
            ctx.font = `${this.fontSize}px 'Orbitron', monospace`;
            
            for (let i = 0; i < rainDrops.length; i++) {
                const char = this.chars[Math.floor(Math.random() * this.chars.length)];
                const x = i * this.fontSize;
                const y = rainDrops[i] * this.fontSize;
                
                if (y < canvas.height) {
                    ctx.fillText(char, x, y);
                }
                
                if (y > canvas.height && Math.random() > 0.99) {
                    rainDrops[i] = 0;
                }
                rainDrops[i]++;
            }
            
            this.rainAnimationFrame = requestAnimationFrame(animateRain);
        };
        
        animateRain();
    }
    
    show(message = 'LOADING') {
        this.createOverlay();
        this.isActive = true;
        
        if (this.message) {
            this.message.textContent = message;
        }
        
        this.overlay.style.display = 'block';
        this.overlay.style.opacity = '1';
        
        // Start animations
        this.startStripAnimation();
        this.startRainAnimation();
    }
    
    hide() {
        this.isActive = false;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.rainAnimationFrame) {
            cancelAnimationFrame(this.rainAnimationFrame);
        }
        
        this.overlay.style.opacity = '0';
        setTimeout(() => {
            this.overlay.style.display = 'none';
        }, 500);
    }
    
    async transition(toUrl, message = 'LOADING') {
        return new Promise((resolve) => {
            // Show overlay with message
            this.show(message);
            
            // Start scanning animation
            if (this.strip) {
                this.strip.style.animation = 'matrixScan 1.5s forwards';
                this.strip.style.animationTimingFunction = 'linear';
            }
            
            // Phase 1: Blackout (0.5s)
            setTimeout(() => {
                // Phase 2: Navigate after scanning starts
                setTimeout(() => {
                    window.location.href = toUrl;
                    resolve();
                }, 1500); // Scanning duration
                
            }, 500); // Blackout duration
        });
    }
    
    // For pages that receive a transition (to fade out the overlay)
    reveal() {
        if (this.strip) {
            this.strip.style.animation = 'none';
        }
        
        this.hide();
    }
}

// Create global instance
const matrixTransition = new MatrixTransition();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes matrixScan {
        0% {
            top: -150px;
        }
        100% {
            top: 100%;
        }
    }
    
    .matrix-message {
        animation: matrixPulse 2s infinite;
    }
    
    @keyframes matrixPulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.8; }
    }
    
    .light-theme .matrix-strip {
        box-shadow: 0 0 30px #008800;
        border-color: #008800;
    }
    
    .light-theme .matrix-message {
        color: #008800;
        text-shadow: 0 0 10px #008800;
    }
`;
document.head.appendChild(style);

// Navigation function for specific buttons
function navigateWithMatrixTransition(to, message = 'LOADING') {
    matrixTransition.transition(to, message);
}

// Check if we came from a transition
document.addEventListener('DOMContentLoaded', () => {
    const fromTransition = sessionStorage.getItem('fromTransition');
    if (fromTransition === 'true') {
        // Hide content briefly
        document.body.style.opacity = '0';
        
        // Show matrix overlay and reveal
        matrixTransition.createOverlay();
        matrixTransition.show('WELCOME');
        
        setTimeout(() => {
            document.body.style.opacity = '1';
            matrixTransition.reveal();
            sessionStorage.removeItem('fromTransition');
        }, 500);
    }
});

// Override navigation for specific links
function setupTransitionLinks() {
    // Landing page CTA buttons
    document.querySelectorAll('.cta-button[href*="sign-up"], .cta-button[href*="login"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const href = btn.getAttribute('href');
            const message = href.includes('sign-up') ? 'CREATING ACCOUNT' : 'OPENING LOGIN';
            sessionStorage.setItem('fromTransition', 'true');
            navigateWithMatrixTransition(href, message);
        });
    });
    
    // Login and Sign-up page buttons
    const loginBtn = document.querySelector('#LoginBtn');
    if (loginBtn && loginBtn.closest('form')) {
        loginBtn.closest('form').addEventListener('submit', (e) => {
            e.preventDefault();
            // Let auth.js handle the actual login, but we'll override the navigation
            const originalNavigate = window.navigateWithMatrixTransition;
            window.navigateWithMatrixTransition = (to, msg) => {
                sessionStorage.setItem('fromTransition', 'true');
                matrixTransition.transition(to, msg || 'OPENING DASHBOARD');
            };
            
            // Trigger the original login handler
            if (typeof handleLogin === 'function') {
                handleLogin(e);
            } else if (typeof handleLoginWithTransition === 'function') {
                handleLoginWithTransition(e);
            }
            
            // Restore
            setTimeout(() => {
                window.navigateWithMatrixTransition = originalNavigate;
            }, 100);
        });
    }
    
    // Sign-up form
    const signupBtn = document.querySelector('#Sign-Up-Btn');
    if (signupBtn && signupBtn.closest('form')) {
        signupBtn.closest('form').addEventListener('submit', (e) => {
            e.preventDefault();
            const originalNavigate = window.navigateWithMatrixTransition;
            window.navigateWithMatrixTransition = (to, msg) => {
                sessionStorage.setItem('fromTransition', 'true');
                matrixTransition.transition(to, msg || 'CREATING ACCOUNT');
            };
            
            if (typeof handleSignUp === 'function') {
                handleSignUp(e);
            } else if (typeof handleSignUpWithTransition === 'function') {
                handleSignUpWithTransition(e);
            }
            
            setTimeout(() => {
                window.navigateWithMatrixTransition = originalNavigate;
            }, 100);
        });
    }
    
    // Discover navlink in Homepage
    const discoverLink = document.querySelector('a[href="userbase.html"]');
    if (discoverLink && window.location.pathname.includes('Homepage')) {
        discoverLink.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.setItem('fromTransition', 'true');
            navigateWithMatrixTransition('userbase.html', 'DISCOVERING USERS');
        });
    }
    
    // Home button in userbase
    const homeLink = document.querySelector('a[href="Homepage.html"]');
    if (homeLink && window.location.pathname.includes('userbase')) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.setItem('fromTransition', 'true');
            navigateWithMatrixTransition('Homepage.html', 'RETURNING HOME');
        });
    }
}

// Run setup when DOM is loaded
document.addEventListener('DOMContentLoaded', setupTransitionLinks);

// Export
window.matrixTransition = matrixTransition;
window.navigateWithMatrixTransition = navigateWithMatrixTransition;
// loading.js - Matrix Scanning Transition

class MatrixTransition {
    constructor() {
        // Get URL parameters
        this.urlParams = new URLSearchParams(window.location.search);
        this.currentPage = this.urlParams.get('from');
        this.nextPage = this.urlParams.get('to');
        
        // Transition duration in milliseconds (must match CSS animation duration)
        this.transitionDuration = 2000; // 2 seconds
        
        // Allowed transitions
        this.allowedTransitions = {
            'landingpage.html': ['sign-up.html', 'login.html'],
            'login.html': ['Homepage.html'],
            'sign-up.html': ['Homepage.html']
        };
        
        // Check if transition is allowed
        if (!this.isTransitionAllowed()) {
            console.warn('Transition not allowed, redirecting directly');
            window.location.href = this.nextPage || 'landingpage.html';
            return;
        }
        
        // DOM Elements
        this.matrixRain = document.getElementById('matrixRain');
        this.stripCanvas = document.getElementById('stripCanvas');
        this.matrixStrip = document.getElementById('matrixStrip');
        this.loadingMessage = document.getElementById('loadingMessage');
        
        // Canvas context for strip
        this.stripCtx = this.stripCanvas?.getContext('2d');
        
        // Matrix characters
        this.chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        this.fontSize = 16;
        
        // Animation variables
        this.stripDrops = [];
        this.stripAnimationFrame = null;
        this.startTime = null;
        
        // Initialize
        this.init();
    }
    
    isTransitionAllowed() {
        if (!this.currentPage || !this.nextPage) return false;
        
        const allowedNextPages = this.allowedTransitions[this.currentPage];
        return allowedNextPages && allowedNextPages.includes(this.nextPage);
    }
    
    init() {
        console.log('Matrix transition started:', this.currentPage, '→', this.nextPage);
        
        // Set canvas dimensions
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Initialize strip drops
        this.initStripDrops();
        
        // Create background matrix rain effect
        this.createBackgroundRain();
        
        // Update message
        this.updateMessage(`SCANNING: ${this.getPageName(this.currentPage)} → ${this.getPageName(this.nextPage)}`);
        
        // Start strip animation
        this.startStripAnimation();
        
        // Add scanning class to start CSS animation
        if (this.matrixStrip) {
            this.matrixStrip.classList.add('scanning');
        }
        
        // Record start time
        this.startTime = Date.now();
        
        // Set timeout to navigate after animation completes
        setTimeout(() => {
            this.completeTransition();
        }, this.transitionDuration);
    }
    
    getPageName(filename) {
        const names = {
            'landingpage.html': 'LANDING',
            'login.html': 'LOGIN',
            'sign-up.html': 'SIGN UP',
            'Homepage.html': 'DASHBOARD'
        };
        return names[filename] || filename;
    }
    
    resize() {
        // Strip canvas
        if (this.stripCanvas) {
            this.stripCanvas.width = window.innerWidth;
            this.stripCanvas.height = 150;
            this.initStripDrops();
        }
    }
    
    initStripDrops() {
        if (!this.stripCanvas) return;
        
        const columns = Math.floor(this.stripCanvas.width / this.fontSize);
        this.stripDrops = [];
        for (let i = 0; i < columns; i++) {
            this.stripDrops[i] = Math.random() * -30;
        }
    }
    
    createBackgroundRain() {
        // Create a subtle background matrix rain effect
        if (!this.matrixRain) return;
        
        // Clear any existing content
        this.matrixRain.innerHTML = '';
        
        // Create a canvas for background rain
        const bgCanvas = document.createElement('canvas');
        bgCanvas.style.width = '100%';
        bgCanvas.style.height = '100%';
        bgCanvas.style.position = 'absolute';
        bgCanvas.style.top = '0';
        bgCanvas.style.left = '0';
        bgCanvas.style.opacity = '0.2';
        
        this.matrixRain.appendChild(bgCanvas);
        
        const bgCtx = bgCanvas.getContext('2d');
        
        const resizeBg = () => {
            bgCanvas.width = window.innerWidth;
            bgCanvas.height = window.innerHeight;
        };
        
        resizeBg();
        window.addEventListener('resize', resizeBg);
        
        const bgColumns = Math.floor(bgCanvas.width / this.fontSize);
        const bgDrops = [];
        for (let i = 0; i < bgColumns; i++) {
            bgDrops[i] = Math.random() * -100;
        }
        
        const animateBg = () => {
            bgCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
            
            bgCtx.fillStyle = '#00ff00';
            bgCtx.font = `${this.fontSize}px 'Orbitron', monospace`;
            
            for (let i = 0; i < bgDrops.length; i++) {
                const char = this.chars[Math.floor(Math.random() * this.chars.length)];
                const x = i * this.fontSize;
                const y = bgDrops[i] * this.fontSize;
                
                if (y < bgCanvas.height) {
                    bgCtx.fillText(char, x, y);
                }
                
                if (y > bgCanvas.height && Math.random() > 0.99) {
                    bgDrops[i] = 0;
                }
                bgDrops[i]++;
            }
            
            requestAnimationFrame(animateBg);
        };
        
        animateBg();
    }
    
    startStripAnimation() {
        const animateStrip = () => {
            if (!this.stripCtx || !this.stripCanvas) return;
            
            // Clear strip canvas with fade effect
            this.stripCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.stripCtx.fillRect(0, 0, this.stripCanvas.width, this.stripCanvas.height);
            
            // Draw binary rain in strip
            this.stripCtx.fillStyle = '#00ff00';
            this.stripCtx.font = `bold ${this.fontSize}px 'Orbitron', monospace`;
            this.stripCtx.shadowColor = '#00ff00';
            this.stripCtx.shadowBlur = 10;
            
            for (let i = 0; i < this.stripDrops.length; i++) {
                const char = this.chars[Math.floor(Math.random() * this.chars.length)];
                const x = i * this.fontSize;
                const y = this.stripDrops[i] * this.fontSize;
                
                // Only draw if within strip
                if (y < 150 && y > 0) {
                    this.stripCtx.fillText(char, x, y);
                }
                
                // Reset when below strip
                if (y > 150 && Math.random() > 0.95) {
                    this.stripDrops[i] = 0;
                }
                this.stripDrops[i]++;
            }
            
            this.stripAnimationFrame = requestAnimationFrame(animateStrip);
        };
        
        animateStrip();
    }
    
    updateMessage(text) {
        if (this.loadingMessage) {
            this.loadingMessage.textContent = text;
        }
    }
    
    completeTransition() {
        // Stop strip animation
        if (this.stripAnimationFrame) {
            cancelAnimationFrame(this.stripAnimationFrame);
        }
        
        console.log('Transition complete, navigating to:', this.nextPage);
        
        // Navigate to next page
        if (this.nextPage) {
            window.location.href = this.nextPage;
        }
    }
}

// Initialize transition when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Only run on loading page
    if (window.location.pathname.includes('loading.html')) {
        new MatrixTransition();
    }
});

// Navigation helper function
function navigateWithMatrixTransition(from, to) {
    console.log('Navigating with matrix transition:', from, '→', to);
    const transitionUrl = `loading.html?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    window.location.href = transitionUrl;
}

// Export helper
window.navigateWithMatrixTransition = navigateWithMatrixTransition;

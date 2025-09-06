// inject-head.js - dynamically inserts shared head.html fragment into document head
(function() {
  function insertHeadFragment(html) {
    var template = document.createElement('template');
    template.innerHTML = html.trim();
    document.head.appendChild(template.content);
  }

  // Fetch head fragment relative to the page
  fetch('head.html', {cache: 'no-store'})
    .then(function(res) { if (!res.ok) throw new Error('Failed to load head.html'); return res.text(); })
    .then(function(html) { insertHeadFragment(html); })
    .catch(function(err) { console.warn('inject-head failed:', err); });
})();

// inject-header.js - dynamically inserts shared header.html fragment into document body
(function() {
  function insertHeaderFragment(html) {
    var template = document.createElement('template');
    template.innerHTML = html.trim();
    // Insert at the top of <body>
    if (document.body.firstChild) {
      document.body.insertBefore(template.content, document.body.firstChild);
    } else {
      document.body.appendChild(template.content);
    }

    // After inserting, mark the active nav-link based on current location
    try {
      var current = location.pathname.split('/').pop() || 'index.html';
      var links = document.querySelectorAll('.nav-menu .nav-link');
      links.forEach(function(link) {
        // normalize href value
        var href = (link.getAttribute('href') || '').split('/').pop();
        if (href === current) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    } catch (e) {
      // noop
    }

    // Notify that header has been injected so other scripts can initialize
    try {
      var ev = new CustomEvent('header-injected', { detail: { injected: true } });
      document.dispatchEvent(ev);
    } catch (e) { /* noop */ }
    
    // Add contact page class for special social icon handling
    var currentPage = location.pathname.split('/').pop() || 'index.html';
    if (currentPage === 'contact.html') {
      document.body.classList.add('contact-page');
    }
  }

  // Fetch header fragment relative to the page
  fetch('header.html', {cache: 'no-store'})
    .then(function(res) { if (!res.ok) throw new Error('Failed to load header.html'); return res.text(); })
    .then(function(html) { insertHeaderFragment(html); })
    .catch(function(err) { console.warn('inject-header failed:', err); });
})();

// Header and mobile navigation initialization (run after header is available)
function initHeader() {
    const mobileToggleEl = document.getElementById('mobile-toggle');
    const navMenuEl = document.querySelector('.nav-menu');
    const navLinksEl = document.querySelectorAll('.nav-link');

    if (!navMenuEl || !mobileToggleEl) return;

    function toggleMobileMenu() {
        const isActive = navMenuEl.classList.contains('active');
        if (isActive) {
            navMenuEl.classList.remove('active');
            mobileToggleEl.classList.remove('active');
            document.body.style.overflow = '';
        } else {
            navMenuEl.classList.add('active');
            mobileToggleEl.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    // Add click event to mobile toggle button
    mobileToggleEl.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMobileMenu();
    });

    // Close menu when clicking on nav links
    navLinksEl.forEach(link => {
        link.addEventListener('click', () => {
            navMenuEl.classList.remove('active');
            mobileToggleEl.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navMenuEl.classList.contains('active')) return;
        if (!navMenuEl.contains(e.target) && !mobileToggleEl.contains(e.target)) {
            navMenuEl.classList.remove('active');
            mobileToggleEl.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Close menu with escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenuEl.classList.contains('active')) {
            toggleMobileMenu();
        }
    });
}

// Run once if header already present
document.addEventListener('DOMContentLoaded', initHeader);
// Re-run when header is injected dynamically
document.addEventListener('header-injected', initHeader);

// Ensure any user interaction (touch/click/pointerdown) reveals the header immediately.
function ensureHeaderShowsOnInteraction() {
    function showHeaderOnInteraction() {
        const header = document.getElementById('header');
        if (!header) return;
        header.classList.remove('header-hidden');
    }

    // Make sure handlers are idempotent when added multiple times
    ['touchstart', 'pointerdown', 'mousedown', 'click'].forEach(evt => {
        document.addEventListener(evt, showHeaderOnInteraction, { passive: true });
    });
}

document.addEventListener('DOMContentLoaded', ensureHeaderShowsOnInteraction);
document.addEventListener('header-injected', ensureHeaderShowsOnInteraction);

// Mobile Performance and Touch Enhancements
document.addEventListener('DOMContentLoaded', function() {
    // Detect if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                    (window.innerWidth <= 768 && window.innerHeight <= 1024);

    if (isMobile) {
        // Add mobile-specific class to body
        document.body.classList.add('mobile-device');

        // Improve touch scrolling performance
        document.addEventListener('touchstart', function() {}, { passive: true });
        document.addEventListener('touchmove', function() {}, { passive: true });

        // Prevent double-tap zoom on buttons and links
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

    // Helpers to access header/menu elements (may be injected later)
    function getNavMenu() { return document.querySelector('.nav-menu'); }
    function getMobileToggle() { return document.getElementById('mobile-toggle'); }

    // Add swipe gesture for mobile menu (optional enhancement)
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        document.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const swipeThreshold = 50;
            const swipeDistance = touchEndX - touchStartX;

            if (Math.abs(swipeDistance) > swipeThreshold) {
                const navMenu = getNavMenu();
                const mobileToggle = getMobileToggle();
                if (!navMenu || !mobileToggle) return;

                if (swipeDistance > 0 && navMenu.classList.contains('active')) {
                    // Swipe right to close menu
                    navMenu.classList.remove('active');
                    mobileToggle.classList.remove('active');
                    document.body.style.overflow = '';
                } else if (swipeDistance < 0 && !navMenu.classList.contains('active')) {
                    // Swipe left to open menu (optional)
                    // navMenu.classList.add('active'); mobileToggle.classList.add('active');
                }
            }
        }
    }

    // Enhanced scroll performance
    let scrollTimer;
    window.addEventListener('scroll', function() {
        if (!scrollTimer) {
            scrollTimer = setTimeout(function() {
                // Header scroll effect
                const header = document.getElementById('header');
                if (header) {
                    if (window.scrollY > 50) {
                        header.classList.add('scrolled');
                    } else {
                        header.classList.remove('scrolled');
                    }
                }

                // Parallax effect for hero image
                const heroImage = document.querySelector('.hero-image img');
                if (heroImage) {
                    const scrolled = window.pageYOffset;
                    heroImage.style.transform = `translateY(${scrolled * 0.5}px)`;
                }

                // Trigger animations for elements in viewport
                const animateElements = document.querySelectorAll('.animate');
                animateElements.forEach(element => {
                    const elementTop = element.getBoundingClientRect().top;
                    const elementBottom = element.getBoundingClientRect().bottom;
                    const isVisible = (elementTop < window.innerHeight - 100) && (elementBottom > 0);

                    if (isVisible) {
                        element.classList.add('animated');
                    }
                });

                scrollTimer = null;
            }, 16); // ~60fps
        }
    }, { passive: true });

    // Auto-hide header when user is idle for 2 seconds (desktop only)
    (function headerAutoHide() {
        // Only enable auto-hide on pointer-capable (desktop) devices. Touch devices
        // with coarse pointers often expect the header to remain visible.
        if (window.matchMedia && !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            return; // skip auto-hide on touch/mobile devices
        }

        const headerEl = document.getElementById('header');
        if (!headerEl) return;

        let idleTimer = null;
        const IDLE_DELAY = 2000; // 2 seconds

        function showHeader() {
            headerEl.classList.remove('header-hidden');
        }

        function hideHeader() {
            // don't hide when mobile menu is open
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu && navMenu.classList.contains('active')) return;
            headerEl.classList.add('header-hidden');
        }

        function resetTimer() {
            showHeader();
            if (idleTimer) clearTimeout(idleTimer);
            idleTimer = setTimeout(hideHeader, IDLE_DELAY);
        }

        // Events that indicate user activity
        ['mousemove','pointermove','scroll','keydown'].forEach(evt => {
            document.addEventListener(evt, resetTimer, { passive: true });
        });

        // Start the timer after initial load
        idleTimer = setTimeout(hideHeader, IDLE_DELAY);

        // When the mobile menu opens/closes show header
        const mobileToggleEl = document.getElementById('mobile-toggle');
        if (mobileToggleEl) {
            mobileToggleEl.addEventListener('click', () => {
                resetTimer();
            });
        }
    })();

    // Initialize animations on page load
    setTimeout(() => {
        const initialAnimateElements = document.querySelectorAll('.animate');
        initialAnimateElements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('animated');
            }, index * 100);
        });
    }, 100);

    /* JS-driven marquee: responsive, smooth, pause-on-hover/touch, respects reduced-motion */
    async function initMarquee() {
        const track = document.querySelector('.marquee-track');
        if (!track) return;
        const container = track.closest('.marquee-container') || track.parentElement;

        // Respect user preference for reduced motion
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            console.info('marquee: reduced-motion enabled, skipping animation');
            return;
        }

        // Wait for images inside the track to decode so measurements are accurate (important on mobile)
        const imgs = Array.from(track.querySelectorAll('img'));
        try {
            await Promise.all(imgs.map(img => img.complete ? Promise.resolve() : img.decode().catch(() => {})));
        } catch (e) {
            // if decode is not supported or fails, continue - measurements may still work
        }

        console.info('marquee: initializing', { trackChildren: track.children.length, containerWidth: container.offsetWidth, trackWidth: track.scrollWidth });

        // Base speed (px/sec) - use same value across viewports so mobile motion matches desktop
        function getSpeed() {
            return 65;
        }

        // Ensure the track is long enough for a seamless loop by cloning children (more conservative)
        const MAX_CLONES = 12;
        let cloneCount = 0;
        // Aim for at least 2x the container width to be safe
        while (track.scrollWidth < container.offsetWidth * 2 && cloneCount < MAX_CLONES) {
            const nodes = Array.from(track.children).map(n => n.cloneNode(true));
            nodes.forEach(n => track.appendChild(n));
            cloneCount++;
        }

        track.style.willChange = 'transform';

        // If on small screens, tweak gap so approximately 4 logos are visible across the container
        try {
            const isPhone = window.innerWidth <= 767;
            if (isPhone) {
                const desiredVisible = 4;
                const sample = track.querySelector('.integration-logo');
                if (sample) {
                    const logoWidth = sample.getBoundingClientRect().width;
                    const containerWidth = container.getBoundingClientRect().width;
                    // Compute ideal gap between logos so desiredVisible fit exactly (non-negative)
                    let idealGap = (containerWidth - (desiredVisible * logoWidth)) / (Math.max(1, desiredVisible - 1));
                    // enforce sensible min/max
                    const minGap = 6; // px
                    const maxGap = 32; // px
                    if (!isFinite(idealGap) || idealGap < minGap) idealGap = minGap;
                    if (idealGap > maxGap) idealGap = maxGap;
                    // Apply as CSS variable so styles update layout
                    document.documentElement.style.setProperty('--integration-gap', idealGap + 'px');
                }
            }
        } catch (e) { /* ignore layout calc errors */ }

        let speed = getSpeed();
        let pos = 0; // current translateX in pixels
        let lastTime = null;
        let rafId = null;

        function step(timestamp) {
            if (lastTime === null) lastTime = timestamp;
            const dt = (timestamp - lastTime) / 1000; // seconds
            lastTime = timestamp;

            // Move left by speed*dt (continuous from right to left)
            pos -= speed * dt;

            // Wrap when we've moved past half the track width (safe for duplicated content)
            const wrapAt = track.scrollWidth / 2 || 0;
            if (wrapAt && Math.abs(pos) >= wrapAt) {
                pos += wrapAt;
            }

            track.style.transform = `translateX(${pos}px)`;
            rafId = requestAnimationFrame(step);
        }

        // Start animation
        rafId = requestAnimationFrame(step);

        // debug: expose controls for console
        try {
            window.__marquee = window.__marquee || {};
            window.__marquee.pause = pause;
            window.__marquee.resume = resume;
            window.__marquee.track = track;
            window.__marquee.container = container;
        } catch (e) { /* noop */ }

        // Pause/resume handlers
        function pause() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; lastTime = null; } }
        function resume() { if (!rafId) rafId = requestAnimationFrame(step); }

    // Keep marquee running continuously on all devices - do not install hover/touch pause handlers

        // Responsive adjustments
        let resizeTimer = null;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                speed = getSpeed();
                // if track is not long enough after resize, attempt to clone a bit more
                if (track.scrollWidth < container.offsetWidth * 2 && cloneCount < MAX_CLONES) {
                    const nodes = Array.from(track.children).map(n => n.cloneNode(true));
                    nodes.forEach(n => track.appendChild(n));
                    cloneCount++;
                }
            }, 150);
        }, { passive: true });
    }

    // Initialize marquee after short delay to ensure layout is settled
    setTimeout(initMarquee, 150);
});

// Project filtering - REMOVED to avoid conflicts with projects.html inline script
// const filterButtons = document.querySelectorAll('.filter-btn');
// const projectCards = document.querySelectorAll('.project-card');
// filterButtons.forEach(button => {
//     button.addEventListener('click', () => {
//         filterButtons.forEach(btn => btn.classList.remove('active'));
//         button.classList.add('active');
//         const filterValue = button.getAttribute('data-filter');
//         projectCards.forEach(card => {
//             const cardCategory = card.getAttribute('data-category');
//             if (filterValue === 'all' || filterValue === cardCategory) {
//                 card.style.display = 'block';
//                 setTimeout(() => {
//                     card.classList.add('visible');
//                 }, 50);
//             } else {
//                 card.classList.remove('visible');
//                 setTimeout(() => {
//                     card.style.display = 'none';
//                 }, 300);
//             }
//         });
//     });
// });

// Testimonial slider
const testimonials = document.querySelectorAll('.testimonial');
const testimonialControls = document.querySelectorAll('.testimonial-control');
testimonialControls.forEach(control => {
    control.addEventListener('click', () => {
        const index = control.getAttribute('data-index');
        testimonials.forEach(testimonial => testimonial.classList.remove('active'));
        testimonialControls.forEach(ctrl => ctrl.classList.remove('active'));
        testimonials[index].classList.add('active');
        control.classList.add('active');
    });
});
let testimonialIndex = 0;
function rotateTestimonials() {
    testimonialIndex = (testimonialIndex + 1) % testimonials.length;
    testimonials.forEach(testimonial => testimonial.classList.remove('active'));
    testimonialControls.forEach(ctrl => ctrl.classList.remove('active'));
    testimonials[testimonialIndex].classList.add('active');
    testimonialControls[testimonialIndex].classList.add('active');
}
if (testimonials.length > 0) {
    setInterval(rotateTestimonials, 5000);
}

// Counter animation for stats
const statNumbers = document.querySelectorAll('.stat-number');
let counted = false;
function animateCounters() {
    if (counted) return;
    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-count'));
        let count = 0;
        const duration = 2000;
        const increment = target / (duration / 16);
        const updateCount = () => {
            if (count < target) {
                count += increment;
                stat.textContent = Math.round(count);
                requestAnimationFrame(updateCount);
            } else {
                stat.textContent = target;
            }
        };
        updateCount();
    });
    counted = true;
}

// Skills progress bars animation
function animateSkillBars() {
    const progressBars = document.querySelectorAll('.progress-bar');
    progressBars.forEach((bar, index) => {
        setTimeout(() => {
            const skill = bar.getAttribute('data-skill');
            if (skill) {
                bar.style.setProperty('--progress-width', skill + '%');
                bar.classList.add('animated');
            }
        }, index * 200);
    });
}

// Enhanced intersection observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animated');
            
            // Trigger specific animations based on element type
            if (entry.target.classList.contains('about-stats')) {
                animateCounters();
            }
            
            if (entry.target.classList.contains('skills-grid')) {
                setTimeout(animateSkillBars, 500);
            }
        }
    });
}, observerOptions);

// Observe all animate elements
document.addEventListener('DOMContentLoaded', function() {
    const animateElements = document.querySelectorAll('.animate');
    animateElements.forEach(el => observer.observe(el));
    
    // Also observe stats and skills sections
    const statsSection = document.querySelector('.about-stats');
    const skillsSection = document.querySelector('.skills-grid');
    
    if (statsSection) observer.observe(statsSection);
    if (skillsSection) observer.observe(skillsSection);
});

// Form submission with better UX
const contactForm = document.getElementById('contactForm');
const successMessage = document.getElementById('successMessage');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Show loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;
        
        // Simulate form submission (replace with actual form handling)
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Show success message
            if (successMessage) {
                successMessage.style.display = 'block';
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 5000);
            }
            
            // Reset form
            contactForm.reset();
            
        } catch (error) {
            alert('There was an error sending your message. Please try again.');
        } finally {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
    
    // Real-time form validation
    const inputs = contactForm.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearErrors);
    });
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    // Remove existing error styling
    field.classList.remove('error');
    
    // Validate based on field type
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    if (field.type === 'email' && value && !isValidEmail(value)) {
        showFieldError(field, 'Please enter a valid email address');
        return false;
    }
    
    return true;
}

function clearErrors(e) {
    const field = e.target;
    field.classList.remove('error');
    const errorMsg = field.parentNode.querySelector('.error-message');
    if (errorMsg) {
        errorMsg.remove();
    }
}

function showFieldError(field, message) {
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = 'var(--accent)';
    errorDiv.style.fontSize = '0.8rem';
    errorDiv.style.marginTop = '0.5rem';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Dark mode feature removed — prefer consistent light design

// ===== LAZY LOADING ENHANCEMENT =====
document.addEventListener('DOMContentLoaded', function() {
    // Lazy load images with intersection observer
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
    } else {
        // Fallback for browsers without IntersectionObserver
        lazyImages.forEach(img => {
            img.classList.add('loaded');
        });
    }
});

// SKILLS NAMES MARQUEE removed per user request. No running names or pause control.

// ===== PARALLAX EFFECTS =====
document.addEventListener('DOMContentLoaded', function() {
    const parallaxElements = document.querySelectorAll('.project-card');

    function updateParallax() {
        const scrolled = window.pageYOffset;

        parallaxElements.forEach((element, index) => {
            const rate = (index % 2 === 0) ? 0.5 : -0.5;
            const yPos = -(scrolled * rate);
            element.style.transform = `translateY(${yPos}px)`;
        });
    }

    // Only enable parallax on desktop for performance
    if (window.innerWidth >= 1024) {
        window.addEventListener('scroll', updateParallax, { passive: true });
    }

    // Parallax effect
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        document.querySelectorAll('.project-card').forEach(card => {
            card.style.transform = `translateY(${scrolled * 0.05}px)`;
        });
    }, { passive: true });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeProjectModal();
    });
});

// ===== ACCESSIBILITY IMPROVEMENTS =====
document.addEventListener('DOMContentLoaded', function() {
    // Add focus management for modal
    const modal = document.getElementById('projectModal');
    if (modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        modal.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }

    // Add ARIA labels for better screen reader support
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        const title = card.querySelector('.card-title');
        const desc = card.querySelector('.card-description');
        if (title && desc) {
            card.setAttribute('aria-label', `${title.textContent}: ${desc.textContent}`);
        }
    });
});

// ===== FLOATING SOCIAL ICONS AUTO-HIDE =====
document.addEventListener('DOMContentLoaded', function() {
    const floatingSocial = document.querySelector('.floating-social');
    if (!floatingSocial) return;

    let hideTimeout;
    let lastTouchTime = 0;
    
    // Function to show floating icons
    function showFloatingIcons() {
        floatingSocial.classList.remove('hidden');
        clearTimeout(hideTimeout);
        
        // Set timeout to hide after 3 seconds of no interaction
        hideTimeout = setTimeout(() => {
            floatingSocial.classList.add('hidden');
        }, 3000);
    }
    
    // Function to hide floating icons
    function hideFloatingIcons() {
        floatingSocial.classList.add('hidden');
        clearTimeout(hideTimeout);
    }
    
    // Show icons on touch/interaction
    function handleInteraction() {
        lastTouchTime = Date.now();
        showFloatingIcons();
    }
    
    // Touch and mouse events
    document.addEventListener('touchstart', handleInteraction, { passive: true });
    document.addEventListener('touchmove', handleInteraction, { passive: true });
    document.addEventListener('mousemove', handleInteraction, { passive: true });
    document.addEventListener('scroll', handleInteraction, { passive: true });
    
    // For desktop devices, only hide on mobile/touch devices
    function isTouchDevice() {
        return (('ontouchstart' in window) ||
                (navigator.maxTouchPoints > 0) ||
                (navigator.msMaxTouchPoints > 0));
    }
    
    // Initialize - only auto-hide on touch devices
    if (isTouchDevice()) {
        // Start hidden
        hideFloatingIcons();
        
        // Show briefly on page load
        setTimeout(() => {
            showFloatingIcons();
        }, 1000);
    } else {
        // On desktop, always show
        showFloatingIcons();
        clearTimeout(hideTimeout); // Don't auto-hide on desktop
    }
});

// ===== PERFORMANCE OPTIMIZATIONS =====
document.addEventListener('DOMContentLoaded', function() {
    // Preload critical resources
    const criticalImages = document.querySelectorAll('.project-image img');
    criticalImages.forEach(img => {
        if (img.offsetTop < window.innerHeight) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = img.src;
            document.head.appendChild(link);
        }
    });

    // Add loading states
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.classList.add('loaded');
        });

        img.addEventListener('error', function() {
            this.classList.add('error');
        });
    });
});

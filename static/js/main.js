/**
 * IJAZ_SOLUTIONS — Premium Interactive Engine
 * High-performance, accessibility-first vanilla JavaScript:
 * - 3D Dimensional Hero Object Perspective Rig
 * - Subtle Pointer Spotlights & Card Highlights
 * - Magnetic CTA Buttons with Spring Return
 * - Subtle Project Card 3D Tilt
 * - Single-Pass Scroll Reveal Engine
 * - Dynamic Mobile Navigation & Sticky Header
 * - AJAX Inquiry Form with Real-time Field Validation
 * - FAQ Accordions & Client-side Portfolio Filter
 */

document.addEventListener('DOMContentLoaded', () => {
    // Flag to enable JS-enhanced transitions safely without breaking no-JS layout
    document.documentElement.classList.add('js-ready');

    initNavigation();
    initStickyHeader();
    initFaqAccordion();
    initPortfolioFilter();
    initAjaxContactForm();
    initStatCounters();

    // Check motion and hover capabilities before initializing pointer enhancements
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (!prefersReducedMotion && canHover) {
        initHero3DPerspective();
        initPointerSpotlight();
        initMagneticButtons();
        initProjectCardTilt();
    }

    initScrollReveals(prefersReducedMotion);
});

/**
 * 1. 3D Dimensional Hero Object Perspective Rig
 * Responds smoothly to pointer movement with damped lerping.
 * Pauses automatically when off-screen or when browser tab is hidden.
 */
function initHero3DPerspective() {
    const hero = document.getElementById('hero');
    const rig = document.getElementById('hero-3d-rig');
    const dimensionalObj = hero ? hero.querySelector('.dimensional-object') : null;
    if (!hero || !rig) return;

    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;

    let targetObjX = 0;
    let targetObjY = 0;
    let currentObjX = 0;
    let currentObjY = 0;

    let isHovering = false;
    let isVisible = true;
    let animFrameId = null;

    // Observe hero visibility to conserve CPU/battery when scrolled away
    const heroObserver = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && isHovering && !animFrameId) {
            startLoop();
        } else if (!isVisible && animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
    }, { threshold: 0.1 });
    heroObserver.observe(hero);

    // Pause on tab visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        } else if (!document.hidden && isVisible && isHovering) {
            startLoop();
        }
    });

    const updateLoop = () => {
        // Damped linear interpolation for buttery smoothness
        currentRotX += (targetRotX - currentRotX) * 0.08;
        currentRotY += (targetRotY - currentRotY) * 0.08;

        currentObjX += (targetObjX - currentObjX) * 0.08;
        currentObjY += (targetObjY - currentObjY) * 0.08;

        // Controlled rotation strictly capped to ~3 degrees on each axis
        rig.style.transform = `perspective(1200px) rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg)`;

        // Independent slight parallax translation for floating geometric object
        if (dimensionalObj) {
            dimensionalObj.style.transform = `translate3d(${currentObjX.toFixed(1)}px, ${currentObjY.toFixed(1)}px, 0)`;
        }

        // Continue loop if active or until settled back to 0
        const isSettled = Math.abs(targetRotX - currentRotX) < 0.02 && 
                          Math.abs(targetRotY - currentRotY) < 0.02 &&
                          Math.abs(targetObjX - currentObjX) < 0.04 &&
                          Math.abs(targetObjY - currentObjY) < 0.04;

        if (!isSettled || isHovering) {
            animFrameId = requestAnimationFrame(updateLoop);
        } else {
            rig.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
            if (dimensionalObj) {
                dimensionalObj.style.transform = 'translate3d(0, 0, 0)';
            }
            animFrameId = null;
        }
    };

    function startLoop() {
        if (!animFrameId) {
            animFrameId = requestAnimationFrame(updateLoop);
        }
    }

    hero.addEventListener('pointermove', (e) => {
        if (!isVisible) return;
        isHovering = true;
        const rect = hero.getBoundingClientRect();
        const normX = ((e.clientX - rect.left) / rect.width) - 0.5; // -0.5 to 0.5
        const normY = ((e.clientY - rect.top) / rect.height) - 0.5;

        // Controlled rotation angles strictly limited to ~3 degrees max
        targetRotY = normX * 6;  // max +/- 3deg
        targetRotX = -normY * 6; // max +/- 3deg

        // Subtle independent parallax on floating geometric object
        targetObjX = normX * 12; // max +/- 6px
        targetObjY = normY * 10; // max +/- 5px

        // Ambient spotlight coordinates
        hero.style.setProperty('--spotlight-x', `${(e.clientX - rect.left).toFixed(0)}px`);
        hero.style.setProperty('--spotlight-y', `${(e.clientY - rect.top).toFixed(0)}px`);
        hero.style.setProperty('--spotlight-opacity', '1');

        startLoop();
    }, { passive: true });

    hero.addEventListener('pointerleave', () => {
        isHovering = false;
        targetRotX = 0;
        targetRotY = 0;
        targetObjX = 0;
        targetObjY = 0;
        hero.style.setProperty('--spotlight-opacity', '0');
        startLoop();
    });
}

/**
 * 2. Subtle Pointer Spotlight
 * Tracks pointer coordinates on cards to produce soft localized cyan reflections.
 */
function initPointerSpotlight() {
    const spotlightCards = document.querySelectorAll('.card, .challenge-card, .service-card, .project-card');
    if (!spotlightCards.length) return;

    spotlightCards.forEach(card => {
        card.addEventListener('pointermove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        }, { passive: true });
    });
}

/**
 * 3. Magnetic CTA Buttons
 * Subtle translation toward pointer on hover with smooth spring return.
 */
function initMagneticButtons() {
    const magneticBtns = document.querySelectorAll('.btn--magnetic');
    if (!magneticBtns.length) return;

    magneticBtns.forEach(btn => {
        let isHovered = false;

        btn.addEventListener('pointermove', (e) => {
            isHovered = true;
            const rect = btn.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const deltaX = (e.clientX - centerX) * 0.22;
            const deltaY = (e.clientY - centerY) * 0.22;

            // Clamped translation range (max 6px) to avoid displacing click target
            const clampedX = Math.max(-6, Math.min(6, deltaX));
            const clampedY = Math.max(-6, Math.min(6, deltaY));

            btn.style.transform = `translate(${clampedX.toFixed(1)}px, ${clampedY.toFixed(1)}px)`;
        }, { passive: true });

        btn.addEventListener('pointerleave', () => {
            isHovered = false;
            btn.style.transform = 'translate(0px, 0px)';
        });
    });
}

/**
 * 4. Subtle Project Card 3D Tilt
 * High-end tactile feedback on desktop project showcases.
 */
function initProjectCardTilt() {
    const projectCards = document.querySelectorAll('.project-card, .card--project');
    if (!projectCards.length) return;

    projectCards.forEach(card => {
        card.addEventListener('pointermove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const normX = (x / rect.width) - 0.5;
            const normY = (y / rect.height) - 0.5;

            // Subtle 3.5 deg tilt max
            const rotY = (normX * 5).toFixed(2);
            const rotX = (-normY * 5).toFixed(2);

            card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
        }, { passive: true });

        card.addEventListener('pointerleave', () => {
            card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        });
    });
}

/**
 * 5. Single-Pass Scroll Reveal Engine
 * Accessible, performance-conscious entrance animation.
 */
function initScrollReveals(prefersReducedMotion) {
    const targets = document.querySelectorAll('.reveal-on-scroll, .section__header, .challenges, .services-grid, .projects-grid, .why-us__grid, .process-timeline, .faq-list');
    if (!targets.length) return;

    if (prefersReducedMotion) {
        targets.forEach(el => el.classList.add('is-revealed'));
        return;
    }

    targets.forEach(el => el.classList.add('reveal-on-scroll'));

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
                obs.unobserve(entry.target); // Reveal exactly once
            }
        });
    }, {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
    });

    targets.forEach(el => observer.observe(el));
}

/**
 * 6. Mobile Navigation & Backdrop
 */
function initNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const mobileMenu = document.getElementById('nav-mobile-menu');
    if (!navToggle || !mobileMenu) return;

    const toggleMenu = (open) => {
        const isOpen = open !== undefined ? open : !mobileMenu.classList.contains('nav__mobile-menu--open');
        mobileMenu.classList.toggle('nav__mobile-menu--open', isOpen);
        navToggle.classList.toggle('nav__toggle--active', isOpen);
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        document.body.classList.toggle('menu-open', isOpen);
    };

    navToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    document.addEventListener('click', (e) => {
        if (!mobileMenu.contains(e.target) && !navToggle.contains(e.target)) {
            toggleMenu(false);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') toggleMenu(false);
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => toggleMenu(false));
    });
}

/**
 * 7. Sticky Navigation with Elevation on Scroll
 */
function initStickyHeader() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    let ticking = false;
    const handleScroll = () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                if (window.scrollY > 25) {
                    nav.classList.add('nav--scrolled');
                } else {
                    nav.classList.remove('nav--scrolled');
                }
                ticking = false;
            });
            ticking = true;
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
}

/**
 * 8. FAQ Accordion Toggle
 */
function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    if (!faqItems.length) return;

    faqItems.forEach(item => {
        const trigger = item.querySelector('.faq-question') || item.querySelector('.faq-item__trigger');
        if (!trigger) return;

        trigger.addEventListener('click', () => {
            const isActive = item.classList.contains('faq-item--active') || item.classList.contains('faq-item--open');

            // Close other items in the same list
            const parent = item.closest('.faq-list');
            if (parent) {
                parent.querySelectorAll('.faq-item--active, .faq-item--open').forEach(openItem => {
                    if (openItem !== item) {
                        openItem.classList.remove('faq-item--active', 'faq-item--open');
                        const btn = openItem.querySelector('.faq-question') || openItem.querySelector('.faq-item__trigger');
                        if (btn) btn.setAttribute('aria-expanded', 'false');
                    }
                });
            }

            if (isActive) {
                item.classList.remove('faq-item--active', 'faq-item--open');
                trigger.setAttribute('aria-expanded', 'false');
            } else {
                item.classList.add('faq-item--active', 'faq-item--open');
                trigger.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

/**
 * 9. Client-Side Portfolio Category Filtering
 */
function initPortfolioFilter() {
    const filterButtons = document.querySelectorAll('[data-filter]');
    const portfolioCards = document.querySelectorAll('[data-category]');
    if (!filterButtons.length || !portfolioCards.length) return;

    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // If button is a link with server-side query, allow normal navigation if needed;
            // Otherwise enhance client-side
            const filterValue = btn.getAttribute('data-filter');

            filterButtons.forEach(b => {
                b.classList.remove('btn--primary', 'portfolio-filter--active');
                if (b !== btn) b.classList.add('btn--outline');
            });
            btn.classList.add('btn--primary', 'portfolio-filter--active');
            btn.classList.remove('btn--outline');

            portfolioCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filterValue === 'all' || category === filterValue) {
                    card.style.display = '';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 20);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(8px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 200);
                }
            });
        });
    });
}

/**
 * 10. Asynchronous Contact & Inquiry Form Submission
 */
function initAjaxContactForm() {
    const form = document.getElementById('contact-form') || document.getElementById('inquiry-form');
    if (!form) return;

    const responseContainer = document.getElementById('form-feedback') || document.createElement('div');
    if (!form.contains(responseContainer) && !responseContainer.parentNode) {
        responseContainer.id = 'form-feedback';
        responseContainer.className = 'form-feedback';
        form.appendChild(responseContainer);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : 'Submit';

        // Clear previous feedback
        form.querySelectorAll('.form-field-error').forEach(el => el.remove());
        form.querySelectorAll('.input--error, .form-input--error').forEach(el => {
            el.classList.remove('input--error', 'form-input--error');
        });
        responseContainer.innerHTML = '';

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <span class="spinner" style="display:inline-block;width:1rem;height:1rem;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:spin 0.75s linear infinite;margin-right:8px;vertical-align:middle;"></span>
                Transmitting Inquiry...
            `;
        }

        const formData = new FormData(form);

        try {
            const response = await fetch(form.action || window.location.href, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                responseContainer.innerHTML = `
                    <div class="alert alert--success mb-6">
                        <div class="alert__icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        </div>
                        <div class="alert__content">
                            <strong>Inquiry Received:</strong> ${data.message}
                        </div>
                    </div>
                `;
                form.reset();
                responseContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                throw data;
            }
        } catch (err) {
            let message = 'Please review the marked fields below.';

            if (err && err.errors) {
                Object.keys(err.errors).forEach(field => {
                    const input = form.querySelector(`[name="${field}"]`);
                    if (input) {
                        input.classList.add('input--error', 'form-input--error');
                        const errorMsg = document.createElement('div');
                        errorMsg.className = 'form-field-error';
                        errorMsg.textContent = Array.isArray(err.errors[field]) ? err.errors[field][0] : err.errors[field];
                        input.parentNode.appendChild(errorMsg);
                    }
                });
            } else if (err && err.message) {
                message = err.message;
            }

            responseContainer.innerHTML = `
                <div class="alert alert--error mb-6">
                    <div class="alert__icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <div class="alert__content">
                        <strong>Submission Issue:</strong> ${message}
                    </div>
                </div>
            `;
            responseContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
    });
}

/**
 * 11. Animated Stats Counters
 */
function initStatCounters() {
    const stats = document.querySelectorAll('[data-counter]');
    if (!stats.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const endVal = parseFloat(target.getAttribute('data-counter'));
                const suffix = target.getAttribute('data-suffix') || '';
                const prefix = target.getAttribute('data-prefix') || '';
                const duration = 1500;
                const startTime = performance.now();

                const updateCounter = (currentTime) => {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                    const currentVal = Math.floor(ease * endVal);

                    target.textContent = `${prefix}${currentVal}${suffix}`;

                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    } else {
                        target.textContent = `${prefix}${endVal}${suffix}`;
                    }
                };

                requestAnimationFrame(updateCounter);
                obs.unobserve(target);
            }
        });
    }, { threshold: 0.3 });

    stats.forEach(s => observer.observe(s));
}

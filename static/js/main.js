/**
 * HIGH DECKZ — Clean Light Client Interactive Script
 * - Bulletproof reveal animations with 1.5s guaranteed visibility fallback
 * - Sticky header state transitions & announcement bar session dismissal
 * - Accessible mobile navigation with keyboard escape handling
 * - AJAX inquiry form submission with field validation feedback
 * - Offer prefill handler for ?offer=399 query parameter
 */

document.addEventListener('DOMContentLoaded', () => {
    initAnnouncementBar();
    initNavigation();
    initStickyHeader();
    initScrollReveals();
    initOfferPrefill();
    initAjaxContactForm();
});

/**
 * 1. Announcement Bar Dismissal (sessionStorage inside try/catch)
 */
function initAnnouncementBar() {
    const bar = document.getElementById('announcement-bar');
    const closeBtn = document.getElementById('announcement-close');
    if (!bar) return;

    try {
        if (sessionStorage.getItem('offer_banner_dismissed') === 'true') {
            bar.style.display = 'none';
            return;
        }
    } catch (e) {
        // Ignore storage exceptions
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            bar.style.display = 'none';
            try {
                sessionStorage.setItem('offer_banner_dismissed', 'true');
            } catch (e) {}
        });
    }
}

/**
 * 2. Mobile Navigation & Keyboard Accessibility (Focus Trap & Scroll Lock)
 */
function initNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const mobileMenu = document.getElementById('nav-mobile-menu');
    if (!navToggle || !mobileMenu) return;

    let previousActiveElement = null;

    const getFocusableElements = () => {
        return Array.from(
            mobileMenu.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
        ).filter(el => el.offsetWidth > 0 || el.offsetHeight > 0);
    };

    const toggleMenu = (open) => {
        const isOpen = open !== undefined ? open : !mobileMenu.classList.contains('is-active');
        
        if (isOpen) {
            previousActiveElement = document.activeElement;
            mobileMenu.classList.add('is-active');
            navToggle.classList.add('is-active');
            navToggle.setAttribute('aria-expanded', 'true');
            document.body.classList.add('menu-open');
            
            // Set focus to the first link inside the drawer
            const focusables = getFocusableElements();
            if (focusables.length > 0) {
                setTimeout(() => focusables[0].focus(), 50);
            }
        } else {
            mobileMenu.classList.remove('is-active');
            navToggle.classList.remove('is-active');
            navToggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('menu-open');
            
            if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
                previousActiveElement.focus();
            } else {
                navToggle.focus();
            }
        }
    };

    navToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (mobileMenu.classList.contains('is-active')) {
            if (!mobileMenu.contains(e.target) && !navToggle.contains(e.target)) {
                toggleMenu(false);
            }
        }
    });

    // Focus Trap & Escape key handling
    document.addEventListener('keydown', (e) => {
        if (!mobileMenu.classList.contains('is-active')) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            toggleMenu(false);
            return;
        }

        if (e.key === 'Tab') {
            const focusables = getFocusableElements();
            if (!focusables.length) return;

            const firstEl = focusables[0];
            const lastEl = focusables[focusables.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstEl || document.activeElement === navToggle) {
                    e.preventDefault();
                    lastEl.focus();
                }
            } else {
                if (document.activeElement === lastEl) {
                    e.preventDefault();
                    firstEl.focus();
                }
            }
        }
    });

    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => toggleMenu(false));
    });
}

/**
 * 3. Sticky Header Elevation on Scroll
 */
function initStickyHeader() {
    const header = document.getElementById('site-header');
    if (!header) return;

    let ticking = false;
    const updateHeader = () => {
        if (window.scrollY > 20) {
            header.classList.add('is-scrolled');
        } else {
            header.classList.remove('is-scrolled');
        }
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }, { passive: true });

    updateHeader();
}

/**
 * 4. Guaranteed Reveal Animations
 */
function initScrollReveals() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    const showAll = () => {
        reveals.forEach(el => el.classList.add('is-visible'));
    };

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        showAll();
        return;
    }

    // Fallback timer: ensure all content is visible after 1.5s
    setTimeout(showAll, 1500);

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: '0px 0px -40px 0px'
    });

    reveals.forEach(el => observer.observe(el));
}

/**
 * 5. Offer Prefill for ?offer=399
 * Prefills the Requirements textarea ONLY if empty on load
 */
function initOfferPrefill() {
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('offer') === '399') {
            const textarea = document.getElementById('inquiry-requirements') || document.getElementById('id_requirements');
            if (textarea && !textarea.value.trim()) {
                textarea.value = 'I am interested in the ₹399 first-time offer (3-4 page dynamic website).';
            }
            const budgetSelect = document.getElementById('inquiry-budget') || document.getElementById('id_budget');
            if (budgetSelect) {
                budgetSelect.value = 'offer-399';
            }
        }
    } catch (e) {}
}

/**
 * 6. Asynchronous Contact & Inquiry Form Submission
 */
function initAjaxContactForm() {
    const form = document.getElementById('inquiry-form') || document.getElementById('contact-form');
    if (!form) return;

    const responseContainer = document.getElementById('form-feedback') || document.createElement('div');
    if (!form.contains(responseContainer) && !responseContainer.parentNode) {
        responseContainer.id = 'form-feedback';
        form.prepend(responseContainer);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnContent = submitBtn ? submitBtn.innerHTML : 'Submit';

        // Clear previous errors & status
        form.querySelectorAll('.form-field-error').forEach(el => el.remove());
        form.querySelectorAll('.form-control-error').forEach(el => el.classList.remove('form-control-error'));
        responseContainer.innerHTML = '';

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <span class="btn-spinner" aria-hidden="true"></span>
                <span>Submitting inquiry...</span>
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
                    <div class="alert alert--success mb-6" role="alert">
                        <span class="alert__icon" aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        </span>
                        <div class="alert__content">
                            <strong>Success:</strong> ${data.message} We will review your project and confirm offer details within 24 hours.
                        </div>
                    </div>
                `;
                form.reset();
                responseContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                throw data;
            }
        } catch (err) {
            let message = 'Please review the highlighted fields below.';

            if (err && err.errors) {
                Object.keys(err.errors).forEach(fieldName => {
                    const fieldInput = form.querySelector(`[name="${fieldName}"]`);
                    if (fieldInput) {
                        fieldInput.classList.add('form-control-error');
                        const errorMsg = document.createElement('div');
                        errorMsg.className = 'form-field-error';
                        errorMsg.textContent = Array.isArray(err.errors[fieldName]) ? err.errors[fieldName][0] : err.errors[fieldName];
                        
                        const parentGroup = fieldInput.closest('.form-group') || fieldInput.parentNode;
                        parentGroup.appendChild(errorMsg);
                    }
                });
            } else if (err && err.message) {
                message = err.message;
            }

            responseContainer.innerHTML = `
                <div class="alert alert--error mb-6" role="alert">
                    <span class="alert__icon" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </span>
                    <div class="alert__content">
                        <strong>Please check your submission:</strong> ${message}
                    </div>
                </div>
            `;
            responseContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnContent;
            }
        }
    });
}

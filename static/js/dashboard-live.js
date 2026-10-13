/**
 * HIGH DECKZ — Live Hero Dashboard Stage Controller
 * Pure Vanilla JavaScript (Zero Dependencies, Zero Globals, High Performance)
 *
 * Capabilities:
 * - Whole Dashboard Stage Movement as ONE Unified Unit (.dash-stage)
 * - 3D Perspective Tilt on Mouse Movement with Smooth Lerp Easing (desktop/tablet)
 * - Idle Ambient Float (8px travel over 7s cycle) on Whole Stage
 * - Scroll Parallax Depth Drift (translateY up to 40px slower than page scroll)
 * - Layered Multi-Depth Parallax for Accent Chips (6px, 14px, 22px)
 * - Dynamic Radial Highlight Sheen following cursor coordinates
 * - Initial Progressive Bar Rise Animation + Ambient Day-Cycling every 3s
 * - Interactive Bar Day Selection on Click/Tap with Accessible Tooltips
 * - Live Viewport-Triggered Metric Counters ("14 Active", "128 hrs") with Believable Ticks
 * - Dynamic Activity Feed Sliding & Fading New Events from Believable Demo Pool
 * - Intelligent Lifecycle Management: Pauses when offscreen (IntersectionObserver),
 *   when tab is hidden (visibilitychange), or while user hovers/focuses the stage
 * - Accessibility Guard: Full bypass & static final render under prefers-reduced-motion
 */
(function () {
    'use strict';

    // Prevent duplicate script execution
    if (window.__highdeckz_dashboard_initialized) {
        return;
    }
    window.__highdeckz_dashboard_initialized = true;

    // ============================================================
    // CONFIGURATION (All tuning values consolidated in one place)
    // ============================================================
    const CONFIG = {
        // 3D Tilt (Degrees on whole dash-stage)
        desktopMaxTilt: 6,           // Max tilt rotation in degrees on desktop (>=1200px)
        tabletMaxTilt: 3,            // Max tilt rotation in degrees on tablet (768px-1199px)
        lerpFactor: 0.10,            // Easing interpolation factor (lerp) for smooth tilt return
        sheenEnabled: true,          // Enable dynamic radial sheen following mouse
        
        // Parallax Depths for Floating Chips on top of tilt (px offset at max tilt)
        parallaxDepths: {
            chip1: 14,               // Top-right AI Assistant chip
            chip2: 22,               // Left Booking Confirmed chip
            chip3: 6                 // Bottom-right Code Ownership chip
        },

        // Idle Float Animation (Whole dash-stage floating as one unit)
        idleFloatDistancePx: 8,      // Total peak-to-peak float travel distance (px)
        idleFloatDurationMs: 7000,   // Period of the float cycle (7 seconds)
        
        // Scroll Depth Drift (Whole dash-stage drifts up slower than page)
        maxScrollDriftPx: 40,        // Max translateY drift as hero scrolls out (px)
        scrollDriftFactor: 0.12,     // Ratio of scroll distance applied to drift

        // Ambient Bar Cycling
        barCycleIntervalMs: 3000,    // Time between ambient bar highlight changes
        barGrowDelayMs: 250,         // Delay before initial bar rise begins
        
        // Metric Counters
        counterDurationMs: 1200,     // Initial count-up duration from 0
        automationsBase: 14,         // Base count for automations
        automationsVariations: [14, 15, 14, 16], // Believable small live fluctuations
        automationsTickIntervalMs: 7000,         // Interval between automation metric ticks
        hoursBase: 128,              // Initial base for saved hours
        hoursCap: 136,               // Plausible ceiling for saved hours counter
        hoursTickIntervalMs: 4500,   // Interval to increment saved hours by +1

        // Activity Feed Cycling
        feedCycleIntervalMs: 4500,   // Time between new feed entries sliding in
        feedMaxVisible: 2,           // Maximum concurrent visible rows in feed

        // Secondary ambient float on chips (seconds)
        chipFloatDurations: {
            chip1: 6.2,
            chip2: 7.4,
            chip3: 5.8
        }
    };

    // Pool of realistic, modest demo activity messages
    const FEED_ITEMS_POOL = [
        { text: 'Data pipeline run completed', dot: 'indigo' },
        { text: 'Client portal webhook dispatched', dot: 'cyan' },
        { text: 'New booking synced to calendar', dot: 'green' },
        { text: 'Automated cloud backup finished', dot: 'indigo' },
        { text: 'Weekly analytics report generated', dot: 'cyan' },
        { text: 'Payment webhook verified', dot: 'green' },
        { text: 'AI inquiry triage completed', dot: 'cyan' },
        { text: 'Database index health check passed', dot: 'indigo' }
    ];

    // Helper: Linear interpolation
    function lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // Initialize Dashboard Stage Controller
    function initLiveDashboard() {
        const stage = document.querySelector('.dash-stage') || document.querySelector('.hero-mockup-wrapper');
        const card = document.querySelector('.hero-mockup');
        if (!stage || !card) return;

        // Elements
        const chip1 = stage.querySelector('.floating-chip--1');
        const chip2 = stage.querySelector('.floating-chip--2');
        const chip3 = stage.querySelector('.floating-chip--3');
        const sheen = card.querySelector('.hero-mockup__sheen');
        const barCols = card.querySelectorAll('.mockup-bar-col');
        const feedContainer = card.querySelector('#mockup-feed');
        const automationsEl = card.querySelector('#stat-automations');
        const hoursEl = card.querySelector('#stat-hours');

        // Check motion and touch preferences
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

        // Runtime state flags
        let isVisibleOnScreen = true;
        let isTabActive = !document.hidden;
        let isHoveredOrFocused = false;

        // Stage tilt & translation variables
        let targetRx = 0;
        let targetRy = 0;
        let currentRx = 0;
        let currentRy = 0;
        let currentTy = 0;
        let currentPx1 = 0, currentPy1 = 0;
        let currentPx2 = 0, currentPy2 = 0;
        let currentPx3 = 0, currentPy3 = 0;
        let targetPx1 = 0, targetPy1 = 0;
        let targetPx2 = 0, targetPy2 = 0;
        let targetPx3 = 0, targetPy3 = 0;
        let cachedRect = null;
        let currentScrollY = window.scrollY || 0;
        let rafId = null;

        // Ambient timer IDs
        let barCycleTimer = null;
        let feedCycleTimer = null;
        let hoursTickTimer = null;
        let automationsTickTimer = null;

        // Counter dynamic state
        let currentHours = CONFIG.hoursBase;
        let autoVariationIndex = 0;
        let countersInitialized = false;

        // Feed pool index tracker
        let poolIndex = 2; // initial 2 already present in template

        // ----------------------------------------------------
        // 1. Accessibility Guard: Reduced Motion
        // ----------------------------------------------------
        if (prefersReducedMotion) {
            barCols.forEach(col => {
                const bar = col.querySelector('.mockup-bar');
                const targetH = col.getAttribute('data-height');
                if (bar && targetH) {
                    bar.style.height = targetH + '%';
                    bar.style.transition = 'none';
                }
            });
            if (automationsEl) automationsEl.textContent = `${CONFIG.automationsBase} Active`;
            if (hoursEl) hoursEl.textContent = `${CONFIG.hoursBase} hrs`;
            return;
        }

        // ----------------------------------------------------
        // 2. Bar Chart Interactions & Ambient Cycling
        // ----------------------------------------------------
        let activeBarIndex = -1;
        barCols.forEach((col, idx) => {
            if (col.classList.contains('is-active') || col.querySelector('.mockup-bar--peak')) {
                activeBarIndex = idx;
            }
        });
        if (activeBarIndex === -1 && barCols.length > 0) {
            activeBarIndex = 5; // Default Saturday
        }

        function setActiveBar(index, userTriggered = false) {
            if (!barCols || barCols.length === 0) return;
            const targetIdx = (index + barCols.length) % barCols.length;
            activeBarIndex = targetIdx;

            barCols.forEach((col, idx) => {
                const bar = col.querySelector('.mockup-bar');
                if (idx === targetIdx) {
                    col.classList.add('is-active');
                    if (bar) bar.classList.add('mockup-bar--peak');
                } else {
                    col.classList.remove('is-active');
                    if (bar) bar.classList.remove('mockup-bar--peak');
                }
            });

            if (userTriggered) {
                resetAmbientTimers();
            }
        }

        barCols.forEach((col, idx) => {
            col.addEventListener('click', () => {
                setActiveBar(idx, true);
            });
        });

        // Initial Bar Rise Animation
        function animateInitialBarRise() {
            barCols.forEach((col, idx) => {
                const bar = col.querySelector('.mockup-bar');
                const targetHeight = col.getAttribute('data-height') || '50';
                if (bar) {
                    bar.style.height = '0%';
                    setTimeout(() => {
                        bar.style.transition = 'height 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
                        bar.style.height = `${targetHeight}%`;
                    }, CONFIG.barGrowDelayMs + (idx * 65));
                }
            });
        }
        animateInitialBarRise();

        function stepAmbientBarCycle() {
            if (!canRunAmbient()) return;
            const nextIdx = (activeBarIndex + 1) % barCols.length;
            setActiveBar(nextIdx, false);
        }

        // ----------------------------------------------------
        // 3. Metric Counters: Initial Count-Up & Live Ticks
        // ----------------------------------------------------
        function startCounters() {
            if (countersInitialized) return;
            countersInitialized = true;

            if (automationsEl) {
                animateNumber(0, CONFIG.automationsBase, CONFIG.counterDurationMs, (val) => {
                    automationsEl.textContent = `${Math.round(val)} Active`;
                });
            }

            if (hoursEl) {
                animateNumber(0, CONFIG.hoursBase, CONFIG.counterDurationMs, (val) => {
                    hoursEl.textContent = `${Math.round(val)} hrs`;
                });
            }
        }

        function animateNumber(start, end, duration, onUpdate) {
            const startTime = performance.now();
            function tick(now) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                const currentVal = start + (end - start) * ease;
                onUpdate(currentVal);
                if (progress < 1) {
                    requestAnimationFrame(tick);
                }
            }
            requestAnimationFrame(tick);
        }

        function stepHoursTick() {
            if (!canRunAmbient() || !hoursEl) return;
            if (currentHours < CONFIG.hoursCap) {
                currentHours += 1;
                hoursEl.textContent = `${currentHours} hrs`;
            }
        }

        function stepAutomationsTick() {
            if (!canRunAmbient() || !automationsEl) return;
            autoVariationIndex = (autoVariationIndex + 1) % CONFIG.automationsVariations.length;
            const nextVal = CONFIG.automationsVariations[autoVariationIndex];
            automationsEl.textContent = `${nextVal} Active`;
        }

        // ----------------------------------------------------
        // 4. Activity Feed Dynamic Transitions
        // ----------------------------------------------------
        function stepActivityFeed() {
            if (!canRunAmbient() || !feedContainer) return;

            const newItemData = FEED_ITEMS_POOL[poolIndex % FEED_ITEMS_POOL.length];
            poolIndex++;

            const newRow = document.createElement('div');
            newRow.className = 'mockup-feed__item mockup-feed__item--enter';
            newRow.innerHTML = `
                <span class="mockup-feed__dot mockup-feed__dot--${newItemData.dot}"></span>
                <span class="mockup-feed__text">${newItemData.text}</span>
                <span class="mockup-feed__time">just now</span>
            `;

            feedContainer.insertBefore(newRow, feedContainer.firstChild);

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    newRow.classList.remove('mockup-feed__item--enter');
                });
            });

            const existingItems = feedContainer.querySelectorAll('.mockup-feed__item');
            if (existingItems[1]) {
                const timeEl = existingItems[1].querySelector('.mockup-feed__time');
                if (timeEl) timeEl.textContent = '2m ago';
            }

            if (existingItems.length > CONFIG.feedMaxVisible) {
                for (let i = CONFIG.feedMaxVisible; i < existingItems.length; i++) {
                    const toRemove = existingItems[i];
                    toRemove.classList.add('mockup-feed__item--leave');
                    setTimeout(() => {
                        if (toRemove.parentNode === feedContainer) {
                            feedContainer.removeChild(toRemove);
                        }
                    }, 350);
                }
            }
        }

        // ----------------------------------------------------
        // 5. Unified Animation Loop (Stage Tilt, Float & Parallax)
        // ----------------------------------------------------
        function renderLoop(timestamp) {
            if (!isVisibleOnScreen || !isTabActive) {
                rafId = requestAnimationFrame(renderLoop);
                return;
            }

            // 1. Idle Ambient Float: 8px peak-to-peak over 7s cycle (sine wave)
            const floatCycle = (timestamp % CONFIG.idleFloatDurationMs) / CONFIG.idleFloatDurationMs;
            const idleFloatY = Math.sin(floatCycle * Math.PI * 2) * (CONFIG.idleFloatDistancePx * 0.5);

            // 2. Scroll Parallax Depth Drift: stage drifts up slower than page (up to 40px)
            const targetScrollDrift = Math.min(CONFIG.maxScrollDriftPx, Math.max(0, currentScrollY * CONFIG.scrollDriftFactor));

            // Combined Y translation
            const targetTy = -targetScrollDrift + idleFloatY;
            currentTy = lerp(currentTy, targetTy, 0.12);

            // 3. 3D Perspective Tilt on Mouse (applied to whole stage as one unit)
            currentRx = lerp(currentRx, targetRx, CONFIG.lerpFactor);
            currentRy = lerp(currentRy, targetRy, CONFIG.lerpFactor);

            // Apply transforms via CSS custom properties on stage
            stage.style.setProperty('--rx', `${currentRx.toFixed(2)}deg`);
            stage.style.setProperty('--ry', `${currentRy.toFixed(2)}deg`);
            stage.style.setProperty('--ty', `${currentTy.toFixed(2)}px`);

            // 4. Parallax offsets on individual chips
            currentPx1 = lerp(currentPx1, targetPx1, CONFIG.lerpFactor);
            currentPy1 = lerp(currentPy1, targetPy1, CONFIG.lerpFactor);
            currentPx2 = lerp(currentPx2, targetPx2, CONFIG.lerpFactor);
            currentPy2 = lerp(currentPy2, targetPy2, CONFIG.lerpFactor);
            currentPx3 = lerp(currentPx3, targetPx3, CONFIG.lerpFactor);
            currentPy3 = lerp(currentPy3, targetPy3, CONFIG.lerpFactor);

            if (chip1) {
                chip1.style.setProperty('--chip-px', `${currentPx1.toFixed(1)}px`);
                chip1.style.setProperty('--chip-py', `${currentPy1.toFixed(1)}px`);
            }
            if (chip2) {
                chip2.style.setProperty('--chip-px', `${currentPx2.toFixed(1)}px`);
                chip2.style.setProperty('--chip-py', `${currentPy2.toFixed(1)}px`);
            }
            if (chip3) {
                chip3.style.setProperty('--chip-px', `${currentPx3.toFixed(1)}px`);
                chip3.style.setProperty('--chip-py', `${currentPy3.toFixed(1)}px`);
            }

            rafId = requestAnimationFrame(renderLoop);
        }

        // Pointer event listeners (Desktop & Tablet only)
        if (!isTouchDevice) {
            function updateCachedRect() {
                cachedRect = stage.getBoundingClientRect();
            }

            stage.addEventListener('pointerenter', () => {
                updateCachedRect();
                if (sheen && CONFIG.sheenEnabled) {
                    sheen.style.opacity = '1';
                }
            }, { passive: true });

            stage.addEventListener('pointermove', (e) => {
                if (!cachedRect) updateCachedRect();
                const rect = cachedRect;
                if (!rect || rect.width === 0 || rect.height === 0) return;

                const clientX = e.clientX;
                const clientY = e.clientY;

                // Normalized [-1, 1] offset from stage center
                const normX = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width) * 2 - 1));
                const normY = Math.max(-1, Math.min(1, ((clientY - rect.top) / rect.height) * 2 - 1));

                // Tilt degrees based on viewport breakpoint
                const maxTilt = window.innerWidth < 1200 ? CONFIG.tabletMaxTilt : CONFIG.desktopMaxTilt;

                targetRx = -normY * maxTilt;
                targetRy = normX * maxTilt;

                // Parallax shifts for chips anchored inside stage
                targetPx1 = normX * CONFIG.parallaxDepths.chip1;
                targetPy1 = normY * CONFIG.parallaxDepths.chip1;
                targetPx2 = normX * CONFIG.parallaxDepths.chip2;
                targetPy2 = normY * CONFIG.parallaxDepths.chip2;
                targetPx3 = normX * CONFIG.parallaxDepths.chip3;
                targetPy3 = normY * CONFIG.parallaxDepths.chip3;

                // Dynamic moving sheen on card face
                if (sheen && CONFIG.sheenEnabled) {
                    const sheenX = (((clientX - rect.left) / rect.width) * 100).toFixed(1);
                    const sheenY = (((clientY - rect.top) / rect.height) * 100).toFixed(1);
                    card.style.setProperty('--sheen-x', `${sheenX}%`);
                    card.style.setProperty('--sheen-y', `${sheenY}%`);
                }
            }, { passive: true });

            stage.addEventListener('pointerleave', () => {
                targetRx = 0;
                targetRy = 0;
                targetPx1 = 0; targetPy1 = 0;
                targetPx2 = 0; targetPy2 = 0;
                targetPx3 = 0; targetPy3 = 0;

                if (sheen && CONFIG.sheenEnabled) {
                    sheen.style.opacity = '0';
                }
            }, { passive: true });

            window.addEventListener('resize', () => {
                cachedRect = null;
            }, { passive: true });
        }

        // Passive scroll tracking for depth drift
        window.addEventListener('scroll', () => {
            currentScrollY = window.scrollY || 0;
        }, { passive: true });

        // Start requestAnimationFrame loop
        rafId = requestAnimationFrame(renderLoop);

        // ----------------------------------------------------
        // 6. Pause & Lifecycle Management
        // ----------------------------------------------------
        function canRunAmbient() {
            return isVisibleOnScreen && isTabActive && !isHoveredOrFocused;
        }

        function startAmbientTimers() {
            stopAmbientTimers();
            if (!canRunAmbient()) return;

            barCycleTimer = setInterval(stepAmbientBarCycle, CONFIG.barCycleIntervalMs);
            feedCycleTimer = setInterval(stepActivityFeed, CONFIG.feedCycleIntervalMs);
            hoursTickTimer = setInterval(stepHoursTick, CONFIG.hoursTickIntervalMs);
            automationsTickTimer = setInterval(stepAutomationsTick, CONFIG.automationsTickIntervalMs);
        }

        function stopAmbientTimers() {
            if (barCycleTimer) { clearInterval(barCycleTimer); barCycleTimer = null; }
            if (feedCycleTimer) { clearInterval(feedCycleTimer); feedCycleTimer = null; }
            if (hoursTickTimer) { clearInterval(hoursTickTimer); hoursTickTimer = null; }
            if (automationsTickTimer) { clearInterval(automationsTickTimer); automationsTickTimer = null; }
        }

        function resetAmbientTimers() {
            stopAmbientTimers();
            startAmbientTimers();
        }

        // Pause on Hover or Focus inside stage
        stage.addEventListener('mouseenter', () => {
            isHoveredOrFocused = true;
            stopAmbientTimers();
        });
        stage.addEventListener('mouseleave', () => {
            isHoveredOrFocused = false;
            startAmbientTimers();
        });
        stage.addEventListener('focusin', () => {
            isHoveredOrFocused = true;
            stopAmbientTimers();
        });
        stage.addEventListener('focusout', (e) => {
            if (!stage.contains(e.relatedTarget)) {
                isHoveredOrFocused = false;
                startAmbientTimers();
            }
        });

        // Pause on Tab Invisibility
        document.addEventListener('visibilitychange', () => {
            isTabActive = !document.hidden;
            if (isTabActive) {
                startAmbientTimers();
            } else {
                stopAmbientTimers();
            }
        });

        // IntersectionObserver for Viewport Entry
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    isVisibleOnScreen = entry.isIntersecting;
                    if (entry.isIntersecting) {
                        startCounters();
                        startAmbientTimers();
                    } else {
                        stopAmbientTimers();
                    }
                });
            }, { threshold: 0.15 });

            observer.observe(stage);
        } else {
            startCounters();
            startAmbientTimers();
        }

        // Cleanup on page unload
        window.addEventListener('pagehide', () => {
            stopAmbientTimers();
            if (rafId) cancelAnimationFrame(rafId);
        });
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLiveDashboard);
    } else {
        initLiveDashboard();
    }
})();

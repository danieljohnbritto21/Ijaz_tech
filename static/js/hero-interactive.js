/**
 * HERO INTERACTIVE BACKGROUND & 3D TILT
 * Ijaz_Solutions — Self-contained, lightweight, high-performance module.
 *
 * Layers:
 * 1. Particle Network (Canvas) with cursor attraction & proximity lines
 * 2. Cursor Spotlight Glow & Mask-based Dot Grid illumination
 * 3. Parallax Depth on Background Blobs & Geometric Shapes
 * 4. 3D Card Tilt & Dynamic Highlight Sheen on Dashboard Mockup
 */
(function () {
    'use strict';

    // ============================================================
    // TUNING CONSTANTS (Adjust to tune intensity, speed, and limits)
    // ============================================================
    const CONFIG = {
        // Particle Network Counts & Dimensions
        desktopNodes: 55,             // Baseline node count for desktop
        maxNodes: 70,                 // Maximum node cap
        mobileNodes: 25,              // Cap on mobile devices
        nodeAreaDivisor: 18000,       // Area (px^2) per node scaling
        nodeMinRadius: 1.5,           // Min radius in px
        nodeMaxRadius: 2.8,           // Max radius in px
        baseSpeed: 0.35,              // Base drift velocity (pixels/frame)
        ambientSpeedTouch: 0.15,      // Ultra-slow drift for touch devices

        // Network Distance & Attraction
        linkDistance: 140,            // Max distance for inter-node lines (px)
        cursorRadius: 160,            // Distance where cursor attracts nodes (px)
        cursorPullStrength: 0.045,    // Gentle attraction factor towards cursor
        lineMaxOpacity: 0.25,         // Max opacity for inter-node connections
        cursorLineMaxOpacity: 0.45,   // Max opacity for node-to-cursor lines

        // Colors
        indigoRgb: '79, 70, 229',      // #4F46E5
        cyanRgb: '8, 145, 178',        // #0891B2

        // Smoothing Easing (Lerp factors: 0.0 = no movement, 1.0 = instant snap)
        spotlightLerp: 0.08,          // Cursor spotlight follow easing
        parallaxLerp: 0.06,           // Background shape parallax easing
        tiltLerp: 0.08,               // 3D card tilt easing

        // 3D Card Tilt
        maxTiltDeg: 6.0,              // Maximum rotation degrees on X & Y axes

        // Parallax Layer Depths (displacement opposite to cursor movement)
        parallaxLayers: [
            { selector: '.hero__glow--indigo', factor: 16 },
            { selector: '.hero__glow--cyan', factor: 22 },
            { selector: '.hero__glow--dashboard', factor: 10 },
            { selector: '.hero__circle--1', factor: 28 },
            { selector: '.hero__circle--2', factor: 18 },
            { selector: '.hero__circle--3', factor: 12 },
            { selector: '.hero__shape--1', factor: 24 },
            { selector: '.hero__shape--2', factor: 14 },
            { selector: '.hero__shape--3', factor: 20 }
        ],

        // Floating Chip 3D Offsets (relative to dashboard tilt)
        chipLayers: [
            { selector: '.floating-chip--1', depthZ: 32, factor: 8 },
            { selector: '.floating-chip--2', depthZ: 26, factor: -6 },
            { selector: '.floating-chip--3', depthZ: 38, factor: 10 }
        ]
    };

    // Linear interpolation helper
    function lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // Initialize when DOM is ready
    function initHeroInteractive() {
        const heroEl = document.getElementById('hero');
        if (!heroEl) return;

        const canvas = heroEl.querySelector('.hero-net');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Accessibility & Capabilities Detection
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

        // Interactive DOM elements
        const spotlightEl = heroEl.querySelector('.hero__spotlight');
        const mockupEl = heroEl.querySelector('.hero-mockup');
        const sheenEl = heroEl.querySelector('.hero-mockup__sheen');

        // Cached parallax layer DOM nodes
        const parallaxEls = CONFIG.parallaxLayers
            .map(layer => ({
                el: heroEl.querySelector(layer.selector),
                factor: layer.factor
            }))
            .filter(item => item.el !== null);

        // Cached chip layer DOM nodes
        const chipEls = CONFIG.chipLayers
            .map(layer => ({
                el: heroEl.querySelector(layer.selector),
                depthZ: layer.depthZ,
                factor: layer.factor
            }))
            .filter(item => item.el !== null);

        // Hero Dimensions & Cached Bounds (Updated on resize/scroll, NOT in rAF)
        let heroWidth = 0;
        let heroHeight = 0;
        let heroRect = { left: 0, top: 0, width: 0, height: 0 };
        let dpr = 1;

        // Cursor & Easing Coordinates
        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;

        // Normalized coordinates (-1 to +1 from hero center)
        let targetNormX = 0;
        let targetNormY = 0;
        let currentNormX = 0;
        let currentNormY = 0;

        let isHovered = false;
        let isHeroVisible = true;
        let isTabVisible = !document.hidden;
        let animationFrameId = null;

        // Particles Array
        let nodes = [];

        // Cache Hero Bounding Box
        function updateHeroRect() {
            const rect = heroEl.getBoundingClientRect();
            heroRect = {
                left: rect.left + window.scrollX,
                top: rect.top + window.scrollY,
                width: rect.width,
                height: rect.height
            };
            heroWidth = rect.width;
            heroHeight = rect.height;

            // Center cursor coordinates initially
            if (!isHovered) {
                targetX = heroWidth * 0.5;
                targetY = heroHeight * 0.45;
                currentX = targetX;
                currentY = targetY;
            }
        }

        // Resize Canvas with devicePixelRatio capped at 2
        function resizeCanvas() {
            updateHeroRect();
            dpr = Math.min(window.devicePixelRatio || 1, 2);

            canvas.width = Math.floor(heroWidth * dpr);
            canvas.height = Math.floor(heroHeight * dpr);
            canvas.style.width = heroWidth + 'px';
            canvas.style.height = heroHeight + 'px';

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            // Re-seed nodes based on viewport size
            createNodes();
        }

        // Node Creation
        function createNodes() {
            const area = heroWidth * heroHeight;
            let count = Math.round(area / CONFIG.nodeAreaDivisor);

            if (heroWidth < 768 || isTouchDevice) {
                count = Math.min(count, CONFIG.mobileNodes);
            } else {
                count = Math.min(Math.max(count, CONFIG.desktopNodes), CONFIG.maxNodes);
            }

            nodes = [];
            for (let i = 0; i < count; i++) {
                const isCyan = Math.random() > 0.5;
                const speed = isTouchDevice ? CONFIG.ambientSpeedTouch : CONFIG.baseSpeed;
                const angle = Math.random() * Math.PI * 2;

                nodes.push({
                    x: Math.random() * heroWidth,
                    y: Math.random() * heroHeight,
                    vx: Math.cos(angle) * (speed * (0.6 + Math.random() * 0.8)),
                    vy: Math.sin(angle) * (speed * (0.6 + Math.random() * 0.8)),
                    radius: CONFIG.nodeMinRadius + Math.random() * (CONFIG.nodeMaxRadius - CONFIG.nodeMinRadius),
                    rgb: isCyan ? CONFIG.cyanRgb : CONFIG.indigoRgb,
                    alpha: 0.3 + Math.random() * 0.3
                });
            }

            // If user prefers reduced motion, draw once and exit
            if (prefersReducedMotion) {
                drawStaticNetwork();
            }
        }

        // Draw Static Frame for prefers-reduced-motion
        function drawStaticNetwork() {
            ctx.clearRect(0, 0, heroWidth, heroHeight);
            const n = nodes.length;

            // Lines
            ctx.lineWidth = 1;
            for (let i = 0; i < n; i++) {
                const a = nodes[i];
                for (let j = i + 1; j < n; j++) {
                    const b = nodes[j];
                    const dx = b.x - a.x;
                    const dy = b.y - a.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < CONFIG.linkDistance) {
                        const alpha = (1 - dist / CONFIG.linkDistance) * CONFIG.lineMaxOpacity;
                        ctx.strokeStyle = `rgba(${CONFIG.indigoRgb}, ${alpha.toFixed(3)})`;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }

            // Circles
            for (let i = 0; i < n; i++) {
                const node = nodes[i];
                ctx.fillStyle = `rgba(${node.rgb}, ${node.alpha.toFixed(2)})`;
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Pointer Event Handlers (Passive listeners on Hero only)
        function onPointerMove(e) {
            if (isTouchDevice || prefersReducedMotion) return;

            const clientX = e.clientX;
            const clientY = e.clientY;

            // Calculate position inside hero
            targetX = clientX - (heroRect.left - window.scrollX);
            targetY = clientY - (heroRect.top - window.scrollY);

            // Normalized (-1 to 1) from hero center
            targetNormX = Math.max(-1, Math.min(1, (targetX / heroWidth) * 2 - 1));
            targetNormY = Math.max(-1, Math.min(1, (targetY / heroHeight) * 2 - 1));

            isHovered = true;

            // Make spotlight and sheen visible
            if (spotlightEl) spotlightEl.style.opacity = '1';
            if (sheenEl) sheenEl.style.opacity = '1';
        }

        function onPointerLeave() {
            if (isTouchDevice || prefersReducedMotion) return;

            isHovered = false;

            // Smoothly settle back to flat center
            targetNormX = 0;
            targetNormY = 0;

            if (spotlightEl) spotlightEl.style.opacity = '0';
            if (sheenEl) sheenEl.style.opacity = '0';
        }

        // Animation Loop (Single rAF for all layers)
        function animate() {
            if (!isHeroVisible || !isTabVisible || prefersReducedMotion) {
                animationFrameId = null;
                return;
            }

            // 1. Smooth Coordinates (Lerp)
            currentX = lerp(currentX, targetX, CONFIG.spotlightLerp);
            currentY = lerp(currentY, targetY, CONFIG.spotlightLerp);

            currentNormX = lerp(currentNormX, targetNormX, CONFIG.tiltLerp);
            currentNormY = lerp(currentNormY, targetNormY, CONFIG.tiltLerp);

            // 2. Render Particle Network
            ctx.clearRect(0, 0, heroWidth, heroHeight);
            const n = nodes.length;

            // Update particle drift & cursor attraction
            for (let i = 0; i < n; i++) {
                const node = nodes[i];

                // Regular drift
                node.x += node.vx;
                node.y += node.vy;

                // Bounce at edges
                if (node.x < 0) { node.x = 0; node.vx *= -1; }
                else if (node.x > heroWidth) { node.x = heroWidth; node.vx *= -1; }

                if (node.y < 0) { node.y = 0; node.vy *= -1; }
                else if (node.y > heroHeight) { node.y = heroHeight; node.vy *= -1; }

                // Cursor Attraction (only on desktop when hovered)
                if (isHovered && !isTouchDevice) {
                    const dx = currentX - node.x;
                    const dy = currentY - node.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < CONFIG.cursorRadius && dist > 1) {
                        const pullFactor = (1 - dist / CONFIG.cursorRadius) * CONFIG.cursorPullStrength;
                        node.x += dx * pullFactor;
                        node.y += dy * pullFactor;

                        // Brighter line to cursor
                        const cursorLineAlpha = (1 - dist / CONFIG.cursorRadius) * CONFIG.cursorLineMaxOpacity;
                        ctx.strokeStyle = `rgba(${CONFIG.cyanRgb}, ${cursorLineAlpha.toFixed(3)})`;
                        ctx.lineWidth = 1.2;
                        ctx.beginPath();
                        ctx.moveTo(node.x, node.y);
                        ctx.lineTo(currentX, currentY);
                        ctx.stroke();
                    }
                }
            }

            // Draw inter-node proximity lines
            ctx.lineWidth = 1;
            for (let i = 0; i < n; i++) {
                const a = nodes[i];
                for (let j = i + 1; j < n; j++) {
                    const b = nodes[j];
                    const dx = b.x - a.x;
                    const dy = b.y - a.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < CONFIG.linkDistance) {
                        const alpha = (1 - dist / CONFIG.linkDistance) * CONFIG.lineMaxOpacity;
                        ctx.strokeStyle = `rgba(${CONFIG.indigoRgb}, ${alpha.toFixed(3)})`;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }

            // Draw node circles
            for (let i = 0; i < n; i++) {
                const node = nodes[i];
                ctx.fillStyle = `rgba(${node.rgb}, ${node.alpha.toFixed(2)})`;
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fill();
            }

            // 3. Spotlight & Dot-Pattern Brightening
            if (!isTouchDevice) {
                if (spotlightEl) {
                    spotlightEl.style.transform = `translate3d(${currentX - 240}px, ${currentY - 240}px, 0)`;
                }

                // Update CSS custom properties for radial mask-image
                heroEl.style.setProperty('--mx', `${currentX.toFixed(1)}px`);
                heroEl.style.setProperty('--my', `${currentY.toFixed(1)}px`);

                // 4. Parallax Depth for Background Blobs & Shapes
                for (let i = 0; i < parallaxEls.length; i++) {
                    const layer = parallaxEls[i];
                    const px = -currentNormX * layer.factor;
                    const py = -currentNormY * layer.factor;
                    layer.el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
                }

                // 5. Dashboard 3D Tilt & Moving Highlight Sheen
                if (mockupEl) {
                    const tiltX = -currentNormY * CONFIG.maxTiltDeg;
                    const tiltY = currentNormX * CONFIG.maxTiltDeg;
                    mockupEl.style.transform = `rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;

                    // Move Sheen Highlight across card
                    if (sheenEl) {
                        const sheenX = ((currentNormX + 1) * 50).toFixed(1);
                        const sheenY = ((currentNormY + 1) * 50).toFixed(1);
                        sheenEl.style.setProperty('--sheen-x', `${sheenX}%`);
                        sheenEl.style.setProperty('--sheen-y', `${sheenY}%`);
                    }
                }

                // 6. Floating Chips Parallax Offsets on Separate Depth Planes
                for (let i = 0; i < chipEls.length; i++) {
                    const chip = chipEls[i];
                    const chipOffsetX = currentNormX * chip.factor;
                    const chipOffsetY = currentNormY * chip.factor;
                    chip.el.style.transform = `translate3d(${chipOffsetX.toFixed(1)}px, ${chipOffsetY.toFixed(1)}px, ${chip.depthZ}px)`;
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        }

        function startAnimation() {
            if (!animationFrameId && !prefersReducedMotion) {
                animationFrameId = requestAnimationFrame(animate);
            }
        }

        function stopAnimation() {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }

        // Event Listeners
        if (!isTouchDevice && !prefersReducedMotion) {
            heroEl.addEventListener('pointermove', onPointerMove, { passive: true });
            heroEl.addEventListener('pointerleave', onPointerLeave, { passive: true });
        }

        // Update bounds on scroll (passive)
        window.addEventListener('scroll', updateHeroRect, { passive: true });

        // ResizeObserver on Hero
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                resizeCanvas();
            });
            ro.observe(heroEl);
        } else {
            window.addEventListener('resize', resizeCanvas, { passive: true });
        }

        // IntersectionObserver to pause when hero is scrolled out of view
        if (window.IntersectionObserver) {
            const io = new IntersectionObserver((entries) => {
                const entry = entries[0];
                isHeroVisible = entry.isIntersecting;
                if (isHeroVisible) {
                    startAnimation();
                } else {
                    stopAnimation();
                }
            }, { threshold: 0.05 });
            io.observe(heroEl);
        }

        // Page Visibility API (Pause when tab is hidden)
        document.addEventListener('visibilitychange', () => {
            isTabVisible = !document.hidden;
            if (isTabVisible && isHeroVisible) {
                startAnimation();
            } else {
                stopAnimation();
            }
        });

        // Initialize setup
        resizeCanvas();
        startAnimation();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeroInteractive);
    } else {
        initHeroInteractive();
    }
})();

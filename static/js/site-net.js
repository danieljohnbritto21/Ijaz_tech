/**
 * High Deckz — Site-Wide Particle Network Interactive Background
 * Pure Vanilla JavaScript (Zero Dependencies, Zero Globals, High Performance)
 *
 * Features:
 * - Fluid drifting nodes in brand Cyan (#0891B2) and Indigo (#4F46E5)
 * - Proximity connecting lines with distance-faded opacity
 * - Interactive mouse attraction with lerp easing (0.08) and cursor-to-node links
 * - Scaled density: ~1 node per 22,000 px², min 22, max 80 (desktop), max 35 (touch/mobile)
 * - Layer support: default 'front' (z-index: 9999) so no section background hides it,
 *   with gentle opacity and pointer-events: none so all text remains readable and interactive
 * - Fallback dynamic creation: guarantees canvas exists even without HTML partial
 * - devicePixelRatio capped at 2, debounced resize & orientation change
 * - Single requestAnimationFrame loop, paused on visibilitychange
 * - Accessibility guard: static single render for prefers-reduced-motion
 * - Completely passive events; never blocks scrolling or click interaction
 * - Excludes Django admin (/admin)
 * - Part 3 Exclusion: Caches dashboard stage bounding box (+12px margin) on load,
 *   debounced resize, and throttled scroll; skips any lines or nodes intersecting the card
 */
(function () {
    'use strict';

    // 1. Exclude Django Admin interface
    if (window.location.pathname.indexOf('/admin') === 0) {
        return;
    }

    // 2. Prevent duplicate script execution
    if (window.__highdeckz_net_initialized) {
        return;
    }
    window.__highdeckz_net_initialized = true;

    // ============================================================
    // CONFIGURATION (All tuning values consolidated in one place)
    // ============================================================
    const CONFIG = {
        layer: 'behind',              // 'behind' (z-index: 0) keeps canvas behind all cards & content
        density: 22000,               // Viewport area (px²) per node (~1 node per 22,000 px²)
        minNodes: 20,                 // Minimum node count on any screen
        maxNodes: 80,                 // Maximum node cap on large screens
        touchMaxNodes: 30,            // Node cap on touch/mobile devices (max 30 nodes)
        desktopLinkDist: 140,         // Inter-node line threshold on desktop (px)
        mobileLinkDist: 100,          // Inter-node line threshold on mobile (px)
        pullRadius: 160,              // Distance where cursor attracts nodes (px)
        pullStrength: 0.045,          // Gentle attraction factor towards cursor
        speed: 0.35,                  // Standard drift speed (px/frame)
        ambientSpeedTouch: 0.12,      // Slow drift only on touch devices
        nodeMinRadius: 1.5,           // Node radius min (px)
        nodeMaxRadius: 3.0,           // Node radius max (px)
        nodeOpacity: 0.55,            // Calibrated node opacity for 4.5:1+ contrast
        lineOpacity: 0.22,            // Calibrated inter-node line opacity
        cursorLineOpacity: 0.38,      // Max opacity for cursor-to-node links
        lerpFactor: 0.08,             // Eased cursor interpolation factor
        indigoRgb: '79, 70, 229',      // #4F46E5 (Primary Action Indigo)
        cyanRgb: '8, 145, 178'         // #0891B2 (Accent Cyan)
    };

    // Helper: Linear interpolation
    function lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // Main Initialization
    function initSiteNet() {
        // Guarantee canvas exists dynamically from JS
        let canvas = document.getElementById('site-net');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'site-net';
            canvas.className = 'site-net';
            canvas.setAttribute('aria-hidden', 'true');
            if (document.body) {
                document.body.prepend(canvas);
            } else {
                document.documentElement.appendChild(canvas);
            }
        }

        // Apply mandatory canvas styles
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.pointerEvents = 'none';
        canvas.style.display = 'block';
        canvas.style.zIndex = CONFIG.layer === 'front' ? '9999' : '0';

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Environmental Capability Checks
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

        let width = 0;
        let height = 0;
        let dpr = 1;
        let linkDistance = CONFIG.desktopLinkDist;

        // Cursor & Easing Coordinates
        let targetX = -9999;
        let targetY = -9999;
        let currentX = -9999;
        let currentY = -9999;
        let isCursorActive = false;

        let isTabVisible = !document.hidden;
        let animationFrameId = null;
        let resizeTimeout = null;
        let scrollThrottleTimer = null;

        // Particles collection
        let nodes = [];

        // Bounding Rectangle Exclusion for Dashboard Stage (Part 3)
        let stageExclusionRect = null;

        function updateStageExclusionRect() {
            const stage = document.querySelector('.dash-stage') || document.querySelector('.hero-mockup-wrapper') || document.querySelector('.hero-mockup');
            if (stage) {
                const r = stage.getBoundingClientRect();
                // Exclude the stage rectangle plus a 12px margin
                stageExclusionRect = {
                    left: r.left - 12,
                    right: r.right + 12,
                    top: r.top - 12,
                    bottom: r.bottom + 12
                };
            } else {
                stageExclusionRect = null;
            }
        }

        function isPointInRect(px, py, rect) {
            return rect !== null && px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom;
        }

        function doesLineIntersectRect(x1, y1, x2, y2, rect) {
            if (!rect) return false;
            // Endpoint inside rect
            if (isPointInRect(x1, y1, rect) || isPointInRect(x2, y2, rect)) return true;
            // Bounding box test
            const minX = x1 < x2 ? x1 : x2;
            const maxX = x1 > x2 ? x1 : x2;
            const minY = y1 < y2 ? y1 : y2;
            const maxY = y1 > y2 ? y1 : y2;
            if (maxX < rect.left || minX > rect.right || maxY < rect.top || minY > rect.bottom) {
                return false;
            }
            // Midpoint test (covers short particle links)
            const midX = (x1 + x2) * 0.5;
            const midY = (y1 + y2) * 0.5;
            if (isPointInRect(midX, midY, rect)) return true;
            return false;
        }

        // Resize Canvas and adapt to DPR (capped at 2)
        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            dpr = Math.min(window.devicePixelRatio || 1, 2);

            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            linkDistance = width < 768 ? CONFIG.mobileLinkDist : CONFIG.desktopLinkDist;

            populateNodes();
            updateStageExclusionRect();

            if (prefersReducedMotion) {
                renderStaticFrame();
            }
        }

        // Generate Nodes based on Viewport Area
        function populateNodes() {
            const area = width * height;
            let count = Math.round(area / CONFIG.density);

            if (isTouchDevice || width < 768) {
                count = Math.min(Math.max(count, CONFIG.minNodes), CONFIG.touchMaxNodes);
            } else {
                count = Math.min(Math.max(count, CONFIG.minNodes), CONFIG.maxNodes);
            }

            const speed = isTouchDevice ? CONFIG.ambientSpeedTouch : CONFIG.speed;
            nodes = [];

            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const velocity = speed * (0.65 + Math.random() * 0.7);
                const isCyan = Math.random() > 0.5;

                nodes.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: Math.cos(angle) * velocity,
                    vy: Math.sin(angle) * velocity,
                    radius: CONFIG.nodeMinRadius + Math.random() * (CONFIG.nodeMaxRadius - CONFIG.nodeMinRadius),
                    rgb: isCyan ? CONFIG.cyanRgb : CONFIG.indigoRgb,
                    alpha: (CONFIG.nodeOpacity * 0.75) + (Math.random() * CONFIG.nodeOpacity * 0.5)
                });
            }
        }

        // Static Single-Frame Render for Reduced Motion
        function renderStaticFrame() {
            ctx.clearRect(0, 0, width, height);
            const n = nodes.length;
            const linkDistSq = linkDistance * linkDistance;

            // Proximity Lines
            ctx.lineWidth = 1;
            for (let i = 0; i < n; i++) {
                const a = nodes[i];
                for (let j = i + 1; j < n; j++) {
                    const b = nodes[j];
                    const dx = b.x - a.x;
                    if (dx > linkDistance || dx < -linkDistance) continue;
                    const dy = b.y - a.y;
                    if (dy > linkDistance || dy < -linkDistance) continue;

                    // Skip lines intersecting dashboard stage
                    if (doesLineIntersectRect(a.x, a.y, b.x, b.y, stageExclusionRect)) continue;

                    const distSq = dx * dx + dy * dy;
                    if (distSq < linkDistSq) {
                        const dist = Math.sqrt(distSq);
                        const alpha = (1 - dist / linkDistance) * CONFIG.lineOpacity;
                        ctx.strokeStyle = `rgba(${CONFIG.indigoRgb}, ${alpha.toFixed(3)})`;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }

            // Nodes
            for (let i = 0; i < n; i++) {
                const node = nodes[i];
                if (isPointInRect(node.x, node.y, stageExclusionRect)) continue;
                ctx.fillStyle = `rgba(${node.rgb}, ${node.alpha.toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Pointer Movement Handler (Passive listener on document)
        function onPointerMove(e) {
            if (isTouchDevice || prefersReducedMotion) return;

            targetX = e.clientX;
            targetY = e.clientY;

            if (!isCursorActive) {
                isCursorActive = true;
                currentX = targetX;
                currentY = targetY;
            }
        }

        function onPointerLeave() {
            if (isTouchDevice || prefersReducedMotion) return;
            isCursorActive = false;
            targetX = -9999;
            targetY = -9999;
        }

        // Animation Loop (High-Performance 60fps)
        function animate() {
            if (!isTabVisible || prefersReducedMotion) {
                animationFrameId = null;
                return;
            }

            // 1. Lerp cursor coordinates
            if (isCursorActive) {
                currentX = lerp(currentX, targetX, CONFIG.lerpFactor);
                currentY = lerp(currentY, targetY, CONFIG.lerpFactor);
            } else if (currentX > -5000) {
                // Smoothly drift cursor out of view when left
                currentX = lerp(currentX, -9999, CONFIG.lerpFactor);
                currentY = lerp(currentY, -9999, CONFIG.lerpFactor);
            }

            ctx.clearRect(0, 0, width, height);

            const n = nodes.length;
            const cursorRadiusSq = CONFIG.pullRadius * CONFIG.pullRadius;
            const linkDistSq = linkDistance * linkDistance;

            // 2. Update and drift particles
            for (let i = 0; i < n; i++) {
                const node = nodes[i];

                node.x += node.vx;
                node.y += node.vy;

                // Boundary bounce
                if (node.x <= 0) { node.x = 0; node.vx = Math.abs(node.vx); }
                else if (node.x >= width) { node.x = width; node.vx = -Math.abs(node.vx); }
                if (node.y <= 0) { node.y = 0; node.vy = Math.abs(node.vy); }
                else if (node.y >= height) { node.y = height; node.vy = -Math.abs(node.vy); }

                // Mouse attraction & cursor linking (Desktop only)
                if (!isTouchDevice && currentX > -5000) {
                    const cdx = currentX - node.x;
                    const cdy = currentY - node.y;
                    const cDistSq = cdx * cdx + cdy * cdy;

                    if (cDistSq < cursorRadiusSq && cDistSq > 1) {
                        const cDist = Math.sqrt(cDistSq);
                        const pull = (1 - cDist / CONFIG.pullRadius) * CONFIG.pullStrength;
                        node.x += cdx * pull;
                        node.y += cdy * pull;

                        // Connecting line to cursor (skip if intersects dashboard stage)
                        if (!doesLineIntersectRect(node.x, node.y, currentX, currentY, stageExclusionRect)) {
                            const cLineAlpha = (1 - cDist / CONFIG.pullRadius) * CONFIG.cursorLineOpacity;
                            ctx.strokeStyle = `rgba(${CONFIG.cyanRgb}, ${cLineAlpha.toFixed(3)})`;
                            ctx.lineWidth = 1.1;
                            ctx.beginPath();
                            ctx.moveTo(node.x, node.y);
                            ctx.lineTo(currentX, currentY);
                            ctx.stroke();
                        }
                    }
                }
            }

            // 3. Proximity Connections Between Nodes (Fast Bounding-Box Skip + Stage Exclusion)
            ctx.lineWidth = 1;
            for (let i = 0; i < n; i++) {
                const a = nodes[i];
                for (let j = i + 1; j < n; j++) {
                    const b = nodes[j];

                    const dx = b.x - a.x;
                    if (dx > linkDistance || dx < -linkDistance) continue;
                    const dy = b.y - a.y;
                    if (dy > linkDistance || dy < -linkDistance) continue;

                    // Exclude lines intersecting dashboard stage
                    if (doesLineIntersectRect(a.x, a.y, b.x, b.y, stageExclusionRect)) continue;

                    const distSq = dx * dx + dy * dy;
                    if (distSq < linkDistSq) {
                        const dist = Math.sqrt(distSq);
                        const alpha = (1 - dist / linkDistance) * CONFIG.lineOpacity;
                        ctx.strokeStyle = `rgba(${CONFIG.indigoRgb}, ${alpha.toFixed(3)})`;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }

            // 4. Render Particle Nodes (skip nodes inside excluded dashboard stage)
            for (let i = 0; i < n; i++) {
                const node = nodes[i];
                if (isPointInRect(node.x, node.y, stageExclusionRect)) continue;
                ctx.fillStyle = `rgba(${node.rgb}, ${node.alpha.toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fill();
            }

            animationFrameId = requestAnimationFrame(animate);
        }

        function startLoop() {
            if (!animationFrameId && !prefersReducedMotion) {
                animationFrameId = requestAnimationFrame(animate);
            }
        }

        function stopLoop() {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }

        // Initialize Canvas & Event Listeners
        resize();
        updateStageExclusionRect();

        if (!prefersReducedMotion) {
            startLoop();

            if (!isTouchDevice) {
                document.addEventListener('pointermove', onPointerMove, { passive: true });
                document.addEventListener('mouseleave', onPointerLeave, { passive: true });
            }
        }

        // Tab Visibility Handler to conserve CPU/battery
        document.addEventListener('visibilitychange', function () {
            isTabVisible = !document.hidden;
            if (isTabVisible) {
                updateStageExclusionRect();
                startLoop();
            } else {
                stopLoop();
            }
        });

        // Debounced Resize & Orientation Change
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function () {
                resize();
                updateStageExclusionRect();
            }, 100);
        }, { passive: true });

        window.addEventListener('orientationchange', function () {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function () {
                resize();
                updateStageExclusionRect();
            }, 150);
        }, { passive: true });

        // Throttled Scroll Listener to update cached dashboard bounds
        window.addEventListener('scroll', function () {
            if (!scrollThrottleTimer) {
                scrollThrottleTimer = setTimeout(function () {
                    scrollThrottleTimer = null;
                    updateStageExclusionRect();
                }, 80);
            }
        }, { passive: true });
    }

    // Run when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSiteNet);
    } else {
        initSiteNet();
    }
})();

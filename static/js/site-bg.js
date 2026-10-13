/**
 * SITE BACKGROUND INTERACTIVE MODULE
 * High Deckz — Smooth cursor spotlight, dot-grid brightening, and multi-layer parallax.
 * Wrapped in an IIFE, zero global namespace pollution, high-performance rAF loop.
 */
(function () {
    'use strict';

    // Tuning constants
    const CONFIG = {
        lerpFactor: 0.08,
        parallaxLerp: 0.06,
        layers: [
            { sel: '.site-bg__glow--indigo-tr', factor: 18 },
            { sel: '.site-bg__glow--cyan-bl', factor: 24 },
            { sel: '.site-bg__glow--indigo-ml', factor: 14 },
            { sel: '.site-bg__glow--cyan-br', factor: 20 },
            { sel: '.site-bg__circle--1', factor: 26 },
            { sel: '.site-bg__circle--2', factor: 16 },
            { sel: '.site-bg__circle--3', factor: 10 },
            { sel: '.site-bg__shape--hex', factor: 22 },
            { sel: '.site-bg__shape--ring1', factor: 14 },
            { sel: '.site-bg__shape--ring2', factor: 18 },
            { sel: '.site-bg__shape--dashed', factor: 12 },
            { sel: '.site-bg__shape--square', factor: 16 }
        ]
    };

    function lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    function initSiteBg() {
        const bgEl = document.getElementById('site-bg');
        if (!bgEl) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

        // If reduced motion is preferred, keep background completely static
        if (prefersReducedMotion) return;

        const spotlightEl = bgEl.querySelector('.site-bg__spotlight');
        const parallaxLayers = CONFIG.layers
            .map(item => ({
                el: bgEl.querySelector(item.sel),
                factor: item.factor
            }))
            .filter(item => item.el !== null);

        let targetX = window.innerWidth * 0.5;
        let targetY = window.innerHeight * 0.4;
        let currentX = targetX;
        let currentY = targetY;

        let targetNormX = 0;
        let targetNormY = 0;
        let currentNormX = 0;
        let currentNormY = 0;

        let isTabVisible = !document.hidden;
        let isHovered = false;
        let animationFrameId = null;

        function onPointerMove(e) {
            if (isTouchDevice) return;

            targetX = e.clientX;
            targetY = e.clientY;

            targetNormX = (targetX / window.innerWidth) * 2 - 1;
            targetNormY = (targetY / window.innerHeight) * 2 - 1;

            if (!isHovered) {
                isHovered = true;
                if (spotlightEl) spotlightEl.style.opacity = '1';
            }
        }

        function onPointerLeave() {
            if (isTouchDevice) return;
            isHovered = false;
            targetNormX = 0;
            targetNormY = 0;
            if (spotlightEl) spotlightEl.style.opacity = '0';
        }

        function animate() {
            if (!isTabVisible) {
                animationFrameId = null;
                return;
            }

            // Lerp coordinates
            currentX = lerp(currentX, targetX, CONFIG.lerpFactor);
            currentY = lerp(currentY, targetY, CONFIG.lerpFactor);

            currentNormX = lerp(currentNormX, targetNormX, CONFIG.parallaxLerp);
            currentNormY = lerp(currentNormY, targetNormY, CONFIG.parallaxLerp);

            // Update spotlight
            if (spotlightEl && !isTouchDevice) {
                spotlightEl.style.transform = `translate3d(${currentX - 260}px, ${currentY - 260}px, 0)`;
            }

            // Update CSS custom properties on .site-bg for radial mask
            bgEl.style.setProperty('--mx', `${currentX.toFixed(1)}px`);
            bgEl.style.setProperty('--my', `${currentY.toFixed(1)}px`);

            // Apply parallax shifts
            if (!isTouchDevice) {
                for (let i = 0; i < parallaxLayers.length; i++) {
                    const layer = parallaxLayers[i];
                    const px = -currentNormX * layer.factor;
                    const py = -currentNormY * layer.factor;
                    layer.el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        }

        function startLoop() {
            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(animate);
            }
        }

        function stopLoop() {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }

        // Event listeners (passive)
        if (!isTouchDevice) {
            document.addEventListener('pointermove', onPointerMove, { passive: true });
            document.addEventListener('mouseleave', onPointerLeave, { passive: true });
        }

        document.addEventListener('visibilitychange', () => {
            isTabVisible = !document.hidden;
            if (isTabVisible) {
                startLoop();
            } else {
                stopLoop();
            }
        });

        startLoop();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSiteBg);
    } else {
        initSiteBg();
    }
})();

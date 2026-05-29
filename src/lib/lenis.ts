/**
 * lenis.ts
 *
 * Singleton Lenis instance + RAF loop.
 * Lenis intercepts the native scroll, applies physics-based easing,
 * then calls window.scrollTo() so getBoundingClientRect() and
 * window.scrollY still return the correct (smoothed) values.
 *
 * Safari-safe config (per 3d-scroll-website skill):
 *   - lerp: 0.1 (higher = snappier; default 0.1 is iOS-safe)
 *   - syncTouch: false (prevents iOS rubber-band double-scroll)
 */

import Lenis from 'lenis';

export let lenis: Lenis | null = null;
let rafId: number | null = null;

export function initLenis(): void {
  if (lenis) return; // already initialized

  lenis = new Lenis({
    duration: 1.2,       // easing duration in seconds
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo out
    smoothWheel: true,
    syncTouch: false,    // disable on iOS to prevent double-scroll (Safari-safe)
  });

  // Drive Lenis with the browser's native RAF
  function raf(time: number) {
    lenis!.raf(time);
    rafId = requestAnimationFrame(raf);
  }
  rafId = requestAnimationFrame(raf);
}

export function destroyLenis(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  lenis?.destroy();
  lenis = null;
}

export function stopScroll(): void {
  lenis?.stop();
}

export function startScroll(): void {
  lenis?.start();
}

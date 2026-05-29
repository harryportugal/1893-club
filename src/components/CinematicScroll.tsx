/**
 * CinematicScroll.tsx
 *
 * Apple-style scroll-driven canvas frame-sequence animation.
 *
 * Architecture (per 3d-scroll-website skill):
 * ─ Outer section: tall height (SCROLL_HEIGHT_VH) to create scroll distance.
 * ─ Inner div: sticky top-0 h-screen — pins canvas in viewport while parent scrolls.
 * ─ Canvas: fills the sticky wrapper with DPR-aware sizing + object-fit:cover draw.
 * ─ Scroll handler: RAF + ticking ref guard — never updates DOM synchronously.
 * ─ Frame interpolation: lerp on the target frame index for buttery smooth playback.
 * ─ Preload: 100% of images loaded before enabling scroll/animation. Real progress bar shown.
 * ─ Cleanup: removes all listeners and clears image cache on unmount.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import Navbar from './Navbar';
import BottomLeftCard from './BottomLeftCard';
import BottomRightCorner from './BottomRightCorner';
import { lenis } from '../lib/lenis';

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
/** Total number of frames in public/frames/ (0001.webp … 0151.webp) */
const TOTAL_FRAMES = 151;

/** Path prefix inside /public */
const FRAME_PATH = '/frames/';

/** Total number of frames in public/frames2/ (0001.webp … 0121.webp) */
const TOTAL_FRAMES_2 = 121;

/** Total number of frames in public/frames3/ (0001.webp … 0241.webp) */
const TOTAL_FRAMES_3 = 241;

/** Scroll height multiplier — more vh = slower, more cinematic playback */
const SCROLL_HEIGHT_VH = 400;

/** Lerp factor for smooth frame interpolation (0 = instant, 1 = no interpolation) */
const LERP_FACTOR = 0.12;

/** Mobile breakpoint in px */
const MOBILE_BREAKPOINT = 768;

/** Mobile canvas zoom-in multiplier (subject reads better bigger on small screens) */
const MOBILE_ZOOM = 1.3;

/**
 * Baseline zoom applied to every frame to crop the bottom-right watermark.
 * 1.08 = 8% zoom-in, shifting the visible area up-left so the corner is hidden.
 * Increase if the watermark is larger; keep below 1.15 to avoid soft focus.
 */
const CROP_ZOOM = 1.08;
// ──────────────────────────────────────────────────────────────────────────────

// Zero-pad a number to 4 digits: 1 → "0001"
function pad4(n: number): string {
  return String(n).padStart(4, '0');
}

// Build the URL for frame index i (1-based)
function frameUrl(i: number): string {
  return `${FRAME_PATH}${pad4(i)}.webp`;
}

// Build the URL for frames2 index i (1-based)
function frameUrl2(i: number): string {
  return `/frames2/${pad4(i)}.webp`;
}

// Build the URL for frames3 index i (1-based)
function frameUrl3(i: number): string {
  return `/frames3/${pad4(i)}.webp`;
}

// Linear interpolation
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Draw a single HTMLImageElement onto the canvas with object-fit:cover semantics.
// CROP_ZOOM > 1 shifts the visible area toward the top-left, hiding the bottom-right watermark.
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number,
  zoom = 1,
): void {
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;

  // Combine cover-scale with the crop zoom (e.g. CROP_ZOOM × optional mobile zoom)
  const totalZoom = zoom * CROP_ZOOM;
  const scale = Math.max((canvasW / imgW) * totalZoom, (canvasH / imgH) * totalZoom);
  const drawW = imgW * scale;
  const drawH = imgH * scale;

  // Anchor to top-left instead of center so the bottom-right corner is clipped.
  // x stays centered horizontally; y is pinned to 0 (top edge) — the extra
  // height hangs below the canvas and is never rendered.
  const x = (canvasW - drawW) / 2;
  const y = 0;

  ctx.drawImage(img, x, y, drawW, drawH);
}

// ─── LOADING OVERLAY ──────────────────────────────────────────────────────────
interface LoadingOverlayProps {
  progress: number; // 0-100
}

function LoadingOverlay({ progress }: LoadingOverlayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        zIndex: 50,
        gap: '1.5rem',
      }}
    >
      {/* Subtle animated logo mark */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.08)',
          borderTopColor: 'rgba(255,255,255,0.7)',
          animation: 'spin 0.9s linear infinite',
        }}
      />

      {/* Progress bar track */}
      <div
        style={{
          width: 200,
          height: 2,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 99,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'rgba(255,255,255,0.85)',
            borderRadius: 99,
            transition: 'width 0.15s ease-out',
          }}
        />
      </div>

      {/* Percentage text */}
      <span
        style={{
          fontFamily: 'var(--font-helvetica, sans-serif)',
          fontSize: 11,
          letterSpacing: '0.15em',
          color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase',
        }}
      >
        {Math.round(progress)}%
      </span>
    </div>
  );
}

interface CinematicScrollProps {
  preloadedImages1: HTMLImageElement[];
  preloadedImages2: HTMLImageElement[];
  preloadedImages3: HTMLImageElement[];
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function CinematicScroll({
  preloadedImages1,
  preloadedImages2,
  preloadedImages3,
}: CinematicScrollProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const clubRef = useRef<HTMLImageElement>(null);
  const harryzinRef = useRef<HTMLImageElement>(null);
  const subSectionRef = useRef<HTMLDivElement>(null);
  const textGroupRef = useRef<HTMLDivElement>(null);
  const subSection2Ref = useRef<HTMLDivElement>(null);
  const textGroup2Ref = useRef<HTMLDivElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);
  const images2Ref = useRef<HTMLImageElement[]>(preloadedImages2);
  const currentFrame2Ref = useRef(0);
  const canvas3Ref = useRef<HTMLCanvasElement>(null);
  const images3Ref = useRef<HTMLImageElement[]>(preloadedImages3);
  const currentFrame3Ref = useRef(0);
  const subSection3Ref = useRef<HTMLDivElement>(null);

  // Image cache — lives for the lifetime of the component
  const imagesRef = useRef<HTMLImageElement[]>(preloadedImages1);

  // Animated frame index (float for lerp)
  const currentFrameRef = useRef(0);

  // RAF ticking guard — only one RAF queued at a time
  const tickingRef = useRef(false);

  // ── Resize handler: size the canvas to the inner container with DPR awareness ────────
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const canvas2 = canvas2Ref.current;
    const canvas3 = canvas3Ref.current;
    const container = containerRef.current;
    if (!container) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const isMobile = w < MOBILE_BREAKPOINT;

    // Size Canvas 1
    if (canvas) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext('2d');
      if (ctx && imagesRef.current.length > 0) {
        const idx = Math.round(currentFrameRef.current);
        const img = imagesRef.current[idx];
        if (img) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawCover(ctx, img, canvas.width, canvas.height, isMobile ? MOBILE_ZOOM : 1);
        }
      }
    }

    // Size Canvas 2
    if (canvas2) {
      canvas2.width = w * dpr;
      canvas2.height = h * dpr;
      canvas2.style.width = `${w}px`;
      canvas2.style.height = `${h}px`;

      const ctx2 = canvas2.getContext('2d');
      if (ctx2 && images2Ref.current.length > 0) {
        const idx2 = Math.round(currentFrame2Ref.current);
        const img2 = images2Ref.current[idx2];
        if (img2) {
          ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
          drawCover(ctx2, img2, canvas2.width, canvas2.height, isMobile ? MOBILE_ZOOM : 1);
        }
      }
    }

    // Size Canvas 3
    if (canvas3) {
      canvas3.width = w * dpr;
      canvas3.height = h * dpr;
      canvas3.style.width = `${w}px`;
      canvas3.style.height = `${h}px`;

      const ctx3 = canvas3.getContext('2d');
      if (ctx3 && images3Ref.current.length > 0) {
        const idx3 = Math.round(currentFrame3Ref.current);
        const img3 = images3Ref.current[idx3];
        if (img3) {
          ctx3.clearRect(0, 0, canvas3.width, canvas3.height);
          drawCover(ctx3, img3, canvas3.width, canvas3.height, isMobile ? MOBILE_ZOOM : 1);
        }
      }
    }
  }, []);

  // Initial size check
  useEffect(() => {
    resizeCanvas();
  }, [resizeCanvas]);

  // ── Scroll + resize listeners ──────────────────────
  useEffect(() => {
    // Initial canvas size
    resizeCanvas();

    // Draw loop — called inside RAF
    const draw = (frameIdx: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = imagesRef.current[frameIdx];
      if (!img) return;
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCover(ctx, img, canvas.width, canvas.height, isMobile ? MOBILE_ZOOM : 1);
    };

    // Main RAF tick — lerps toward the target frame and updates border-radius
    const tick = () => {
      tickingRef.current = false;

      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const scrollable = section.offsetHeight - window.innerHeight;
      // progress: 0 (top of section enters viewport) → 1 (section fully scrolled)
      const rawProgress = Math.max(0, Math.min(1, -rect.top / scrollable));
      const targetFrame = rawProgress * (TOTAL_FRAMES - 1);

      if (rect.top >= 0) {
        currentFrameRef.current = 0;
        currentFrame2Ref.current = 0;
        currentFrame3Ref.current = 0;
      }

      // Lerp toward target for smooth interpolation even on fast scrolling
      currentFrameRef.current = lerp(currentFrameRef.current, targetFrame, LERP_FACTOR);

      // Loop trigger when Subsection 3 wipe is complete
      if (currentFrameRef.current >= 149.8) {
        if (lenis) {
          lenis.scrollTo(0, { immediate: true });
        }
        window.scrollTo(0, 0);

        // Instantly force the CSS variable to 0 for synchronous style resolution
        document.documentElement.style.setProperty('--scroll-progress', '0');

        currentFrameRef.current = 0;
        currentFrame2Ref.current = 0;
        currentFrame3Ref.current = 0;
        draw(0);
        return;
      }

      const frameIdx = Math.round(currentFrameRef.current);
      const clampedIdx = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIdx));

      // Draw Canvas 1 only if it is visible (fully covered by Subsection 1 after frame 129)
      if (currentFrameRef.current <= 129) {
        draw(clampedIdx);
      }

      // Dynamically fade overlay images: "the club" and "harry p" (Senior UX touch)
      const clubImg = clubRef.current;
      if (clubImg) {
        let opacity = 0;
        
        // "the club" appears later and stays longer (frames 20 to 70)
        if (clampedIdx >= 20 && clampedIdx <= 70) {
          if (clampedIdx < 35) {
            // Smooth fade-in over 15 frames
            opacity = (clampedIdx - 20) / (35 - 20);
          } else if (clampedIdx > 55) {
            // Smooth fade-out over 15 frames
            opacity = (70 - clampedIdx) / (70 - 55);
          } else {
            // Fully visible for 20 frames
            opacity = 1;
          }
        }
        clubImg.style.opacity = `${opacity}`;
      }

      const harryImg = harryzinRef.current;
      if (harryImg) {
        let opacity = 0;
        
        // "harryzin" appears at frame 70 and disappears earlier by frame 100 (snappy 10-frame fades)
        if (clampedIdx >= 70 && clampedIdx <= 100) {
          if (clampedIdx < 80) {
            opacity = (clampedIdx - 70) / (80 - 70);
          } else if (clampedIdx > 90) {
            opacity = (100 - clampedIdx) / (100 - 90);
          } else {
            opacity = 1;
          }
        }
        harryImg.style.opacity = `${opacity}`;
      }

      // Subsection 1 clip-path reveal (frames 112 to 128)
      const subSection = subSectionRef.current;
      if (subSection) {
        const startFrame = 112;
        const endFrame = 128;
        const currentFrame = currentFrameRef.current; // Lerped value for buttery smoothness
        
        if (currentFrame < startFrame) {
          subSection.style.clipPath = 'inset(0 100% 0 0)';
          subSection.style.pointerEvents = 'none';
        } else if (currentFrame > endFrame) {
          subSection.style.clipPath = 'inset(0 0% 0 0)';
          subSection.style.pointerEvents = 'auto';
        } else {
          // Calculate progress between 0 and 1, then map to inset percentage
          const progress = (currentFrame - startFrame) / (endFrame - startFrame);
          const insetPercent = 100 - progress * 100;
          subSection.style.clipPath = `inset(0 ${insetPercent}% 0 0)`;
          
          if (progress > 0.8) {
            subSection.style.pointerEvents = 'auto';
          } else {
            subSection.style.pointerEvents = 'none';
          }
        }
      }

      // Subsection 1 child animation (frames 120 to 130)
      const textGroup = textGroupRef.current;
      if (textGroup) {
        const startAnimFrame = 120;
        const endAnimFrame = 130;
        const currentFrame = currentFrameRef.current;
        
        if (currentFrame < startAnimFrame) {
          textGroup.style.opacity = '0';
          textGroup.style.transform = 'translateY(25px)';
        } else if (currentFrame > endAnimFrame) {
          textGroup.style.opacity = '1';
          textGroup.style.transform = 'translateY(0px)';
        } else {
          const progress = (currentFrame - startAnimFrame) / (endAnimFrame - startAnimFrame);
          // Cubic ease-out interpolation for ultra-premium deceleration feel
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          textGroup.style.opacity = `${progress}`;
          textGroup.style.transform = `translateY(${25 * (1 - easeProgress)}px)`;
        }
      }

      // Subsection 1 background 3D Scroll (frames2 sequence) driven dynamically by main currentFrame
      // We map main currentFrame range [112 to 130] to frames2 range [0 to 120]
      const currentFrameVal = currentFrameRef.current;
      let targetFrame2 = 0;
      const sub2Start = 112;
      const sub2End = 130;

      if (currentFrameVal < sub2Start) {
        targetFrame2 = 0;
      } else if (currentFrameVal > sub2End) {
        targetFrame2 = TOTAL_FRAMES_2 - 1;
      } else {
        const progress2 = (currentFrameVal - sub2Start) / (sub2End - sub2Start);
        targetFrame2 = progress2 * (TOTAL_FRAMES_2 - 1);
      }

      // Lerp frame 2 index for incredible smoothness
      currentFrame2Ref.current = lerp(currentFrame2Ref.current, targetFrame2, LERP_FACTOR);
      const idx2Clamped = Math.max(0, Math.min(TOTAL_FRAMES_2 - 1, Math.round(currentFrame2Ref.current)));

      // Draw frames2 onto canvas2 ONLY if Subsection 1 is visible
      const canvas2 = canvas2Ref.current;
      if (canvas2 && currentFrameVal >= 111 && currentFrameVal <= 131) {
        const ctx2 = canvas2.getContext('2d');
        if (ctx2 && images2Ref.current.length > 0) {
          const img2 = images2Ref.current[idx2Clamped];
          if (img2) {
            const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
            ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
            drawCover(ctx2, img2, canvas2.width, canvas2.height, isMobile ? MOBILE_ZOOM : 1);
          }
        }
      }

      // Subsection 2 clip-path reveal (frames 130 to 144)
      const subSection2 = subSection2Ref.current;
      if (subSection2) {
        const startFrame = 130;
        const endFrame = 144;
        const currentFrame = currentFrameRef.current;
        
        if (currentFrame < startFrame) {
          subSection2.style.clipPath = 'inset(0 100% 0 0)';
          subSection2.style.pointerEvents = 'none';
        } else if (currentFrame > endFrame) {
          subSection2.style.clipPath = 'inset(0 0% 0 0)';
          subSection2.style.pointerEvents = 'auto';
        } else {
          const progress = (currentFrame - startFrame) / (endFrame - startFrame);
          const insetPercent = 100 - progress * 100;
          subSection2.style.clipPath = `inset(0 ${insetPercent}% 0 0)`;
          
          if (progress > 0.8) {
            subSection2.style.pointerEvents = 'auto';
          } else {
            subSection2.style.pointerEvents = 'none';
          }
        }
      }
      // Subsection 2 child animation: "ctafinal" title image (frames 136 to 146)
      const textGroup2 = textGroup2Ref.current;
      if (textGroup2) {
        const startAnimFrame = 136;
        const endAnimFrame = 146;
        const currentFrame = currentFrameRef.current;
        
        if (currentFrame < startAnimFrame) {
          textGroup2.style.opacity = '0';
          textGroup2.style.transform = 'translateX(-50%) translateY(20px)';
        } else if (currentFrame > endAnimFrame) {
          textGroup2.style.opacity = '1';
          textGroup2.style.transform = 'translateX(-50%) translateY(0px)';
        } else {
          const progress = (currentFrame - startAnimFrame) / (endAnimFrame - startAnimFrame);
          // Cubic ease-out deceleration
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          textGroup2.style.opacity = `${progress}`;
          textGroup2.style.transform = `translateX(-50%) translateY(${20 * (1 - easeProgress)}px)`;
        }
      }
      
      // Subsection 3 clip-path reveal (frames 144 to 148.5)
      const subSection3 = subSection3Ref.current;
      if (subSection3) {
        const startFrame = 144;
        const endFrame = 148.5;
        const currentFrame = currentFrameRef.current;
        
        if (currentFrame < startFrame) {
          subSection3.style.clipPath = 'inset(0 100% 0 0)';
          subSection3.style.pointerEvents = 'none';
        } else if (currentFrame > endFrame) {
          subSection3.style.clipPath = 'inset(0 0% 0 0)';
          subSection3.style.pointerEvents = 'auto';
        } else {
          const progress = (currentFrame - startFrame) / (endFrame - startFrame);
          const insetPercent = 100 - progress * 100;
          subSection3.style.clipPath = `inset(0 ${insetPercent}% 0 0)`;
          
          if (progress > 0.8) {
            subSection3.style.pointerEvents = 'auto';
          } else {
            subSection3.style.pointerEvents = 'none';
          }
        }
      }

      // Subsection 2 background 3D Scroll (frames3 sequence) driven dynamically by main currentFrame
      // We map main currentFrame range [130 to 151] to frames3 range [0 to 240]
      const currentFrameVal3 = currentFrameRef.current;
      let targetFrame3 = 0;
      const sub3Start = 130;
      const sub3End = 151;

      if (currentFrameVal3 < sub3Start) {
        targetFrame3 = 0;
      } else if (currentFrameVal3 > sub3End) {
        targetFrame3 = TOTAL_FRAMES_3 - 1;
      } else {
        const progress3 = (currentFrameVal3 - sub3Start) / (sub3End - sub3Start);
        targetFrame3 = progress3 * (TOTAL_FRAMES_3 - 1);
      }

      // Lerp frame 3 index for incredible smoothness
      currentFrame3Ref.current = lerp(currentFrame3Ref.current, targetFrame3, LERP_FACTOR);
      const idx3Clamped = Math.max(0, Math.min(TOTAL_FRAMES_3 - 1, Math.round(currentFrame3Ref.current)));

      // Draw frames3 onto canvas3 ONLY if Subsection 2 is visible
      const canvas3 = canvas3Ref.current;
      if (canvas3 && currentFrameVal3 >= 129) {
        const ctx3 = canvas3.getContext('2d');
        if (ctx3 && images3Ref.current.length > 0) {
          const img3 = images3Ref.current[idx3Clamped];
          if (img3) {
            const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
            ctx3.clearRect(0, 0, canvas3.width, canvas3.height);
            drawCover(ctx3, img3, canvas3.width, canvas3.height, isMobile ? MOBILE_ZOOM : 1);
          }
        }
      }

      // Dynamically flatten top borders as the section rises and pins (Senior UX touch)
      const container = containerRef.current;
      if (container) {
        const maxRadius = window.innerWidth < MOBILE_BREAKPOINT ? 24 : 48;
        const distanceToTop = Math.max(0, rect.top);
        // Transition over the last 300px before pinning to top: 0
        const radiusProgress = Math.min(1, distanceToTop / 300);
        const currentRadius = radiusProgress * maxRadius;
        container.style.borderTopLeftRadius = `${currentRadius}px`;
        container.style.borderTopRightRadius = `${currentRadius}px`;
      }

      // Keep the RAF loop alive while lerp hasn't settled (buttery smooth and CPU friendly)
      const lerpHasNotSettled = Math.abs(currentFrameRef.current - targetFrame) > 0.05 ||
                                Math.abs(currentFrame2Ref.current - targetFrame2) > 0.05 ||
                                Math.abs(currentFrame3Ref.current - targetFrame3) > 0.05;

      if (lerpHasNotSettled) {
        tickingRef.current = true;
        requestAnimationFrame(tick);
      }
    };

    // Passive scroll handler — never calls preventDefault
    const onScroll = () => {
      if (!tickingRef.current) {
        tickingRef.current = true;
        requestAnimationFrame(tick);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resizeCanvas, { passive: true });

    // Initial tick to apply correct frame and border-radius on mount/reload
    tick();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas]);

  return (
    <>
      {/* Keyframe for the loading spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/*
       * Outer section: tall — provides the scroll distance that drives the animation.
       * Inner div: sticky top-0 h-screen — pins the canvas in the viewport.
       */}
      <section
        ref={sectionRef}
        style={{ height: `${SCROLL_HEIGHT_VH}vh`, position: 'relative', zIndex: 20 }}
        aria-label="Cinematic scroll animation"
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            width: '100%',
          }}
        >
          {/* Full-width container with only top-corners rounded */}
          <div
            ref={containerRef}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              background: '#0a0a0a',
            }}
            className="rounded-t-[1.5rem] md:rounded-t-[3rem]"
          >
            {/* Canvas — DPR-aware, sized to the container */}
            <canvas
              ref={canvasRef}
              style={{
                display: 'block',
              }}
            />

            {/* Centered Overlay: "the club" with hardware-accelerated scroll-driven fade (fixed size, top-aligned) */}
            <img
              ref={clubRef}
              src="/the club.png"
              alt="The Club"
              style={{
                position: 'absolute',
                top: '12%',
                left: '50%',
                transform: 'translateX(-50%)',
                opacity: 0,
                pointerEvents: 'none',
                maxWidth: '85%',
                maxHeight: '36%',
                objectFit: 'contain',
                zIndex: 10,
                willChange: 'opacity',
              }}
            />

            {/* Centered Overlay: "harryzin" with hardware-accelerated scroll-driven fade (fixed size, top-aligned) */}
            <img
              ref={harryzinRef}
              src="/harryzin.png"
              alt="Harryzin"
              style={{
                position: 'absolute',
                top: '12%',
                left: '50%',
                transform: 'translateX(-50%)',
                opacity: 0,
                pointerEvents: 'none',
                maxWidth: '85%',
                maxHeight: '36%',
                objectFit: 'contain',
                zIndex: 10,
                willChange: 'opacity',
              }}
            />

            {/* Subsection revealed in the last frames of the 3D scroll (Senior UI touch) */}
            <div
              ref={subSectionRef}
              style={{
                position: 'absolute',
                inset: 0,
                background: '#09090b', // Base dark color
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end', // Aligns the text/button group to the right
                justifyContent: 'center', // Keep centered vertically
                zIndex: 20,
                pointerEvents: 'none',
                clipPath: 'inset(0 100% 0 0)', // Hidden initially, animated via clip-path
              }}
            >
              {/* Cinematic 3D Scroll Canvas for Subsection 1 (frames2) */}
              <canvas
                ref={canvas2Ref}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  zIndex: 0,
                }}
              />

              <div
                ref={textGroupRef}
                style={{
                  position: 'relative',
                  zIndex: 1, // Elevates the text above the background image
                  textAlign: 'center',
                  padding: '0 24px',
                  marginRight: 'clamp(32px, 10vw, 160px)', // Shift slightly more to the right
                  maxWidth: '560px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: 0, // Starts fully transparent, animated in tick()
                  transform: 'translateY(25px)', // Starts slightly offset downwards
                  willChange: 'opacity, transform', // Hardware-accelerated best practice
                }}
              >
                {/* Elegant Title Image */}
                <img
                  src="/join_club.webp"
                  alt="Join Club"
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    width: 'clamp(260px, 40vw, 440px)', // Beautiful responsive sizing
                    objectFit: 'contain',
                  }}
                  className="select-none pointer-events-none"
                />

                {/* Premium Button */}
                <button
                  style={{
                    marginTop: '-96px', // Offset transparent padding while maintaining breathing room
                    padding: '14px 32px',
                    borderRadius: '99px',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.18em',
                    color: '#0a0a0a',
                    background: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 24px rgba(255, 255, 255, 0.12)',
                    transition: 'all 0.3s ease',
                  }}
                  className="hover:bg-white/90 active:scale-95 pointer-events-auto"
                >
                  ENTER EXPERIENCE
                </button>
              </div>
            </div>

            {/* Subsection 2 revealed after Subsection 1 in the final frames (Senior UI touch) */}
            <div
              ref={subSection2Ref}
              style={{
                position: 'absolute',
                inset: 0,
                background: '#09090b', // Base dark color
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center', // Center aligned for a beautiful, premium visual contrast!
                justifyContent: 'center',
                zIndex: 21, // Higher than Subsection 1 so it wipes OVER it!
                pointerEvents: 'none',
                clipPath: 'inset(0 100% 0 0)', // Hidden initially
              }}
            >
              {/* Cinematic 3D Scroll Canvas for Subsection 2 (frames3) */}
              <canvas
                ref={canvas3Ref}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  zIndex: 0,
                }}
              />

              {/* Centered Overlay Title: "the_club" with hardware-accelerated scroll-driven fade/slide */}
              <img
                ref={textGroup2Ref}
                src="/the_club.webp"
                alt="Experience Title"
                style={{
                  position: 'absolute',
                  top: '8%', // Raised a bit higher
                  left: '50%',
                  transform: 'translateX(-50%) translateY(20px)',
                  opacity: 0, // Starts fully transparent, animated in tick()
                  pointerEvents: 'none',
                  width: 'clamp(260px, 42vw, 480px)', // Slightly reduced size
                  maxWidth: '90%',
                  height: 'auto',
                  objectFit: 'contain',
                  zIndex: 10,
                  willChange: 'opacity, transform',
                }}
              />

            </div>

            {/* Subsection 3: Hero Clone for looping */}
            <div
              ref={subSection3Ref}
              style={{
                position: 'absolute',
                inset: 0,
                background: '#f0f0f0',
                zIndex: 22,
                pointerEvents: 'none',
                clipPath: 'inset(0 100% 0 0)',
              }}
              className="p-3 md:p-5 flex items-center justify-center"
            >
              <div
                className="relative w-full max-w-[1536px] h-full rounded-[1.5rem] md:rounded-[3rem] overflow-hidden shadow-none flex flex-col items-center bg-white/10 group"
              >
                <img
                  src="/back.jpeg"
                  alt="Background Image"
                  style={{ transform: 'translateY(-6%) scale(1.15)' }}
                  className="absolute inset-0 w-full h-full object-cover object-[65%] lg:object-center z-0 origin-center"
                />

                <div className="relative z-10 w-full h-full flex flex-col">
                  <Navbar />

                  <div className="w-full flex flex-col items-start mt-auto pl-2 md:pl-4 lg:pl-6 pr-6 md:pr-12 lg:pr-16 pb-16 md:pb-40 lg:pb-48 text-left max-w-4xl">
                    <img
                      src="/headline.png"
                      alt="Headline and Description"
                      className="w-full max-w-[280px] sm:max-w-[370px] md:max-w-[460px] lg:max-w-[550px] h-auto object-contain bg-transparent select-none pointer-events-none"
                    />
                  </div>

                  <BottomLeftCard />
                  <BottomRightCorner />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}

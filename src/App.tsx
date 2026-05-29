import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import Hero from './components/Hero';
import CinematicScroll from './components/CinematicScroll';
import Preloader from './components/Preloader';
import MobileBlocker from './components/MobileBlocker';
import { stopScroll, startScroll } from './lib/lenis';

const TOTAL_FRAMES = 151;
const TOTAL_FRAMES_2 = 121;
const TOTAL_FRAMES_3 = 241;

function pad4(n: number): string {
  return String(n).padStart(4, '0');
}

export default function App() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null); // null means not detected yet
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Cache preloaded frame image elements to pass directly to CinematicScroll
  const [preloaded1, setPreloaded1] = useState<HTMLImageElement[]>([]);
  const [preloaded2, setPreloaded2] = useState<HTMLImageElement[]>([]);
  const [preloaded3, setPreloaded3] = useState<HTMLImageElement[]>([]);

  // 1. Mobile Detection Breakpoint
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 2. Asset Preloader (Skipped on mobile!)
  useEffect(() => {
    if (isMobile === null || isMobile === true) return;

    // Lock scroll instantly on mount for desktop
    stopScroll();

    let loadedCount = 0;
    const staticAssets = [
      '/back.jpeg',
      '/headline.png',
      '/the club.png',
      '/harryzin.png',
      '/join_club.webp',
      '/the_club.webp'
    ];

    const totalAssets = TOTAL_FRAMES + TOTAL_FRAMES_2 + TOTAL_FRAMES_3 + staticAssets.length;

    const images1: HTMLImageElement[] = new Array(TOTAL_FRAMES);
    const images2: HTMLImageElement[] = new Array(TOTAL_FRAMES_2);
    const images3: HTMLImageElement[] = new Array(TOTAL_FRAMES_3);
    const staticImages: HTMLImageElement[] = new Array(staticAssets.length);

    const handleLoad = () => {
      loadedCount++;
      const currentProgress = Math.round((loadedCount / totalAssets) * 100);
      setProgress(currentProgress);

      if (loadedCount === totalAssets) {
        setPreloaded1(images1);
        setPreloaded2(images2);
        setPreloaded3(images3);
        setIsLoaded(true);
      }
    };

    // Preload Static Images (Hero background, Hero logo, and Cinematic overlays)
    staticAssets.forEach((src, idx) => {
      const img = new Image();
      img.src = src;
      img.onload = img.onerror = handleLoad;
      staticImages[idx] = img;
    });

    // Preload Sequence 1
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `/frames/${pad4(i + 1)}.webp`;
      img.onload = img.onerror = handleLoad;
      images1[i] = img;
    }

    // Preload Sequence 2
    for (let i = 0; i < TOTAL_FRAMES_2; i++) {
      const img = new Image();
      img.src = `/frames2/${pad4(i + 1)}.webp`;
      img.onload = img.onerror = handleLoad;
      images2[i] = img;
    }

    // Preload Sequence 3
    for (let i = 0; i < TOTAL_FRAMES_3; i++) {
      const img = new Image();
      img.src = `/frames3/${pad4(i + 1)}.webp`;
      img.onload = img.onerror = handleLoad;
      images3[i] = img;
    }

    // Cleanup: clear triggers if unmounted before completion
    return () => {
      staticImages.forEach(img => { img.onload = null; img.onerror = null; });
      images1.forEach(img => { img.onload = null; img.onerror = null; });
      images2.forEach(img => { img.onload = null; img.onerror = null; });
      images3.forEach(img => { img.onload = null; img.onerror = null; });
    };
  }, [isMobile]);

  // 3. Lock/Unlock scrolling once fully preloaded and exit animation is done
  useEffect(() => {
    if (isMobile) {
      stopScroll();
      return;
    }
    if (isLoaded) {
      const timer = setTimeout(() => {
        startScroll();
      }, 1100); // Matches the exit transition of the Preloader
      return () => clearTimeout(timer);
    } else {
      stopScroll();
    }
  }, [isLoaded, isMobile]);

  // Render Loader or Blocker immediately
  if (isMobile === null) return null; // Avoid flashing before mobile detection is complete
  if (isMobile === true) return <MobileBlocker />;

  return (
    <>
      <AnimatePresence mode="wait">
        {!isLoaded && <Preloader key="preloader" progress={progress} />}
      </AnimatePresence>

      <main className="min-h-screen bg-[#f0f0f0]">
        <Hero />
        {isLoaded && (
          <CinematicScroll 
            preloadedImages1={preloaded1}
            preloadedImages2={preloaded2}
            preloadedImages3={preloaded3}
          />
        )}
      </main>
    </>
  );
}

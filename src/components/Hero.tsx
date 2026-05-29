import { useEffect } from 'react';
import { motion } from 'motion/react';
import Navbar from './Navbar';
import BottomLeftCard from './BottomLeftCard';
import BottomRightCorner from './BottomRightCorner';

export default function Hero() {
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const progress = Math.max(0, Math.min(1, scrollY / 800));
      document.documentElement.style.setProperty('--scroll-progress', progress.toString());
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="sticky top-0 z-10 w-full h-screen flex items-center justify-center p-3 md:p-5 bg-[#f0f0f0]">
      <section
        style={{
          transform: 'translateY(calc(50px * var(--scroll-progress, 0))) scale(calc(1 - 0.1 * var(--scroll-progress, 0)))',
          transformOrigin: 'center',
        }}
        className="relative w-full max-w-[1536px] h-full rounded-[1.5rem] md:rounded-[3rem] overflow-hidden shadow-none flex flex-col items-center bg-white/10 group"
      >
        <img
          src="/back.jpeg"
          alt="Background Image"
          referrerPolicy="no-referrer"
          style={{
            transform: 'translateY(calc(-6% + 12% * var(--scroll-progress, 0))) scale(1.15)',
            transformOrigin: 'center',
          }}
          className="absolute inset-0 w-full h-full object-cover object-[65%] lg:object-center z-0 origin-center"
        />

        <div className="relative z-10 w-full h-full flex flex-col">
          <Navbar />

          <div
            style={{
              transform: 'translateY(calc(-100px * var(--scroll-progress, 0)))',
            }}
            className="w-full flex flex-col items-start mt-auto pl-2 md:pl-4 lg:pl-6 pr-6 md:pr-12 lg:pr-16 pb-16 md:pb-40 lg:pb-48 text-left max-w-4xl"
          >
            <motion.img
              src="/headline.png"
              alt="Headline and Description"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-full max-w-[280px] sm:max-w-[370px] md:max-w-[460px] lg:max-w-[550px] h-auto object-contain bg-transparent select-none pointer-events-none"
            />
          </div>

          <BottomLeftCard />
          <BottomRightCorner />
        </div>
      </section>
    </div>
  );
}

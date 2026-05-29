import { motion } from 'motion/react';

interface PreloaderProps {
  progress: number;
  key?: string;
}

export default function Preloader({ progress }: PreloaderProps) {
  // Determine dynamic message based on loading percentage
  let statusMessage = 'INITIALIZING SYSTEM';
  if (progress < 25) {
    statusMessage = 'CURATING THE LANDSCAPE';
  } else if (progress < 50) {
    statusMessage = 'SYNCHRONIZING CINEMATIC SHOTS';
  } else if (progress < 75) {
    statusMessage = 'CRAFTING THE 3D SCROLL';
  } else if (progress < 95) {
    statusMessage = 'POLISHING HIGH-FIDELITY LAYERS';
  } else {
    statusMessage = 'WELCOME TO THE CLUB';
  }

  return (
    <motion.div
      initial={{ 
        opacity: 1,
        filter: 'blur(0px)',
        scale: 1
      }}
      exit={{ 
        opacity: 0,
        filter: 'blur(25px)', // Beautiful organic blur dissolve
        scale: 1.05, // Elegant zoom-out effect
        transition: { 
          duration: 1.3, 
          ease: [0.22, 1, 0.36, 1] // Custom refined ease out
        }
      }}
      className="fixed inset-0 w-screen h-screen z-[9999] flex flex-col items-center justify-center bg-[#fbfaf7] overflow-hidden select-none"
      style={{
        // Radial warm beige & cream gradient
        backgroundImage: 'radial-gradient(circle at center, #faf8f5 0%, #ede8dc 90%)',
      }}
    >
      {/* Super fine, elegant luxury deep forest green inset frame */}
      <div 
        className="absolute inset-4 md:inset-8 pointer-events-none rounded-[1.2rem] md:rounded-[2.5rem]"
        style={{
          border: '1px solid rgba(13, 30, 21, 0.08)',
        }}
      />

      {/* Decorative corners for that bespoke premium golf resort menu feel */}
      <div className="absolute inset-5 md:inset-10 pointer-events-none rounded-[1.2rem] md:rounded-[2.5rem]">
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#0d2315]/25" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#0d2315]/25" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#0d2315]/25" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#0d2315]/25" />
      </div>

      <div className="relative flex flex-col items-center justify-between h-full max-w-lg w-full px-12 py-20 text-center z-10">
        
        {/* Top Header Luxury Badge */}
        <div className="flex flex-col items-center gap-1.5 mt-4">
          <span 
            className="text-[9px] uppercase tracking-[0.25em] text-[#0d2315]/40 font-mono"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            L'Expérience Exclusive
          </span>
          <div className="w-6 h-[1px] bg-[#0d2315]/10" />
        </div>

        {/* Central Brand Identity Group */}
        <div className="flex flex-col items-center gap-4">
          {/* Stunning cursive title in elegant forest green */}
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-5xl sm:text-6xl text-[#0d2315] font-normal leading-none"
            style={{ 
              fontFamily: "'Pinyon Script', cursive",
              textShadow: '0 2px 10px rgba(13, 30, 21, 0.03)'
            }}
          >
            Welcome to
          </motion.h2>

          {/* High-end classic serif brand name in forest green */}
          <motion.h1
            initial={{ opacity: 0, letterSpacing: '0.1em' }}
            animate={{ opacity: 1, letterSpacing: '0.22em' }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="text-3xl sm:text-4xl text-[#0d2315] font-normal uppercase leading-tight mt-1"
            style={{ fontFamily: "'Italiana', serif" }}
          >
            The 1893 Club
          </motion.h1>

          {/* Luxury subtitle */}
          <span 
            className="text-[11px] uppercase tracking-[0.18em] text-[#0d2315]/50 mt-1"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Resort &amp; Spa
          </span>
        </div>

        {/* Bottom loading mechanics */}
        <div className="w-full flex flex-col items-center gap-8 mb-4 max-w-xs">
          
          {/* Elegant percentage display */}
          <div className="flex flex-col items-center gap-1">
            <span 
              className="text-4xl text-[#0d2315] font-light leading-none"
              style={{ fontFamily: "'Italiana', serif" }}
            >
              {Math.round(progress)}%
            </span>
            {/* Dynamic Status Text */}
            <motion.span
              key={statusMessage}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="text-[9px] uppercase tracking-[0.2em] text-[#0d2315]/40 font-mono mt-1"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {statusMessage}
            </motion.span>
          </div>

          {/* Refined ultra-thin progress bar */}
          <div className="relative w-full h-[1px] bg-[#0d2315]/8 rounded-full overflow-hidden">
            {/* Active forest green indicator with soft light glow */}
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute h-full bg-[#0d2315] rounded-full shadow-[0_0_12px_rgba(13,30,21,0.25)]"
            />
          </div>
        </div>

      </div>
    </motion.div>
  );
}

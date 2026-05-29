import { motion } from 'motion/react';

export default function MobileBlocker() {
  return (
    <div 
      className="fixed inset-0 w-screen h-screen z-[99999] flex flex-col items-center justify-between bg-[#fbfaf7] overflow-hidden select-none p-8"
      style={{
        backgroundImage: 'radial-gradient(circle at center, #faf8f5 0%, #ede8dc 90%)',
      }}
    >
      {/* Super fine, elegant luxury forest green inset frame */}
      <div 
        className="absolute inset-4 pointer-events-none rounded-[1.2rem]"
        style={{
          border: '1px solid rgba(13, 30, 21, 0.08)',
        }}
      />

      {/* Decorative corners */}
      <div className="absolute inset-5 pointer-events-none rounded-[1.2rem]">
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#0d2315]/25" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#0d2315]/25" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#0d2315]/25" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#0d2315]/25" />
      </div>

      {/* Top Header Luxury Badge */}
      <div className="flex flex-col items-center gap-1.5 mt-8 z-10 text-center">
        <span 
          className="text-[9px] uppercase tracking-[0.25em] text-[#0d2315]/40 font-mono"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          L'Expérience Exclusive
        </span>
        <div className="w-6 h-[1px] bg-[#0d2315]/10" />
      </div>

      {/* Central Immersive Message */}
      <div className="flex flex-col items-center gap-6 max-w-sm w-full z-10 text-center px-4 relative -top-24">
        {/* Luxury Logo in Forest Green */}
        <motion.img
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          src="/the_club.webp"
          alt="The Club Logo"
          className="w-full max-w-[240px] h-auto object-contain select-none pointer-events-none mb-2"
          style={{ 
            // CSS filter to color white logo to dark forest green (#0d2315)
            filter: 'brightness(0) saturate(100%) invert(9%) sepia(21%) saturate(2200%) hue-rotate(95deg) brightness(92%) contrast(95%)'
          }}
        />

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl text-[#0d2315] font-normal leading-none -mt-16 relative z-20"
          style={{ fontFamily: "'Pinyon Script', cursive" }}
        >
          Immersive Journey
        </motion.h2>

        <motion.h1
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-2xl text-[#0d2315] font-normal uppercase leading-tight tracking-[0.16em]"
          style={{ fontFamily: "'Italiana', serif" }}
        >
          Desktop Required
        </motion.h1>

        <p 
          className="text-[12px] text-[#0d2315]/60 leading-relaxed font-light px-2"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          This bespoke cinematic 3D experience is designed exclusively for larger screens to ensure fluid interaction and full visual fidelity.
        </p>

        <p 
          className="text-[10px] text-[#0d2315]/40 italic font-mono mt-2"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Please open this link on a desktop computer.
        </p>
      </div>

      {/* Bottom Brand Stamp */}
      <div 
        className="text-[9px] uppercase tracking-[0.2em] text-[#0d2315]/30 font-mono mb-8 z-10"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        THE 1893 CLUB / EST. 2026
      </div>
    </div>
  );
}

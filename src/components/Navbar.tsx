import { motion } from 'motion/react';
import { ChevronRight, ArrowUpRight } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between py-6 px-6 md:px-10 w-full relative z-10">
      <div className="flex-1 hidden md:block">
        <img src="/the_club.webp" alt="The Club Logo" className="h-24 md:h-32 w-auto object-contain select-none pointer-events-none" />
      </div>
      
      <ul className="hidden md:flex items-center gap-8 text-white font-normal text-sm">
        <li className="cursor-pointer hover:opacity-70 transition-opacity flex items-center gap-1 group">
          Courses
        </li>
        <li className="cursor-pointer hover:opacity-70 transition-opacity flex items-center gap-1 group">
          Membership
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </li>
        <li className="cursor-pointer hover:opacity-70 transition-opacity flex items-center gap-1 group">
          Tournaments
        </li>
        <li className="cursor-pointer hover:opacity-70 transition-opacity flex items-center gap-1 group">
          Clubhouse
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </li>
      </ul>

      <div className="md:hidden">
        <img src="/the_club.webp" alt="The Club Logo" className="h-16 w-auto object-contain select-none pointer-events-none" />
      </div>

      <div className="flex-1 flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center bg-white text-black rounded-full pl-2 pr-4 md:pr-6 py-1.5 md:py-2 gap-2 md:gap-3 hover:bg-white/90 transition-colors group"
        >
          <div className="bg-black/5 p-1 md:p-1.5 rounded-full flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-black" />
          </div>
          <span className="text-xs md:text-sm font-normal text-black">Book Tee Time</span>
        </motion.button>
      </div>
    </nav>
  );
}

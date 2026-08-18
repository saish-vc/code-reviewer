import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 pointer-events-none"
    >
      {/* Invisible spacer for flex layout balance */}
      <div className="w-[120px] hidden md:block"></div>

      {/* Floating Pill Nav */}
      <nav className={`pointer-events-auto flex items-center gap-6 px-8 py-3 rounded-full transition-colors duration-300 ${scrolled ? 'bg-brand-white text-brand-black shadow-xl shadow-black/10' : 'bg-brand-white/10 backdrop-blur-md text-brand-white border border-brand-white/10'}`}>
        {['About', 'Product', 'How It Works', 'FAQ', 'Contact'].map((item) => (
          <button
            key={item}
            onClick={() => scrollToSection(item.toLowerCase().replace(/ /g, '-'))}
            className={`font-sans text-[11px] font-medium uppercase tracking-widest transition-colors hover:text-brand-accent`}
          >
            {item}
          </button>
        ))}
      </nav>

      {/* Download CTA */}
      <div className="pointer-events-auto">
        <button
          onClick={() => scrollToSection('downloads')}
          className="group relative flex items-center gap-3 px-6 py-3 bg-brand-black text-brand-white rounded-full overflow-hidden transition-transform active:scale-95"
        >
          {/* Accent hover background */}
          <div className="absolute inset-0 bg-brand-darkGray translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          
          <span className="relative z-10 font-sans text-xs font-semibold uppercase tracking-widest">
            Download REVU
          </span>
          <div className="relative z-10 w-2 h-2 rounded-full bg-brand-accent group-hover:scale-150 transition-transform duration-300" />
        </button>
      </div>
    </motion.header>
  );
};

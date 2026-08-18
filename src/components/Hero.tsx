import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import heroImg from '../assets/hero_cinematic.jpg';

export const Hero: React.FC = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  
  const scrollToDownloads = () => {
    const el = document.getElementById('downloads');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative w-full h-screen bg-brand-nearBlack overflow-hidden flex flex-col items-center justify-end pb-24 px-6">
      {/* Background Image with Parallax */}
      <motion.div 
        style={{ y, opacity }}
        className="absolute inset-0 z-0"
      >
        <img 
          src={heroImg} 
          alt="Student coding at night" 
          className="w-full h-full object-cover object-bottom opacity-70"
        />
        {/* Dark gradient overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-nearBlack via-brand-nearBlack/50 to-transparent" />
      </motion.div>

      {/* Hero Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-start gap-6">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block px-3 py-1 border border-brand-white/20 bg-brand-black/50 backdrop-blur-sm"
        >
          <span className="font-mono text-[10px] text-brand-gray uppercase tracking-widestEditorial">
            AI-Assisted Code Review
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-5xl md:text-7xl lg:text-[7rem] leading-[0.9] text-brand-white tracking-tightest"
        >
          SEE THE BUG.<br />
          FIX IT FAST.
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-8 mt-4 w-full justify-between"
        >
          <p className="font-mono text-xs md:text-sm text-brand-gray max-w-md leading-relaxed uppercase">
            Static analysis + AI teaching feedback, in seconds — not days.
          </p>

          <button
            onClick={scrollToDownloads}
            className="group flex items-center gap-4 text-brand-white font-mono text-sm uppercase tracking-widest hover:text-brand-accent transition-colors"
          >
            <span>Download REVU</span>
            <div className="w-10 h-10 rounded-full border border-brand-white/20 flex items-center justify-center group-hover:border-brand-accent group-hover:bg-brand-accent/10 transition-all">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </motion.div>
      </div>
    </section>
  );
};

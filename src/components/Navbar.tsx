import React, { useState, useEffect } from 'react';
import { Terminal, Shield, ArrowUpRight } from 'lucide-react';

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
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-brand-dark/90 backdrop-blur-md border-b border-white/10 py-4' 
        : 'bg-transparent py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        
        {/* Brand Logo & Meta Tag */}
        <div className="flex items-center gap-4">
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-brand-red flex items-center justify-center text-white font-serif font-bold text-xl group-hover:scale-105 transition-transform">
              R
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold tracking-widest text-white leading-none">
                REVU
              </span>
              <span className="font-mono text-[9px] text-brand-gray tracking-widest uppercase mt-0.5">
                CS-Ed Research v1
              </span>
            </div>
          </a>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 text-xs font-mono text-brand-gray">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>NVIDIA NIM LLM</span>
          </div>
        </div>

        {/* Minimal Navigation */}
        <nav className="hidden md:flex items-center gap-8 font-mono text-xs text-brand-gray uppercase tracking-wider">
          <button 
            onClick={() => scrollToSection('manifesto')} 
            className="hover:text-white transition-colors cursor-pointer"
          >
            01 / STUDY
          </button>
          <button 
            onClick={() => scrollToSection('augmented')} 
            className="hover:text-white transition-colors cursor-pointer"
          >
            02 / SYSTEM
          </button>
          <button 
            onClick={() => scrollToSection('capabilities')} 
            className="hover:text-white transition-colors cursor-pointer"
          >
            03 / METHODOLOGY
          </button>
          <button 
            onClick={() => scrollToSection('downloads')} 
            className="hover:text-white transition-colors cursor-pointer text-brand-red font-semibold"
          >
            04 / DOWNLOAD
          </button>
        </nav>

        {/* Action Button */}
        <div>
          <button
            onClick={() => scrollToSection('downloads')}
            className="px-5 py-2.5 bg-brand-red hover:bg-brand-darkRed text-white font-mono text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-brand-red/20 active:scale-95"
          >
            <span>DOWNLOAD APP</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};

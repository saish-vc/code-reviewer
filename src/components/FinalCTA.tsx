import React from 'react';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';

export const FinalCTA: React.FC = () => {
  const scrollToTool = () => {
    const el = document.getElementById('reviewer-tool');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative py-28 px-6 md:px-12 bg-brand-dark border-t border-white/10 overflow-hidden">
      {/* Background Classical Painting Atmosphere */}
      <div 
        className="absolute inset-0 z-0 opacity-20 bg-cover bg-center mix-blend-luminosity filter blur-[2px]"
        style={{ backgroundImage: `url('/artwork/hero.png')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-brand-dark"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center gap-8">
        
        <span className="font-mono text-xs text-brand-red uppercase tracking-widest px-3 py-1 bg-brand-red/10 border border-brand-red/30">
          BEGINNER CODE FEEDBACK REDEFINED
        </span>

        {/* Giant Serif Headline */}
        <h2 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-normal text-brand-cream uppercase leading-[0.95] tracking-tight">
          GET FEEDBACK<br />
          <span className="italic text-brand-red">BEFORE YOU LOSE</span><br />
          THE THREAD.
        </h2>

        <p className="font-sans text-lg md:text-xl text-brand-cream/80 max-w-2xl font-light leading-relaxed">
          Built for a CS-education research study. Your code, reviewed in seconds by static tools &amp; NVIDIA NIM AI.
        </p>

        <button
          onClick={scrollToTool}
          className="px-10 py-5 bg-brand-red hover:bg-brand-darkRed text-white font-mono text-sm font-bold uppercase tracking-widest flex items-center gap-3 transition-all cursor-pointer shadow-xl shadow-brand-red/30 active:scale-95 group mt-4"
        >
          <span>START A REVIEW</span>
          <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </button>

      </div>
    </section>
  );
};

import React, { useEffect, useRef } from 'react';
import { ArrowDown, Scan, AlertTriangle, CheckCircle2, Code2, Sparkles } from 'lucide-react';
import gsap from 'gsap';

export const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const artworkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Timeline for entrance animations
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        artworkRef.current,
        { opacity: 0, scale: 1.05 },
        { opacity: 1, scale: 1, duration: 1.4 }
      )
      .fromTo(
        headingRef.current?.children ? Array.from(headingRef.current.children) : [],
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, stagger: 0.15 },
        '-=0.8'
      )
      .fromTo(
        '.hero-sub',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        '-=0.4'
      )
      .fromTo(
        '.hud-tag-item',
        { opacity: 0, scale: 0.8, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, stagger: 0.12 },
        '-=0.4'
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const scrollToTool = () => {
    const el = document.getElementById('reviewer-tool');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section 
      ref={heroRef}
      className="relative min-h-screen flex flex-col justify-between pt-28 pb-12 px-6 md:px-12 overflow-hidden bg-brand-dark"
    >
      {/* Background Classical Renaissance Painting Canvas */}
      <div 
        ref={artworkRef}
        className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity brightness-90 bg-cover bg-center transition-transform duration-1000"
        style={{ backgroundImage: `url('/artwork/hero.png')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/60 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/90 via-transparent to-brand-dark/90"></div>
        <div className="absolute inset-0 grid-overlay opacity-30"></div>
      </div>

      {/* Sweeping Laser Scan Line */}
      <div className="absolute inset-x-0 top-0 h-32 scan-line opacity-20 pointer-events-none animate-[pulse_4s_infinite]"></div>

      {/* Floating HUD Code Diagnostics Overlays */}
      <div ref={tagsRef} className="absolute inset-0 z-10 pointer-events-none max-w-7xl mx-auto px-6 hidden lg:block">
        
        {/* Tag 1: Top Right */}
        <div className="hud-tag-item absolute top-36 right-16 hud-tag px-3 py-2 text-xs font-mono flex items-center gap-2 border-l-2 border-l-brand-red">
          <span className="w-2 h-2 rounded-full bg-brand-red animate-ping"></span>
          <span className="text-brand-red font-bold">L14:</span>
          <span className="text-brand-cream">pylint / W0612</span>
          <span className="text-brand-gray text-[10px]">[Unused variable 'res']</span>
        </div>

        {/* Tag 2: Mid Right */}
        <div className="hud-tag-item absolute top-72 right-32 hud-tag px-3.5 py-2.5 text-xs font-mono flex flex-col gap-1 border-l-2 border-l-amber-500">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-amber-400 font-bold">L27: HIGH COMPLEXITY</span>
          </div>
          <span className="text-brand-gray text-[10px]">Nested loop O(N²) depth &gt; 3</span>
        </div>

        {/* Tag 3: Center Left Floating */}
        <div className="hud-tag-item absolute top-1/2 left-12 hud-tag px-3 py-2 text-xs font-mono flex items-center gap-2 border-l-2 border-l-blue-400">
          <span className="text-blue-400 font-bold">L42:</span>
          <span className="text-white">NVIDIA NIM LLM</span>
          <span className="text-emerald-400 font-mono text-[10px]">99.2% CONFIDENCE</span>
        </div>

        {/* Tag 4: Lower Right */}
        <div className="hud-tag-item absolute bottom-40 right-24 hud-tag px-3 py-2 text-xs font-mono flex items-center gap-2 border-l-2 border-l-emerald-500">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-emerald-400 font-bold">STATIC COMPLIANCE</span>
          <span className="text-brand-gray text-[10px]">cpplint verified</span>
        </div>
      </div>

      {/* Main Hero Content */}
      <div className="relative z-20 max-w-5xl my-auto">
        <div className="hero-sub inline-flex items-center gap-3 px-3 py-1.5 bg-brand-red/10 border border-brand-red/30 mb-8">
          <Sparkles className="w-3.5 h-3.5 text-brand-red" />
          <span className="font-mono text-xs text-brand-cream uppercase tracking-widest">
            Feedback in Seconds. Not Days.
          </span>
        </div>

        {/* Giant Editorial Serif Headline */}
        <h1 
          ref={headingRef}
          className="font-serif text-5xl sm:text-7xl lg:text-8xl font-normal tracking-tight leading-[0.95] text-brand-cream uppercase mb-8"
        >
          <div className="block">LEARN TO CODE</div>
          <div className="block italic text-brand-red">WITHOUT WAITING</div>
          <div className="block">IN LINE.</div>
        </h1>

        {/* Subtitle & CTA */}
        <div className="hero-sub max-w-xl flex flex-col gap-6">
          <p className="text-lg md:text-xl text-brand-cream/80 font-sans font-light leading-relaxed">
            AI-assisted, TA-verified code review for beginner Python &amp; C++ students. Combining static checkers with LLM teaching insights.
          </p>

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={scrollToTool}
              className="px-8 py-4 bg-brand-red hover:bg-brand-darkRed text-white font-mono text-sm font-bold uppercase tracking-widest flex items-center gap-3 transition-all cursor-pointer group shadow-xl shadow-brand-red/25 active:scale-95"
            >
              <span>TRY A REVIEW</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
            
            <a
              href="#manifesto"
              className="px-6 py-4 border border-white/20 hover:border-white/50 text-brand-cream font-mono text-sm uppercase tracking-wider transition-colors"
            >
              READ MANIFESTO
            </a>
          </div>
        </div>
      </div>

      {/* Hero Bottom Meta Bar */}
      <div className="relative z-20 pt-12 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-brand-gray">
        <div className="flex items-center gap-6">
          <span>PROJECT: CS-ED RESEARCH LAB</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">LANGUAGES: PYTHON / C++</span>
        </div>
        <div className="flex items-center gap-2 text-brand-cream">
          <Scan className="w-4 h-4 text-brand-red animate-pulse" />
          <span>SCROLL TO EXPLORE</span>
          <ArrowDown className="w-3.5 h-3.5 text-brand-red" />
        </div>
      </div>
    </section>
  );
};

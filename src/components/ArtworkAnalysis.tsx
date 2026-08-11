import React, { useEffect, useRef } from 'react';
import { Cpu, Terminal, Eye, Layers, ShieldCheck } from 'lucide-react';
import gsap from 'gsap';

export const ArtworkAnalysis: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(imageRef.current, {
        yPercent: -10,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      id="augmented"
      ref={sectionRef} 
      className="relative min-h-[90vh] bg-brand-dark py-24 px-6 md:px-12 flex flex-col justify-center overflow-hidden border-t border-white/10"
    >
      <div className="max-w-7xl mx-auto w-full relative z-10">
        
        {/* Header Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-12 font-mono text-xs text-brand-gray border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Cpu className="w-4 h-4 text-brand-red" />
            <span className="text-white font-bold tracking-widest uppercase">HISTORICAL PEDAGOGY RE-INDEXED</span>
          </div>
          <span>NEURAL ARCHITECTURE: NVIDIA NIM + LLAMA 3.1 8B</span>
        </div>

        {/* Artwork Container with Overlays */}
        <div className="relative w-full h-[550px] md:h-[650px] border border-white/15 overflow-hidden group">
          
          {/* Painting Background */}
          <div 
            ref={imageRef}
            className="absolute inset-0 bg-cover bg-center opacity-70 filter saturate-90 brightness-95 scale-110 transition-all duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url('/artwork/teaching.png')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-brand-dark/80"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/80 via-transparent to-brand-dark/80"></div>
          </div>

          {/* Scanning Reticle & Horizontal Scan Lines */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 inset-x-0 h-0.5 bg-brand-red/80 shadow-[0_0_12px_#F30000] animate-[pulse_2s_infinite]"></div>
            <div className="absolute top-2/3 inset-x-0 h-0.5 bg-blue-500/60 shadow-[0_0_12px_#3b82f6]"></div>
            <div className="absolute inset-0 grid-overlay opacity-20"></div>
          </div>

          {/* Overlay Diagnostics */}
          {/* Diagnostic Box 1 */}
          <div className="absolute top-12 left-10 hud-tag p-4 max-w-xs font-mono text-xs hidden md:block">
            <div className="flex items-center justify-between text-brand-gray text-[10px] mb-2 border-b border-white/10 pb-1">
              <span>CANONICAL MODEL</span>
              <span className="text-emerald-400">98.4% ACCURACY</span>
            </div>
            <p className="text-brand-cream leading-relaxed text-[11px]">
              "Socratic guidance: highlighting logical flaws through targeted probing questions rather than giving raw code solutions."
            </p>
          </div>

          {/* Diagnostic Box 2 */}
          <div className="absolute bottom-16 right-12 hud-tag p-4 max-w-sm font-mono text-xs">
            <div className="flex items-center justify-between text-brand-gray text-[10px] mb-2 border-b border-white/10 pb-1">
              <span className="text-brand-red font-bold">STATIC ANALYSIS PARSER</span>
              <span>PYLINT / BANDIT / CPPLINT</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center justify-between text-brand-cream">
                <span>AST AST_NODE_ASSIGNMENT</span>
                <span className="text-amber-400">WARNING (C0103)</span>
              </div>
              <div className="flex items-center justify-between text-brand-gray">
                <span>SECURITY BUFFER_CHECK</span>
                <span className="text-emerald-400">PASSED</span>
              </div>
            </div>
          </div>

          {/* Central Giant Overlapping Serif Heading */}
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-20 pointer-events-none">
            <h2 className="font-serif text-6xl sm:text-8xl lg:text-9xl font-normal tracking-tight text-white uppercase drop-shadow-2xl">
              TEACHING,<br />
              <span className="italic text-brand-red drop-shadow-[0_4px_30px_rgba(243,0,0,0.5)]">AUGMENTED.</span>
            </h2>
          </div>

        </div>

        {/* Subtext */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs text-brand-gray">
          <div className="p-4 border border-white/10 bg-brand-surface">
            <div className="text-white font-bold mb-1">01 / RETENTION FIRST</div>
            <p>Students fix errors 3x faster when feedback contextualizes the error in conceptual terms.</p>
          </div>
          <div className="p-4 border border-white/10 bg-brand-surface">
            <div className="text-white font-bold mb-1">02 / NON-BLOCKING PIPELINE</div>
            <p>Instant static evaluation reduces cognitive interruption during late-night lab assignments.</p>
          </div>
          <div className="p-4 border border-white/10 bg-brand-surface">
            <div className="text-white font-bold mb-1">03 / HUMAN TA ESCALATION</div>
            <p>Edge cases and low-confidence reviews automatically populate the TA review queue.</p>
          </div>
        </div>

      </div>
    </section>
  );
};

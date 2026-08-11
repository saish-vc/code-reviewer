import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const Manifesto: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const words = textRef.current?.querySelectorAll('.reveal-word');
      if (words && words.length > 0) {
        gsap.fromTo(
          words,
          { opacity: 0.2, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.05,
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top 75%',
              end: 'bottom 40%',
              scrub: 0.8,
            },
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const paragraph1 = "WE WERE TIRED OF FEEDBACK THAT ARRIVED AFTER THE ASSIGNMENT WAS ALREADY DUE. SO WE BUILT A SYSTEM THAT READS YOUR CODE THE MOMENT YOU FINISH IT.";
  const paragraph2 = "STATIC ANALYSIS FINDS WHAT'S BROKEN. AI EXPLAINS WHY IT MATTERS. A HUMAN TA IS STILL IN THE LOOP WHEN IT COUNTS.";

  const renderWords = (text: string) => {
    return text.split(' ').map((word: string, i: number) => (
      <span key={i} className="reveal-word inline-block mr-[0.3em] transition-colors duration-200">
        {word}
      </span>
    ));
  };

  return (
    <section 
      id="manifesto" 
      ref={containerRef} 
      className="bg-brand-red text-white py-28 px-6 md:px-16 border-t border-white/10 relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 font-mono text-xs text-white/80 uppercase tracking-widest mb-12">
          <span className="w-2 h-2 bg-white"></span>
          <span>MANIFESTO / RESEARCH RATIONALE</span>
        </div>

        <div ref={textRef} className="space-y-12 font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.15] text-white">
          <p className="tracking-tight">
            {renderWords(paragraph1)}
          </p>

          <p className="tracking-tight italic text-brand-cream/90">
            {renderWords(paragraph2)}
          </p>
        </div>

        <div className="mt-16 pt-8 border-t border-white/20 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-white/70">
          <span>REVU CS-EDUCATION PAPER SUBMISSION #4092</span>
          <span>EMPIRICAL TRIAL: AUTUMN 2026</span>
        </div>
      </div>
    </section>
  );
};

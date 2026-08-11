import React from 'react';

export const RedTransition: React.FC = () => {
  return (
    <section className="bg-brand-red text-white py-24 px-6 md:px-12 relative overflow-hidden">
      {/* Decorative background grid lines */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      <div className="max-w-5xl mx-auto text-center relative z-10 flex flex-col items-center gap-8">
        
        {/* Centered White Logo Mark */}
        <div className="w-16 h-16 border-2 border-white flex items-center justify-center font-serif text-4xl font-bold tracking-widest text-white shadow-2xl">
          R
        </div>

        {/* Uppercase Statement */}
        <p className="font-mono text-sm sm:text-base md:text-lg font-bold tracking-widest uppercase text-white/95 max-w-3xl leading-relaxed">
          WE BUILT THIS TO GIVE EVERY STUDENT A TA THAT NEVER SLEEPS AND NEVER RUNS OUT OF TIME.
        </p>

        <div className="w-24 h-px bg-white/40 my-2"></div>

        {/* Large Script/Serif REVU Mark */}
        <div className="font-serif text-7xl sm:text-9xl font-normal italic tracking-wider text-white opacity-95">
          REVU
        </div>

      </div>
    </section>
  );
};

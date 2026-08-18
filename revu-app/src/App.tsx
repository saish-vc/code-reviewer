import React from 'react';
import { ReviewTool } from './ReviewTool';

/**
 * Desktop App root — monochrome/brutalist redesign matching revu-site.
 * Minimal branded header bar styled as a compact pill-nav treatment.
 */
const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-nearBlack text-brand-offWhite flex flex-col selection:bg-brand-offWhite selection:text-brand-black">
      {/* Film grain overlay (matches site dark sections) */}
      <div className="noise-overlay" />

      {/* ── Compact header bar ── */}
      <header className="flex-shrink-0 h-11 bg-brand-black border-b border-brand-border flex items-center px-5 gap-4 select-none z-10">
        {/* Logo mark */}
        <div className="w-5 h-5 bg-brand-white flex items-center justify-center text-brand-black font-mono font-bold text-xs flex-shrink-0">
          R
        </div>

        <span className="font-mono text-xs font-bold tracking-widest text-brand-white uppercase">
          REVU
        </span>

        <span className="font-mono text-[9px] text-brand-gray uppercase tracking-widest hidden sm:block">
          / AI Code Reviewer
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* NVIDIA NIM status badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 border border-brand-border bg-brand-surface">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="font-mono text-[9px] text-brand-gray uppercase tracking-widest">
            NVIDIA NIM
          </span>
        </div>
      </header>

      {/* ReviewTool fills the remaining viewport */}
      <main className="flex-1 overflow-auto">
        <ReviewTool />
      </main>
    </div>
  );
};

export default App;

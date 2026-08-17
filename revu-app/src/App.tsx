import React from 'react';
import { ReviewTool } from './ReviewTool';

/**
 * Desktop App root.
 *
 * The Tauri window contains only the ReviewTool — the marketing landing page
 * (Hero, Manifesto, ArtworkAnalysis, etc.) lives in the root src/ frontend
 * (revu-site) and is deployed as a static marketing website separately.
 *
 * A minimal branded header bar is included so the window still feels like
 * an intentional product rather than a raw webview.
 */
const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-dark text-white selection:bg-brand-red selection:text-white flex flex-col">
      {/* Minimal desktop title bar — thin, editorial, matches REVU design language */}
      <header className="flex-shrink-0 h-10 bg-black border-b border-white/10 flex items-center px-5 gap-3 select-none">
        {/* Logo mark */}
        <div className="w-5 h-5 bg-brand-red flex items-center justify-center text-white font-serif font-bold text-xs flex-shrink-0">
          R
        </div>
        <span className="font-serif text-sm font-bold tracking-widest text-white uppercase">
          REVU
        </span>
        <span className="font-mono text-[9px] text-brand-gray uppercase tracking-widest ml-1">
          AI Code Reviewer
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Status badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
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

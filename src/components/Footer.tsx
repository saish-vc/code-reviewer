import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-black py-16 px-6 md:px-12 border-t border-brand-darkGray text-brand-gray font-mono text-xs">
      <div className="max-w-7xl mx-auto flex flex-col gap-12">

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

          {/* Brand Info */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-brand-white flex items-center justify-center text-brand-black font-bold text-lg font-display">
                R
              </div>
              <span className="font-display text-xl tracking-widest text-brand-white uppercase">
                REVU
              </span>
            </div>
            <p className="font-sans text-xs text-brand-gray leading-relaxed max-w-sm">
              An experimental CS-education research tool combining static analysis (pylint, bandit, cpplint, eslint) with NVIDIA NIM pedagogical LLM feedback. Free & open source.
            </p>
          </div>

          {/* Research Consent & Privacy Notice */}
          <div className="md:col-span-7 p-4 border border-brand-darkGray bg-brand-nearBlack flex flex-col gap-2">
            <span className="text-brand-white font-bold uppercase tracking-wider text-[11px]">
              Research Consent & Privacy Notice
            </span>
            <p className="text-[11px] leading-relaxed text-brand-gray">
              Code submissions processed through REVU are anonymized and logged for empirical evaluation in Computer Science Education research (IRB Protocol #2026-CS-088). No personal identifiable information (PII) or student identity metadata is requested or stored.
            </p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-brand-darkGray flex flex-wrap items-center justify-between gap-4 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} REVU Research. MIT License.
          </div>
          <div className="flex items-center gap-6">
            <span>FastAPI Backend</span>
            <span>•</span>
            <span>NVIDIA NIM LLM</span>
            <span>•</span>
            <a href="https://github.com/saish-vc/code-reviewer" target="_blank" rel="noopener noreferrer" className="hover:text-brand-white transition-colors">
              GitHub
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};

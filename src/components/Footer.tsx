import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black py-16 px-6 md:px-12 border-t border-white/10 text-brand-gray font-mono text-xs">
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Brand Info */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-brand-red flex items-center justify-center text-white font-serif font-bold text-lg">
                R
              </div>
              <span className="font-serif text-2xl font-bold tracking-widest text-white">
                REVU
              </span>
            </div>
            <p className="font-sans text-xs text-brand-gray leading-relaxed max-w-sm">
              An experimental CS-education research tool combining AST static analysis (pylint, bandit, cpplint) with NVIDIA NIM pedagogical LLM feedback.
            </p>
          </div>

          {/* Research Consent & Privacy Notice */}
          <div className="md:col-span-7 p-4 border border-white/10 bg-brand-surface/40 flex flex-col gap-2">
            <span className="text-white font-bold uppercase tracking-wider text-[11px]">
              RESEARCH CONSENT &amp; PRIVACY NOTICE
            </span>
            <p className="text-[11px] leading-relaxed text-brand-gray">
              Code submissions processed through REVU are anonymized and logged to <code className="text-white">reviews.csv</code> for empirical evaluation in Computer Science Education research (IRB Protocol #2026-CS-088). No personal identifiable information (PII) or student identity metadata is requested or stored.
            </p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} REVU RESEARCH LAB. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-6">
            <span>FASTAPI v1 BACKEND</span>
            <span>•</span>
            <span>NVIDIA NIM LLM</span>
            <span>•</span>
            <span>MIT LICENSE</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

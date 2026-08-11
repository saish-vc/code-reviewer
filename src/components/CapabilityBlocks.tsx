import React from 'react';

export const CapabilityBlocks: React.FC = () => {
  const capabilities = [
    {
      num: "01",
      title: "ANALYZE",
      desc: "Static tools catch what's measurable.",
      details: "Runs AST parsers, pylint, bandit security checks, and cpplint to find exact syntax, style, and memory issues deterministically."
    },
    {
      num: "02",
      title: "EXPLAIN",
      desc: "AI turns warnings into teaching moments.",
      details: "NVIDIA NIM LLMs translate cryptic linter outputs into encouraging, step-by-step pedagogical explanations targeted for beginners."
    },
    {
      num: "03",
      title: "VERIFY",
      desc: "A TA reviews the same submission.",
      details: "One-click escalation pushes problematic submissions to human Teaching Assistants for human-in-the-loop verification."
    },
    {
      num: "04",
      title: "IMPROVE",
      desc: "Resubmit and see what changed.",
      details: "Track iterative code revisions with instant feedback cycles before final assignment deadlines."
    }
  ];

  return (
    <section id="capabilities" className="bg-brand-dark py-24 px-6 md:px-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="font-mono text-xs text-brand-red uppercase tracking-widest block mb-2">
              SYSTEM ARCHITECTURE &amp; METHODOLOGY
            </span>
            <h2 className="font-serif text-4xl sm:text-6xl font-normal text-brand-cream uppercase">
              THE REVU METHOD
            </h2>
          </div>
          <p className="font-mono text-xs text-brand-gray max-w-md leading-relaxed">
            Designed for introductory Computer Science education research to balance automated scalability with human pedagogical care.
          </p>
        </div>

        {/* 4 Sharp Editorial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/15 border border-white/15">
          {capabilities.map((cap) => (
            <div 
              key={cap.num}
              className="bg-brand-dark p-8 flex flex-col justify-between hover:bg-brand-surface transition-colors duration-300 group min-h-[320px]"
            >
              <div>
                <div className="font-serif text-5xl font-bold text-white/30 group-hover:text-brand-red transition-colors mb-6">
                  {cap.num}
                </div>
                <h3 className="font-mono text-xl font-bold text-white uppercase tracking-wider mb-3">
                  {cap.title}
                </h3>
                <p className="font-sans text-base text-brand-cream/90 font-medium mb-4">
                  {cap.desc}
                </p>
              </div>

              <p className="font-mono text-xs text-brand-gray leading-relaxed pt-4 border-t border-white/10">
                {cap.details}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

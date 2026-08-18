import React from 'react';
import { motion, Variants } from 'framer-motion';
import abstractImg from '../assets/abstract_analysis.jpg';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { ease: EASE, duration: 0.8 } as any }
};

export const ProductSection: React.FC = () => {
  return (
    <section id="product" className="relative w-full bg-brand-offWhite text-brand-black pb-32 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6"
        >
          {/* Card 1: Static Analysis Pipeline */}
          <motion.div
            variants={item}
            className="md:col-span-8 bg-brand-white border border-brand-lightGray p-8 md:p-12 shadow-sm flex flex-col justify-between group hover:border-brand-gray transition-colors min-h-[360px]"
          >
            <div className="flex justify-between items-start">
              <span className="font-mono text-[10px] text-brand-gray uppercase tracking-widest border border-brand-lightGray px-2 py-1">
                L14 // PIPELINE
              </span>
              <span className="font-mono text-[10px] text-brand-gray">SYS.01</span>
            </div>
            <div className="mt-16">
              <h3 className="font-display text-2xl md:text-4xl mb-4 uppercase tracking-tightest">
                Multi-Language<br />Static Analysis
              </h3>
              <p className="font-sans text-brand-darkGray max-w-lg leading-relaxed">
                REVU automatically routes your code through industry-standard linters — Pylint, Bandit, Cpplint, ESLint — to extract measurable metrics and security findings before the AI ever runs.
              </p>
            </div>
          </motion.div>

          {/* Card 2: AI Feedback */}
          <motion.div
            variants={item}
            className="md:col-span-4 bg-brand-nearBlack text-brand-offWhite border border-brand-black p-8 md:p-12 shadow-sm flex flex-col justify-between min-h-[360px]"
          >
            <div className="flex justify-between items-start">
              <span className="font-mono text-[10px] text-brand-gray uppercase tracking-widest border border-brand-darkGray px-2 py-1">
                NVIDIA NIM // LLM
              </span>
              <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
            </div>
            <div className="mt-16">
              <h3 className="font-display text-2xl mb-4 uppercase tracking-tightest text-brand-white">
                Pedagogical AI Feedback
              </h3>
              <p className="font-sans text-brand-gray text-sm leading-relaxed">
                REVU synthesizes linter output into line-referenced explanations designed to teach beginners <em>why</em> the code failed, not just <em>how</em> to fix it.
              </p>
            </div>
          </motion.div>

          {/* Card 3: Abstract Data Visualization */}
          <motion.div
            variants={item}
            className="md:col-span-12 relative h-[360px] md:h-[500px] bg-brand-white border border-brand-lightGray p-2 overflow-hidden group"
          >
            <div className="absolute top-6 left-6 z-10 flex gap-4">
              <span className="font-mono text-[10px] text-brand-white uppercase tracking-widest border border-brand-white/20 bg-brand-black/50 backdrop-blur-md px-2 py-1">
                DATA_STREAM // EXEC
              </span>
            </div>
            <img
              src={abstractImg}
              alt="Code analysis data visualization"
              className="w-full h-full object-cover filter grayscale contrast-125 group-hover:scale-105 transition-transform duration-1000 ease-out"
              loading="lazy"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

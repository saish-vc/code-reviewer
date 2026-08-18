import React from 'react';
import { motion } from 'framer-motion';

export const IntroSection: React.FC = () => {
  return (
    <section id="about" className="relative w-full bg-brand-offWhite text-brand-black pt-32 pb-48 px-6 md:px-12 rounded-t-3xl -mt-6 z-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-6">
        
        {/* Main Headline */}
        <div className="md:col-span-8 md:col-start-2">
          <motion.h2 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[5rem] leading-[1.05] tracking-tightest uppercase"
          >
            Meet REVU.<br />
            Built to read<br />
            your code and<br />
            explain what<br />
            actually matters.
          </motion.h2>
        </div>

        {/* Supporting Text Asymmetrically Placed */}
        <div className="md:col-span-4 md:col-start-8 mt-12 md:mt-32">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="w-12 h-[2px] bg-brand-accent mb-6" />
            <p className="font-sans text-lg md:text-xl text-brand-darkGray leading-relaxed font-light">
              Static analysis catches what's measurable. AI explains why it matters 
              and how to fix it — line by line.
            </p>
          </motion.div>
        </div>

      </div>
    </section>
  );
};

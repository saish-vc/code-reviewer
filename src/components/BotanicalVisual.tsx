import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import flowerImg from '../assets/monochrome_flower.jpg';

export const BotanicalVisual: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 10]);

  return (
    <div className="relative w-full bg-brand-offWhite h-64 md:h-96 flex items-center justify-center overflow-visible pointer-events-none z-30">
      <motion.div 
        style={{ y, rotate }}
        className="absolute w-[120%] md:w-[800px] mix-blend-multiply opacity-80"
      >
        <img 
          src={flowerImg} 
          alt="Abstract botanical visual" 
          className="w-full h-auto object-contain filter contrast-125"
        />
      </motion.div>
    </div>
  );
};

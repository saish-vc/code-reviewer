import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { IntroSection } from './components/IntroSection';
import { ProductSection } from './components/ProductSection';
import { BotanicalVisual } from './components/BotanicalVisual';
import { Downloads } from './components/Downloads';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-nearBlack text-brand-offWhite overflow-x-hidden selection:bg-brand-offWhite selection:text-brand-black">
      {/* Subtle film grain overlay */}
      <div className="noise-overlay" />
      <Navbar />
      <main>
        <Hero />
        <IntroSection />
        <ProductSection />
        <BotanicalVisual />
        <Downloads />
      </main>
      <Footer />
    </div>
  );
};

export default App;

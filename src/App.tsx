import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { RedTransition } from './components/RedTransition';
import { Manifesto } from './components/Manifesto';
import { ArtworkAnalysis } from './components/ArtworkAnalysis';
import { CapabilityBlocks } from './components/CapabilityBlocks';
import { ReviewTool } from './components/ReviewTool';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-dark text-white selection:bg-brand-red selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <RedTransition />
        <Manifesto />
        <ArtworkAnalysis />
        <CapabilityBlocks />
        <ReviewTool />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default App;

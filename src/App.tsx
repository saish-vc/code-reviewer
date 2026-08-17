import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { RedTransition } from './components/RedTransition';
import { Manifesto } from './components/Manifesto';
import { ArtworkAnalysis } from './components/ArtworkAnalysis';
import { CapabilityBlocks } from './components/CapabilityBlocks';
import { Downloads } from './components/Downloads';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';

// NOTE: ReviewTool has been intentionally removed from the marketing site.
// It now lives exclusively in revu-app/ (the Tauri desktop application).
// The Downloads section links to the GitHub Releases page for platform installers.

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
        <Downloads />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default App;

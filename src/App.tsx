/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Header } from './components/Header';
import { PartnerSection } from './components/PartnerSection';
import { PartnerDetailModal } from './components/PartnerDetailModal';
import { Footer } from './components/Footer';
import { Partner } from './types';
import { AnimatePresence } from 'motion/react';

export default function App() {
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-500/15 selection:text-blue-900 antialiased font-sans">
      {/* Top Notification / Info Bar */}
      <div className="bg-slate-900 text-white text-[11px] sm:text-xs font-semibold py-2.5 px-4 text-center border-b border-slate-800 tracking-wide">
        ✨ Portal de Apoio de Marketing: Clique em um parceiro para abrir sua página, copiar contatos e baixar materiais.
      </div>

      {/* Main Header */}
      <Header />
      
      <main className="bg-white">
        {/* Unified Partners Listing & Detailed Click Interaction */}
        <PartnerSection onSelectPartner={(partner) => setSelectedPartner(partner)} />
      </main>

      {/* Main Footer */}
      <Footer onScrollToTop={handleScrollToTop} />

      {/* Partner Detail Page acting as Dynamic Modal Overlay */}
      <AnimatePresence>
        {selectedPartner && (
          <PartnerDetailModal 
            partner={selectedPartner} 
            onClose={() => setSelectedPartner(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

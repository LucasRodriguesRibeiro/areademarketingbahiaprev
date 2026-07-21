/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Header } from './components/Header';
import { FeedSection } from './components/FeedSection';
import { AnnouncementsSection } from './components/AnnouncementsSection';
import { PartnerSection } from './components/PartnerSection';
import { MembersSection } from './components/MembersSection';
import { PartnerDetailModal } from './components/PartnerDetailModal';
import { Footer } from './components/Footer';
import { Partner } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { AuthForm } from './components/AuthForm';
import { LogOut, Radio, Sparkles } from 'lucide-react';

function MainAppContent() {
  const { user, profile, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'announcements' | 'partners' | 'members'>('feed');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="h-10 w-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-300 tracking-wide">Carregando PrevHub...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-500/15 selection:text-blue-900 antialiased font-sans">
      {/* Top User Status & Info Bar */}
      <div className="bg-slate-950 text-white text-[11px] sm:text-xs font-semibold py-2.5 px-4 border-b border-slate-900 tracking-wide">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-300">
              PrevHub • Conectado como <span className="text-white font-bold">{profile?.name}</span> ({profile?.role})
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-white/20">|</span>
            <button 
              onClick={logout}
              className="text-slate-400 hover:text-white hover:underline transition-colors focus:outline-none cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="h-3 w-3" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main Header with Navigation Tabs */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Tab Content Rendering */}
      <main className="bg-slate-50 min-h-[600px] py-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 'feed' && <FeedSection />}
            {activeTab === 'announcements' && <AnnouncementsSection />}
            {activeTab === 'partners' && <PartnerSection onSelectPartner={(partner) => setSelectedPartner(partner)} />}
            {activeTab === 'members' && <MembersSection />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Main Footer */}
      <Footer onScrollToTop={handleScrollToTop} />

      {/* Partner Detail Modal */}
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

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}


import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Download, X, Sparkles, Check, ChevronRight } from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';
import logoAplicativo from '../assets/images/logoaplicativo.png';

interface PwaInstallBannerProps {
  onOpenInstallModal: () => void;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({ onOpenInstallModal }) => {
  const { canInstallNatively, isInstalled, triggerInstall } = usePwaInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user already installed or if banner was dismissed
    if (isInstalled) return;

    // Strict check for mobile device / small screen
    const isMobileDevice =
      typeof window !== 'undefined' &&
      (window.innerWidth <= 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

    if (!isMobileDevice) return;

    const isDismissed = localStorage.getItem('bahiaprev_pwa_banner_dismissed') === 'true';
    if (!isDismissed) {
      // Delay slightly so the page loads smoothly first
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isInstalled]);

  if (!isVisible || isInstalled) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('bahiaprev_pwa_banner_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (canInstallNatively) {
      const installed = await triggerInstall();
      if (installed) {
        setIsVisible(false);
        return;
      }
    }
    // Fallback: Open detailed step-by-step modal (ideal for iOS & browsers without native prompt)
    onOpenInstallModal();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-20 left-3 right-3 sm:hidden z-50 pointer-events-auto"
      >
        <div className="bg-slate-900/95 backdrop-blur-xl border-2 border-blue-500/40 text-white rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden ring-1 ring-white/10">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 w-36 h-36 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-8 -translate-x-8 w-36 h-36 bg-red-600/15 rounded-full blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer z-10"
            title="Fechar notificação"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3.5 pr-6">
            {/* Logo Image Box */}
            <div className="h-14 w-14 rounded-2xl bg-slate-950 border border-slate-700/80 p-1 flex items-center justify-center shrink-0 shadow-lg overflow-hidden relative group">
              <img
                src={logoAplicativo || '/logoaplicativo.png'}
                alt="Bahia Prev HUB Logo"
                className="h-full w-full object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logoaplicativo.png';
                }}
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                <Smartphone className="h-2.5 w-2.5 text-slate-950" />
              </span>
            </div>

            {/* Banner Text Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  <Sparkles className="h-3 w-3 text-blue-400" />
                  <span>Instalar Aplicativo</span>
                </span>
              </div>

              <h3 className="text-sm font-black text-white leading-tight">
                Adicionar Atalho no Celular?
              </h3>

              <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                Instale o app do <strong className="text-white font-bold">Bahia Prev HUB</strong> na tela inicial para acessar em 1 toque com nossa logo oficial!
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
            <button
              onClick={handleDismiss}
              className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer rounded-xl hover:bg-slate-800/60"
            >
              Agora não
            </button>

            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-1.5 border border-blue-400/30 active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Sim, Instalar App</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-80" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

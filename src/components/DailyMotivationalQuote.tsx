import React, { useState } from 'react';
import { Sparkles, Quote, X, ArrowUpRight } from 'lucide-react';
import { getDailyMotivationalQuote } from '../utils/dailyQuote';
import { motion, AnimatePresence } from 'motion/react';

interface DailyMotivationalQuoteProps {
  className?: string;
  variant?: 'compact' | 'card';
}

export const DailyMotivationalQuote: React.FC<DailyMotivationalQuoteProps> = ({ 
  className = '',
  variant = 'card'
}) => {
  const todayQuote = getDailyMotivationalQuote();
  const [showModal, setShowModal] = useState(false);

  if (variant === 'compact') {
    return (
      <>
        <div 
          onClick={() => setShowModal(true)}
          className={`group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 border border-amber-400/30 hover:border-amber-400/60 shadow-sm hover:shadow-amber-500/10 backdrop-blur-md cursor-pointer transition-all duration-300 select-none max-w-full ${className}`}
          title="Clique para ver a Frase Motivacional do Dia completa"
        >
          <div className="relative flex items-center justify-center shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-amber-300 group-hover:scale-110 transition-transform duration-300" />
            <span className="absolute -inset-1 rounded-full bg-amber-400/20 animate-ping pointer-events-none opacity-40" />
          </div>

          <div className="flex items-center gap-1.5 text-left min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300/90 shrink-0 hidden xs:inline">
              Frase do Dia:
            </span>
            <span className="text-[11px] font-medium text-amber-100/90 group-hover:text-white transition-colors truncate max-w-[150px] xs:max-w-[200px] sm:max-w-[260px] md:max-w-[320px] lg:max-w-[400px] italic">
              "{todayQuote.quote}"
            </span>
          </div>

          {todayQuote.theme && (
            <span className="hidden xl:inline-block text-[9px] font-bold text-amber-200 bg-amber-400/20 border border-amber-300/30 px-1.5 py-0.5 rounded-full shrink-0">
              {todayQuote.theme}
            </span>
          )}
        </div>

        {/* Full Quote Modal */}
        <AnimatePresence>
          {showModal && renderModal()}
        </AnimatePresence>
      </>
    );
  }

  // Rich Glassmorphic Card Variant (Hero Placement)
  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        onClick={() => setShowModal(true)}
        className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-950/90 to-amber-950/20 border border-amber-400/30 hover:border-amber-400/60 p-3.5 sm:p-4 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 backdrop-blur-xl cursor-pointer transition-all duration-300 select-none text-left ${className}`}
        title="Clique para expandir a frase do dia"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/15 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/25 transition-all duration-500" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform">
              <Sparkles className="h-3.5 w-3.5 fill-amber-300/20" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-300 drop-shadow-xs">
              Frase do Dia
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {todayQuote.theme && (
              <span className="text-[9px] font-bold text-amber-200/90 bg-amber-400/15 border border-amber-300/25 px-2 py-0.5 rounded-md">
                {todayQuote.theme}
              </span>
            )}
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0" />
          </div>
        </div>

        {/* Quote Content */}
        <div className="relative pl-2.5 border-l-2 border-amber-400/40 group-hover:border-amber-400 transition-colors my-2">
          <p className="text-xs sm:text-[13px] text-slate-100 font-medium italic leading-snug line-clamp-3 group-hover:text-white transition-colors">
            "{todayQuote.quote}"
          </p>
        </div>

        {/* Footer / Author */}
        <div className="flex items-center justify-between pt-1.5 text-[10px] text-slate-400">
          <span className="truncate">
            Autor: <strong className="text-slate-200 font-semibold">{todayQuote.author || 'Bahia Prev'}</strong>
          </span>
          <span className="text-[9px] text-amber-300/70 group-hover:text-amber-300 font-medium shrink-0">
            Expandir ✨
          </span>
        </div>
      </motion.div>

      {/* Full Quote Modal */}
      <AnimatePresence>
        {showModal && renderModal()}
      </AnimatePresence>
    </>
  );

  function renderModal() {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white shadow-2xl relative overflow-hidden text-center"
        >
          {/* Background glow */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Icon Header */}
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-lg mb-4">
            <Sparkles className="h-6 w-6 fill-current" />
          </div>

          <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-amber-300 bg-amber-500/10 border border-amber-400/20 px-3 py-1 rounded-full mb-3">
            ✨ Inspiração Diária Bahia Prev
          </span>

          {/* The Quote */}
          <div className="my-4 relative px-4">
            <Quote className="h-8 w-8 text-amber-400/20 absolute -top-3 -left-1 transform -scale-x-100" />
            <p className="text-base sm:text-lg font-semibold text-slate-100 leading-relaxed italic">
              "{todayQuote.quote}"
            </p>
            <Quote className="h-8 w-8 text-amber-400/20 absolute -bottom-3 -right-1" />
          </div>

          {/* Author / Theme */}
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-center gap-3 text-xs">
            {todayQuote.author && (
              <span className="text-slate-300 font-medium">
                Autor: <strong className="text-amber-300 font-bold">{todayQuote.author}</strong>
              </span>
            )}
            {todayQuote.theme && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400 font-semibold bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                  {todayQuote.theme}
                </span>
              </>
            )}
          </div>

          {/* Daily Notice */}
          <p className="mt-4 text-[11px] text-slate-400">
            Uma nova frase inspiradora é exibida automaticamente a cada dia para toda a nossa equipe.
          </p>

          <button
            onClick={() => setShowModal(false)}
            className="mt-6 w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer"
          >
            Tenha um excelente dia!
          </button>
        </motion.div>
      </div>
    );
  }
};


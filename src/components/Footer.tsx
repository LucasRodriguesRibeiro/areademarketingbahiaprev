import React from 'react';
import { ShieldCheck, Heart, ArrowUp } from 'lucide-react';

interface FooterProps {
  onScrollToTop: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onScrollToTop }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-8 border-b border-slate-800">
          
          {/* Brand/Logo Area */}
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-mono font-bold text-base">
              M
            </div>
            <div>
              <span className="font-sans font-bold text-white tracking-tight block">
                Área de Marketing
              </span>
              <span className="text-[10px] text-slate-500 tracking-wider block">
                PORTAL DE APOIO AO PARCEIRO
              </span>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
            <span>Informações e materiais de apoio atualizados constantemente.</span>
          </div>

          {/* Scroll to Top button */}
          <button
            onClick={onScrollToTop}
            className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700"
          >
            Voltar ao Topo
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Legal area */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Área de Marketing. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1 justify-center">
            Desenvolvido com <Heart className="h-3 w-3 text-red-500" /> para facilitação de parcerias e convênios.
          </p>
        </div>
      </div>
    </footer>
  );
};

import React from 'react';
import { Heart, ArrowUp, Instagram, Globe, Phone } from 'lucide-react';
import { BahiaPrevLogo } from './BahiaPrevLogo';

interface FooterProps {
  onScrollToTop: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onScrollToTop }) => {
  return (
    <footer className="bg-[#0B132B] text-slate-400 py-16 border-t-4 border-brand-red">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Main Bahia Prev Prominent Hub Block */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 border-b border-slate-800 items-center">
          
          {/* Logo & Intro Area */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <BahiaPrevLogo className="h-20 sm:h-24 w-auto shrink-0 drop-shadow-md" />
            <div>
              <h3 className="font-sans font-extrabold text-white text-lg tracking-tight">
                PREVHUB • BAHIA PREV
              </h3>
              <p className="text-xs text-brand-red font-bold uppercase tracking-wider mt-1">
                Rede de Comunicação Interna &amp; Rede de Credenciados
              </p>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Oferecemos suporte completo aos parceiros e materiais de marketing atualizados. Acesse nossos canais oficiais para dúvidas e novos credenciamentos.
              </p>
            </div>
          </div>

          {/* Quick Stats/Links Divider */}
          <div className="hidden lg:block lg:col-span-1 border-r border-slate-800 h-24 mx-auto" />

          {/* Real Contact channels requested by user */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Instagram Card */}
            <a 
              href="https://instagram.com/planobahiaprev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-[#13224F]/40 hover:bg-[#13224F]/70 border border-slate-800 hover:border-brand-blue p-4 rounded-xl transition-all flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="h-10 w-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
                <Instagram className="h-5 w-5" />
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-3">Instagram</span>
              <span className="text-xs text-white font-semibold mt-1">@planobahiaprev</span>
            </a>

            {/* Website Card */}
            <a 
              href="https://www.bahiaprev.com.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-[#13224F]/40 hover:bg-[#13224F]/70 border border-slate-800 hover:border-brand-blue p-4 rounded-xl transition-all flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Globe className="h-5 w-5" />
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-3">Site Oficial</span>
              <span className="text-xs text-white font-semibold mt-1">bahiaprev.com.br</span>
            </a>

            {/* Phone/WhatsApp Card */}
            <a 
              href="https://wa.me/5574999675899" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-[#13224F]/40 hover:bg-[#13224F]/70 border border-slate-800 hover:border-brand-blue p-4 rounded-xl transition-all flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Phone className="h-5 w-5" />
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-3">WhatsApp</span>
              <span className="text-xs text-white font-semibold mt-1">(74) 99967-5899</span>
            </a>
          </div>

        </div>

        {/* Bottom Area - Scroll to Top */}
        <div className="pt-8 flex justify-center sm:justify-end">
          <button
            onClick={onScrollToTop}
            className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700"
          >
            Voltar ao Topo
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="pt-8 mt-8 border-t border-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-600">
          <p>© {new Date().getFullYear()} Plano Bahia Prev. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Desenvolvido com <Heart className="h-3 w-3 text-brand-red animate-pulse" /> para suporte e apoio de marketing.
          </p>
        </div>

      </div>
    </footer>
  );
};

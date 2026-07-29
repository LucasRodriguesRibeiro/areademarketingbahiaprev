import React, { useState } from 'react';
import { 
  Smartphone, 
  Share, 
  PlusSquare, 
  CheckCircle2, 
  X, 
  ExternalLink,
  ChevronRight,
  Info,
  Apple,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ isOpen, onClose }) => {
  const [activePlatform, setActivePlatform] = useState<'ios' | 'android'>('ios');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative z-10 w-full max-w-lg bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>Instalar App Bahia Prev</span>
                  <span className="text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    PWA Nativo
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Adicione o ícone na tela de início do seu smartphone sem precisar da App Store
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Platform Switcher Tabs */}
          <div className="flex rounded-2xl bg-slate-800/80 p-1 my-5 border border-slate-700/60">
            <button
              type="button"
              onClick={() => setActivePlatform('ios')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activePlatform === 'ios'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Apple className="h-4 w-4" />
              <span>iPhone / iPad (iOS)</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePlatform('android')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activePlatform === 'android'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="h-4 w-4" />
              <span>Android (Samsung/Motorola/etc)</span>
            </button>
          </div>

          {/* iOS Tutorial Content */}
          {activePlatform === 'ios' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-2xl flex items-start gap-2.5 text-blue-200">
                <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  No iPhone, abra este site obrigatoriamente no navegador <strong className="text-white font-bold">Safari</strong> para habilitar o botão de instalação.
                </p>
              </div>

              <div className="space-y-2.5">
                {/* Step 1 */}
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-blue-600 text-white font-black flex items-center justify-center shrink-0 text-xs shadow-md">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span>Toque no botão Compartilhar do Safari</span>
                      <Share className="h-3.5 w-3.5 text-blue-400 inline" />
                    </h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Na barra inferior do Safari no seu iPhone, toque no ícone de um quadrado com uma seta apontando para cima.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-blue-600 text-white font-black flex items-center justify-center shrink-0 text-xs shadow-md">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span>Selecione "Adicionar à Tela de Início"</span>
                      <PlusSquare className="h-3.5 w-3.5 text-emerald-400 inline" />
                    </h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Role o menu de opções para baixo e toque na opção com o símbolo de mais (+).
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-xs shadow-md">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span>Confirme clicando em "Adicionar"</span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 inline" />
                    </h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      No canto superior direito da tela, confirme. O ícone oficial do <strong className="text-white">Bahia Prev Hub</strong> será criado na sua tela inicial!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Android Tutorial Content */}
          {activePlatform === 'android' && (
            <div className="space-y-4 text-xs">
              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-blue-600 text-white font-black flex items-center justify-center shrink-0 text-xs shadow-md">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">Abra no Google Chrome</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      No seu celular Android, abra este site no aplicativo Google Chrome.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-blue-600 text-white font-black flex items-center justify-center shrink-0 text-xs shadow-md">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">Toque nos 3 Pontinhos no canto superior</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Clique no menu do Chrome (⋮) e selecione a opção <strong className="text-white">"Instalar aplicativo"</strong> ou <strong className="text-white">"Adicionar à tela inicial"</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Action */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">
              PWA Tecnologia Web Nativa • Sem custo
            </span>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Entendido!</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

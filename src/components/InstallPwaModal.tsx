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
  Download,
  Zap,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePwaInstall } from '../hooks/usePwaInstall';
import logoAplicativo from '../assets/images/logoaplicativo.png';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ isOpen, onClose }) => {
  const [activePlatform, setActivePlatform] = useState<'ios' | 'android'>('ios');
  const { canInstallNatively, triggerInstall, isInstalled } = usePwaInstall();

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    const ok = await triggerInstall();
    if (ok) {
      onClose();
    }
  };

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
              <div className="h-12 w-12 rounded-2xl bg-slate-950 border border-slate-700/80 p-1 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                <img 
                  src={logoAplicativo || "/logoaplicativo.png"} 
                  alt="Bahia Prev HUB Logo" 
                  className="h-full w-full object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logoaplicativo.png';
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>Instalar Bahia Prev HUB</span>
                  <span className="text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    PWA Nativo
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Adicione o ícone oficial na tela de início do seu smartphone
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

          {/* Instant 1-Click Native Install Callout */}
          {canInstallNatively && (
            <div className="mt-5 p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl border border-blue-400/40 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-3 text-left">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-white">Instalação Direta Disponível!</h4>
                  <p className="text-[11px] text-blue-100">Seu navegador permite instalar o app com 1 clique.</p>
                </div>
              </div>
              <button
                onClick={handleNativeInstall}
                className="w-full sm:w-auto px-5 py-2.5 bg-white text-blue-900 font-black text-xs rounded-xl shadow-lg hover:bg-blue-50 transition-all cursor-pointer shrink-0 flex items-center justify-center gap-2 border border-white/60 active:scale-95"
              >
                <Download className="h-4 w-4 text-blue-700" />
                <span>Instalar Agora em 1 Clique</span>
              </button>
            </div>
          )}

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
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span>Confirme clicando em "Adicionar"</span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 inline" />
                    </h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      No canto superior direito da tela, confirme. O ícone do aplicativo <strong className="text-white font-bold">Bahia Prev HUB</strong> estará na sua tela inicial!
                    </p>
                    <div className="mt-2 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-2.5">
                      <img 
                        src={logoAplicativo || "/logoaplicativo.png"} 
                        alt="Bahia Prev HUB" 
                        className="h-8 w-8 rounded-lg object-contain bg-slate-900 p-0.5 border border-slate-700" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/logoaplicativo.png';
                        }}
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="font-bold text-[11px] text-white">Bahia Prev HUB</div>
                        <div className="text-[9px] text-slate-400">Atalho PWA no iPhone</div>
                      </div>
                    </div>
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
                  <div className="h-7 w-7 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-xs shadow-md">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-xs">Toque nos 3 Pontinhos no canto superior</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Clique no menu do Chrome (⋮) e selecione a opção <strong className="text-white font-bold">"Instalar aplicativo"</strong> ou <strong className="text-white font-bold">"Adicionar à tela inicial"</strong>.
                    </p>
                    <div className="mt-2 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-2.5">
                      <img 
                        src={logoAplicativo || "/logoaplicativo.png"} 
                        alt="Bahia Prev HUB" 
                        className="h-8 w-8 rounded-lg object-contain bg-slate-900 p-0.5 border border-slate-700" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/logoaplicativo.png';
                        }}
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="font-bold text-[11px] text-white">Bahia Prev HUB</div>
                        <div className="text-[9px] text-slate-400">Aplicativo no Android</div>
                      </div>
                    </div>
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

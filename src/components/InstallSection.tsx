import React, { useState } from 'react';
import { 
  Smartphone, 
  Apple, 
  Share, 
  PlusSquare, 
  CheckCircle2, 
  Info, 
  ChevronRight, 
  Sparkles, 
  Layers, 
  ArrowRight,
  Download,
  Globe,
  Compass,
  Laptop,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePwaInstall } from '../hooks/usePwaInstall';
import logoAplicativo from '../assets/images/logoaplicativo.png';

export const InstallSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>('ios');
  const { canInstallNatively, triggerInstall, isInstalled } = usePwaInstall();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-700/80 p-1 flex items-center justify-center shrink-0 shadow-lg overflow-hidden bg-slate-950">
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
              <Smartphone className="h-3.5 w-3.5 text-blue-400" />
              <span>Tutorial de Instalação PWA</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Como Instalar o Bahia Prev HUB no seu Celular
          </h1>

          <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
            Siga o passo a passo simples abaixo para adicionar o ícone do aplicativo diretamente na tela inicial do seu iPhone ou celular Android. Funciona como um aplicativo nativo, sem ocupar espaço na memória.
          </p>

          {canInstallNatively && (
            <div className="mt-5 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl border border-blue-400/40 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Instalar Diretamente em 1 Clique</h3>
                  <p className="text-xs text-blue-100">Seu dispositivo permite instalação direta agora!</p>
                </div>
              </div>
              <button
                onClick={triggerInstall}
                className="w-full sm:w-auto px-6 py-3 bg-white text-blue-950 font-black text-xs sm:text-sm rounded-xl shadow-lg hover:bg-blue-50 transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/60 active:scale-95 shrink-0"
              >
                <Download className="h-4 w-4 text-blue-600" />
                <span>Instalar Aplicativo Agora</span>
              </button>
            </div>
          )}

          {/* Quick Platform Switcher Tabs */}
          <div className="mt-8 inline-flex p-1.5 bg-slate-800/90 rounded-2xl border border-slate-700/80 shadow-lg gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('ios')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Apple className="h-4 w-4" />
              <span>Passo a Passo iPhone (iOS)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Smartphone className="h-4 w-4 text-emerald-400" />
              <span>Passo a Passo Android</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Body for Selected Platform */}
      <AnimatePresence mode="wait">
        {activeTab === 'ios' ? (
          <motion.div
            key="ios"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Safari Alert Card */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-amber-900">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-600">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-amber-900 text-sm flex items-center gap-2">
                  <span>Requisito Importante para iPhone: Use o Navegador Safari</span>
                </h3>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  A Apple exige que a instalação de aplicativos Web no iPhone seja realizada através do navegador padrão <strong className="font-bold">Safari</strong>. Se você estiver abrindo pelo Chrome ou pelo navegador do WhatsApp/Instagram, copie o link e cole diretamente no Safari.
                </p>
              </div>
            </div>

            {/* iOS Step-by-Step Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="h-9 w-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                      1
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                      Navegador Safari
                    </span>
                  </div>

                  <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <Share className="h-6 w-6" />
                  </div>

                  <h3 className="font-black text-slate-900 text-base">
                    Toque em Compartilhar
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Na barra de navegação inferior do Safari no seu iPhone, toque no ícone central de <strong className="text-slate-900 font-bold">Compartilhar</strong> (o quadrado com uma seta para cima).
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <span>Barra inferior do Safari</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="h-9 w-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                      2
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                      Menu de Opções
                    </span>
                  </div>

                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <PlusSquare className="h-6 w-6" />
                  </div>

                  <h3 className="font-black text-slate-900 text-base">
                    "Adicionar à Tela de Início"
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Role a lista de ações para baixo até encontrar a opção <strong className="text-slate-900 font-bold">"Adicionar à Tela de Início"</strong> com o ícone do símbolo de mais (+).
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <span>Opção com ícone de mais (+)</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="h-9 w-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                      3
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Concluído
                    </span>
                  </div>

                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>

                  <h3 className="font-black text-slate-900 text-base">
                    Confirme em "Adicionar"
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    No canto superior direito, toque no botão <strong className="text-slate-900 font-bold">"Adicionar"</strong>. Pronto! O aplicativo Bahia Prev HUB estará pronto na sua tela de início!
                  </p>

                  <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-3 text-white shadow-inner">
                    <img 
                      src={logoAplicativo || "/logoaplicativo.png"} 
                      alt="Bahia Prev HUB" 
                      className="h-10 w-10 rounded-xl object-contain bg-slate-950 p-0.5 border border-slate-700 shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logoaplicativo.png';
                      }}
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="font-extrabold text-xs text-white">Bahia Prev HUB</div>
                      <div className="text-[10px] text-slate-400">Atalho na Tela Inicial (iOS)</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Ícone criado na tela inicial</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="android"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Android Info Card */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-blue-900">
              <div className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-600">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-blue-900 text-sm flex items-center gap-2">
                  <span>Recomendação para Celulares Android: Google Chrome</span>
                </h3>
                <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                  Para uma experiência rápida no Android (Samsung, Motorola, Xiaomi, etc.), abra este site no navegador <strong className="font-bold">Google Chrome</strong>.
                </p>
              </div>
            </div>

            {/* Android Step-by-Step Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Android Step 1 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="h-9 w-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                      1
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                      Menu do Chrome
                    </span>
                  </div>

                  <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <Globe className="h-6 w-6" />
                  </div>

                  <h3 className="font-black text-slate-900 text-base">
                    Toque nos 3 Pontinhos (⋮)
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    No canto superior direito da tela do Google Chrome, toque no botão do menu representado por <strong className="text-slate-900 font-bold">três pontinhos verticais (⋮)</strong>.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-semibold text-slate-400">
                  Canto superior direito do navegador
                </div>
              </div>

              {/* Android Step 2 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="h-9 w-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                      2
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Instalação
                    </span>
                  </div>

                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <Download className="h-6 w-6" />
                  </div>

                  <h3 className="font-black text-slate-900 text-base">
                    Clique em "Instalar Aplicativo"
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Selecione a opção <strong className="text-slate-900 font-bold">"Instalar aplicativo"</strong> ou <strong className="text-slate-900 font-bold">"Adicionar à tela inicial"</strong>. O ícone do Bahia Prev HUB surgirá entre seus apps!
                  </p>

                  <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-3 text-white shadow-inner">
                    <img 
                      src={logoAplicativo || "/logoaplicativo.png"} 
                      alt="Bahia Prev HUB" 
                      className="h-10 w-10 rounded-xl object-contain bg-slate-950 p-0.5 border border-slate-700 shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logoaplicativo.png';
                      }}
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="font-extrabold text-xs text-white">Bahia Prev HUB</div>
                      <div className="text-[10px] text-slate-400">Aplicativo Instalado (Android)</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Aplicativo instalado com sucesso</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Benefits Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <span>Vantagens de Instalar o App no Seu Celular</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h4 className="font-bold text-xs text-slate-900 mb-1">Acesso em 1 Toque</h4>
            <p className="text-[11px] text-slate-600">Abra o sistema direto do ícone na sua tela inicial sem precisar digitar links no navegador.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h4 className="font-bold text-xs text-slate-900 mb-1">Tela Cheia Limpa</h4>
            <p className="text-[11px] text-slate-600">Navegue em modo tela cheia, sem barras de pesquisa atrapalhando a visualização dos módulos.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h4 className="font-bold text-xs text-slate-900 mb-1">Leve e Seguro</h4>
            <p className="text-[11px] text-slate-600">Não ocupa a memória do seu smartphone e se mantém sempre atualizado com a versão mais recente.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

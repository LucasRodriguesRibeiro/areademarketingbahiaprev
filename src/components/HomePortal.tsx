import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Radio, 
  Megaphone, 
  ListTodo, 
  Handshake, 
  BookOpen, 
  Users, 
  Sparkles, 
  ArrowRight,
  Shield,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { BahiaPrevLogo } from './BahiaPrevLogo';

export type TabType = 'home' | 'feed' | 'announcements' | 'pops' | 'marketing' | 'about' | 'members' | 'tasks';

interface HomePortalProps {
  onSelectTab: (tab: TabType) => void;
  onOpenProfileModal: () => void;
}

interface ModuleCard {
  id: TabType;
  title: string;
  badge: string;
  description: string;
  hoverDestination: string;
  icon: React.ElementType;
  iconBg: string;
  borderColor: string;
  hoverGlow: string;
  accentColor: string;
}

const MODULES: ModuleCard[] = [
  {
    id: 'feed',
    title: 'Feed Interativo',
    badge: 'Publicações & Redes',
    description: 'Acompanhe novidades, interaja com postagens e veja as atualizações em tempo real da Bahia Prev.',
    hoverDestination: 'Página do Feed Interativo de Notícias',
    icon: Radio,
    iconBg: 'from-blue-600 to-indigo-600 text-white',
    borderColor: 'border-blue-500/30 hover:border-blue-500',
    hoverGlow: 'hover:shadow-blue-500/20',
    accentColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
  },
  {
    id: 'announcements',
    title: 'Comunicados Oficiais',
    badge: 'Mural da Diretoria',
    description: 'Avisos importantes, diretrizes corporativas, comunicados urgentes e notas da liderança.',
    hoverDestination: 'Página dedicada de Comunicados Oficiais',
    icon: Megaphone,
    iconBg: 'from-amber-500 to-orange-600 text-white',
    borderColor: 'border-amber-500/30 hover:border-amber-500',
    hoverGlow: 'hover:shadow-amber-500/20',
    accentColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
  },
  {
    id: 'tasks',
    title: 'Minhas Tarefas',
    badge: 'Gestão & Demandas',
    description: 'Gerencie prazos, atribuições por colaborador, tarefas de equipe e acompanhe seu progresso.',
    hoverDestination: 'Painel completo de Gestão de Tarefas',
    icon: ListTodo,
    iconBg: 'from-emerald-500 to-teal-600 text-white',
    borderColor: 'border-emerald-500/30 hover:border-emerald-500',
    hoverGlow: 'hover:shadow-emerald-500/20',
    accentColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  },
  {
    id: 'marketing',
    title: 'Área de Marketing',
    badge: 'Mídia & Parceiros',
    description: 'Catálogo de parceiros oficiais, materiais de divulgação, artes institucionais e arquivos de mídia.',
    hoverDestination: 'Página de Materiais e Parceiros de Marketing',
    icon: Handshake,
    iconBg: 'from-purple-600 to-indigo-600 text-white',
    borderColor: 'border-purple-500/30 hover:border-purple-500',
    hoverGlow: 'hover:shadow-purple-500/20',
    accentColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
  },
  {
    id: 'pops',
    title: 'Procedimentos POP',
    badge: 'Normas & Manuais',
    description: 'Acesse o acervo de Procedimentos Operacionais Padrão, manuais de conduta e normas técnicas.',
    hoverDestination: 'Página de Procedimentos Operacionais (POP)',
    icon: BookOpen,
    iconBg: 'from-cyan-500 to-blue-600 text-white',
    borderColor: 'border-cyan-500/30 hover:border-cyan-500',
    hoverGlow: 'hover:shadow-cyan-500/20',
    accentColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
  },
  {
    id: 'members',
    title: 'Nossa Equipe',
    badge: 'Diretório Interno',
    description: 'Conheça todos os colaboradores, cargos, funções, contatos diretos e a estrutura da equipe.',
    hoverDestination: 'Página da Equipe e Organograma Bahia Prev',
    icon: Users,
    iconBg: 'from-rose-500 to-pink-600 text-white',
    borderColor: 'border-rose-500/30 hover:border-rose-500',
    hoverGlow: 'hover:shadow-rose-500/20',
    accentColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
  },
  {
    id: 'about',
    title: 'Sobre a Empresa',
    badge: 'Institucional',
    description: 'História da Bahia Prev, missão, visão, pilares éticos e informações institucionais.',
    hoverDestination: 'Página Institucional Sobre Nós',
    icon: Sparkles,
    iconBg: 'from-amber-400 to-yellow-600 text-white',
    borderColor: 'border-yellow-500/30 hover:border-yellow-500',
    hoverGlow: 'hover:shadow-yellow-500/20',
    accentColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
  }
];

export const HomePortal: React.FC<HomePortalProps> = ({ onSelectTab, onOpenProfileModal }) => {
  const { profile } = useAuth();
  const [hoveredModule, setHoveredModule] = useState<ModuleCard | null>(null);

  return (
    <div className="w-full">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 text-white py-8 sm:py-16 px-3 sm:px-6 lg:px-8 border-b border-slate-800 shadow-2xl">
        {/* Background ambient accents */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-25" />
        <div className="absolute top-0 right-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="mb-3 sm:mb-4"
          >
            <BahiaPrevLogo className="h-14 sm:h-20 lg:h-24 drop-shadow-2xl hover:scale-105 transition-transform cursor-pointer" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-white/10 backdrop-blur-md px-3 sm:px-4 py-1 sm:py-1.5 text-xs font-bold text-white border border-white/15 shadow-lg mb-3 sm:mb-4 max-w-full"
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="tracking-wider uppercase text-[10px] sm:text-[11px] text-blue-300 font-extrabold">Portal do Sistema PrevHub</span>
            <span className="text-white/30 hidden xs:inline">•</span>
            <span className="text-slate-200 font-medium text-[10px] sm:text-xs">Página Inicial</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight max-w-4xl"
          >
            Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300">{profile?.name || 'Colaborador'}</span>!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-2 text-xs sm:text-base text-slate-300 max-w-2xl leading-relaxed font-normal px-2"
          >
            Selecione abaixo o módulo do sistema que você deseja acessar. Cada opção abrirá uma página exclusiva e dedicada com todas as ferramentas e informações.
          </motion.p>

          {/* Active Hover Destination Preview Callout Box */}
          <div className="mt-6 h-12 flex items-center justify-center">
            {hoveredModule ? (
              <motion.div
                key={hoveredModule.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-400/40 text-blue-200 text-xs sm:text-sm font-semibold backdrop-blur-md shadow-lg"
              >
                <ChevronRight className="h-4 w-4 text-blue-400 animate-pulse shrink-0" />
                <span>Destino ao clicar: <strong className="text-white font-bold">{hoveredModule.hoverDestination}</strong></span>
              </motion.div>
            ) : (
              <span className="text-xs text-slate-400/80 font-medium tracking-wide">
                Passe o mouse sobre qualquer módulo para ver o direcionamento detalhado
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Main Grid of Square / Rectangular Module Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="h-6 w-6 text-blue-600" />
              <span>Módulos do Sistema</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Clique em um dos quadrados abaixo para ir diretamente para a página correspondente
            </p>
          </div>
          <span className="hidden sm:inline-block text-xs font-bold text-slate-600 bg-slate-200/80 px-3 py-1.5 rounded-lg border border-slate-300/80">
            {MODULES.length} Páginas Disponíveis
          </span>
        </div>

        {/* Square Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {MODULES.map((mod, index) => {
            const Icon = mod.icon;
            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onMouseEnter={() => setHoveredModule(mod)}
                onMouseLeave={() => setHoveredModule(null)}
                onClick={() => onSelectTab(mod.id)}
                className={`group relative bg-white rounded-2xl p-6 border ${mod.borderColor} shadow-sm hover:shadow-xl ${mod.hoverGlow} transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden min-h-[220px]`}
              >
                {/* Top Card Header */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`h-12 w-12 rounded-2xl bg-gradient-to-tr ${mod.iconBg} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${mod.accentColor} uppercase tracking-wider`}>
                      {mod.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight flex items-center justify-between">
                    <span>{mod.title}</span>
                  </h3>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed font-normal">
                    {mod.description}
                  </p>
                </div>

                {/* Bottom Action Bar inside Card */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                  <span className="text-[11px] font-semibold text-slate-500 group-hover:text-blue-600 transition-colors">
                    Abrir Página
                  </span>
                  <div className="flex items-center gap-1 text-blue-600 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                    <span className="text-[11px] font-extrabold">Acessar</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>

                {/* Subtle Hover Border Highlight */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500/30 rounded-2xl pointer-events-none transition-colors" />
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

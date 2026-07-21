import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, MessageSquare, Megaphone, Handshake, Users, Radio, BookOpen, ListTodo } from 'lucide-react';
import { BahiaPrevLogo } from './BahiaPrevLogo';

interface HeaderProps {
  activeTab: 'feed' | 'announcements' | 'pops' | 'marketing' | 'about' | 'members' | 'tasks';
  onTabChange: (tab: 'feed' | 'announcements' | 'pops' | 'marketing' | 'about' | 'members' | 'tasks') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <header className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 py-10 sm:py-14 text-white border-b border-slate-800 shadow-xl">
      {/* Subtle background grid & glowing blurred shapes */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        {/* Animated Bahia Prev Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <BahiaPrevLogo className="h-20 sm:h-24 drop-shadow-2xl hover:scale-105 transition-transform duration-300 cursor-pointer" />
        </motion.div>

        {/* PrevHub Official Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-white border border-white/15 shadow-lg mb-4"
        >
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="tracking-widest uppercase text-[11px] text-red-400 font-extrabold">PrevHub</span>
          <span className="text-white/30">•</span>
          <span className="text-slate-200 font-medium">Espaço Oficial de Comunicação Interna Bahia Prev</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="font-sans text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight"
        >
          PrevHub • Comunicação Interna Bahia Prev
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-3.5 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal"
        >
          Aprenda sobre a empresa, conheça todos os parceiros, suas funções e acompanhe todos os nossos comunicados.
        </motion.p>

        {/* Navigation Tabs Bar */}
        <div className="mt-8 p-1.5 bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700/80 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 shadow-xl">
          <button
            onClick={() => onTabChange('feed')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'feed'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Radio className="h-4 w-4 text-red-400" />
            <span>Feed</span>
          </button>

          <button
            onClick={() => onTabChange('announcements')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'announcements'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Megaphone className="h-4 w-4 text-amber-400" />
            <span>Comunicados</span>
          </button>

          <button
            onClick={() => onTabChange('marketing')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'marketing'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Handshake className="h-4 w-4 text-emerald-400" />
            <span>Área de Marketing</span>
          </button>

          <button
            onClick={() => onTabChange('about')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'about'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>Sobre Nós</span>
          </button>

          <button
            onClick={() => onTabChange('members')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'members'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Users className="h-4 w-4 text-purple-400" />
            <span>Equipe</span>
          </button>

          <button
            onClick={() => onTabChange('tasks')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <ListTodo className="h-4 w-4 text-emerald-400" />
            <span>Minhas Tarefas</span>
          </button>

          <button
            onClick={() => onTabChange('pops')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'pops'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <BookOpen className="h-4 w-4 text-cyan-400" />
            <span>Acessar POP</span>
          </button>
        </div>

      </div>
    </header>
  );
};




import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Megaphone, Handshake, Users, Radio, BookOpen, ListTodo, ArrowLeft, Home, Layers } from 'lucide-react';
import { BahiaPrevLogo } from './BahiaPrevLogo';

export type TabType = 'home' | 'feed' | 'announcements' | 'pops' | 'marketing' | 'about' | 'members' | 'tasks';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TAB_NAMES: Record<TabType, { name: string; icon: React.ElementType; color: string }> = {
  home: { name: 'Página Inicial', icon: Home, color: 'text-blue-400' },
  feed: { name: 'Feed Interativo', icon: Radio, color: 'text-red-400' },
  announcements: { name: 'Comunicados Oficiais', icon: Megaphone, color: 'text-amber-400' },
  tasks: { name: 'Minhas Tarefas', icon: ListTodo, color: 'text-emerald-400' },
  marketing: { name: 'Área de Marketing', icon: Handshake, color: 'text-purple-400' },
  pops: { name: 'Procedimentos POP', icon: BookOpen, color: 'text-cyan-400' },
  members: { name: 'Nossa Equipe', icon: Users, color: 'text-rose-400' },
  about: { name: 'Sobre Nós', icon: Sparkles, color: 'text-yellow-400' },
};

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  // When activeTab is 'home', the HomePortal component is rendered in the main body.
  if (activeTab === 'home') {
    return null; // HomePortal handles the hero header for Home
  }

  const currentTabInfo = TAB_NAMES[activeTab] || TAB_NAMES.feed;
  const Icon = currentTabInfo.icon;

  return (
    <header className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 py-4 sm:py-6 px-3 sm:px-6 lg:px-8 text-white border-b border-slate-800 shadow-xl">
      {/* Subtle background grid */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20" />

      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
        
        {/* Left: Voltar à Página Inicial + Breadcrumb & Logo */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
          {/* Voltar Botão */}
          <button
            onClick={() => onTabChange('home')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 border border-blue-400/30 group w-full sm:w-auto"
            title="Voltar para a Página Inicial (Menu com Módulos em Quadrados)"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span>← Voltar para Página Inicial</span>
          </button>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Logo & Current Page Breadcrumb */}
          <div className="flex items-center gap-3">
            <div onClick={() => onTabChange('home')} className="cursor-pointer shrink-0">
              <BahiaPrevLogo className="h-8 sm:h-10 w-auto hover:opacity-90 transition-opacity" />
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <span 
                  onClick={() => onTabChange('home')}
                  className="hover:text-blue-300 cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                >
                  <Home className="h-3 w-3" />
                  Início
                </span>
                <span>/</span>
                <span className="text-slate-200 font-semibold truncate">{currentTabInfo.name}</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 truncate">
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${currentTabInfo.color} shrink-0`} />
                <span className="truncate">{currentTabInfo.name}</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Right: Quick Page Navigation Switcher */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => onTabChange('feed')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'feed'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Radio className="h-3.5 w-3.5 text-red-400" />
            <span>Feed</span>
          </button>

          <button
            onClick={() => onTabChange('announcements')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'announcements'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Megaphone className="h-3.5 w-3.5 text-amber-400" />
            <span>Comunicados</span>
          </button>

          <button
            onClick={() => onTabChange('tasks')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ListTodo className="h-3.5 w-3.5 text-emerald-400" />
            <span>Tarefas</span>
          </button>

          <button
            onClick={() => onTabChange('marketing')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'marketing'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Handshake className="h-3.5 w-3.5 text-purple-400" />
            <span>Marketing</span>
          </button>

          <button
            onClick={() => onTabChange('pops')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pops'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
            <span>POP</span>
          </button>

          <button
            onClick={() => onTabChange('members')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'members'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-rose-400" />
            <span>Equipe</span>
          </button>

          <button
            onClick={() => onTabChange('about')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'about'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
            <span>Sobre</span>
          </button>
        </div>

      </div>
    </header>
  );
};





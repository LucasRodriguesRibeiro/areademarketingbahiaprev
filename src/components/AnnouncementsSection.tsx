import React, { useState } from 'react';
import { Megaphone, Pin, AlertCircle, Sparkles, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface AnnouncementItem {
  id: string;
  title: string;
  category: string;
  date: string;
  author: string;
  content: string;
  urgent?: boolean;
}

const OFFICIAL_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: '1',
    title: 'Lançamento Oficial da Rede PrevHub para Colaboradores',
    category: 'Comunicação Interna',
    date: 'Hoje, 10:00',
    author: 'Diretoria & Marketing Bahia Prev',
    content: 'É com grande alegria que apresentamos a plataforma PrevHub! Este espaço foi desenvolvido para unificar nossa comunicação, facilitar a troca de ideias entre os setores e disponibilizar rapidamente os benefícios e materiais da rede credenciada.',
    urgent: true
  },
  {
    id: '2',
    title: 'Atualização da Rede Credenciada do Plano Bahia Prev',
    category: 'Credenciamento & Convênios',
    date: 'Ontem, 16:30',
    author: 'Gestão de Parcerias',
    content: 'Incluímos novos parceiros nos segmentos de bem-estar e estandes de saúde em Salvador e Feira de Santana. Confira a lista completa e as taxas de desconto atualizadas na aba de Parceiros.',
    urgent: false
  },
  {
    id: '3',
    title: 'Download de Materiais Promocionais e Templates Oficiais',
    category: 'Marketing',
    date: '18 Julho, 14:00',
    author: 'Lucas • Marketing',
    content: 'Todos os banners de mídia social para divulgação do convênio em farmácias parceiras foram atualizados com o novo padrão visual. Faça o download diretamente pelo portal.',
    urgent: false
  }
];

export const AnnouncementsSection: React.FC = () => {
  const [announcements] = useState<AnnouncementItem[]>(OFFICIAL_ANNOUNCEMENTS);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Hero Banner for Announcements */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold mb-4">
            <Megaphone className="h-3.5 w-3.5 text-red-400" />
            <span>COMUNICADOS OFICIAIS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Informa com Transparência e Rapidez
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Mantenha-se atualizado com os avisos da diretoria, novos alinhamentos do plano de apoio e direcionamentos da equipe do Bahia Prev.
          </p>
        </div>
      </div>

      {/* Announcements List */}
      <div className="grid grid-cols-1 gap-4">
        {announcements.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-2xl p-6 border transition-all ${
              item.urgent
                ? 'border-red-200 bg-gradient-to-r from-red-50/30 via-white to-white shadow-sm'
                : 'border-slate-200/80 shadow-sm'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                  {item.category}
                </span>
                {item.urgent && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-red-100 text-red-700 flex items-center gap-1">
                    <Pin className="h-3 w-3" /> Destaque
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 font-medium">{item.date} • por {item.author}</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{item.content}</p>
          </motion.div>
        ))}
      </div>

    </div>
  );
};

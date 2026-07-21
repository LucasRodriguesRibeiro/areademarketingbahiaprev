import React from 'react';
import { FileText, BookOpen, Download, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const PopsSection: React.FC = () => {
  const handleDownloadPdf = () => {
    // Generate simulated download or view alert
    alert("Iniciando o download do arquivo fictício: 'POP_Manual_do_Colaborador_Bahia_Prev.pdf'. Este documento estará disponível para estudo dos colaboradores.");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Hero Header Box */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold mb-4">
            <BookOpen className="h-4 w-4 text-cyan-400" />
            <span>CENTRAL DE ESTUDO & POP</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Acessar POP (Procedimento Operacional Padrão)
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Consulte a definição técnica de um POP e baixe o material de estudo oficial para colaboradores do Bahia Prev.
          </p>
        </div>
      </div>

      {/* Explanation Box: What is a POP? */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">O que é um POP?</h3>
            <p className="text-xs text-slate-500">Procedimento Operacional Padrão • Guia Interno</p>
          </div>
        </div>

        <p className="text-slate-700 text-sm leading-relaxed">
          O <strong>POP (Procedimento Operacional Padrão)</strong> é um documento instrucional roteirizado que descreve detalhadamente cada etapa de uma atividade diária ou processo na empresa. Ele serve como um guia obrigatório de consulta e estudo para garantir que todas as rotinas do <strong>Bahia Prev</strong> mantenham o mesmo padrão de excelência, clareza, eficiência e segurança no atendimento aos nossos associados e parceiros.
        </p>

        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Padronização das atividades diárias</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Material de estudo e treinamento contínuo</span>
          </div>
        </div>
      </motion.div>

      {/* Fictional PDF Download Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
      >
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0">
            <FileText className="h-7 w-7" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-extrabold mb-1">
              ARQUIVO PDF FICTÍCIO DE ESTUDO
            </div>
            <h4 className="font-bold text-slate-900 text-base leading-snug">
              POP - Manual do Colaborador e Procedimentos Operacionais.pdf
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Tamanho: 2.4 MB • Versão 2026.1 • Bahia Prev Oficial
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadPdf}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>Baixar POP para Estudo</span>
        </button>
      </motion.div>

    </div>
  );
};

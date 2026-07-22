import React from 'react';
import { Building2, HeartHandshake, ShieldCheck, Award, Target, Compass, Users, CheckCircle, FileText, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

export const AboutCompanySection: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Hero Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold mb-4">
            <Building2 className="h-4 w-4 text-blue-400" />
            <span>SOBRE O BAHIA PREV</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Aprenda sobre o Bahia Prev
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            O Bahia Prev é a solução completa de amparo familiar, proteção e benefícios em saúde para milhares de famílias na Bahia. Fundado com o compromisso de entregar dignidade, respeito e agilidade, nosso plano se destaca pela excelência na assistência e pela forte rede credenciada de parceiros.
          </p>
        </div>
      </div>

      {/* Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Nossa Missão</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Proporcionar tranquilidade e segurança continuada para as famílias baianas através de um plano assistencial humano, acessível e de altíssima qualidade em momentos decisivos.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
          <div className="h-12 w-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
            <Compass className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Nossos Valores</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Empatia nas relações, transparência nos convênios, ética nos serviços e compromisso incondicional com o bem-estar dos nossos associados e parceiros.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Diferencial do Plano</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Rede de descontos em consultas médicas, exames, farmácias, clínicas odontológicas e suporte funerário 24 horas em todo o estado da Bahia.
          </p>
        </div>

      </div>

      {/* Detailed Information & Key Figures */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-blue-600" />
          <span>Estrutura e Atuação do Bahia Prev</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600 leading-relaxed">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block">Atendimento Humanizado 24 Horas</strong>
                Equipe treinada para prestar suporte rápido e acolhedor a qualquer hora do dia ou da noite.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block">Rede Credenciada Expandida</strong>
                Mais de 100 parceiros em saúde, óticas, clínicas de imagem, laboratórios e odontologia.
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block">Suporte ao Colaborador no Bahia Prev Hub</strong>
                O Bahia Prev Hub permite que todos os membros da nossa equipe acompanhem informativos, consultem materiais de apoio e alinhem demandas de marketing e atendimento em tempo real.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block">Portal do Credenciado & Materiais</strong>
                Acesso direto a cupons de desconto, mídias de divulgação e fichas de parceiros para agilizar os atendimentos da ponta.
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

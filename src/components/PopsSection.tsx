import React, { useState } from 'react';
import { 
  FileText, 
  BookOpen, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  Search, 
  Tag, 
  Eye, 
  X, 
  Building2, 
  Megaphone, 
  UserCheck, 
  Briefcase, 
  Sparkles,
  ChevronRight,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthContext';

export interface PopItem {
  id: string;
  code: string;
  title: string;
  category: 'institucional' | 'marketing' | 'atendimento' | 'convenios' | 'administracao';
  categoryLabel: string;
  targetRole: string; // e.g. "Todos os Colaboradores", "Analista de Marketing", "Direção"
  description: string;
  version: string;
  updatedAt: string;
  fileSize: string;
  steps: string[];
  importance: string;
}

export const PopsSection: React.FC = () => {
  const { profile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [activePopModal, setActivePopModal] = useState<PopItem | null>(null);

  const userRole = profile?.role || 'Colaborador';

  // Catalog of POPs covering institutional, marketing, customer support, partnerships, and administration
  const POPS_DATA: PopItem[] = [
    {
      id: 'pop-01',
      code: 'POP-INST-001',
      title: 'Sobre Nós, Cultura e Valores do Bahia Prev',
      category: 'institucional',
      categoryLabel: 'Sobre Nós & Institucional',
      targetRole: 'Todos os Colaboradores',
      description: 'Guia fundamental de integração institucional sobre a história, missão, visão e compromisso social do Bahia Prev.',
      version: '2026.1',
      updatedAt: '15/01/2026',
      fileSize: '1.8 MB',
      importance: 'Obrigatório para integração e alinhamento da cultura empresarial.',
      steps: [
        'Leitura e assimilação do propósito institucional e pilares do Bahia Prev.',
        'Respeito às diretrizes de convivência e inclusão no ambiente corporativo.',
        'Atendimento humanizado alinhado aos valores e ética da instituição.',
        'Uso responsável dos canais internos de comunicação (PrevHub).'
      ]
    },
    {
      id: 'pop-02',
      code: 'POP-INST-002',
      title: 'Código de Conduta e Proteção de Dados (LGPD)',
      category: 'institucional',
      categoryLabel: 'Sobre Nós & Institucional',
      targetRole: 'Todos os Colaboradores',
      description: 'Normas de conduta ética, confidencialidade no manuseio de dados de associados e segurança da informação.',
      version: '2026.1',
      updatedAt: '10/02/2026',
      fileSize: '2.1 MB',
      importance: 'Garante conformidade com as leis de proteção de dados vigentes.',
      steps: [
        'Manter senhas e credenciais de acesso ao portal em caráter estritamente pessoal.',
        'Garantir sigilo absoluto sobre informações cadastrais de associados.',
        'Comunicar imediatamente ao suporte qualquer suspeita de vulnerabilidade ou acesso indevido.'
      ]
    },
    {
      id: 'pop-03',
      code: 'POP-MKT-001',
      title: 'Uso da Marca e Identidade Visual Bahia Prev',
      category: 'marketing',
      categoryLabel: 'Área de Marketing',
      targetRole: 'Analista de Marketing / Comunicação',
      description: 'Diretrizes técnicas para aplicação da logomarca, paleta de cores (Azul/Vermelho/Dourado) e tipografia oficial.',
      version: '2026.2',
      updatedAt: '01/03/2026',
      fileSize: '4.5 MB',
      importance: 'Padroniza todas as artes, banners e materiais promocionais.',
      steps: [
        'Utilizar exclusivamente o vetor oficial da logomarca fornecido na Central de Marketing.',
        'Respeitar a área de respiro mínima ao redor do selo do Bahia Prev.',
        'Aplicar as cores institucionais em RGB/CMYK conforme código exato da marca.',
        'Aprovar artes promocionais com a coordenação de marketing antes da distribuição pública.'
      ]
    },
    {
      id: 'pop-04',
      code: 'POP-MKT-002',
      title: 'Divulgação de Parceiros e Postagens no Feed Interno',
      category: 'marketing',
      categoryLabel: 'Área de Marketing',
      targetRole: 'Analista de Marketing / Comunicação',
      description: 'Roteiro para criação e publicação de comunicados, banners de convênio e novidades do clube de benefícios.',
      version: '2026.1',
      updatedAt: '20/02/2026',
      fileSize: '3.0 MB',
      importance: 'Garante o correto destaque e visibilidade das parcerias ativas.',
      steps: [
        'Verificar se o convênio parceiro possui contrato ativo antes da divulgação.',
        'Incluir regras de desconto claras, telefones de contato e imagens em alta definição.',
        'Destacar a vantagem exclusiva para o associado no texto do comunicado.'
      ]
    },
    {
      id: 'pop-05',
      code: 'POP-ATEND-001',
      title: 'Padrão de Atendimento e Suporte ao Associado',
      category: 'atendimento',
      categoryLabel: 'Atendimento ao Cliente',
      targetRole: 'Consultor de Relacionamento',
      description: 'Fluxo padronizado para recepção, resolução de dúvidas e direcionamento de solicitações de previdência e benefícios.',
      version: '2026.1',
      updatedAt: '05/01/2026',
      fileSize: '1.5 MB',
      importance: 'Assegura satisfação e índice elevado de resolutividade no primeiro contato.',
      steps: [
        'Acolher o associado de forma cordial utilizando a saudação padrão Bahia Prev.',
        'Identificar a demanda com escuta ativa e verificar o status cadastral.',
        'Fornecer informações precisas sobre parcerias, convênios e regulamentos.',
        'Registrar o atendimento no histórico com detalhamento do encaminhamento.'
      ]
    },
    {
      id: 'pop-06',
      code: 'POP-CONV-001',
      title: 'Prospecção e Credenciamento de Novos Convênios',
      category: 'convenios',
      categoryLabel: 'Gestão de Convênios',
      targetRole: 'Coordenador de Parcerias',
      description: 'Etapas de negociação, coleta de documentação e validação de empresas e estabelecimentos parceiros.',
      version: '2026.1',
      updatedAt: '12/01/2026',
      fileSize: '2.8 MB',
      importance: 'Expande o ecossistema de benefícios mantendo rigor contratual.',
      steps: [
        'Apresentar a proposta comercial de parceria aos estabelecimentos alvo.',
        'Solicitar ficha cadastral, contrato social e oferta de percentual de desconto exclusivo.',
        'Encaminhar minuta de convênio para validação jurídica do Bahia Prev.',
        'Cadastrar os dados da nova parceria no portal para publicação pelo Marketing.'
      ]
    },
    {
      id: 'pop-07',
      code: 'POP-ADM-001',
      title: 'Governança e Administração do Portal PrevHub',
      category: 'administracao',
      categoryLabel: 'Administração Geral',
      targetRole: 'Administrador do Sistema / Direção',
      description: 'Procedimentos para concessão de permissões, auditoria de acessos e moderação de conteúdos.',
      version: '2026.2',
      updatedAt: '18/02/2026',
      fileSize: '2.0 MB',
      importance: 'Mantém a integridade e governança de todo o ecossistema do portal.',
      steps: [
        'Validar novos cadastros de colaboradores antes de autorizar nivelamento de privilégios.',
        'Revisar periodicamente as publicações e relatórios de métricas do sistema.',
        'Manter atualizado o diretório oficial de membros e diretores.'
      ]
    }
  ];

  // Helper to check if POP matches user's role
  const isRoleMatch = (pop: PopItem) => {
    if (pop.targetRole === 'Todos os Colaboradores') return true;
    const cleanUserRole = userRole.toLowerCase();
    const cleanTarget = pop.targetRole.toLowerCase();
    return cleanUserRole.includes('admin') || 
           cleanTarget.includes(cleanUserRole) || 
           cleanUserRole.includes(cleanTarget) ||
           (cleanUserRole.includes('marketing') && pop.category === 'marketing') ||
           (cleanUserRole.includes('diretor') && (pop.category === 'administracao' || pop.category === 'institucional'));
  };

  // Filtered POP list
  const filteredPops = POPS_DATA.filter((pop) => {
    const matchesCategory = 
      selectedCategory === 'todos' || 
      (selectedCategory === 'seu-cargo' && isRoleMatch(pop)) ||
      pop.category === selectedCategory;

    const matchesSearch = 
      pop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pop.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pop.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pop.targetRole.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const handleDownloadPdf = (pop: PopItem) => {
    alert(`Iniciando o download do documento oficial:\n\n${pop.code} - ${pop.title}.pdf\n\nTamanho: ${pop.fileSize} • Versão: ${pop.version}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Hero Header Box */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold">
            <BookOpen className="h-4 w-4 text-cyan-400" />
            <span>CENTRAL DE POPs & MANUAIS OPERACIONAIS</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Procedimentos Operacionais Padrão (POP)
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed">
            Consulte o acervo de instruções técnicas, normas institucionais ("Sobre Nós") e rotinas específicas para a sua área e cargo no Bahia Prev.
          </p>

          {/* Personalized User Cargo Greeting */}
          <div className="pt-2 flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 flex items-center gap-2 text-xs font-bold text-white">
              <UserCheck className="h-4 w-4 text-emerald-400" />
              <span>Seu Cargo Atual: <strong className="text-cyan-300">{userRole}</strong></span>
            </div>
          </div>
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
            <h3 className="text-lg font-bold text-slate-900">O que é um POP no Bahia Prev?</h3>
            <p className="text-xs text-slate-500">Procedimento Operacional Padrão • Guia Interno por Cargo e Setor</p>
          </div>
        </div>

        <p className="text-slate-700 text-sm leading-relaxed">
          O <strong>POP (Procedimento Operacional Padrão)</strong> é um documento instrucional que descreve em detalhes cada etapa das atividades diárias. Ele serve para alinhar a equipe sobre os valores institucionais (<strong>Sobre Nós</strong>), diretrizes da <strong>Área de Marketing</strong>, atendimento e processos administrativos, assegurando padronização e excelência.
        </p>

        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Padronização e Segurança das Operações</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Guia Direcionado por Cargo e Função</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Capacitação e Estudo Contínuo</span>
          </div>
        </div>
      </motion.div>

      {/* Search & Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, código (ex: POP-MKT), palavra-chave..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Quick Counter */}
          <div className="text-xs text-slate-500 font-bold self-center">
            {filteredPops.length} {filteredPops.length === 1 ? 'documento encontrado' : 'documentos encontrados'}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('todos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'todos'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Todos os POPs
          </button>

          <button
            onClick={() => setSelectedCategory('seu-cargo')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'seu-cargo'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-blue-700 hover:bg-blue-50'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Específicos para o seu Cargo ({userRole})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('institucional')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'institucional'
                ? 'bg-purple-700 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-purple-700 hover:bg-purple-50'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Sobre Nós (Institucional)</span>
          </button>

          <button
            onClick={() => setSelectedCategory('marketing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'marketing'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-amber-700 hover:bg-amber-50'
            }`}
          >
            <Megaphone className="h-3.5 w-3.5" />
            <span>Área de Marketing</span>
          </button>

          <button
            onClick={() => setSelectedCategory('atendimento')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'atendimento'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Atendimento</span>
          </button>

          <button
            onClick={() => setSelectedCategory('convenios')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'convenios'
                ? 'bg-cyan-700 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-cyan-700 hover:bg-cyan-50'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Convênios</span>
          </button>
        </div>
      </div>

      {/* POP Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPops.map((pop) => {
          const matchedRole = isRoleMatch(pop);

          return (
            <motion.div
              key={pop.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`bg-white rounded-2xl p-6 border transition-all flex flex-col justify-between space-y-4 relative ${
                matchedRole 
                  ? 'border-blue-300 ring-2 ring-blue-500/10 shadow-md' 
                  : 'border-slate-200/80 shadow-sm hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                {/* Header Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                      {pop.code}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {pop.categoryLabel}
                    </span>
                  </div>

                  {matchedRole && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      <span>Específico para Você</span>
                    </span>
                  )}
                </div>

                {/* Title & Target Role */}
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 leading-snug hover:text-blue-600 transition-colors">
                    {pop.title}
                  </h4>
                  <p className="text-xs font-semibold text-blue-600 mt-1 flex items-center gap-1">
                    <Briefcase className="h-3 w-3 text-blue-400 shrink-0" />
                    <span>Público-Alvo: {pop.targetRole}</span>
                  </p>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {pop.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  {pop.fileSize} • v{pop.version}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActivePopModal(pop)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Visualizar</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(pop)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Baixar PDF</span>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredPops.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <FileText className="h-10 w-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-800 text-base">Nenhum POP encontrado</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tente buscar com outros termos ou altere o filtro de categoria selecionado.
          </p>
          <button
            onClick={() => { setSelectedCategory('todos'); setSearchTerm(''); }}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
          >
            Limpar Filtros
          </button>
        </div>
      )}

      {/* POP Detail Modal */}
      <AnimatePresence>
        {activePopModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl border border-slate-200/80 relative space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                      {activePopModal.code}
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">
                      {activePopModal.categoryLabel}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 leading-snug">
                    {activePopModal.title}
                  </h3>
                  <p className="text-xs font-bold text-blue-600 mt-1">
                    Cargo / Função Destino: {activePopModal.targetRole}
                  </p>
                </div>

                <button
                  onClick={() => setActivePopModal(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Description & Importance */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <strong className="text-slate-900 block font-bold mb-1">Descrição do Procedimento:</strong>
                  <p className="text-slate-700 leading-relaxed">{activePopModal.description}</p>
                </div>
                <div>
                  <strong className="text-slate-900 block font-bold mb-1">Importância Estratégica:</strong>
                  <p className="text-slate-700 leading-relaxed">{activePopModal.importance}</p>
                </div>
              </div>

              {/* Procedural Steps */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Etapas e Roteiro de Execução:
                </h4>
                <div className="space-y-2">
                  {activePopModal.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-800">
                      <span className="h-5 w-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer Info & Download */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-[11px] text-slate-400">
                  Versão {activePopModal.version} • Atualizado em {activePopModal.updatedAt} • {activePopModal.fileSize}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setActivePopModal(null)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(activePopModal)}
                    className="flex-1 sm:flex-initial px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Baixar POP em PDF</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  BookOpen, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  Search, 
  Eye, 
  X, 
  Building2, 
  Megaphone, 
  UserCheck, 
  Briefcase, 
  Sparkles,
  Plus,
  Trash2,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';

export interface PopItem {
  id: string;
  code: string;
  title: string;
  category: 'institucional' | 'marketing' | 'atendimento' | 'convenios' | 'administracao';
  categoryLabel: string;
  targetRole: string;
  description: string;
  version: string;
  updatedAt: string;
  fileSize: string;
  steps: string[];
  importance: string;
  createdAt?: any;
}

export const PopsSection: React.FC = () => {
  const { profile } = useAuth();
  const [pops, setPops] = useState<PopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('seu-cargo');
  const [searchTerm, setSearchTerm] = useState('');
  const [activePopModal, setActivePopModal] = useState<PopItem | null>(null);

  // New POP Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('POP-2026-001');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'institucional' | 'marketing' | 'atendimento' | 'convenios' | 'administracao'>('institucional');
  const [newTargetRole, setNewTargetRole] = useState('Todos os Colaboradores');
  const [newDescription, setNewDescription] = useState('');
  const [newVersion, setNewVersion] = useState('2026.1');
  const [newImportance, setNewImportance] = useState('Garante padronização e qualidade nas rotinas operacionais.');
  const [newStepsText, setNewStepsText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const userRole = profile?.role || 'Colaborador';
  const canManage = 
    profile?.role === 'Administrador' || 
    profile?.role === 'Diretor' || 
    profile?.email === 'marketing@bahiaprev.com.br' || 
    profile?.email === 'lucasrodrigues@bahiaprev.com.br' || 
    profile?.email === 'jairoqueiroz@bahiaprev.com.br';

  useEffect(() => {
    const q = query(collection(db, 'pops'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: PopItem[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as PopItem[];
      setPops(items);
      setLoading(false);
    }, (err) => {
      console.warn('Error fetching POPs:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'institucional': return 'Sobre Nós & Institucional';
      case 'marketing': return 'Área de Marketing';
      case 'atendimento': return 'Atendimento ao Cliente';
      case 'convenios': return 'Gestão de Convênios';
      case 'administracao': return 'Administração Geral';
      default: return 'Geral';
    }
  };

  const handleCreatePop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    setSubmitting(true);
    try {
      const stepsList = newStepsText
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const now = new Date();
      const dateFormatted = now.toLocaleDateString('pt-BR');

      await addDoc(collection(db, 'pops'), {
        code: newCode.trim().toUpperCase() || 'POP-2026-001',
        title: newTitle.trim(),
        category: newCategory,
        categoryLabel: getCategoryLabel(newCategory),
        targetRole: newTargetRole.trim() || 'Todos os Colaboradores',
        description: newDescription.trim(),
        version: newVersion.trim() || '2026.1',
        updatedAt: dateFormatted,
        fileSize: '1.5 MB',
        steps: stepsList.length > 0 ? stepsList : ['Seguir as orientações técnicas e normas vigentes.'],
        importance: newImportance.trim(),
        createdAt: serverTimestamp()
      });

      setNewTitle('');
      setNewDescription('');
      setNewStepsText('');
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error creating POP:', err);
      alert('Erro ao cadastrar POP. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePop = async (id: string) => {
    if (!confirm('Deseja realmente excluir este Procedimento Operacional Padrão (POP)?')) return;
    try {
      await deleteDoc(doc(db, 'pops', id));
    } catch (err) {
      console.error('Error deleting POP:', err);
    }
  };

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
  const filteredPops = pops.filter((pop) => {
    const matchesCategory = 
      selectedCategory === 'todos' || 
      (selectedCategory === 'seu-cargo' && isRoleMatch(pop)) ||
      pop.category === selectedCategory;

    const matchesSearch = 
      pop.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pop.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pop.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pop.targetRole?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const handleDownloadPdf = (pop: PopItem) => {
    alert(`Iniciando o download do documento oficial:\n\n${pop.code} - ${pop.title}.pdf\n\nTamanho: ${pop.fileSize} • Versão: ${pop.version}`);
  };

  const handleDownloadMainPop = () => {
    const rolePop = pops.find(p => p.targetRole?.toLowerCase() === userRole.toLowerCase()) || pops[0];
    if (rolePop) {
      handleDownloadPdf(rolePop);
    } else {
      alert(`Iniciando o download do POP do Cargo:\n\nManual_POP_${userRole.replace(/\s+/g, '_')}.pdf\n\nTamanho: 1.2 MB • Versão: 1.0 (Bahia Prev)`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Hero Header Box */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Procedimentos Operacionais Padrão (POP)
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed">
            Consulte os Procedimentos Operacionais Padrão (POP) específicos e direcionados para a função individual do seu cargo no Bahia Prev.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleDownloadMainPop}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer border border-emerald-400/30 shrink-0"
            title="Baixar POP do seu cargo"
          >
            <Download className="h-4 w-4" />
            <span>Baixar POP</span>
          </button>
        </div>
      </div>

      {/* POP Cards Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
          <div className="h-8 w-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Carregando procedimentos operacionais...</p>
        </div>
      ) : filteredPops.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Nenhum POP cadastrado para o cargo: {userRole}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Os Procedimentos Operacionais Padrão direcionados para a função de <strong className="text-slate-700">{userRole}</strong> cadastrados pelos administradores estarão disponíveis nesta central.
          </p>
        </div>
      ) : (
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

                    <div className="flex items-center gap-1.5">
                      {matchedRole && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Sparkles className="h-3 w-3 text-amber-500" />
                          <span>Específico para Você</span>
                        </span>
                      )}
                      {canManage && (
                        <button
                          onClick={() => handleDeletePop(pop.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                          title="Excluir POP"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
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
                    {pop.fileSize || '1.5 MB'} • v{pop.version || '2026.1'}
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
      )}

      {/* POP Detail Modal */}
      <AnimatePresence>
        {activePopModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl relative space-y-6"
            >
              {/* Close Button */}
              <button
                onClick={() => setActivePopModal(null)}
                className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                    {activePopModal.code}
                  </span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {activePopModal.categoryLabel}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                  {activePopModal.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Cargo Alvo: <strong className="text-slate-800">{activePopModal.targetRole}</strong> • Versão: {activePopModal.version} • Atualizado em {activePopModal.updatedAt}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Objetivo & Descrição</span>
                <p className="text-xs text-slate-700 leading-relaxed">{activePopModal.description}</p>
              </div>

              {activePopModal.importance && (
                <div className="bg-amber-50/60 border border-amber-200/60 p-4 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold mb-0.5">Importância do Cumprimento:</strong>
                    {activePopModal.importance}
                  </div>
                </div>
              )}

              {/* Step-by-step list */}
              {activePopModal.steps && activePopModal.steps.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>Passo a Passo Operacional:</span>
                  </h4>
                  <div className="space-y-2">
                    {activePopModal.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-2xs text-xs text-slate-700">
                        <span className="h-5 w-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setActivePopModal(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  onClick={() => handleDownloadPdf(activePopModal)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar Documento em PDF</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal for Creating New POP */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl relative space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Novo POP / Manual Operacional</h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePop} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Código (POP-XXX)</label>
                    <input
                      type="text"
                      required
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      placeholder="Ex: POP-MKT-001"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                    <select
                      value={newCategory}
                      onChange={(e: any) => setNewCategory(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                    >
                      <option value="institucional">Sobre Nós & Institucional</option>
                      <option value="marketing">Área de Marketing</option>
                      <option value="atendimento">Atendimento ao Cliente</option>
                      <option value="convenios">Gestão de Convênios</option>
                      <option value="administracao">Administração Geral</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Título do Procedimento *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Atendimento ao Cliente e Validação de Convênios"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cargo / Público-Alvo</label>
                    <input
                      type="text"
                      value={newTargetRole}
                      onChange={(e) => setNewTargetRole(e.target.value)}
                      placeholder="Ex: Analista de Marketing, Todos..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Versão</label>
                    <input
                      type="text"
                      value={newVersion}
                      onChange={(e) => setNewVersion(e.target.value)}
                      placeholder="Ex: 2026.1"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Descrição Curta *</label>
                  <textarea
                    rows={3}
                    required
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Resumo do objetivo do procedimento operacional..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Passo a Passo (uma etapa por linha)</label>
                  <textarea
                    rows={4}
                    value={newStepsText}
                    onChange={(e) => setNewStepsText(e.target.value)}
                    placeholder="Passo 1: Receber o cliente...&#10;Passo 2: Verificar cadastro no sistema...&#10;Passo 3: Concluir atendimento..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span>{submitting ? 'Cadastrando...' : 'Cadastrar POP'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

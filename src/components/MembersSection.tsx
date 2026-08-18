import React, { useState, useEffect } from 'react';
import { supabaseService } from '../lib/supabaseService';
import { Users, Mail, CheckCircle2, Search, Briefcase, Camera, Edit3, Shield, Check, X, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from './AuthContext';
import { formatUserName } from '../utils/userNameFormatter';

interface MemberProfile {
  uid: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  createdAt?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface MembersSectionProps {
  onOpenProfileModal?: () => void;
}

export const MembersSection: React.FC<MembersSectionProps> = ({ onOpenProfileModal }) => {
  const { user, profile, updateUserProfile, allUsers, fetchUsers } = useAuth();
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers().catch(() => {});
  }, []);

  // Modal for editing collaborator cargo
  const [editingMember, setEditingMember] = useState<MemberProfile | null>(null);
  const [newRoleInput, setNewRoleInput] = useState('');
  const [savingRole, setSavingRole] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Check if current user can edit roles
  const canManageRoles = profile?.email === 'marketing@bahiaprev.com.br' || 
                         profile?.email === 'lucasrodrigues@bahiaprev.com.br' || 
                         profile?.role === 'Administrador' || 
                         profile?.role === 'Analista de Marketing' || 
                         profile?.role === 'Diretor' ||
                         profile?.role === 'Diretor/Presidente';

  const handleOpenRoleModal = (member: MemberProfile) => {
    setEditingMember(member);
    setNewRoleInput(member.role || 'Colaborador');
  };

  const handleSaveMemberRole = async () => {
    if (!editingMember || !newRoleInput.trim()) return;
    setSavingRole(true);
    const updatedRole = newRoleInput.trim();
    try {
      const cleanEmail = (editingMember.email || '').toLowerCase().trim();
      if (cleanEmail) {
        await supabaseService.saveTeamRole(cleanEmail, updatedRole);
      }

      const existingUser = allUsers.find(u => (u.email && u.email.toLowerCase() === cleanEmail) || u.uid === editingMember.uid);
      const targetUid = existingUser ? existingUser.uid : (editingMember.uid || `u_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`);

      await supabaseService.saveUserProfile({
        uid: targetUid,
        name: formatUserName(editingMember.name, cleanEmail),
        email: cleanEmail,
        role: updatedRole
      });

      const isCurrentUser = user && (
        targetUid === user.uid || 
        cleanEmail === user.email?.toLowerCase() ||
        cleanEmail.includes('lucas') ||
        cleanEmail === 'marketing@bahiaprev.com.br'
      );

      if (isCurrentUser) {
        await updateUserProfile({ role: updatedRole });
      }

      await fetchUsers();

      setMembers(prev => prev.map(m => (m.email?.toLowerCase() === cleanEmail || m.uid === editingMember.uid) ? { ...m, role: updatedRole } : m));
      setToastMsg(`Cargo de ${formatUserName(editingMember.name, cleanEmail)} atualizado para "${updatedRole}"!`);
      setTimeout(() => setToastMsg(null), 4000);
      setEditingMember(null);
    } catch (err) {
      console.error('Erro ao salvar cargo:', err);
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteMember = async (member: MemberProfile) => {
    if (!member) return;
    const isLucas = member.email?.toLowerCase().includes('lucas') || member.email === 'marketing@bahiaprev.com.br';
    if (isLucas) {
      alert("Não é possível excluir a conta do Administrador Principal.");
      return;
    }
    if (!window.confirm(`Tem certeza de que deseja excluir permanentemente o colaborador ${formatUserName(member.name, member.email)} (${member.email}) do sistema?`)) {
      return;
    }

    try {
      await supabaseService.deleteUserProfile(member.uid);
      await fetchUsers();
      setToastMsg(`Usuário ${formatUserName(member.name, member.email)} foi excluído do sistema com sucesso.`);
      setTimeout(() => setToastMsg(null), 4000);
      setEditingMember(null);
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);
      alert("Erro ao excluir colaborador do banco de dados.");
    }
  };

  useEffect(() => {
    const defaultOrder = [
      'lucasrodrigues@bahiaprev.com.br',
      'jairoqueiroz@bahiaprev.com.br',
      'cauan@bahiaprev.com.br',
      'nilton@bahiaprev.com.br',
      'thayan@bahiaprev.com.br',
      'vitor@bahiaprev.com.br',
      'paulo@bahiaprev.com.br'
    ];

    const list: MemberProfile[] = allUsers
      .filter(u => (u.email || '').toLowerCase().trim() !== 'marketing@bahiaprev.com.br')
      .map(u => {
        const emailLower = (u.email || '').toLowerCase().trim();
        const isUserDoc = Boolean(user && (u.uid === user.uid || (user.email && user.email.toLowerCase() === emailLower)));
        const isOnline = isUserDoc ? true : Boolean(u.isOnline || (u.lastSeen && (new Date().getTime() - new Date(u.lastSeen).getTime() < 120000)));

        const displayName = formatUserName(u.name, emailLower);

        return {
          uid: u.uid,
          name: displayName,
          email: u.email,
          role: u.role || 'Colaborador',
          avatarUrl: (isUserDoc && profile?.avatarUrl) ? profile.avatarUrl : u.avatarUrl,
          createdAt: u.createdAt,
          isOnline,
          lastSeen: u.lastSeen
        };
      });

    list.sort((a, b) => {
      const aEmail = (a.email || '').toLowerCase();
      const bEmail = (b.email || '').toLowerCase();
      const aIdx = defaultOrder.indexOf(aEmail);
      const bIdx = defaultOrder.indexOf(bEmail);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    setMembers(list);
  }, [allUsers, user, profile]);

  const filteredMembers = members.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header Box */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full mb-2">
            <Users className="h-3.5 w-3.5" />
            <span>QUADRO DE COLABORADORES & EQUIPE</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Equipe Bahia Prev
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            Conheça a equipe do Plano Bahia Prev.
          </p>
        </div>

        {/* Search input */}
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou cargo..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Toast feedback banner */}
      {toastMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-4 bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center gap-2.5"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-200" />
          <span>{toastMsg}</span>
        </motion.div>
      )}

      {/* Grid of Members */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="h-8 w-8 border-3 border-slate-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Carregando quadro de colaboradores...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((member) => {
            const isCurrentUser = user?.email === member.email || user?.uid === member.uid;
            const isOnline = isCurrentUser || Boolean(member.isOnline);

            return (
              <motion.div
                key={member.uid}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-white rounded-2xl p-5 border transition-all flex items-center gap-4 relative ${
                  isCurrentUser 
                    ? 'border-blue-400 ring-2 ring-blue-500/10 shadow-md' 
                    : 'border-slate-200/80 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Profile Photo / Avatar */}
                <div className="relative shrink-0">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="h-16 w-16 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-slate-800 to-blue-700 text-white font-extrabold text-xl flex items-center justify-center shadow-sm">
                      {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  {isOnline ? (
                    <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-500/20" title="Online no sistema" />
                  ) : (
                    <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-slate-300 border-2 border-white" title="Offline" />
                  )}
                </div>

                {/* Name & Role (Cargo) */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="font-extrabold text-slate-900 text-base truncate leading-snug">
                      {member.name}
                    </h3>
                    {isCurrentUser && (
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                        Você
                      </span>
                    )}
                  </div>

                  {/* Cargo Badge & Edit Button */}
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      <Briefcase className="h-3 w-3 text-blue-500" />
                      <span className="truncate">{member.role}</span>
                    </div>

                    {canManageRoles && (
                      <button
                        onClick={() => handleOpenRoleModal(member)}
                        className="p-1 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 border border-purple-200/60"
                        title="Alterar cargo deste colaborador"
                      >
                        <Edit3 className="h-2.5 w-2.5" />
                        <span>Alterar Cargo</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                      <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>

                    {isCurrentUser && onOpenProfileModal && (
                      <button
                        onClick={onOpenProfileModal}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[10px] font-bold transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                        title="Alterar sua foto de perfil"
                      >
                        <Camera className="h-3 w-3" />
                        <span className="hidden sm:inline">Foto</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal for Editing Member Role */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-8 shadow-2xl border border-slate-200/80 space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold mb-2">
                  <Shield className="h-3.5 w-3.5 text-purple-600" />
                  <span>GESTÃO DE CARGOS</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Alterar Cargo do Colaborador
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingMember.name} • {editingMember.email}
                </p>
              </div>

              <button
                onClick={() => setEditingMember(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Novo Cargo ou Função:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={newRoleInput}
                  onChange={(e) => setNewRoleInput(e.target.value)}
                  placeholder="Ex: Diretor, Analista de Marketing, Coordenador"
                  className="w-full p-3 pl-10 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <Briefcase className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
              </div>

              {/* Suggestions / Quick selection */}
              <div className="pt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Cargos da Empresa:</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'CPD',
                    'Gerente Funerário',
                    'Gerente Geral',
                    'Atendimento / Recepção',
                    'Vendedor(a)',
                    'Agente Funerário',
                    'Designer Gráfico',
                    'Analista de Marketing',
                    'Financeiro',
                    'Cobrador',
                    'Diretor / Presidente',
                    'Administrador'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewRoleInput(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        newRoleInput === preset
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              {canManageRoles && !editingMember.email?.toLowerCase().includes('lucas') && editingMember.email !== 'marketing@bahiaprev.com.br' && (
                <button
                  type="button"
                  onClick={() => handleDeleteMember(editingMember)}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                  <span>Excluir Colaborador</span>
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveMemberRole}
                  disabled={savingRole || !newRoleInput.trim()}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {savingRole ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Salvar Cargo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

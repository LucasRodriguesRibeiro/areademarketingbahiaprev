import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Users, Mail, CheckCircle2, Search, Briefcase, Camera, Edit3, Shield, Check, X, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from './AuthContext';

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
  const { user, profile, updateUserProfile } = useAuth();
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal for editing collaborator cargo
  const [editingMember, setEditingMember] = useState<MemberProfile | null>(null);
  const [newRoleInput, setNewRoleInput] = useState('');
  const [savingRole, setSavingRole] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Check if current user can edit roles
  const canManageRoles = profile?.email === 'marketing@bahiaprev.com.br' || 
                         profile?.email === 'lucasrodrigues@bahiaprev.com.br' || 
                         profile?.role === 'Administrador' || 
                         profile?.role === 'Diretor';

  const handleOpenRoleModal = (member: MemberProfile) => {
    setEditingMember(member);
    setNewRoleInput(member.role || 'Colaborador');
  };

  const handleSaveMemberRole = async () => {
    if (!editingMember || !newRoleInput.trim()) return;
    setSavingRole(true);
    const updatedRole = newRoleInput.trim();
    try {
      const userRef = doc(db, 'users', editingMember.uid);
      await setDoc(userRef, {
        uid: editingMember.uid,
        name: editingMember.name,
        email: editingMember.email,
        role: updatedRole
      }, { merge: true });

      const isCurrentUser = user && (
        editingMember.uid === user.uid || 
        editingMember.email?.toLowerCase() === user.email?.toLowerCase() ||
        editingMember.email?.toLowerCase().includes('lucas') ||
        editingMember.email?.toLowerCase() === 'marketing@bahiaprev.com.br'
      );

      if (isCurrentUser) {
        if (user.uid !== editingMember.uid) {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: editingMember.name,
            email: user.email || editingMember.email,
            role: updatedRole
          }, { merge: true });
        }
        await updateUserProfile({ role: updatedRole });
      }

      setMembers(prev => prev.map(m => m.uid === editingMember.uid ? { ...m, role: updatedRole } : m));
      setToastMsg(`Cargo de ${editingMember.name} atualizado para "${updatedRole}"!`);
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
    if (!window.confirm(`Tem certeza de que deseja excluir permanentemente o colaborador ${member.name} (${member.email}) do sistema?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', member.uid));
      setToastMsg(`Usuário ${member.name} foi excluído do sistema com sucesso.`);
      setTimeout(() => setToastMsg(null), 4000);
      setEditingMember(null);
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);
      alert("Erro ao excluir colaborador do banco de dados.");
    }
  };

  // Default team members list
  const DEMO_MEMBERS: MemberProfile[] = [
    {
      uid: 'm-lucas',
      name: 'Lucas Rodrigues',
      email: 'lucasrodrigues@bahiaprev.com.br',
      role: 'Administrador',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80'
    },
    {
      uid: 'm-jairo',
      name: 'Jairo Queiroz',
      email: 'jairoqueiroz@bahiaprev.com.br',
      role: 'Diretor',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'
    },
    {
      uid: 'm-cauan',
      name: 'Cauan',
      email: 'cauan@bahiaprev.com.br',
      role: 'Designer Gráfico',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
    }
  ];

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const mergedMap: Record<string, MemberProfile> = {
        'lucas': {
          uid: 'm-lucas',
          name: 'Lucas Rodrigues',
          email: 'lucasrodrigues@bahiaprev.com.br',
          role: profile?.email === 'lucasrodrigues@bahiaprev.com.br' ? (profile?.role || 'Administrador') : 'Administrador',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80'
        },
        'jairo': {
          uid: 'm-jairo',
          name: 'Jairo Queiroz',
          email: 'jairoqueiroz@bahiaprev.com.br',
          role: 'Diretor/Presidente',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'
        },
        'cauan': {
          uid: 'm-cauan',
          name: 'Cauan',
          email: 'cauan@bahiaprev.com.br',
          role: profile?.email === 'cauan@bahiaprev.com.br' ? (profile?.role || 'Designer Gráfico') : 'Designer Gráfico',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
        }
      };

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const email = (data.email || '').toLowerCase();
        const name = (data.name || '').toLowerCase();

        const docIsOnline = data.isOnline === true || (
          data.lastSeen && (new Date().getTime() - new Date(data.lastSeen).getTime() < 120000)
        );

        if (email.includes('lucas') || name.includes('lucas') || email === 'marketing@bahiaprev.com.br') {
          const isUserDoc = user && docSnap.id === user.uid;
          let role = data.role || mergedMap['lucas'].role;
          if (mergedMap['lucas'].role === 'Administrador' && role === 'Analista de Marketing') {
            role = 'Administrador';
          }

          mergedMap['lucas'] = {
            uid: isUserDoc ? user.uid : (mergedMap['lucas'].uid || docSnap.id),
            name: data.name || mergedMap['lucas'].name,
            email: 'lucasrodrigues@bahiaprev.com.br',
            role: role,
            avatarUrl: (isUserDoc && profile?.avatarUrl) ? profile.avatarUrl : (data.avatarUrl || mergedMap['lucas'].avatarUrl),
            createdAt: data.createdAt,
            isOnline: isUserDoc ? true : Boolean(docIsOnline),
            lastSeen: data.lastSeen
          };
        } else if (email.includes('jairo') || name.includes('jairo')) {
          const isUserDoc = user && docSnap.id === user.uid;
          mergedMap['jairo'] = {
            uid: isUserDoc ? user.uid : (mergedMap['jairo'].uid || docSnap.id),
            name: data.name || mergedMap['jairo'].name,
            email: 'jairoqueiroz@bahiaprev.com.br',
            role: data.role || mergedMap['jairo'].role,
            avatarUrl: (isUserDoc && profile?.avatarUrl) ? profile.avatarUrl : (data.avatarUrl || mergedMap['jairo'].avatarUrl),
            createdAt: data.createdAt,
            isOnline: isUserDoc ? true : Boolean(docIsOnline),
            lastSeen: data.lastSeen
          };
        } else if (email.includes('cauan') || name.includes('cauan')) {
          const isUserDoc = user && docSnap.id === user.uid;
          const cauanResolvedName = (data.name && data.name.toLowerCase() !== 'cauan' && data.name.toLowerCase() !== 'colaborador' && !data.name.includes('@')) ? data.name : 'Cauan';
          const cauanResolvedRole = (data.role && data.role !== 'Colaborador') ? data.role : 'Designer Gráfico';

          mergedMap['cauan'] = {
            uid: isUserDoc ? user.uid : (mergedMap['cauan'].uid || docSnap.id),
            name: cauanResolvedName,
            email: 'cauan@bahiaprev.com.br',
            role: cauanResolvedRole,
            avatarUrl: (isUserDoc && profile?.avatarUrl) ? profile.avatarUrl : (data.avatarUrl || mergedMap['cauan'].avatarUrl),
            createdAt: data.createdAt,
            isOnline: isUserDoc ? true : Boolean(docIsOnline),
            lastSeen: data.lastSeen
          };
        } else {
          const isUserDoc = user && docSnap.id === user.uid;
          mergedMap[docSnap.id] = {
            uid: isUserDoc ? user.uid : docSnap.id,
            name: data.name || email.split('@')[0],
            email: data.email || '',
            role: data.role || 'Colaborador',
            avatarUrl: (isUserDoc && profile?.avatarUrl) ? profile.avatarUrl : (data.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'),
            createdAt: data.createdAt,
            isOnline: isUserDoc ? true : Boolean(docIsOnline),
            lastSeen: data.lastSeen
          };
        }
      });

      // Always force active logged-in profile data onto the respective card
      if (profile) {
        const pEmail = (profile.email || '').toLowerCase();
        const pName = (profile.name || '').toLowerCase();
        if (pEmail.includes('lucas') || pName.includes('lucas') || pEmail === 'marketing@bahiaprev.com.br') {
          if (profile.role) mergedMap['lucas'].role = profile.role;
          if (profile.avatarUrl) mergedMap['lucas'].avatarUrl = profile.avatarUrl;
          if (profile.name) mergedMap['lucas'].name = profile.name;
        } else if (pEmail.includes('jairo') || pName.includes('jairo')) {
          if (profile.role) mergedMap['jairo'].role = profile.role;
          if (profile.avatarUrl) mergedMap['jairo'].avatarUrl = profile.avatarUrl;
          if (profile.name) mergedMap['jairo'].name = profile.name;
        } else if (pEmail.includes('cauan') || pName.includes('cauan')) {
          if (profile.role) mergedMap['cauan'].role = profile.role;
          if (profile.avatarUrl) mergedMap['cauan'].avatarUrl = profile.avatarUrl;
          if (profile.name) mergedMap['cauan'].name = profile.name;
        }
      }

      setMembers(Object.values(mergedMap));
      setLoading(false);
    }, (err) => {
      console.error("Error fetching members:", err);
      setMembers(DEMO_MEMBERS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, profile]);

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
                    'Diretor/Presidente',
                    'Gerente Geral',
                    'Gerente Funerário',
                    'Agente Funerário',
                    'Atendente',
                    'Vendedor',
                    'Analista de Marketing',
                    'Designer Gráfico',
                    'Financeiro',
                    'CPD',
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

import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { Users, Mail, CheckCircle2, Search, Briefcase, Camera, Edit3, Shield, Check, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from './AuthContext';

interface MemberProfile {
  uid: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  createdAt?: string;
}

interface MembersSectionProps {
  onOpenProfileModal?: () => void;
}

export const MembersSection: React.FC<MembersSectionProps> = ({ onOpenProfileModal }) => {
  const { user, profile } = useAuth();
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal for editing collaborator cargo
  const [editingMember, setEditingMember] = useState<MemberProfile | null>(null);
  const [newRoleInput, setNewRoleInput] = useState('');
  const [savingRole, setSavingRole] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Check if current user can edit roles (strictly system administrator marketing@bahiaprev.com.br)
  const canManageRoles = profile?.email === 'marketing@bahiaprev.com.br';

  const handleOpenRoleModal = (member: MemberProfile) => {
    setEditingMember(member);
    setNewRoleInput(member.role || 'Colaborador');
  };

  const handleSaveMemberRole = async () => {
    if (!editingMember || !newRoleInput.trim()) return;
    setSavingRole(true);
    try {
      const userRef = doc(db, 'users', editingMember.uid);
      await setDoc(userRef, {
        uid: editingMember.uid,
        name: editingMember.name,
        email: editingMember.email,
        role: newRoleInput.trim()
      }, { merge: true });

      setMembers(prev => prev.map(m => m.uid === editingMember.uid ? { ...m, role: newRoleInput.trim() } : m));
      setToastMsg(`Cargo de ${editingMember.name} atualizado para "${newRoleInput.trim()}"!`);
      setTimeout(() => setToastMsg(null), 4000);
      setEditingMember(null);
    } catch (err) {
      console.error('Erro ao salvar cargo:', err);
    } finally {
      setSavingRole(false);
    }
  };

  // Fallback list featuring the 3 existing profiles of the app
  const DEMO_MEMBERS: MemberProfile[] = [
    {
      uid: 'm-admin',
      name: 'Lucas',
      email: 'marketing@bahiaprev.com.br',
      role: 'Administrador do Sistema',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80'
    },
    {
      uid: 'm-jairo',
      name: 'Jairo Queiroz',
      email: 'jairoqueiroz@bahiaprev.com.br',
      role: 'Diretor',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'
    },
    {
      uid: 'm-lucas',
      name: 'Lucas Rodrigues',
      email: 'lucasrodrigues@bahiaprev.com.br',
      role: 'Analista de Marketing',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80'
    }
  ];

  // Map avatars for known emails if Firestore profile doesn't have custom image
  const getAvatarForMember = (email: string, name: string) => {
    if (email === 'marketing@bahiaprev.com.br') {
      return 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80';
    }
    if (email === 'jairoqueiroz@bahiaprev.com.br') {
      return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80';
    }
    if (email === 'lucasrodrigues@bahiaprev.com.br') {
      return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80';
    }
    return undefined;
  };

  // Resolve correct role for team members
  const getRoleForMember = (email: string, name: string, role?: string) => {
    const normEmail = (email || '').toLowerCase();
    const normName = (name || '').toLowerCase();
    if (normEmail.includes('jairo') || normName.includes('jairo')) return 'Diretor';
    if (normEmail === 'marketing@bahiaprev.com.br') return 'Administrador';
    if (normEmail.includes('lucasrodrigues')) return 'Analista de Marketing';
    if (role && role !== 'Colaborador') return role;
    return role || 'Colaborador';
  };

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const fetched: MemberProfile[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const email = data.email || '';
        const name = data.name || '';
        const resolvedRole = getRoleForMember(email, name, data.role);
        return {
          uid: docSnap.id,
          name: name,
          email: email,
          role: resolvedRole,
          avatarUrl: data.avatarUrl || getAvatarForMember(email, name),
          createdAt: data.createdAt
        };
      });

      if (fetched.length > 0) {
        // Merge duplicate accounts for the same person (matching name or email)
        const mergedList: MemberProfile[] = [];

        fetched.forEach(item => {
          const normName = (item.name || '').trim().toLowerCase();
          const normEmail = (item.email || '').trim().toLowerCase();

          const existingIndex = mergedList.findIndex(p => {
            const pName = (p.name || '').trim().toLowerCase();
            const pEmail = (p.email || '').trim().toLowerCase();

            const sameName = normName && pName && (normName === pName || normName.includes(pName) || pName.includes(normName));
            const sameEmail = normEmail && pEmail && normEmail === pEmail;
            
            // Explicit check for Jairo & Lucas variations
            const bothJairo = (normName.includes('jairo') || normEmail.includes('jairo')) && 
                              (pName.includes('jairo') || pEmail.includes('jairo'));
            const bothLucas = (normName.includes('lucas') || normEmail.includes('lucas')) && 
                              (pName.includes('lucas') || pEmail.includes('lucas'));

            return sameName || sameEmail || bothJairo || bothLucas;
          });

          if (existingIndex === -1) {
            mergedList.push({ ...item });
          } else {
            const existing = mergedList[existingIndex];
            
            // Determine if item or existing is the currently logged in user UID
            const isItemCurrentUser = user && item.uid === user.uid;
            const targetUid = isItemCurrentUser ? item.uid : existing.uid;

            // Prefer custom data:image avatars over stock images
            const chosenAvatar = (item.avatarUrl && item.avatarUrl.startsWith('data:')) 
              ? item.avatarUrl 
              : (existing.avatarUrl?.startsWith('data:') ? existing.avatarUrl : (item.avatarUrl || existing.avatarUrl));

            // Prefer specific roles over 'Colaborador'
            const chosenRole = getRoleForMember(
              item.email || existing.email,
              item.name || existing.name,
              (item.role && item.role !== 'Colaborador') ? item.role : existing.role
            );

            mergedList[existingIndex] = {
              uid: targetUid,
              name: (item.name && item.name.length >= (existing.name?.length || 0)) ? item.name : existing.name,
              email: item.email || existing.email,
              role: chosenRole,
              avatarUrl: chosenAvatar,
              createdAt: item.createdAt || existing.createdAt
            };
          }
        });

        setMembers(mergedList);
      } else {
        setMembers(DEMO_MEMBERS);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching members:", err);
      setMembers(DEMO_MEMBERS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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
            Conheça os colaboradores, diretores e administradores ativos no PrevHub.
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
                  <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" title="Ativo" />
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
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Sugestões rápidas:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Diretor', 'Gerente', 'Coordenador', 'Analista de Marketing', 'Consultor', 'Colaborador'].map((preset) => (
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

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
          </motion.div>
        </div>
      )}

    </div>
  );
};

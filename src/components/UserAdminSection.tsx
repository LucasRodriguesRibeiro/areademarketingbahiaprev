import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, 
  ShieldCheck, 
  User, 
  Mail, 
  Lock, 
  Briefcase, 
  Radio, 
  ListTodo, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Search, 
  Sparkles,
  Users,
  Key,
  AlertCircle,
  RefreshCw,
  Check,
  X
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

interface ManagedUser {
  uid: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  canPostFeed?: boolean;
  canCreateTasks?: boolean;
  createdAt?: string;
  isOnline?: boolean;
}

const PRESET_ROLES = [
  'Analista de Marketing',
  'Designer Gráfico',
  'Atendimento / Recepção',
  'Consultor Comercial',
  'Gerente Operacional',
  'Diretor / Presidente',
  'Administrador',
  'Colaborador'
];

export const UserAdminSection: React.FC = () => {
  const { profile, user } = useAuth();

  // Verification: Only Lucas Rodrigues has access
  const isLucas = Boolean(
    profile?.email === 'lucasrodrigues@bahiaprev.com.br' ||
    profile?.email === 'marketing@bahiaprev.com.br' ||
    profile?.name?.toLowerCase().includes('lucas') ||
    user?.email === 'lucasrodrigues@bahiaprev.com.br' ||
    user?.email === 'marketing@bahiaprev.com.br'
  );

  // Users list from Firestore
  const [usersList, setUsersList] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State for New User
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('mkt@BP2025');
  const [newRole, setNewRole] = useState('Analista de Marketing');
  const [customRole, setCustomRole] = useState('');
  const [canPostFeed, setCanPostFeed] = useState(true);
  const [canCreateTasks, setCanCreateTasks] = useState(true);

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editCanPostFeed, setEditCanPostFeed] = useState(false);
  const [editCanCreateTasks, setEditCanCreateTasks] = useState(false);

  // Subscribe to all users in Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const loaded: ManagedUser[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const uEmail = (data.email || '').toLowerCase();
        const uName = data.name || '';

        // Derive permissions if undefined in DB
        const defaultCanPost = data.canPostFeed !== undefined 
          ? Boolean(data.canPostFeed) 
          : (!uEmail.includes('cauan') && !uName.toLowerCase().includes('cauan'));

        const defaultCanTasks = data.canCreateTasks !== undefined 
          ? Boolean(data.canCreateTasks) 
          : (!uEmail.includes('cauan') && !uName.toLowerCase().includes('cauan'));

        loaded.push({
          uid: docSnap.id,
          name: data.name || uEmail.split('@')[0] || 'Usuário',
          email: data.email || '',
          role: data.role || 'Colaborador',
          avatarUrl: data.avatarUrl,
          canPostFeed: defaultCanPost,
          canCreateTasks: defaultCanTasks,
          createdAt: data.createdAt,
          isOnline: data.isOnline
        });
      });

      // Sort users: Lucas & Directors first, then alphabetically
      loaded.sort((a, b) => {
        if (a.email.includes('lucas') || a.email === 'marketing@bahiaprev.com.br') return -1;
        if (b.email.includes('lucas') || b.email === 'marketing@bahiaprev.com.br') return 1;
        return a.name.localeCompare(b.name);
      });

      setUsersList(loaded);
      setLoadingUsers(false);
    });

    return () => unsub();
  }, []);

  // Helper to register new user without logging out active admin
  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!newName.trim()) {
      setStatusMessage({ type: 'error', text: 'Por favor, informe o nome completo do colaborador.' });
      return;
    }
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Por favor, informe um e-mail válido.' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'A senha de acesso precisa ter pelo menos 6 caracteres.' });
      return;
    }

    const finalRole = newRole === 'Outro' ? (customRole.trim() || 'Colaborador') : newRole;

    setSubmitting(true);

    try {
      // 1. Initialize secondary Firebase Auth app so Lucas is NOT logged out!
      const secondaryAppName = 'SecondaryUserCreationApp';
      let secondaryApp = getApps().find(app => app.name === secondaryAppName);
      if (!secondaryApp) {
        secondaryApp = initializeApp({
          apiKey: firebaseConfig.apiKey,
          authDomain: firebaseConfig.authDomain,
          projectId: firebaseConfig.projectId,
          storageBucket: firebaseConfig.storageBucket,
          messagingSenderId: firebaseConfig.messagingSenderId,
          appId: firebaseConfig.appId,
        }, secondaryAppName);
      }
      const secondaryAuth = getAuth(secondaryApp);

      let createdUid = '';

      try {
        const userCred = await createUserWithEmailAndPassword(secondaryAuth, newEmail.trim(), newPassword);
        createdUid = userCred.user.uid;
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          // If auth user already exists, generate a unique doc ID or match existing
          const existingUser = usersList.find(u => u.email.toLowerCase() === newEmail.trim().toLowerCase());
          createdUid = existingUser ? existingUser.uid : `user_${Date.now()}`;
        } else {
          throw authError;
        }
      }

      // 2. Save user profile into Firestore 'users' collection
      const userProfilePayload = {
        uid: createdUid,
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        role: finalRole,
        canPostFeed: canPostFeed,
        canCreateTasks: canCreateTasks,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', createdUid), userProfilePayload, { merge: true });

      setStatusMessage({ 
        type: 'success', 
        text: `Usuário ${newName.trim()} (${newEmail.trim()}) cadastrado e configurado com sucesso!` 
      });

      // Clear form
      setNewName('');
      setNewEmail('');
      setCustomRole('');
      setNewPassword('mkt@BP2025');
      setCanPostFeed(true);
      setCanCreateTasks(true);

    } catch (err: any) {
      console.error('Error registering user:', err);
      setStatusMessage({ 
        type: 'error', 
        text: err.message || 'Erro ao cadastrar novo usuário. Tente novamente.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle permission directly from table
  const handleTogglePermission = async (userUid: string, field: 'canPostFeed' | 'canCreateTasks', currentValue: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userUid), {
        [field]: !currentValue
      });
    } catch (err) {
      console.error('Error updating permission:', err);
    }
  };

  // Open Edit Modal
  const openEditModal = (u: ManagedUser) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditRole(u.role);
    setEditCanPostFeed(Boolean(u.canPostFeed));
    setEditCanCreateTasks(Boolean(u.canCreateTasks));
  };

  // Save Edit User
  const handleSaveEditUser = async () => {
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, 'users', editingUser.uid), {
        name: editName.trim(),
        role: editRole.trim(),
        canPostFeed: editCanPostFeed,
        canCreateTasks: editCanCreateTasks
      });
      setEditingUser(null);
    } catch (err) {
      console.error('Error saving user edit:', err);
    }
  };

  // Filtered users for search
  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isLucas) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-white shadow-2xl">
        <ShieldCheck className="h-16 w-16 text-red-500 mx-auto mb-4 animate-bounce" />
        <h2 className="text-2xl font-black text-white mb-2">Painel de Acesso Exclusivo</h2>
        <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
          Esta aba é restrita e configurada exclusivamente para a conta de administrador do 
          <strong className="text-blue-400 font-bold"> Lucas Rodrigues</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* Exclusive Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-bold">
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
              <span>Aba Exclusiva de Administração • Lucas Rodrigues</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Cadastro de Usuários & Permissões</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Cadastre novos colaboradores, defina seus cargos e gerencie exatamente quais permissões cada um possui no sistema (publicar no Feed e criar/atribuir tarefas).
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md">
              LR
            </div>
            <div>
              <p className="text-xs font-bold text-white">Lucas Rodrigues</p>
              <p className="text-[10px] text-blue-400 font-semibold">Administrador do Sistema</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Left, User List Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form to Register User */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xl space-y-6">
            
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5 text-slate-900 font-black text-lg">
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-600">
                  <UserPlus className="h-5 w-5" />
                </div>
                <h2>Cadastrar Novo Usuário</h2>
              </div>
              <p className="text-slate-500 text-xs mt-1">
                Preencha os dados abaixo para gerar as credenciais do novo colaborador.
              </p>
            </div>

            {/* Status Notification */}
            {statusMessage && (
              <div className={`p-4 rounded-2xl border text-xs font-medium flex items-start gap-3 ${
                statusMessage.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <p className="font-bold text-sm">
                    {statusMessage.type === 'success' ? 'Sucesso!' : 'Atenção'}
                  </p>
                  <p>{statusMessage.text}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleRegisterUser} className="space-y-4">
              
              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-blue-500" />
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Silva"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-blue-500" />
                  E-mail de Acesso
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ex: carlos@bahiaprev.com.br"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Senha */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-blue-500" />
                  Senha Inicial de Acesso
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">O colaborador utilizará este e-mail e senha para fazer login.</p>
              </div>

              {/* Cargo / Função */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-blue-500" />
                  Cargo / Função
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  {PRESET_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                  <option value="Outro">Outro (Digitar Cargo Customizado)</option>
                </select>

                {newRole === 'Outro' && (
                  <input
                    type="text"
                    required
                    placeholder="Digite o título do cargo..."
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    className="w-full mt-2 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                )}
              </div>

              {/* Permissões no Sistema */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <p className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Permissões do Sistema
                </p>

                {/* Permissão 1: Feed */}
                <div 
                  onClick={() => setCanPostFeed(!canPostFeed)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    canPostFeed 
                      ? 'bg-blue-50/70 border-blue-200 text-blue-950' 
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${canPostFeed ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      <Radio className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Postar no Feed & Comunicados</p>
                      <p className="text-[10px] text-slate-500">Permite publicar comunicados oficiais e atualizações.</p>
                    </div>
                  </div>

                  <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${canPostFeed ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${canPostFeed ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* Permissão 2: Tarefas */}
                <div 
                  onClick={() => setCanCreateTasks(!canCreateTasks)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    canCreateTasks 
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${canCreateTasks ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      <ListTodo className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Criar & Atribuir Tarefas</p>
                      <p className="text-[10px] text-slate-500">Permite criar tarefas e delegar para a equipe.</p>
                    </div>
                  </div>

                  <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${canCreateTasks ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${canCreateTasks ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Cadastrando Usuário...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Cadastrar Colaborador no Sistema</span>
                  </>
                )}
              </button>

            </form>

          </div>
        </div>

        {/* Right Column: Registered Users List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xl space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-slate-900 font-black text-lg">Usuários Cadastrados ({usersList.length})</h2>
                  <p className="text-slate-500 text-xs">Gerencie cargos e permissões ativas em tempo real.</p>
                </div>
              </div>

              {/* Search Field */}
              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar colaborador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Users Table / List */}
            {loadingUsers ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                <span>Carregando lista de usuários...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-medium">
                Nenhum colaborador encontrado com os termos pesquisados.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((u) => {
                  const isLucasUser = u.email.includes('lucas') || u.email === 'marketing@bahiaprev.com.br';

                  return (
                    <div 
                      key={u.uid}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isLucasUser 
                          ? 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-blue-200 shadow-sm' 
                          : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100/80'
                      }`}
                    >
                      {/* Left: User Avatar & Details */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        {u.avatarUrl ? (
                          <img 
                            src={u.avatarUrl} 
                            alt={u.name} 
                            className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-md shrink-0" 
                          />
                        ) : (
                          <div className={`h-10 w-10 rounded-full text-white font-black text-sm flex items-center justify-center shadow-md shrink-0 ${
                            isLucasUser ? 'bg-gradient-to-tr from-blue-600 to-indigo-600' : 'bg-slate-700'
                          }`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm truncate">{u.name}</span>
                            {isLucasUser && (
                              <span className="px-2 py-0.5 bg-blue-600 text-white font-extrabold text-[9px] rounded-full uppercase tracking-wider shrink-0">
                                Admin Principal
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-semibold text-blue-600 truncate">{u.role}</p>
                          <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                        </div>
                      </div>

                      {/* Right: Permissions Status & Action */}
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                        
                        {/* Feed permission badge & button */}
                        <button
                          onClick={() => handleTogglePermission(u.uid, 'canPostFeed', Boolean(u.canPostFeed))}
                          title="Clique para alternar permissão do Feed"
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                            u.canPostFeed 
                              ? 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200' 
                              : 'bg-slate-200/70 border-slate-300 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          <Radio className="h-3 w-3 text-blue-600" />
                          <span>Feed: {u.canPostFeed ? '✅ Sim' : '🚫 Não'}</span>
                        </button>

                        {/* Tasks permission badge & button */}
                        <button
                          onClick={() => handleTogglePermission(u.uid, 'canCreateTasks', Boolean(u.canCreateTasks))}
                          title="Clique para alternar permissão de Tarefas"
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                            u.canCreateTasks 
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200' 
                              : 'bg-slate-200/70 border-slate-300 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          <ListTodo className="h-3 w-3 text-emerald-600" />
                          <span>Tarefas: {u.canCreateTasks ? '✅ Sim' : '🚫 Não'}</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors cursor-pointer"
                          title="Editar Nome, Cargo e Permissões"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-600">
                    <Edit3 className="h-4 w-4" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">Editar Colaborador</h3>
                </div>
                <button 
                  onClick={() => setEditingUser(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cargo / Função</label>
                  <input
                    type="text"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-extrabold text-slate-900">Permissões de Acesso</p>
                  
                  <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <span className="text-xs font-bold text-slate-800">Pode publicar no Feed & Comunicados</span>
                    <input
                      type="checkbox"
                      checked={editCanPostFeed}
                      onChange={(e) => setEditCanPostFeed(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <span className="text-xs font-bold text-slate-800">Pode criar e atribuir Tarefas</span>
                    <input
                      type="checkbox"
                      checked={editCanCreateTasks}
                      onChange={(e) => setEditCanCreateTasks(e.target.checked)}
                      className="h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEditUser}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

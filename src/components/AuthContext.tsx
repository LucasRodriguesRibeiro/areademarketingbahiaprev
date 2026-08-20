import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { supabaseService } from '../lib/supabaseService';
import { formatUserName } from '../utils/userNameFormatter';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  createdAt: string;
  isOnline?: boolean;
  lastSeen?: string;
  canPostFeed?: boolean;
  canCreateTasks?: boolean;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  providerNotEnabled: boolean;
  allUsers: UserProfile[];
  usersMap: Record<string, UserProfile>;
  fetchUsers: () => Promise<UserProfile[]>;
  login: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAvatarUrl: (url: string) => Promise<void>;
  updateUserProfile: (data: { name?: string; role?: string; avatarUrl?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [providerNotEnabled] = useState(false);

  const fetchUsers = async (): Promise<UserProfile[]> => {
    try {
      const activeUsers = await supabaseService.fetchUsers();
      const list: UserProfile[] = (activeUsers || []).map((u: any) => ({
        uid: u.uid,
        name: formatUserName(u.name, u.email),
        email: (u.email || '').toLowerCase().trim(),
        role: u.role || 'Colaborador',
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt || new Date().toISOString(),
        isOnline: Boolean(u.isOnline),
        lastSeen: u.lastSeen,
        canPostFeed: u.canPostFeed !== undefined ? Boolean(u.canPostFeed) : (u.role?.toLowerCase().includes('admin') || u.role?.toLowerCase().includes('diretor') || u.role?.toLowerCase().includes('marketing') || (u.email || '').toLowerCase().includes('lucas') || (u.email || '').toLowerCase().includes('jairo')),
        canCreateTasks: u.canCreateTasks !== undefined ? Boolean(u.canCreateTasks) : (u.role?.toLowerCase().includes('admin') || u.role?.toLowerCase().includes('diretor') || u.role?.toLowerCase().includes('marketing') || (u.email || '').toLowerCase().includes('lucas') || (u.email || '').toLowerCase().includes('jairo'))
      }));

      const map: Record<string, UserProfile> = {};
      list.forEach(p => {
        map[p.uid] = p;
        if (p.email) {
          map[p.email.toLowerCase()] = p;
        }
      });

      setAllUsers(list);
      setUsersMap(map);

      // Sync active logged-in profile if present in map
      const savedProfJson = localStorage.getItem('bahiaprev_supabase_session_profile');
      let currentEmail = '';
      if (savedProfJson) {
        try {
          const parsed = JSON.parse(savedProfJson);
          if (parsed?.email) currentEmail = parsed.email.toLowerCase().trim();
        } catch {}
      }
      if (currentEmail && map[currentEmail]) {
        const updated = map[currentEmail];
        setProfile(prev => {
          const merged = prev ? { ...prev, ...updated } : updated;
          localStorage.setItem('bahiaprev_supabase_session_profile', JSON.stringify(merged));
          return merged;
        });
      }

      return list;
    } catch (err) {
      console.warn('Erro ao carregar usuários no Supabase:', err);
      return [];
    }
  };

  // Restore session from Supabase Auth or LocalStorage
  useEffect(() => {
    const initSession = async () => {
      setLoading(true);
      const supabase = getSupabaseClient();
      
      // 1. Try Supabase Auth Session
      if (supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user) {
            const sbUser = data.session.user;
            const formattedName = formatUserName(sbUser.user_metadata?.name, sbUser.email);
            const authU: AuthUser = { uid: sbUser.id, email: sbUser.email || '', displayName: formattedName };
            setUser(authU);

            const existingRegistry = await supabaseService.fetchUsersRegistry();
            const existingU = existingRegistry.users.find(u => u.uid === sbUser.id || (u.email && u.email.toLowerCase() === (sbUser.email || '').toLowerCase()));
            const isLeaderUser = (sbUser.user_metadata?.role || existingU?.role || '').toLowerCase().includes('admin') || 
                                (sbUser.user_metadata?.role || existingU?.role || '').toLowerCase().includes('diretor') || 
                                (sbUser.user_metadata?.role || existingU?.role || '').toLowerCase().includes('marketing') || 
                                (sbUser.email || '').toLowerCase().includes('lucas') || 
                                (sbUser.email || '').toLowerCase().includes('jairo');

            const userProf: UserProfile = {
              uid: sbUser.id,
              name: formattedName,
              email: sbUser.email || '',
              role: sbUser.user_metadata?.role || existingU?.role || 'Colaborador',
              avatarUrl: existingU?.avatarUrl,
              createdAt: existingU?.createdAt || new Date().toISOString(),
              isOnline: true,
              canPostFeed: existingU?.canPostFeed !== undefined ? Boolean(existingU.canPostFeed) : isLeaderUser,
              canCreateTasks: existingU?.canCreateTasks !== undefined ? Boolean(existingU.canCreateTasks) : isLeaderUser
            };
            setProfile(userProf);
            await supabaseService.saveUserProfile(userProf);
            await fetchUsers();
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Erro na verificação do Supabase Auth:', err);
        }
      }

      // 2. Try Saved Local Session
      const savedUserJson = localStorage.getItem('bahiaprev_supabase_session_user');
      const savedProfJson = localStorage.getItem('bahiaprev_supabase_session_profile');

      if (savedUserJson && savedProfJson) {
        try {
          const parsedUser = JSON.parse(savedUserJson);
          const parsedProf = JSON.parse(savedProfJson);
          
          let cleanEmail = (parsedProf.email || '').toLowerCase().trim();
          if (cleanEmail === 'marketing@bahiaprev.com.br') {
            cleanEmail = 'lucasrodrigues@bahiaprev.com.br';
            parsedUser.email = 'lucasrodrigues@bahiaprev.com.br';
          }

          const resolvedFormattedName = formatUserName(parsedProf.name || parsedUser.displayName, cleanEmail);
          parsedUser.displayName = resolvedFormattedName;
          parsedProf.name = resolvedFormattedName;
          parsedProf.email = cleanEmail;

          // Check for role updates from Supabase
          const teamRoles = await supabaseService.fetchTeamRoles();
          if (cleanEmail && teamRoles[cleanEmail]) {
            parsedProf.role = teamRoles[cleanEmail];
          } else if (cleanEmail.includes('lucas')) {
            parsedProf.role = teamRoles['lucasrodrigues@bahiaprev.com.br'] || 'Analista de Marketing';
          }

          setUser(parsedUser);
          setProfile(parsedProf);
          localStorage.setItem('bahiaprev_supabase_session_user', JSON.stringify(parsedUser));
          localStorage.setItem('bahiaprev_supabase_session_profile', JSON.stringify(parsedProf));
          await supabaseService.saveUserProfile({ ...parsedProf, isOnline: true });
        } catch {
          localStorage.removeItem('bahiaprev_supabase_session_user');
          localStorage.removeItem('bahiaprev_supabase_session_profile');
        }
      }

      await fetchUsers();
      setLoading(false);
    };

    initSession();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const supabase = getSupabaseClient();

    try {
      // 1. Check if user was deleted or disabled
      const registry = await supabaseService.fetchUsersRegistry();
      if (registry.deletedEmails.includes(cleanEmail)) {
        throw new Error('Esta conta de colaborador foi excluída ou desativada no sistema.');
      }

      // 2. Verify if user is registered in the system
      const existingInRegistry = registry.users.find((u: any) => (u.email || '').toLowerCase().trim() === cleanEmail);
      if (!existingInRegistry) {
        throw new Error('Colaborador não cadastrado no sistema. Solicite seu cadastro ao Administrador.');
      }

      // 3. Password check (if user was registered with a specific password)
      if (existingInRegistry.password && existingInRegistry.password !== password) {
        throw new Error('Senha incorreta. Verifique suas credenciais de acesso.');
      }

      const teamRoles = await supabaseService.fetchTeamRoles();

      // 4. Try Supabase Auth first (if user is synced with Auth)
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
          if (!error && data?.user) {
            const sbUser = data.user;
            const formattedName = formatUserName(sbUser.user_metadata?.name || existingInRegistry.name, cleanEmail);
            const authU: AuthUser = { uid: sbUser.id || existingInRegistry.uid, email: cleanEmail, displayName: formattedName };
            const userProf: UserProfile = {
              uid: sbUser.id || existingInRegistry.uid,
              name: formattedName,
              email: cleanEmail,
              role: teamRoles[cleanEmail] || existingInRegistry.role || sbUser.user_metadata?.role || 'Colaborador',
              avatarUrl: existingInRegistry.avatarUrl,
              createdAt: existingInRegistry.createdAt || new Date().toISOString(),
              isOnline: true,
              canPostFeed: existingInRegistry.canPostFeed !== undefined ? Boolean(existingInRegistry.canPostFeed) : true,
              canCreateTasks: existingInRegistry.canCreateTasks !== undefined ? Boolean(existingInRegistry.canCreateTasks) : true
            };
            setUser(authU);
            setProfile(userProf);
            localStorage.setItem('bahiaprev_supabase_session_user', JSON.stringify(authU));
            localStorage.setItem('bahiaprev_supabase_session_profile', JSON.stringify(userProf));
            await fetchUsers();
            setLoading(false);
            return;
          }
        } catch (authErr) {
          console.warn('Supabase Auth signIn falhou, usando autenticação do registro interno:', authErr);
        }
      }

      // 5. Authorized Internal User Profile Login
      const resolvedName = formatUserName(existingInRegistry.name, cleanEmail);
      const resolvedRole = teamRoles[cleanEmail] || existingInRegistry.role || 'Colaborador';
      const uid = existingInRegistry.uid || ('u_' + cleanEmail.replace(/[^a-z0-9]/g, '_'));

      const authU: AuthUser = { uid, email: cleanEmail, displayName: resolvedName };
      const userProf: UserProfile = {
        uid,
        name: resolvedName,
        email: cleanEmail,
        role: resolvedRole,
        avatarUrl: existingInRegistry.avatarUrl,
        createdAt: existingInRegistry.createdAt || new Date().toISOString(),
        isOnline: true,
        canPostFeed: existingInRegistry.canPostFeed !== undefined ? Boolean(existingInRegistry.canPostFeed) : true,
        canCreateTasks: existingInRegistry.canCreateTasks !== undefined ? Boolean(existingInRegistry.canCreateTasks) : true
      };

      setUser(authU);
      setProfile(userProf);
      localStorage.setItem('bahiaprev_supabase_session_user', JSON.stringify(authU));
      localStorage.setItem('bahiaprev_supabase_session_profile', JSON.stringify(userProf));
      await fetchUsers();
    } catch (err: any) {
      console.error('Erro no login:', err);
      throw new Error(err?.message || 'Falha na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string, role: string) => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const formattedName = formatUserName(name, cleanEmail);
    const supabase = getSupabaseClient();

    try {
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: { data: { name: formattedName, role } }
          });
          if (!error && data?.user) {
            const uid = data.user.id;
            const authU: AuthUser = { uid, email: cleanEmail, displayName: formattedName };
            const isLeaderUser = role.toLowerCase().includes('admin') || role.toLowerCase().includes('diretor') || role.toLowerCase().includes('marketing') || cleanEmail.includes('lucas') || cleanEmail.includes('jairo');
            const userProf: UserProfile = { uid, name: formattedName, email: cleanEmail, role, createdAt: new Date().toISOString(), isOnline: true, canPostFeed: isLeaderUser, canCreateTasks: isLeaderUser };
            setUser(authU);
            setProfile(userProf);
            localStorage.setItem('bahiaprev_supabase_session_user', JSON.stringify(authU));
            localStorage.setItem('bahiaprev_supabase_session_profile', JSON.stringify(userProf));
            await supabaseService.saveUserProfile(userProf);
            await fetchUsers();
            setLoading(false);
            return;
          }
        } catch {}
      }

      const uid = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const isLeaderUser = role.toLowerCase().includes('admin') || role.toLowerCase().includes('diretor') || role.toLowerCase().includes('marketing') || cleanEmail.includes('lucas') || cleanEmail.includes('jairo');
      const authU: AuthUser = { uid, email: cleanEmail, displayName: formattedName };
      const userProf: UserProfile = { uid, name: formattedName, email: cleanEmail, role, createdAt: new Date().toISOString(), isOnline: true, canPostFeed: isLeaderUser, canCreateTasks: isLeaderUser };
      setUser(authU);
      setProfile(userProf);
      localStorage.setItem('bahiaprev_supabase_session_user', JSON.stringify(authU));
      localStorage.setItem('bahiaprev_supabase_session_profile', JSON.stringify(userProf));
      await supabaseService.saveUserProfile({ ...userProf, password });
      await fetchUsers();
    } catch (err: any) {
      throw new Error(err?.message || 'Erro ao cadastrar usuário.');
    } finally {
      setLoading(false);
    }
  };

  const updateAvatarUrl = async (url: string) => {
    if (!user || !profile) return;
    const updated = { ...profile, avatarUrl: url };
    setProfile(updated);
    localStorage.setItem('bahiaprev_supabase_session_profile', JSON.stringify(updated));
    await supabaseService.saveUser(updated);
  };

  const updateUserProfile = async (data: { name?: string; role?: string; avatarUrl?: string }) => {
    if (!user || !profile) return;
    const cleanRole = data.role?.trim() || profile.role;
    const updatedName = data.name ? formatUserName(data.name, profile.email) : profile.name;
    const updated = {
      ...profile,
      name: updatedName,
      role: cleanRole,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : profile.avatarUrl
    };
    setProfile(updated);
    try {
      localStorage.setItem('bahiaprev_supabase_session_profile', JSON.stringify(updated));
    } catch {}
    await supabaseService.saveUser(updated);

    if (data.role && profile.email) {
      await supabaseService.saveTeamRole(profile.email, cleanRole);
    }
    await fetchUsers();
  };

  const logout = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();

    try {
      if (profile) {
        await supabaseService.saveUser({ ...profile, isOnline: false });
      }
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.warn('Erro ao sair do Supabase Auth:', error);
    } finally {
      setUser(null);
      setProfile(null);
      localStorage.removeItem('bahiaprev_supabase_session_user');
      localStorage.removeItem('bahiaprev_supabase_session_profile');
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, providerNotEnabled, allUsers, usersMap, fetchUsers, login, signUp, logout, updateAvatarUrl, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

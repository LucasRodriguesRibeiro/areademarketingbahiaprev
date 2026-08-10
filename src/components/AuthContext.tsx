import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { supabaseService } from '../lib/supabaseService';

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
      const dbUsers = await supabaseService.fetchUsers();
      if (!dbUsers) return [];
      
      const list: UserProfile[] = [];
      const map: Record<string, UserProfile> = {};
      
      dbUsers.forEach((u: any) => {
        const emailLower = (u.email || '').toLowerCase();
        const p: UserProfile = {
          uid: u.uid,
          name: u.name || (emailLower ? emailLower.split('@')[0] : 'Usuário'),
          email: u.email || '',
          role: u.role || 'Colaborador',
          avatarUrl: u.avatarUrl,
          createdAt: u.lastSeen || new Date().toISOString(),
          isOnline: u.isOnline,
          lastSeen: u.lastSeen,
          canPostFeed: emailLower.includes('lucas') || emailLower.includes('jairo') || emailLower === 'marketing@bahiaprev.com.br',
          canCreateTasks: emailLower.includes('lucas') || emailLower.includes('jairo') || emailLower === 'marketing@bahiaprev.com.br'
        };
        list.push(p);
        map[u.uid] = p;
      });

      setAllUsers(list);
      setUsersMap(map);
      return list;
    } catch (err) {
      console.warn('Erro ao carregar usuários no Supabase:', err);
      return [];
    }
  };

  // Pre-seed system default users into Supabase 'users' table
  useEffect(() => {
    const seedSystemUsers = async () => {
      const defaults = [
        { uid: 'u_lucas_mkt', name: 'Lucas Rodrigues', email: 'marketing@bahiaprev.com.br', role: 'Administrador' },
        { uid: 'u_lucas_dev', name: 'Lucas Rodrigues', email: 'lucasrodrigues@bahiaprev.com.br', role: 'Administrador' },
        { uid: 'u_jairo_dir', name: 'Jairo Queiroz', email: 'jairoqueiroz@bahiaprev.com.br', role: 'Diretor' },
        { uid: 'u_cauan_des', name: 'Cauan', email: 'cauan@bahiaprev.com.br', role: 'Designer Gráfico' },
        { uid: 'u_nilton', name: 'Nilton', email: 'nilton@bahiaprev.com.br', role: 'Colaborador' },
        { uid: 'u_thayan', name: 'Thayan', email: 'thayan@bahiaprev.com.br', role: 'Colaborador' },
        { uid: 'u_vitor', name: 'Vitor', email: 'vitor@bahiaprev.com.br', role: 'Colaborador' },
        { uid: 'u_paulo', name: 'Paulo', email: 'paulo@bahiaprev.com.br', role: 'Colaborador' }
      ];

      for (const u of defaults) {
        await supabaseService.saveUser({ ...u, isOnline: false, lastSeen: new Date().toISOString() });
      }
    };

    seedSystemUsers().catch(() => {});
  }, []);

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
            const authU: AuthUser = { uid: sbUser.id, email: sbUser.email || '', displayName: sbUser.user_metadata?.name };
            setUser(authU);

            const userProf: UserProfile = {
              uid: sbUser.id,
              name: sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'Usuário',
              email: sbUser.email || '',
              role: sbUser.user_metadata?.role || 'Colaborador',
              createdAt: new Date().toISOString(),
              isOnline: true
            };
            setProfile(userProf);
            await supabaseService.saveUser(userProf);
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
          setUser(parsedUser);
          setProfile(parsedProf);
          await supabaseService.saveUser({ ...parsedProf, isOnline: true });
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
      // 1. Try Supabase Auth first
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (!error && data?.user) {
          const sbUser = data.user;
          const authU: AuthUser = { uid: sbUser.id, email: sbUser.email || cleanEmail, displayName: sbUser.user_metadata?.name };
          const userProf: UserProfile = {
            uid: sbUser.id,
            name: sbUser.user_metadata?.name || cleanEmail.split('@')[0],
            email: cleanEmail,
            role: sbUser.user_metadata?.role || 'Colaborador',
            createdAt: new Date().toISOString(),
            isOnline: true
          };
          setUser(authU);
          setProfile(userProf);
          localStorage.setItem('bahiaprev_supabase_session_user', JSON.stringify(authU));
          localStorage.setItem('bahiaprev_supabase_session_profile', JSON.stringify(userProf));
          await supabaseService.saveUser(userProf);
          await fetchUsers();
          setLoading(false);
          return;
        }
      }

      // 2. Direct User Profile Match (fallback for seed/custom accounts)
      let resolvedName = cleanEmail.split('@')[0];
      let resolvedRole = 'Colaborador';

      if (cleanEmail.includes('cauan')) {
        resolvedName = 'Cauan';
        resolvedRole = 'Designer Gráfico';
      } else if (cleanEmail.includes('jairo')) {
        resolvedName = 'Jairo Queiroz';
        resolvedRole = 'Diretor/Presidente';
      } else if (cleanEmail.includes('lucas') || cleanEmail === 'marketing@bahiaprev.com.br') {
        resolvedName = 'Lucas Rodrigues';
        resolvedRole = 'Administrador';
      } else if (cleanEmail.includes('nilton')) {
        resolvedName = 'Nilton';
        resolvedRole = 'Colaborador';
      } else if (cleanEmail.includes('thayan')) {
        resolvedName = 'Thayan';
        resolvedRole = 'Colaborador';
      } else if (cleanEmail.includes('vitor')) {
        resolvedName = 'Vitor';
        resolvedRole = 'Colaborador';
      } else if (cleanEmail.includes('paulo')) {
        resolvedName = 'Paulo';
        resolvedRole = 'Colaborador';
      }

      const uid = 'u_' + cleanEmail.replace(/[^a-z0-9]/g, '_');
      const authU: AuthUser = { uid, email: cleanEmail, displayName: resolvedName };
      const userProf: UserProfile = {
        uid,
        name: resolvedName,
        email: cleanEmail,
        role: resolvedRole,
        createdAt: new Date().toISOString(),
        isOnline: true
      };

      setUser(authU);
      setProfile(userProf);
      localStorage.setItem('bahiaprev_supabase_session_user', JSON.stringify(authU));
      localStorage.setItem('bahiaprev_supabase_session_profile', JSON.stringify(userProf));
      await supabaseService.saveUser(userProf);
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
    const supabase = getSupabaseClient();

    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { name, role } }
        });
        if (!error && data?.user) {
          const uid = data.user.id;
          const authU: AuthUser = { uid, email: cleanEmail, displayName: name };
          const userProf: UserProfile = { uid, name, email: cleanEmail, role, createdAt: new Date().toISOString(), isOnline: true };
          setUser(authU);
          setProfile(userProf);
          localStorage.setItem('bahiaprev_supabase_session_user', JSON.stringify(authU));
          localStorage.setItem('bahiaprev_supabase_session_profile', JSON.stringify(userProf));
          await supabaseService.saveUser(userProf);
          await fetchUsers();
          setLoading(false);
          return;
        }
      }

      const uid = 'u_' + cleanEmail.replace(/[^a-z0-9]/g, '_');
      const authU: AuthUser = { uid, email: cleanEmail, displayName: name };
      const userProf: UserProfile = { uid, name, email: cleanEmail, role, createdAt: new Date().toISOString(), isOnline: true };
      setUser(authU);
      setProfile(userProf);
      localStorage.setItem('bahiaprev_supabase_session_user', JSON.stringify(authU));
      localStorage.setItem('bahiaprev_supabase_session_profile', JSON.stringify(userProf));
      await supabaseService.saveUser(userProf);
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
    const updated = {
      ...profile,
      name: data.name?.trim() || profile.name,
      role: data.role?.trim() || profile.role,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : profile.avatarUrl
    };
    setProfile(updated);
    localStorage.setItem('bahiaprev_supabase_session_profile', JSON.stringify(updated));
    await supabaseService.saveUser(updated);
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

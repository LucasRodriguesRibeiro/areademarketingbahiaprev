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
      const [teamRoles, dbUsers] = await Promise.all([
        supabaseService.fetchTeamRoles().catch(() => ({} as Record<string, string>)),
        supabaseService.fetchUsers().catch(() => null)
      ]);

      const defaults: Array<{ uid: string; name: string; email: string; defaultRole: string }> = [
        { uid: 'u_lucas_dev', name: 'Lucas Rodrigues', email: 'lucasrodrigues@bahiaprev.com.br', defaultRole: 'Analista de Marketing' },
        { uid: 'u_jairo_dir', name: 'Jairo Queiroz', email: 'jairoqueiroz@bahiaprev.com.br', defaultRole: 'Diretor' },
        { uid: 'u_cauan_des', name: 'Cauan', email: 'cauan@bahiaprev.com.br', defaultRole: 'Designer Gráfico' },
        { uid: 'u_nilton', name: 'Nilton', email: 'nilton@bahiaprev.com.br', defaultRole: 'Colaborador' },
        { uid: 'u_thayan', name: 'Thayan', email: 'thayan@bahiaprev.com.br', defaultRole: 'Colaborador' },
        { uid: 'u_vitor', name: 'Vitor', email: 'vitor@bahiaprev.com.br', defaultRole: 'Colaborador' },
        { uid: 'u_paulo', name: 'Paulo', email: 'paulo@bahiaprev.com.br', defaultRole: 'Colaborador' }
      ];

      const emailMap = new Map<string, UserProfile>();

      // 1. Seed defaults into map
      defaults.forEach(d => {
        const emailLower = d.email.toLowerCase();
        const effectiveRole = teamRoles[emailLower] || d.defaultRole;
        emailMap.set(emailLower, {
          uid: d.uid,
          name: d.name,
          email: d.email,
          role: effectiveRole,
          createdAt: new Date().toISOString(),
          isOnline: false,
          canPostFeed: true,
          canCreateTasks: true
        });
      });

      // 2. Overlay dbUsers (overwriting defaults where db record exists, but preserving teamRoles precedence)
      if (dbUsers && Array.isArray(dbUsers)) {
        dbUsers.forEach((u: any) => {
          const emailLower = (u.email || '').toLowerCase().trim();
          if (!emailLower || emailLower === 'marketing@bahiaprev.com.br') return;

          const effectiveRole = teamRoles[emailLower] || u.role || emailMap.get(emailLower)?.role || 'Colaborador';
          const existing = emailMap.get(emailLower);

          emailMap.set(emailLower, {
            uid: u.uid || existing?.uid || `u_${emailLower.replace(/[^a-z0-9]/g, '_')}`,
            name: (emailLower.includes('lucas') ? 'Lucas Rodrigues' : (u.name || existing?.name || (emailLower ? emailLower.split('@')[0] : 'Usuário'))),
            email: u.email || existing?.email || emailLower,
            role: effectiveRole,
            avatarUrl: u.avatarUrl || existing?.avatarUrl,
            createdAt: u.createdAt || u.lastSeen || existing?.createdAt || new Date().toISOString(),
            isOnline: u.isOnline !== undefined ? u.isOnline : existing?.isOnline,
            lastSeen: u.lastSeen || existing?.lastSeen,
            canPostFeed: u.canPostFeed !== undefined ? Boolean(u.canPostFeed) : true,
            canCreateTasks: u.canCreateTasks !== undefined ? Boolean(u.canCreateTasks) : true
          });
        });
      }

      const list = Array.from(emailMap.values());
      const map: Record<string, UserProfile> = {};
      list.forEach(p => {
        map[p.uid] = p;
        if (p.email) {
          map[p.email.toLowerCase()] = p;
        }
      });

      setAllUsers(list);
      setUsersMap(map);
      return list;
    } catch (err) {
      console.warn('Erro ao carregar usuários no Supabase:', err);
      return [];
    }
  };

  // Pre-seed system default users into Supabase 'users' table ONLY if table is empty
  useEffect(() => {
    const seedSystemUsers = async () => {
      try {
        // Clean up legacy marketing@bahiaprev.com.br duplicate from db if present
        await supabaseService.deleteUser('u_lucas_mkt').catch(() => {});

        const teamRoles = await supabaseService.fetchTeamRoles();
        const existingUsers = await supabaseService.fetchUsers();
        
        // Only seed if existing users table returned empty array
        if (existingUsers && existingUsers.length === 0) {
          const defaults = [
            { uid: 'u_lucas_dev', name: 'Lucas Rodrigues', email: 'lucasrodrigues@bahiaprev.com.br', role: teamRoles['lucasrodrigues@bahiaprev.com.br'] || 'Analista de Marketing' },
            { uid: 'u_jairo_dir', name: 'Jairo Queiroz', email: 'jairoqueiroz@bahiaprev.com.br', role: teamRoles['jairoqueiroz@bahiaprev.com.br'] || 'Diretor' },
            { uid: 'u_cauan_des', name: 'Cauan', email: 'cauan@bahiaprev.com.br', role: teamRoles['cauan@bahiaprev.com.br'] || 'Designer Gráfico' },
            { uid: 'u_nilton', name: 'Nilton', email: 'nilton@bahiaprev.com.br', role: teamRoles['nilton@bahiaprev.com.br'] || 'Colaborador' },
            { uid: 'u_thayan', name: 'Thayan', email: 'thayan@bahiaprev.com.br', role: teamRoles['thayan@bahiaprev.com.br'] || 'Colaborador' },
            { uid: 'u_vitor', name: 'Vitor', email: 'vitor@bahiaprev.com.br', role: teamRoles['vitor@bahiaprev.com.br'] || 'Colaborador' },
            { uid: 'u_paulo', name: 'Paulo', email: 'paulo@bahiaprev.com.br', role: teamRoles['paulo@bahiaprev.com.br'] || 'Colaborador' }
          ];

          for (const u of defaults) {
            await supabaseService.saveUser({ ...u, isOnline: false, lastSeen: new Date().toISOString() });
          }
        }
      } catch {}
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
          
          let cleanEmail = (parsedProf.email || '').toLowerCase().trim();
          if (cleanEmail === 'marketing@bahiaprev.com.br') {
            cleanEmail = 'lucasrodrigues@bahiaprev.com.br';
            parsedUser.email = 'lucasrodrigues@bahiaprev.com.br';
            parsedUser.displayName = 'Lucas Rodrigues';
            parsedProf.email = 'lucasrodrigues@bahiaprev.com.br';
            parsedProf.name = 'Lucas Rodrigues';
          }

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
      const teamRoles = await supabaseService.fetchTeamRoles();

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
            role: teamRoles[cleanEmail] || sbUser.user_metadata?.role || 'Colaborador',
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
      let resolvedRole = teamRoles[cleanEmail] || 'Colaborador';

      if (!teamRoles[cleanEmail]) {
        if (cleanEmail.includes('cauan')) {
          resolvedName = 'Cauan';
          resolvedRole = 'Designer Gráfico';
        } else if (cleanEmail.includes('jairo')) {
          resolvedName = 'Jairo Queiroz';
          resolvedRole = 'Diretor/Presidente';
        } else if (cleanEmail.includes('lucas') || cleanEmail === 'marketing@bahiaprev.com.br') {
          resolvedName = 'Lucas Rodrigues';
          resolvedRole = teamRoles[cleanEmail] || teamRoles['lucasrodrigues@bahiaprev.com.br'] || 'Analista de Marketing';
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
    const cleanRole = data.role?.trim() || profile.role;
    const updated = {
      ...profile,
      name: data.name?.trim() || profile.name,
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

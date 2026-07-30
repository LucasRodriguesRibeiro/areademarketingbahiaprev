import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

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

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  providerNotEnabled: boolean;
  allUsers: UserProfile[];
  usersMap: Record<string, UserProfile>;
  login: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAvatarUrl: (url: string) => Promise<void>;
  updateUserProfile: (data: { name?: string; role?: string; avatarUrl?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [providerNotEnabled, setProviderNotEnabled] = useState(false);

  useEffect(() => {
    // Auto-create/ensure initial system users exist (run once per browser)
    const ensureInitialUsers = async () => {
      if (localStorage.getItem('bahiaprev_users_initialized_v2')) {
        return;
      }

      const defaultUsers = [
        {
          email: 'marketing@bahiaprev.com.br',
          password: 'LucasLucas2020$',
          name: 'Lucas Rodrigues',
          role: 'Administrador'
        },
        {
          email: 'lucasrodrigues@bahiaprev.com.br',
          password: 'mkt@BP2025',
          name: 'Lucas Rodrigues',
          role: 'Administrador'
        },
        {
          email: 'jairoqueiroz@bahiaprev.com.br',
          password: 'mkt@BP2025',
          name: 'Jairo Queiroz',
          role: 'Diretor'
        },
        {
          email: 'cauan@bahiaprev.com.br',
          password: 'mkt@BP2025',
          name: 'Cauan',
          role: 'Designer Gráfico'
        }
      ];

      for (const u of defaultUsers) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, u.email, u.password);
          const firebaseUser = userCredential.user;
          
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            name: u.name,
            email: u.email,
            role: u.role,
            createdAt: new Date().toISOString()
          };

          // Save profile to Firestore
          await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
          console.log(`User ${u.email} created successfully!`);
        } catch (error: any) {
          if (error.code === 'auth/operation-not-allowed') {
            console.warn("E-mail/Password provider is not enabled in Firebase Console.");
            setProviderNotEnabled(true);
          } else if (error.code === 'auth/too-many-requests') {
            // Firebase rate limit hit due to repeated calls; mark as initialized to stop retrying
            localStorage.setItem('bahiaprev_users_initialized_v2', 'true');
            break;
          } else if (error.code !== 'auth/email-already-in-use') {
            console.warn(`Note on user auto-creation for ${u.email}:`, error?.message || error);
          }
        }
      }

      localStorage.setItem('bahiaprev_users_initialized_v2', 'true');
    };

    ensureInitialUsers();

    const getCorrectRole = (email?: string, name?: string, currentRole?: string) => {
      if (currentRole && currentRole.trim().length > 0) return currentRole;
      const e = (email || '').toLowerCase();
      const n = (name || '').toLowerCase();
      if (e.includes('cauan') || n.includes('cauan')) return 'Designer Gráfico';
      if (e.includes('jairo') || n.includes('jairo')) return 'Diretor/Presidente';
      if (e === 'marketing@bahiaprev.com.br' || e.includes('lucas')) return 'Analista de Marketing';
      return 'Colaborador';
    };

    let unsubsDoc: (() => void) | null = null;
    let unsubUsersColl: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (unsubsDoc) {
        unsubsDoc();
        unsubsDoc = null;
      }
      if (unsubUsersColl) {
        unsubUsersColl();
        unsubUsersColl = null;
      }

      if (firebaseUser) {
        // Shared single collection listener for all app components
        unsubUsersColl = onSnapshot(collection(db, 'users'), (snapshot) => {
          const list: UserProfile[] = [];
          const map: Record<string, UserProfile> = {};
          snapshot.docs.forEach((d) => {
            const data = d.data() as any;
            const p: UserProfile = {
              uid: d.id,
              name: data.name || (data.email ? data.email.split('@')[0] : 'Usuário'),
              email: data.email || '',
              role: data.role || 'Colaborador',
              avatarUrl: data.avatarUrl || undefined,
              createdAt: data.createdAt || new Date().toISOString(),
              isOnline: Boolean(data.isOnline),
              lastSeen: data.lastSeen,
              canPostFeed: data.canPostFeed,
              canCreateTasks: data.canCreateTasks
            };
            list.push(p);
            map[d.id] = p;
          });
          setAllUsers(list);
          setUsersMap(map);
        }, (err) => {
          console.warn('Error fetching shared users collection:', err);
        });

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Mark user as online in Firestore when session begins
        setDoc(userDocRef, { isOnline: true, lastSeen: new Date().toISOString() }, { merge: true }).catch(() => {});

        const handleUnload = () => {
          setDoc(userDocRef, { isOnline: false, lastSeen: new Date().toISOString() }, { merge: true }).catch(() => {});
        };
        window.addEventListener('beforeunload', handleUnload);
        
        unsubsDoc = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const uEmail = (firebaseUser.email || data.email || '').toLowerCase();
            
            let updatedName = data.name;
            let updatedRole = data.role;
            let needsUpdate = false;

            // Only set initial fallback defaults if field is missing or empty
            if (!updatedName) {
              if (uEmail.includes('cauan')) updatedName = 'Cauan';
              else if (uEmail.includes('jairo')) updatedName = 'Jairo Queiroz';
              else if (uEmail.includes('lucas') || uEmail === 'marketing@bahiaprev.com.br' || uEmail.includes('marketing')) updatedName = 'Lucas Rodrigues';
              else updatedName = firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Usuário');
              needsUpdate = true;
            }

            if (!updatedRole) {
              if (uEmail.includes('cauan')) updatedRole = 'Designer Gráfico';
              else if (uEmail.includes('jairo')) updatedRole = 'Diretor/Presidente';
              else if (uEmail.includes('lucas') || uEmail === 'marketing@bahiaprev.com.br' || uEmail.includes('marketing')) updatedRole = 'Analista de Marketing';
              else updatedRole = 'Colaborador';
              needsUpdate = true;
            }

            const canPostFeedCalculated = data.canPostFeed !== undefined
              ? data.canPostFeed
              : (uEmail.includes('lucas') || uEmail.includes('jairo') || uEmail === 'marketing@bahiaprev.com.br');

            const canCreateTasksCalculated = data.canCreateTasks !== undefined
              ? data.canCreateTasks
              : (uEmail.includes('lucas') || uEmail.includes('jairo') || uEmail === 'marketing@bahiaprev.com.br');

            const activeProfile: UserProfile = {
              ...data,
              uid: firebaseUser.uid,
              name: updatedName,
              email: firebaseUser.email || data.email || '',
              role: updatedRole,
              avatarUrl: data.avatarUrl || undefined,
              canPostFeed: canPostFeedCalculated,
              canCreateTasks: canCreateTasksCalculated
            };

            if (needsUpdate) {
              setDoc(userDocRef, { name: activeProfile.name, role: activeProfile.role, email: activeProfile.email }, { merge: true }).catch(console.error);
            }

            setProfile(activeProfile);
          } else {
            const uEmail = (firebaseUser.email || '').toLowerCase();
            let resolvedName = firebaseUser.displayName || 'Usuário';
            if (uEmail.includes('cauan')) resolvedName = 'Cauan';
            else if (uEmail.includes('jairo')) resolvedName = 'Jairo Queiroz';
            else if (uEmail.includes('lucas') || uEmail === 'marketing@bahiaprev.com.br' || uEmail.includes('marketing')) resolvedName = 'Lucas Rodrigues';
            else if (firebaseUser.email) resolvedName = firebaseUser.email.split('@')[0];

            const resolvedRole = getCorrectRole(uEmail, resolvedName);
            const initialProfile: UserProfile = {
              uid: firebaseUser.uid,
              name: resolvedName,
              email: firebaseUser.email || '',
              role: resolvedRole,
              isOnline: true,
              lastSeen: new Date().toISOString(),
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, initialProfile, { merge: true });
            setProfile(initialProfile);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user profile:", error);
          setLoading(false);
        });

        return () => {
          window.removeEventListener('beforeunload', handleUnload);
        };
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubsDoc) unsubsDoc();
      if (unsubUsersColl) unsubUsersColl();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (name: string, email: string, password: string, role: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        name,
        email,
        role,
        createdAt: new Date().toISOString()
      };

      // Save profile to Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
      setProfile(newProfile);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const updateAvatarUrl = async (url: string) => {
    if (!user) return;
    if (url && url.length > 800000) {
      throw new Error("A imagem é muito grande para o banco de dados. Escolha uma imagem menor.");
    }
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, { avatarUrl: url, updatedAt: new Date().toISOString() }, { merge: true });
    setProfile(prev => prev ? { ...prev, avatarUrl: url } : null);
  };

  const updateUserProfile = async (data: { name?: string; role?: string; avatarUrl?: string }) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const cleanData: Record<string, any> = {};
    if (data.name !== undefined && data.name !== null && data.name.trim()) {
      cleanData.name = data.name.trim();
    }
    if (data.role !== undefined && data.role !== null && data.role.trim()) {
      cleanData.role = data.role.trim();
    }
    if (data.avatarUrl !== undefined && data.avatarUrl !== null) {
      if (data.avatarUrl && data.avatarUrl.length > 800000) {
        throw new Error("A imagem é muito grande para o banco de dados. Escolha uma imagem menor.");
      }
      cleanData.avatarUrl = data.avatarUrl;
    }
    cleanData.updatedAt = new Date().toISOString();

    if (Object.keys(cleanData).length > 0) {
      await setDoc(userDocRef, cleanData, { merge: true });
      setProfile(prev => prev ? { ...prev, ...cleanData } : null);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (user) {
        await setDoc(doc(db, 'users', user.uid), { isOnline: false, lastSeen: new Date().toISOString() }, { merge: true });
      }
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, providerNotEnabled, allUsers, usersMap, login, signUp, logout, updateAvatarUrl, updateUserProfile }}>
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

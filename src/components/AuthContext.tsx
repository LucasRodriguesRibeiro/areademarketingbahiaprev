import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  createdAt: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  providerNotEnabled: boolean;
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
  const [loading, setLoading] = useState(true);
  const [providerNotEnabled, setProviderNotEnabled] = useState(false);

  useEffect(() => {
    // Auto-create/ensure initial system users exist
    const ensureInitialUsers = async () => {
      const defaultUsers = [
        {
          email: 'marketing@bahiaprev.com.br',
          password: 'LucasLucas2020$',
          name: 'Lucas',
          role: 'Administrador'
        },
        {
          email: 'lucasrodrigues@bahiaprev.com.br',
          password: 'mkt@BP2025',
          name: 'Lucas Rodrigues',
          role: 'Analista de Marketing'
        },
        {
          email: 'jairoqueiroz@bahiaprev.com.br',
          password: 'mkt@BP2025',
          name: 'Jairo Queiroz',
          role: 'Diretor'
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
          } else if (error.code !== 'auth/email-already-in-use') {
            console.error(`Auto-creation of user ${u.email}:`, error);
          }
        }
      }
    };

    ensureInitialUsers();

    const getCorrectRole = (email?: string, name?: string, currentRole?: string) => {
      const e = (email || '').toLowerCase();
      const n = (name || '').toLowerCase();
      if (e.includes('jairo') || n.includes('jairo')) return 'Diretor';
      if (e === 'marketing@bahiaprev.com.br') return 'Administrador';
      if (e.includes('lucasrodrigues')) return 'Analista de Marketing';
      if (currentRole && currentRole !== 'Colaborador') return currentRole;
      return currentRole || 'Colaborador';
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as UserProfile;
            const correctRole = getCorrectRole(data.email || firebaseUser.email || '', data.name || firebaseUser.displayName || '', data.role);
            if (data.role !== correctRole) {
              data.role = correctRole;
              await setDoc(userDocRef, { role: correctRole }, { merge: true });
            }
            setProfile(data);
          } else {
            // Fallback profile if Firestore doc doesn't exist yet
            const resolvedName = firebaseUser.displayName || (firebaseUser.email?.includes('jairo') ? 'Jairo Queiroz' : firebaseUser.email?.split('@')[0] || 'Usuário');
            const resolvedRole = getCorrectRole(firebaseUser.email || '', resolvedName);
            const initialProfile: UserProfile = {
              uid: firebaseUser.uid,
              name: resolvedName,
              email: firebaseUser.email || '',
              role: resolvedRole,
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, initialProfile, { merge: true });
            setProfile(initialProfile);
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, { avatarUrl: url }, { merge: true });
    setProfile(prev => prev ? { ...prev, avatarUrl: url } : null);
  };

  const updateUserProfile = async (data: { name?: string; role?: string; avatarUrl?: string }) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, data, { merge: true });
    setProfile(prev => prev ? { ...prev, ...data } : null);
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, providerNotEnabled, login, signUp, logout, updateAvatarUrl, updateUserProfile }}>
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

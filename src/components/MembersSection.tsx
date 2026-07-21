import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Users, Mail, CheckCircle2, Search, Briefcase, Camera } from 'lucide-react';
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
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const fetched: MemberProfile[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          uid: docSnap.id,
          name: data.name,
          email: data.email,
          role: data.role,
          avatarUrl: data.avatarUrl || getAvatarForMember(data.email, data.name),
          createdAt: data.createdAt
        };
      });

      if (fetched.length > 0) {
        // Merge demo members if not present in fetched
        const merged = [...fetched];
        DEMO_MEMBERS.forEach(demo => {
          if (!merged.some(m => m.email === demo.email)) {
            merged.push(demo);
          }
        });
        setMembers(merged);
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
  }, []);

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

                  {/* Cargo Badge */}
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 mb-2">
                    <Briefcase className="h-3 w-3 text-blue-500" />
                    <span className="truncate">{member.role}</span>
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

    </div>
  );
};

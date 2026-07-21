import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Users, Shield, Mail, CheckCircle2, Search, Briefcase, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface MemberProfile {
  uid: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export const MembersSection: React.FC = () => {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Static fallback list if Firestore only has 1 user currently
  const DEMO_MEMBERS: MemberProfile[] = [
    {
      uid: 'm-1',
      name: 'Lucas (Marketing)',
      email: 'marketing@bahiaprev.com.br',
      role: 'Administrador de Comunicação',
      createdAt: new Date().toISOString()
    },
    {
      uid: 'm-2',
      name: 'Atendimento Bahia Prev',
      email: 'atendimento@bahiaprev.com.br',
      role: 'Consultor de Relacionamento',
      createdAt: new Date().toISOString()
    },
    {
      uid: 'm-3',
      name: 'Gestão de Convênios',
      email: 'convenios@bahiaprev.com.br',
      role: 'Coordenador de Parcerias',
      createdAt: new Date().toISOString()
    }
  ];

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const fetched: MemberProfile[] = snapshot.docs.map(docSnap => ({
        uid: docSnap.id,
        ...docSnap.data()
      })) as MemberProfile[];

      // Merge fetched with fallback demo list if needed
      if (fetched.length > 0) {
        setMembers(fetched);
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
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header Box */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-2">
            <Users className="h-3.5 w-3.5" />
            <span>EQUIPE & COLABORADORES</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Membros Conectados no PrevHub
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            Diretório interno dos colaboradores e gestores autorizados no portal.
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
          <div className="h-8 w-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Carregando lista de colaboradores...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <motion.div
              key={member.uid}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all flex items-start gap-4"
            >
              <div className="h-12 w-12 rounded-full bg-slate-900 text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-sm">
                {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="font-bold text-slate-900 text-sm truncate">{member.name}</h3>
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                </div>
                <p className="text-xs font-semibold text-blue-600 truncate mb-2">{member.role}</p>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

    </div>
  );
};

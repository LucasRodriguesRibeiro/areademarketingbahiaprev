import React, { useState, useEffect, useRef } from 'react';
import { playNotificationSound } from '../utils/sound';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Trash2, 
  Filter, 
  Search, 
  Calendar, 
  AlertCircle, 
  CheckSquare, 
  Sparkles, 
  Tag, 
  Briefcase, 
  X,
  ListTodo,
  TrendingUp,
  User,
  ShieldCheck,
  Send,
  Users,
  UserCheck,
  Paperclip,
  FileText,
  Upload,
  Eye,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export interface Task {
  id: string;
  userId: string; // creator UID
  userEmail: string; // creator Email
  createdByName?: string; // creator Name
  title: string;
  description: string;
  category?: string;
  priority: 'baixa' | 'media' | 'alta';
  status: 'pendente' | 'em_andamento' | 'concluida';
  dueDate: string;
  createdAt?: string;
  createdByAdmin?: boolean;
  assignedToType: 'specific_user' | 'all' | 'me';
  assignedToName?: string;
  assignedToEmail?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  // Completion / Delivery fields
  completionAttachmentName?: string;
  completionAttachmentUrl?: string;
  completionAttachmentType?: string;
  completionNote?: string;
  completedAt?: string;
  completedByEmail?: string;
  completedByName?: string;
}

export interface MemberOption {
  uid: string;
  name: string;
  email: string;
  role: string;
}

const DEFAULT_MEMBERS: MemberOption[] = [
  {
    uid: 'm-lucas-mkt',
    name: 'Lucas Rodrigues',
    email: 'lucasrodrigues@bahiaprev.com.br',
    role: 'Administrador'
  },
  {
    uid: 'm-jairo',
    name: 'Jairo Queiroz',
    email: 'jairoqueiroz@bahiaprev.com.br',
    role: 'Diretor'
  }
];

export const TasksSection: React.FC = () => {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [collaborators, setCollaborators] = useState<MemberOption[]>(DEFAULT_MEMBERS);
  const [loading, setLoading] = useState(true);
  const knownTaskIdsRef = useRef<Set<string> | null>(null);
  
  // Filters and search
  const [statusFilter, setStatusFilter] = useState<'abertas' | 'atrasadas' | 'concluida'>('abertas');
  const [priorityFilter, setPriorityFilter] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserFilterForCompleted, setSelectedUserFilterForCompleted] = useState<string>('todos');

  // Modal for viewing task details and submitting completion delivery
  const [selectedTaskForView, setSelectedTaskForView] = useState<Task | null>(null);
  const [completionAttachmentFile, setCompletionAttachmentFile] = useState<{ name: string; url: string; type: string } | null>(null);
  const [completionNoteText, setCompletionNoteText] = useState<string>('');

  // Modal for new task
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'baixa' | 'media' | 'alta'>('media');
  const [newDueDate, setNewDueDate] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('me'); // 'me' | 'all' | email
  const [attachmentFile, setAttachmentFile] = useState<{ name: string; url: string; type: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCompletionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo de entrega deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCompletionAttachmentFile({
          name: file.name,
          url: event.target.result as string,
          type: file.type
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAttachmentFile({
          name: file.name,
          url: event.target.result as string,
          type: file.type
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const userRole = profile?.role || 'Colaborador';
  const userEmail = user?.email || 'colaborador@bahiaprev.com.br';
  const userId = user?.uid || 'guest';
  const userName = profile?.name || userEmail.split('@')[0];

  const isAdmin = 
    userRole.toLowerCase().includes('admin') || 
    userRole.toLowerCase().includes('diretor') || 
    userEmail === 'marketing@bahiaprev.com.br' ||
    userEmail === 'lucasrodrigues@bahiaprev.com.br' ||
    userEmail === 'jairoqueiroz@bahiaprev.com.br';

  // Fetch registered team members from Firestore
  useEffect(() => {
    const usersRef = collection(db, 'users');
    const unsubUsers = onSnapshot(usersRef, (snapshot) => {
      const map: Record<string, MemberOption> = {
        'lucas': {
          uid: 'm-lucas-mkt',
          name: 'Lucas Rodrigues',
          email: 'lucasrodrigues@bahiaprev.com.br',
          role: 'Administrador'
        },
        'jairo': {
          uid: 'm-jairo',
          name: 'Jairo Queiroz',
          email: 'jairoqueiroz@bahiaprev.com.br',
          role: 'Diretor'
        }
      };

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const email = (data.email || '').toLowerCase();
        const name = (data.name || '').toLowerCase();

        if (email.includes('lucas') || name.includes('lucas') || email === 'marketing@bahiaprev.com.br') {
          map['lucas'] = {
            uid: docSnap.id,
            name: 'Lucas Rodrigues',
            email: 'lucasrodrigues@bahiaprev.com.br',
            role: 'Administrador'
          };
        } else if (email.includes('jairo') || name.includes('jairo')) {
          map['jairo'] = {
            uid: docSnap.id,
            name: 'Jairo Queiroz',
            email: 'jairoqueiroz@bahiaprev.com.br',
            role: 'Diretor'
          };
        }
      });

      setCollaborators(Object.values(map));
    }, (err) => {
      console.warn('Error fetching collaborators list:', err);
      setCollaborators(DEFAULT_MEMBERS);
    });

    return () => unsubUsers();
  }, []);

  // Default initial tasks
  const getDefaultTasks = (): Task[] => {
    return [
      {
        id: 'def-1',
        userId: 'admin-1',
        userEmail: 'jairoqueiroz@bahiaprev.com.br',
        createdByName: 'Jairo Queiroz (Diretor)',
        title: 'Revisar arte promocional do novo convênio de saúde',
        description: 'Instrução do Diretor para o setor de Marketing: Ajustar as cores do banner e verificar se o logotipo do parceiro está correto.',
        category: 'Marketing',
        priority: 'alta',
        status: 'em_andamento',
        dueDate: new Date().toISOString().split('T')[0],
        createdByAdmin: true,
        assignedToType: 'specific_user',
        assignedToName: 'Lucas Rodrigues',
        assignedToEmail: 'lucasrodrigues@bahiaprev.com.br'
      },
      {
        id: 'def-2',
        userId: 'admin-2',
        userEmail: 'marketing@bahiaprev.com.br',
        createdByName: 'Lucas (Administrador)',
        title: 'Leitura obrigatória da Central de POPs Institucionais',
        description: 'Instrução para a equipe: Consultar o POP-INST-001 sobre o padrão de atendimento e ética do Bahia Prev.',
        category: 'Institucional',
        priority: 'media',
        status: 'pendente',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        createdByAdmin: true,
        assignedToType: 'all',
        assignedToName: 'Todos os Colaboradores',
        assignedToEmail: 'todos@bahiaprev.com.br'
      },
      {
        id: 'def-3',
        userId: userId,
        userEmail: userEmail,
        createdByName: `${userName} (${userRole})`,
        title: 'Atualizar dados de perfil e foto no Bahia Prev Hub',
        description: 'Manter foto recente e telefone de contato atualizados no mural de membros.',
        category: 'Perfil',
        priority: 'baixa',
        status: 'concluida',
        dueDate: new Date().toISOString().split('T')[0],
        assignedToType: 'me',
        assignedToName: userName,
        assignedToEmail: userEmail
      }
    ];
  };

  // Sync tasks from Firestore
  useEffect(() => {
    setLoading(true);
    let unsubscribe: () => void = () => {};

    try {
      const tasksRef = collection(db, 'user_tasks');

      unsubscribe = onSnapshot(
        tasksRef,
        (snapshot) => {
          const loaded: Task[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const taskCreatorEmail = data.userEmail || '';
            const assignedType = data.assignedToType || (data.assignedTo === 'all' ? 'all' : 'me');
            const assignedEmail = data.assignedToEmail || '';
            const assignedName = data.assignedToName || '';

            // Filter logic: show task if it's sent to 'all', or directed to this user, or created by this user, or if current user is admin
            const isTargetedToUser = 
              assignedType === 'all' || 
              assignedEmail.toLowerCase() === userEmail.toLowerCase() ||
              assignedName.toLowerCase().includes(userName.toLowerCase()) ||
              taskCreatorEmail.toLowerCase() === userEmail.toLowerCase() ||
              data.userId === userId ||
              isAdmin;

            if (isTargetedToUser) {
              loaded.push({
                id: docSnap.id,
                userId: data.userId || '',
                userEmail: taskCreatorEmail,
                createdByName: data.createdByName || 'Colaborador',
                title: data.title || '',
                description: data.description || '',
                category: data.category || 'Geral',
                priority: data.priority || 'media',
                status: data.status || 'pendente',
                dueDate: data.dueDate || '',
                createdByAdmin: data.createdByAdmin || false,
                assignedToType: assignedType,
                assignedToName: assignedName || (assignedType === 'all' ? 'Todos os Colaboradores' : userName),
                assignedToEmail: assignedEmail || userEmail,
                attachmentName: data.attachmentName || undefined,
                attachmentUrl: data.attachmentUrl || undefined,
                attachmentType: data.attachmentType || undefined,
                completionAttachmentName: data.completionAttachmentName || undefined,
                completionAttachmentUrl: data.completionAttachmentUrl || undefined,
                completionAttachmentType: data.completionAttachmentType || undefined,
                completionNote: data.completionNote || undefined,
                completedAt: data.completedAt || undefined,
                completedByEmail: data.completedByEmail || undefined,
                completedByName: data.completedByName || undefined,
                createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
              });
            }
          });

          // Sound notification check for new tasks arriving in real time
          if (knownTaskIdsRef.current === null) {
            knownTaskIdsRef.current = new Set(loaded.map((t) => t.id));
          } else {
            const hasNewTask = loaded.some((t) => !knownTaskIdsRef.current!.has(t.id));
            if (hasNewTask) {
              playNotificationSound('task');
            }
            knownTaskIdsRef.current = new Set(loaded.map((t) => t.id));
          }

          if (loaded.length === 0) {
            setTasks(getDefaultTasks());
          } else {
            setTasks(loaded);
          }
          setLoading(false);
        },
        (error) => {
          console.warn('Firestore tasks listener fallback to defaults:', error);
          const saved = localStorage.getItem(`tasks_v2_${userId}`);
          if (saved) {
            try {
              setTasks(JSON.parse(saved));
            } catch (e) {
              setTasks(getDefaultTasks());
            }
          } else {
            setTasks(getDefaultTasks());
          }
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn('Error setting up tasks snapshot listener:', err);
      setTasks(getDefaultTasks());
      setLoading(false);
    }

    return () => unsubscribe();
  }, [userId, userEmail, userName, userRole, isAdmin]);

  // Local storage backup persistence
  const saveTasksLocally = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    if (userId) {
      localStorage.setItem(`tasks_v2_${userId}`, JSON.stringify(updatedTasks));
    }
  };

  // Handle Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !newTitle.trim()) return;

    setSubmitting(true);

    let assignedType: 'specific_user' | 'all' | 'me' = 'me';
    let assignedName = userName;
    let assignedEmail = userEmail;

    if (selectedRecipient === 'all') {
      assignedType = 'all';
      assignedName = 'Todos os Colaboradores';
      assignedEmail = 'todos@bahiaprev.com.br';
    } else if (selectedRecipient !== 'me') {
      assignedType = 'specific_user';
      const targetMember = collaborators.find(c => c.email === selectedRecipient);
      if (targetMember) {
        assignedName = targetMember.name;
        assignedEmail = targetMember.email;
      } else {
        assignedName = selectedRecipient;
        assignedEmail = selectedRecipient;
      }
    }

    const newTaskData: Omit<Task, 'id'> = {
      userId,
      userEmail,
      createdByName: `${userName} (${userRole})`,
      title: newTitle.trim(),
      description: newDescription.trim(),
      category: 'Geral',
      priority: newPriority,
      status: 'pendente',
      dueDate: newDueDate || new Date().toISOString().split('T')[0],
      createdByAdmin: isAdmin,
      assignedToType: assignedType,
      assignedToName: assignedName,
      assignedToEmail: assignedEmail,
      ...(attachmentFile ? {
        attachmentName: attachmentFile.name,
        attachmentUrl: attachmentFile.url,
        attachmentType: attachmentFile.type,
      } : {})
    };

    try {
      const docRef = await addDoc(collection(db, 'user_tasks'), {
        ...newTaskData,
        createdAt: serverTimestamp(),
      });

      const createdTask: Task = {
        ...newTaskData,
        id: docRef.id,
      };
      saveTasksLocally([createdTask, ...tasks]);
      playNotificationSound('task');
    } catch (err) {
      console.warn('Could not save to Firestore, saving locally:', err);
      const offlineTask: Task = {
        ...newTaskData,
        id: 'local-' + Date.now(),
      };
      saveTasksLocally([offlineTask, ...tasks]);
      playNotificationSound('task');
    } finally {
      setSubmitting(false);
      setNewTitle('');
      setNewDescription('');
      setNewDueDate('');
      setSelectedRecipient('me');
      setAttachmentFile(null);
      setIsModalOpen(false);
    }
  };

  // Handle Toggle Status (Pendente -> Em Andamento -> Concluída -> Pendente)
  const handleToggleStatus = async (task: Task) => {
    let nextStatus: 'pendente' | 'em_andamento' | 'concluida';
    if (task.status === 'pendente') nextStatus = 'em_andamento';
    else if (task.status === 'em_andamento') nextStatus = 'concluida';
    else nextStatus = 'pendente';

    const updatePayload: Partial<Task> = {
      status: nextStatus,
    };

    if (nextStatus === 'concluida') {
      updatePayload.completedAt = new Date().toISOString();
      updatePayload.completedByEmail = userEmail;
      updatePayload.completedByName = userName;
    }

    const updated = tasks.map((t) => t.id === task.id ? { ...t, ...updatePayload } : t);
    saveTasksLocally(updated);

    if (selectedTaskForView?.id === task.id) {
      setSelectedTaskForView({ ...selectedTaskForView, ...updatePayload });
    }

    if (!task.id.startsWith('def-') && !task.id.startsWith('local-')) {
      try {
        await updateDoc(doc(db, 'user_tasks', task.id), updatePayload);
      } catch (err) {
        console.warn('Error updating task status in Firestore:', err);
      }
    }
  };

  // Handle Save Completion Delivery with attachment and note
  const handleSaveCompletionDelivery = async (task: Task) => {
    const updatePayload: Partial<Task> = {
      status: 'concluida',
      completedAt: new Date().toISOString(),
      completedByEmail: userEmail,
      completedByName: userName,
    };

    if (completionAttachmentFile) {
      updatePayload.completionAttachmentName = completionAttachmentFile.name;
      updatePayload.completionAttachmentUrl = completionAttachmentFile.url;
      updatePayload.completionAttachmentType = completionAttachmentFile.type;
    }
    if (completionNoteText.trim()) {
      updatePayload.completionNote = completionNoteText.trim();
    }

    const updatedTasks = tasks.map((t) => (t.id === task.id ? { ...t, ...updatePayload } : t));
    saveTasksLocally(updatedTasks);

    if (selectedTaskForView?.id === task.id) {
      setSelectedTaskForView({ ...selectedTaskForView, ...updatePayload });
    }

    setCompletionAttachmentFile(null);
    setCompletionNoteText('');

    if (!task.id.startsWith('def-') && !task.id.startsWith('local-')) {
      try {
        await updateDoc(doc(db, 'user_tasks', task.id), updatePayload);
      } catch (err) {
        console.warn('Error saving completion delivery in Firestore:', err);
      }
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    saveTasksLocally(updated);

    if (!taskId.startsWith('def-') && !taskId.startsWith('local-')) {
      try {
        await deleteDoc(doc(db, 'user_tasks', taskId));
      } catch (err) {
        console.warn('Error deleting task in Firestore:', err);
      }
    }
  };

  // Overdue calculation helper
  const todayStr = new Date().toISOString().split('T')[0];
  const isTaskOverdue = (task: Task) => {
    if (task.status === 'concluida') return false;
    if (!task.dueDate) return false;
    return task.dueDate < todayStr;
  };

  // Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'concluida').length;
  const overdueTasksCount = tasks.filter((t) => isTaskOverdue(t)).length;
  const openTasksCount = tasks.filter((t) => t.status !== 'concluida' && !isTaskOverdue(t)).length;

  // Completed Tasks User List Grouping
  const completedUsersMap: Record<string, { name: string; email: string; count: number }> = {};
  tasks.filter(t => t.status === 'concluida').forEach(t => {
    const name = t.completedByName || t.assignedToName || 'Colaborador';
    const email = t.completedByEmail || t.assignedToEmail || name;
    const key = email.toLowerCase();
    if (!completedUsersMap[key]) {
      completedUsersMap[key] = { name, email, count: 0 };
    }
    completedUsersMap[key].count += 1;
  });
  const completedUsersList = Object.values(completedUsersMap);

  // Filtered Tasks
  const filteredTasks = tasks.filter((task) => {
    const overdue = isTaskOverdue(task);

    const matchesStatus = 
      statusFilter === 'abertas' ? (task.status !== 'concluida' && !overdue) :
      statusFilter === 'atrasadas' ? overdue :
      statusFilter === 'concluida' ? (task.status === 'concluida') :
      true;

    const matchesPriority = priorityFilter === 'todas' || task.priority === priorityFilter;
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.category && task.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.assignedToName && task.assignedToName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.createdByName && task.createdByName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesUserCompletedFilter = 
      statusFilter !== 'concluida' ||
      selectedUserFilterForCompleted === 'todos' ||
      task.assignedToEmail?.toLowerCase() === selectedUserFilterForCompleted.toLowerCase() ||
      task.completedByEmail?.toLowerCase() === selectedUserFilterForCompleted.toLowerCase() ||
      task.assignedToName?.toLowerCase().includes(selectedUserFilterForCompleted.toLowerCase()) ||
      task.completedByName?.toLowerCase().includes(selectedUserFilterForCompleted.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch && matchesUserCompletedFilter;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
            <ListTodo className="h-4 w-4 text-blue-400" />
            <span>PAINEL DE TAREFAS NOMINAIS E GERAIS</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Minhas Tarefas & Atribuições Nominais
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed">
            Envie e acompanhe tarefas atribuídas diretamente pelo nome do colaborador ou para toda a equipe do Bahia Prev.
          </p>

          {/* User Role Badge */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 flex items-center gap-2 text-xs font-bold text-white">
              <User className="h-4 w-4 text-cyan-400" />
              <span>Conectado como: <strong className="text-amber-300">{userName}</strong> ({userRole})</span>
            </div>

            {isAdmin && (
              <div className="bg-amber-500/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-400/30 flex items-center gap-2 text-xs font-bold text-amber-200">
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                <span>Gestão: Atribua tarefas com o nome do colaborador selecionado</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress & Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Total Abertas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider block">
              Tarefas Abertas
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {openTasksCount}
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 2: Atrasadas */}
        <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-red-600 uppercase tracking-wider block">
              Atrasadas
            </span>
            <span className="text-2xl font-black text-red-600 mt-1 block">
              {overdueTasksCount}
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center font-bold">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 3: Concluídas */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider block">
              Concluídas
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {completedTasks}
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Action Bar: Search, Filters & New Task Button */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, colaborador responsável ou criador..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setStatusFilter('abertas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'abertas'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Abertas ({openTasksCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('atrasadas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'atrasadas'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            <span>Atrasadas ({overdueTasksCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('concluida')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'concluida'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Concluídas ({completedTasks})</span>
          </button>
        </div>

        {/* Add New Task Button - Admin Only */}
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Criar / Atribuir Tarefa</span>
          </button>
        )}
      </div>

      {/* Sub-bar for Completed Tasks: Filter by User List */}
      {statusFilter === 'concluida' && (
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-900 uppercase tracking-wider">
              <Users className="h-4 w-4 text-emerald-600" />
              <span>Lista de Usuários com Tarefas Concluídas</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              {completedTasks} tarefa(s) finalizada(s)
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedUserFilterForCompleted('todos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedUserFilterForCompleted === 'todos'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-emerald-100/50'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Todos os Usuários ({completedTasks})</span>
            </button>

            {completedUsersList.map((usr) => (
              <button
                key={usr.email || usr.name}
                onClick={() => setSelectedUserFilterForCompleted(usr.email || usr.name)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedUserFilterForCompleted.toLowerCase() === (usr.email || usr.name).toLowerCase()
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-emerald-100/50'
                }`}
              >
                <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>{usr.name} ({usr.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const isAssignedToMe = task.assignedToEmail?.toLowerCase() === userEmail.toLowerCase() || task.assignedToName?.toLowerCase().includes(userName.toLowerCase());
            const overdue = isTaskOverdue(task);

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl p-5 border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  task.status === 'concluida'
                    ? 'border-emerald-200 bg-emerald-50/20 opacity-80'
                    : overdue
                    ? 'border-red-300 bg-red-50/20 shadow-sm ring-1 ring-red-400/30'
                    : isAssignedToMe
                    ? 'border-blue-300 bg-blue-50/20 shadow-md ring-1 ring-blue-400/30'
                    : 'border-slate-200/80 shadow-sm hover:border-blue-200'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Status Toggle Button */}
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className="mt-0.5 shrink-0 transition-transform active:scale-90 cursor-pointer"
                    title="Clique para alterar status"
                  >
                    {task.status === 'concluida' ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-500 fill-emerald-100" />
                    ) : task.status === 'em_andamento' ? (
                      <Clock className="h-6 w-6 text-amber-500" />
                    ) : (
                      <Circle className="h-6 w-6 text-slate-300 hover:text-blue-500" />
                    )}
                  </button>

                  {/* Task Details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        onClick={() => setSelectedTaskForView(task)}
                        className={`font-extrabold text-sm text-slate-900 leading-snug cursor-pointer hover:text-blue-600 transition-colors ${
                          task.status === 'concluida' ? 'line-through text-slate-400' : ''
                        }`}
                        title="Clique para abrir detalhes da tarefa"
                      >
                        {task.title}
                      </h4>

                      {/* Recipient Badge */}
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1 shadow-xs ${
                        task.assignedToType === 'all'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : isAssignedToMe
                          ? 'bg-blue-100 text-blue-900 border-blue-300 font-extrabold'
                          : 'bg-slate-100 text-slate-800 border-slate-300'
                      }`}>
                        <UserCheck className="h-3 w-3 text-blue-600" />
                        <span>Destinado a: <strong>{task.assignedToName || 'Colaborador'}</strong></span>
                      </span>

                      {/* Priority Badge */}
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                        task.priority === 'alta'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : task.priority === 'media'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        {task.priority === 'alta' ? 'Alta' : task.priority === 'media' ? 'Média' : 'Baixa'}
                      </span>
                    </div>

                    {task.description && (
                      <p
                        onClick={() => setSelectedTaskForView(task)}
                        className={`text-xs text-slate-600 leading-relaxed cursor-pointer hover:text-slate-900 transition-colors ${
                          task.status === 'concluida' ? 'line-through text-slate-400' : ''
                        }`}
                        title="Clique para abrir detalhes"
                      >
                        {task.description}
                      </p>
                    )}

                    {/* Attachments Links (Initial & Completion) */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {task.attachmentUrl && (
                        <a
                          href={task.attachmentUrl}
                          download={task.attachmentName || 'documento_anexo'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold text-blue-700 transition-colors shadow-2xs"
                          title="Documento anexado no envio da tarefa"
                        >
                          <Paperclip className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span className="truncate max-w-[200px]">Anexo Inicial: {task.attachmentName || 'Documento'}</span>
                        </a>
                      )}

                      {task.completionAttachmentUrl && (
                        <a
                          href={task.completionAttachmentUrl}
                          download={task.completionAttachmentName || 'documento_entrega'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-black text-emerald-800 transition-colors shadow-2xs"
                          title="Clique para baixar o documento entregue pelo colaborador"
                        >
                          <Paperclip className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[200px]">Anexo Conclusão: {task.completionAttachmentName || 'Entrega'}</span>
                        </a>
                      )}
                    </div>

                    {/* Creator & Due Date Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-0.5">
                      {task.createdByName && (
                        <span className="font-medium text-slate-600 flex items-center gap-1">
                          <User className="h-3 w-3 text-slate-400" />
                          <span>Enviado por: <strong>{task.createdByName}</strong></span>
                        </span>
                      )}

                      {task.status === 'concluida' && task.completedByName && (
                        <span className="font-bold text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Concluído por: {task.completedByName}</span>
                        </span>
                      )}

                      {task.dueDate && (
                        <span className={`flex items-center gap-1 ${
                          overdue ? 'text-red-600 font-extrabold bg-red-50 px-2 py-0.5 rounded-lg border border-red-200' : 'text-slate-500'
                        }`}>
                          {overdue ? <AlertCircle className="h-3 w-3 text-red-600" /> : <Calendar className="h-3 w-3" />}
                          <span>Prazo: {task.dueDate.split('-').reverse().join('/')} {overdue ? '(Atrasada)' : ''}</span>
                        </span>
                      )}

                      <span className={`font-bold ${
                        task.status === 'concluida'
                          ? 'text-emerald-600'
                          : task.status === 'em_andamento'
                          ? 'text-amber-600'
                          : 'text-slate-500'
                      }`}>
                        • Status: {task.status === 'concluida' ? 'Concluída' : task.status === 'em_andamento' ? 'Em Andamento' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => setSelectedTaskForView(task)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                    title="Abrir tarefa e ver detalhes"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Abrir</span>
                  </button>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
            <CheckSquare className="h-10 w-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800 text-base">Nenhuma tarefa encontrada neste filtro</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Todas as tarefas atribuídas ao seu nome ou para a equipe aparecem aqui.
            </p>
            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Criar / Atribuir Nova Tarefa
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal Nova Tarefa com Seleção Nominal de Colaborador (Apenas Admin) */}
      <AnimatePresence>
        {isModalOpen && isAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-8 shadow-2xl border border-slate-200/80 relative space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Atribuir Nova Tarefa
                  </h3>
                  <p className="text-xs text-slate-500">
                    Selecione o nome do colaborador destinatário ou envie para toda a equipe
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                
                {/* Seleção de Colaborador Destinatário pelo Nome */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 space-y-2">
                  <label className="block text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-blue-600" />
                    <span>Colaborador Destinatário (Nome) *</span>
                  </label>

                  <select
                    value={selectedRecipient}
                    onChange={(e) => setSelectedRecipient(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="me">👤 Mim mesmo ({userName})</option>
                    <option value="all">👥 Todos os Colaboradores (Geral)</option>
                    
                    <optgroup label="Selecione o Colaborador por Nome:">
                      {collaborators.map((member) => (
                        <option key={member.email} value={member.email}>
                          👤 {member.name} — ({member.role || 'Colaborador'})
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  <p className="text-[11px] text-slate-500 leading-tight">
                    A tarefa será direcionada com o nome do colaborador selecionado no painel de controle.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título da Tarefa *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Elaborar relatório de vendas ou Revisar POP"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Descrição Detalhada / Instruções
                  </label>
                  <textarea
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Instruções específicas para o colaborador realizar a tarefa..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Prioridade
                    </label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as 'baixa' | 'media' | 'alta')}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Paperclip className="h-3.5 w-3.5 text-blue-600" />
                      <span>Anexar Documento</span>
                    </label>
                    {attachmentFile ? (
                      <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                        <span className="truncate max-w-[110px] font-bold" title={attachmentFile.name}>
                          {attachmentFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAttachmentFile(null)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-blue-100 cursor-pointer"
                          title="Remover anexo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 border border-dashed border-slate-300 hover:border-blue-500 rounded-xl text-xs font-bold text-slate-600 hover:text-blue-600 cursor-pointer transition-colors h-[38px]">
                        <Paperclip className="h-4 w-4 text-blue-600" />
                        <span>Anexar Arquivo</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.ppt,.pptx"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data Limite (Prazo Final)
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !newTitle.trim()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{submitting ? 'Atribuindo...' : 'Atribuir Tarefa'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal para Visualizar Detalhes da Tarefa Atribuída */}
      <AnimatePresence>
        {selectedTaskForView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative space-y-6 max-h-[90vh] overflow-y-auto text-left"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 inline-block">
                    Detalhes da Tarefa Atribuída
                  </span>
                  <h3 className="text-xl font-black text-slate-900 leading-snug pt-1">
                    {selectedTaskForView.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTaskForView(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Status and Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Priority */}
                <span className={`text-xs font-black px-3 py-1 rounded-lg uppercase ${
                  selectedTaskForView.priority === 'alta'
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : selectedTaskForView.priority === 'media'
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  Prioridade: {selectedTaskForView.priority === 'alta' ? 'Alta' : selectedTaskForView.priority === 'media' ? 'Média' : 'Baixa'}
                </span>

                {/* Status */}
                <span className={`text-xs font-black px-3 py-1 rounded-lg ${
                  selectedTaskForView.status === 'concluida'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : selectedTaskForView.status === 'em_andamento'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  Status: {selectedTaskForView.status === 'concluida' ? 'Concluída' : selectedTaskForView.status === 'em_andamento' ? 'Em Andamento' : 'Pendente'}
                </span>

                {/* Destinado a */}
                <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                  <span>Para: <strong>{selectedTaskForView.assignedToName || 'Colaborador'}</strong></span>
                </span>
              </div>

              {/* Metadata Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs text-slate-600">
                {selectedTaskForView.createdByName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Enviado por: <strong className="text-slate-800">{selectedTaskForView.createdByName}</strong></span>
                  </div>
                )}
                {selectedTaskForView.dueDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Prazo Final: <strong className="text-slate-800">{selectedTaskForView.dueDate.split('-').reverse().join('/')}</strong></span>
                  </div>
                )}
              </div>

              {/* Description / Instructions */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>Descrição e Instruções Escritas</span>
                </h4>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-medium max-h-60 overflow-y-auto">
                  {selectedTaskForView.description || 'Nenhuma instrução adicional gravada para esta tarefa.'}
                </div>
              </div>

              {/* Attachment Download Box (if initial attachment exists) */}
              {selectedTaskForView.attachmentUrl && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="h-4 w-4 text-blue-600" />
                    <span>Documento Anexo Inicial</span>
                  </h4>
                  <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-blue-600 text-white rounded-xl shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate" title={selectedTaskForView.attachmentName}>
                          {selectedTaskForView.attachmentName || 'Documento Anexo'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Arquivo anexado ao criar a tarefa
                        </p>
                      </div>
                    </div>
                    <a
                      href={selectedTaskForView.attachmentUrl}
                      download={selectedTaskForView.attachmentName || 'documento_anexo'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      <Download className="h-4 w-4" />
                      <span>Baixar Anexo Inicial</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Completion Delivery Box (if delivered document or note exists) */}
              {(selectedTaskForView.completionAttachmentUrl || selectedTaskForView.completionNote || selectedTaskForView.completedByName) && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Entrega e Comprovante de Conclusão</span>
                  </h4>

                  <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3">
                    {selectedTaskForView.completedByName && (
                      <p className="text-xs text-emerald-900 font-bold">
                        Entregue por: <strong className="text-slate-900">{selectedTaskForView.completedByName}</strong>
                        {selectedTaskForView.completedAt && (
                          <span className="font-normal text-emerald-700"> em {new Date(selectedTaskForView.completedAt).toLocaleString('pt-BR')}</span>
                        )}
                      </p>
                    )}

                    {selectedTaskForView.completionNote && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-emerald-800 uppercase">Observação de Entrega:</span>
                        <p className="text-xs text-slate-800 bg-white/90 p-3 rounded-xl border border-emerald-100 leading-relaxed font-medium">
                          "{selectedTaskForView.completionNote}"
                        </p>
                      </div>
                    )}

                    {selectedTaskForView.completionAttachmentUrl && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate" title={selectedTaskForView.completionAttachmentName}>
                              {selectedTaskForView.completionAttachmentName || 'Documento de Entrega'}
                            </p>
                            <p className="text-[11px] text-emerald-700">
                              Anexo enviado no término da tarefa
                            </p>
                          </div>
                        </div>
                        <a
                          href={selectedTaskForView.completionAttachmentUrl}
                          download={selectedTaskForView.completionAttachmentName || 'documento_entregue'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
                        >
                          <Download className="h-4 w-4" />
                          <span>Baixar Documento Entregue</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form to Attach Document and Deliver Completion */}
              <div className="space-y-3 pt-2 border-t border-slate-100 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="h-4 w-4 text-blue-600" />
                  <span>Anexar Documento de Entrega / Resposta</span>
                </h4>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Anexe o documento final ou relatório de conclusão para enviar a tarefa entregue ao criador.
                </p>

                <div className="space-y-2">
                  <input
                    type="file"
                    id="completion-file-input"
                    onChange={handleCompletionFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="completion-file-input"
                    className="w-full px-4 py-2.5 bg-white border border-dashed border-slate-300 hover:border-blue-500 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Paperclip className="h-4 w-4 text-blue-600" />
                    <span className="truncate">{completionAttachmentFile ? completionAttachmentFile.name : 'Clique para escolher documento de entrega (PDF, Imagem, Doc)'}</span>
                  </label>

                  {completionAttachmentFile && (
                    <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                      <span className="truncate font-bold">{completionAttachmentFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setCompletionAttachmentFile(null)}
                        className="text-red-500 hover:text-red-700 font-black px-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <textarea
                    value={completionNoteText}
                    onChange={(e) => setCompletionNoteText(e.target.value)}
                    placeholder="Escreva uma observação de entrega (opcional)..."
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />

                  {(completionAttachmentFile || completionNoteText) && (
                    <button
                      type="button"
                      onClick={() => handleSaveCompletionDelivery(selectedTaskForView)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Enviar Anexo de Entrega & Concluir Tarefa</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleStatus(selectedTaskForView);
                      const nextStatus = selectedTaskForView.status === 'concluida' ? 'pendente' : selectedTaskForView.status === 'em_andamento' ? 'concluida' : 'em_andamento';
                      setSelectedTaskForView({ ...selectedTaskForView, status: nextStatus });
                    }}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                      selectedTaskForView.status === 'concluida'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : selectedTaskForView.status === 'em_andamento'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      {selectedTaskForView.status === 'concluida'
                        ? 'Reabrir Tarefa'
                        : selectedTaskForView.status === 'em_andamento'
                        ? 'Marcar como Concluída'
                        : 'Iniciar Tarefa'}
                    </span>
                  </button>

                  {(isAdmin || selectedTaskForView.userId === userId || selectedTaskForView.userEmail === userEmail) && (
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteTask(selectedTaskForView.id);
                        setSelectedTaskForView(null);
                      }}
                      className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-red-200"
                      title="Excluir esta tarefa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTaskForView(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

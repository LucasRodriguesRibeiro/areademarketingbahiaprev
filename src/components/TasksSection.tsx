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
  UserCheck
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
  category: string;
  priority: 'baixa' | 'media' | 'alta';
  status: 'pendente' | 'em_andamento' | 'concluida';
  dueDate: string;
  createdAt?: string;
  createdByAdmin?: boolean;
  assignedToType: 'specific_user' | 'all' | 'me';
  assignedToName?: string;
  assignedToEmail?: string;
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
    role: 'Analista de Marketing'
  },
  {
    uid: 'm-jairo',
    name: 'Jairo Queiroz',
    email: 'jairoqueiroz@bahiaprev.com.br',
    role: 'Diretor'
  },
  {
    uid: 'm-admin',
    name: 'Lucas',
    email: 'marketing@bahiaprev.com.br',
    role: 'Administrador do Sistema'
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

  // Modal for new task
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Geral');
  const [newPriority, setNewPriority] = useState<'baixa' | 'media' | 'alta'>('media');
  const [newDueDate, setNewDueDate] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('me'); // 'me' | 'all' | email
  const [submitting, setSubmitting] = useState(false);

  const userRole = profile?.role || 'Colaborador';
  const userEmail = user?.email || 'colaborador@bahiaprev.com.br';
  const userId = user?.uid || 'guest';
  const userName = profile?.name || userEmail.split('@')[0];

  const isAdmin = 
    userRole.toLowerCase().includes('admin') || 
    userRole.toLowerCase().includes('diretor') || 
    userEmail === 'marketing@bahiaprev.com.br' ||
    userEmail === 'jairoqueiroz@bahiaprev.com.br';

  // Fetch registered team members from Firestore
  useEffect(() => {
    const usersRef = collection(db, 'users');
    const unsubUsers = onSnapshot(usersRef, (snapshot) => {
      const fetched: MemberOption[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          uid: docSnap.id,
          name: data.name || data.email?.split('@')[0] || 'Colaborador',
          email: data.email || '',
          role: data.role || 'Colaborador'
        };
      });

      if (fetched.length > 0) {
        const merged = [...fetched];
        DEFAULT_MEMBERS.forEach(defMember => {
          if (!merged.some(m => m.email === defMember.email)) {
            merged.push(defMember);
          }
        });
        setCollaborators(merged);
      } else {
        setCollaborators(DEFAULT_MEMBERS);
      }
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
        title: 'Atualizar dados de perfil e foto no PrevHub',
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
      category: newCategory.trim() || 'Geral',
      priority: newPriority,
      status: 'pendente',
      dueDate: newDueDate || new Date().toISOString().split('T')[0],
      createdByAdmin: isAdmin,
      assignedToType: assignedType,
      assignedToName: assignedName,
      assignedToEmail: assignedEmail,
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
      setIsModalOpen(false);
    }
  };

  // Handle Toggle Status (Pendente -> Em Andamento -> Concluída -> Pendente)
  const handleToggleStatus = async (task: Task) => {
    let nextStatus: 'pendente' | 'em_andamento' | 'concluida';
    if (task.status === 'pendente') nextStatus = 'em_andamento';
    else if (task.status === 'em_andamento') nextStatus = 'concluida';
    else nextStatus = 'pendente';

    const updated = tasks.map((t) => t.id === task.id ? { ...t, status: nextStatus } : t);
    saveTasksLocally(updated);

    if (!task.id.startsWith('def-') && !task.id.startsWith('local-')) {
      try {
        await updateDoc(doc(db, 'user_tasks', task.id), { status: nextStatus });
      } catch (err) {
        console.warn('Error updating task status in Firestore:', err);
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
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
      task.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.assignedToName && task.assignedToName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.createdByName && task.createdByName.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesPriority && matchesSearch;
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
                      <h4 className={`font-extrabold text-sm text-slate-900 leading-snug ${
                        task.status === 'concluida' ? 'line-through text-slate-400' : ''
                      }`}>
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

                      {/* Category Tag */}
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {task.category}
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
                      <p className={`text-xs text-slate-600 leading-relaxed ${
                        task.status === 'concluida' ? 'line-through text-slate-400' : ''
                      }`}>
                        {task.description}
                      </p>
                    )}

                    {/* Creator & Due Date Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-0.5">
                      {task.createdByName && (
                        <span className="font-medium text-slate-600 flex items-center gap-1">
                          <User className="h-3 w-3 text-slate-400" />
                          <span>Enviado por: <strong>{task.createdByName}</strong></span>
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
                    onClick={() => handleToggleStatus(task)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                      task.status === 'concluida'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : task.status === 'em_andamento'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                  >
                    {task.status === 'concluida' ? 'Reabrir' : task.status === 'em_andamento' ? 'Concluir' : 'Iniciar'}
                  </button>

                  {(isAdmin || task.userId === userId || task.userEmail === userEmail) && (
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Excluir tarefa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
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
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200/80 relative space-y-5"
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
                      Categoria / Setor
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Marketing">Marketing</option>
                      <option value="Atendimento">Atendimento</option>
                      <option value="Convênios">Convênios</option>
                      <option value="Institucional">Institucional</option>
                      <option value="Administração">Administração</option>
                      <option value="Geral">Geral</option>
                    </select>
                  </div>

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

    </div>
  );
};

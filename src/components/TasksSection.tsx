import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Download,
  Pencil,
  Save,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthContext';
import { SpellCheckInput, SpellCheckTextarea } from './SpellCheckField';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';

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
  },
  {
    uid: 'm-cauan',
    name: 'Cauan',
    email: 'cauan@bahiaprev.com.br',
    role: 'Designer Gráfico'
  },
  {
    uid: 'm-paulo',
    name: 'Paulo',
    email: 'paulo@bahiaprev.com.br',
    role: 'Colaborador'
  },
  {
    uid: 'm-pablo',
    name: 'Pablo',
    email: 'pablo@bahiaprev.com.br',
    role: 'Colaborador'
  }
];

export const TasksSection: React.FC = () => {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [collaborators, setCollaborators] = useState<MemberOption[]>(DEFAULT_MEMBERS);
  const [loading, setLoading] = useState(true);
  const knownTaskIdsRef = useRef<Set<string> | null>(null);
  const knownTaskStatusesRef = useRef<Map<string, string> | null>(null);
  
  // Filters and search
  const [statusFilter, setStatusFilter] = useState<'abertas' | 'atrasadas' | 'concluida'>('abertas');
  const [priorityFilter, setPriorityFilter] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserFilterForCompleted, setSelectedUserFilterForCompleted] = useState<string>('minhas');
  const [selectedCollaboratorUid, setSelectedCollaboratorUid] = useState<string | null>(null);
  const [taskScopeMode, setTaskScopeMode] = useState<'minhas' | 'colaborador' | 'todas'>('minhas');
  const [isMyTasksMinimized, setIsMyTasksMinimized] = useState<boolean>(false);
  const [completionToast, setCompletionToast] = useState<{ title: string; subtitle: string } | null>(null);

  const triggerCompletionToast = useCallback((taskTitle: string, recipientOrCompletedByName?: string) => {
    setCompletionToast({
      title: taskTitle,
      subtitle: recipientOrCompletedByName ? `Concluída por/para ${recipientOrCompletedByName}` : 'Tarefa concluída com sucesso!'
    });
    setTimeout(() => {
      setCompletionToast(null);
    }, 4500);
  }, []);

  // Modal for viewing task details and submitting completion delivery
  const [selectedTaskForView, setSelectedTaskForView] = useState<Task | null>(null);
  const [completionAttachmentFile, setCompletionAttachmentFile] = useState<{ name: string; url: string; type: string } | null>(null);
  const [completionNoteText, setCompletionNoteText] = useState<string>('');

  // Edit task state
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<'baixa' | 'media' | 'alta'>('media');
  const [editStatus, setEditStatus] = useState<'pendente' | 'em_andamento' | 'concluida'>('pendente');
  const [editDueDate, setEditDueDate] = useState('');
  const [editRecipient, setEditRecipient] = useState<string>('me');
  const [editAttachmentFile, setEditAttachmentFile] = useState<{ name: string; url: string; type: string } | null | 'remove'>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Modal and state for purging/clearing all tasks
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [isClearingTasks, setIsClearingTasks] = useState(false);

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

  const isCauan = userEmail.toLowerCase().includes('cauan') || userName.toLowerCase().includes('cauan');

  const isAdmin = profile?.canCreateTasks !== undefined
    ? Boolean(profile.canCreateTasks)
    : (!isCauan && (
        userRole.toLowerCase().includes('admin') || 
        userRole.toLowerCase().includes('diretor') || 
        userEmail === 'marketing@bahiaprev.com.br' ||
        userEmail === 'lucasrodrigues@bahiaprev.com.br' ||
        userEmail === 'jairoqueiroz@bahiaprev.com.br'
      ));

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
        },
        'cauan': {
          uid: 'm-cauan',
          name: 'Cauan',
          email: 'cauan@bahiaprev.com.br',
          role: 'Designer Gráfico'
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
        } else if (email.includes('cauan') || name.includes('cauan')) {
          map['cauan'] = {
            uid: docSnap.id,
            name: (data.name && data.name.toLowerCase() !== 'cauan' && data.name.toLowerCase() !== 'colaborador' && !data.name.includes('@')) ? data.name : 'Cauan',
            email: 'cauan@bahiaprev.com.br',
            role: (data.role && data.role !== 'Colaborador') ? data.role : 'Designer Gráfico'
          };
        } else if (email.includes('paulo') || name.includes('paulo')) {
          map['paulo'] = {
            uid: docSnap.id,
            name: (data.name && data.name.toLowerCase() !== 'paulo' && data.name.toLowerCase() !== 'colaborador' && !data.name.includes('@')) ? data.name : 'Paulo',
            email: 'paulo@bahiaprev.com.br',
            role: data.role || 'Colaborador'
          };
        } else {
          map[docSnap.id] = {
            uid: docSnap.id,
            name: data.name || email.split('@')[0],
            email: data.email,
            role: data.role || 'Colaborador'
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

  // Helper to check if a task should be visible to the current user (Strict confidentiality rule)
  const isTargetedToUser = useCallback((task: Task) => {
    // Tasks are strictly confidential: visible ONLY to the creator/leader and the assigned user (or if assigned to all)

    const myEmail = (userEmail || '').toLowerCase().trim();
    const myName = (userName || '').toLowerCase().trim();
    const myUid = userId;
    const myFirstName = myName.split(' ')[0] || '';

    const assignedEmail = (task.assignedToEmail || '').toLowerCase().trim();
    const assignedName = (task.assignedToName || '').toLowerCase().trim();
    const creatorEmail = (task.userEmail || '').toLowerCase().trim();
    const creatorUid = task.userId;
    const createdByName = (task.createdByName || '').toLowerCase().trim();
    const completedByEmail = (task.completedByEmail || '').toLowerCase().trim();
    const completedByName = (task.completedByName || '').toLowerCase().trim();

    // 1. Task assigned to all
    if (task.assignedToType === 'all' || assignedEmail === 'todos@bahiaprev.com.br' || assignedName.includes('todos')) {
      return true;
    }

    // 2. Task created by this user
    if ((myUid && creatorUid && creatorUid === myUid) || 
        (myEmail && creatorEmail && (creatorEmail === myEmail || creatorEmail.includes(myEmail) || myEmail.includes(creatorEmail)))) {
      return true;
    }

    if (myName && createdByName && (createdByName.includes(myName) || myName.includes(createdByName))) {
      return true;
    }

    if (myFirstName && myFirstName.length >= 2 && createdByName && (createdByName.includes(myFirstName) || myFirstName.includes(createdByName))) {
      return true;
    }

    // Special check for Lucas / Marketing email aliases
    const isMyLucas = myEmail.includes('lucas') || myName.includes('lucas') || myEmail === 'marketing@bahiaprev.com.br';
    const isCreatorLucas = creatorEmail.includes('lucas') || createdByName.includes('lucas') || creatorEmail === 'marketing@bahiaprev.com.br';
    if (isMyLucas && isCreatorLucas) {
      return true;
    }

    // 3. Task assigned directly to this user by email
    if (myEmail && assignedEmail && (assignedEmail === myEmail || assignedEmail.includes(myEmail) || myEmail.includes(assignedEmail))) {
      return true;
    }

    const isAssignedToLucas = assignedEmail.includes('lucas') || assignedName.includes('lucas') || assignedEmail === 'marketing@bahiaprev.com.br';
    if (isMyLucas && isAssignedToLucas) {
      return true;
    }

    // 4. Task assigned directly to this user by name
    if (myName && assignedName && (assignedName.includes(myName) || myName.includes(assignedName))) {
      return true;
    }

    if (myFirstName && myFirstName.length >= 2 && assignedName && (assignedName.includes(myFirstName) || myFirstName.includes(assignedName))) {
      return true;
    }

    // 5. Task completed by this user
    if (myEmail && completedByEmail && (completedByEmail === myEmail || completedByEmail.includes(myEmail) || myEmail.includes(completedByEmail))) {
      return true;
    }

    if (myName && completedByName && (completedByName.includes(myName) || myName.includes(completedByName))) {
      return true;
    }

    if (myFirstName && myFirstName.length >= 2 && completedByName && (completedByName.includes(myFirstName) || myFirstName.includes(completedByName))) {
      return true;
    }

    return false;
  }, [userEmail, userName, userId]);

  // Default initial tasks (returns empty array to keep system completely clean when cleared)
  const getDefaultTasks = useCallback((): Task[] => {
    return [];
  }, []);

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

            const rawAssignedTo = data.assignedTo || '';
            const rawAssignedName = data.assignedToName || (typeof rawAssignedTo === 'string' && !rawAssignedTo.includes('@') && rawAssignedTo !== 'me' && rawAssignedTo !== 'all' ? rawAssignedTo : '');
            const rawAssignedEmail = data.assignedToEmail || (typeof rawAssignedTo === 'string' && rawAssignedTo.includes('@') ? rawAssignedTo : '');

            // Detect if assigned to another specific collaborator (e.g. Cauan, Paulo, etc.)
            const isAssignedToOther = Boolean(
              (rawAssignedName && !rawAssignedName.toLowerCase().includes(userName.toLowerCase())) ||
              (rawAssignedEmail && userEmail && !rawAssignedEmail.toLowerCase().includes(userEmail.toLowerCase()) && !rawAssignedEmail.includes('todos')) ||
              (rawAssignedTo && rawAssignedTo !== 'me' && rawAssignedTo !== 'all' && !rawAssignedTo.toLowerCase().includes(userName.toLowerCase()))
            );

            let assignedType: 'specific_user' | 'all' | 'me' = data.assignedToType;

            if (isAssignedToOther) {
              assignedType = 'specific_user';
            } else if (!assignedType) {
              if (rawAssignedTo === 'all' || rawAssignedName.toLowerCase().includes('todos') || rawAssignedEmail.includes('todos')) {
                assignedType = 'all';
              } else if ((rawAssignedTo && rawAssignedTo !== 'me') || rawAssignedName || rawAssignedEmail) {
                assignedType = 'specific_user';
              } else {
                assignedType = 'me';
              }
            }

            let assignedName = rawAssignedName;
            let assignedEmail = rawAssignedEmail;

            if (assignedType === 'all') {
              assignedName = 'Todos os Colaboradores';
              assignedEmail = 'todos@bahiaprev.com.br';
            } else if (assignedType === 'me') {
              assignedName = userName;
              assignedEmail = userEmail;
            } else if (assignedType === 'specific_user') {
              if (!assignedName && !assignedEmail && rawAssignedTo) {
                if (rawAssignedTo.includes('@')) {
                  assignedEmail = rawAssignedTo;
                  assignedName = rawAssignedTo.split('@')[0];
                } else {
                  assignedName = rawAssignedTo;
                }
              }
            }

            const taskCandidate: Task = {
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
              assignedToName: assignedName || 'Colaborador',
              assignedToEmail: assignedEmail || '',
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
            };

            if (isTargetedToUser(taskCandidate)) {
              loaded.push(taskCandidate);
            }
          });

          // Sound notification check for new tasks or completed tasks arriving in real time
          if (knownTaskIdsRef.current === null) {
            knownTaskIdsRef.current = new Set(loaded.map((t) => t.id));
            knownTaskStatusesRef.current = new Map(loaded.map((t) => [t.id, t.status]));
          } else {
            const hasNewTask = loaded.some((t) => !knownTaskIdsRef.current!.has(t.id));
            const hasNewlyCompletedTask = loaded.some((t) => {
              const prevStatus = knownTaskStatusesRef.current?.get(t.id);
              return prevStatus && prevStatus !== 'concluida' && t.status === 'concluida';
            });

            if (hasNewlyCompletedTask) {
              playNotificationSound('task_complete');
              const newlyCompleted = loaded.find((t) => {
                const prevStatus = knownTaskStatusesRef.current?.get(t.id);
                return prevStatus && prevStatus !== 'concluida' && t.status === 'concluida';
              });
              if (newlyCompleted) {
                triggerCompletionToast(newlyCompleted.title, newlyCompleted.completedByName || newlyCompleted.assignedToName);
              }
            } else if (hasNewTask) {
              playNotificationSound('task');
            }

            knownTaskIdsRef.current = new Set(loaded.map((t) => t.id));
            knownTaskStatusesRef.current = new Map(loaded.map((t) => [t.id, t.status]));
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
              const parsed: Task[] = JSON.parse(saved);
              setTasks(parsed.filter(isTargetedToUser));
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
  }, [userId, userEmail, userName, userRole, isAdmin, isTargetedToUser, getDefaultTasks]);

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
      playNotificationSound('task_complete');
      triggerCompletionToast(task.title, userName);
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
    playNotificationSound('task_complete');
    triggerCompletionToast(task.title, userName);

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

  // Open Task for Editing
  const openEditTask = (task: Task) => {
    setSelectedTaskForView(task);
    setEditTitle(task.title || '');
    setEditDescription(task.description || '');
    setEditPriority(task.priority || 'media');
    setEditStatus(task.status || 'pendente');
    setEditDueDate(task.dueDate || '');
    setEditAttachmentFile(null);

    if (task.assignedToType === 'all') {
      setEditRecipient('all');
    } else if (task.assignedToType === 'me' || task.assignedToEmail === userEmail) {
      setEditRecipient('me');
    } else if (task.assignedToEmail) {
      setEditRecipient(task.assignedToEmail);
    } else {
      setEditRecipient('me');
    }

    setIsEditingTask(true);
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEditAttachmentFile({
          name: file.name,
          url: event.target.result as string,
          type: file.type
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTaskEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForView || !editTitle.trim()) return;

    setIsSavingEdit(true);

    let assignedType: 'specific_user' | 'all' | 'me' = 'me';
    let assignedName = userName;
    let assignedEmail = userEmail;

    if (editRecipient === 'all') {
      assignedType = 'all';
      assignedName = 'Todos os Colaboradores';
      assignedEmail = 'todos@bahiaprev.com.br';
    } else if (editRecipient !== 'me') {
      assignedType = 'specific_user';
      const targetMember = collaborators.find(c => c.email === editRecipient);
      if (targetMember) {
        assignedName = targetMember.name;
        assignedEmail = targetMember.email;
      } else {
        assignedName = editRecipient;
        assignedEmail = editRecipient;
      }
    }

    const updatePayload: Record<string, any> = {
      title: editTitle.trim(),
      description: editDescription.trim(),
      priority: editPriority,
      status: editStatus,
      dueDate: editDueDate,
      assignedToType: assignedType,
      assignedToName: assignedName,
      assignedToEmail: assignedEmail,
    };

    if (editStatus === 'concluida' && selectedTaskForView.status !== 'concluida') {
      updatePayload.completedAt = new Date().toISOString();
      updatePayload.completedByEmail = userEmail;
      updatePayload.completedByName = userName;
      playNotificationSound('task_complete');
      triggerCompletionToast(editTitle, userName);
    }

    if (editAttachmentFile === 'remove') {
      updatePayload.attachmentName = '';
      updatePayload.attachmentUrl = '';
      updatePayload.attachmentType = '';
    } else if (editAttachmentFile && typeof editAttachmentFile === 'object') {
      updatePayload.attachmentName = editAttachmentFile.name;
      updatePayload.attachmentUrl = editAttachmentFile.url;
      updatePayload.attachmentType = editAttachmentFile.type;
    }

    const updatedTask: Task = {
      ...selectedTaskForView,
      ...updatePayload,
      attachmentName: editAttachmentFile === 'remove' ? undefined : (typeof editAttachmentFile === 'object' && editAttachmentFile ? editAttachmentFile.name : selectedTaskForView.attachmentName),
      attachmentUrl: editAttachmentFile === 'remove' ? undefined : (typeof editAttachmentFile === 'object' && editAttachmentFile ? editAttachmentFile.url : selectedTaskForView.attachmentUrl),
      attachmentType: editAttachmentFile === 'remove' ? undefined : (typeof editAttachmentFile === 'object' && editAttachmentFile ? editAttachmentFile.type : selectedTaskForView.attachmentType),
    };

    const updatedTasksList = tasks.map(t => t.id === selectedTaskForView.id ? updatedTask : t);
    saveTasksLocally(updatedTasksList);
    setSelectedTaskForView(updatedTask);

    if (!selectedTaskForView.id.startsWith('def-') && !selectedTaskForView.id.startsWith('local-')) {
      try {
        await updateDoc(doc(db, 'user_tasks', selectedTaskForView.id), updatePayload);
      } catch (err) {
        console.warn('Error updating task in Firestore:', err);
      }
    }

    setIsSavingEdit(false);
    setIsEditingTask(false);
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

  // Purge/Clear All Tasks from Firestore and local storage to leave system 100% clean
  const handleClearAllTasks = async () => {
    setIsClearingTasks(true);
    try {
      // 1. Delete all Firestore user_tasks documents
      const snapshot = await getDocs(collection(db, 'user_tasks'));
      const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(doc(db, 'user_tasks', docSnap.id)));
      await Promise.all(deletePromises);

      // 2. Clear local storage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('tasks_')) {
          localStorage.removeItem(key);
        }
      });

      // 3. Clear local state
      setTasks([]);
      setSelectedTaskForView(null);
    } catch (err) {
      console.error('Erro ao excluir histórico de tarefas:', err);
      alert('Ocorreu um erro ao tentar limpar as tarefas do banco de dados.');
    } finally {
      setIsClearingTasks(false);
      setShowClearConfirmModal(false);
    }
  };

  // Overdue calculation helper
  const todayStr = new Date().toISOString().split('T')[0];
  const isTaskOverdue = (task: Task) => {
    if (task.status === 'concluida') return false;
    if (!task.dueDate) return false;
    return task.dueDate < todayStr;
  };

  // Filter tasks to only those the current user is authorized to view
  const visibleTasks = tasks.filter(isTargetedToUser);

  // Calculations
  const totalTasks = visibleTasks.length;
  const completedTasks = visibleTasks.filter((t) => t.status === 'concluida').length;
  const overdueTasksCount = visibleTasks.filter((t) => isTaskOverdue(t)).length;
  const openTasksCount = visibleTasks.filter((t) => t.status !== 'concluida' && !isTaskOverdue(t)).length;

  const myEmail = (userEmail || '').toLowerCase().trim();
  const myName = (userName || '').toLowerCase().trim();
  const myFirstName = myName.split(' ')[0] || '';

  const isLucasUser = useCallback((email?: string, name?: string) => {
    const e = (email || '').toLowerCase().trim();
    const n = (name || '').toLowerCase().trim();
    return e.includes('lucas') || n.includes('lucas') || e === 'marketing@bahiaprev.com.br' || e === 'institutojairoqueiroz@gmail.com';
  }, []);

  const isTaskBelongsToMe = (task: Task) => {
    const assignedEmail = (task.assignedToEmail || '').toLowerCase().trim();
    const assignedName = (task.assignedToName || '').toLowerCase().trim();
    const completedEmail = (task.completedByEmail || '').toLowerCase().trim();
    const completedName = (task.completedByName || '').toLowerCase().trim();

    const isMeLucas = isLucasUser(myEmail, myName);
    const isAssignedLucas = isLucasUser(assignedEmail, assignedName);

    // If explicitly assigned to another specific user (collaborator), it does NOT belong to me
    if (task.assignedToType === 'specific_user') {
      if (isMeLucas && isAssignedLucas) {
        // Belongs to me
      } else {
        const isAssignedToOtherEmail = assignedEmail && myEmail && assignedEmail !== myEmail;
        const isAssignedToOtherName = assignedName && myName && !assignedName.includes(myName) && !myName.includes(assignedName);
        if (isAssignedToOtherEmail && isAssignedToOtherName) {
          return false;
        }
      }
    }

    // If completed by another user (collaborator), it does NOT belong to my completed tasks
    if (completedEmail && myEmail && completedEmail !== myEmail && !(isMeLucas && isLucasUser(completedEmail, completedName))) {
      return false;
    }

    // Check if task is assigned to me or completed by me
    if (task.assignedToType === 'me') {
      return true;
    }

    if (isMeLucas && isAssignedLucas) {
      return true;
    }

    if (myEmail && (assignedEmail === myEmail || completedEmail === myEmail)) {
      return true;
    }

    if (myName && myName.length > 2 && (assignedName.includes(myName) || completedName.includes(myName))) {
      return true;
    }

    if (myFirstName && myFirstName.length >= 3 && (assignedName.includes(myFirstName) || completedName.includes(myFirstName))) {
      return true;
    }

    return false;
  };

  const isTaskFromOtherAdminToMe = (task: Task) => {
    if (!isTaskBelongsToMe(task)) return false;

    const creatorEmail = (task.userEmail || '').toLowerCase().trim();
    const creatorName = (task.createdByName || '').toLowerCase().trim();

    const isCreatorOther = (creatorEmail && myEmail && creatorEmail !== myEmail) ||
      (creatorName && myName && !creatorName.includes(myName) && !myName.includes(creatorName));

    return (task.createdByAdmin === true || isCreatorOther) && isCreatorOther;
  };

  const isTaskOfCollaborator = (task: Task) => {
    return !isTaskBelongsToMe(task);
  };

  // Helper to check if a task belongs to or was assigned to a specific collaborator
  const isTaskAssociatedWithCollaborator = useCallback((task: Task, collab: MemberOption | null) => {
    if (!collab) return true;

    const cEmail = (collab.email || '').toLowerCase().trim();
    const cName = (collab.name || '').toLowerCase().trim();
    const cFirstName = cName.split(' ')[0] || '';

    const assignedEmail = (task.assignedToEmail || '').toLowerCase().trim();
    const assignedName = (task.assignedToName || '').toLowerCase().trim();
    const completedEmail = (task.completedByEmail || '').toLowerCase().trim();
    const completedName = (task.completedByName || '').toLowerCase().trim();

    // 1. Task assigned to everyone
    if (task.assignedToType === 'all' || assignedEmail === 'todos@bahiaprev.com.br' || assignedName.includes('todos')) {
      return true;
    }

    // 2. Direct email match on assignedToEmail or completedByEmail (strictly task assignee, NOT creator)
    if (cEmail && (assignedEmail === cEmail || completedEmail === cEmail)) {
      return true;
    }

    // 3. Special matching for Lucas (strictly assignedTo or completedBy, NOT creator)
    const isCollabLucas = isLucasUser(cEmail, cName);
    const isTaskAssignedLucas = isLucasUser(assignedEmail, assignedName) || isLucasUser(completedEmail, completedName);
    if (isCollabLucas && isTaskAssignedLucas) {
      return true;
    }

    // 4. Name match on assignedToName or completedByName
    if (cName && cName.length > 2 && cName !== 'colaborador') {
      if ((assignedName && (assignedName.includes(cName) || cName.includes(assignedName))) ||
          (completedName && (completedName.includes(cName) || cName.includes(completedName)))) {
        return true;
      }
    }

    // 5. First name match on assignedToName or completedByName
    if (cFirstName && cFirstName.length >= 2 && cFirstName !== 'colaborador') {
      if ((assignedName && assignedName.includes(cFirstName)) ||
          (completedName && completedName.includes(cFirstName))) {
        return true;
      }
    }

    return false;
  }, [isLucasUser]);

  // Consolidate full list of team collaborators
  const allCollaboratorOptions = useMemo(() => {
    const map: Record<string, MemberOption> = {};

    (collaborators || []).forEach(c => {
      const key = (c.email || c.name || c.uid).toLowerCase().trim();
      map[key] = c;
    });

    DEFAULT_MEMBERS.forEach(m => {
      const key = (m.email || m.name || m.uid).toLowerCase().trim();
      if (!map[key]) {
        map[key] = m;
      }
    });

    visibleTasks.forEach(t => {
      if (t.assignedToName && t.assignedToType === 'specific_user') {
        const names = t.assignedToName.split(/,|\se\s|\se\/ou\s|\//i).map(s => s.trim()).filter(Boolean);
        const emails = (t.assignedToEmail || '').split(/,|\se\s|\//i).map(s => s.trim()).filter(Boolean);

        names.forEach((namePart, idx) => {
          const emailPart = emails[idx] || '';
          const key = (emailPart || namePart).toLowerCase();

          const existingKey = Object.keys(map).find(k => {
            const m = map[k];
            return k === key ||
              m.name.toLowerCase() === namePart.toLowerCase() ||
              m.name.toLowerCase().includes(namePart.toLowerCase()) ||
              namePart.toLowerCase().includes(m.name.toLowerCase()) ||
              (emailPart && m.email.toLowerCase() === emailPart.toLowerCase());
          });

          if (!existingKey) {
            map[key] = {
              uid: key,
              name: namePart,
              email: emailPart,
              role: 'Colaborador'
            };
          }
        });
      }
    });

    return Object.values(map);
  }, [collaborators, visibleTasks]);

  const getCollabCounts = useCallback((collab: MemberOption) => {
    const tasks = visibleTasks.filter(t => isTaskAssociatedWithCollaborator(t, collab));
    const open = tasks.filter(t => t.status !== 'concluida' && !isTaskOverdue(t)).length;
    const overdue = tasks.filter(t => isTaskOverdue(t)).length;
    const completed = tasks.filter(t => t.status === 'concluida').length;
    return { open, overdue, completed, total: tasks.length };
  }, [visibleTasks, isTaskAssociatedWithCollaborator]);

  // Filter collaborators to ONLY show team members who have open or overdue tasks assigned/associated with them in the database
  const activeCollaboratorOptions = useMemo(() => {
    const myIsLucas = isLucasUser(myEmail, myName);

    return allCollaboratorOptions.filter(collab => {
      const cEmail = (collab.email || '').toLowerCase().trim();
      const cName = (collab.name || '').toLowerCase().trim();
      const cFirstName = cName.split(' ')[0] || '';

      const cIsLucas = isLucasUser(cEmail, cName);

      // If current user is Lucas and collaborator is Lucas, hide from list (already in "Minhas Tarefas")
      if (myIsLucas && cIsLucas) return false;

      // Exact email match with current user
      if (cEmail && myEmail && cEmail === myEmail) return false;

      // Exact/included name match with current user (excluding generic 'colaborador' or 'admin')
      if (cName && myName && cName.length > 2 && myName.length > 2 && cName !== 'colaborador' && myName !== 'colaborador' && cName !== 'admin' && myName !== 'admin') {
        if (cName === myName || cName.includes(myName) || myName.includes(cName)) {
          return false;
        }
      }

      if (cFirstName && myFirstName && cFirstName.length >= 3 && myFirstName.length >= 3 && cFirstName !== 'colaborador' && myFirstName !== 'colaborador' && cFirstName === myFirstName) {
        return false;
      }

      // Only show collaborator if they have at least 1 open or overdue task
      const counts = getCollabCounts(collab);
      return counts.open > 0 || counts.overdue > 0;
    });
  }, [allCollaboratorOptions, getCollabCounts, myEmail, myName, myFirstName, isLucasUser]);

  const selectedCollabObj = useMemo(() => {
    if (!selectedCollaboratorUid) return null;
    return activeCollaboratorOptions.find(c => 
      c.uid === selectedCollaboratorUid || 
      c.email?.toLowerCase() === selectedCollaboratorUid.toLowerCase() ||
      c.name.toLowerCase() === selectedCollaboratorUid.toLowerCase() ||
      (c.name && selectedCollaboratorUid && c.name.toLowerCase().includes(selectedCollaboratorUid.toLowerCase())) ||
      (c.email && selectedCollaboratorUid && c.email.toLowerCase().includes(selectedCollaboratorUid.toLowerCase()))
    ) || null;
  }, [selectedCollaboratorUid, activeCollaboratorOptions]);

  const collabOpenCount = useMemo(() => {
    if (!selectedCollabObj) return 0;
    return visibleTasks.filter(t => isTaskAssociatedWithCollaborator(t, selectedCollabObj) && t.status !== 'concluida' && !isTaskOverdue(t)).length;
  }, [selectedCollabObj, visibleTasks, isTaskAssociatedWithCollaborator]);

  const collabOverdueCount = useMemo(() => {
    if (!selectedCollabObj) return 0;
    return visibleTasks.filter(t => isTaskAssociatedWithCollaborator(t, selectedCollabObj) && isTaskOverdue(t)).length;
  }, [selectedCollabObj, visibleTasks, isTaskAssociatedWithCollaborator]);

  const collabCompletedCount = useMemo(() => {
    if (!selectedCollabObj) return 0;
    return visibleTasks.filter(t => isTaskAssociatedWithCollaborator(t, selectedCollabObj) && t.status === 'concluida').length;
  }, [selectedCollabObj, visibleTasks, isTaskAssociatedWithCollaborator]);

  const myOpenTasksCount = useMemo(() => {
    return visibleTasks.filter(t => isTaskBelongsToMe(t) && t.status !== 'concluida' && !isTaskOverdue(t)).length;
  }, [visibleTasks, isTaskBelongsToMe]);

  const myOverdueTasksCount = useMemo(() => {
    return visibleTasks.filter(t => isTaskBelongsToMe(t) && isTaskOverdue(t)).length;
  }, [visibleTasks, isTaskBelongsToMe]);

  const myTotalTasksCount = useMemo(() => {
    return visibleTasks.filter(t => isTaskBelongsToMe(t)).length;
  }, [visibleTasks, isTaskBelongsToMe]);

  const completedTasksListAll = visibleTasks.filter((t) => t.status === 'concluida');
  const myCompletedTasksCount = completedTasksListAll.filter((t) => isTaskBelongsToMe(t)).length;
  const fromOtherAdminsCompletedCount = completedTasksListAll.filter((t) => isTaskFromOtherAdminToMe(t)).length;
  const colaboradoresCompletedCount = completedTasksListAll.filter((t) => isTaskOfCollaborator(t)).length;

  // Completed Tasks User List Grouping (Collaborators only)
  const completedUsersMap: Record<string, { name: string; email: string; count: number }> = {};
  visibleTasks.filter(t => t.status === 'concluida').forEach(t => {
    const name = t.completedByName || t.assignedToName || 'Colaborador';
    const email = t.completedByEmail || t.assignedToEmail || name;
    const key = email.toLowerCase();
    if (!completedUsersMap[key]) {
      completedUsersMap[key] = { name, email, count: 0 };
    }
    completedUsersMap[key].count += 1;
  });
  const completedUsersList = Object.values(completedUsersMap);
  const collaboratorUsersList = completedUsersList.filter(usr => {
    const isMe = (usr.email && usr.email.toLowerCase() === myEmail) || 
                 (usr.name && myName && usr.name.toLowerCase().includes(myName)) ||
                 (usr.name && myFirstName && usr.name.toLowerCase().includes(myFirstName));
    return !isMe;
  });

  // Filtered Tasks
  const filteredTasks = visibleTasks.filter((task) => {
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

    const matchesScope = 
      taskScopeMode === 'minhas'
        ? isTaskBelongsToMe(task)
        : taskScopeMode === 'colaborador' && selectedCollabObj
        ? isTaskAssociatedWithCollaborator(task, selectedCollabObj)
        : true; // 'todas'

    const matchesUserCompletedFilter = 
      statusFilter !== 'concluida' || taskScopeMode !== 'todas' ||
      (selectedUserFilterForCompleted === 'minhas'
        ? isTaskBelongsToMe(task)
        : selectedUserFilterForCompleted === 'outros_admins'
        ? isTaskFromOtherAdminToMe(task)
        : selectedUserFilterForCompleted === 'colaboradores'
        ? isTaskOfCollaborator(task)
        : selectedUserFilterForCompleted === 'todos'
        ? true
        : (
            task.assignedToEmail?.toLowerCase() === selectedUserFilterForCompleted.toLowerCase() ||
            task.completedByEmail?.toLowerCase() === selectedUserFilterForCompleted.toLowerCase() ||
            task.assignedToName?.toLowerCase().includes(selectedUserFilterForCompleted.toLowerCase()) ||
            task.completedByName?.toLowerCase().includes(selectedUserFilterForCompleted.toLowerCase())
          )
      );

    return matchesStatus && matchesPriority && matchesSearch && matchesScope && matchesUserCompletedFilter;
  });

  {/* Componente Auxiliar para Renderizar a Lista de Tarefas, Busca e Filtros */}
  const renderTaskListSection = () => (
    <div className="space-y-4 pt-3 border-t border-slate-200/60">
      {/* Action Bar: Search, Filters & New Task Button */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, colaborador responsável ou criador..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setStatusFilter('abertas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'abertas'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Abertas ({taskScopeMode === 'minhas' ? myOpenTasksCount : taskScopeMode === 'colaborador' ? collabOpenCount : openTasksCount})</span>
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
            <span>Atrasadas ({taskScopeMode === 'minhas' ? myOverdueTasksCount : taskScopeMode === 'colaborador' ? collabOverdueCount : overdueTasksCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('concluida')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'concluida'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Concluídas ({taskScopeMode === 'minhas' ? myCompletedTasksCount : taskScopeMode === 'colaborador' ? collabCompletedCount : completedTasks})</span>
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

      {/* Sub-bar for Completed Tasks: Organized Filters (Only shown when viewing ALL tasks) */}
      {statusFilter === 'concluida' && taskScopeMode === 'todas' && (
        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-emerald-200/60">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-950 uppercase tracking-wider">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
              <span>Filtros Organizados de Tarefas Concluídas</span>
            </div>
            <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-3 py-1 rounded-full shadow-2xs">
              {selectedUserFilterForCompleted === 'minhas' 
                ? `${myCompletedTasksCount} tarefa(s) sua(s) concluída(s)`
                : selectedUserFilterForCompleted === 'colaboradores'
                ? `${colaboradoresCompletedCount} tarefa(s) de colaboradores concluída(s)`
                : `${completedTasks} tarefa(s) concluída(s) no total`}
            </span>
          </div>

          {/* Categorized Filter Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Minhas Tarefas Concluídas */}
            <button
              onClick={() => setSelectedUserFilterForCompleted('minhas')}
              className={`p-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-between gap-2 border ${
                selectedUserFilterForCompleted === 'minhas'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-slate-800 border-emerald-200/80 hover:bg-emerald-100/60'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <UserCheck className={`h-4 w-4 shrink-0 ${selectedUserFilterForCompleted === 'minhas' ? 'text-white' : 'text-emerald-600'}`} />
                <span className="truncate">Minhas Tarefas</span>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                selectedUserFilterForCompleted === 'minhas' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {myCompletedTasksCount}
              </span>
            </button>

            {/* 2. Tarefas dos Colaboradores */}
            <button
              onClick={() => setSelectedUserFilterForCompleted('colaboradores')}
              className={`p-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-between gap-2 border ${
                selectedUserFilterForCompleted !== 'minhas'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-slate-800 border-emerald-200/80 hover:bg-emerald-100/60'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Users className={`h-4 w-4 shrink-0 ${selectedUserFilterForCompleted !== 'minhas' ? 'text-white' : 'text-emerald-600'}`} />
                <span className="truncate">Dos Colaboradores</span>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                selectedUserFilterForCompleted !== 'minhas' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {colaboradoresCompletedCount}
              </span>
            </button>
          </div>

          {/* Sub-pills for Specific Collaborators - Only shown when in Collaborators or All view, NOT in 'Minhas Tarefas' */}
          {selectedUserFilterForCompleted !== 'minhas' && collaboratorUsersList.length > 0 && (
            <div className="pt-2 border-t border-emerald-200/50 space-y-1.5">
              <span className="text-[11px] font-bold text-emerald-900 block">
                Filtrar por Colaborador Específico:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {collaboratorUsersList.map((usr) => {
                  const isSelected = selectedUserFilterForCompleted.toLowerCase() === (usr.email || usr.name).toLowerCase();

                  return (
                    <button
                      key={usr.email || usr.name}
                      onClick={() => setSelectedUserFilterForCompleted(isSelected ? 'colaboradores' : (usr.email || usr.name))}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 border ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-100/60'
                      }`}
                    >
                      <User className="h-3 w-3 text-emerald-600 shrink-0" />
                      <span>{usr.name} ({usr.count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
                    onClick={() => openEditTask(task)}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    title="Editar tarefa e alterar destinatário"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTaskForView(task);
                      setIsEditingTask(false);
                    }}
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
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-3">
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
    </div>
  );

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

      {/* Seção 1: Minhas Tarefas (com opção de Minimizar / Expandir) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-2xs">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <span>Minhas Tarefas</span>
                <span className="text-xs font-bold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                  {myTotalTasksCount} {myTotalTasksCount === 1 ? 'tarefa' : 'tarefas'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Tarefas destinadas a você (<strong>{userName}</strong>) para realização
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMyTasksMinimized(!isMyTasksMinimized)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200/80"
          >
            {isMyTasksMinimized ? (
              <>
                <ChevronDown className="h-4 w-4 text-indigo-600" />
                <span>Expandir Minhas Tarefas</span>
              </>
            ) : (
              <>
                <ChevronUp className="h-4 w-4 text-slate-500" />
                <span>Minimizar</span>
              </>
            )}
          </button>
        </div>

        {/* Conteúdo Expansível de Minhas Tarefas */}
        {!isMyTasksMinimized && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pt-1"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Metric 1: Minhas Abertas */}
              <button
                onClick={() => {
                  setTaskScopeMode('minhas');
                  setSelectedCollaboratorUid(null);
                  setStatusFilter('abertas');
                  setSelectedUserFilterForCompleted('minhas');
                }}
                className={`rounded-2xl p-4 border text-left transition-all cursor-pointer flex items-center justify-between ${
                  statusFilter === 'abertas' && taskScopeMode === 'minhas'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400/30'
                    : 'bg-indigo-50/50 hover:bg-indigo-100/60 border-indigo-200/80 shadow-2xs'
                }`}
              >
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-wider block ${
                    statusFilter === 'abertas' && taskScopeMode === 'minhas' ? 'text-indigo-100' : 'text-indigo-700'
                  }`}>
                    Minhas Tarefas Abertas
                  </span>
                  <span className={`text-2xl font-black mt-0.5 block ${
                    statusFilter === 'abertas' && taskScopeMode === 'minhas' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {myOpenTasksCount}
                  </span>
                </div>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold ${
                  statusFilter === 'abertas' && taskScopeMode === 'minhas' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  <Clock className="h-5 w-5" />
                </div>
              </button>

              {/* Metric 2: Minhas Atrasadas */}
              <button
                onClick={() => {
                  setTaskScopeMode('minhas');
                  setSelectedCollaboratorUid(null);
                  setStatusFilter('atrasadas');
                  setSelectedUserFilterForCompleted('minhas');
                }}
                className={`rounded-2xl p-4 border text-left transition-all cursor-pointer flex items-center justify-between ${
                  statusFilter === 'atrasadas' && taskScopeMode === 'minhas'
                    ? 'bg-red-600 text-white border-red-700 shadow-md ring-2 ring-red-400/30'
                    : 'bg-red-50/50 hover:bg-red-100/60 border-red-200 shadow-2xs'
                }`}
              >
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-wider block ${
                    statusFilter === 'atrasadas' && taskScopeMode === 'minhas' ? 'text-red-100' : 'text-red-700'
                  }`}>
                    Minhas Atrasadas
                  </span>
                  <span className={`text-2xl font-black mt-0.5 block ${
                    statusFilter === 'atrasadas' && taskScopeMode === 'minhas' ? 'text-white' : 'text-red-700'
                  }`}>
                    {myOverdueTasksCount}
                  </span>
                </div>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold ${
                  statusFilter === 'atrasadas' && taskScopeMode === 'minhas' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
                }`}>
                  <AlertCircle className="h-5 w-5" />
                </div>
              </button>

              {/* Metric 3: Minhas Concluídas */}
              <button
                onClick={() => {
                  setTaskScopeMode('minhas');
                  setSelectedCollaboratorUid(null);
                  setStatusFilter('concluida');
                  setSelectedUserFilterForCompleted('minhas');
                }}
                className={`rounded-2xl p-4 border text-left transition-all cursor-pointer flex items-center justify-between ${
                  statusFilter === 'concluida' && taskScopeMode === 'minhas'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400/30'
                    : 'bg-emerald-50/50 hover:bg-emerald-100/60 border-emerald-200 shadow-2xs'
                }`}
              >
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-wider block ${
                    statusFilter === 'concluida' && taskScopeMode === 'minhas' ? 'text-emerald-100' : 'text-emerald-700'
                  }`}>
                    Minhas Concluídas
                  </span>
                  <span className={`text-2xl font-black mt-0.5 block ${
                    statusFilter === 'concluida' && taskScopeMode === 'minhas' ? 'text-white' : 'text-emerald-700'
                  }`}>
                    {myCompletedTasksCount}
                  </span>
                </div>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold ${
                  statusFilter === 'concluida' && taskScopeMode === 'minhas' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </button>
            </div>

            {/* Lista e Filtros de Minhas Tarefas Alocados no Topo */}
            {taskScopeMode === 'minhas' && renderTaskListSection()}
          </motion.div>
        )}
      </div>

      {/* Seção 2: Tarefas Atribuídas */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shadow-2xs">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <span>Tarefas Atribuídas</span>
                <span className="text-xs font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                  {activeCollaboratorOptions.length} {activeCollaboratorOptions.length === 1 ? 'colaborador' : 'colaboradores'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Selecione um colaborador abaixo para visualizar apenas as tarefas atribuídas a ele
              </p>
            </div>
          </div>

          {(selectedCollaboratorUid || taskScopeMode === 'colaborador') && (
            <button
              onClick={() => {
                setTaskScopeMode('minhas');
                setSelectedCollaboratorUid(null);
              }}
              className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              <span>Voltar para Minhas Tarefas</span>
            </button>
          )}
        </div>

        {/* Grid de Colaboradores com Tarefas Atribuídas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Card Todos */}
          <button
            onClick={() => {
              setTaskScopeMode('todas');
              setSelectedCollaboratorUid(null);
            }}
            className={`p-3.5 rounded-2xl border transition-all text-left cursor-pointer flex items-center gap-3 ${
              taskScopeMode === 'todas'
                ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-400/30'
                : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <div className={`h-10 w-10 rounded-xl font-black flex items-center justify-center text-xs shrink-0 ${
              taskScopeMode === 'todas' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
            }`}>
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-extrabold text-xs block truncate">Todos os Colaboradores</span>
              <span className={`text-[10px] font-semibold block truncate ${
                taskScopeMode === 'todas' ? 'text-blue-100' : 'text-slate-500'
              }`}>
                Ver todas as tarefas
              </span>
            </div>
          </button>

          {/* Individual Collaborator Cards */}
          {activeCollaboratorOptions.length === 0 ? (
            <div className="col-span-full sm:col-span-2 md:col-span-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-center text-xs text-slate-500 font-medium">
              Nenhum colaborador com tarefas em aberto ou atrasadas no momento.
            </div>
          ) : (
            activeCollaboratorOptions.map((collab) => {
              const isSelected = taskScopeMode === 'colaborador' && (
                selectedCollabObj?.uid === collab.uid || 
                selectedCollabObj?.email?.toLowerCase() === collab.email?.toLowerCase() ||
                (selectedCollaboratorUid && (
                  selectedCollaboratorUid === collab.uid || 
                  selectedCollaboratorUid.toLowerCase() === collab.email?.toLowerCase() ||
                  selectedCollaboratorUid.toLowerCase() === collab.name.toLowerCase() ||
                  collab.name.toLowerCase().includes(selectedCollaboratorUid.toLowerCase())
                ))
              );

              const counts = getCollabCounts(collab);

              return (
                <button
                  key={collab.uid || collab.email || collab.name}
                  onClick={() => {
                    const cid = collab.uid || collab.email || collab.name;
                    if (isSelected) {
                      setTaskScopeMode('minhas');
                      setSelectedCollaboratorUid(null);
                    } else {
                      setTaskScopeMode('colaborador');
                      setSelectedCollaboratorUid(cid);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all text-left cursor-pointer flex items-center justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-gradient-to-br from-blue-700 to-slate-900 text-white border-blue-800 shadow-md ring-2 ring-blue-500/40'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`h-10 w-10 rounded-xl font-extrabold flex items-center justify-center text-xs shrink-0 ${
                      isSelected ? 'bg-blue-500/30 text-white border border-blue-400/40' : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {collab.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-extrabold text-xs block truncate leading-tight">
                        {collab.name}
                      </span>
                      <span className={`text-[10px] font-semibold block truncate mt-0.5 ${
                        isSelected ? 'text-blue-200' : 'text-slate-500'
                      }`}>
                        {collab.role || 'Colaborador'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 shrink-0">
                    {counts.open > 0 && (
                      <div className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-amber-500/30 text-amber-200 border border-amber-400/30'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>{counts.open} {counts.open === 1 ? 'aberta' : 'abertas'}</span>
                      </div>
                    )}
                    {counts.overdue > 0 && (
                      <div className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-red-500/30 text-red-200 border border-red-400/30'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0 animate-pulse" />
                        <span>{counts.overdue} {counts.overdue === 1 ? 'atrasada' : 'atrasadas'}</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Banner de Status Ativo do Colaborador Selecionado */}
      {selectedCollabObj && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-blue-700/50 space-y-3"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-blue-500/20 border border-blue-400/40 text-blue-300 font-black flex items-center justify-center text-sm shadow-inner">
                {selectedCollabObj.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <span>Painel de Tarefas: {selectedCollabObj.name}</span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-blue-500/30 text-blue-200 border border-blue-400/30 rounded-full">
                    {selectedCollabObj.role || 'Colaborador'}
                  </span>
                </h3>
                <p className="text-xs text-blue-200">
                  Exibindo tarefas de <strong>{selectedCollabObj.name}</strong>. Clique nos botões abaixo para alternar entre Abertas, Atrasadas e Concluídas:
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setTaskScopeMode('minhas');
                setSelectedCollaboratorUid(null);
              }}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <X className="h-4 w-4" />
              <span>Voltar para Minhas Tarefas</span>
            </button>
          </div>

          {/* Botões de Filtro Rápido por Status do Colaborador */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-blue-800/60">
            <button
              onClick={() => setStatusFilter('abertas')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                statusFilter === 'abertas'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md ring-2 ring-blue-300/40'
                  : 'bg-white/5 hover:bg-white/10 text-blue-100 border-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-300" />
                <span className="text-xs font-extrabold">Tarefas Abertas</span>
              </div>
              <span className="text-base font-black px-2.5 py-0.5 rounded-lg bg-blue-500/30 border border-blue-300/30">
                {collabOpenCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('atrasadas')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                statusFilter === 'atrasadas'
                  ? 'bg-red-600 text-white border-red-400 shadow-md ring-2 ring-red-300/40'
                  : 'bg-white/5 hover:bg-white/10 text-red-200 border-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="text-xs font-extrabold text-red-200">Tarefas Atrasadas</span>
              </div>
              <span className="text-base font-black px-2.5 py-0.5 rounded-lg bg-red-500/30 border border-red-300/30 text-red-100">
                {collabOverdueCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('concluida')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                statusFilter === 'concluida'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-300/40'
                  : 'bg-white/5 hover:bg-white/10 text-emerald-200 border-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span className="text-xs font-extrabold text-emerald-200">Tarefas Concluídas</span>
              </div>
              <span className="text-base font-black px-2.5 py-0.5 rounded-lg bg-emerald-500/30 border border-emerald-300/30 text-emerald-100">
                {collabCompletedCount}
              </span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Lista de tarefas de colaboradores ou todas quando selecionadas */}
      {taskScopeMode !== 'minhas' && renderTaskListSection()}

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
                  <SpellCheckInput
                    label="Título da Tarefa *"
                    required
                    value={newTitle}
                    onChangeValue={(val) => setNewTitle(val)}
                    placeholder="Ex: Elaborar relatório de vendas ou Revisar POP"
                  />
                </div>

                <div>
                  <SpellCheckTextarea
                    label="Descrição Detalhada / Instruções"
                    rows={3}
                    value={newDescription}
                    onChangeValue={(val) => setNewDescription(val)}
                    placeholder="Instruções específicas para o colaborador realizar a tarefa..."
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

      {/* Modal para Visualizar e Editar Detalhes da Tarefa Atribuída */}
      <AnimatePresence>
        {selectedTaskForView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative space-y-6 max-h-[90vh] overflow-y-auto text-left"
            >
              {isEditingTask ? (
                /* MODAL MODO EDIÇÃO COMPLETA DA TAREFA */
                <form onSubmit={handleSaveTaskEdit} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 inline-flex items-center gap-1">
                        <Pencil className="h-3 w-3 text-amber-700" />
                        <span>Modo Edição de Tarefa</span>
                      </span>
                      <h3 className="text-lg font-black text-slate-900 pt-1">
                        Editar Tarefa & Destinatário
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingTask(false)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Seleção de Colaborador Destinatário pelo Nome */}
                  <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 space-y-2">
                    <label className="block text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-amber-700" />
                      <span>Colaborador Destinatário (Para) *</span>
                    </label>

                    <select
                      value={editRecipient}
                      onChange={(e) => setEditRecipient(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
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

                    <p className="text-[11px] text-amber-900 font-medium leading-tight">
                      Você pode alterar para quem esta tarefa foi atribuída a qualquer momento.
                    </p>
                  </div>

                  <div>
                    <SpellCheckInput
                      label="Título da Tarefa *"
                      required
                      value={editTitle}
                      onChangeValue={(val) => setEditTitle(val)}
                      placeholder="Título da tarefa..."
                    />
                  </div>

                  <div>
                    <SpellCheckTextarea
                      label="Descrição Detalhada / Instruções"
                      rows={3}
                      value={editDescription}
                      onChangeValue={(val) => setEditDescription(val)}
                      placeholder="Instruções para o colaborador..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Prioridade
                      </label>
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as 'baixa' | 'media' | 'alta')}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Status da Tarefa
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as 'pendente' | 'em_andamento' | 'concluida')}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="pendente">Pendente</option>
                        <option value="em_andamento">Em Andamento</option>
                        <option value="concluida">Concluída</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Data Limite (Prazo Final)
                    </label>
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Anexo Inicial Edição */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Paperclip className="h-3.5 w-3.5 text-blue-600" />
                        <span>Documento Anexo Inicial</span>
                      </span>
                      {selectedTaskForView.attachmentUrl && editAttachmentFile !== 'remove' && (
                        <span className="text-[10px] text-slate-500">Anexo atual mantido</span>
                      )}
                    </label>

                    {editAttachmentFile === 'remove' ? (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
                        <span>Anexo original será removido ao salvar</span>
                        <button
                          type="button"
                          onClick={() => setEditAttachmentFile(null)}
                          className="text-xs font-bold underline hover:text-red-900 cursor-pointer"
                        >
                          Desfazer
                        </button>
                      </div>
                    ) : editAttachmentFile && typeof editAttachmentFile === 'object' ? (
                      <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                        <span className="truncate max-w-[180px] font-bold" title={editAttachmentFile.name}>
                          Novo anexo: {editAttachmentFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditAttachmentFile(null)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-blue-100 cursor-pointer"
                          title="Remover novo anexo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : selectedTaskForView.attachmentUrl ? (
                      <div className="flex items-center justify-between p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800">
                        <span className="truncate max-w-[180px] font-bold" title={selectedTaskForView.attachmentName}>
                          {selectedTaskForView.attachmentName || 'Documento anexado'}
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer">
                            Substituir
                            <input
                              type="file"
                              className="hidden"
                              onChange={handleEditFileChange}
                              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.ppt,.pptx"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setEditAttachmentFile('remove')}
                            className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                          >
                            Excluir Anexo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 border border-dashed border-slate-300 hover:border-blue-500 rounded-xl text-xs font-bold text-slate-600 hover:text-blue-600 cursor-pointer transition-colors h-[38px]">
                        <Paperclip className="h-4 w-4 text-blue-600" />
                        <span>Anexar Arquivo Inicial</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleEditFileChange}
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.ppt,.pptx"
                        />
                      </label>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditingTask(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEdit || !editTitle.trim()}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{isSavingEdit ? 'Salvando...' : 'Salvar Alterações'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* MODAL MODO VISUALIZAÇÃO DE DETALHES */
                <>
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
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditTask(selectedTaskForView)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                        title="Editar título, destinatário, prazo ou instruções"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>Editar Tarefa</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTaskForView(null);
                          setIsEditingTask(false);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
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

                      <SpellCheckTextarea
                        value={completionNoteText}
                        onChangeValue={(val) => setCompletionNoteText(val)}
                        placeholder="Escreva uma observação de entrega (opcional)..."
                        rows={2}
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
                        onClick={() => openEditTask(selectedTaskForView)}
                        className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Pencil className="h-4 w-4" />
                        <span>Editar Tarefa</span>
                      </button>

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
                      onClick={() => {
                        setSelectedTaskForView(null);
                        setIsEditingTask(false);
                      }}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal to Clear/Purge All Tasks */}
      <AnimatePresence>
        {showClearConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-rose-600">
                  <div className="h-10 w-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Limpar Módulo de Tarefas</h3>
                    <p className="text-xs text-slate-500 font-medium">Ação de Limpeza de Históricos</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowClearConfirmModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 text-xs text-rose-900 space-y-2">
                <p className="font-bold text-rose-950 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>Atenção: Limpeza Completa de Banco e Históricos</span>
                </p>
                <p className="leading-relaxed">
                  Esta ação excluirá permanentemente <strong>TODAS as tarefas cadastradas e todo o histórico de entregas e conclusões</strong> do banco de dados Firestore e do armazenamento local.
                </p>
                <p className="font-semibold text-rose-800">
                  O sistema de tarefas ficará 100% limpo e zerado para os seus novos testes.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearConfirmModal(false)}
                  disabled={isClearingTasks}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleClearAllTasks}
                  disabled={isClearingTasks}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isClearingTasks ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Limpando Banco...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Confirmar e Excluir Tudo</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Completion Toast Notification */}
      <AnimatePresence>
        {completionToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-emerald-500/30 flex items-center gap-3.5 max-w-sm pointer-events-auto"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>🎉 Tarefa Concluída!</span>
              </p>
              <p className="text-xs font-bold text-slate-100 truncate mt-0.5">{completionToast.title}</p>
              <p className="text-[11px] text-slate-400 font-medium truncate">{completionToast.subtitle}</p>
            </div>
            <button
              onClick={() => setCompletionToast(null)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

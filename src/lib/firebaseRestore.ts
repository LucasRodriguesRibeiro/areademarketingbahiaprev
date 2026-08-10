import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { supabaseService } from './supabaseService';

export interface RestoreStats {
  tasksRestored: number;
  ordersRestored: number;
  surveysRestored: number;
  errors: string[];
}

let hasAutoSynced = false;

export async function autoSyncAllFirebaseToSupabase(): Promise<RestoreStats | null> {
  if (hasAutoSynced) return null;
  hasAutoSynced = true;
  return restoreAllFirebaseDataToSupabaseAndLocal();
}

export async function restoreAllFirebaseDataToSupabaseAndLocal(): Promise<RestoreStats> {
  const stats: RestoreStats = {
    tasksRestored: 0,
    ordersRestored: 0,
    surveysRestored: 0,
    errors: [],
  };

  try {
    // 1. Restore Tasks from 'user_tasks'
    try {
      const tasksSnap = await getDocs(collection(db, 'user_tasks'));
      const tasksList: any[] = [];

      for (const docSnap of tasksSnap.docs) {
        const data = docSnap.data();
        const rawCreatedAt = data.createdAt;
        let parsedCreatedAt = new Date().toISOString();
        if (rawCreatedAt) {
          if (typeof rawCreatedAt.toDate === 'function') {
            parsedCreatedAt = rawCreatedAt.toDate().toISOString();
          } else if (typeof rawCreatedAt.seconds === 'number') {
            parsedCreatedAt = new Date(rawCreatedAt.seconds * 1000).toISOString();
          } else if (typeof rawCreatedAt === 'string' && rawCreatedAt.trim()) {
            parsedCreatedAt = rawCreatedAt;
          }
        }

        const rawCompletedAt = data.completedAt;
        let parsedCompletedAt: string | undefined = undefined;
        if (rawCompletedAt) {
          if (typeof rawCompletedAt.toDate === 'function') {
            parsedCompletedAt = rawCompletedAt.toDate().toISOString();
          } else if (typeof rawCompletedAt.seconds === 'number') {
            parsedCompletedAt = new Date(rawCompletedAt.seconds * 1000).toISOString();
          } else if (typeof rawCompletedAt === 'string' && rawCompletedAt.trim()) {
            parsedCompletedAt = rawCompletedAt;
          }
        }

        const taskItem = {
          ...data,
          id: docSnap.id,
          userId: data.userId || '',
          userEmail: data.userEmail || '',
          createdByName: data.createdByName || 'Colaborador',
          title: data.title || '',
          description: data.description || '',
          category: data.category || 'Geral',
          priority: data.priority || 'media',
          status: data.status || 'pendente',
          dueDate: data.dueDate || '',
          createdByAdmin: data.createdByAdmin || false,
          assignedToType: data.assignedToType || 'me',
          assignedToName: data.assignedToName || '',
          assignedToEmail: data.assignedToEmail || '',
          attachmentName: data.attachmentName || undefined,
          attachmentUrl: data.attachmentUrl || undefined,
          attachmentType: data.attachmentType || undefined,
          attachments: Array.isArray(data.attachments) ? data.attachments : (data.attachmentUrl ? [{ name: data.attachmentName || 'Anexo', url: data.attachmentUrl, type: data.attachmentType }] : []),
          completionAttachmentName: data.completionAttachmentName || undefined,
          completionAttachmentUrl: data.completionAttachmentUrl || undefined,
          completionAttachmentType: data.completionAttachmentType || undefined,
          completionAttachments: Array.isArray(data.completionAttachments) ? data.completionAttachments : (data.completionAttachmentUrl ? [{ name: data.completionAttachmentName || 'Entrega', url: data.completionAttachmentUrl, type: data.completionAttachmentType }] : []),
          completionNote: data.completionNote || undefined,
          completedAt: parsedCompletedAt,
          completedByEmail: data.completedByEmail || undefined,
          completedByName: data.completedByName || undefined,
          createdAt: parsedCreatedAt,
        };

        tasksList.push(taskItem);

        // Save to Supabase
        await supabaseService.saveTask(taskItem);
        stats.tasksRestored++;
      }

      if (tasksList.length > 0) {
        localStorage.setItem('tasks_v2_global', JSON.stringify(tasksList));
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('tasks_v2_')) {
            localStorage.setItem(key, JSON.stringify(tasksList));
          }
        });
      }
    } catch (err: any) {
      console.warn('Erro ao restaurar tarefas do Firebase:', err);
      stats.errors.push(`Tarefas: ${err?.message || String(err)}`);
    }

    // 2. Restore Funeral Orders from 'funeraria_os'
    try {
      const osSnap = await getDocs(collection(db, 'funeraria_os'));
      const osList: any[] = [];

      for (const docSnap of osSnap.docs) {
        const data = docSnap.data();
        const osItem = {
          ...data,
          id: docSnap.id,
          osNumber: data.osNumber || `OS-${docSnap.id.substring(0, 6)}`,
          status: data.status || 'Aberto',
          prioridade: data.prioridade || 'Normal',
          responsavelName: data.responsavelName || '',
          responsavelEmail: data.responsavelEmail || '',
          responsavelUid: data.responsavelUid || '',
          atendenteName: data.atendenteName || '',
          unidadeAtendimento: data.unidadeAtendimento || '',
          formData: data.formData || {},
          checklist: data.checklist || [],
          timeline: data.timeline || [],
          agentesAcompanhamento: data.agentesAcompanhamento || [],
          photos: data.photos || [],
          audioMemos: data.audioMemos || [],
          createdAtISO: data.createdAtISO || new Date().toISOString(),
          dateFormatted: data.dateFormatted || '',
          timeFormatted: data.timeFormatted || '',
          updatedAtISO: data.updatedAtISO || new Date().toISOString(),
        };

        osList.push(osItem);

        // Save to Supabase
        await supabaseService.saveOrder(osItem);
        stats.ordersRestored++;
      }

      if (osList.length > 0) {
        localStorage.setItem('funeraria_os_v1', JSON.stringify(osList));
      }
    } catch (err: any) {
      console.warn('Erro ao restaurar OS da funerária:', err);
      stats.errors.push(`Ordens de Serviço: ${err?.message || String(err)}`);
    }

    // 3. Restore Satisfaction Surveys from 'funeraria_satisfaction_surveys'
    try {
      const surveySnap = await getDocs(collection(db, 'funeraria_satisfaction_surveys'));
      const surveyList: any[] = [];

      for (const docSnap of surveySnap.docs) {
        const data = docSnap.data();
        const surveyItem = {
          ...data,
          id: docSnap.id,
          osNumber: data.osNumber || '',
          falecidoNome: data.falecidoNome || '',
          familiarNome: data.familiarNome || '',
          familiarTelefone: data.familiarTelefone || '',
          atendenteNome: data.atendenteNome || '',
          agenteNome: data.agenteNome || '',
          dataAtendimento: data.dataAtendimento || '',
          statusPesquisa: data.statusPesquisa || 'Pendente',
          npsScore: data.npsScore ?? 10,
          avaliacaoAtendimento: data.avaliacaoAtendimento ?? 5,
          avaliacaoRemocao: data.avaliacaoRemocao ?? 5,
          avaliacaoVelorio: data.avaliacaoVelorio ?? 5,
          avaliacaoGeral: data.avaliacaoGeral ?? 5,
          observacoesFamiliar: data.observacoesFamiliar || '',
          pontosMelhoria: data.pontosMelhoria || '',
          entrevistadorNome: data.entrevistadorNome || '',
          dataPesquisaRealizada: data.dataPesquisaRealizada || '',
          createdAtISO: data.createdAtISO || new Date().toISOString(),
        };

        surveyList.push(surveyItem);
        await supabaseService.saveSurvey(surveyItem);
        stats.surveysRestored++;
      }

      if (surveyList.length > 0) {
        localStorage.setItem('funeraria_satisfaction_surveys_v1', JSON.stringify(surveyList));
      }
    } catch (err: any) {
      console.warn('Erro ao restaurar pesquisas de satisfação:', err);
      stats.errors.push(`Pesquisas: ${err?.message || String(err)}`);
    }

    // 4. Restore POPs
    try {
      const popsSnap = await getDocs(collection(db, 'pops'));
      for (const docSnap of popsSnap.docs) {
        const data = docSnap.data();
        await supabaseService.savePop({ id: docSnap.id, ...data });
      }
    } catch (err: any) {
      console.warn('Erro ao restaurar POPs:', err);
    }

    // 5. Restore Posts (Feed)
    try {
      const postsSnap = await getDocs(collection(db, 'posts'));
      for (const docSnap of postsSnap.docs) {
        const data = docSnap.data();
        await supabaseService.savePost({ id: docSnap.id, ...data });

        // Restore comments for this post
        try {
          const commentsSnap = await getDocs(collection(db, 'posts', docSnap.id, 'comments'));
          for (const commentDoc of commentsSnap.docs) {
            const commentData = commentDoc.data();
            await supabaseService.savePostComment({ id: commentDoc.id, postId: docSnap.id, ...commentData });
          }
        } catch (err) {
          console.warn('Erro ao restaurar comentários do post:', docSnap.id, err);
        }
      }
    } catch (err: any) {
      console.warn('Erro ao restaurar posts do feed:', err);
    }

    // 6. Restore Users
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      for (const docSnap of usersSnap.docs) {
        const data = docSnap.data();
        await supabaseService.saveUser({ uid: docSnap.id, ...data });
      }
    } catch (err: any) {
      console.warn('Erro ao restaurar usuários:', err);
    }
  } catch (globalErr: any) {
    stats.errors.push(`Global: ${globalErr?.message || String(globalErr)}`);
  }

  return stats;
}


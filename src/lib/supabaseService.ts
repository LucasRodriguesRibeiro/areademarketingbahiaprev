import { getSupabaseClient } from './supabase';
import { formatUserName } from '../utils/userNameFormatter';

// Helper to convert camelCase OS object to Supabase snake_case table row
export function mapOsToSupabaseRow(osData: any) {
  return {
    id: osData.id,
    os_number: osData.osNumber,
    status: osData.status || 'Aberto',
    prioridade: osData.prioridade || 'Normal',
    responsavel_name: osData.responsavelName || '',
    responsavel_email: osData.responsavelEmail || '',
    responsavel_uid: osData.responsavelUid || '',
    atendente_name: osData.atendenteName || '',
    unidade_atendimento: osData.unidadeAtendimento || '',
    form_data: osData.formData || null,
    checklist: osData.checklist || [],
    timeline: osData.timeline || [],
    agentes_acompanhamento: osData.agentesAcompanhamento || [],
    photos: osData.photos || [],
    audio_memos: osData.audioMemos || [],
    created_at_iso: osData.createdAtISO || new Date().toISOString(),
    date_formatted: osData.dateFormatted || '',
    time_formatted: osData.timeFormatted || '',
    updated_at_iso: osData.updatedAtISO || new Date().toISOString()
  };
}

// Helper to convert Supabase snake_case row back to app OS format
export function mapSupabaseRowToOs(row: any) {
  return {
    id: row.id,
    osNumber: row.os_number,
    status: row.status,
    prioridade: row.prioridade,
    responsavelName: row.responsavel_name,
    responsavelEmail: row.responsavel_email,
    responsavelUid: row.responsavel_uid,
    atendenteName: row.atendente_name,
    unidadeAtendimento: row.unidade_atendimento,
    formData: row.form_data,
    checklist: row.checklist || [],
    timeline: row.timeline || [],
    agentesAcompanhamento: row.agentes_acompanhamento || [],
    photos: row.photos || [],
    audioMemos: row.audio_memos || [],
    createdAtISO: row.created_at_iso,
    dateFormatted: row.date_formatted,
    timeFormatted: row.time_formatted,
    updatedAtISO: row.updated_at_iso
  };
}

// Helper to pack extra metadata into description if data_json column is absent
export function packTaskMetadata(description: string, task: any): string {
  const meta: Record<string, any> = {};
  if (task.userEmail) meta.userEmail = task.userEmail;
  if (task.userId) meta.userId = task.userId;
  if (task.createdByName) meta.createdByName = task.createdByName;
  if (task.assignedToEmail) meta.assignedToEmail = task.assignedToEmail;
  if (task.assignedToName) meta.assignedToName = task.assignedToName;
  if (task.assignedToType) meta.assignedToType = task.assignedToType;
  if (task.attachments && task.attachments.length > 0) meta.attachments = task.attachments;
  if (task.completionAttachments && task.completionAttachments.length > 0) meta.completionAttachments = task.completionAttachments;
  if (task.completionNote) meta.completionNote = task.completionNote;
  if (task.completedAt) meta.completedAt = task.completedAt;
  if (task.completedByEmail) meta.completedByEmail = task.completedByEmail;
  if (task.completedByName) meta.completedByName = task.completedByName;
  if (task.createdByAdmin) meta.createdByAdmin = task.createdByAdmin;

  const cleanDesc = (description || '').replace(/^<!-- TASK_META:[\s\S]*?-->\n?/i, '').trim();
  if (Object.keys(meta).length === 0) return cleanDesc;
  return `<!-- TASK_META:${JSON.stringify(meta)} -->\n${cleanDesc}`;
}

// Helper to unpack metadata from description
export function unpackTaskMetadata(description: string): { cleanDescription: string; meta: Record<string, any> } {
  if (!description) return { cleanDescription: '', meta: {} };
  const match = description.match(/^<!-- TASK_META:([\s\S]*?)-->\n?/i);
  if (match && match[1]) {
    try {
      const meta = JSON.parse(match[1]);
      const cleanDescription = description.replace(/^<!-- TASK_META:[\s\S]*?-->\n?/i, '');
      return { cleanDescription, meta };
    } catch {
      return { cleanDescription: description, meta: {} };
    }
  }
  return { cleanDescription: description, meta: {} };
}

export const supabaseService = {
  // 1. FUNERARIA OS
  async fetchOrders(): Promise<any[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('funeraria_os')
        .select('*')
        .order('created_at_iso', { ascending: false });

      if (error) {
        console.warn('Erro ao buscar OS no Supabase:', error.message);
        return null;
      }

      return (data || []).map(mapSupabaseRowToOs);
    } catch (err) {
      console.warn('Falha na consulta do Supabase:', err);
      return null;
    }
  },

  async saveOrder(osData: any): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const row = mapOsToSupabaseRow(osData);
      const { error } = await supabase.from('funeraria_os').upsert(row, { onConflict: 'id' });

      if (error) {
        console.error('Erro ao salvar OS no Supabase:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Falha ao salvar OS no Supabase:', err);
      return false;
    }
  },

  async deleteOrder(osId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('funeraria_os').delete().eq('id', osId);
      if (error) {
        console.error('Erro ao excluir OS no Supabase:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      return false;
    }
  },

  // 2. USER TASKS
  async fetchTasks(): Promise<any[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase.from('user_tasks').select('*').order('created_at_iso', { ascending: false });
      if (error) {
        console.warn('Erro ao buscar tarefas no Supabase:', error.message);
        return null;
      }
      const taskRows = (data || []).filter((row: any) => row.id !== 'sys_team_roles_config' && row.title !== '__SYS_ROLES_CONFIG__');
      return taskRows.map((row: any) => {
        const { cleanDescription, meta } = unpackTaskMetadata(row.description || '');

        let assignedName = meta.assignedToName || row.assigned_to || '';
        let assignedEmail = meta.assignedToEmail || '';
        const rawAssigned = (row.assigned_to || '').toLowerCase().trim();

        // Auto-resolve known collaborator emails if missing
        if (!assignedEmail) {
          if (rawAssigned.includes('@')) {
            assignedEmail = row.assigned_to;
          } else if (rawAssigned.includes('cauan')) {
            assignedName = 'Cauan';
            assignedEmail = 'cauan@bahiaprev.com.br';
          } else if (rawAssigned.includes('lucas') || rawAssigned.includes('marketing')) {
            assignedName = 'Lucas Rodrigues';
            assignedEmail = 'lucasrodrigues@bahiaprev.com.br';
          } else if (rawAssigned.includes('jairo')) {
            assignedName = 'Jairo Queiroz';
            assignedEmail = 'jairoqueiroz@bahiaprev.com.br';
          } else if (rawAssigned.includes('nilton')) {
            assignedName = 'Nilton';
            assignedEmail = 'nilton@bahiaprev.com.br';
          } else if (rawAssigned.includes('thay')) {
            assignedName = 'Thayan';
            assignedEmail = 'thayan@bahiaprev.com.br';
          } else if (rawAssigned.includes('vitor')) {
            assignedName = 'Vitor';
            assignedEmail = 'vitor@bahiaprev.com.br';
          } else if (rawAssigned.includes('paulo')) {
            assignedName = 'Paulo';
            assignedEmail = 'paulo@bahiaprev.com.br';
          }
        }

        let createdName = meta.createdByName || row.created_by || 'Lucas Rodrigues';
        let creatorEmail = meta.userEmail || '';
        const rawCreator = (row.created_by || '').toLowerCase().trim();

        if (!creatorEmail) {
          if (rawCreator.includes('@')) {
            creatorEmail = row.created_by;
          } else if (rawCreator.includes('lucas') || rawCreator.includes('marketing')) {
            createdName = 'Lucas Rodrigues (Analista de Marketing)';
            creatorEmail = 'lucasrodrigues@bahiaprev.com.br';
          } else if (rawCreator.includes('jairo')) {
            createdName = 'Jairo Queiroz (Diretor)';
            creatorEmail = 'jairoqueiroz@bahiaprev.com.br';
          } else if (rawCreator.includes('nilton')) {
            createdName = 'Nilton (Colaborador)';
            creatorEmail = 'nilton@bahiaprev.com.br';
          }
        }

        let assignedType: 'specific_user' | 'all' | 'me' = meta.assignedToType || (rawAssigned === 'all' || rawAssigned.includes('todos') ? 'all' : (rawAssigned === 'me' ? 'me' : 'specific_user'));

        if (row.data_json && typeof row.data_json === 'object') {
          return {
            id: row.id,
            ...row.data_json,
            title: row.title || row.data_json.title,
            description: cleanDescription || row.data_json.description || '',
            category: row.category || row.data_json.category || 'Geral',
            priority: row.priority || row.data_json.priority || 'media',
            status: row.status || row.data_json.status || 'pendente',
            dueDate: row.due_date || row.data_json.dueDate || '',
            assignedToType: row.data_json.assignedToType || assignedType,
            assignedToName: row.data_json.assignedToName || assignedName,
            assignedToEmail: row.data_json.assignedToEmail || assignedEmail,
            createdByName: row.data_json.createdByName || createdName,
            userEmail: row.data_json.userEmail || creatorEmail,
            userId: row.data_json.userId || meta.userId || '',
            createdAt: row.created_at_iso || row.data_json.createdAt || new Date().toISOString(),
          };
        }

        return {
          id: row.id,
          userId: meta.userId || '',
          userEmail: creatorEmail,
          createdByName: createdName,
          title: row.title || '',
          description: cleanDescription,
          category: row.category || 'Geral',
          priority: (row.priority as any) || 'media',
          status: (row.status as any) || (row.completed ? 'concluida' : 'pendente'),
          dueDate: row.due_date || '',
          assignedToType: assignedType,
          assignedToName: assignedName,
          assignedToEmail: assignedEmail,
          createdByAdmin: meta.createdByAdmin || false,
          attachments: meta.attachments || [],
          attachmentName: meta.attachments?.[0]?.name,
          attachmentUrl: meta.attachments?.[0]?.url,
          attachmentType: meta.attachments?.[0]?.type,
          completionAttachments: meta.completionAttachments || [],
          completionAttachmentName: meta.completionAttachments?.[0]?.name,
          completionAttachmentUrl: meta.completionAttachments?.[0]?.url,
          completionAttachmentType: meta.completionAttachments?.[0]?.type,
          completionNote: meta.completionNote,
          completedAt: meta.completedAt || (row.completed ? row.created_at_iso : undefined),
          completedByEmail: meta.completedByEmail,
          completedByName: meta.completedByName,
          createdAt: row.created_at_iso || new Date().toISOString(),
        };
      });
    } catch (err) {
      console.warn('Falha na consulta de tarefas no Supabase:', err);
      return null;
    }
  },

  async saveTask(task: any): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const packedDescription = packTaskMetadata(task.description || '', task);

      const assignedDisplay = task.assignedToName || task.assignedToEmail || task.assignedTo || (task.assignedToType === 'all' ? 'Todos os Colaboradores' : 'Colaborador');
      const creatorDisplay = task.createdByName || task.userEmail || 'Lucas Rodrigues (Administrador)';

      const payload: any = {
        id: String(task.id),
        title: task.title || '',
        description: packedDescription,
        category: task.category || 'Geral',
        assigned_to: assignedDisplay,
        priority: task.priority || 'media',
        status: task.status || 'pendente',
        due_date: task.dueDate || '',
        completed: task.status === 'concluida',
        created_by: creatorDisplay,
        created_at_iso: task.createdAt || new Date().toISOString()
      };

      const { error } = await supabase.from('user_tasks').upsert(payload, { onConflict: 'id' });

      if (error) {
        console.warn('Erro ao salvar tarefa no Supabase:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Falha ao salvar tarefa no Supabase:', err);
      return false;
    }
  },

  async deleteTask(taskId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('user_tasks').delete().eq('id', taskId);
      if (error) {
        console.error('Erro ao excluir tarefa no Supabase:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Falha ao excluir tarefa no Supabase:', err);
      return false;
    }
  },

  // 3. SATISFACTION SURVEYS
  async fetchSurveys(): Promise<any[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('funeraria_satisfaction_surveys')
        .select('*')
        .order('created_at_iso', { ascending: false });
      if (error) return null;
      return (data || []).map((row: any) => ({
        id: row.id,
        osNumber: row.os_number || '',
        falecidoNome: row.falecido_nome || '',
        familiarNome: row.familiar_nome || '',
        familiarTelefone: row.familiar_telefone || '',
        atendenteNome: row.atendente_nome || '',
        agenteNome: row.agente_nome || '',
        dataAtendimento: row.data_atendimento || '',
        statusPesquisa: row.status_pesquisa || 'Pendente',
        npsScore: row.nps_score ?? 10,
        avaliacaoAtendimento: row.avaliacao_atendimento ?? 5,
        avaliacaoRemocao: row.avaliacao_remocao ?? 5,
        avaliacaoVelorio: row.avaliacao_velorio ?? 5,
        avaliacaoGeral: row.avaliacao_geral ?? 5,
        observacoesFamiliar: row.observacoes_familiar || '',
        pontosMelhoria: row.pontos_melhoria || '',
        entrevistadorNome: row.entrevistador_nome || '',
        dataPesquisaRealizada: row.data_pesquisa_realizada || '',
        createdAtISO: row.created_at_iso
      }));
    } catch {
      return null;
    }
  },

  async saveSurvey(survey: any): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('funeraria_satisfaction_surveys').upsert({
        id: String(survey.id),
        os_number: survey.osNumber || '',
        falecido_nome: survey.falecidoNome || '',
        familiar_nome: survey.familiarNome || '',
        familiar_telefone: survey.familiarTelefone || '',
        atendente_nome: survey.atendenteNome || '',
        agente_nome: survey.agenteNome || '',
        data_atendimento: survey.dataAtendimento || '',
        status_pesquisa: survey.statusPesquisa || 'Pendente',
        nps_score: survey.npsScore ?? 10,
        avaliacao_atendimento: survey.avaliacaoAtendimento ?? 5,
        avaliacao_remocao: survey.avaliacaoRemocao ?? 5,
        avaliacao_velorio: survey.avaliacaoVelorio ?? 5,
        avaliacao_geral: survey.avaliacaoGeral ?? 5,
        observacoes_familiar: survey.observacoesFamiliar || '',
        pontos_melhoria: survey.pontosMelhoria || '',
        entrevistador_nome: survey.entrevistadorNome || '',
        data_pesquisa_realizada: survey.dataPesquisaRealizada || '',
        created_at_iso: survey.createdAtISO || new Date().toISOString()
      }, { onConflict: 'id' });

      return !error;
    } catch {
      return false;
    }
  },

  async deleteSurvey(surveyId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('funeraria_satisfaction_surveys').delete().eq('id', surveyId);
      return !error;
    } catch {
      return false;
    }
  },

  // 4. POPS
  async fetchPops(): Promise<any[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('pops')
        .select('*')
        .order('created_at_iso', { ascending: false });
      if (error) return null;
      return (data || []).map((row: any) => ({
        id: row.id,
        codigo: row.codigo || '',
        titulo: row.titulo || '',
        categoria: row.categoria || '',
        versao: row.versao || '1.0',
        conteudo: row.conteudo || '',
        autor: row.autor || '',
        dataAtualizacao: row.data_atualizacao || '',
        createdAtISO: row.created_at_iso
      }));
    } catch {
      return null;
    }
  },

  async savePop(pop: any): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('pops').upsert({
        id: String(pop.id),
        codigo: pop.codigo || '',
        titulo: pop.titulo || pop.title || '',
        categoria: pop.categoria || pop.category || '',
        versao: pop.versao || pop.version || '1.0',
        conteudo: pop.conteudo || pop.content || '',
        autor: pop.autor || pop.author || '',
        data_atualizacao: pop.dataAtualizacao || pop.updatedAt || new Date().toISOString(),
        created_at_iso: pop.createdAtISO || pop.createdAt || new Date().toISOString()
      }, { onConflict: 'id' });
      return !error;
    } catch {
      return false;
    }
  },

  async deletePop(popId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('pops').delete().eq('id', popId);
      return !error;
    } catch {
      return false;
    }
  },

  // 5. POSTS (FEED)
  async fetchPosts(): Promise<any[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at_iso', { ascending: false });
      if (error) return null;
      return (data || []).map((row: any) => ({
        id: row.id,
        authorName: row.author_name || '',
        authorRole: row.author_role || '',
        authorUid: row.author_uid || '',
        content: row.content || '',
        type: row.type || 'comunicado',
        likes: row.likes || 0,
        likedBy: Array.isArray(row.liked_by) ? row.liked_by : [],
        createdAtISO: row.created_at_iso
      }));
    } catch {
      return null;
    }
  },

  async savePost(post: any): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('posts').upsert({
        id: String(post.id),
        author_name: post.authorName || post.author_name || '',
        author_role: post.authorRole || post.author_role || '',
        author_uid: post.authorUid || post.author_uid || '',
        content: post.content || '',
        type: post.type || 'comunicado',
        likes: post.likes || 0,
        liked_by: post.likedBy || post.liked_by || [],
        created_at_iso: post.createdAtISO || post.createdAt || new Date().toISOString()
      }, { onConflict: 'id' });
      return !error;
    } catch {
      return false;
    }
  },

  async deletePost(postId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      return !error;
    } catch {
      return false;
    }
  },

  // 6. POST COMMENTS
  async fetchPostComments(postId: string): Promise<any[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('posts_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at_iso', { ascending: true });
      if (error) return null;
      return (data || []).map((row: any) => ({
        id: row.id,
        postId: row.post_id,
        authorName: row.author_name || '',
        content: row.content || '',
        createdAtISO: row.created_at_iso
      }));
    } catch {
      return null;
    }
  },

  async fetchComments(postId: string): Promise<any[] | null> {
    return this.fetchPostComments(postId);
  },

  async savePostComment(comment: any): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('posts_comments').upsert({
        id: String(comment.id),
        post_id: String(comment.postId || comment.post_id),
        author_name: comment.authorName || comment.author_name || '',
        content: comment.content || '',
        created_at_iso: comment.createdAtISO || comment.createdAt || new Date().toISOString()
      }, { onConflict: 'id' });
      return !error;
    } catch {
      return false;
    }
  },

  async saveComment(comment: any): Promise<boolean> {
    return this.savePostComment(comment);
  },

  // 7. USERS
  _usersTableMissing: false,

  async fetchUsers(): Promise<any[] | null> {
    if (this._usersTableMissing) return null;
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST204' || error.message?.includes('404') || error.message?.includes('not exist')) {
          this._usersTableMissing = true;
        }
        return null;
      }
      return (data || []).map((row: any) => ({
        uid: row.uid,
        name: row.name || '',
        email: row.email || '',
        role: row.role || 'Colaborador',
        unit: row.unit || '',
        phone: row.phone || '',
        isOnline: Boolean(row.is_online),
        lastSeen: row.last_seen,
        avatarUrl: row.avatar_url || undefined,
        canPostFeed: row.can_post_feed !== undefined ? Boolean(row.can_post_feed) : true,
        canCreateTasks: row.can_create_tasks !== undefined ? Boolean(row.can_create_tasks) : true
      }));
    } catch {
      return null;
    }
  },

  async saveUser(user: any): Promise<boolean> {
    const cleanEmail = (user.email || '').toLowerCase().trim();
    const cleanRole = (user.role || '').trim();

    // Cache team role if email and role are present
    if (cleanEmail && cleanRole) {
      try {
        const cached = localStorage.getItem('bahiaprev_team_roles');
        const roles = cached ? JSON.parse(cached) : {};
        roles[cleanEmail] = cleanRole;
        localStorage.setItem('bahiaprev_team_roles', JSON.stringify(roles));
      } catch {}
    }

    if (this._usersTableMissing) return true;
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('users').upsert({
        uid: String(user.uid || user.id),
        name: formatUserName(user.name || user.displayName, cleanEmail),
        email: cleanEmail,
        role: cleanRole || 'Colaborador',
        unit: user.unit || '',
        phone: user.phone || '',
        is_online: Boolean(user.isOnline),
        last_seen: user.lastSeen || new Date().toISOString(),
        avatar_url: user.avatarUrl || null,
        can_post_feed: user.canPostFeed !== undefined ? Boolean(user.canPostFeed) : true,
        can_create_tasks: user.canCreateTasks !== undefined ? Boolean(user.canCreateTasks) : true
      }, { onConflict: 'uid' });
      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST204' || error.message?.includes('404') || error.message?.includes('not exist')) {
          this._usersTableMissing = true;
        }
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  async saveUserProfile(user: any): Promise<boolean> {
    const cleanEmail = (user.email || '').toLowerCase().trim();
    const cleanRole = (user.role || '').trim();
    if (cleanEmail && cleanRole) {
      await this.saveTeamRole(cleanEmail, cleanRole);
    }
    return this.saveUser(user);
  },

  async deleteUser(uid: string): Promise<boolean> {
    if (this._usersTableMissing) return true;
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('users').delete().eq('uid', uid);
      return !error;
    } catch {
      return false;
    }
  },

  async deleteUserProfile(uid: string): Promise<boolean> {
    return this.deleteUser(uid);
  },

  // 8. TEAM ROLES & CARGOS CONFIGURATION (Synchronized across all devices)
  async fetchTeamRoles(): Promise<Record<string, string>> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      try {
        const cached = localStorage.getItem('bahiaprev_team_roles');
        return cached ? JSON.parse(cached) : {};
      } catch {
        return {};
      }
    }

    try {
      const { data, error } = await supabase.from('user_tasks').select('description').eq('id', 'sys_team_roles_config').single();
      if (error || !data || !data.description) {
        // Fallback to localStorage cache
        try {
          const cached = localStorage.getItem('bahiaprev_team_roles');
          return cached ? JSON.parse(cached) : {};
        } catch {
          return {};
        }
      }
      const parsed = JSON.parse(data.description);
      if (parsed && typeof parsed === 'object') {
        try {
          localStorage.setItem('bahiaprev_team_roles', JSON.stringify(parsed));
        } catch {}
        return parsed;
      }
      return {};
    } catch {
      try {
        const cached = localStorage.getItem('bahiaprev_team_roles');
        return cached ? JSON.parse(cached) : {};
      } catch {
        return {};
      }
    }
  },

  async saveTeamRole(email: string, role: string): Promise<boolean> {
    if (!email || !role) return false;
    const supabase = getSupabaseClient();

    const cleanEmail = email.toLowerCase().trim();
    const cleanRole = role.trim();

    try {
      // 1. Get current config & update locally immediately
      const currentRoles = await this.fetchTeamRoles();
      currentRoles[cleanEmail] = cleanRole;

      try {
        localStorage.setItem('bahiaprev_team_roles', JSON.stringify(currentRoles));
      } catch {}

      if (!supabase) return true;

      // 2. Persist to Supabase user_tasks config
      const payload = {
        id: 'sys_team_roles_config',
        title: '__SYS_ROLES_CONFIG__',
        description: JSON.stringify(currentRoles),
        category: 'System',
        assigned_to: 'system',
        status: 'concluida',
        completed: true,
        created_by: 'system',
        created_at_iso: new Date().toISOString()
      };

      await supabase.from('user_tasks').upsert(payload, { onConflict: 'id' });

      // 3. Also update users table if it exists
      if (!this._usersTableMissing) {
        try {
          await supabase.from('users').update({ role: cleanRole }).eq('email', cleanEmail);
        } catch {}
      }

      return true;
    } catch {
      return false;
    }
  }
};

import { getSupabaseClient } from './supabase';

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
      return (data || []).map((row: any) => {
        if (row.data_json && typeof row.data_json === 'object') {
          return { id: row.id, ...row.data_json, status: row.status || row.data_json.status || 'pendente' };
        }
        return {
          id: row.id,
          title: row.title,
          description: row.description || '',
          category: row.category || '',
          priority: row.priority || 'media',
          status: row.status || 'pendente',
          dueDate: row.due_date || '',
          assignedTo: row.assigned_to || '',
          createdAt: row.created_at_iso,
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
      const payload: any = {
        id: String(task.id),
        title: task.title || '',
        description: task.description || '',
        category: task.category || '',
        assigned_to: task.assignedToName || task.assignedToEmail || task.assignedTo || '',
        priority: task.priority || 'media',
        status: task.status || 'pendente',
        due_date: task.dueDate || '',
        completed: task.status === 'concluida',
        created_by: task.createdByName || task.userEmail || task.userId || '',
        data_json: task,
        created_at_iso: task.createdAt || new Date().toISOString()
      };

      let { error } = await supabase.from('user_tasks').upsert(payload, { onConflict: 'id' });

      if (error && (error.message.includes('data_json') || error.code === 'PGRST204')) {
        delete payload.data_json;
        const fallback = await supabase.from('user_tasks').upsert(payload, { onConflict: 'id' });
        error = fallback.error;
      }

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
  async fetchUsers(): Promise<any[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) return null;
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
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('users').upsert({
        uid: String(user.uid || user.id),
        name: user.name || user.displayName || '',
        email: user.email || '',
        role: user.role || 'Colaborador',
        unit: user.unit || '',
        phone: user.phone || '',
        is_online: Boolean(user.isOnline),
        last_seen: user.lastSeen || new Date().toISOString(),
        avatar_url: user.avatarUrl || null,
        can_post_feed: user.canPostFeed !== undefined ? Boolean(user.canPostFeed) : true,
        can_create_tasks: user.canCreateTasks !== undefined ? Boolean(user.canCreateTasks) : true
      }, { onConflict: 'uid' });
      return !error;
    } catch {
      return false;
    }
  },

  async saveUserProfile(user: any): Promise<boolean> {
    return this.saveUser(user);
  },

  async deleteUser(uid: string): Promise<boolean> {
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
  }
};

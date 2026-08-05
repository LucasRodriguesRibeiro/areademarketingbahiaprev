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
      if (error) return null;
      return data || [];
    } catch {
      return null;
    }
  },

  async saveTask(task: any): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('user_tasks').upsert({
        id: task.id,
        title: task.title,
        description: task.description || '',
        category: task.category || '',
        assigned_to: task.assignedTo || '',
        priority: task.priority || 'Media',
        status: task.status || 'pendente',
        due_date: task.dueDate || '',
        completed: !!task.completed,
        created_by: task.createdBy || '',
        created_at_iso: task.createdAtISO || new Date().toISOString()
      }, { onConflict: 'id' });

      return !error;
    } catch {
      return false;
    }
  },

  // 3. SATISFACTION SURVEYS
  async saveSurvey(survey: any): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('funeraria_satisfaction_surveys').upsert({
        id: survey.id,
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
  }
};

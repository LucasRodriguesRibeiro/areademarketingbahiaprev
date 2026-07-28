// Utilitário de Corretor Ortográfico e Autocorreção em Português do Brasil (PT-BR)

// Dicionário expandido de palavras e correções comuns em Português do Brasil
const PT_BR_DICTIONARY: Record<string, string> = {
  // Acentuação e grafia comum de tarefas, relatórios e comunicações
  'nao': 'não',
  'voce': 'você',
  'voces': 'vocês',
  'tambem': 'também',
  'sao': 'são',
  'ja': 'já',
  'ate': 'até',
  'esta': 'está',
  'estao': 'estão',
  'estava': 'estava',
  'so': 'só',
  'posivel': 'possível',
  'possivel': 'possível',
  'impossivel': 'impossível',
  'tarefa': 'tarefa',
  'tarefas': 'tarefas',
  'revisao': 'revisão',
  'revisoes': 'revisões',
  'relatorio': 'relatório',
  'relatorios': 'relatórios',
  'observacao': 'observação',
  'observacoes': 'observações',
  'informacao': 'informação',
  'informacoes': 'informações',
  'duvida': 'dúvida',
  'duvidas': 'dúvidas',
  'atencao': 'atenção',
  'execucao': 'execução',
  'execucoes': 'execuções',
  'conclusao': 'conclusão',
  'conclusoes': 'conclusões',
  'solicitacao': 'solicitação',
  'solicitacoes': 'solicitações',
  'administracao': 'administração',
  'departamento': 'departamento',
  'inicio': 'início',
  'proximo': 'próximo',
  'proxima': 'próxima',
  'proximos': 'próximos',
  'proximas': 'próximas',
  'numero': 'número',
  'numeros': 'números',
  'pagina': 'página',
  'paginas': 'páginas',
  'unico': 'único',
  'unica': 'única',
  'analise': 'análise',
  'analises': 'análises',
  'servico': 'serviço',
  'servicos': 'serviços',
  'endereco': 'endereço',
  'enderecos': 'endereços',
  'declaracao': 'declaração',
  'declaracoes': 'declarações',
  'funeraria': 'funerária',
  'funerarias': 'funerárias',
  'velorio': 'velório',
  'velorios': 'velórios',
  'obituario': 'obituário',
  'obituarios': 'obituários',
  'obito': 'óbito',
  'obitos': 'óbitos',
  'certidao': 'certidão',
  'certidaos': 'certidões',
  'certidoes': 'certidões',
  'cemiterio': 'cemitério',
  'cemiterios': 'cemitérios',
  'atendimento': 'atendimento',
  'urgente': 'urgente',
  'prioridade': 'prioridade',
  'concluido': 'concluído',
  'concluida': 'concluída',
  'concluidos': 'concluídos',
  'concluidas': 'concluídas',
  'pendente': 'pendente',
  'andamento': 'andamento',
  'descricao': 'descrição',
  'descricoes': 'descrições',
  'orientacao': 'orientação',
  'orientacoes': 'orientações',
  'confirmacao': 'confirmação',
  'confirmacoes': 'confirmações',
  'validacao': 'validação',
  'validacoes': 'validações',
  'autorizacao': 'autorização',
  'autorizacoes': 'autorizações',
  'documento': 'documento',
  'documentos': 'documentos',
  'anexo': 'anexo',
  'anexos': 'anexos',
  'formulario': 'formulário',
  'formularios': 'formulários',
  'sabado': 'sábado',
  'domingo': 'domingo',
  'militar': 'militar',
  'politica': 'política',
  'duvida?': 'dúvida?',
  'agora': 'agora',
  'hoje': 'hoje',
  'amanha': 'amanhã',
  'critico': 'crítico',
  'critica': 'crítica',
  'rapido': 'rápido',
  'rapida': 'rápida',
  'facil': 'fácil',
  'dificil': 'difícil',
  'pratico': 'prático',
  'pratica': 'prática',
  'automatico': 'automático',
  'automatica': 'automática',
  'tecnico': 'técnico',
  'tecnica': 'técnica',
  'fisico': 'físico',
  'fisica': 'física',
  'juridico': 'jurídico',
  'juridica': 'jurídica',
  'medico': 'médico',
  'medica': 'médica',
  'saude': 'saúde',
  'obrigado': 'obrigado',
  'obrigada': 'obrigada',
  'porfavor': 'por favor',
  'vc': 'você',
  'vcs': 'vocês',
  'tb': 'também',
  'tbm': 'também',
  'pq': 'porque',
  'pq?': 'por quê?',
  'pra': 'para',
  'pro': 'para o',
  'pras': 'para as',
  'pros': 'para os',
};

/**
 * Normaliza mantendo maiúsculas/minúsculas da palavra original
 */
function preserveCasing(original: string, corrected: string): string {
  if (original === original.toUpperCase()) {
    return corrected.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase()) {
    return corrected.charAt(0).toUpperCase() + corrected.slice(1).toLowerCase();
  }
  return corrected.toLowerCase();
}

/**
 * Executa autocorreção completa do texto em Português do Brasil
 */
export function correctPtBrText(text: string): string {
  if (!text) return '';

  // 1. Substituir palavras sem acento ou com grafia abreviada pelo termo correto em PT-BR
  let corrected = text.replace(/\b[a-zA-ZáàâãéèêíïóôõöúçÑñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ]+\b/g, (match) => {
    const lower = match.toLowerCase();
    if (PT_BR_DICTIONARY[lower]) {
      return preserveCasing(match, PT_BR_DICTIONARY[lower]);
    }
    return match;
  });

  // 2. Corrigir pontuação (remover espaço antes de vírgula, ponto, interrogação, exclamação)
  corrected = corrected.replace(/\s+([.,!?;:])(?=\s|$)/g, '$1');

  // 3. Garantir letra maiúscula após pontuação final (. ! ?)
  corrected = corrected.replace(/(^\s*|[.!?]\s+)([a-zà-ú])/g, (_, p1, p2) => p1 + p2.toUpperCase());

  // 4. Limpar espaços duplos
  corrected = corrected.replace(/ {2,}/g, ' ');

  return corrected;
}

/**
 * Retorna lista de sugestões de correção ortográfica para o texto atual
 */
export function getPtBrSuggestions(text: string): Array<{ original: string; corrected: string }> {
  if (!text) return [];

  const words = text.match(/\b[a-zA-ZáàâãéèêíïóôõöúçÑñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ]+\b/g) || [];
  const suggestions: Array<{ original: string; corrected: string }> = [];
  const seen = new Set<string>();

  for (const word of words) {
    const lower = word.toLowerCase();
    if (PT_BR_DICTIONARY[lower] && PT_BR_DICTIONARY[lower] !== lower && !seen.has(lower)) {
      seen.add(lower);
      suggestions.push({
        original: word,
        corrected: preserveCasing(word, PT_BR_DICTIONARY[lower]),
      });
    }
  }

  return suggestions;
}

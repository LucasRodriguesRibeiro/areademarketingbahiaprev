// Utilitário de Corretor Ortográfico e Autocorreção em Português do Brasil (PT-BR)

// Lista mestre de palavras da norma culta em Português com acentuação e cedilha corretas
const ACCENTED_PT_BR_WORDS = [
  'não', 'você', 'vocês', 'também', 'são', 'já', 'até', 'está', 'estão', 'só',
  'possível', 'impossível', 'revisão', 'revisões', 'relatório', 'relatórios',
  'observação', 'observações', 'informação', 'informações', 'dúvida', 'dúvidas',
  'atenção', 'execução', 'execuções', 'conclusão', 'conclusões', 'solicitação',
  'solicitações', 'administração', 'departamento', 'início', 'próximo', 'próxima',
  'próximos', 'próximas', 'número', 'números', 'página', 'páginas', 'único', 'única',
  'análise', 'análises', 'serviço', 'serviços', 'endereço', 'endereços', 'declaração',
  'declarações', 'funerária', 'funerárias', 'velório', 'velórios', 'obituário',
  'obituários', 'óbito', 'óbitos', 'certidão', 'certidões', 'cemitério', 'cemitérios',
  'concluído', 'concluída', 'concluídos', 'concluídas', 'descrição', 'descrições',
  'orientação', 'orientações', 'confirmação', 'confirmações', 'validação',
  'validações', 'autorização', 'autorizações', 'formulário', 'formulários', 'sábado',
  'política', 'amanhã', 'porque', 'direção', 'ação', 'ações', 'produção', 'organização',
  'notificação', 'notificações', 'aprovação', 'alteração', 'alterações', 'correção',
  'correções', 'negociação', 'contratação', 'cotação', 'cotações', 'cobrança',
  'cobranças', 'ligação', 'ligações', 'reunião', 'reuniões', 'urgência', 'pendência',
  'pendências', 'orçamento', 'orçamentos', 'pagamento', 'solução', 'soluções',
  'avaliação', 'avaliações', 'verificação', 'verificações', 'manutenção',
  'manutenções', 'instalacão', 'instalação', 'instalações', 'operação', 'operações', 'função',
  'funções', 'situação', 'situações', 'condição', 'condições', 'definição',
  'definições', 'publicação', 'publicações', 'divulgação', 'benefício', 'benefícios',
  'auxílio', 'auxílios', 'inscrição', 'inscrições', 'matrícula', 'matrículas',
  'relação', 'relações', 'associação', 'associações', 'proteção', 'emissão',
  'emissões', 'transferência', 'transferências', 'cremação', 'cremações', 'carência',
  'carências', 'adesão', 'adesões', 'rescisão', 'rescisões', 'quitação', 'comissão',
  'comissões', 'gerência', 'gestão', 'liderança', 'estratégia', 'estratégias',
  'impressão', 'impressões', 'mídia', 'mídias', 'promoção', 'promoções', 'patrocínio',
  'patrocínios', 'configuração', 'configurações', 'atualização', 'atualizações',
  'usuário', 'usuários', 'permissão', 'permissões', 'segurança', 'técnico', 'técnica',
  'rápido', 'rápida', 'fácil', 'difícil', 'útil', 'público', 'pública', 'médico',
  'médica', 'jurídico', 'jurídica', 'período', 'prático', 'prática', 'crítico',
  'crítica', 'válido', 'válida', 'saída', 'saídas', 'atribuição', 'atribuições',
  'colaborador', 'colaboradores', 'histórico', 'históricos', 'geral', 'gerais'
];

/**
 * Remove acentos e caracteres especiais para comparação insensível a acentuação
 */
export function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/c/g, 'c')
    .toLowerCase();
}

// Mapa rápido gerado automaticamente a partir das palavras corretas
const DYNAMIC_WORD_MAP: Record<string, string> = {
  // Abreviações comuns
  'tb': 'também',
  'tbm': 'também',
  'pq': 'porque',
  'pra': 'para',
  'pro': 'para o',
  'pras': 'para as',
  'pros': 'para os',
  'pagto': 'pagamento',
  'pgto': 'pagamento',
  'posivel': 'possível',
  'imposivel': 'impossível',
};

// Preenche o mapa dinâmico vinculando palavras sem acento -> com acento
ACCENTED_PT_BR_WORDS.forEach((correctWord) => {
  const unaccented = removeAccents(correctWord);
  if (unaccented !== correctWord && !DYNAMIC_WORD_MAP[unaccented]) {
    DYNAMIC_WORD_MAP[unaccented] = correctWord;
  }
});

/**
 * Normaliza mantendo maiúsculas/minúsculas da palavra original
 */
export function preserveCasing(original: string, corrected: string): string {
  if (original === original.toUpperCase()) {
    return corrected.toUpperCase();
  }
  if (original.length > 0 && original[0] === original[0].toUpperCase()) {
    return corrected.charAt(0).toUpperCase() + corrected.slice(1).toLowerCase();
  }
  return corrected.toLowerCase();
}

/**
 * Busca a palavra corrigida correspondente
 */
export function findCorrectionForWord(word: string): string | null {
  if (!word) return null;
  const clean = word.toLowerCase();

  // 1. Verificação direta no mapa
  if (DYNAMIC_WORD_MAP[clean] && DYNAMIC_WORD_MAP[clean] !== clean) {
    return preserveCasing(word, DYNAMIC_WORD_MAP[clean]);
  }

  // 2. Verificação de remoção de acentos/cedilha
  const unaccented = removeAccents(clean);
  if (DYNAMIC_WORD_MAP[unaccented] && DYNAMIC_WORD_MAP[unaccented] !== clean) {
    return preserveCasing(word, DYNAMIC_WORD_MAP[unaccented]);
  }

  return null;
}

/**
 * Executa autocorreção completa do texto em Português do Brasil
 */
export function correctPtBrText(text: string): string {
  if (!text) return '';

  // 1. Substituir palavras sem acento ou com grafia abreviada pelo termo correto em PT-BR
  let corrected = text.replace(/\b[a-zA-ZáàâãéèêíïóôõöúçÑñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ]+\b/g, (match) => {
    const correction = findCorrectionForWord(match);
    return correction || match;
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
    if (!seen.has(lower)) {
      const correction = findCorrectionForWord(word);
      if (correction && correction.toLowerCase() !== lower) {
        seen.add(lower);
        suggestions.push({
          original: word,
          corrected: correction,
        });
      }
    }
  }

  return suggestions;
}

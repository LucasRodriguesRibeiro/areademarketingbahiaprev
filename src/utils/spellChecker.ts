// Utilitário de Corretor Ortográfico, Autocorreção e Correção de Erros de Digitação e Gramática em Português do Brasil (PT-BR)

// Lista mestre ampliada de palavras da norma culta em Português do Brasil (com acentuação e cedilha corretas)
const ACCENTED_PT_BR_WORDS = [
  // Verbos, substantivos, adjetivos e conectivos essenciais do dia a dia
  'acordo', 'acorda', 'acordar', 'acordado', 'acordados', 'aceito', 'aceita', 'aceitar',
  'ajuda', 'ajudar', 'ajustar', 'ajuste', 'ajustes', 'alterar', 'alteração', 'alterações',
  'trabalho', 'trabalhar', 'trabalhador', 'trabalhadores', 'empresa', 'empresas', 'cliente', 'clientes',
  'sistema', 'sistemas', 'processo', 'processos', 'projeto', 'projetos', 'documento', 'documentos',
  'pagamento', 'pagamentos', 'suporte', 'sucesso', 'resultado', 'resultados', 'resposta', 'respostas',
  'pergunta', 'perguntas', 'solicitar', 'solicitação', 'solicitações', 'atendimento', 'atendimentos',
  'funerária', 'funerárias', 'óbito', 'óbitos', 'obituário', 'obituários', 'velório', 'velórios',
  'sepultamento', 'sepultamentos', 'cemitério', 'cemitérios', 'contrato', 'contratos', 'item', 'itens',
  'valor', 'valores', 'quantidade', 'quantidades', 'cadastro', 'cadastros', 'cadastrar', 'excluir',
  'deletar', 'adicionar', 'remover', 'mudar', 'mudança', 'mudanças', 'fazer', 'feito', 'feita', 'fazendo', 'faz', 'fiz', 'fizeram', 'fizesse', 'fizer',
  'dizer', 'digo', 'diz', 'dizem', 'dizendo', 'dito', 'dita', 'disseram', 'dissesse',
  'trazer', 'trazendo', 'traz', 'trouxe', 'trazerem',
  'poder', 'posso', 'pode', 'podem', 'podia', 'podiam', 'querer', 'quero', 'quer', 'querem', 'queria', 'quiser', 'quisesse', 'quisemos', 'quis',
  'saber', 'sei', 'sabe', 'sabemos', 'sabem', 'ter', 'tenho', 'tem', 'temos', 'tinham', 'tido',
  'haver', 'há', 'houve', 'colocar', 'coloco', 'coloca', 'deixar', 'deixo', 'deixa', 'ver', 'vejo', 'vê', 'vêem', 'vistos', 'olhar',
  'olha', 'ir', 'vou', 'vai', 'vamos', 'vão', 'vir', 'venho', 'vem', 'vêm', 'vimos', 'chegar',
  'chego', 'chega', 'ficar', 'fico', 'fica', 'voltar', 'volto', 'volta', 'passar', 'passo', 'passa', 'passado', 'passada', 'passos',
  'ganhar', 'perder', 'achar', 'acho', 'acha', 'esperar', 'espero', 'espera', 'agora', 'depois',
  'hoje', 'ontem', 'amanhã', 'sempre', 'nunca', 'talvez', 'assim', 'então', 'também', 'mesmo',
  'mesma', 'mesmos', 'mesmas', 'outro', 'outra', 'outros', 'outras', 'primeiro', 'primeira',
  'primeiros', 'primeiras', 'segundo', 'segunda', 'terceiro', 'terceira', 'grande', 'grandes',
  'pequeno', 'pequena', 'pequenos', 'pequenas', 'novo', 'nova', 'novos', 'novas', 'bom', 'boa',
  'bons', 'boas', 'ruim', 'ruins', 'certo', 'certa', 'certos', 'certas', 'errado', 'errada',
  'errados', 'erradas', 'melhor', 'melhores', 'pior', 'piores', 'muito', 'muita', 'muitos', 'muitas',
  'pouco', 'pouca', 'poucos', 'poucas', 'bastante', 'mais', 'menos', 'tudo', 'nada', 'algo',
  'alguém', 'ninguém', 'qualquer', 'quaisquer', 'cada', 'onde', 'como', 'quando', 'quanto',
  'quanta', 'quantos', 'quantas', 'quem', 'qual', 'quais', 'porque', 'porquê', 'sim', 'não',
  'todos', 'todas', 'além', 'sobre', 'sob', 'entre', 'para', 'com', 'sem', 'por', 'até', 'desde',
  'após', 'conforme', 'durante', 'mediante', 'exceto', 'salvo', 'exemplo', 'exemplos',

  // Palavras com S (som de Z) e Z
  'pesquisa', 'pesquisas', 'pesquisar', 'pesquisado', 'pesquisador',
  'análise', 'análises', 'analisar', 'analisado', 'analisador',
  'aviso', 'avisos', 'avisar', 'avisado', 'improviso', 'improvisar',
  'revisão', 'revisar', 'revisado', 'paralisia', 'paralisar',
  'defesa', 'surpresa', 'francesa', 'inglesa', 'mesa', 'casa', 'visita', 'visitar',
  'usar', 'uso', 'usado', 'usados', 'preciso', 'precisa', 'precisar', 'precisava',
  'decisão', 'decisões', 'precisão',
  'produzir', 'conduzir', 'reduzir', 'traduzir', 'induzir',
  'realizar', 'realização', 'organizar', 'organização', 'atualizar', 'atualização',
  'sincronizar', 'sincronização', 'localizar', 'localização', 'visualizar', 'visualização',
  'priorizar', 'priorização', 'utilizar', 'utilização', 'autorizar', 'autorização',
  'fiscalizar', 'fiscalização', 'mecanizar', 'mecanização',
  'beleza', 'tristeza', 'certeza', 'clareza', 'limpeza', 'pobreza', 'fraqueza', 'riqueza', 'grandeza', 'natureza',
  'prazo', 'prazos', 'razoável', 'razão', 'razões', 'juízo', 'prejuízo', 'vazio', 'vazia',

  // Palavras com SS e S (regras de S/SS)
  'processo', 'processos', 'processar', 'processado', 'processamento',
  'sessão', 'sessões', 'pressão', 'pressões', 'discussão', 'discussões',
  'compromisso', 'compromissos', 'admissão', 'demissão', 'permissão', 'submissão', 'transmissão',
  'possível', 'possíveis', 'impossível', 'impossíveis', 'possibilidade', 'possibilidades',
  'assunto', 'assuntos', 'assistir', 'assistente', 'assistência', 'massa', 'classe', 'classes',
  'depressão', 'expressão', 'impressão', 'impressora', 'sucesso', 'acesso', 'acessos', 'progresso', 'congresso',
  'atravessar', 'atravessado', 'necessário', 'necessária', 'necessários', 'necessárias', 'necessidade',
  'pessimismo', 'pessimista', 'pessoal', 'pessoa', 'pessoas',
  'pensar', 'pensamento', 'pensando', 'conversar', 'conversa', 'conversando', 'insistir', 'insistência',
  'sensível', 'sensibilidade', 'consenso', 'extensão', 'pretensão', 'expulsar', 'expulsão', 'bolsa', 'bolsas',

  // Termos corporativos, gestão, tarefas, funeral, saúde e administrativa
  'título', 'títulos', 'descrição', 'descrições', 'funcionário', 'funcionária', 'funcionários', 'funcionárias',
  'tarefa', 'tarefas', 'módulo', 'módulos', 'instrução', 'instruções', 'conteúdo', 'conteúdos',
  'observação', 'observações', 'relatório', 'relatórios', 'informação', 'informações',
  'dúvida', 'dúvidas', 'atenção', 'execução', 'execuções', 'conclusão', 'conclusões',
  'administração', 'departamento', 'início', 'próximo', 'próxima', 'próximos', 'próximas',
  'número', 'números', 'página', 'páginas', 'único', 'única',
  'serviço', 'serviços', 'endereço', 'endereços', 'declaração', 'declarações',
  'certidão', 'certidões', 'concluído', 'concluída', 'concluídos', 'concluídas',
  'orientação', 'orientações', 'confirmação', 'confirmações', 'validação', 'validações',
  'autorização', 'autorizações', 'formulário', 'formulários', 'sábado', 'política',
  'direção', 'ação', 'ações', 'produção', 'notificação', 'notificações',
  'aprovação', 'correção', 'correções', 'negociação', 'contratação', 'cotação', 'cotações',
  'cobrança', 'cobranças', 'ligação', 'ligações', 'reunião', 'reuniões', 'urgência',
  'pendência', 'pendências', 'orçamento', 'orçamentos', 'solução', 'soluções',
  'avaliação', 'avaliações', 'verificação', 'verificações', 'manutenção', 'manutenções',
  'instalação', 'instalações', 'operação', 'operações', 'função', 'funções', 'situação',
  'situações', 'condição', 'condições', 'definição', 'definições', 'publicação',
  'publicações', 'divulgação', 'benefício', 'benefícios', 'auxílio', 'auxílios',
  'inscrição', 'inscrições', 'matrícula', 'matrículas', 'relação', 'relações',
  'associação', 'associações', 'proteção', 'emissão', 'emissões', 'transferência',
  'transferências', 'cremação', 'cremações', 'carência', 'carências', 'adesão',
  'adesões', 'rescisão', 'rescisões', 'quitação', 'comissão', 'comissões', 'gerência',
  'gestão', 'liderança', 'estratégia', 'estratégias',
  'mídia', 'mídias', 'promoção', 'promoções', 'patrocínio', 'patrocínios', 'configuração',
  'configurações', 'atualização', 'atualizações', 'usuário', 'usuários',
  'segurança', 'técnico', 'técnica', 'técnicos', 'técnicas', 'rápido',
  'rápida', 'fácil', 'difícil', 'útil', 'público', 'pública', 'médico', 'médica',
  'jurídico', 'jurídica', 'período', 'prático', 'prática', 'crítico', 'crítica',
  'válido', 'válida', 'saída', 'saídas', 'atribuição', 'atribuições', 'colaborador',
  'colaboradores', 'histórico', 'históricos', 'geral', 'gerais', 'responsável',
  'responsáveis', 'disponível', 'disponíveis', 'indispensável', 'indispensáveis',
  'mínimo', 'mínima', 'máximo', 'máxima', 'último', 'última', 'últimos', 'últimas',
  'próprio', 'própria', 'próprios', 'próprias', 'código', 'códigos', 'índice', 'índices',
  'gráfico', 'gráficos', 'diário', 'diária', 'diários', 'diárias', 'salário', 'salários',
  'calendário', 'calendários', 'horário', 'horários', 'comentário', 'comentários',
  'área', 'áreas', 'critério', 'critérios', 'princípio', 'princípios', 'exercício', 'exercícios',
  'domínio', 'domínios', 'patrimônio', 'patrimônios', 'diagnóstico', 'diagnósticos',
  'automático', 'automática', 'automáticos', 'automáticas', 'sistemático', 'sistemática',
  'matemático', 'matemática', 'físico', 'física', 'químico', 'química', 'tecnológico',
  'tecnológica', 'estatístico', 'estatística', 'científico', 'científica', 'estático',
  'estática', 'dinâmico', 'dinâmica', 'prioritário', 'prioritária', 'secretário',
  'secretária', 'proprietário', 'proprietária', 'inventário', 'inventários', 'bancário',
  'bancária', 'bancários', 'bancárias', 'fiduciário', 'fiduciária', 'experiência',
  'experiências', 'referência', 'referências', 'conferência', 'conferências',
  'frequência', 'frequências', 'eficiência', 'eficiências', 'exigência', 'exigências',
  'relevância', 'importância', 'distância', 'tolerância', 'evidência', 'evidências',
  'opção', 'opções', 'seção', 'seções', 'geração', 'gerações', 'integração', 'integrações',
  'comunicação', 'comunicações', 'distribuição', 'substituição', 'qualificação',
  'classificação', 'identificação', 'autenticação', 'certificação', 'simplificação',
  'otimização', 'padronização', 'automação', 'especificação', 'especificações',
  'você', 'vocês', 'é', 'são', 'está', 'estão', 'já', 'só', 'lâmpada', 'árvore', 'pântano',
  'música', 'lógica', 'básico', 'tráfego', 'êxito', 'pêssego', 'síntese', 'hipótese',
  'prótese', 'ênfase', 'comprar', 'comprador', 'embalagem', 'combinar', 'impossível',
  'importante', 'imprensa', 'emprego', 'compilar', 'completo', 'história', 'memória',
  'relógio', 'laboratório', 'residência', 'ausência', 'presença', 'tendência',
  'superfície', 'espécie', 'vácuo', 'água', 'língua', 'régua', 'sofá', 'crachá',
  'café', 'vovó', 'vovô', 'porém', 'armazém', 'parabéns', 'reféns', 'convém',
  'obtenção', 'retenção', 'contenção', 'omissão', 'agressão', 'regressão', 'concessão',
  'conversão', 'inversão', 'reversão', 'compreensão', 'apreensão', 'querido', 'quarto',
  'quase', 'rapidamente', 'facilmente', 'dificilmente', 'automaticamente', 'diretamente',
  'completamente', 'exatamente', 'inicialmente', 'finalmente', 'atualmente', 'anteriormente',
  'posteriormente', 'frequentemente', 'normalmente', 'geralmente', 'especificamente', 'principalmente'
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

// Mapa rápido fixo de erros conhecidos de S/Z, S/SS, P/B, M/N, gírias da internet e abreviações
const FIXED_EXPLICIT_MAP: Record<string, string> = {
  // Regra M antes de P e B (erros frequentes)
  'conprar': 'comprar',
  'conprador': 'comprador',
  'inbalagem': 'embalagem',
  'conbinar': 'combinar',
  'tamdem': 'também',
  'inpossivel': 'impossível',
  'inportante': 'importante',
  'inmprensa': 'imprensa',
  'inprego': 'emprego',
  'conpilar': 'compilar',
  'conpleto': 'completo',

  // Erros de Q e U
  'qerido': 'querido',
  'qando': 'quando',
  'qem': 'quem',
  'qarto': 'quarto',
  'qase': 'quase',

  // Erros frequentes de S x Z
  'faser': 'fazer',
  'fasendo': 'fazendo',
  'fasem': 'fazem',
  'fas': 'faz',
  'diser': 'dizer',
  'disendo': 'dizendo',
  'traser': 'trazer',
  'trasendo': 'trazendo',
  'quizer': 'quiser',
  'quizesse': 'quisesse',
  'quiz': 'quis',
  'pesquiza': 'pesquisa',
  'pesquizas': 'pesquisas',
  'pesquizar': 'pesquisar',
  'pesquizado': 'pesquisado',
  'analize': 'análise',
  'analizes': 'análises',
  'analizar': 'analisar',
  'analizado': 'analisado',
  'avizo': 'aviso',
  'avizos': 'avisos',
  'avizar': 'avisar',
  'precizo': 'preciso',
  'preciza': 'precisa',
  'precizar': 'precisar',
  'decizão': 'decisão',
  'decizao': 'decisão',
  'vizita': 'visita',
  'vizitar': 'visitar',
  'uzar': 'usar',
  'uzado': 'usado',
  'razao': 'razão',
  'realisar': 'realizar',
  'realisacao': 'realização',
  'organisar': 'organizar',
  'organisacao': 'organização',
  'atualisar': 'atualizar',
  'atualisacao': 'atualização',
  'sincronisar': 'sincronizar',
  'sincronisacao': 'sincronização',
  'localisar': 'localizar',
  'localisacao': 'localização',
  'visualisar': 'visualizar',
  'visualisacao': 'visualização',
  'priorisar': 'priorizar',
  'priorisacao': 'priorização',
  'utilisar': 'utilizar',
  'utilisacao': 'utilização',
  'certesa': 'certeza',
  'belesa': 'beleza',
  'limpesa': 'limpeza',
  'claresa': 'clareza',
  'pobresa': 'pobreza',
  'empreza': 'empresa',
  'emprezas': 'empresas',
  'defeza': 'defesa',
  'surpreza': 'surpresa',

  // Erros frequentes de SS x S
  'paso': 'passo',
  'pasar': 'passar',
  'pasado': 'passado',
  'pasada': 'passada',
  'proceso': 'processo',
  'procesos': 'processos',
  'procesar': 'processar',
  'sesao': 'sessão',
  'sessao': 'sessão',
  'presao': 'pressão',
  'pressao': 'pressão',
  'discusao': 'discussão',
  'discussao': 'discussão',
  'asim': 'assim',
  'necesario': 'necessário',
  'necesaria': 'necessária',
  'necesarios': 'necessários',
  'necesarias': 'necessárias',
  'aceso': 'acesso',
  'acesos': 'acessos',
  'suceso': 'sucesso',
  'sucesos': 'sucessos',
  'progresos': 'progresso',
  'compromiso': 'compromisso',
  'clase': 'classe',
  'posivel': 'possível',
  'imposivel': 'impossível',
  'impresao': 'impressão',
  'impressao': 'impressão',
  'espresao': 'expressão',
  'expressao': 'expressão',
  'atravesar': 'atravessar',
  'asunto': 'assunto',
  'asistir': 'assistir',
  'pesoa': 'pessoa',
  'pesoas': 'pessoas',
  'pesonal': 'pessoal',

  // SS incorreto após consoante
  'penssar': 'pensar',
  'penssamento': 'pensamento',
  'converssar': 'conversar',
  'converssa': 'conversa',
  'inssistir': 'insistir',
  'inssistencia': 'insistência',
  'senssivel': 'sensível',
  'bolssa': 'bolsa',
  'expulssar': 'expulsar',

  // Outros erros comuns de ortografia e acentuação
  'tb': 'também',
  'tbm': 'também',
  'pq': 'porque',
  'pra': 'para',
  'pro': 'para o',
  'pras': 'para as',
  'pros': 'para os',
  'pagto': 'pagamento',
  'pgto': 'pagamento',
  'vc': 'você',
  'vcs': 'vocês',
  'eh': 'é',
  'q': 'que',
  'noo': 'não',
  'nao': 'não',
  'esta': 'está',
  'estao': 'estão',
  'acurdo': 'acordo',
  'trabalro': 'trabalho',
  'obrigado': 'obrigado',
  'agardecer': 'agradecer',
  'prblema': 'problema',
};

// Conjunto de todas as palavras válidas sem acento -> com acento correto
const ACCENT_LOOKUP_MAP: Record<string, string> = {};
const VALID_WORDS_CLEAN_SET = new Set<string>();

ACCENTED_PT_BR_WORDS.forEach((correctWord) => {
  const unaccented = removeAccents(correctWord);
  VALID_WORDS_CLEAN_SET.add(unaccented);
  if (!ACCENT_LOOKUP_MAP[unaccented]) {
    ACCENT_LOOKUP_MAP[unaccented] = correctWord;
  }
});

// Adiciona mapeamentos explícitos
Object.entries(FIXED_EXPLICIT_MAP).forEach(([wrong, correct]) => {
  ACCENT_LOOKUP_MAP[wrong] = correct;
});

/**
 * Mapeamento para cache de buscas de erros de digitação (evita reprocessar)
 */
const TYPO_CORRECTION_CACHE = new Map<string, string | null>();

/**
 * Algoritmo de Distância Levenshtein (calcula número de edições entre duas strings)
 */
function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substituição
          matrix[i][j - 1] + 1,     // inserção
          matrix[i - 1][j] + 1      // remoção
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

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
 * Motor de Regras Ortográficas e de Acentuação da Língua Portuguesa
 */
function applyPortugueseGrammarRules(clean: string): string | null {
  // 1. Regra do M antes de P e B (M e N antes de P/B)
  if (/n[pb]/i.test(clean)) {
    return clean.replace(/n([pb])/gi, 'm$1');
  }

  // 2. Redução de Consoantes Duplas Estrangeiras (tt -> t, pp -> p, ff -> f, gg -> g, mm -> m, nn -> n)
  // Em português só existem as duplas RR e SS
  if (/([bcdfghjklmnpqtuvwxz])\1/i.test(clean) && !/rr|ss/i.test(clean)) {
    return clean.replace(/([bcdfghjklmnpqtuvwxz])\1/gi, '$1');
  }

  // 3. Regra de "SS" após consoantes (ex: penssar -> pensar, converssar -> conversar)
  if (/[bcdfghjklmnpqrstvwxyz]ss/i.test(clean)) {
    return clean.replace(/([bcdfghjklmnpqrstvwxyz])ss/gi, '$1s');
  }

  // 4. Regra do Q sem U antes de vogais (ex: qerido -> querido, qando -> quando)
  if (/^q[aeiou]/i.test(clean)) {
    return clean.replace(/^q([aeiou])/gi, 'qu$1');
  }

  // 5. Sufixo de adjetivo/advérbio -mente
  if (clean.endsWith('mente') && clean.length > 7) {
    const stem = clean.slice(0, -5);
    // Se a raiz terminar sem acento, retorna a palavra válida com -mente
    return stem + 'mente';
  }

  // 6. Terminação -cao / -acao -> -ção / -ação
  if (clean.endsWith('cao') && clean.length > 4 && !clean.endsWith('acao')) {
    return clean.slice(0, -3) + 'ção';
  }
  if (clean.endsWith('acao') && clean.length > 5) {
    return clean.slice(0, -4) + 'ação';
  }

  // 7. Terminação -coes / -acoes -> -ções / -ações
  if (clean.endsWith('coes') && clean.length > 5 && !clean.endsWith('acoes')) {
    return clean.slice(0, -4) + 'ções';
  }
  if (clean.endsWith('acoes') && clean.length > 6) {
    return clean.slice(0, -5) + 'ações';
  }

  // 8. Terminação -ario / -aria / -arios / -arias -> -ário / -ária / -ários / -árias
  if (clean.endsWith('ario') && clean.length > 5) {
    return clean.slice(0, -4) + 'ário';
  }
  if (clean.endsWith('aria') && clean.length > 5) {
    return clean.slice(0, -4) + 'ária';
  }
  if (clean.endsWith('arios') && clean.length > 6) {
    return clean.slice(0, -5) + 'ários';
  }
  if (clean.endsWith('arias') && clean.length > 6) {
    return clean.slice(0, -5) + 'árias';
  }

  // 9. Terminação -encia / -encias / -ancia / -ancias
  if (clean.endsWith('encia') && clean.length > 6) {
    return clean.slice(0, -5) + 'ência';
  }
  if (clean.endsWith('encias') && clean.length > 7) {
    return clean.slice(0, -6) + 'ências';
  }
  if (clean.endsWith('ancia') && clean.length > 6) {
    return clean.slice(0, -5) + 'ância';
  }
  if (clean.endsWith('ancias') && clean.length > 7) {
    return clean.slice(0, -6) + 'âncias';
  }

  // 10. Terminação -tico / -tica -> -tico com acento
  if (clean.endsWith('tico') && clean.length > 5 && /[aeiou]tico$/.test(clean)) {
    return clean.replace(/([aeiou])tico$/, (_, v) => {
      const mapVowel: Record<string, string> = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };
      return (mapVowel[v] || v) + 'tico';
    });
  }
  if (clean.endsWith('tica') && clean.length > 5 && /[aeiou]tica$/.test(clean)) {
    return clean.replace(/([aeiou])tica$/, (_, v) => {
      const mapVowel: Record<string, string> = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };
      return (mapVowel[v] || v) + 'tica';
    });
  }

  // 11. Terminação -avel / -ivel
  if (clean.endsWith('avel') && clean.length > 4) {
    return clean.slice(0, -4) + 'ável';
  }
  if (clean.endsWith('ivel') && clean.length > 4) {
    return clean.slice(0, -4) + 'ível';
  }

  // 12. Regra do sufixo -izar / -ização (com Z)
  if (clean.endsWith('isacao') && clean.length > 7) {
    const stem = clean.slice(0, -6);
    if (!['pesqu', 'anal', 'av', 'improv', 'revis', 'paralis'].some((s) => stem.startsWith(s))) {
      return stem + 'ização';
    }
  }
  if (clean.endsWith('isar') && clean.length > 6) {
    const stem = clean.slice(0, -4);
    if (!['pesqu', 'anal', 'av', 'improv', 'revis', 'paralis'].some((s) => stem.startsWith(s))) {
      return stem + 'izar';
    }
  }

  // 13. Substantivos abstratos em -eza (certesa -> certeza)
  if (clean.endsWith('esa') && ['cert', 'bel', 'limp', 'clar', 'pobr', 'fraqu', 'riqu', 'grand'].some((p) => clean.startsWith(p))) {
    return clean.slice(0, -3) + 'eza';
  }

  return null;
}

/**
 * Busca por similaridade difusa (Fuzzy Levenshtein) no dicionário PT-BR
 */
function findFuzzyMatch(cleanWord: string): string | null {
  if (cleanWord.length < 3) return null;

  let bestMatch: string | null = null;
  let minDistance = Infinity;

  const maxAllowedDistance = cleanWord.length >= 6 ? 2 : 1;

  for (const validWord of VALID_WORDS_CLEAN_SET) {
    if (Math.abs(validWord.length - cleanWord.length) > maxAllowedDistance) {
      continue;
    }

    if (validWord[0] !== cleanWord[0]) {
      continue;
    }

    const dist = levenshteinDistance(cleanWord, validWord);

    if (dist < minDistance && dist <= maxAllowedDistance) {
      minDistance = dist;
      bestMatch = validWord;

      if (dist === 1) break;
    }
  }

  if (bestMatch) {
    return ACCENT_LOOKUP_MAP[bestMatch] || bestMatch;
  }

  return null;
}

/**
 * Busca a palavra corrigida correspondente
 */
export function findCorrectionForWord(word: string): string | null {
  if (!word || word.length < 2) return null;
  const clean = word.toLowerCase();

  if (TYPO_CORRECTION_CACHE.has(clean)) {
    const cached = TYPO_CORRECTION_CACHE.get(clean);
    return cached ? preserveCasing(word, cached) : null;
  }

  // 1. Verificação de mapa explícito ou palavra com acento pré-cadastrada
  if (ACCENT_LOOKUP_MAP[clean] && ACCENT_LOOKUP_MAP[clean] !== clean) {
    const res = ACCENT_LOOKUP_MAP[clean];
    TYPO_CORRECTION_CACHE.set(clean, res);
    return preserveCasing(word, res);
  }

  // 2. Verificação de remoção de acentos/cedilha
  const unaccented = removeAccents(clean);

  if (ACCENT_LOOKUP_MAP[unaccented] && ACCENT_LOOKUP_MAP[unaccented] !== clean) {
    const res = ACCENT_LOOKUP_MAP[unaccented];
    TYPO_CORRECTION_CACHE.set(clean, res);
    return preserveCasing(word, res);
  }

  if (ACCENTED_PT_BR_WORDS.includes(clean) || ACCENTED_PT_BR_WORDS.includes(unaccented)) {
    TYPO_CORRECTION_CACHE.set(clean, null);
    return null;
  }

  // 3. Aplicação das Regras Gramaticais e Ortográficas da Língua Portuguesa
  const grammarRuleResult = applyPortugueseGrammarRules(unaccented);
  if (grammarRuleResult && grammarRuleResult !== clean) {
    TYPO_CORRECTION_CACHE.set(clean, grammarRuleResult);
    return preserveCasing(word, grammarRuleResult);
  }

  // 4. Busca por Erro de Digitação (Fuzzy Levenshtein)
  const fuzzy = findFuzzyMatch(unaccented);
  if (fuzzy && removeAccents(fuzzy) !== unaccented) {
    TYPO_CORRECTION_CACHE.set(clean, fuzzy);
    return preserveCasing(word, fuzzy);
  }

  TYPO_CORRECTION_CACHE.set(clean, null);
  return null;
}

/**
 * Executa autocorreção do texto em Português do Brasil
 */
export function correctPtBrText(text: string, ignoredWords?: Set<string>): string {
  if (!text) return '';

  let corrected = text.replace(/\b[a-zA-ZáàâãéèêíïóôõöúçÑñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ]+\b/g, (match) => {
    if (ignoredWords && ignoredWords.has(match.toLowerCase())) {
      return match;
    }
    const correction = findCorrectionForWord(match);
    return correction || match;
  });

  corrected = corrected.replace(/\s+([.,!?;:])(?=\s|$)/g, '$1');
  corrected = corrected.replace(/(^\s*|[.!?]\s+)([a-zà-ú])/g, (_, p1, p2) => p1 + p2.toUpperCase());
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

/**
 * Consulta a API pública e gratuita do LanguageTool v2 para Português do Brasil (pt-BR)
 * Esta API possui o dicionário completo da Língua Portuguesa e todas as regras gramaticais e ortográficas oficiais do VOLP.
 */
export async function checkPtBrWithLanguageTool(text: string): Promise<Array<{ original: string; corrected: string; message?: string }>> {
  if (!text || text.trim().length < 2) return [];

  try {
    const params = new URLSearchParams();
    params.append('text', text);
    params.append('language', 'pt-BR');

    const response = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const suggestions: Array<{ original: string; corrected: string; message?: string }> = [];
    const seen = new Set<string>();

    if (data && Array.isArray(data.matches)) {
      for (const match of data.matches) {
        if (match.replacements && match.replacements.length > 0) {
          const original = text.substring(match.offset, match.offset + match.length);
          const corrected = match.replacements[0].value;

          if (original && corrected && original.toLowerCase() !== corrected.toLowerCase()) {
            const key = original.toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              suggestions.push({
                original,
                corrected,
                message: match.message || match.shortMessage,
              });
            }
          }
        }
      }
    }

    return suggestions;
  } catch {
    // Em caso de falha de rede ou offline, o sistema utiliza o motor local sem interrupções
    return [];
  }
}

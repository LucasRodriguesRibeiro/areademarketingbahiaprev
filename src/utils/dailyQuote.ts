/**
 * Daily Motivational Quotes for Bahia Prev Hub
 * Changes deterministically every single day so all users see the same inspiring quote on a given day.
 */

export interface MotivationalQuote {
  quote: string;
  author?: string;
  theme?: string;
}

export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  {
    quote: "Grandes realizações começam com pequenos passos dados com dedicação todos os dias.",
    author: "Bahia Prev",
    theme: "Dedicação"
  },
  {
    quote: "O sucesso é a soma de pequenos esforços repetidos diariamente com excelência.",
    author: "Robert Collier",
    theme: "Foco"
  },
  {
    quote: "A persistência e o comprometimento transformam qualquer desafio em conquista.",
    author: "Bahia Prev",
    theme: "Superação"
  },
  {
    quote: "Com união, respeito e cooperação mútua, nossa equipe vai muito mais longe.",
    author: "Bahia Prev",
    theme: "Equipe"
  },
  {
    quote: "Cada novo dia traz uma nova oportunidade para fazermos o nosso melhor.",
    author: "Bahia Prev",
    theme: "Otimismo"
  },
  {
    quote: "O talento vence jogos, mas o trabalho em equipe e a inteligência vencem campeonatos.",
    author: "Michael Jordan",
    theme: "Trabalho em Equipe"
  },
  {
    quote: "Excelência não é um ato isolado, é um hábito construído a cada detalhe.",
    author: "Aristóteles",
    theme: "Qualidade"
  },
  {
    quote: "Acredite no seu potencial e entregue o seu melhor em cada atendimento e tarefa.",
    author: "Bahia Prev",
    theme: "Confiança"
  },
  {
    quote: "Trabalhar com empatia e propósito transforma vidas e fortalece nossa missão.",
    author: "Bahia Prev",
    theme: "Propósito"
  },
  {
    quote: "A determinação de hoje é a chave para as grandes vitórias de amanhã.",
    author: "Bahia Prev",
    theme: "Determinação"
  },
  {
    quote: "A força da equipe está em cada membro, e a força de cada membro é a equipe.",
    author: "Phil Jackson",
    theme: "União"
  },
  {
    quote: "Foco na meta, compromisso com a qualidade e paixão em servir sempre bem.",
    author: "Bahia Prev",
    theme: "Atendimento"
  },
  {
    quote: "O segredo do progresso está em dar o primeiro passo com coragem e entusiasmo.",
    author: "Mark Twain",
    theme: "Iniciativa"
  },
  {
    quote: "Sua dedicação diária faz a diferença no crescimento de toda a nossa empresa.",
    author: "Bahia Prev",
    theme: "Reconhecimento"
  },
  {
    quote: "Quem planta dedicação colhe conquistas e reconhecimento duradouros.",
    author: "Bahia Prev",
    theme: "Colheita"
  },
  {
    quote: "Juntos somos mais ágeis, mais fortes e prontos para qualquer desafio.",
    author: "Bahia Prev",
    theme: "Força"
  },
  {
    quote: "A melhor maneira de prever o futuro é construí-lo com dedicação no presente.",
    author: "Peter Drucker",
    theme: "Visão"
  },
  {
    quote: "Um dia produtivo começa com uma atitude positiva e mente focada na solução.",
    author: "Bahia Prev",
    theme: "Atitude"
  },
  {
    quote: "Cuidar das pessoas com carinho e eficiência é a nossa maior vocação.",
    author: "Bahia Prev",
    theme: "Acolhimento"
  },
  {
    quote: "Não espere o momento perfeito: faça de hoje um dia extraordinário.",
    author: "Bahia Prev",
    theme: "Ação"
  },
  {
    quote: "A disciplina é a ponte entre as nossas metas e as nossas realizações.",
    author: "Jim Rohn",
    theme: "Disciplina"
  },
  {
    quote: "Grandes desafios são oportunidades disfarçadas para mostrarmos nossa competência.",
    author: "Bahia Prev",
    theme: "Competência"
  },
  {
    quote: "Cultive a gentileza e o profissionalismo em todas as suas interações de hoje.",
    author: "Bahia Prev",
    theme: "Gentileza"
  },
  {
    quote: "A união de talentos e o esforço coordenado geram resultados surpreendentes.",
    author: "Bahia Prev",
    theme: "Sinergia"
  },
  {
    quote: "Tenha orgulho do trabalho que você faz e do impacto positivo que você gera.",
    author: "Bahia Prev",
    theme: "Orgulho"
  },
  {
    quote: "A inovação e o aprendizado constante abrem caminhos para novos sucessos.",
    author: "Bahia Prev",
    theme: "Inovação"
  },
  {
    quote: "Sorria, colabore e faça do ambiente de trabalho um lugar de crescimento mútuo.",
    author: "Bahia Prev",
    theme: "Harmonia"
  },
  {
    quote: "O compromisso com a verdade e a ética é a base sólida de todo o nosso sucesso.",
    author: "Bahia Prev",
    theme: "Ética"
  },
  {
    quote: "Cada esforço que você faz hoje constrói um futuro brilhante e promissor.",
    author: "Bahia Prev",
    theme: "Futuro"
  },
  {
    quote: "Celebre cada conquista da equipe, pois juntos somos invencíveis!",
    author: "Bahia Prev",
    theme: "Vitória"
  }
];

/**
 * Returns today's motivational quote deterministically based on current local date.
 * Guarantees all users see the exact same quote on any given day, rotating every midnight.
 */
export function getDailyMotivationalQuote(date: Date = new Date()): MotivationalQuote {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Deterministic day seed
  const seed = (year * 372) + (month * 31) + day;
  const index = Math.abs(seed) % MOTIVATIONAL_QUOTES.length;

  return MOTIVATIONAL_QUOTES[index];
}

/**
 * Daily Motivational Quotes for Bahia Prev Hub
 * Curated motivational and inspiring quotes for team drive, positivity, and daily excellence.
 * Changes deterministically every single day so all users see the same inspiring quote.
 */

export interface MotivationalQuote {
  quote: string;
  theme?: string;
}

export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  {
    quote: "Grandes realizações começam com pequenos passos dados com dedicação e entusiasmo todos os dias.",
    theme: "Dedicação"
  },
  {
    quote: "O sucesso é a soma de pequenos esforços diários realizados com paixão e excelência.",
    theme: "Excelência"
  },
  {
    quote: "A persistência e o comprometimento transformam qualquer desafio em uma grande vitória.",
    theme: "Superação"
  },
  {
    quote: "Com união, respeito e cooperação mútua, nossa equipe é capaz de ir além de qualquer limite.",
    theme: "Trabalho em Equipe"
  },
  {
    quote: "Cada novo amanhecer traz uma nova oportunidade para fazermos o nosso melhor e superarmos expectativas.",
    theme: "Otimismo"
  },
  {
    quote: "Acredite no seu potencial e entregue o seu melhor em cada detalhe, atendimento e tarefa de hoje.",
    theme: "Confiança"
  },
  {
    quote: "Trabalhar com empatia, dedicação e propósito fortalece nossa missão e transforma vidas.",
    theme: "Propósito"
  },
  {
    quote: "A determinação que você coloca no trabalho hoje é a chave para as grandes conquistas de amanhã.",
    theme: "Determinação"
  },
  {
    quote: "Foco na meta, compromisso com a qualidade e paixão em servir sempre com o mais alto padrão.",
    theme: "Foco & Qualidade"
  },
  {
    quote: "O progresso começa quando você decide dar o primeiro passo com coragem, disciplina e positividade.",
    theme: "Iniciativa"
  },
  {
    quote: "Sua dedicação diária e sua energia positiva fazem toda a diferença no crescimento de toda a nossa empresa.",
    theme: "Valorização"
  },
  {
    quote: "Quem planta dedicação colhe conquistas sólidas, respeito e reconhecimento duradouros.",
    theme: "Colheita"
  },
  {
    quote: "Juntos somos mais ágeis, mais fortes e sempre preparados para superar qualquer desafio.",
    theme: "Força Coletiva"
  },
  {
    quote: "Um dia altamente produtivo começa com uma atitude positiva e uma mente focada na solução.",
    theme: "Atitude Positiva"
  },
  {
    quote: "Não espere o momento perfeito: tome a iniciativa e faça do dia de hoje um dia extraordinário.",
    theme: "Ação"
  },
  {
    quote: "A disciplina diária é a ponte que liga nossos maiores objetivos às nossas maiores realizações.",
    theme: "Disciplina"
  },
  {
    quote: "Grandes desafios são oportunidades perfeitas para demonstrarmos nossa força e competência.",
    theme: "Competência"
  },
  {
    quote: "Cultive a gentileza, a proatividade e o profissionalismo em todas as suas interações de hoje.",
    theme: "Gentileza"
  },
  {
    quote: "A sinergia entre talentos e a vontade de vencer juntos geram resultados surpreendentes.",
    theme: "Sinergia"
  },
  {
    quote: "Tenha orgulho do trabalho que você realiza e do impacto positivo que ele gera todos os dias.",
    theme: "Orgulho & Motivação"
  },
  {
    quote: "A inovação constante e a vontade de aprender abrem portas para novos caminhos de sucesso.",
    theme: "Inovação"
  },
  {
    quote: "Sorria, colabore e faça do nosso ambiente de trabalho um espaço de crescimento mútuo e inspiração.",
    theme: "Harmonia"
  },
  {
    quote: "O compromisso com a ética, a verdade e o respeito é a base sólida de todo o nosso progresso.",
    theme: "Ética & Respeito"
  },
  {
    quote: "Cada esforço que você faz hoje constrói um futuro brilhante, promissor e cheio de conquistas.",
    theme: "Futuro Promissor"
  },
  {
    quote: "Celebre cada vitória da equipe, pois quando um colaborador vence, todos nós crescemos juntos.",
    theme: "Vitória Coletiva"
  },
  {
    quote: "A força para vencer está dentro de você. Confie na sua capacidade e faça o seu melhor hoje.",
    theme: "Autoconfiança"
  },
  {
    quote: "Seja a energia positiva que contagia o ambiente e inspira seus colegas de trabalho.",
    theme: "Energia Positiva"
  },
  {
    quote: "Com foco, paciência e determinação constante, não existem metas inalcançáveis.",
    theme: "Foco & Paciência"
  },
  {
    quote: "O carinho e a eficiência em cada atendimento são a marca registrada da nossa excelência.",
    theme: "Excelência no Atendimento"
  },
  {
    quote: "Hoje é um excelente dia para bater metas, superar limites e alcançar novos resultados!",
    theme: "Superação de Metas"
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

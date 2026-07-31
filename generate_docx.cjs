const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Header, Footer, HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType } = require('docx');

async function buildDocx() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22, // 11pt
            color: '1E293B',
          },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: "RELATÓRIO DE AUDITORIA DE GRAVAÇÕES NO FIRESTORE",
                bold: true,
                size: 32, // 16pt
                color: "1E3A8A",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: "Sistema Bahia Prev HUB — Análise de Consumo e Operações de Escrita",
                italic: true,
                size: 22,
                color: "475569",
              }),
            ],
          }),

          // Divider / Box
          new Paragraph({
            spacing: { before: 100, after: 200 },
            children: [
              new TextRun({
                text: "Data da Auditoria: ",
                bold: true,
              }),
              new TextRun({
                text: "30 de Julho de 2026",
              }),
              new TextRun({
                text: " | Escopo: ",
                bold: true,
              }),
              new TextRun({
                text: "Mapeamento de addDoc, setDoc, updateDoc, writeBatch, transaction e useEffects no projeto React",
              }),
            ],
          }),

          // Heading 1: Resumo Executivo
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
            children: [
              new TextRun({
                text: "1. Resumo Executivo e Conclusão Principal",
                bold: true,
                size: 26,
                color: "1E3A8A",
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: "A auditoria detalhada no código-fonte do Bahia Prev HUB identificou um total de ",
              }),
              new TextRun({
                text: "28 pontos de escrita direta no Firestore",
                bold: true,
              }),
              new TextRun({
                text: " (distribuídos entre addDoc, setDoc, updateDoc e deleteDoc).",
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "Causa Raiz de Alto Consumo Identificada: ",
                bold: true,
                color: "B91C1C",
              }),
              new TextRun({
                text: "O principal fator gerador de volume excessivo de gravações diárias no banco de dados NÃO são as interações normais dos usuários (como criar tarefas ou postagens), mas sim o ",
              }),
              new TextRun({
                text: "Mecanismo de Presença Automática (Heartbeat)",
                bold: true,
                color: "B91C1C",
              }),
              new TextRun({
                text: " em AuthContext.tsx, que executa um setDoc() a cada 2 minutos por usuário conectado + a cada mudança de aba/foco do navegador.",
              }),
            ],
          }),

          // Heading 2: Tabela de Operações
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
            children: [
              new TextRun({
                text: "2. Mapeamento Completo por Arquivo e Função",
                bold: true,
                size: 26,
                color: "1E3A8A",
              }),
            ],
          }),

          // Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: "1E3A8A", type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "Arquivo", bold: true, color: "FFFFFF" })] })],
                  }),
                  new TableCell({
                    shading: { fill: "1E3A8A", type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "Função / Local", bold: true, color: "FFFFFF" })] })],
                  }),
                  new TableCell({
                    shading: { fill: "1E3A8A", type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "Método Firestore", bold: true, color: "FFFFFF" })] })],
                  }),
                  new TableCell({
                    shading: { fill: "1E3A8A", type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "Frequência / Impacto", bold: true, color: "FFFFFF" })] })],
                  }),
                ],
              }),

              // AuthContext
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "AuthContext.tsx", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "setInterval (Heartbeat Presence)" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "setDoc (merge: true)" })] })] }),
                  new TableCell({
                    shading: { fill: "FEE2E2", type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "CRÍTICO: 1 gravação a cada 2 min por usuário online + foco de aba (~2.400/dia para 10 usuários)", color: "991B1B", bold: true })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "AuthContext.tsx" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "onAuthStateChanged / Sync Profile" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "setDoc (merge: true)" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Moderado: Toda vez que o usuário abre/recarrega a aplicação" })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "AuthContext.tsx" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "updateUserProfile / updateAvatar" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "setDoc (merge: true)" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Baixo: Apenas quando o usuário edita seu perfil" })] })] }),
                ],
              }),

              // TasksSection
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TasksSection.tsx", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "handleCreateTask / handleSaveTask" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "addDoc" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Normal: 1 gravação por nova tarefa criada" })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TasksSection.tsx" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "handleUpdateTask / handleStatusChange" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "updateDoc" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Normal: 1 gravação por alteração de status/tarefa" })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TasksSection.tsx" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "handleClearCompleted" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "deleteDoc (em loop/map)" })] })] }),
                  new TableCell({
                    shading: { fill: "FEF3C7", type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "Atenção: N chamadas deleteDoc individuais em vez de 1 writeBatch", color: "92400E" })] })],
                  }),
                ],
              }),

              // FunerariaSection
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "FunerariaSection.tsx", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "handleCreateOS" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "addDoc" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Normal: 1 gravação por Ordem de Serviço criada" })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "FunerariaSection.tsx" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "handleToggleChecklist / handleModalLoadGps" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "updateDoc" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Normal: 1 gravação ao marcar etapa do checklist" })] })] }),
                ],
              }),

              // FeedSection
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "FeedSection.tsx", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "handleAddComment" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "addDoc + updateDoc" })] })] }),
                  new TableCell({
                    shading: { fill: "FEF3C7", type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "Atenção: 2 gravações por comentário (1 addDoc no comentário + 1 updateDoc no contador da postagem)", color: "92400E" })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "FeedSection.tsx" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "handleToggleLike" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "updateDoc" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Normal: 1 gravação ao curtir/descurtir" })] })] }),
                ],
              }),

              // MembersSection & PopsSection & UserAdminSection
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Outros Módulos", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Members, POPs, UserAdmin" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "setDoc / addDoc / deleteDoc" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Baixo: Operações administrativas manuais ocasionais" })] })] }),
                ],
              }),
            ],
          }),

          // Heading 3: Detalhamento dos Pontos de Risco
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
            children: [
              new TextRun({
                text: "3. Detalhamento Técnico dos Gargalos de Escrita",
                bold: true,
                size: 26,
                color: "1E3A8A",
              }),
            ],
          }),

          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "1. Heartbeat de Presença (AuthContext.tsx): ", bold: true }),
              new TextRun({ text: "No arquivo AuthContext.tsx (linha 173), existe um efeito que define um intervalo a cada 120.000 ms (2 minutos) atualizando o documento do usuário logado. Além disso, os eventos de 'visibilitychange' e 'beforeunload' disparam updates adicionais ao alternar abas do navegador. Isso gera milhares de gravações passivas sem nenhuma ação do usuário." }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "2. Escritas Duplas no Feed (FeedSection.tsx): ", bold: true }),
              new TextRun({ text: "Ao incluir um comentário em uma publicação (linha 428 e 439), o sistema faz um addDoc na coleção 'comments' e em seguida um updateDoc na coleção 'posts' para incrementar o 'commentCount'. A recomendação para economizar limites é calcular a contagem no cliente ou via subcoleção." }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "3. Exclusões sem Lote em Tarefas (TasksSection.tsx): ", bold: true }),
              new TextRun({ text: "Ao clicar em 'Limpar Concluídas' (linha 1013), o código executa 'snapshot.docs.map(deleteDoc)'. Se houver 30 tarefas concluídas, são efetuadas 30 requisições individuais de gravação no Firestore. O correto seria utilizar writeBatch, que conta de forma unificada e reduz a sobrecarga de rede." }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "4. Escuta em Tempo Real (onSnapshot vs Gravações): ", bold: true }),
              new TextRun({ text: "Foi verificado se os receptores de onSnapshot disparavam novos chamados de escrita acidentalmente em malha fechada (loop infinito). Nenhum loop de auto-gravação dentro do onSnapshot foi encontrado, o que é um ponto positivo." }),
            ],
          }),

          // Heading 4: Recomendações
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
            children: [
              new TextRun({
                text: "4. Recomendações Técnicas para Otimização e Economia",
                bold: true,
                size: 26,
                color: "1E3A8A",
              }),
            ],
          }),

          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Remover ou Ajustar o Intervalo de Presença: ", bold: true }),
              new TextRun({ text: "Aumentar o intervalo do heartbeat de 2 minutos para 15 minutos ou remover a gravação contínua em banco, mantendo o status apenas na sessão local/memória se a lista de online não for crítica." }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Adotar Batch Writes (writeBatch): ", bold: true }),
              new TextRun({ text: "Substituir loops com múltiplas chamadas 'deleteDoc' ou 'updateDoc' por transações ou lotes do Firestore (writeBatch)." }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Uso de Realtime Database para Presença: ", bold: true }),
              new TextRun({ text: "Se o status de usuário online/offline for indispensável, o Firebase Realtime Database é grátis para conexões e muito mais adequado para esse tipo de ping do que o Firestore." }),
            ],
          }),

          // Footer info
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400 },
            children: [
              new TextRun({
                text: "— Fim do Relatório de Auditoria — Bahia Prev HUB —",
                italic: true,
                size: 20,
                color: "64748B",
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, 'public', 'Relatorio_Auditoria_Firestore_BahiaPrev.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log("Arquivo Word gerado em:", outputPath);
}

buildDocx().catch(console.error);

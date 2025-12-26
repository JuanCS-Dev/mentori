/**
 * Mentori Cloud Functions
 *
 * Backend proxy para Vertex AI.
 * Usa ADC (Application Default Credentials) - automático no Cloud Functions.
 */

import { onRequest } from 'firebase-functions/v2/https';
import { GoogleGenAI } from '@google/genai';

// Vertex AI config
const VERTEX_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || 'clinica-genesis-os-e689e';
const VERTEX_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

const MODEL_FLASH = 'gemini-2.5-flash';
const MODEL_PRO = 'gemini-2.5-pro';

// Lazy-loaded client
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      vertexai: true,
      project: VERTEX_PROJECT,
      location: VERTEX_LOCATION,
    });
  }
  return aiClient;
}

// MENTORI Persona
const MENTORI_SYSTEM_INSTRUCTION = `
DATA ATUAL: ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
ANO VIGENTE: ${new Date().getFullYear()}

VOCÊ É O MENTORI. Não uma IA genérica, mas o Maior Especialista em Concursos Públicos e Direito da História.

IMPORTANTE: Todas as suas respostas devem considerar a legislação, jurisprudência e entendimentos VIGENTES em ${new Date().getFullYear()}. Cite apenas súmulas, leis e precedentes atualizados. Se algo foi revogado ou superado, informe o aluno.

Sua persona é uma fusão de:
1. **Um Professor de Direito Lendário:** Profundo conhecimento jurídico, cita doutrina, jurisprudência (STF/STJ) e a "letra da lei" com precisão cirúrgica. Você É um vade-mecum ambulante.
2. **Um Coach de Alta Performance:** Motivador, direto, exigente ("tough love"). Você não aceita mediocridade. Você empurra o aluno para o limite do potencial.
3. **Um Estrategista de Bancas:** Você conhece o "DNA" da FGV, Cebraspe, FCC como a palma da mão. Sabe as pegadinhas, as palavras-chave e os viéses de cada examinador.

**MÉTODO DIDÁTICO (PROFESSOR ESTRELA):**
Você ensina como os grandes mestres - com EXEMPLOS MÁGICOS que fazem o conceito "clicar" na mente:
- **Analogias Memoráveis:** Compare conceitos jurídicos com situações do cotidiano. Ex: "Prescrição é como leite - tem prazo de validade. Passou, azedou."
- **Casos Concretos:** Use mini-histórias. "Imagine que João vendeu um carro para Maria, mas o carro era de Pedro..."
- **Mnemônicos:** Crie siglas e frases que grudam na memória.
- **Contraste:** Mostre o que É vs o que NÃO É. "Furto não é roubo. Roubo tem violência ou grave ameaça. Furto é ninja - silencioso."

**ESTRUTURA DAS RESPOSTAS:**
1. **Resposta direta** (1-2 frases certeiras)
2. **Fundamento legal** (artigo, súmula, jurisprudência - SEMPRE cite a fonte)
3. **Exemplo mágico** (caso concreto ou analogia que fixa o conceito)
4. **Pegadinha da banca** (se aplicável - como a banca costuma cobrar isso)
5. **Frase de impacto** (motivacional ou mnemônico para fixar)

**CITAÇÕES OBRIGATÓRIAS:**
- Leis: "Art. X da Lei Y/ano"
- Súmulas: "Súmula X do STF/STJ"
- Jurisprudência: "Conforme decidido no RE/REsp X (ano)"
- Doutrina: "Nas palavras de [autor]..."

**SEU TOM DE VOZ:**
- **Autoridade Suprema:** Fale com confiança absoluta. Você SABE.
- **Didática Magnética:** Seus exemplos são tão bons que o aluno nunca mais esquece.
- **Motivador Implacável:** Quando o aluno errar, corrija com firmeza, mas mostre o caminho da vitória.
- **Precisão Cirúrgica:** Cada palavra tem propósito. Sem enrolação.

**SUA MISSÃO:**
Transformar estudantes em APROVADOS. Entregar ouro em pó em cada resposta. Ser o professor que o aluno gostaria de ter tido a vida toda.
`;

interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface MentorChatRequest {
  message: string;
  history: ChatMessage[];
  context?: {
    currentView: string;
    editalLoaded?: string;
    sessionActive?: boolean;
  };
  useProModel?: boolean;
}

/**
 * Mentor Chat Endpoint
 *
 * POST /mentorChat
 * Body: { message, history, context?, useProModel? }
 *
 * Returns: streaming text/event-stream
 */
export const mentorChat = onRequest(
  {
    cors: true,
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 120,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const body = req.body as MentorChatRequest;
      const { message, history = [], context, useProModel = false } = body;

      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const ai = getAIClient();
      const model = useProModel ? MODEL_PRO : MODEL_FLASH;

      // Build context-aware system instruction
      let systemInstruction = MENTORI_SYSTEM_INSTRUCTION;
      if (context) {
        systemInstruction += `\n\nCONTEXTO DA SESSÃO:\n- Tela atual: ${context.currentView}`;
        if (context.editalLoaded) {
          systemInstruction += `\n- Edital carregado: ${context.editalLoaded}`;
        }
        if (context.sessionActive) {
          systemInstruction += `\n- Sessão de estudo ativa`;
        }
      }

      // Create chat session
      const chat = ai.chats.create({
        model,
        config: { systemInstruction },
        history,
      });

      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Stream response
      const response = await chat.sendMessageStream({ message });

      for await (const chunk of response) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error('Mentor chat error:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

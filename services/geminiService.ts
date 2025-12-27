import { GoogleGenAI } from "@google/genai";
import {
  Question,
  EditalJSON,
  BankProfileJSON,
  NeuroStudyPlanJSON,
  QuestionAutopsy,
  QuestionExplanation,
  MaterialJSON,
  DiscursiveTheme,
  DiscursiveEvaluation,
  StudyPlanParams,
  ChatContext
} from "../types";
import { withCircuitBreaker, recordHealth, chaosLatency, chaosPartition } from './chaosOrchestrator';

// =============================================================================
// AI PROVIDER CONFIGURATION
// Supports both Google AI Studio (API Key) and Vertex AI (ADC)
// =============================================================================

export type AIProvider = 'google-ai-studio' | 'vertex-ai';

interface AIConfig {
  provider: AIProvider;
  project?: string;
  location?: string;
  apiKey?: string;
}

// Environment detection
const isBrowser = typeof window !== 'undefined';

// Determine provider based on environment
function getAIConfig(): AIConfig {
  const VERTEX_PROJECT = (typeof process !== 'undefined' && process.env.GOOGLE_CLOUD_PROJECT) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLOUD_PROJECT) ||
    'clinica-genesis-os-e689e'; // Fallback from Genesis project as requested

  const VERTEX_LOCATION = (typeof process !== 'undefined' && process.env.GOOGLE_CLOUD_LOCATION) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLOUD_LOCATION) ||
    'us-central1';

  const API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || '';

  // BROWSER: Must use API Key (no ADC available)
  if (isBrowser) {
    if (!API_KEY || API_KEY.includes('PLACEHOLDER')) {
      console.warn('[GeminiService] Browser detected but no API key. Set VITE_GEMINI_API_KEY in .env.local');
    }
    return {
      provider: 'google-ai-studio',
      apiKey: API_KEY
    };
  }

  // SERVER/Cloud Functions: Can use Vertex AI with ADC
  if (VERTEX_PROJECT && VERTEX_PROJECT !== 'undefined') {
    return {
      provider: 'vertex-ai',
      project: VERTEX_PROJECT,
      location: VERTEX_LOCATION
    };
  }

  // Fallback to API Key
  return {
    provider: 'google-ai-studio',
    apiKey: API_KEY
  };
}

// =============================================================================
// LAZY-LOADED AI CLIENT
// =============================================================================

let aiClient: GoogleGenAI | null = null;
let currentConfig: AIConfig | null = null;

/**
 * Get or create the AI client.
 * Supports both Google AI Studio (API Key) and Vertex AI (ADC).
 */
function getAIClient(): GoogleGenAI {
  const config = getAIConfig();

  // Return cached client if config hasn't changed
  if (aiClient && currentConfig &&
    currentConfig.provider === config.provider &&
    currentConfig.apiKey === config.apiKey &&
    currentConfig.project === config.project) {
    return aiClient;
  }

  // Create new client based on provider
  if (config.provider === 'vertex-ai') {
    if (!config.project) {
      throw new Error(
        'Vertex AI requires GOOGLE_CLOUD_PROJECT or VITE_GOOGLE_CLOUD_PROJECT environment variable'
      );
    }

    console.info(`[GeminiService] Using Vertex AI (project: ${config.project}, location: ${config.location})`);

    aiClient = new GoogleGenAI({
      vertexai: true,
      project: config.project,
      location: config.location || 'us-central1'
    });
  } else {
    // API KEY Mode
    if (!config.apiKey || config.apiKey.includes('PLACEHOLDER')) {
      console.warn('[GeminiService] No valid API key found. Set VITE_GEMINI_API_KEY in .env');
    }

    console.info('[GeminiService] Using Google AI Studio (API Key)');

    aiClient = new GoogleGenAI({
      apiKey: config.apiKey || ''
    });
  }

  currentConfig = config;
  return aiClient;
}

/**
 * Get current AI provider info for debugging/display
 */
export function getAIProviderInfo(): { provider: AIProvider; project?: string; location?: string } {
  const config = getAIConfig();
  return {
    provider: config.provider,
    project: config.project,
    location: config.location
  };
}

// =============================================================================
// MODEL CONFIGURATION
// =============================================================================

// Gemini 2.5 models - best for complex reasoning
const MODEL_FLASH = 'gemini-2.5-flash-preview-05-20';
const MODEL_PRO = 'gemini-2.5-pro-preview-05-06';

// Fallback to Gemini 2.0 if needed
// const MODEL_FLASH = 'gemini-2.0-flash';
// const MODEL_PRO = 'gemini-2.0-pro';

// =============================================================================
// RETRY CONFIGURATION
// =============================================================================

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;
const TIMEOUT_MS = 60000; // 60 seconds

/**
 * Exponential backoff retry wrapper for API calls
 * Enhanced with Circuit Breaker and Health Signals
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const circuitName = `gemini:${operationName}`;
  const startTime = Date.now();

  // Wrap with Circuit Breaker
  return withCircuitBreaker(
    circuitName,
    async () => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          // Chaos: Latency injection
          const result = await chaosLatency(
            async () => {
              // Chaos: Network partition
              return chaosPartition(
                async () => {
                  // Create timeout promise
                  const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error(`Timeout após ${TIMEOUT_MS / 1000}s`)), TIMEOUT_MS);
                  });

                  // Race between operation and timeout
                  return Promise.race([operation(), timeoutPromise]);
                },
                operationName,
                undefined
              );
            },
            operationName
          );

          // Success: record healthy
          const latency = Date.now() - startTime;
          recordHealth({
            service: circuitName,
            status: latency > 10000 ? 'degraded' : 'healthy',
            latency
          });

          return result;
        } catch (error: unknown) {
          lastError = error instanceof Error ? error : new Error(String(error));
          const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);

          console.warn(
            `[${operationName}] Tentativa ${attempt + 1}/${MAX_RETRIES} falhou: ${lastError.message}. ` +
            (attempt < MAX_RETRIES - 1 ? `Retentando em ${delay / 1000}s...` : 'Sem mais tentativas.')
          );

          // Don't wait after the last attempt
          if (attempt < MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // Record failure
      recordHealth({
        service: circuitName,
        status: 'failed',
        lastError: lastError?.message
      });

      throw new Error(
        `Falha após ${MAX_RETRIES} tentativas: ${lastError?.message || 'Erro desconhecido'}. ` +
        'Verifique sua conexão e tente novamente.'
      );
    },
    // No fallback: let errors propagate
    undefined as unknown as T
  );
}

// =============================================================================
// JSON PARSING HELPER
// =============================================================================

/**
 * Helper seguro para limpar e parsear JSON da IA.
 * Remove blocos de markdown ```json ... ``` se existirem e isola o objeto.
 */
const cleanAndParseJSON = <T>(text: string | undefined): T => {
  if (!text) throw new Error("IA retornou resposta vazia.");

  // Remove markdown code blocks e limpa espaços
  let cleanText = text.replace(/```json\s*/g, '').replace(/```/g, '').trim();

  // Tenta encontrar o primeiro { e o último } para isolar o JSON puro caso haja lixo em volta
  const firstBrace = cleanText.indexOf('{');
  const lastBrace = cleanText.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1) {
    cleanText = cleanText.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleanText) as T;
  } catch (_e) {
    console.error("Falha ao parsear JSON da IA. Texto original:", text);
    throw new Error("O motor neural alucinou o formato. Tente novamente.");
  }
};

// =============================================================================
// GEMINI SERVICE
// =============================================================================

// =============================================================================
// MENTORI PERSONA: O GRANDE MENTOR
// =============================================================================
const MENTORI_SYSTEM_INSTRUCTION = `
DATA ATUAL: ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
ANO VIGENTE: ${new Date().getFullYear()}

VOCÊ É O MENTORI. Não uma IA genérica, mas o Maior Especialista em Concursos Públicos e Direito da História.

IMPORTANTE: Todas as suas respostas devem considerar a legislação, jurisprudência e entendimentos VIGENTES em ${new Date().getFullYear()}. Cite apenas súmulas, leis e precedentes atualizados. Se algo foi revogado ou superado, informe o aluno.

Sua persona é uma fusão de:
1.  **Um Professor de Direito Lendário:** Profundo conhecimento jurídico, cita doutrina, jurisprudência (STF/STJ) e a "letra da lei" com precisão cirúrgica.
2.  **Um Coach de Alta Performance (Navy SEAL):** Motivador, direto, exigente ("tough love"). Você não aceita mediocridade. Você empurra o aluno para o limite do potencial.
3.  **Um Estrategista de Bancas:** Você conhece o "DNA" da FGV, Cebraspe, FCC como a palma da mão. Sabe as pegadinhas, as palavras-chave e os viéses de cada examinador.

**SEU TOM DE VOZ:**
-   **Autoridade Suprema:** Fale com confiança absoluta.
-   **Didática de Elite:** Explique conceitos complexos com metáforas brilhantes e clareza cristalina.
-   **Motivador Implacável:** Quando o aluno errar, corrija com firmeza, mas mostre o caminho da vitória. Use frases como "Levante a cabeça, guerreiro", "O erro é o degrau para a aprovação", "Foco na missão".
-   **Sofisticação:** Use um vocabulário rico, técnico, mas acessível. Nada de "Olá, sou uma IA". Você é O MENTOR.

**SUA MISSÃO:**
Transformar estudantes em APROVADOS. Entregar ouro em pó em cada resposta.
`;

// =============================================================================
// GEMINI SERVICE
// =============================================================================

export const GeminiService = {
  /**
   * Get current provider information
   */
  getProviderInfo: getAIProviderInfo,

  /**
   * FUNCIONALIDADE 1: ANÁLISE DE EDITAL (VERTICALIZADO & ESTRUTURADO)
   */
  async analyzeEdital(editalText: string): Promise<EditalJSON> {
    return withRetry(async () => {
      const ai = getAIClient();
      const prompt = `
        ${MENTORI_SYSTEM_INSTRUCTION}
        
        Sua missão tática agora é: DESTRINCHAR este edital.
        Transforme o texto cru em uma estrutura de dados JSON "Verticalizada" e "Sem Gordura".

        **ENTRADA ALVO:**
        ${editalText.substring(0, 30000)}

        **FORMATO DE SAÍDA EXIGIDO (JSON ÚNICO):**
        {
          "metadata": {
            "banca": "string",
            "orgao": "string",
            "cargos": ["string"],
            "nivel_escolaridade": "string",
            "remuneracao": "string"
          },
          "cronograma": [ { "evento": "string", "data": "string", "critical": boolean } ],
          "fases": [ { "nome": "string", "carater": "string", "detalhes": "string" } ],
          "verticalizado": [ { "disciplina": "string", "peso": "string", "questoes": "string", "topicos": ["string"] } ],
          "alertas": ["string"]
        }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return cleanAndParseJSON<EditalJSON>(response.text);
    }, 'analyzeEdital');
  },

  /**
   * FUNCIONALIDADE 2: ANÁLISE DE PERFIL DA BANCA
   */
  async analyzeBankProfile(textOrFiles: string): Promise<BankProfileJSON> {
    return withRetry(async () => {
      const ai = getAIClient();
      const prompt = `
        ${MENTORI_SYSTEM_INSTRUCTION}

        Atue como o Maior Especialista em Inteligência Competitiva de Concursos.
        Gere um "Dossiê DNA" da banca, revelando seus segredos mais obscuros.

        **ALVO DE ANÁLISE:**
        ${textOrFiles}

        **FORMATO DE SAÍDA (JSON):**
        {
          "perfil": { "nome": "string", "estilo": "string", "dificuldade": "string", "descricao_estilo": "string" },
          "dna_pegadinhas": [ { "tipo": "string", "exemplo": "string", "frequencia": "string" } ],
          "mapa_calor": [ { "materia": "string", "foco": "string", "frequencia": "string" } ],
          "jurisprudencia_preferida": ["string"],
          "vereditto_estrategico": "string"
        }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return cleanAndParseJSON<BankProfileJSON>(response.text);
    }, 'analyzeBankProfile');
  },

  /**
   * FUNCIONALIDADE 3: GERADOR DE PLANO DE ESTUDOS (NEURO-ALGORITMO)
   */
  async generateNeuroStudyPlan(params: StudyPlanParams): Promise<NeuroStudyPlanJSON> {
    return withRetry(async () => {
      const ai = getAIClient();
      const prompt = `
        ${MENTORI_SYSTEM_INSTRUCTION}

        Você está vestindo seu chapéu de Neurocientista Cognitivo e Estrategista Militar.
        Crie um plano de guerra (estudos) Bio-Adaptativo para este soldado.
        
        DADOS DE INTELIGÊNCIA: ${JSON.stringify(params)}

        **FORMATO DE SAÍDA (JSON):**
        {
          "diagnostico": { "perfil_cognitivo": "string", "estrategia_adotada": "string" },
          "rotina_matinal": ["string"],
          "blocos_estudo": [ { "horario": "string", "atividade": "string", "metodo": "string", "energia_exigida": "Alta|Média|Baixa", "motivo": "string" } ],
          "rotina_noturna": ["string"],
          "dopamina_triggers": ["string"]
        }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return cleanAndParseJSON<NeuroStudyPlanJSON>(response.text);
    }, 'generateNeuroStudyPlan');
  },

  /**
   * FUNCIONALIDADE 4: GERADOR DE QUESTÕES
   */
  async generateQuestion(discipline: string, topic: string, bank: string, difficulty: string): Promise<Question> {
    return withRetry(async () => {
      const ai = getAIClient();
      const prompt = `
        ${MENTORI_SYSTEM_INSTRUCTION}
        
        Gere uma Questão de Concurso INÉDITA, nível DE ELITE.
        Não crie questões óbvias. Eu quero profundidade. Eu quero que o aluno precise PENSAR como um jurista.
        
        **PARÂMETROS DA MISSÃO:**
        - Disciplina: ${discipline}
        - Tópico: ${topic}
        - Estilo da Banca: ${bank} (Mimetize o estilo de redação desta banca perfeitamente)
        - Nível de Dificuldade: ${difficulty} (Se for Difícil, quero jurisprudência ou doutrina minoritária)

        **REQUISITOS:**
        1. Enunciado robusto, contextualizado (nada de perguntas diretas e bobas). Crie um "Case" ou citando lei seca de forma inteligente.
        2. Alternativas plausíveis. A resposta errada deve ser sedutora (o "distrator").
        3. O comentário deve ser uma MINI-AULA. Explique o PORQUÊ, cite o artigo de lei, a súmula ou o autor.
        4. Identifique uma "trap" (pegadinha) possível nesse tema.

        **FORMATO DE SAÍDA (JSON):**
        {
          "discipline": "${discipline}", "topic": "${topic}", "difficulty": "${difficulty}",
          "statement": "Enunciado completo...", 
          "options": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D", "Alternativa E"], 
          "correctAnswer": 0-4,
          "comment": "Explicação de Mestre: Aprofundada, técnica e didática.", 
          "trap": "Atenção Guerreiro: Onde a banca tenta te derrubar neste ponto."
        }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_PRO, // Usar PRO para garantir a qualidade "Mentori"
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return cleanAndParseJSON<Question>(response.text);
    }, 'generateQuestion');
  },

  /**
   * FUNCIONALIDADE 5: MATERIAL CIRÚRGICO (80/20)
   */
  async generateSurgicalMaterial(topic: string, bankProfile: string): Promise<MaterialJSON> {
    return withRetry(async () => {
      const ai = getAIClient();
      const prompt = `
        ${MENTORI_SYSTEM_INSTRUCTION}

        Gere um MATERIAL CIRÚRGICO (Pareto 80/20) sobre: "${topic}".
        Contexto Banca: ${bankProfile}

        **FORMATO DE SAÍDA (JSON):**
        {
          "titulo": "string", "estimativa_leitura": "string", "raio_x": "string",
          "modulos": [ { "titulo": "string", "conteudo": "string", "tipo": "Teoria|Jurisprudencia" } ],
          "flashcards": [ { "front": "string", "back": "string" } ]
        }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return cleanAndParseJSON<MaterialJSON>(response.text);
    }, 'generateSurgicalMaterial');
  },

  /**
   * FUNCIONALIDADE 6: AUTÓPSIA DE ERRO
   */
  async analyzeQuestionError(statement: string, wrongAnswer: string, correctAnswer: string): Promise<QuestionAutopsy> {
    return withRetry(async () => {
      const ai = getAIClient();
      const prompt = `
        ${MENTORI_SYSTEM_INSTRUCTION}

        O aluno errou. Isso é inaceitável, mas pedagógico.
        Realize uma AUTOPSIA FORENSE deste erro. Não tenha pena, tenha precisão.

        **DADOS DO CADÁVER (ERRO):**
        - Questão: ${statement}
        - O que ele marcou (Errado): ${wrongAnswer}
        - O que era (Correto): ${correctAnswer}

        **SUA ANÁLISE:**
        1. **Diagnóstico:** Por que ele errou? Falta de atenção? Desconhecimento de Lei? Caiu na pegadinha? Confundiu conceitos? Seja específico.
        2. **Vacina Mental:** Que frase, mnemônico ou conceito ele nunca mais deve esquecer para não errar isso de novo?
        3. **Explicação Técnica:** Dê a aula. Cite a fonte. Mostre a superioridade do conhecimento correto.

        **FORMATO DE SAÍDA (JSON):**
        {
          "diagnostico_erro": "Diagnóstico preciso e direto.", 
          "explicacao_tecnica": "Aula magistral corrigindo o conceito.",
          "vacina_mental": "Frase de impacto para memorização definitiva.", 
          "gravidade": "Alta|Média|Baixa"
        }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return cleanAndParseJSON<QuestionAutopsy>(response.text);
    }, 'analyzeQuestionError');
  },

  /**
   * FUNCIONALIDADE 6.5: GERADOR DE EXPLICAÇÕES PARA QUESTÕES
   * Gera explicações detalhadas para questões do banco de questões
   */
  async generateExplanation(
    enunciado: string,
    alternativas: string[],
    gabarito: number,
    disciplina: string,
    banca?: string
  ): Promise<QuestionExplanation> {
    return withRetry(async () => {
      const ai = getAIClient();
      const prompt = `
        ${MENTORI_SYSTEM_INSTRUCTION}

        Você é o maior especialista em explicar questões de concursos.
        Sua missão é gerar uma EXPLICAÇÃO MAGISTRAL para esta questão.

        **QUESTÃO:**
        - Banca: ${banca || 'Desconhecida'}
        - Disciplina: ${disciplina}
        - Enunciado: ${enunciado}
        - Alternativas:
          ${alternativas.map((alt, i) => `${String.fromCharCode(65 + i)}) ${alt}`).join('\n          ')}
        - Gabarito: ${String.fromCharCode(65 + gabarito)} (${alternativas[gabarito]})

        **INSTRUÇÕES:**
        1. Explique POR QUE a alternativa correta está certa (fundamentação jurídica/técnica)
        2. Explique POR QUE cada alternativa errada está incorreta
        3. Cite a fundamentação legal (artigos de lei, súmulas, jurisprudência STF/STJ)
        4. Crie uma DICA MEMORÁVEL (mnemônico, frase de impacto) para fixação
        5. Liste temas relacionados para aprofundamento

        **FORMATO DE SAÍDA (JSON):**
        {
          "explicacao_correta": "Explicação completa e didática da resposta correta...",
          "alternativas_erradas": [
            { "indice": 0, "texto": "Texto da alternativa A", "motivo": "Por que está errada" },
            ...
          ],
          "fundamentacao": "Art. X da Lei Y, Súmula Z do STF...",
          "dica_memoravel": "Frase de impacto para nunca mais esquecer",
          "temas_relacionados": ["Tema 1", "Tema 2"],
          "nivel_dificuldade": "facil|medio|dificil|expert"
        }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_FLASH, // Flash para performance (explicações em lote)
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return cleanAndParseJSON<QuestionExplanation>(response.text);
    }, 'generateExplanation');
  },

  /**
   * FUNCIONALIDADE 6.6: GERADOR DE EXPLICAÇÕES EM BATCH
   * Gera explicações para múltiplas questões de forma eficiente
   */
  async generateExplanationsBatch(
    questions: Array<{
      id: string;
      enunciado: string;
      alternativas: string[];
      gabarito: number;
      disciplina: string;
      banca?: string;
    }>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<Map<string, QuestionExplanation>> {
    const results = new Map<string, QuestionExplanation>();
    const total = questions.length;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q) continue;

      try {
        const explanation = await this.generateExplanation(
          q.enunciado,
          q.alternativas,
          q.gabarito,
          q.disciplina,
          q.banca
        );
        results.set(q.id, explanation);

        if (onProgress) {
          onProgress(i + 1, total);
        }
      } catch (error) {
        console.error(`[GeminiService] Erro ao gerar explicação para ${q.id}:`, error);
        // Continue with next question
      }

      // Rate limiting: 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  },

  /**
   * FUNCIONALIDADE 7: TEMAS DISCURSIVOS
   */
  async generateDiscursiveTheme(cargo: string, banca: string, editalContext: string): Promise<DiscursiveTheme> {
    return withRetry(async () => {
      const ai = getAIClient();
      const prompt = `
        Gere um TEMA DE PROVA DISCURSIVA para ${cargo} (${banca}).
        Contexto: ${editalContext}

        **FORMATO DE SAÍDA (JSON):**
        { "titulo": "string", "enunciado": "string", "quesitos": ["string"], "instrucoes": "string" }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return cleanAndParseJSON<DiscursiveTheme>(response.text);
    }, 'generateDiscursiveTheme');
  },

  /**
   * FUNCIONALIDADE 8: AVALIADOR DE DISCURSIVA
   */
  async evaluateDiscursive(theme: DiscursiveTheme, studentText: string, banca: string): Promise<DiscursiveEvaluation> {
    return withRetry(async () => {
      const ai = getAIClient();
      const prompt = `
        Avalie a redação do aluno (Banca ${banca}).
        Tema: ${JSON.stringify(theme)} | Texto Aluno: ${studentText}

        **FORMATO DE SAÍDA (JSON):**
        {
          "pontuacao": { "total": number, "conteudo": number, "estrutura": number, "gramatica": number },
          "parecer_pedagogico": "string",
          "erros_identificados": [ { "trecho": "string", "correcao": "string", "motivo": "string" } ],
          "espelho_ideal": "string"
        }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return cleanAndParseJSON<DiscursiveEvaluation>(response.text);
    }, 'evaluateDiscursive');
  },

  /**
   * FUNCIONALIDADE 9: ROAST MY EDITAL (VIRAL FEATURE)
   */
  async roastEdital(editalSummary: string): Promise<{ roast: string, shareableQuote: string }> {
    return withRetry(async () => {
      const ai = getAIClient();
      const prompt = `
        Você é um comediante de stand-up ácido e especialista em concursos.
        Faça um "ROAST" (fritada) brutal e honesta sobre este edital.

        CONTEXTO:
        ${editalSummary}

        OBJETIVO:
        Humilhar a dificuldade da prova, a baixa remuneração (se for o caso), ou a insanidade das matérias.
        O tom deve ser: Sarcástico, Desesperador, mas Engraçado.

        **FORMATO DE SAÍDA (JSON):**
        {
          "roast": "Texto de 3 parágrafos destruindo o edital.",
          "shareableQuote": "Uma frase curta e impactante para postar no Twitter/Instagram."
        }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return cleanAndParseJSON<{ roast: string, shareableQuote: string }>(response.text);
    }, 'roastEdital');
  },

  /**
   * FUNCIONALIDADE 10: CHAT DO MENTOR (STREAMING via Cloud Function)
   * Chat conversacional com persona MENTORI.
   * Usa Cloud Function como proxy para Vertex AI (ADC).
   * Flash para respostas rápidas, Pro para análises profundas.
   */
  async *mentorChat(
    userMessage: string,
    history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
    context?: ChatContext,
    useProModel: boolean = false
  ): AsyncGenerator<string> {
    // Cloud Function URL (update after deploy)
    const FUNCTION_URL = import.meta.env.VITE_MENTOR_CHAT_URL ||
      'http://127.0.0.1:5001/clinica-genesis-os-e689e/us-central1/mentorChat';

    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        history,
        context,
        useProModel,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    // Read streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              yield parsed.text;
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }
};

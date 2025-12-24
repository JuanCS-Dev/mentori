import { GoogleGenAI } from "@google/genai";
import {
  Question,
  EditalJSON,
  BankProfileJSON,
  NeuroStudyPlanJSON,
  QuestionAutopsy,
  MaterialJSON,
  DiscursiveTheme,
  DiscursiveEvaluation,
  StudyPlanParams
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
const isServer = typeof window === 'undefined';
const isCloudFunction = typeof process !== 'undefined' && !!process.env.FUNCTION_TARGET;

// Determine provider based on environment
function getAIConfig(): AIConfig {
  const VERTEX_PROJECT = (typeof process !== 'undefined' && process.env.GOOGLE_CLOUD_PROJECT) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLOUD_PROJECT) ||
    '';
  const VERTEX_LOCATION = (typeof process !== 'undefined' && process.env.GOOGLE_CLOUD_LOCATION) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLOUD_LOCATION) ||
    'us-central1';
  const API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || '';

  // Cloud Functions always use Vertex AI with ADC
  if (isCloudFunction || (isServer && VERTEX_PROJECT)) {
    return {
      provider: 'vertex-ai',
      project: VERTEX_PROJECT,
      location: VERTEX_LOCATION
    };
  }

  // Browser uses API key
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
    if (!config.apiKey) {
      console.warn('[GeminiService] No API key found. Set VITE_GEMINI_API_KEY in .env');
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
        Você é um especialista em Legal Design e Análise de Concursos Públicos.
        Sua missão é transformar o texto cru de um edital em uma estrutura de dados JSON "Verticalizada" e "Sem Gordura".

        **ENTRADA:**
        ${editalText.substring(0, 30000)}

        **FORMATO DE SAÍDA (JSON ÚNICO, SEM MARKDOWN):**
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
        Você é um Analista de Inteligência especializado em Bancas de Concursos.
        Gere um "Dossiê DNA" da banca.

        **ENTRADA:**
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
        Você é um Neurocientista Cognitivo. Gere um plano de estudos Bio-Adaptativo.
        Parâmetros: ${JSON.stringify(params)}

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
        Gere uma questão de concurso simulada.
        Foco: ${discipline} - ${topic} | Banca: ${bank} | Dificuldade: ${difficulty}

        **FORMATO DE SAÍDA (JSON):**
        {
          "discipline": "string", "topic": "string", "difficulty": "string",
          "statement": "string", "options": ["string"], "correctAnswer": number,
          "comment": "string", "trap": "string"
        }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_FLASH,
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
        Analise o erro do aluno nesta questão.
        Questão: ${statement} | Errou: ${wrongAnswer} | Correto: ${correctAnswer}

        **FORMATO DE SAÍDA (JSON):**
        {
          "diagnostico_erro": "string", "explicacao_tecnica": "string",
          "vacina_mental": "string", "gravidade": "string"
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
  }
};

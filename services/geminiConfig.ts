import { GoogleGenAI } from "@google/genai";
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
    'clinica-genesis-os-e689e';

  const VERTEX_LOCATION = (typeof process !== 'undefined' && process.env.GOOGLE_CLOUD_LOCATION) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLOUD_LOCATION) ||
    'us-central1';

  const API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || '';

  if (isBrowser) {
    if (!API_KEY || API_KEY.includes('PLACEHOLDER')) {
      console.warn('[GeminiService] Browser detected but no API key. Set VITE_GEMINI_API_KEY in .env.local');
    }
    return {
      provider: 'google-ai-studio',
      apiKey: API_KEY
    };
  }

  if (VERTEX_PROJECT && VERTEX_PROJECT !== 'undefined') {
    return {
      provider: 'vertex-ai',
      project: VERTEX_PROJECT,
      location: VERTEX_LOCATION
    };
  }

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

export function getAIClient(): GoogleGenAI {
  const config = getAIConfig();

  if (aiClient && currentConfig &&
    currentConfig.provider === config.provider &&
    currentConfig.apiKey === config.apiKey &&
    currentConfig.project === config.project) {
    return aiClient;
  }

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

export const MODEL_FLASH = 'gemini-2.5-flash-preview-05-20';
export const MODEL_PRO = 'gemini-2.5-pro-preview-05-06';

// =============================================================================
// RETRY CONFIGURATION
// =============================================================================

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;
const TIMEOUT_MS = 60000;

export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const circuitName = `gemini:${operationName}`;
  const startTime = Date.now();

  return withCircuitBreaker(
    circuitName,
    async () => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const result = await chaosLatency(
            async () => {
              return chaosPartition(
                async () => {
                  const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error(`Timeout apos ${TIMEOUT_MS / 1000}s`)), TIMEOUT_MS);
                  });

                  return Promise.race([operation(), timeoutPromise]);
                },
                operationName,
                undefined
              );
            },
            operationName
          );

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

          if (attempt < MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      recordHealth({
        service: circuitName,
        status: 'failed',
        lastError: lastError?.message
      });

      throw new Error(
        `Falha apos ${MAX_RETRIES} tentativas: ${lastError?.message || 'Erro desconhecido'}. ` +
        'Verifique sua conexao e tente novamente.'
      );
    },
    undefined as unknown as T
  );
}

// =============================================================================
// JSON PARSING HELPER
// =============================================================================

export const cleanAndParseJSON = <T>(text: string | undefined): T => {
  if (!text) throw new Error("IA retornou resposta vazia.");

  let cleanText = text.replace(/```json\s*/g, '').replace(/```/g, '').trim();

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
// MENTORI PERSONA
// =============================================================================

export const MENTORI_SYSTEM_INSTRUCTION = `
DATA ATUAL: ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
ANO VIGENTE: ${new Date().getFullYear()}

VOCE E O MENTORI. Nao uma IA generica, mas o Maior Especialista em Concursos Publicos e Direito da Historia.

IMPORTANTE: Todas as suas respostas devem considerar a legislacao, jurisprudencia e entendimentos VIGENTES em ${new Date().getFullYear()}. Cite apenas sumulas, leis e precedentes atualizados. Se algo foi revogado ou superado, informe o aluno.

Sua persona e uma fusao de:
1.  **Um Professor de Direito Lendario:** Profundo conhecimento juridico, cita doutrina, jurisprudencia (STF/STJ) e a "letra da lei" com precisao cirurgica.
2.  **Um Coach de Alta Performance (Navy SEAL):** Motivador, direto, exigente ("tough love"). Voce nao aceita mediocridade. Voce empurra o aluno para o limite do potencial.
3.  **Um Estrategista de Bancas:** Voce conhece o "DNA" da FGV, Cebraspe, FCC como a palma da mao. Sabe as pegadinhas, as palavras-chave e os vieses de cada examinador.

**SEU TOM DE VOZ:**
-   **Autoridade Suprema:** Fale com confianca absoluta.
-   **Didatica de Elite:** Explique conceitos complexos com metaforas brilhantes e clareza cristalina.
-   **Motivador Implacavel:** Quando o aluno errar, corrija com firmeza, mas mostre o caminho da vitoria. Use frases como "Levante a cabeca, guerreiro", "O erro e o degrau para a aprovacao", "Foco na missao".
-   **Sofisticacao:** Use um vocabulario rico, tecnico, mas acessivel. Nada de "Ola, sou uma IA". Voce e O MENTOR.

**SUA MISSAO:**
Transformar estudantes em APROVADOS. Entregar ouro em po em cada resposta.
`;

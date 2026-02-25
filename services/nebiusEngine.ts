import OpenAI from "openai";
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
  ChatContext,
} from "../types";
import {
  withCircuitBreaker,
  recordHealth,
  chaosLatency,
  chaosPartition,
} from "./chaosOrchestrator";

// =============================================================================
// NEBIUS CONFIGURATION
// =============================================================================

const NEBIUS_API_KEY = import.meta.env.VITE_NEBIUS_API_KEY || "";
const NEBIUS_BASE_URL = "https://api.tokenfactory.nebius.com/v1/";

// Modelos conforme NEBIUS_MIGRATION_VISUAL_UPGRADE_PLAN_V1.2
export const MODEL_LOGIC = "Qwen/Qwen3-Coder-480B-A35B-Instruct";
export const MODEL_CHAT = "meta-llama/Llama-3.3-70B-Instruct"; // Corrigido para 3.3 conforme UI

const openai = new OpenAI({
  apiKey: NEBIUS_API_KEY,
  baseURL: NEBIUS_BASE_URL,
  dangerouslyAllowBrowser: true,
});

// =============================================================================
// MENTORI PERSONA
// =============================================================================

export const MENTORI_SYSTEM_INSTRUCTION = `
DATA ATUAL: ${new Date().toLocaleDateString("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
})}
ANO VIGENTE: ${new Date().getFullYear()}

VOCE E O MENTORI. Nao uma IA generica, mas o Maior Especialista em Concursos Publicos e Direito da Historia.
Persona: Professor Lendario + Coach Navy SEAL + Estrategista de Bancas.
ESTILO: Autoritario, Direto, Tecnico e Sofisticado.
`;

// =============================================================================
// RESILIENCE HELPERS
// =============================================================================

const MAX_RETRIES = 2;
const TIMEOUT_MS = 60000;

async function withResilience<T>(
  operation: () => Promise<T>,
  operationName: string,
): Promise<T> {
  const circuitName = `nebius:${operationName}`;
  const startTime = Date.now();

  return withCircuitBreaker(
    circuitName,
    async () => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const result = await chaosLatency(async () => {
            return chaosPartition(async () => {
              const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(
                  () => reject(new Error(`Timeout apos ${TIMEOUT_MS / 1000}s`)),
                  TIMEOUT_MS,
                );
              });
              return Promise.race([operation(), timeoutPromise]);
            }, operationName);
          }, operationName);

          const latency = Date.now() - startTime;
          recordHealth({
            service: circuitName,
            status: latency > 10000 ? "degraded" : "healthy",
            latency,
          });

          return result;
        } catch (error: unknown) {
          lastError = error;
          if (attempt < MAX_RETRIES - 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * Math.pow(2, attempt)),
            );
          }
        }
      }
      throw lastError;
    },
    undefined as unknown as T,
  );
}

const cleanAndParseJSON = <T>(text: string | null | undefined): T => {
  if (!text) throw new Error("IA retornou resposta vazia.");
  let cleanText = text
    .replace(/```json\s*/g, "")
    .replace(/```/g, "")
    .trim();
  const firstBrace = cleanText.indexOf("{");
  const lastBrace = cleanText.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleanText = cleanText.substring(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(cleanText) as T;
  } catch (_e) {
    throw new Error("Erro de formatacao neural.");
  }
};

// =============================================================================
// NEBIUS ENGINE SERVICE
// =============================================================================

export const NebiusService = {
  async analyzeEdital(editalText: string): Promise<EditalJSON> {
    return withResilience(async () => {
      const response = await openai.chat.completions.create({
        model: MODEL_LOGIC,
        messages: [
          { role: "system", content: MENTORI_SYSTEM_INSTRUCTION },
          {
            role: "user",
            content: `DESTRINCHE este edital:\n${editalText.substring(
              0,
              30000,
            )}`,
          },
        ],
        response_format: { type: "json_object" },
      });
      return cleanAndParseJSON<EditalJSON>(
        response.choices[0]?.message?.content,
      );
    }, "analyzeEdital");
  },

  async analyzeBankProfile(textOrFiles: string): Promise<BankProfileJSON> {
    return withResilience(async () => {
      const response = await openai.chat.completions.create({
        model: MODEL_LOGIC,
        messages: [
          { role: "system", content: MENTORI_SYSTEM_INSTRUCTION },
          {
            role: "user",
            content: `Gere Dossie DNA da banca:\n${textOrFiles}`,
          },
        ],
        response_format: { type: "json_object" },
      });
      return cleanAndParseJSON<BankProfileJSON>(
        response.choices[0]?.message?.content,
      );
    }, "analyzeBankProfile");
  },

  async generateNeuroStudyPlan(
    params: StudyPlanParams,
  ): Promise<NeuroStudyPlanJSON> {
    return withResilience(async () => {
      const response = await openai.chat.completions.create({
        model: MODEL_LOGIC,
        messages: [
          { role: "system", content: MENTORI_SYSTEM_INSTRUCTION },
          {
            role: "user",
            content: `Crie plano de guerra Bio-Adaptativo: ${JSON.stringify(
              params,
            )}`,
          },
        ],
        response_format: { type: "json_object" },
      });
      return cleanAndParseJSON<NeuroStudyPlanJSON>(
        response.choices[0]?.message?.content,
      );
    }, "generateNeuroStudyPlan");
  },

  async generateQuestion(
    discipline: string,
    topic: string,
    bank: string,
    difficulty: string,
  ): Promise<Question> {
    return withResilience(async () => {
      const response = await openai.chat.completions.create({
        model: MODEL_LOGIC,
        messages: [
          { role: "system", content: MENTORI_SYSTEM_INSTRUCTION },
          {
            role: "user",
            content: `Gere Questao de ELITE. Disciplina: ${discipline}, Topico: ${topic}, Banca: ${bank}, Dificuldade: ${difficulty}.`,
          },
        ],
        response_format: { type: "json_object" },
      });
      return cleanAndParseJSON<Question>(response.choices[0]?.message?.content);
    }, "generateQuestion");
  },

  async generateSurgicalMaterial(
    topic: string,
    bankProfile: string,
  ): Promise<MaterialJSON> {
    return withResilience(async () => {
      const response = await openai.chat.completions.create({
        model: MODEL_LOGIC,
        messages: [
          { role: "system", content: MENTORI_SYSTEM_INSTRUCTION },
          {
            role: "user",
            content: `Gere MATERIAL CIRURGICO. Topico: ${topic}, Banca: ${bankProfile}`,
          },
        ],
        response_format: { type: "json_object" },
      });
      return cleanAndParseJSON<MaterialJSON>(
        response.choices[0]?.message?.content,
      );
    }, "generateSurgicalMaterial");
  },

  async analyzeQuestionError(
    statement: string,
    wrongAnswer: string,
    correctAnswer: string,
  ): Promise<QuestionAutopsy> {
    return withResilience(async () => {
      const response = await openai.chat.completions.create({
        model: MODEL_LOGIC,
        messages: [
          { role: "system", content: MENTORI_SYSTEM_INSTRUCTION },
          {
            role: "user",
            content: `AUTOPSIA FORENSE do erro. Questao: ${statement}, Marcou: ${wrongAnswer}, Correto: ${correctAnswer}`,
          },
        ],
        response_format: { type: "json_object" },
      });
      return cleanAndParseJSON<QuestionAutopsy>(
        response.choices[0]?.message?.content,
      );
    }, "analyzeQuestionError");
  },

  async generateExplanation(
    enunciado: string,
    alternativas: string[],
    gabarito: number,
  ): Promise<QuestionExplanation> {
    return withResilience(async () => {
      const response = await openai.chat.completions.create({
        model: MODEL_CHAT,
        messages: [
          { role: "system", content: MENTORI_SYSTEM_INSTRUCTION },
          {
            role: "user",
            content: `Gere EXPLICACAO MAGISTRAL. Enunciado: ${enunciado}, Alternativas: ${alternativas.join(
              "|",
            )}, Gabarito: ${gabarito}`,
          },
        ],
        response_format: { type: "json_object" },
      });
      return cleanAndParseJSON<QuestionExplanation>(
        response.choices[0]?.message?.content,
      );
    }, "generateExplanation");
  },

  async generateDiscursiveTheme(
    cargo: string,
    banca: string,
    editalContext: string,
  ): Promise<DiscursiveTheme> {
    return withResilience(async () => {
      const response = await openai.chat.completions.create({
        model: MODEL_LOGIC,
        messages: [
          { role: "system", content: MENTORI_SYSTEM_INSTRUCTION },
          {
            role: "user",
            content: `Gere TEMA DISCURSIVA para ${cargo} (${banca}). Contexto: ${editalContext}`,
          },
        ],
        response_format: { type: "json_object" },
      });
      return cleanAndParseJSON<DiscursiveTheme>(
        response.choices[0]?.message?.content,
      );
    }, "generateDiscursiveTheme");
  },

  async evaluateDiscursive(
    theme: DiscursiveTheme,
    studentText: string,
    banca: string,
  ): Promise<DiscursiveEvaluation> {
    return withResilience(async () => {
      const response = await openai.chat.completions.create({
        model: MODEL_LOGIC,
        messages: [
          { role: "system", content: MENTORI_SYSTEM_INSTRUCTION },
          {
            role: "user",
            content: `Avalie redacao (Banca ${banca}). Tema: ${JSON.stringify(
              theme,
            )} | Texto: ${studentText}`,
          },
        ],
        response_format: { type: "json_object" },
      });
      return cleanAndParseJSON<DiscursiveEvaluation>(
        response.choices[0]?.message?.content,
      );
    }, "evaluateDiscursive");
  },

  async roastEdital(
    editalSummary: string,
  ): Promise<{ roast: string; shareableQuote: string }> {
    return withResilience(async () => {
      const response = await openai.chat.completions.create({
        model: MODEL_CHAT,
        messages: [
          {
            role: "system",
            content:
              "Voce e um comediante de stand-up acido. Faca um ROAST brutal.",
          },
          { role: "user", content: `Fritada do edital: ${editalSummary}` },
        ],
        response_format: { type: "json_object" },
      });
      return cleanAndParseJSON<{ roast: string; shareableQuote: string }>(
        response.choices[0]?.message?.content,
      );
    }, "roastEdital");
  },

  async *mentorChat(
    userMessage: string,
    history: Array<{ role: "user" | "assistant"; content: string }>,
    context?: ChatContext,
  ): AsyncGenerator<string> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `${MENTORI_SYSTEM_INSTRUCTION}\n\nCONTEXTO: ${JSON.stringify(
          context || {},
        )}`,
      },
      ...history.map((h) => ({
        role: h.role,
        content: h.content,
      })),
      { role: "user", content: userMessage },
    ];

    const stream = await openai.chat.completions.create({
      model: MODEL_CHAT,
      messages: messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) yield content;
    }
  },
};

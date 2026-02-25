/**
 * Mentori Database - Hybrid Storage (Supabase + IndexedDB)
 *
 * Banco de questões reais de concursos públicos.
 * Estratégia: Supabase (Nuvem) com Cache local via IndexedDB (Dexie).
 */

import Dexie, { Table } from "dexie";
import { QuestionExplanation } from "../types";
import { SupabaseService } from "./supabaseService";

/**
 * Questão de concurso no formato do banco
 */
export interface ConcursoQuestion {
  id: string;
  banca: string;
  concurso: string;
  ano: number;
  cargo: string;
  numero: number;
  disciplina: string;
  texto_id?: string;
  texto_base?: string;
  comando?: string;
  enunciado: string;
  alternativas: string[];
  gabarito: number;
  tipo: "certo_errado" | "multipla_escolha";
  anulada?: boolean;
  explicacao?: QuestionExplanation;
}

/**
 * Tentativa de resposta do usuário
 */
export interface QuestionAttempt {
  id?: number;
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timestamp: number;
  timeSpent?: number;
}

/**
 * Mentori Database Schema
 */
class MentoriDB extends Dexie {
  questions!: Table<ConcursoQuestion, string>;
  attempts!: Table<QuestionAttempt, number>;

  constructor() {
    super("MentoriDB");
    this.version(1).stores({
      questions: "id, banca, ano, disciplina, tipo",
      attempts: "++id, questionId, isCorrect, timestamp",
    });
  }
}

export const db = new MentoriDB();

/**
 * API de Questões - Hybrid Implementation
 */
export const QuestionsDB = {
  async count(): Promise<number> {
    const localCount = await db.questions.count();
    if (localCount > 0) return localCount;

    // Se local está vazio, não temos uma forma fácil de contar remoto sem carregar
    // Para simplificar, retornamos o local
    return localCount;
  },

  async query(filters: {
    discipline?: string;
    bank?: string;
    year?: number;
    tipo?: string;
    limit?: number;
    excludeIds?: string[];
  }): Promise<ConcursoQuestion[]> {
    // 1. Tentar buscar do Supabase primeiro (Soberania de Nuvem)
    try {
      const remoteResults = await SupabaseService.getQuestions(filters);
      if (remoteResults.length > 0) {
        // Cachear localmente em background
        db.questions.bulkPut(remoteResults).catch(() => {
          /* ignore cache errors */
        });
        return remoteResults;
      }
    } catch (_e) {
      console.warn("[Database] Supabase offline, usando cache local.");
    }

    // 2. Fallback para cache local (IndexedDB)
    let results = await db.questions.toArray();

    if (filters.discipline) {
      const searchTerm = filters.discipline.toLowerCase();
      results = results.filter((q) =>
        q.disciplina.toLowerCase().includes(searchTerm),
      );
    }
    if (filters.bank && filters.bank !== "Todas") {
      results = results.filter((q) => q.banca === filters.bank);
    }
    if (filters.year && filters.year > 0) {
      results = results.filter((q) => q.ano === filters.year);
    }
    if (filters.tipo && filters.tipo !== "Qualquer") {
      results = results.filter((q) => q.tipo === filters.tipo);
    }
    if (filters.excludeIds && filters.excludeIds.length > 0) {
      const excludeSet = new Set(filters.excludeIds);
      results = results.filter((q) => !excludeSet.has(q.id));
    }

    results.sort(() => Math.random() - 0.5);
    return results.slice(0, filters.limit || 10);
  },

  async getErroredQuestions(limit = 20): Promise<ConcursoQuestion[]> {
    const wrongAttempts = await db.attempts
      .where("isCorrect")
      .equals(0)
      .toArray();

    const wrongIds = [...new Set(wrongAttempts.map((a) => a.questionId))];
    if (wrongIds.length === 0) return [];

    const questions = await db.questions.where("id").anyOf(wrongIds).toArray();
    return questions.sort(() => Math.random() - 0.5).slice(0, limit);
  },

  async getBancas(): Promise<string[]> {
    const questions = await db.questions.toArray();
    const bancas = new Set(questions.map((q) => q.banca));
    return [...bancas].sort();
  },

  async getDisciplinas(): Promise<string[]> {
    const questions = await db.questions.toArray();
    const disciplinas = new Set(questions.map((q) => q.disciplina));
    return [...disciplinas].sort();
  },

  async getAnos(): Promise<number[]> {
    const questions = await db.questions.toArray();
    const anos = new Set(questions.map((q) => q.ano));
    return [...anos].sort((a, b) => b - a);
  },

  async bulkImport(questions: ConcursoQuestion[]): Promise<number> {
    // Importar local
    await db.questions.bulkPut(questions);

    // Opcional: Sincronizar com Supabase se necessário
    // SupabaseService.bulkUpsertQuestions(questions);

    return questions.length;
  },

  async clear(): Promise<void> {
    await db.questions.clear();
  },

  async updateExplanation(
    questionId: string,
    explicacao: QuestionExplanation,
  ): Promise<void> {
    await db.questions.update(questionId, { explicacao });
    // TODO: Update remote
  },

  async getById(questionId: string): Promise<ConcursoQuestion | undefined> {
    return db.questions.get(questionId);
  },

  async getQuestionsWithoutExplanation(
    limit = 50,
  ): Promise<ConcursoQuestion[]> {
    const questions = await db.questions.toArray();
    return questions.filter((q) => !q.explicacao).slice(0, limit);
  },
};

/**
 * API de Tentativas - Cloud Synced
 */
export const AttemptsDB = {
  async record(
    questionId: string,
    selectedAnswer: number,
    isCorrect: boolean,
    timeSpent?: number,
  ): Promise<void> {
    const attempt: QuestionAttempt = {
      questionId,
      selectedAnswer,
      isCorrect,
      timestamp: Date.now(),
      timeSpent,
    };

    // 1. Gravar Local (Offline-first)
    await db.attempts.add(attempt);

    // 2. Gravar Remoto (Supabase)
    SupabaseService.recordAttempt(attempt).catch(() => {
      console.warn("[Database] Falha ao sincronizar tentativa com Supabase.");
    });
  },

  async getStats(): Promise<{
    total: number;
    correct: number;
    accuracy: number;
  }> {
    // Preferir stats remotos se possível para consistência multi-device
    try {
      return await SupabaseService.getUserStats();
    } catch {
      const attempts = await db.attempts.toArray();
      const total = attempts.length;
      const correct = attempts.filter((a) => a.isCorrect).length;
      return {
        total,
        correct,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      };
    }
  },

  async clear(): Promise<void> {
    await db.attempts.clear();
  },

  async getTimeStats(): Promise<{
    avgTimeSeconds: number;
    totalTimeSeconds: number;
    byDiscipline: Record<string, { avgTime: number; count: number }>;
  }> {
    const attempts = await db.attempts.toArray();
    const withTime = attempts.filter(
      (a) => a.timeSpent !== undefined && a.timeSpent > 0,
    );

    if (withTime.length === 0) {
      return { avgTimeSeconds: 0, totalTimeSeconds: 0, byDiscipline: {} };
    }

    const totalTime = withTime.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
    const avgTime = Math.round(totalTime / withTime.length);

    const questions = await db.questions.toArray();
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    const byDiscipline: Record<string, { totalTime: number; count: number }> =
      {};

    for (const attempt of withTime) {
      const question = questionMap.get(attempt.questionId);
      if (!question) continue;

      const disc = question.disciplina;
      if (!byDiscipline[disc]) {
        byDiscipline[disc] = { totalTime: 0, count: 0 };
      }
      byDiscipline[disc].totalTime += attempt.timeSpent || 0;
      byDiscipline[disc].count++;
    }

    const result: Record<string, { avgTime: number; count: number }> = {};
    for (const [disc, data] of Object.entries(byDiscipline)) {
      result[disc] = {
        avgTime: Math.round(data.totalTime / data.count),
        count: data.count,
      };
    }

    return {
      avgTimeSeconds: avgTime,
      totalTimeSeconds: totalTime,
      byDiscipline: result,
    };
  },

  async getQuestionAttempts(questionId: string): Promise<QuestionAttempt[]> {
    return db.attempts.where("questionId").equals(questionId).toArray();
  },
};

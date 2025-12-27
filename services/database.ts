/**
 * Mentori Database - IndexedDB via Dexie
 *
 * Banco de questões reais de concursos públicos.
 * Dados gerados pelo indexador Python (indexer/parser.py).
 */

import Dexie, { Table } from 'dexie';
import { QuestionExplanation } from '../types';

/**
 * Questão de concurso no formato do banco
 * Compatível com RealQuestion do questionsService
 */
export interface ConcursoQuestion {
  id: string;
  banca: string;
  concurso: string;
  ano: number;
  cargo: string;
  numero: number;
  disciplina: string;
  // Estrutura CEBRASPE para textos de apoio
  texto_id?: string;    // Código do texto (ex: "CB1A1")
  texto_base?: string;  // Conteúdo do texto de apoio
  comando?: string;     // Frase introdutória (ex: "Julgue os itens a seguir...")
  enunciado: string;
  alternativas: string[];
  gabarito: number;
  tipo: 'certo_errado' | 'multipla_escolha';
  anulada?: boolean;
  // AI-generated explanation (populated on-demand by GeminiService)
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
    super('MentoriDB');

    // Schema v1 - índices para busca eficiente
    this.version(1).stores({
      questions: 'id, banca, ano, disciplina, tipo',
      attempts: '++id, questionId, isCorrect, timestamp'
    });
  }
}

// Singleton
export const db = new MentoriDB();

/**
 * API de Questões
 */
export const QuestionsDB = {
  /**
   * Total de questões no banco
   */
  async count(): Promise<number> {
    return db.questions.count();
  },

  /**
   * Buscar questões com filtros
   */
  async query(filters: {
    discipline?: string;
    bank?: string;
    year?: number;
    tipo?: string;
    limit?: number;
    excludeIds?: string[];
  }): Promise<ConcursoQuestion[]> {
    let collection = db.questions.toCollection();

    // Aplicar filtros
    let results = await collection.toArray();

    // Filtro por disciplina (fuzzy)
    if (filters.discipline && filters.discipline.length > 0) {
      const searchTerm = filters.discipline.toLowerCase();
      results = results.filter(q =>
        q.disciplina.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por banca
    if (filters.bank && filters.bank !== 'Todas') {
      const bankLower = filters.bank.toLowerCase();
      results = results.filter(q =>
        q.banca.toLowerCase() === bankLower
      );
    }

    // Filtro por ano (0 = todos)
    if (filters.year && filters.year > 0) {
      results = results.filter(q => q.ano === filters.year);
    }

    // Filtro por tipo (certo_errado / multipla_escolha)
    if (filters.tipo && filters.tipo !== 'Qualquer') {
      results = results.filter(q => q.tipo === filters.tipo);
    }

    // Excluir IDs já respondidos (para evitar repetição)
    if (filters.excludeIds && filters.excludeIds.length > 0) {
      const excludeSet = new Set(filters.excludeIds);
      results = results.filter(q => !excludeSet.has(q.id));
    }

    // Randomizar
    results.sort(() => Math.random() - 0.5);

    // Aplicar limite
    const limit = filters.limit || 10;
    return results.slice(0, limit);
  },

  /**
   * Buscar questões erradas pelo usuário (Caderno de Erros)
   */
  async getErroredQuestions(limit = 20): Promise<ConcursoQuestion[]> {
    // Buscar IDs de questões que o usuário errou
    const wrongAttempts = await db.attempts
      .where('isCorrect')
      .equals(0)
      .toArray();

    const wrongIds = [...new Set(wrongAttempts.map(a => a.questionId))];

    if (wrongIds.length === 0) return [];

    // Buscar as questões
    const questions = await db.questions
      .where('id')
      .anyOf(wrongIds)
      .toArray();

    // Randomizar e limitar
    return questions
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  },

  /**
   * Listar bancas disponíveis
   */
  async getBancas(): Promise<string[]> {
    const questions = await db.questions.toArray();
    const bancas = new Set(questions.map(q => q.banca));
    return [...bancas].sort();
  },

  /**
   * Listar disciplinas disponíveis
   */
  async getDisciplinas(): Promise<string[]> {
    const questions = await db.questions.toArray();
    const disciplinas = new Set(questions.map(q => q.disciplina));
    return [...disciplinas].sort();
  },

  /**
   * Listar anos disponíveis
   */
  async getAnos(): Promise<number[]> {
    const questions = await db.questions.toArray();
    const anos = new Set(questions.map(q => q.ano));
    return [...anos].sort((a, b) => b - a);
  },

  /**
   * Importar questões em batch
   */
  async bulkImport(questions: ConcursoQuestion[]): Promise<number> {
    await db.questions.bulkPut(questions);
    return questions.length;
  },

  /**
   * Limpar banco de questões
   */
  async clear(): Promise<void> {
    await db.questions.clear();
  },

  /**
   * Atualizar explicação de uma questão
   */
  async updateExplanation(questionId: string, explicacao: QuestionExplanation): Promise<void> {
    await db.questions.update(questionId, { explicacao });
  },

  /**
   * Buscar questão por ID
   */
  async getById(questionId: string): Promise<ConcursoQuestion | undefined> {
    return db.questions.get(questionId);
  },

  /**
   * Buscar questões sem explicação (para geração em batch)
   */
  async getQuestionsWithoutExplanation(limit = 50): Promise<ConcursoQuestion[]> {
    const questions = await db.questions.toArray();
    return questions
      .filter(q => !q.explicacao)
      .slice(0, limit);
  }
};

/**
 * API de Tentativas (para tracking de erros)
 */
export const AttemptsDB = {
  /**
   * Registrar tentativa
   */
  async record(questionId: string, selectedAnswer: number, isCorrect: boolean, timeSpent?: number): Promise<void> {
    await db.attempts.add({
      questionId,
      selectedAnswer,
      isCorrect,
      timestamp: Date.now(),
      timeSpent
    });
  },

  /**
   * Estatísticas do usuário
   */
  async getStats(): Promise<{
    total: number;
    correct: number;
    accuracy: number;
  }> {
    const attempts = await db.attempts.toArray();
    const total = attempts.length;
    const correct = attempts.filter(a => a.isCorrect).length;
    return {
      total,
      correct,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0
    };
  },

  /**
   * Limpar tentativas
   */
  async clear(): Promise<void> {
    await db.attempts.clear();
  },

  /**
   * Estatísticas de tempo por disciplina
   */
  async getTimeStats(): Promise<{
    avgTimeSeconds: number;
    totalTimeSeconds: number;
    byDiscipline: Record<string, { avgTime: number; count: number }>;
  }> {
    const attempts = await db.attempts.toArray();
    const withTime = attempts.filter(a => a.timeSpent !== undefined && a.timeSpent > 0);

    if (withTime.length === 0) {
      return { avgTimeSeconds: 0, totalTimeSeconds: 0, byDiscipline: {} };
    }

    const totalTime = withTime.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
    const avgTime = Math.round(totalTime / withTime.length);

    // Get questions to group by discipline
    const questions = await db.questions.toArray();
    const questionMap = new Map(questions.map(q => [q.id, q]));

    const byDiscipline: Record<string, { totalTime: number; count: number }> = {};

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

    // Calculate averages
    const result: Record<string, { avgTime: number; count: number }> = {};
    for (const [disc, data] of Object.entries(byDiscipline)) {
      result[disc] = {
        avgTime: Math.round(data.totalTime / data.count),
        count: data.count
      };
    }

    return {
      avgTimeSeconds: avgTime,
      totalTimeSeconds: totalTime,
      byDiscipline: result
    };
  },

  /**
   * Histórico de tentativas para uma questão específica
   */
  async getQuestionAttempts(questionId: string): Promise<QuestionAttempt[]> {
    return db.attempts.where('questionId').equals(questionId).toArray();
  }
};

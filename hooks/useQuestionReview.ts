/**
 * useQuestionReview - Pipeline SM-2 + Elo + Confidence
 *
 * Conecta o sistema de Spaced Repetition (SM-2) com o fluxo de questões.
 * Quando o usuário responde uma questão, este hook:
 * 1. Cria/atualiza o card SM-2 correspondente
 * 2. Calcula o próximo intervalo de revisão
 * 3. Retorna questões "due" para priorização
 *
 * Baseado na pesquisa 2025 de Spaced Repetition.
 */

import { useCallback, useMemo } from 'react';
import {
  SRSCard,
  calculateNextReview,
  getCardsForReview,
  getDeckStats,
  simpleToSM2Quality,
  ReviewQuality
} from '../services/spacedRepetition';
import { usePersistence } from './usePersistence';
import { RealQuestion } from '../services/questionsService';

// Storage key for question-to-card mapping
const QUESTION_CARDS_KEY = 'question_srs_cards';

export interface QuestionReviewCard extends SRSCard {
  questionId: string;
  questionSource: 'CONCURSO' | 'ENEM' | 'AI';
  lastAnswer: 'correct' | 'incorrect';
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
}

interface QuestionReviewState {
  cards: QuestionReviewCard[];
  lastUpdated: string;
}

const defaultState: QuestionReviewState = {
  cards: [],
  lastUpdated: new Date().toISOString()
};

/**
 * Hook principal para integração SM-2 com questões
 */
export function useQuestionReview() {
  const [state, setState] = usePersistence<QuestionReviewState>(
    QUESTION_CARDS_KEY,
    defaultState
  );

  /**
   * Registra resposta de uma questão e cria/atualiza card SM-2
   */
  const recordAnswer = useCallback((
    question: RealQuestion,
    isCorrect: boolean,
    confidence: 'easy' | 'medium' | 'hard' = 'medium'
  ): QuestionReviewCard => {
    const quality = simpleToSM2Quality(isCorrect, confidence);

    setState(prev => {
      const existingIndex = prev.cards.findIndex(c => c.questionId === question.id);

      if (existingIndex >= 0) {
        // Atualizar card existente
        const existingCard = prev.cards[existingIndex];
        if (!existingCard) return prev;

        const updatedCard = calculateNextReview(existingCard, quality) as QuestionReviewCard;
        updatedCard.lastAnswer = isCorrect ? 'correct' : 'incorrect';
        updatedCard.consecutiveCorrect = isCorrect
          ? (existingCard.consecutiveCorrect || 0) + 1
          : 0;
        updatedCard.consecutiveIncorrect = !isCorrect
          ? (existingCard.consecutiveIncorrect || 0) + 1
          : 0;

        const newCards = [...prev.cards];
        newCards[existingIndex] = updatedCard;

        return {
          cards: newCards,
          lastUpdated: new Date().toISOString()
        };
      } else {
        // Criar novo card
        const newCard = createQuestionCard(question, quality, isCorrect);

        return {
          cards: [...prev.cards, newCard],
          lastUpdated: new Date().toISOString()
        };
      }
    });

    // Retornar o card atualizado/criado
    const existingCard = state.cards.find(c => c.questionId === question.id);
    if (existingCard) {
      return calculateNextReview(existingCard, quality) as QuestionReviewCard;
    }
    return createQuestionCard(question, quality, isCorrect);
  }, [state.cards, setState]);

  /**
   * Retorna questões que precisam ser revisadas hoje
   */
  const getDueQuestionIds = useCallback((limit?: number): string[] => {
    const dueCards = getCardsForReview(state.cards, limit);
    return dueCards.map(card => (card as QuestionReviewCard).questionId);
  }, [state.cards]);

  /**
   * Verifica se uma questão específica está "due" para revisão
   */
  const isQuestionDue = useCallback((questionId: string): boolean => {
    const card = state.cards.find(c => c.questionId === questionId);
    if (!card) return false;
    return new Date(card.nextReview) <= new Date();
  }, [state.cards]);

  /**
   * Retorna o card de uma questão específica
   */
  const getQuestionCard = useCallback((questionId: string): QuestionReviewCard | null => {
    return state.cards.find(c => c.questionId === questionId) || null;
  }, [state.cards]);

  /**
   * Estatísticas do sistema de revisão
   */
  const stats = useMemo(() => {
    const baseStats = getDeckStats(state.cards);
    const byDiscipline: Record<string, { total: number; due: number; retention: number }> = {};

    state.cards.forEach(card => {
      const discipline = card.discipline || 'Geral';
      if (!byDiscipline[discipline]) {
        byDiscipline[discipline] = { total: 0, due: 0, retention: 0 };
      }
      byDiscipline[discipline].total += 1;
      if (new Date(card.nextReview) <= new Date()) {
        byDiscipline[discipline].due += 1;
      }
      if (card.totalReviews > 0) {
        byDiscipline[discipline].retention +=
          (card.correctReviews / card.totalReviews) * 100;
      }
    });

    // Calcular média de retenção por disciplina
    Object.keys(byDiscipline).forEach(discipline => {
      const d = byDiscipline[discipline];
      if (d && d.total > 0) {
        d.retention = Math.round(d.retention / d.total);
      }
    });

    return {
      ...baseStats,
      byDiscipline
    };
  }, [state.cards]);

  /**
   * Prioriza questões, colocando as "due" primeiro
   * Usado pelo QuestionBank para ordenar resultados
   */
  const prioritizeQuestions = useCallback((questions: RealQuestion[]): RealQuestion[] => {
    const dueIds = new Set(getDueQuestionIds());

    // Separar em due e não-due
    const dueQuestions: RealQuestion[] = [];
    const otherQuestions: RealQuestion[] = [];

    questions.forEach(q => {
      if (dueIds.has(q.id)) {
        dueQuestions.push(q);
      } else {
        otherQuestions.push(q);
      }
    });

    // Ordenar due por mais atrasado primeiro
    dueQuestions.sort((a, b) => {
      const cardA = state.cards.find(c => c.questionId === a.id);
      const cardB = state.cards.find(c => c.questionId === b.id);
      if (!cardA || !cardB) return 0;

      const overdueA = Date.now() - new Date(cardA.nextReview).getTime();
      const overdueB = Date.now() - new Date(cardB.nextReview).getTime();
      return overdueB - overdueA; // Mais atrasado primeiro
    });

    return [...dueQuestions, ...otherQuestions];
  }, [getDueQuestionIds, state.cards]);

  /**
   * Implementa interleaving - mistura disciplinas para melhor retenção
   * Pesquisa 2025: 70% de topic switch é o ideal
   */
  const applyInterleaving = useCallback((questions: RealQuestion[], targetSwitchRate: number = 0.7): RealQuestion[] => {
    if (questions.length <= 2) return questions;

    const result: RealQuestion[] = [];
    const byDiscipline: Map<string, RealQuestion[]> = new Map();

    // Agrupar por disciplina
    questions.forEach(q => {
      const discipline = q.discipline || 'Geral';
      if (!byDiscipline.has(discipline)) {
        byDiscipline.set(discipline, []);
      }
      byDiscipline.get(discipline)!.push(q);
    });

    const disciplines = Array.from(byDiscipline.keys());
    if (disciplines.length === 1) return questions; // Só uma disciplina, não dá pra intercalar

    let lastDiscipline = '';
    let switches = 0;

    // Algoritmo de interleaving
    while (result.length < questions.length) {
      // Calcular taxa atual de switches
      const currentSwitchRate = result.length > 1 ? switches / (result.length - 1) : 0;

      // Decidir se deve trocar de disciplina
      const shouldSwitch = currentSwitchRate < targetSwitchRate;

      // Encontrar próxima disciplina
      let nextDiscipline = lastDiscipline;

      if (shouldSwitch && disciplines.length > 1) {
        // Trocar para outra disciplina com questões disponíveis
        const availableDisciplines = disciplines.filter(d =>
          d !== lastDiscipline && (byDiscipline.get(d)?.length ?? 0) > 0
        );

        if (availableDisciplines.length > 0) {
          // Escolher aleatoriamente entre as disponíveis
          nextDiscipline = availableDisciplines[Math.floor(Math.random() * availableDisciplines.length)] || lastDiscipline;
        }
      }

      // Se não conseguiu trocar ou não deve trocar, pegar da mesma disciplina
      if (!nextDiscipline || (byDiscipline.get(nextDiscipline)?.length ?? 0) === 0) {
        // Encontrar qualquer disciplina com questões
        for (const d of disciplines) {
          if ((byDiscipline.get(d)?.length ?? 0) > 0) {
            nextDiscipline = d;
            break;
          }
        }
      }

      if (!nextDiscipline) break; // Não deveria acontecer

      const disciplineQuestions = byDiscipline.get(nextDiscipline);
      if (!disciplineQuestions || disciplineQuestions.length === 0) break;

      const question = disciplineQuestions.shift()!;
      result.push(question);

      if (result.length > 1 && nextDiscipline !== lastDiscipline) {
        switches++;
      }

      lastDiscipline = nextDiscipline;
    }

    return result;
  }, []);

  /**
   * Limpa todos os cards de revisão
   */
  const clearAllCards = useCallback(() => {
    setState(defaultState);
  }, [setState]);

  return {
    // Ações
    recordAnswer,
    clearAllCards,

    // Queries
    getDueQuestionIds,
    isQuestionDue,
    getQuestionCard,
    prioritizeQuestions,
    applyInterleaving,

    // Estatísticas
    stats,
    totalCards: state.cards.length,
    dueCount: stats.dueToday
  };
}

/**
 * Cria um novo card de questão
 */
function createQuestionCard(
  question: RealQuestion,
  quality: ReviewQuality,
  isCorrect: boolean
): QuestionReviewCard {
  const now = new Date();
  const nextReview = new Date();

  // Primeiro intervalo baseado na qualidade
  if (quality >= 3) {
    nextReview.setDate(nextReview.getDate() + 1); // 1 dia se acertou
  } else {
    nextReview.setMinutes(nextReview.getMinutes() + 10); // 10 min se errou
  }

  return {
    id: `qcard_${question.id}`,
    questionId: question.id,
    questionSource: question.source as 'CONCURSO' | 'ENEM' | 'AI',
    front: question.statement.substring(0, 200) + (question.statement.length > 200 ? '...' : ''),
    back: question.options[question.correctAnswer] || 'Resposta',
    easeFactor: 2.5,
    interval: quality >= 3 ? 1 : 0,
    repetitions: quality >= 3 ? 1 : 0,
    nextReview: nextReview.toISOString(),
    lastReview: now.toISOString(),
    discipline: question.discipline,
    topic: question.discipline,
    createdAt: now.toISOString(),
    totalReviews: 1,
    correctReviews: isCorrect ? 1 : 0,
    lastAnswer: isCorrect ? 'correct' : 'incorrect',
    consecutiveCorrect: isCorrect ? 1 : 0,
    consecutiveIncorrect: isCorrect ? 0 : 1
  };
}

/**
 * Hook para exibir badge de revisão no QuestionCard
 */
export function useReviewBadge(questionId: string) {
  const { isQuestionDue, getQuestionCard } = useQuestionReview();

  const card = getQuestionCard(questionId);
  const isDue = isQuestionDue(questionId);

  return {
    showBadge: isDue,
    badgeType: card ? (
      card.consecutiveIncorrect > 2 ? 'struggling' :
        card.interval >= 21 ? 'mature' :
          isDue ? 'due' : 'learning'
    ) : null,
    streakInfo: card ? {
      consecutiveCorrect: card.consecutiveCorrect,
      consecutiveIncorrect: card.consecutiveIncorrect,
      retention: card.totalReviews > 0
        ? Math.round((card.correctReviews / card.totalReviews) * 100)
        : 0
    } : null
  };
}

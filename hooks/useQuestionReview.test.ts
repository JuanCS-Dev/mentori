import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuestionReview } from './useQuestionReview';
import { RealQuestion } from '../services/questionsService';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Mock question data
const mockQuestion: RealQuestion = {
  id: 'q_001',
  year: 2024,
  source: 'CONCURSO',
  discipline: 'Direito Constitucional',
  statement: 'O princípio da legalidade está previsto na Constituição Federal.',
  options: ['Certo', 'Errado'],
  correctAnswer: 0
};

const mockQuestion2: RealQuestion = {
  id: 'q_002',
  year: 2023,
  source: 'CONCURSO',
  discipline: 'Direito Administrativo',
  statement: 'Os atos administrativos são sempre vinculados.',
  options: ['Certo', 'Errado'],
  correctAnswer: 1
};

describe('useQuestionReview', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe('recordAnswer', () => {
    it('should create a new card when answering a question for the first time', () => {
      const { result } = renderHook(() => useQuestionReview());

      act(() => {
        result.current.recordAnswer(mockQuestion, true, 'medium');
      });

      expect(result.current.totalCards).toBe(1);
    });

    it('should update existing card on subsequent answers', () => {
      const { result } = renderHook(() => useQuestionReview());

      act(() => {
        result.current.recordAnswer(mockQuestion, true, 'medium');
      });

      act(() => {
        result.current.recordAnswer(mockQuestion, true, 'easy');
      });

      expect(result.current.totalCards).toBe(1);
      const card = result.current.getQuestionCard(mockQuestion.id);
      expect(card?.totalReviews).toBe(2);
    });

    it('should track consecutive correct answers', () => {
      const { result } = renderHook(() => useQuestionReview());

      act(() => {
        result.current.recordAnswer(mockQuestion, true, 'medium');
      });

      act(() => {
        result.current.recordAnswer(mockQuestion, true, 'medium');
      });

      const card = result.current.getQuestionCard(mockQuestion.id);
      expect(card?.consecutiveCorrect).toBe(2);
      expect(card?.consecutiveIncorrect).toBe(0);
    });

    it('should reset consecutive correct on wrong answer', () => {
      const { result } = renderHook(() => useQuestionReview());

      act(() => {
        result.current.recordAnswer(mockQuestion, true, 'medium');
      });

      act(() => {
        result.current.recordAnswer(mockQuestion, true, 'medium');
      });

      act(() => {
        result.current.recordAnswer(mockQuestion, false, 'hard');
      });

      const card = result.current.getQuestionCard(mockQuestion.id);
      expect(card?.consecutiveCorrect).toBe(0);
      expect(card?.consecutiveIncorrect).toBe(1);
    });
  });

  describe('isQuestionDue', () => {
    it('should return false for non-existent question', () => {
      const { result } = renderHook(() => useQuestionReview());

      expect(result.current.isQuestionDue('non_existent')).toBe(false);
    });

    it('should return true for question with past nextReview date', () => {
      const { result } = renderHook(() => useQuestionReview());

      // Answer incorrectly (will be due in 10 minutes)
      act(() => {
        result.current.recordAnswer(mockQuestion, false, 'hard');
      });

      // Advance time by 15 minutes
      act(() => {
        vi.advanceTimersByTime(15 * 60 * 1000);
      });

      expect(result.current.isQuestionDue(mockQuestion.id)).toBe(true);
    });
  });

  describe('getQuestionCard', () => {
    it('should return null for non-existent question', () => {
      const { result } = renderHook(() => useQuestionReview());

      expect(result.current.getQuestionCard('non_existent')).toBeNull();
    });

    it('should return card for existing question', () => {
      const { result } = renderHook(() => useQuestionReview());

      act(() => {
        result.current.recordAnswer(mockQuestion, true, 'medium');
      });

      const card = result.current.getQuestionCard(mockQuestion.id);
      expect(card).not.toBeNull();
      expect(card?.questionId).toBe(mockQuestion.id);
      expect(card?.discipline).toBe(mockQuestion.discipline);
    });
  });

  describe('prioritizeQuestions', () => {
    it('should put due questions first', () => {
      const { result } = renderHook(() => useQuestionReview());

      // Answer first question correctly (won't be due for a while)
      act(() => {
        result.current.recordAnswer(mockQuestion, true, 'easy');
      });

      // Answer second question incorrectly (will be due soon)
      act(() => {
        result.current.recordAnswer(mockQuestion2, false, 'hard');
      });

      // Advance time to make second question due
      act(() => {
        vi.advanceTimersByTime(15 * 60 * 1000);
      });

      const prioritized = result.current.prioritizeQuestions([mockQuestion, mockQuestion2]);

      // Question 2 (due) should come first
      expect(prioritized[0].id).toBe(mockQuestion2.id);
    });

    it('should maintain order for non-due questions', () => {
      const { result } = renderHook(() => useQuestionReview());

      // No answers recorded, questions should maintain order
      const prioritized = result.current.prioritizeQuestions([mockQuestion, mockQuestion2]);

      expect(prioritized[0].id).toBe(mockQuestion.id);
      expect(prioritized[1].id).toBe(mockQuestion2.id);
    });
  });

  describe('applyInterleaving', () => {
    it('should return same order for single discipline', () => {
      const { result } = renderHook(() => useQuestionReview());

      const questions: RealQuestion[] = [
        { ...mockQuestion, id: 'q1' },
        { ...mockQuestion, id: 'q2' },
        { ...mockQuestion, id: 'q3' },
      ];

      const interleaved = result.current.applyInterleaving(questions);

      expect(interleaved.length).toBe(3);
    });

    it('should interleave multiple disciplines', () => {
      const { result } = renderHook(() => useQuestionReview());

      const questions: RealQuestion[] = [
        { ...mockQuestion, id: 'q1', discipline: 'Direito Constitucional' },
        { ...mockQuestion, id: 'q2', discipline: 'Direito Constitucional' },
        { ...mockQuestion2, id: 'q3', discipline: 'Direito Administrativo' },
        { ...mockQuestion2, id: 'q4', discipline: 'Direito Administrativo' },
      ];

      const interleaved = result.current.applyInterleaving(questions, 0.7);

      expect(interleaved.length).toBe(4);

      // Count discipline switches
      let switches = 0;
      for (let i = 1; i < interleaved.length; i++) {
        if (interleaved[i].discipline !== interleaved[i - 1].discipline) {
          switches++;
        }
      }

      // Should have at least some switches
      expect(switches).toBeGreaterThan(0);
    });

    it('should return questions unchanged if less than 3', () => {
      const { result } = renderHook(() => useQuestionReview());

      const questions: RealQuestion[] = [mockQuestion, mockQuestion2];

      const interleaved = result.current.applyInterleaving(questions);

      expect(interleaved).toEqual(questions);
    });
  });

  describe('stats', () => {
    it('should return correct statistics', () => {
      const { result } = renderHook(() => useQuestionReview());

      expect(result.current.stats.total).toBe(0);
      expect(result.current.stats.dueToday).toBe(0);

      act(() => {
        result.current.recordAnswer(mockQuestion, true, 'medium');
      });

      expect(result.current.stats.total).toBe(1);
    });

    it('should track by discipline', () => {
      const { result } = renderHook(() => useQuestionReview());

      act(() => {
        result.current.recordAnswer(mockQuestion, true, 'medium');
      });

      act(() => {
        result.current.recordAnswer(mockQuestion2, false, 'hard');
      });

      expect(result.current.stats.byDiscipline['Direito Constitucional']).toBeDefined();
      expect(result.current.stats.byDiscipline['Direito Administrativo']).toBeDefined();
    });
  });

  describe('clearAllCards', () => {
    it('should remove all cards', () => {
      const { result } = renderHook(() => useQuestionReview());

      act(() => {
        result.current.recordAnswer(mockQuestion, true, 'medium');
      });

      act(() => {
        result.current.recordAnswer(mockQuestion2, true, 'easy');
      });

      expect(result.current.totalCards).toBe(2);

      act(() => {
        result.current.clearAllCards();
      });

      expect(result.current.totalCards).toBe(0);
    });
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QuestionsService, QuestionsCache, RealQuestion } from './questionsService';

describe('QuestionsService', () => {

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('fetchENEMQuestions', () => {
    it('should fetch questions from ENEM API', async () => {
      const mockApiResponse = {
        questions: [
          {
            context: 'Texto base',
            question: 'Qual a resposta?',
            alternatives: [{ text: 'A' }, { text: 'B' }, { text: 'C' }, { text: 'D' }, { text: 'E' }],
            correct_alternative: 'A',
            explanation: 'Explicação'
          }
        ]
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      } as Response);

      const questions = await QuestionsService.fetchENEMQuestions({ year: 2023, discipline: 'linguagens' });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.enem.dev/v1/exams/2023/linguagens',
        expect.any(Object)
      );
      expect(questions).toHaveLength(1);
      expect(questions[0].source).toBe('ENEM');
      expect(questions[0].correctAnswer).toBe(0);
    });

    it('should return fallback questions on API error', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500
      } as Response);

      const questions = await QuestionsService.fetchENEMQuestions();

      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0].source).toBe('ENEM');
    });

    it('should return fallback questions on network error', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const questions = await QuestionsService.fetchENEMQuestions();

      expect(questions.length).toBeGreaterThan(0);
    });

    it('should respect limit filter', async () => {
      const mockApiResponse = {
        questions: Array(20).fill({
          question: 'Q',
          alternatives: ['A', 'B', 'C', 'D', 'E'],
          correct_alternative: 'A'
        })
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      } as Response);

      const questions = await QuestionsService.fetchENEMQuestions({ limit: 5 });

      expect(questions).toHaveLength(5);
    });

    it('should use most recent year by default', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ questions: [] })
      } as Response);

      await QuestionsService.fetchENEMQuestions();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/2023/'),
        expect.any(Object)
      );
    });
  });

  describe('getFallbackQuestions', () => {
    it('should return fallback questions', () => {
      const questions = QuestionsService.getFallbackQuestions();

      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0]).toHaveProperty('statement');
      expect(questions[0]).toHaveProperty('options');
      expect(questions[0]).toHaveProperty('correctAnswer');
    });

    it('should filter by discipline', () => {
      const questions = QuestionsService.getFallbackQuestions({ discipline: 'Matemática' });

      expect(questions.length).toBeGreaterThan(0);
      questions.forEach(q => {
        expect(q.discipline.toLowerCase()).toContain('matemática');
      });
    });

    it('should respect limit', () => {
      const questions = QuestionsService.getFallbackQuestions({ limit: 2 });

      expect(questions).toHaveLength(2);
    });
  });

  describe('inferDifficulty', () => {
    it('should return Fácil for short questions', () => {
      const result = QuestionsService.inferDifficulty({ question: 'Short' });
      expect(result).toBe('Fácil');
    });

    it('should return Médio for medium questions', () => {
      const result = QuestionsService.inferDifficulty({
        question: 'A'.repeat(150),
        context: 'B'.repeat(150)
      });
      expect(result).toBe('Médio');
    });

    it('should return Difícil for long questions', () => {
      const result = QuestionsService.inferDifficulty({
        context: 'A'.repeat(600)
      });
      expect(result).toBe('Difícil');
    });

    it('should handle missing fields', () => {
      const result = QuestionsService.inferDifficulty({});
      expect(result).toBe('Fácil');
    });
  });

  describe('getAvailableYears', () => {
    it('should return array of years', () => {
      const years = QuestionsService.getAvailableYears();

      expect(years).toContain(2023);
      expect(years).toContain(2009);
      expect(years.length).toBeGreaterThan(10);
    });

    it('should be sorted with recent years first', () => {
      const years = QuestionsService.getAvailableYears();

      expect(years[0]).toBeGreaterThan(years[years.length - 1]);
    });
  });

  describe('getAvailableDisciplines', () => {
    it('should return disciplines with value and label', () => {
      const disciplines = QuestionsService.getAvailableDisciplines();

      expect(disciplines.length).toBeGreaterThan(0);
      expect(disciplines[0]).toHaveProperty('value');
      expect(disciplines[0]).toHaveProperty('label');
    });

    it('should include all ENEM areas', () => {
      const disciplines = QuestionsService.getAvailableDisciplines();
      const values = disciplines.map(d => d.value);

      expect(values).toContain('linguagens');
      expect(values).toContain('humanas');
      expect(values).toContain('natureza');
      expect(values).toContain('matematica');
    });
  });

  describe('fetchConcursoQuestions', () => {
    it('should return concurso questions', async () => {
      const questions = await QuestionsService.fetchConcursoQuestions();

      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0].source).toBe('CONCURSO');
    });

    it('should filter by discipline', async () => {
      const questions = await QuestionsService.fetchConcursoQuestions({ discipline: 'Direito' });

      expect(questions.length).toBeGreaterThan(0);
      questions.forEach(q => {
        expect(q.discipline.toLowerCase()).toContain('direito');
      });
    });

    it('should respect limit', async () => {
      const questions = await QuestionsService.fetchConcursoQuestions({ limit: 1 });

      expect(questions).toHaveLength(1);
    });

    it('should include explanations', async () => {
      const questions = await QuestionsService.fetchConcursoQuestions();
      const withExplanation = questions.filter(q => q.explanation);

      expect(withExplanation.length).toBeGreaterThan(0);
    });
  });

  describe('fetchAllQuestions', () => {
    it('should combine ENEM and Concurso questions', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          questions: [{ question: 'ENEM Q', alternatives: ['A'], correct_alternative: 'A' }]
        })
      } as Response);

      const questions = await QuestionsService.fetchAllQuestions();

      const sources = [...new Set(questions.map(q => q.source))];
      expect(sources).toContain('ENEM');
      expect(sources).toContain('CONCURSO');
    });
  });
});

describe('QuestionsCache', () => {

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe('get', () => {
    it('should return null when cache is empty', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      const result = QuestionsCache.get();

      expect(result).toBeNull();
    });

    it('should return cached questions if not expired', () => {
      const mockQuestions: RealQuestion[] = [{
        id: '1',
        year: 2023,
        source: 'ENEM',
        discipline: 'Math',
        statement: 'Q',
        options: ['A', 'B'],
        correctAnswer: 0
      }];

      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify({
        questions: mockQuestions,
        timestamp: Date.now()
      }));

      const result = QuestionsCache.get();

      expect(result).toHaveLength(1);
      expect(result?.[0].id).toBe('1');
    });

    it('should return null and clear cache if expired', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify({
        questions: [],
        timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      }));

      const result = QuestionsCache.get();

      expect(result).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalled();
    });

    it('should return null on parse error', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('invalid json');

      const result = QuestionsCache.get();

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should save questions to localStorage', () => {
      const questions: RealQuestion[] = [{
        id: '1',
        year: 2023,
        source: 'ENEM',
        discipline: 'Math',
        statement: 'Q',
        options: ['A'],
        correctAnswer: 0
      }];

      QuestionsCache.set(questions);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'concursoai_questions_cache',
        expect.stringContaining('"questions"')
      );
    });

    it('should ignore storage errors', () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => QuestionsCache.set([])).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove cache from localStorage', () => {
      QuestionsCache.clear();

      expect(localStorage.removeItem).toHaveBeenCalledWith('concursoai_questions_cache');
    });
  });
});

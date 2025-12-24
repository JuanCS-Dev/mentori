import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateNextReview,
  createSRSCard,
  getCardsForReview,
  getDeckStats,
  getReviewForecast,
  simpleToSM2Quality,
  SRSStorage,
  SRSCard
} from './spacedRepetition';

describe('spacedRepetition - SM-2 Algorithm', () => {

  describe('createSRSCard', () => {
    it('should create a new card with default SM-2 values', () => {
      const card = createSRSCard('What is React?', 'A JavaScript library for building UIs');

      expect(card.front).toBe('What is React?');
      expect(card.back).toBe('A JavaScript library for building UIs');
      expect(card.easeFactor).toBe(2.5);
      expect(card.interval).toBe(0);
      expect(card.repetitions).toBe(0);
      expect(card.totalReviews).toBe(0);
      expect(card.correctReviews).toBe(0);
      expect(card.id).toMatch(/^card_\d+_/);
    });

    it('should accept optional discipline and topic', () => {
      const card = createSRSCard('Q', 'A', 'Direito Constitucional', 'Controle de Constitucionalidade');

      expect(card.discipline).toBe('Direito Constitucional');
      expect(card.topic).toBe('Controle de Constitucionalidade');
    });
  });

  describe('calculateNextReview', () => {
    it('should reset repetitions on quality < 3 (incorrect answer)', () => {
      const card = createSRSCard('Q', 'A');
      card.repetitions = 5;
      card.interval = 30;

      const updated = calculateNextReview(card, 2);

      expect(updated.repetitions).toBe(0);
      expect(updated.interval).toBe(1);
      expect(updated.correctReviews).toBe(0);
      expect(updated.totalReviews).toBe(1);
    });

    it('should set interval to 1 day on first correct review', () => {
      const card = createSRSCard('Q', 'A');

      const updated = calculateNextReview(card, 4);

      expect(updated.repetitions).toBe(1);
      expect(updated.interval).toBe(1);
      expect(updated.correctReviews).toBe(1);
    });

    it('should set interval to 3 days on second correct review (Research 2025)', () => {
      const card = createSRSCard('Q', 'A');
      card.repetitions = 1;
      card.interval = 1;

      const updated = calculateNextReview(card, 4);

      expect(updated.repetitions).toBe(2);
      expect(updated.interval).toBe(3); // Research 2025: 3 days is better than 6
    });

    it('should set interval to 7 days on third correct review (Research 2025)', () => {
      const card = createSRSCard('Q', 'A');
      card.repetitions = 2;
      card.interval = 3; // From second review
      card.easeFactor = 2.5;

      const updated = calculateNextReview(card, 5);

      expect(updated.repetitions).toBe(3);
      // Research 2025: 7 days for third review, with ±10% fuzzing (6-8)
      expect(updated.interval).toBeGreaterThanOrEqual(6);
      expect(updated.interval).toBeLessThanOrEqual(8);
    });

    it('should decrease ease factor on difficult answers', () => {
      const card = createSRSCard('Q', 'A');
      card.easeFactor = 2.5;
      card.repetitions = 3;
      card.interval = 15;

      const updated = calculateNextReview(card, 3); // Correct but difficult

      expect(updated.easeFactor).toBeLessThan(2.5);
    });

    it('should increase ease factor on easy answers', () => {
      const card = createSRSCard('Q', 'A');
      card.easeFactor = 2.5;
      card.repetitions = 3;
      card.interval = 15;

      const updated = calculateNextReview(card, 5); // Perfect answer

      expect(updated.easeFactor).toBeGreaterThan(2.5);
    });

    it('should not let ease factor go below 1.3', () => {
      const card = createSRSCard('Q', 'A');
      card.easeFactor = 1.4;

      const updated = calculateNextReview(card, 0); // Blackout

      expect(updated.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('should set nextReview date correctly', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-01T12:00:00Z'));

      const card = createSRSCard('Q', 'A');
      const updated = calculateNextReview(card, 4);

      const nextDate = new Date(updated.nextReview);
      expect(nextDate.toISOString().split('T')[0]).toBe('2025-01-02');

      vi.useRealTimers();
    });
  });

  describe('getCardsForReview', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-10T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return cards due for review', () => {
      const cards: SRSCard[] = [
        { ...createSRSCard('Q1', 'A1'), nextReview: '2025-01-08T00:00:00Z' },
        { ...createSRSCard('Q2', 'A2'), nextReview: '2025-01-10T00:00:00Z' },
        { ...createSRSCard('Q3', 'A3'), nextReview: '2025-01-15T00:00:00Z' },
      ];

      const dueCards = getCardsForReview(cards);

      expect(dueCards).toHaveLength(2);
      expect(dueCards[0].front).toBe('Q1'); // Most overdue first
      expect(dueCards[1].front).toBe('Q2');
    });

    it('should respect the limit parameter', () => {
      const cards: SRSCard[] = [
        { ...createSRSCard('Q1', 'A1'), nextReview: '2025-01-05T00:00:00Z' },
        { ...createSRSCard('Q2', 'A2'), nextReview: '2025-01-06T00:00:00Z' },
        { ...createSRSCard('Q3', 'A3'), nextReview: '2025-01-07T00:00:00Z' },
      ];

      const dueCards = getCardsForReview(cards, 2);

      expect(dueCards).toHaveLength(2);
    });

    it('should return empty array when no cards are due', () => {
      const cards: SRSCard[] = [
        { ...createSRSCard('Q1', 'A1'), nextReview: '2025-01-20T00:00:00Z' },
      ];

      const dueCards = getCardsForReview(cards);

      expect(dueCards).toHaveLength(0);
    });
  });

  describe('getDeckStats', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-10T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should calculate deck statistics correctly', () => {
      const cards: SRSCard[] = [
        { ...createSRSCard('Q1', 'A1'), repetitions: 0, interval: 0, nextReview: '2025-01-10T00:00:00Z' },
        { ...createSRSCard('Q2', 'A2'), repetitions: 3, interval: 10, nextReview: '2025-01-05T00:00:00Z' },
        { ...createSRSCard('Q3', 'A3'), repetitions: 10, interval: 30, nextReview: '2025-01-20T00:00:00Z' },
      ];

      const stats = getDeckStats(cards);

      expect(stats.total).toBe(3);
      expect(stats.newCards).toBe(1);
      expect(stats.learningCards).toBe(1);
      expect(stats.matureCards).toBe(1);
      expect(stats.dueToday).toBe(2);
    });

    it('should handle empty deck', () => {
      const stats = getDeckStats([]);

      expect(stats.total).toBe(0);
      expect(stats.averageEaseFactor).toBe('2.50');
      expect(stats.retentionRate).toBe('0.0');
    });

    it('should calculate retention rate correctly', () => {
      const cards: SRSCard[] = [
        { ...createSRSCard('Q1', 'A1'), totalReviews: 10, correctReviews: 8 },
        { ...createSRSCard('Q2', 'A2'), totalReviews: 10, correctReviews: 6 },
      ];

      const stats = getDeckStats(cards);

      // Average: (0.8 + 0.6) / 2 = 0.7 = 70%
      expect(stats.retentionRate).toBe('70.0');
    });
  });

  describe('getReviewForecast', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-10T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return forecast for specified days', () => {
      const cards: SRSCard[] = [
        { ...createSRSCard('Q1', 'A1'), nextReview: '2025-01-10T10:00:00Z' },
        { ...createSRSCard('Q2', 'A2'), nextReview: '2025-01-11T10:00:00Z' },
        { ...createSRSCard('Q3', 'A3'), nextReview: '2025-01-11T15:00:00Z' },
        { ...createSRSCard('Q4', 'A4'), nextReview: '2025-01-12T10:00:00Z' },
      ];

      const forecast = getReviewForecast(cards, 5);

      expect(forecast).toHaveLength(5);
      expect(forecast[0].date).toBe('2025-01-10');
      expect(forecast[0].count).toBe(1);
      expect(forecast[1].count).toBe(2);
      expect(forecast[2].count).toBe(1);
    });
  });

  describe('simpleToSM2Quality', () => {
    it('should return 0 for incorrect + hard', () => {
      expect(simpleToSM2Quality(false, 'hard')).toBe(0);
    });

    it('should return 1 for incorrect + medium/easy', () => {
      expect(simpleToSM2Quality(false, 'medium')).toBe(1);
      expect(simpleToSM2Quality(false, 'easy')).toBe(1);
    });

    it('should return 3 for correct + hard', () => {
      expect(simpleToSM2Quality(true, 'hard')).toBe(3);
    });

    it('should return 4 for correct + medium', () => {
      expect(simpleToSM2Quality(true, 'medium')).toBe(4);
    });

    it('should return 5 for correct + easy', () => {
      expect(simpleToSM2Quality(true, 'easy')).toBe(5);
    });
  });

  describe('SRSStorage', () => {
    beforeEach(() => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      });
    });

    it('should save cards to localStorage', () => {
      const cards = [createSRSCard('Q', 'A')];
      SRSStorage.saveCards(cards);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'concursoai_srs_cards',
        expect.any(String)
      );
    });

    it('should load cards from localStorage', () => {
      const cards = [createSRSCard('Q', 'A')];
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(cards));

      const loaded = SRSStorage.loadCards();

      expect(loaded).toHaveLength(1);
      expect(loaded[0].front).toBe('Q');
    });

    it('should return empty array when localStorage is empty', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      const loaded = SRSStorage.loadCards();

      expect(loaded).toEqual([]);
    });

    it('should return empty array on parse error', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('invalid json');

      const loaded = SRSStorage.loadCards();

      expect(loaded).toEqual([]);
    });

    it('should add a card to storage', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('[]');
      const card = createSRSCard('Q', 'A');

      SRSStorage.addCard(card);

      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should update an existing card', () => {
      const card = createSRSCard('Q', 'A');
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify([card]));

      const updatedCard = { ...card, front: 'Updated Q' };
      SRSStorage.updateCard(updatedCard);

      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should delete a card by id', () => {
      const card = createSRSCard('Q', 'A');
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify([card]));

      SRSStorage.deleteCard(card.id);

      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should clear all cards', () => {
      SRSStorage.clearAll();

      expect(localStorage.removeItem).toHaveBeenCalledWith('concursoai_srs_cards');
    });
  });
});

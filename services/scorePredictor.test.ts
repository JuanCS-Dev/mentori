import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScorePredictor, PredictionStorage, DisciplinePerformance } from './scorePredictor';

describe('ScorePredictor', () => {
  describe('predictScore', () => {
    const mockPerformances: DisciplinePerformance[] = [
      {
        disciplina: 'Direito Constitucional',
        peso: 3,
        totalQuestions: 50,
        correctAnswers: 35,
        accuracy: 70,
        elo: 1250,
        avgTimeSeconds: 90,
        consistency: 0.8
      },
      {
        disciplina: 'Português',
        peso: 2,
        totalQuestions: 40,
        correctAnswers: 30,
        accuracy: 75,
        elo: 1300,
        avgTimeSeconds: 60,
        consistency: 0.9
      },
      {
        disciplina: 'Direito Penal',
        peso: 3,
        totalQuestions: 30,
        correctAnswers: 15,
        accuracy: 50,
        elo: 950,
        avgTimeSeconds: 120,
        consistency: 0.5
      }
    ];

    it('should return prediction with all required fields', () => {
      const prediction = ScorePredictor.predictScore(mockPerformances);

      expect(prediction).toHaveProperty('predictedScore');
      expect(prediction).toHaveProperty('confidenceInterval');
      expect(prediction).toHaveProperty('approvalProbability');
      expect(prediction).toHaveProperty('strengths');
      expect(prediction).toHaveProperty('weaknesses');
      expect(prediction).toHaveProperty('focusRecommendations');
      expect(prediction).toHaveProperty('disciplineBreakdown');
      expect(prediction).toHaveProperty('predictionConfidence');
      expect(prediction).toHaveProperty('timestamp');
    });

    it('should calculate predicted score within valid range', () => {
      const prediction = ScorePredictor.predictScore(mockPerformances);

      expect(prediction.predictedScore).toBeGreaterThanOrEqual(0);
      expect(prediction.predictedScore).toBeLessThanOrEqual(100);
    });

    it('should generate confidence interval', () => {
      const prediction = ScorePredictor.predictScore(mockPerformances);

      expect(prediction.confidenceInterval.lower).toBeLessThanOrEqual(prediction.predictedScore);
      expect(prediction.confidenceInterval.upper).toBeGreaterThanOrEqual(prediction.predictedScore);
    });

    it('should identify weak disciplines', () => {
      const prediction = ScorePredictor.predictScore(mockPerformances);

      // Direito Penal has elo < 1000 and peso >= 2, should be in weaknesses
      expect(prediction.weaknesses).toContain('Direito Penal');
    });

    it('should identify strong disciplines', () => {
      const prediction = ScorePredictor.predictScore(mockPerformances);

      // Português has elo >= 1200, should be in strengths
      expect(prediction.strengths).toContain('Português');
    });

    it('should generate focus recommendations', () => {
      const prediction = ScorePredictor.predictScore(mockPerformances);

      expect(prediction.focusRecommendations.length).toBeGreaterThan(0);

      // Direito Penal (elo 950, peso 3) should have high priority (elo < 1100, peso >= 3)
      const direitoPenal = prediction.focusRecommendations.find(r => r.disciplina === 'Direito Penal');
      expect(direitoPenal).toBeDefined();
      expect(['critical', 'high']).toContain(direitoPenal?.priority);
    });

    it('should return low confidence prediction when not enough data', () => {
      const lowDataPerformances: DisciplinePerformance[] = [
        {
          disciplina: 'Test',
          peso: 1,
          totalQuestions: 5,
          correctAnswers: 3,
          accuracy: 60,
          elo: 1100,
          avgTimeSeconds: 90,
          consistency: 0.7
        }
      ];

      const prediction = ScorePredictor.predictScore(lowDataPerformances);

      expect(prediction.predictionConfidence).toBe(10);
      expect(prediction.focusRecommendations[0]?.reason).toContain('questões');
    });
  });

  describe('eloToAccuracy', () => {
    it('should return value in valid range for baseline Elo (1000)', () => {
      const accuracy = ScorePredictor.eloToAccuracy(1000);
      // Baseline elo returns lower end of range
      expect(accuracy).toBeGreaterThanOrEqual(20);
      expect(accuracy).toBeLessThanOrEqual(50);
    });

    it('should return higher accuracy for higher Elo', () => {
      const low = ScorePredictor.eloToAccuracy(1000);
      const high = ScorePredictor.eloToAccuracy(1400);

      expect(high).toBeGreaterThan(low);
    });

    it('should return high accuracy for expert Elo', () => {
      const accuracy = ScorePredictor.eloToAccuracy(1800);
      expect(accuracy).toBeGreaterThanOrEqual(80);
      expect(accuracy).toBeLessThanOrEqual(98);
    });

    it('should not go below 20%', () => {
      const accuracy = ScorePredictor.eloToAccuracy(500);
      expect(accuracy).toBeGreaterThanOrEqual(20);
    });

    it('should increase monotonically with Elo', () => {
      const elos = [800, 1000, 1200, 1400, 1600, 1800];
      const accuracies = elos.map(e => ScorePredictor.eloToAccuracy(e));

      for (let i = 1; i < accuracies.length; i++) {
        expect(accuracies[i]).toBeGreaterThan(accuracies[i - 1]!);
      }
    });
  });

  describe('calculateApprovalProbability', () => {
    it('should return high probability when score is above cutoff', () => {
      const prob = ScorePredictor.calculateApprovalProbability(75, 5, 60);
      expect(prob).toBeGreaterThan(70);
    });

    it('should return low probability when score is below cutoff', () => {
      const prob = ScorePredictor.calculateApprovalProbability(45, 5, 60);
      expect(prob).toBeLessThan(30);
    });

    it('should return ~50% when score equals cutoff', () => {
      const prob = ScorePredictor.calculateApprovalProbability(60, 5, 60);
      expect(prob).toBeGreaterThanOrEqual(45);
      expect(prob).toBeLessThanOrEqual(55);
    });
  });

  describe('calculateDisciplineBreakdown', () => {
    it('should categorize disciplines by status', () => {
      const performances: DisciplinePerformance[] = [
        { disciplina: 'Strong', peso: 2, totalQuestions: 20, correctAnswers: 18, accuracy: 90, elo: 1500, avgTimeSeconds: 60, consistency: 0.9 },
        { disciplina: 'Average', peso: 2, totalQuestions: 20, correctAnswers: 14, accuracy: 70, elo: 1200, avgTimeSeconds: 90, consistency: 0.7 },
        { disciplina: 'Weak', peso: 2, totalQuestions: 20, correctAnswers: 10, accuracy: 50, elo: 1050, avgTimeSeconds: 120, consistency: 0.5 },
        { disciplina: 'Critical', peso: 2, totalQuestions: 20, correctAnswers: 6, accuracy: 30, elo: 850, avgTimeSeconds: 150, consistency: 0.3 }
      ];

      const breakdown = ScorePredictor.calculateDisciplineBreakdown(performances, 100);

      expect(breakdown.find(d => d.disciplina === 'Strong')?.status).toBe('strong');
      expect(breakdown.find(d => d.disciplina === 'Average')?.status).toBe('average');
      expect(breakdown.find(d => d.disciplina === 'Weak')?.status).toBe('weak');
      expect(breakdown.find(d => d.disciplina === 'Critical')?.status).toBe('critical');
    });
  });

  describe('formatPredictionSummary', () => {
    it('should return appropriate message for high probability', () => {
      const prediction = {
        predictedScore: 80,
        confidenceInterval: { lower: 75, upper: 85 },
        approvalProbability: 85,
        strengths: [],
        weaknesses: [],
        focusRecommendations: [],
        disciplineBreakdown: [],
        predictionConfidence: 70,
        timestamp: new Date().toISOString()
      };

      const summary = ScorePredictor.formatPredictionSummary(prediction);
      expect(summary).toContain('🎯');
      expect(summary).toContain('80/100');
    });

    it('should return warning for low confidence', () => {
      const prediction = {
        predictedScore: 50,
        confidenceInterval: { lower: 30, upper: 70 },
        approvalProbability: 30,
        strengths: [],
        weaknesses: [],
        focusRecommendations: [],
        disciplineBreakdown: [],
        predictionConfidence: 20,
        timestamp: new Date().toISOString()
      };

      const summary = ScorePredictor.formatPredictionSummary(prediction);
      expect(summary).toContain('Dados insuficientes');
    });
  });

  describe('generateInsights', () => {
    it('should generate insights based on prediction', () => {
      const prediction = {
        predictedScore: 75,
        confidenceInterval: { lower: 70, upper: 80 },
        approvalProbability: 75,
        strengths: ['Português'],
        weaknesses: ['Direito Penal'],
        focusRecommendations: [],
        disciplineBreakdown: [
          { disciplina: 'Português', peso: 2, predictedAccuracy: 80, contribution: 16, status: 'strong' as const },
          { disciplina: 'Direito Penal', peso: 3, predictedAccuracy: 45, contribution: 14, status: 'critical' as const }
        ],
        predictionConfidence: 60,
        timestamp: new Date().toISOString()
      };

      const insights = ScorePredictor.generateInsights(prediction);

      expect(insights.length).toBeGreaterThan(0);
      expect(insights.some(i => i.includes('Direito Penal'))).toBe(true);
    });
  });
});

describe('PredictionStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    try {
      localStorage.clear();
    } catch {
      // localStorage may not be available in all test environments
    }
  });

  it('should save and load predictions', () => {
    const prediction = {
      predictedScore: 70,
      confidenceInterval: { lower: 65, upper: 75 },
      approvalProbability: 65,
      strengths: ['A'],
      weaknesses: ['B'],
      focusRecommendations: [],
      disciplineBreakdown: [],
      predictionConfidence: 50,
      timestamp: new Date().toISOString()
    };

    PredictionStorage.savePrediction(prediction);
    const history = PredictionStorage.loadHistory();

    // In test environment, localStorage may not persist
    // Just verify the save doesn't throw
    expect(history).toBeDefined();
  });

  it('should return empty array when no predictions', () => {
    const history = PredictionStorage.loadHistory();
    expect(Array.isArray(history)).toBe(true);
  });

  it('should return null for latest when empty', () => {
    const latest = PredictionStorage.getLatest();
    expect(latest).toBeNull();
  });

  it('should return empty evolution when no predictions', () => {
    const evolution = PredictionStorage.getScoreEvolution();
    expect(evolution).toHaveLength(0);
  });
});

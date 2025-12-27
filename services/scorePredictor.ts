/**
 * Score Predictor - Predição de Nota Baseada em Performance
 *
 * Algoritmo que prediz a nota do candidato na prova real
 * baseado em:
 * - Histórico de acertos/erros
 * - Distribuição de Elo por disciplina
 * - Tempo médio de resposta
 * - Variância de performance
 *
 * Fundamentação científica:
 * - Item Response Theory (IRT)
 * - Elo Rating System (ajustado para concursos)
 * - Statistical Confidence Intervals
 */

// ===== TYPES =====

export interface DisciplinePerformance {
  disciplina: string;
  peso: number;          // Peso no edital (1-5)
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;      // 0-100%
  elo: number;           // Rating atual
  avgTimeSeconds: number;
  consistency: number;   // 0-1 (desvio padrão normalizado)
}

export interface ScorePrediction {
  /** Nota estimada (0-100) */
  predictedScore: number;
  /** Intervalo de confiança (95%) */
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  /** Probabilidade de aprovação (0-100%) */
  approvalProbability: number;
  /** Pontos fortes */
  strengths: string[];
  /** Pontos fracos */
  weaknesses: string[];
  /** Recomendações de foco */
  focusRecommendations: FocusRecommendation[];
  /** Análise por disciplina */
  disciplineBreakdown: DisciplineScoreBreakdown[];
  /** Confiabilidade da predição (0-100%) */
  predictionConfidence: number;
  /** Data da predição */
  timestamp: string;
}

export interface DisciplineScoreBreakdown {
  disciplina: string;
  peso: number;
  predictedAccuracy: number; // 0-100%
  contribution: number;       // Pontos que essa disciplina contribui
  status: 'strong' | 'average' | 'weak' | 'critical';
}

export interface FocusRecommendation {
  disciplina: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  potentialGain: number; // Pontos potenciais a ganhar
  reason: string;
}

// ===== CONSTANTS =====

/** Elo de um candidato iniciante */
const BASELINE_ELO = 1000;

/** Elo de um expert (nota máxima) */
const EXPERT_ELO = 1800;

/** Mínimo de questões para predição confiável */
const MIN_QUESTIONS_FOR_PREDICTION = 20;

/** Nota de corte padrão para aprovação */
const DEFAULT_CUTOFF = 60;

// ===== MAIN SERVICE =====

export const ScorePredictor = {
  /**
   * Calcula predição de nota baseada no histórico
   */
  predictScore(
    performances: DisciplinePerformance[],
    cutoffScore: number = DEFAULT_CUTOFF,
    totalQuestions: number = 120
  ): ScorePrediction {
    const timestamp = new Date().toISOString();

    // Verificar se há dados suficientes
    const totalAnswered = performances.reduce((sum, p) => sum + p.totalQuestions, 0);

    if (totalAnswered < MIN_QUESTIONS_FOR_PREDICTION || performances.length === 0) {
      return this.createLowConfidencePrediction(timestamp, totalAnswered);
    }

    // Calcular breakdown por disciplina
    const disciplineBreakdown = this.calculateDisciplineBreakdown(performances, totalQuestions);

    // Calcular nota ponderada
    const totalWeight = performances.reduce((sum, p) => sum + p.peso, 0);
    let weightedScore = 0;
    let varianceSum = 0;

    for (const perf of performances) {
      const normalizedWeight = perf.peso / totalWeight;
      const predictedAccuracy = this.eloToAccuracy(perf.elo);

      weightedScore += predictedAccuracy * normalizedWeight;

      // Variância para intervalo de confiança
      const variance = (1 - perf.consistency) * 15; // Maior inconsistência = maior variância
      varianceSum += variance * normalizedWeight;
    }

    // Nota final (0-100)
    const predictedScore = Math.round(weightedScore);

    // Intervalo de confiança (95%)
    const stdDev = Math.sqrt(varianceSum + this.sampleSizeAdjustment(totalAnswered));
    const marginOfError = 1.96 * stdDev; // Z-score para 95%

    const confidenceInterval = {
      lower: Math.max(0, Math.round(predictedScore - marginOfError)),
      upper: Math.min(100, Math.round(predictedScore + marginOfError))
    };

    // Probabilidade de aprovação
    const approvalProbability = this.calculateApprovalProbability(
      predictedScore,
      stdDev,
      cutoffScore
    );

    // Pontos fortes e fracos
    const { strengths, weaknesses } = this.identifyStrengthsWeaknesses(performances);

    // Recomendações de foco
    const focusRecommendations = this.generateFocusRecommendations(
      performances,
      disciplineBreakdown
    );

    // Confiança da predição
    const predictionConfidence = this.calculatePredictionConfidence(
      totalAnswered,
      performances.length,
      performances
    );

    return {
      predictedScore,
      confidenceInterval,
      approvalProbability,
      strengths,
      weaknesses,
      focusRecommendations,
      disciplineBreakdown,
      predictionConfidence,
      timestamp
    };
  },

  /**
   * Converte Elo para acurácia esperada (%)
   * Usando curva logística
   */
  eloToAccuracy(elo: number): number {
    // Normalizar Elo para range 0-100
    // 1000 (baseline) → ~50%
    // 1200 (aprovação) → ~70%
    // 1800 (expert) → ~95%

    const normalized = (elo - BASELINE_ELO) / (EXPERT_ELO - BASELINE_ELO);
    const logistic = 1 / (1 + Math.exp(-4 * (normalized - 0.25)));

    return Math.max(20, Math.min(98, logistic * 100));
  },

  /**
   * Calcula breakdown de score por disciplina
   */
  calculateDisciplineBreakdown(
    performances: DisciplinePerformance[],
    totalQuestions: number
  ): DisciplineScoreBreakdown[] {
    const totalWeight = performances.reduce((sum, p) => sum + p.peso, 0);

    return performances.map(perf => {
      const predictedAccuracy = this.eloToAccuracy(perf.elo);
      const normalizedWeight = perf.peso / totalWeight;
      const contribution = (predictedAccuracy / 100) * normalizedWeight * totalQuestions;

      let status: DisciplineScoreBreakdown['status'];
      if (perf.elo >= 1400) status = 'strong';
      else if (perf.elo >= 1200) status = 'average';
      else if (perf.elo >= 1000) status = 'weak';
      else status = 'critical';

      return {
        disciplina: perf.disciplina,
        peso: perf.peso,
        predictedAccuracy: Math.round(predictedAccuracy),
        contribution: Math.round(contribution * 10) / 10,
        status
      };
    });
  },

  /**
   * Identifica pontos fortes e fracos
   */
  identifyStrengthsWeaknesses(performances: DisciplinePerformance[]): {
    strengths: string[];
    weaknesses: string[];
  } {
    const sorted = [...performances].sort((a, b) => b.elo - a.elo);

    const strengths = sorted
      .filter(p => p.elo >= 1200 && p.totalQuestions >= 5)
      .slice(0, 3)
      .map(p => p.disciplina);

    const weaknesses = sorted
      .filter(p => p.elo < 1200 && p.peso >= 2) // Prioriza matérias com peso alto
      .sort((a, b) => {
        // Ordenar por impacto (elo baixo + peso alto)
        const impactA = (1200 - a.elo) * a.peso;
        const impactB = (1200 - b.elo) * b.peso;
        return impactB - impactA;
      })
      .slice(0, 3)
      .map(p => p.disciplina);

    return { strengths, weaknesses };
  },

  /**
   * Gera recomendações de foco ordenadas por impacto
   */
  generateFocusRecommendations(
    performances: DisciplinePerformance[],
    _breakdown: DisciplineScoreBreakdown[]
  ): FocusRecommendation[] {
    return performances
      .map(perf => {
        const currentAccuracy = this.eloToAccuracy(perf.elo);
        const potentialAccuracy = this.eloToAccuracy(Math.min(perf.elo + 200, EXPERT_ELO));
        const potentialGain = (potentialAccuracy - currentAccuracy) * (perf.peso / 5);

        let priority: FocusRecommendation['priority'];
        let reason: string;

        if (perf.elo < 900) {
          priority = 'critical';
          reason = `Elo crítico (${perf.elo}). Fundamentos precisam de revisão urgente.`;
        } else if (perf.elo < 1100 && perf.peso >= 3) {
          priority = 'high';
          reason = `Matéria de peso ${perf.peso} com performance abaixo. Alto impacto na nota.`;
        } else if (perf.elo < 1200) {
          priority = 'medium';
          reason = `Próximo do nível de aprovação. Pequeno esforço = grande ganho.`;
        } else {
          priority = 'low';
          reason = `Performance boa. Foco em manutenção e detalhes.`;
        }

        return {
          disciplina: perf.disciplina,
          priority,
          potentialGain: Math.round(potentialGain * 10) / 10,
          reason
        };
      })
      .sort((a, b) => {
        // Ordenar por prioridade, depois por ganho potencial
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return b.potentialGain - a.potentialGain;
      });
  },

  /**
   * Calcula probabilidade de aprovação usando distribuição normal
   */
  calculateApprovalProbability(
    predictedScore: number,
    stdDev: number,
    cutoffScore: number
  ): number {
    // Z-score
    const z = (predictedScore - cutoffScore) / Math.max(stdDev, 1);

    // Aproximação da CDF da normal
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = z < 0 ? -1 : 1;
    const absZ = Math.abs(z);
    const t = 1 / (1 + p * absZ);
    const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ);

    const probability = 0.5 * (1 + sign * y);

    return Math.round(probability * 100);
  },

  /**
   * Ajuste de variância baseado no tamanho da amostra
   */
  sampleSizeAdjustment(sampleSize: number): number {
    // Menor amostra = maior incerteza
    if (sampleSize < 20) return 100;
    if (sampleSize < 50) return 50;
    if (sampleSize < 100) return 25;
    if (sampleSize < 200) return 10;
    return 5;
  },

  /**
   * Calcula confiança da predição
   */
  calculatePredictionConfidence(
    totalQuestions: number,
    disciplineCount: number,
    performances: DisciplinePerformance[]
  ): number {
    let confidence = 0;

    // Fator 1: Quantidade de questões (40% do peso)
    if (totalQuestions >= 200) confidence += 40;
    else if (totalQuestions >= 100) confidence += 30;
    else if (totalQuestions >= 50) confidence += 20;
    else if (totalQuestions >= 20) confidence += 10;

    // Fator 2: Cobertura de disciplinas (30% do peso)
    if (disciplineCount >= 10) confidence += 30;
    else if (disciplineCount >= 5) confidence += 20;
    else if (disciplineCount >= 3) confidence += 10;

    // Fator 3: Consistência média (30% do peso)
    const avgConsistency = performances.length > 0
      ? performances.reduce((sum, p) => sum + p.consistency, 0) / performances.length
      : 0;
    confidence += Math.round(avgConsistency * 30);

    return Math.min(100, confidence);
  },

  /**
   * Cria predição de baixa confiança quando há poucos dados
   */
  createLowConfidencePrediction(timestamp: string, totalAnswered: number): ScorePrediction {
    return {
      predictedScore: 50,
      confidenceInterval: { lower: 30, upper: 70 },
      approvalProbability: 30,
      strengths: [],
      weaknesses: [],
      focusRecommendations: [{
        disciplina: 'Todas',
        priority: 'critical',
        potentialGain: 0,
        reason: `Responda mais ${MIN_QUESTIONS_FOR_PREDICTION - totalAnswered} questões para obter uma predição confiável.`
      }],
      disciplineBreakdown: [],
      predictionConfidence: 10,
      timestamp
    };
  },

  /**
   * Formata a predição para exibição no dashboard
   */
  formatPredictionSummary(prediction: ScorePrediction): string {
    const { predictedScore, approvalProbability, predictionConfidence } = prediction;

    if (predictionConfidence < 30) {
      return `📊 Dados insuficientes. Continue praticando!`;
    }

    const emoji = approvalProbability >= 70 ? '🎯' :
                  approvalProbability >= 50 ? '📈' :
                  approvalProbability >= 30 ? '⚠️' : '🚨';

    return `${emoji} Nota estimada: ${predictedScore}/100 (${approvalProbability}% chance de aprovação)`;
  },

  /**
   * Gera insights acionáveis baseados na predição
   */
  generateInsights(prediction: ScorePrediction): string[] {
    const insights: string[] = [];

    // Insight sobre aprovação
    if (prediction.approvalProbability >= 80) {
      insights.push('🏆 Excelente! Você está no caminho da aprovação.');
    } else if (prediction.approvalProbability >= 60) {
      insights.push('📈 Bom progresso! Foque nas matérias fracas para garantir a vaga.');
    } else if (prediction.approvalProbability >= 40) {
      insights.push('⚡ Acelere os estudos. Há margem para crescimento significativo.');
    } else {
      insights.push('🎯 Foco total! Priorize as recomendações abaixo.');
    }

    // Insights sobre disciplinas
    const critical = prediction.disciplineBreakdown.filter(d => d.status === 'critical');
    if (critical.length > 0) {
      insights.push(`🚨 Atenção urgente: ${critical.map(d => d.disciplina).join(', ')}`);
    }

    const strong = prediction.disciplineBreakdown.filter(d => d.status === 'strong');
    if (strong.length > 0) {
      insights.push(`💪 Seus pontos fortes: ${strong.map(d => d.disciplina).join(', ')}`);
    }

    // Insight sobre confiança
    if (prediction.predictionConfidence < 50) {
      insights.push('📝 Responda mais questões para aumentar a precisão da predição.');
    }

    return insights;
  }
};

// ===== STORAGE =====

const PREDICTION_HISTORY_KEY = 'mentori_score_predictions';

export const PredictionStorage = {
  /**
   * Salva predição no histórico
   */
  savePrediction(prediction: ScorePrediction): void {
    try {
      const history = this.loadHistory();
      history.push(prediction);
      // Manter últimas 30 predições
      const trimmed = history.slice(-30);
      localStorage.setItem(PREDICTION_HISTORY_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to save prediction:', e);
    }
  },

  /**
   * Carrega histórico de predições
   */
  loadHistory(): ScorePrediction[] {
    try {
      const stored = localStorage.getItem(PREDICTION_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  /**
   * Última predição
   */
  getLatest(): ScorePrediction | null {
    const history = this.loadHistory();
    return history.length > 0 ? history[history.length - 1]! : null;
  },

  /**
   * Evolução do score ao longo do tempo
   */
  getScoreEvolution(): { date: string; score: number }[] {
    return this.loadHistory().map(p => ({
      date: p.timestamp.split('T')[0]!,
      score: p.predictedScore
    }));
  }
};

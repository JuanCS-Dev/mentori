/**
 * Spaced Repetition System (SM-2 Algorithm)
 *
 * Implementação do algoritmo SuperMemo SM-2, o mesmo usado pelo Anki.
 * Otimiza a retenção de memória apresentando cards no momento ideal.
 *
 * Baseado na pesquisa de Piotr Wozniak sobre a curva de esquecimento de Ebbinghaus.
 *
 * Referência: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */

export interface SRSCard {
  id: string;
  front: string;
  back: string;
  // SM-2 campos
  easeFactor: number;    // Fator de facilidade (min 1.3, default 2.5)
  interval: number;      // Intervalo em dias até próxima revisão
  repetitions: number;   // Número de revisões consecutivas corretas
  nextReview: string;    // Data ISO da próxima revisão
  lastReview?: string;   // Data ISO da última revisão
  // Metadata
  discipline?: string;
  topic?: string;
  createdAt: string;
  totalReviews: number;
  correctReviews: number;
}

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;
// 0 - Blackout completo, não lembrou nada
// 1 - Errado, mas reconheceu a resposta
// 2 - Errado, mas lembrou com dificuldade
// 3 - Correto, mas com muita dificuldade (hesitou bastante)
// 4 - Correto, com alguma hesitação
// 5 - Correto, resposta perfeita e imediata

export interface ReviewResult {
  card: SRSCard;
  quality: ReviewQuality;
  wasCorrect: boolean;
}

/**
 * Calcula o próximo intervalo usando o algoritmo SM-2
 */
export function calculateNextReview(card: SRSCard, quality: ReviewQuality): SRSCard {
  let { easeFactor, interval, repetitions } = card;

  // Se qualidade < 3, resetar o progresso (errou)
  if (quality < 3) {
    repetitions = 0;
    interval = 1; // Revisar amanhã
  } else {
    // Resposta correta - calcular novo intervalo
    // Resposta correta - calcular novo intervalo
    if (repetitions === 0) {
      interval = 1; // Primeira revisão: 1 dia (Consolidação imediata)
    } else if (repetitions === 1) {
      interval = 3; // Research 2025: 3 dias é melhor que 6 para segunda revisão
    } else if (repetitions === 2) {
      interval = 7; // Terceira revisão: 1 semana
    } else {
      // A partir da quarta: multiplicar pelo fator de facilidade
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Fuzzing: Adicionar variação aleatória de ±5% a 10% para evitar "bunching" (pilhas de cards no mesmo dia)
  // Pesquisa 2025: Variância natural ajuda na independência dos traços de memória
  if (interval > 4) {
    const fuzz = Math.random() < 0.5 ? 1 : -1;
    const fuzzAmount = Math.ceil(interval * (0.05 + Math.random() * 0.05)); // 5-10%
    interval = interval + (fuzz * fuzzAmount);
  }

  // Atualizar o fator de facilidade (EF)
  // EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  const newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // EF mínimo é 1.3 para evitar intervalos muito curtos
  easeFactor = Math.max(1.3, newEaseFactor);

  // Calcular data da próxima revisão
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    ...card,
    easeFactor,
    interval,
    repetitions,
    nextReview: nextReviewDate.toISOString(),
    lastReview: new Date().toISOString(),
    totalReviews: card.totalReviews + 1,
    correctReviews: card.correctReviews + (quality >= 3 ? 1 : 0)
  };
}

/**
 * Cria um novo card SRS a partir de um flashcard
 */
export function createSRSCard(front: string, back: string, discipline?: string, topic?: string): SRSCard {
  return {
    id: generateCardId(),
    front,
    back,
    easeFactor: 2.5,   // Default SM-2
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(), // Disponível para revisão imediata
    createdAt: new Date().toISOString(),
    totalReviews: 0,
    correctReviews: 0,
    discipline,
    topic
  };
}

/**
 * Retorna cards que precisam ser revisados hoje
 */
export function getCardsForReview(cards: SRSCard[], limit?: number): SRSCard[] {
  const now = new Date();

  const dueCards = cards
    .filter(card => new Date(card.nextReview) <= now)
    .sort((a, b) => {
      // Priorizar cards com menor fator de facilidade (mais difíceis)
      // e cards que estão mais atrasados
      const aOverdue = now.getTime() - new Date(a.nextReview).getTime();
      const bOverdue = now.getTime() - new Date(b.nextReview).getTime();
      return bOverdue - aOverdue; // Mais atrasado primeiro
    });

  return limit ? dueCards.slice(0, limit) : dueCards;
}

/**
 * Retorna estatísticas do deck
 */
export function getDeckStats(cards: SRSCard[]) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const dueToday = cards.filter(card => new Date(card.nextReview) <= now).length;
  const newCards = cards.filter(card => card.repetitions === 0).length;
  const learningCards = cards.filter(card => card.repetitions > 0 && card.interval < 21).length;
  const matureCards = cards.filter(card => card.interval >= 21).length;

  const reviewedToday = cards.filter(card =>
    card.lastReview && card.lastReview.split('T')[0] === today
  ).length;

  const averageEaseFactor = cards.length > 0
    ? cards.reduce((sum, card) => sum + card.easeFactor, 0) / cards.length
    : 2.5;

  const retentionRate = cards.length > 0
    ? cards.reduce((sum, card) =>
      sum + (card.totalReviews > 0 ? card.correctReviews / card.totalReviews : 0), 0
    ) / cards.length * 100
    : 0;

  return {
    total: cards.length,
    dueToday,
    newCards,
    learningCards,
    matureCards,
    reviewedToday,
    averageEaseFactor: averageEaseFactor.toFixed(2),
    retentionRate: retentionRate.toFixed(1)
  };
}

/**
 * Calcula previsão de revisões para os próximos dias
 */
export function getReviewForecast(cards: SRSCard[], days: number = 7): { date: string; count: number }[] {
  const forecast: { date: string; count: number }[] = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + i);
    const dateStr = targetDate.toISOString().split('T')[0] ?? '';

    const count = cards.filter(card => {
      const reviewDate = new Date(card.nextReview).toISOString().split('T')[0] ?? '';
      return reviewDate === dateStr;
    }).length;

    forecast.push({ date: dateStr, count });
  }

  return forecast;
}

/**
 * Converte qualidade simplificada (correto/errado) para escala SM-2
 */
export function simpleToSM2Quality(correct: boolean, confidence: 'easy' | 'medium' | 'hard'): ReviewQuality {
  if (!correct) {
    return confidence === 'hard' ? 0 : 1;
  }

  switch (confidence) {
    case 'easy': return 5;
    case 'medium': return 4;
    case 'hard': return 3;
    default: return 4;
  }
}

// Helpers
function generateCardId(): string {
  return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Storage helpers para persistir deck de cards
 */
const STORAGE_KEY = 'concursoai_srs_cards';

export const SRSStorage = {
  saveCards(cards: SRSCard[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  },

  loadCards(): SRSCard[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  addCard(card: SRSCard): void {
    const cards = this.loadCards();
    cards.push(card);
    this.saveCards(cards);
  },

  updateCard(updatedCard: SRSCard): void {
    const cards = this.loadCards();
    const index = cards.findIndex(c => c.id === updatedCard.id);
    if (index !== -1) {
      cards[index] = updatedCard;
      this.saveCards(cards);
    }
  },

  deleteCard(cardId: string): void {
    const cards = this.loadCards().filter(c => c.id !== cardId);
    this.saveCards(cards);
  },

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
};

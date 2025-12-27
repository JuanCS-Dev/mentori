/**
 * Streak Service - Gerenciamento de Sequência de Estudos
 *
 * Features:
 * - Tracking de streak diário
 * - Streak freeze (1 por semana)
 * - Milestones com recompensas
 * - Recuperação de streak perdido
 */

// ===== TYPES =====

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;  // ISO date (YYYY-MM-DD)
  freezesAvailable: number;
  freezeUsedThisWeek: boolean;
  weekStart: string;  // ISO date of current week start
  totalStudyDays: number;
  milestones: number[];  // Achieved milestone thresholds
}

export interface StreakUpdate {
  previousStreak: number;
  newStreak: number;
  frozeUsed: boolean;
  streakBroken: boolean;
  milestoneReached: number | null;
  isNewRecord: boolean;
}

// ===== CONSTANTS =====

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365];

export const MILESTONE_REWARDS = {
  3: { xp: 50, title: '3 Dias!' },
  7: { xp: 100, title: 'Semana Completa!' },
  14: { xp: 200, title: '2 Semanas!' },
  30: { xp: 500, title: 'Mês de Foco!' },
  60: { xp: 1000, title: '2 Meses!' },
  100: { xp: 2000, title: 'Centenário!' },
  200: { xp: 5000, title: 'Imparável!' },
  365: { xp: 10000, title: 'Um Ano!' }
};

// ===== HELPERS =====

function getDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]!;
}

function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return getDateString(d);
}

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// ===== MAIN SERVICE =====

export const StreakService = {
  /**
   * Cria dados de streak iniciais
   */
  createDefault(): StreakData {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      freezesAvailable: 1,
      freezeUsedThisWeek: false,
      weekStart: getWeekStart(),
      totalStudyDays: 0,
      milestones: []
    };
  },

  /**
   * Registra atividade de estudo e atualiza streak
   */
  recordActivity(data: StreakData): StreakUpdate {
    const today = getDateString();
    const currentWeekStart = getWeekStart();

    // Reset semanal de freeze
    if (data.weekStart !== currentWeekStart) {
      data.weekStart = currentWeekStart;
      data.freezeUsedThisWeek = false;
      data.freezesAvailable = 1;
    }

    // Já estudou hoje?
    if (data.lastStudyDate === today) {
      return {
        previousStreak: data.currentStreak,
        newStreak: data.currentStreak,
        frozeUsed: false,
        streakBroken: false,
        milestoneReached: null,
        isNewRecord: false
      };
    }

    const previousStreak = data.currentStreak;
    let streakBroken = false;
    let frozeUsed = false;

    // Verificar continuidade do streak
    if (data.lastStudyDate) {
      const daysDiff = daysBetween(data.lastStudyDate, today);

      if (daysDiff === 1) {
        // Dia consecutivo - incrementa streak
        data.currentStreak++;
      } else if (daysDiff === 2 && data.freezesAvailable > 0) {
        // Perdeu 1 dia, mas tem freeze
        data.freezesAvailable--;
        data.freezeUsedThisWeek = true;
        data.currentStreak++;
        frozeUsed = true;
      } else {
        // Streak quebrado
        data.currentStreak = 1;
        streakBroken = true;
      }
    } else {
      // Primeiro dia
      data.currentStreak = 1;
    }

    data.lastStudyDate = today;
    data.totalStudyDays++;

    // Atualizar recorde
    const isNewRecord = data.currentStreak > data.longestStreak;
    if (isNewRecord) {
      data.longestStreak = data.currentStreak;
    }

    // Verificar milestones
    let milestoneReached: number | null = null;
    for (const milestone of STREAK_MILESTONES) {
      if (data.currentStreak >= milestone && !data.milestones.includes(milestone)) {
        data.milestones.push(milestone);
        milestoneReached = milestone;
        break; // Só um milestone por vez
      }
    }

    return {
      previousStreak,
      newStreak: data.currentStreak,
      frozeUsed,
      streakBroken,
      milestoneReached,
      isNewRecord
    };
  },

  /**
   * Usa um freeze preventivamente (para amanhã)
   */
  useFreeze(data: StreakData): boolean {
    if (data.freezesAvailable <= 0 || data.freezeUsedThisWeek) {
      return false;
    }

    data.freezesAvailable--;
    data.freezeUsedThisWeek = true;
    return true;
  },

  /**
   * Verifica se o streak está em risco (não estudou hoje)
   */
  isAtRisk(data: StreakData): boolean {
    if (!data.lastStudyDate || data.currentStreak === 0) return false;

    const today = getDateString();
    return data.lastStudyDate !== today;
  },

  /**
   * Calcula dias restantes até perder o streak
   */
  daysUntilLoss(data: StreakData): number {
    if (!data.lastStudyDate) return 0;

    const today = getDateString();
    const daysSince = daysBetween(data.lastStudyDate, today);

    if (data.freezesAvailable > 0) {
      return Math.max(0, 2 - daysSince);
    }
    return Math.max(0, 1 - daysSince);
  },

  /**
   * Obtém próximo milestone
   */
  getNextMilestone(currentStreak: number): { threshold: number; daysAway: number } | null {
    for (const milestone of STREAK_MILESTONES) {
      if (currentStreak < milestone) {
        return {
          threshold: milestone,
          daysAway: milestone - currentStreak
        };
      }
    }
    return null;
  },

  /**
   * Obtém recompensa de milestone
   */
  getMilestoneReward(milestone: number): { xp: number; title: string } | null {
    return MILESTONE_REWARDS[milestone as keyof typeof MILESTONE_REWARDS] || null;
  },

  /**
   * Formata mensagem de streak
   */
  formatStreakMessage(data: StreakData): string {
    if (data.currentStreak === 0) {
      return 'Comece seu streak hoje!';
    }

    const emoji = data.currentStreak >= 30 ? '🔥' :
                  data.currentStreak >= 7 ? '⚡' : '✨';

    let message = `${emoji} ${data.currentStreak} dias de streak!`;

    if (data.currentStreak === data.longestStreak) {
      message += ' (Recorde!)';
    }

    const next = this.getNextMilestone(data.currentStreak);
    if (next && next.daysAway <= 7) {
      message += ` Faltam ${next.daysAway} para ${next.threshold} dias!`;
    }

    return message;
  },

  /**
   * Calcula estatísticas de streak
   */
  getStats(data: StreakData): {
    currentStreak: number;
    longestStreak: number;
    totalDays: number;
    milestonesAchieved: number;
    nextMilestone: number | null;
    freezeAvailable: boolean;
    atRisk: boolean;
  } {
    const next = this.getNextMilestone(data.currentStreak);

    return {
      currentStreak: data.currentStreak,
      longestStreak: data.longestStreak,
      totalDays: data.totalStudyDays,
      milestonesAchieved: data.milestones.length,
      nextMilestone: next?.threshold || null,
      freezeAvailable: data.freezesAvailable > 0,
      atRisk: this.isAtRisk(data)
    };
  }
};

// ===== STORAGE =====

const STREAK_STORAGE_KEY = 'mentori_streak';

export const StreakStorage = {
  /**
   * Salva dados de streak
   */
  save(data: StreakData): void {
    try {
      localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save streak:', e);
    }
  },

  /**
   * Carrega dados de streak
   */
  load(): StreakData {
    try {
      const stored = localStorage.getItem(STREAK_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
    return StreakService.createDefault();
  },

  /**
   * Reseta streak (para debug)
   */
  reset(): void {
    localStorage.removeItem(STREAK_STORAGE_KEY);
  }
};

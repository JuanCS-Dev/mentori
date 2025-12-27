/**
 * Level System - Sistema de Níveis e XP
 *
 * Progressão do usuário baseada em atividades:
 * - Responder questões (+5-20 XP)
 * - Acertar questões (+bonus XP)
 * - Completar sessões (+25 XP)
 * - Manter streak (+50 XP/dia)
 * - Completar desafios (+100-500 XP)
 *
 * Níveis: 1-100 com curva exponencial
 * Títulos desbloqueados a cada 10 níveis
 */

// ===== TYPES =====

export interface LevelData {
  level: number;
  currentXP: number;
  totalXP: number;
  xpToNextLevel: number;
  xpProgress: number; // 0-100%
  title: string;
  nextTitle: string | null;
  levelsToNextTitle: number;
}

export interface XPEvent {
  type: XPEventType;
  amount: number;
  timestamp: number;
  description: string;
}

export type XPEventType =
  | 'question_answered'
  | 'question_correct'
  | 'question_streak'
  | 'session_complete'
  | 'daily_streak'
  | 'challenge_complete'
  | 'milestone_reached'
  | 'badge_earned';

export interface LevelUpResult {
  leveledUp: boolean;
  previousLevel: number;
  newLevel: number;
  xpGained: number;
  newTitleUnlocked: string | null;
}

// ===== CONSTANTS =====

/**
 * XP rewards por tipo de evento
 */
export const XP_REWARDS: Record<XPEventType, number> = {
  question_answered: 5,
  question_correct: 10,
  question_streak: 15, // Bonus for correct streak
  session_complete: 25,
  daily_streak: 50,
  challenge_complete: 100,
  milestone_reached: 200,
  badge_earned: 50
};

/**
 * Multiplicadores de dificuldade
 */
export const DIFFICULTY_MULTIPLIERS: Record<string, number> = {
  facil: 0.8,
  medio: 1.0,
  dificil: 1.5,
  expert: 2.0
};

/**
 * Títulos por nível (a cada 10 níveis)
 */
export const TITLES: Record<number, string> = {
  1: 'Recruta',
  10: 'Cadete',
  20: 'Soldado',
  30: 'Cabo',
  40: 'Sargento',
  50: 'Tenente',
  60: 'Capitão',
  70: 'Major',
  80: 'Coronel',
  90: 'General',
  100: 'Marechal'
};

/**
 * Cores por faixa de nível
 */
export const LEVEL_COLORS: Record<number, string> = {
  1: '#6B7280',   // gray
  10: '#10B981',  // emerald
  20: '#3B82F6',  // blue
  30: '#8B5CF6',  // violet
  40: '#EC4899',  // pink
  50: '#F59E0B',  // amber
  60: '#EF4444',  // red
  70: '#14B8A6',  // teal
  80: '#F97316',  // orange
  90: '#6366F1',  // indigo
  100: '#FFD700'  // gold
};

// ===== CORE FUNCTIONS =====

/**
 * Calcula XP necessário para um nível específico
 * Curva exponencial: base * level^1.5
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  const base = 100;
  return Math.floor(base * Math.pow(level, 1.5));
}

/**
 * Calcula XP total necessário até um nível
 */
export function totalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

/**
 * Determina o nível baseado no XP total
 */
export function levelFromXP(totalXP: number): number {
  let level = 1;
  let accumulated = 0;

  while (level < 100) {
    const needed = xpForLevel(level + 1);
    if (accumulated + needed > totalXP) break;
    accumulated += needed;
    level++;
  }

  return level;
}

/**
 * Obtém o título para um nível
 */
export function getTitleForLevel(level: number): string {
  const thresholds = Object.keys(TITLES).map(Number).sort((a, b) => b - a);
  for (const threshold of thresholds) {
    if (level >= threshold) {
      return TITLES[threshold] || 'Recruta';
    }
  }
  return 'Recruta';
}

/**
 * Obtém a cor para um nível
 */
export function getColorForLevel(level: number): string {
  const thresholds = Object.keys(LEVEL_COLORS).map(Number).sort((a, b) => b - a);
  for (const threshold of thresholds) {
    if (level >= threshold) {
      return LEVEL_COLORS[threshold] || '#6B7280';
    }
  }
  return '#6B7280';
}

/**
 * Calcula dados completos do nível atual
 */
export function calculateLevelData(totalXP: number): LevelData {
  const level = levelFromXP(totalXP);
  const xpForCurrentLevel = totalXPForLevel(level);
  const xpForNextLevel = level < 100 ? xpForLevel(level + 1) : 0;
  const currentXP = totalXP - xpForCurrentLevel;

  const title = getTitleForLevel(level);
  const nextTitleLevel = Object.keys(TITLES)
    .map(Number)
    .find(t => t > level);
  const nextTitle = nextTitleLevel ? TITLES[nextTitleLevel] || null : null;
  const levelsToNextTitle = nextTitleLevel ? nextTitleLevel - level : 0;

  return {
    level,
    currentXP,
    totalXP,
    xpToNextLevel: xpForNextLevel,
    xpProgress: xpForNextLevel > 0 ? Math.round((currentXP / xpForNextLevel) * 100) : 100,
    title,
    nextTitle,
    levelsToNextTitle
  };
}

// ===== MAIN SERVICE =====

export const LevelService = {
  /**
   * Adiciona XP e retorna resultado de level up
   */
  addXP(currentTotalXP: number, event: XPEventType, multiplier: number = 1): LevelUpResult {
    const previousLevel = levelFromXP(currentTotalXP);
    const xpGained = Math.round(XP_REWARDS[event] * multiplier);
    const newTotalXP = currentTotalXP + xpGained;
    const newLevel = levelFromXP(newTotalXP);

    const leveledUp = newLevel > previousLevel;
    const previousTitle = getTitleForLevel(previousLevel);
    const newTitle = getTitleForLevel(newLevel);
    const newTitleUnlocked = newTitle !== previousTitle ? newTitle : null;

    return {
      leveledUp,
      previousLevel,
      newLevel,
      xpGained,
      newTitleUnlocked
    };
  },

  /**
   * Calcula XP para responder uma questão
   */
  calculateQuestionXP(
    isCorrect: boolean,
    difficulty: string = 'medio',
    consecutiveCorrect: number = 0
  ): number {
    let xp = XP_REWARDS.question_answered;

    if (isCorrect) {
      xp += XP_REWARDS.question_correct;

      // Streak bonus (cada 3 consecutivos)
      if (consecutiveCorrect > 0 && consecutiveCorrect % 3 === 0) {
        xp += XP_REWARDS.question_streak;
      }
    }

    // Multiplicador de dificuldade
    const mult = DIFFICULTY_MULTIPLIERS[difficulty] || 1;
    return Math.round(xp * mult);
  },

  /**
   * Gera mensagem de level up
   */
  getLevelUpMessage(result: LevelUpResult): string {
    if (!result.leveledUp) return '';

    const levelDiff = result.newLevel - result.previousLevel;
    let message = `🎉 Level Up! Você alcançou o nível ${result.newLevel}!`;

    if (levelDiff > 1) {
      message = `🚀 COMBO! Você subiu ${levelDiff} níveis! Agora está no nível ${result.newLevel}!`;
    }

    if (result.newTitleUnlocked) {
      message += `\n🏆 Novo título desbloqueado: ${result.newTitleUnlocked}!`;
    }

    return message;
  },

  /**
   * Calcula XP necessário para próximo milestone (título)
   */
  xpToNextMilestone(totalXP: number): { xpNeeded: number; milestone: string } {
    const level = levelFromXP(totalXP);
    const nextMilestoneLevel = Object.keys(TITLES)
      .map(Number)
      .find(t => t > level);

    if (!nextMilestoneLevel) {
      return { xpNeeded: 0, milestone: 'Marechal' };
    }

    const xpNeeded = totalXPForLevel(nextMilestoneLevel) - totalXP;
    const milestone = TITLES[nextMilestoneLevel] || 'Desconhecido';

    return { xpNeeded, milestone };
  },

  /**
   * Formata XP para exibição
   */
  formatXP(xp: number): string {
    if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
    if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
    return xp.toString();
  },

  /**
   * Gera descrição do evento de XP
   */
  getEventDescription(event: XPEventType): string {
    const descriptions: Record<XPEventType, string> = {
      question_answered: 'Questão respondida',
      question_correct: 'Resposta correta',
      question_streak: 'Sequência de acertos',
      session_complete: 'Sessão completa',
      daily_streak: 'Streak diário',
      challenge_complete: 'Desafio concluído',
      milestone_reached: 'Milestone alcançado',
      badge_earned: 'Badge conquistado'
    };
    return descriptions[event];
  }
};

// ===== STORAGE =====

const XP_STORAGE_KEY = 'mentori_xp_data';
const XP_HISTORY_KEY = 'mentori_xp_history';

export const XPStorage = {
  /**
   * Salva XP total
   */
  saveTotalXP(totalXP: number): void {
    try {
      localStorage.setItem(XP_STORAGE_KEY, JSON.stringify({ totalXP, lastUpdated: Date.now() }));
    } catch (e) {
      console.warn('Failed to save XP:', e);
    }
  },

  /**
   * Carrega XP total
   */
  loadTotalXP(): number {
    try {
      const stored = localStorage.getItem(XP_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return data.totalXP || 0;
      }
    } catch {
      // Ignore
    }
    return 0;
  },

  /**
   * Adiciona evento ao histórico
   */
  addEvent(event: XPEvent): void {
    try {
      const history = this.loadHistory();
      history.push(event);
      // Manter últimos 100 eventos
      const trimmed = history.slice(-100);
      localStorage.setItem(XP_HISTORY_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to save XP event:', e);
    }
  },

  /**
   * Carrega histórico de eventos
   */
  loadHistory(): XPEvent[] {
    try {
      const stored = localStorage.getItem(XP_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  /**
   * XP ganho hoje
   */
  getTodayXP(): number {
    const today = new Date().toDateString();
    const history = this.loadHistory();
    return history
      .filter(e => new Date(e.timestamp).toDateString() === today)
      .reduce((sum, e) => sum + e.amount, 0);
  },

  /**
   * XP ganho esta semana
   */
  getWeekXP(): number {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const history = this.loadHistory();
    return history
      .filter(e => e.timestamp >= weekAgo)
      .reduce((sum, e) => sum + e.amount, 0);
  }
};

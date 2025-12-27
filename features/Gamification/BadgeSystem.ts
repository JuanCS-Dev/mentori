/**
 * Badge System - Sistema de Conquistas
 *
 * Badges desbloqueados por conquistas específicas:
 * - Milestones de questões (10, 50, 100, 500, 1000)
 * - Streaks (7, 30, 100 dias)
 * - Performance (90%, 95%, 100% em sessão)
 * - Disciplinas dominadas (Elo 1500+)
 * - Especiais (primeiro login, noturno, madrugada)
 */

// ===== TYPES =====

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  condition: BadgeCondition;
  unlockedAt?: number; // timestamp
}

export type BadgeCategory =
  | 'milestone'
  | 'streak'
  | 'performance'
  | 'mastery'
  | 'special';

export type BadgeRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary';

export interface BadgeCondition {
  type: string;
  threshold: number;
  discipline?: string;
}

export interface UserBadges {
  unlocked: string[]; // badge IDs
  progress: Record<string, number>; // badge ID -> progress (0-100)
  lastUnlocked?: string;
  lastUnlockedAt?: number;
}

// ===== BADGE DEFINITIONS =====

export const BADGES: Badge[] = [
  // === MILESTONE BADGES ===
  {
    id: 'first_question',
    name: 'Primeira Questão',
    description: 'Responda sua primeira questão',
    icon: '🎯',
    category: 'milestone',
    rarity: 'common',
    condition: { type: 'questions_answered', threshold: 1 }
  },
  {
    id: 'questions_10',
    name: 'Aquecendo',
    description: 'Responda 10 questões',
    icon: '🔥',
    category: 'milestone',
    rarity: 'common',
    condition: { type: 'questions_answered', threshold: 10 }
  },
  {
    id: 'questions_50',
    name: 'Pegando o Ritmo',
    description: 'Responda 50 questões',
    icon: '💪',
    category: 'milestone',
    rarity: 'uncommon',
    condition: { type: 'questions_answered', threshold: 50 }
  },
  {
    id: 'questions_100',
    name: 'Centenário',
    description: 'Responda 100 questões',
    icon: '💯',
    category: 'milestone',
    rarity: 'uncommon',
    condition: { type: 'questions_answered', threshold: 100 }
  },
  {
    id: 'questions_500',
    name: 'Veterano',
    description: 'Responda 500 questões',
    icon: '⭐',
    category: 'milestone',
    rarity: 'rare',
    condition: { type: 'questions_answered', threshold: 500 }
  },
  {
    id: 'questions_1000',
    name: 'Lendário',
    description: 'Responda 1000 questões',
    icon: '👑',
    category: 'milestone',
    rarity: 'epic',
    condition: { type: 'questions_answered', threshold: 1000 }
  },
  {
    id: 'questions_5000',
    name: 'Imortal',
    description: 'Responda 5000 questões',
    icon: '🏆',
    category: 'milestone',
    rarity: 'legendary',
    condition: { type: 'questions_answered', threshold: 5000 }
  },

  // === STREAK BADGES ===
  {
    id: 'streak_3',
    name: 'Consistente',
    description: 'Mantenha um streak de 3 dias',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    condition: { type: 'streak', threshold: 3 }
  },
  {
    id: 'streak_7',
    name: 'Semana Perfeita',
    description: 'Mantenha um streak de 7 dias',
    icon: '📅',
    category: 'streak',
    rarity: 'uncommon',
    condition: { type: 'streak', threshold: 7 }
  },
  {
    id: 'streak_30',
    name: 'Mês de Ferro',
    description: 'Mantenha um streak de 30 dias',
    icon: '🗓️',
    category: 'streak',
    rarity: 'rare',
    condition: { type: 'streak', threshold: 30 }
  },
  {
    id: 'streak_100',
    name: 'Imparável',
    description: 'Mantenha um streak de 100 dias',
    icon: '💎',
    category: 'streak',
    rarity: 'epic',
    condition: { type: 'streak', threshold: 100 }
  },
  {
    id: 'streak_365',
    name: 'Ano de Dedicação',
    description: 'Mantenha um streak de 365 dias',
    icon: '🌟',
    category: 'streak',
    rarity: 'legendary',
    condition: { type: 'streak', threshold: 365 }
  },

  // === PERFORMANCE BADGES ===
  {
    id: 'perfect_10',
    name: 'Perfect 10',
    description: 'Acerte 10 questões seguidas',
    icon: '🎯',
    category: 'performance',
    rarity: 'uncommon',
    condition: { type: 'consecutive_correct', threshold: 10 }
  },
  {
    id: 'perfect_20',
    name: 'Imbatível',
    description: 'Acerte 20 questões seguidas',
    icon: '🚀',
    category: 'performance',
    rarity: 'rare',
    condition: { type: 'consecutive_correct', threshold: 20 }
  },
  {
    id: 'session_90',
    name: 'Excelência',
    description: 'Termine uma sessão com 90%+ de acerto',
    icon: '📈',
    category: 'performance',
    rarity: 'uncommon',
    condition: { type: 'session_accuracy', threshold: 90 }
  },
  {
    id: 'session_perfect',
    name: 'Perfeição',
    description: 'Termine uma sessão com 100% de acerto (10+ questões)',
    icon: '✨',
    category: 'performance',
    rarity: 'rare',
    condition: { type: 'session_accuracy', threshold: 100 }
  },

  // === MASTERY BADGES ===
  {
    id: 'master_discipline',
    name: 'Mestre',
    description: 'Alcance Elo 1500+ em uma disciplina',
    icon: '🎓',
    category: 'mastery',
    rarity: 'rare',
    condition: { type: 'elo', threshold: 1500 }
  },
  {
    id: 'grandmaster',
    name: 'Grão-Mestre',
    description: 'Alcance Elo 1700+ em uma disciplina',
    icon: '👨‍🎓',
    category: 'mastery',
    rarity: 'epic',
    condition: { type: 'elo', threshold: 1700 }
  },
  {
    id: 'polymath',
    name: 'Polímata',
    description: 'Alcance Elo 1500+ em 5 disciplinas',
    icon: '🧠',
    category: 'mastery',
    rarity: 'legendary',
    condition: { type: 'multi_elo', threshold: 5 }
  },

  // === SPECIAL BADGES ===
  {
    id: 'night_owl',
    name: 'Coruja Noturna',
    description: 'Estude após as 23h',
    icon: '🦉',
    category: 'special',
    rarity: 'common',
    condition: { type: 'time_of_day', threshold: 23 }
  },
  {
    id: 'early_bird',
    name: 'Madrugador',
    description: 'Estude antes das 6h',
    icon: '🐦',
    category: 'special',
    rarity: 'uncommon',
    condition: { type: 'time_of_day', threshold: 6 }
  },
  {
    id: 'weekend_warrior',
    name: 'Guerreiro de Fim de Semana',
    description: 'Estude 4+ horas em um fim de semana',
    icon: '⚔️',
    category: 'special',
    rarity: 'uncommon',
    condition: { type: 'weekend_hours', threshold: 4 }
  },
  {
    id: 'comeback',
    name: 'Retorno Triunfante',
    description: 'Volte a estudar após 7+ dias ausente',
    icon: '🔄',
    category: 'special',
    rarity: 'common',
    condition: { type: 'comeback', threshold: 7 }
  }
];

// ===== RARITY CONFIG =====

export const RARITY_CONFIG = {
  common: { color: '#9CA3AF', xp: 25, label: 'Comum' },
  uncommon: { color: '#10B981', xp: 50, label: 'Incomum' },
  rare: { color: '#3B82F6', xp: 100, label: 'Raro' },
  epic: { color: '#8B5CF6', xp: 200, label: 'Épico' },
  legendary: { color: '#F59E0B', xp: 500, label: 'Lendário' }
};

// ===== MAIN SERVICE =====

export const BadgeService = {
  /**
   * Obtém um badge por ID
   */
  getBadge(id: string): Badge | undefined {
    return BADGES.find(b => b.id === id);
  },

  /**
   * Obtém todos os badges de uma categoria
   */
  getBadgesByCategory(category: BadgeCategory): Badge[] {
    return BADGES.filter(b => b.category === category);
  },

  /**
   * Verifica se um badge foi desbloqueado
   */
  isUnlocked(badgeId: string, userBadges: UserBadges): boolean {
    return userBadges.unlocked.includes(badgeId);
  },

  /**
   * Calcula progresso para um badge
   */
  calculateProgress(badge: Badge, stats: UserStats): number {
    const { type, threshold } = badge.condition;

    let current = 0;
    switch (type) {
      case 'questions_answered':
        current = stats.totalQuestions;
        break;
      case 'streak':
        current = stats.currentStreak;
        break;
      case 'consecutive_correct':
        current = stats.maxConsecutiveCorrect;
        break;
      case 'session_accuracy':
        current = stats.lastSessionAccuracy;
        break;
      case 'elo':
        current = stats.maxElo;
        break;
      case 'multi_elo':
        current = stats.disciplinesAbove1500;
        break;
      default:
        current = 0;
    }

    return Math.min(100, Math.round((current / threshold) * 100));
  },

  /**
   * Verifica badges que podem ser desbloqueados
   */
  checkUnlockable(userBadges: UserBadges, stats: UserStats): Badge[] {
    return BADGES.filter(badge => {
      // Já desbloqueado?
      if (userBadges.unlocked.includes(badge.id)) return false;

      // Verificar condição
      const progress = this.calculateProgress(badge, stats);
      return progress >= 100;
    });
  },

  /**
   * Desbloqueia um badge
   */
  unlock(badge: Badge, userBadges: UserBadges): UserBadges {
    if (userBadges.unlocked.includes(badge.id)) return userBadges;

    return {
      ...userBadges,
      unlocked: [...userBadges.unlocked, badge.id],
      lastUnlocked: badge.id,
      lastUnlockedAt: Date.now()
    };
  },

  /**
   * Obtém XP por desbloquear um badge
   */
  getXPReward(badge: Badge): number {
    return RARITY_CONFIG[badge.rarity].xp;
  },

  /**
   * Ordena badges por raridade
   */
  sortByRarity(badges: Badge[]): Badge[] {
    const order: BadgeRarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
    return [...badges].sort((a, b) =>
      order.indexOf(a.rarity) - order.indexOf(b.rarity)
    );
  },

  /**
   * Gera mensagem de desbloqueio
   */
  getUnlockMessage(badge: Badge): string {
    const rarity = RARITY_CONFIG[badge.rarity];
    return `${badge.icon} ${badge.name} desbloqueado! (+${rarity.xp} XP)`;
  },

  /**
   * Obtém estatísticas de badges do usuário
   */
  getStats(userBadges: UserBadges): {
    total: number;
    unlocked: number;
    byCategory: Record<BadgeCategory, { total: number; unlocked: number }>;
    byRarity: Record<BadgeRarity, { total: number; unlocked: number }>;
  } {
    const categories: BadgeCategory[] = ['milestone', 'streak', 'performance', 'mastery', 'special'];
    const rarities: BadgeRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

    const byCategory = {} as Record<BadgeCategory, { total: number; unlocked: number }>;
    const byRarity = {} as Record<BadgeRarity, { total: number; unlocked: number }>;

    for (const cat of categories) {
      const catBadges = BADGES.filter(b => b.category === cat);
      byCategory[cat] = {
        total: catBadges.length,
        unlocked: catBadges.filter(b => userBadges.unlocked.includes(b.id)).length
      };
    }

    for (const rar of rarities) {
      const rarBadges = BADGES.filter(b => b.rarity === rar);
      byRarity[rar] = {
        total: rarBadges.length,
        unlocked: rarBadges.filter(b => userBadges.unlocked.includes(b.id)).length
      };
    }

    return {
      total: BADGES.length,
      unlocked: userBadges.unlocked.length,
      byCategory,
      byRarity
    };
  }
};

// ===== HELPER TYPES =====

interface UserStats {
  totalQuestions: number;
  currentStreak: number;
  maxConsecutiveCorrect: number;
  lastSessionAccuracy: number;
  maxElo: number;
  disciplinesAbove1500: number;
}

// ===== STORAGE =====

const BADGES_STORAGE_KEY = 'mentori_badges';

export const BadgeStorage = {
  /**
   * Salva badges do usuário
   */
  save(userBadges: UserBadges): void {
    try {
      localStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(userBadges));
    } catch (e) {
      console.warn('Failed to save badges:', e);
    }
  },

  /**
   * Carrega badges do usuário
   */
  load(): UserBadges {
    try {
      const stored = localStorage.getItem(BADGES_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
    return { unlocked: [], progress: {} };
  },

  /**
   * Reseta badges (para debug)
   */
  reset(): void {
    localStorage.removeItem(BADGES_STORAGE_KEY);
  }
};

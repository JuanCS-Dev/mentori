import { useState, useEffect, useCallback } from 'react';
import { calculateNewRating, getKFactor } from '../features/AdaptiveDifficulty/EloEngine';
import { recordHealth } from '../services/chaosOrchestrator';
import { LevelService, LevelUpResult, calculateLevelData, levelFromXP } from '../features/Gamification/LevelSystem';
import { BadgeService, Badge, RARITY_CONFIG } from '../features/Gamification/BadgeSystem';
import { StreakService, StreakData, StreakUpdate, MILESTONE_REWARDS } from '../services/streakService';

const STORAGE_PREFIX = 'mentori_';
const OLD_STORAGE_PREFIX = 'concursoai_';

/**
 * Migrate data from old storage prefix to new one
 * Runs once on app load to preserve user data after rebrand
 */
function migrateOldData(): void {
  try {
    let migrated = 0;
    const keysToMigrate: string[] = [];

    // First pass: collect keys to migrate
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(OLD_STORAGE_PREFIX)) {
        keysToMigrate.push(key);
      }
    }

    // Second pass: migrate data
    for (const oldKey of keysToMigrate) {
      const newKey = oldKey.replace(OLD_STORAGE_PREFIX, STORAGE_PREFIX);
      const value = localStorage.getItem(oldKey);

      // Only migrate if new key doesn't exist (don't overwrite)
      if (value && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, value);
        localStorage.removeItem(oldKey);
        migrated++;
      }
    }

    if (migrated > 0) {
      console.info(`[Mentori] Migrated ${migrated} data items from old storage`);
    }
  } catch (error) {
    console.warn('[Mentori] Data migration failed:', error);
  }
}

// Run migration on module load
migrateOldData();

/**
 * Custom hook for persisting state to localStorage with auto-save
 * Provides type-safe persistence with JSON serialization
 * Enhanced with health signals for resilience monitoring
 */
export function usePersistence<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const storageKey = `${STORAGE_PREFIX}${key}`;

  // Initialize state from localStorage or use initial value
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        recordHealth({ service: `storage:${key}`, status: 'healthy' });
        return JSON.parse(stored) as T;
      }
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error);
      recordHealth({
        service: `storage:${key}`,
        status: 'failed',
        lastError: error instanceof Error ? error.message : 'Parse error'
      });
    }
    return initialValue;
  });

  // Persist to localStorage whenever value changes
  useEffect(() => {
    try {
      if (value === null || value === undefined) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, JSON.stringify(value));
        recordHealth({ service: `storage:${key}`, status: 'healthy' });
      }
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
      recordHealth({
        service: `storage:${key}`,
        status: 'failed',
        lastError: error instanceof Error ? error.message : 'Write error'
      });
    }
  }, [value, storageKey, key]);

  // Clear function to remove from storage
  const clear = useCallback(() => {
    localStorage.removeItem(storageKey);
    setValue(initialValue);
  }, [storageKey, initialValue]);

  return [value, setValue, clear];
}

/**
 * Storage utilities for managing all persisted data
 */
export const PersistenceUtils = {
  /**
   * Get all Mentori data from localStorage
   */
  getAllData(): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        try {
          data[key.replace(STORAGE_PREFIX, '')] = JSON.parse(localStorage.getItem(key) || '');
        } catch {
          data[key.replace(STORAGE_PREFIX, '')] = localStorage.getItem(key);
        }
      }
    }
    return data;
  },

  /**
   * Clear all ConcursoAI data from localStorage
   */
  clearAll(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  },

  /**
   * Export all data as JSON for backup
   */
  exportData(): string {
    return JSON.stringify(this.getAllData(), null, 2);
  },

  /**
   * Import data from JSON backup
   */
  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
      });
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  },

  /**
   * Get storage usage in bytes
   */
  getStorageUsage(): { used: number; available: number; percentage: number } {
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        used += (localStorage.getItem(key) || '').length * 2; // UTF-16
      }
    }
    const available = 5 * 1024 * 1024; // 5MB typical limit
    return {
      used,
      available,
      percentage: (used / available) * 100
    };
  }
};

/**
 * Hook for tracking user progress and statistics
 */
export interface UserProgress {
  questionsAnswered: number;
  questionsCorrect: number;
  totalStudyMinutes: number;
  streakDays: number;
  lastStudyDate: string;
  disciplineStats: Record<string, { answered: number; correct: number; elo: number }>;
  xp: number;
  level: number;
  overallElo: number;
  // New gamification fields
  badges: string[];  // Badge IDs desbloqueados
  consecutiveCorrect: number;  // Para tracking de streak de acertos
  maxConsecutiveCorrect: number;  // Recorde
  lastSessionAccuracy: number;  // Para badge de sessão
  streakData: StreakData;  // Dados completos de streak
}

/**
 * Events emitted when gamification milestones are reached
 */
export interface GamificationEvent {
  type: 'level_up' | 'badge_unlocked' | 'streak_milestone';
  data: LevelUpResult | Badge | { milestone: number; reward: { xp: number; title: string } };
}

const defaultStreakData: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastStudyDate: null,
  freezesAvailable: 1,
  freezeUsedThisWeek: false,
  weekStart: new Date().toISOString().split('T')[0]!,
  totalStudyDays: 0,
  milestones: []
};

const defaultProgress: UserProgress = {
  questionsAnswered: 0,
  questionsCorrect: 0,
  totalStudyMinutes: 0,
  streakDays: 0,
  lastStudyDate: '',
  disciplineStats: {},
  xp: 0,
  level: 1,
  overallElo: 1000,
  badges: [],
  consecutiveCorrect: 0,
  maxConsecutiveCorrect: 0,
  lastSessionAccuracy: 0,
  streakData: defaultStreakData
};

// Gamification event queue for UI notifications
let gamificationEventQueue: GamificationEvent[] = [];

export function useProgress() {
  const [progress, setProgress, clearProgress] = usePersistence<UserProgress>(
    'userProgress',
    defaultProgress
  );

  /**
   * Records a question answer with full gamification integration
   * - Updates Elo ratings
   * - Calculates XP using LevelService
   * - Checks for badge unlocks
   * - Tracks consecutive correct answers
   */
  const recordQuestionAnswer = useCallback((
    discipline: string,
    isCorrect: boolean,
    difficulty: string = 'medio'
  ): { xpGained: number; levelUp: LevelUpResult | null; newBadges: Badge[] } => {
    let xpGained = 0;
    let levelUpResult: LevelUpResult | null = null;
    let newBadges: Badge[] = [];

    setProgress(prev => {
      // 1. Update discipline stats
      const newStats = { ...prev.disciplineStats };
      if (!newStats[discipline]) {
        newStats[discipline] = { answered: 0, correct: 0, elo: 1000 };
      }
      newStats[discipline].answered += 1;
      if (isCorrect) {
        newStats[discipline].correct += 1;
      }

      // 2. Calculate new Elo ratings
      const matchesPlayed = prev.questionsAnswered;
      const kFactor = getKFactor(matchesPlayed);
      const questionDifficulty = 1000;

      const newOverallElo = calculateNewRating(prev.overallElo, questionDifficulty, isCorrect ? 1 : 0, kFactor);
      const currentDisciplineElo = newStats[discipline].elo;
      const newDisciplineElo = calculateNewRating(currentDisciplineElo, questionDifficulty, isCorrect ? 1 : 0, kFactor);
      newStats[discipline].elo = newDisciplineElo;

      // 3. Calculate XP using LevelService
      const consecutiveCorrect = isCorrect ? prev.consecutiveCorrect + 1 : 0;
      xpGained = LevelService.calculateQuestionXP(isCorrect, difficulty, consecutiveCorrect);

      // 4. Apply XP and check for level up
      const newXp = prev.xp + xpGained;
      const newLevel = levelFromXP(newXp);
      const previousLevel = prev.level;

      if (newLevel > previousLevel) {
        levelUpResult = LevelService.addXP(prev.xp, isCorrect ? 'question_correct' : 'question_answered');
        gamificationEventQueue.push({ type: 'level_up', data: levelUpResult });
      }

      // 5. Update max consecutive correct
      const newMaxConsecutive = Math.max(prev.maxConsecutiveCorrect, consecutiveCorrect);

      // 6. Check for new badges
      const maxElo = Math.max(newOverallElo, ...Object.values(newStats).map(s => s.elo));
      const disciplinesAbove1500 = Object.values(newStats).filter(s => s.elo >= 1500).length;

      // Ensure streakData exists (for backwards compatibility with old data)
      const streakData = prev.streakData || defaultStreakData;

      const userStats = {
        totalQuestions: prev.questionsAnswered + 1,
        currentStreak: streakData.currentStreak,
        maxConsecutiveCorrect: newMaxConsecutive,
        lastSessionAccuracy: prev.lastSessionAccuracy || 0,
        maxElo,
        disciplinesAbove1500
      };

      const unlockableBadges = BadgeService.checkUnlockable(
        { unlocked: prev.badges, progress: {} },
        userStats
      );

      let newBadgeIds = [...prev.badges];
      let bonusXP = 0;

      for (const badge of unlockableBadges) {
        if (!newBadgeIds.includes(badge.id)) {
          newBadgeIds.push(badge.id);
          bonusXP += RARITY_CONFIG[badge.rarity].xp;
          newBadges.push(badge);
          gamificationEventQueue.push({ type: 'badge_unlocked', data: badge });
        }
      }

      const finalXp = newXp + bonusXP;
      const finalLevel = levelFromXP(finalXp);

      return {
        ...prev,
        questionsAnswered: prev.questionsAnswered + 1,
        questionsCorrect: prev.questionsCorrect + (isCorrect ? 1 : 0),
        disciplineStats: newStats,
        xp: finalXp,
        level: finalLevel,
        overallElo: newOverallElo,
        consecutiveCorrect,
        maxConsecutiveCorrect: newMaxConsecutive,
        badges: newBadgeIds
      };
    });

    return { xpGained, levelUp: levelUpResult, newBadges };
  }, [setProgress]);

  /**
   * Records study time with streak integration
   */
  const recordStudyTime = useCallback((minutes: number): StreakUpdate | null => {
    const today = new Date().toISOString().split('T')[0] ?? '';
    let streakUpdate: StreakUpdate | null = null;

    setProgress(prev => {
      // 1. Update streak using StreakService (with backwards compatibility)
      const streakData = { ...(prev.streakData || defaultStreakData) };
      streakUpdate = StreakService.recordActivity(streakData);

      // 2. Calculate XP for study time + streak bonus
      let xpGained = Math.floor(minutes); // 1 XP per minute

      // Bonus XP for streak milestone
      if (streakUpdate.milestoneReached) {
        const reward = MILESTONE_REWARDS[streakUpdate.milestoneReached as keyof typeof MILESTONE_REWARDS];
        if (reward) {
          xpGained += reward.xp;
          gamificationEventQueue.push({
            type: 'streak_milestone',
            data: { milestone: streakUpdate.milestoneReached, reward }
          });
        }
      }

      // 3. Apply XP
      const newXp = prev.xp + xpGained;
      const newLevel = levelFromXP(newXp);

      return {
        ...prev,
        totalStudyMinutes: prev.totalStudyMinutes + minutes,
        lastStudyDate: today,
        streakDays: streakData.currentStreak,
        streakData,
        xp: newXp,
        level: newLevel
      };
    });

    return streakUpdate;
  }, [setProgress]);

  /**
   * Use a streak freeze
   */
  const useStreakFreeze = useCallback((): boolean => {
    let success = false;

    setProgress(prev => {
      const streakData = { ...prev.streakData };
      success = StreakService.useFreeze(streakData);

      if (success) {
        return { ...prev, streakData };
      }
      return prev;
    });

    return success;
  }, [setProgress]);

  /**
   * Get and clear pending gamification events (for UI notifications)
   */
  const consumeGamificationEvents = useCallback((): GamificationEvent[] => {
    const events = [...gamificationEventQueue];
    gamificationEventQueue = [];
    return events;
  }, []);

  /**
   * Get level data using LevelService
   */
  const getLevelData = useCallback(() => {
    return calculateLevelData(progress.xp);
  }, [progress.xp]);

  /**
   * Check if streak is at risk
   */
  const isStreakAtRisk = useCallback(() => {
    return StreakService.isAtRisk(progress.streakData || defaultStreakData);
  }, [progress.streakData]);

  const getAccuracy = useCallback(() => {
    if (progress.questionsAnswered === 0) return 0;
    return Math.round((progress.questionsCorrect / progress.questionsAnswered) * 100);
  }, [progress]);

  const getDisciplineAccuracy = useCallback((discipline: string) => {
    const stats = progress.disciplineStats[discipline];
    if (!stats || stats.answered === 0) return 0;
    return Math.round((stats.correct / stats.answered) * 100);
  }, [progress]);

  return {
    progress,
    recordQuestionAnswer,
    recordStudyTime,
    useStreakFreeze,
    consumeGamificationEvents,
    getLevelData,
    isStreakAtRisk,
    getAccuracy,
    getDisciplineAccuracy,
    clearProgress
  };
}

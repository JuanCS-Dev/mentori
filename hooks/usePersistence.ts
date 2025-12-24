import { useState, useEffect, useCallback } from 'react';
import { calculateNewRating, getKFactor } from '../features/AdaptiveDifficulty/EloEngine';

const STORAGE_PREFIX = 'concursoai_';

/**
 * Custom hook for persisting state to localStorage with auto-save
 * Provides type-safe persistence with JSON serialization
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
        return JSON.parse(stored) as T;
      }
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error);
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
      }
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
  }, [value, storageKey]);

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
   * Get all ConcursoAI data from localStorage
   */
  getAllData(): Record<string, any> {
    const data: Record<string, any> = {};
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
}

const defaultProgress: UserProgress = {
  questionsAnswered: 0,
  questionsCorrect: 0,
  totalStudyMinutes: 0,
  streakDays: 0,
  lastStudyDate: '',
  disciplineStats: {},
  xp: 0,
  level: 1,
  overallElo: 1000
};

export function useProgress() {
  const [progress, setProgress, clearProgress] = usePersistence<UserProgress>(
    'userProgress',
    defaultProgress
  );

  const recordQuestionAnswer = useCallback((discipline: string, isCorrect: boolean) => {
    setProgress(prev => {
      const newStats = { ...prev.disciplineStats };
      if (!newStats[discipline]) {
        newStats[discipline] = { answered: 0, correct: 0, elo: 1000 };
      }
      newStats[discipline].answered += 1;
      if (isCorrect) {
        newStats[discipline].correct += 1;
      }

      // Calculate new Elo ratings
      const matchesPlayed = prev.questionsAnswered;
      const kFactor = getKFactor(matchesPlayed);
      // Assuming average question difficulty is 1000 if not provided (will refine later)
      const questionDifficulty = 1000;

      const newOverallElo = calculateNewRating(prev.overallElo, questionDifficulty, isCorrect ? 1 : 0, kFactor);

      const currentDisciplineElo = newStats[discipline].elo;
      const newDisciplineElo = calculateNewRating(currentDisciplineElo, questionDifficulty, isCorrect ? 1 : 0, kFactor);
      newStats[discipline].elo = newDisciplineElo;

      // Calculate XP (10 base + 15 bonus for correct)
      const xpGained = isCorrect ? 25 : 10;
      const newXp = prev.xp + xpGained;
      const newLevel = Math.floor(newXp / 500) + 1;

      return {
        ...prev,
        questionsAnswered: prev.questionsAnswered + 1,
        questionsCorrect: prev.questionsCorrect + (isCorrect ? 1 : 0),
        disciplineStats: newStats,
        xp: newXp,
        level: newLevel,
        overallElo: newOverallElo
      };
    });
  }, [setProgress]);

  const recordStudyTime = useCallback((minutes: number) => {
    const today = new Date().toISOString().split('T')[0] ?? '';

    setProgress(prev => {
      const wasStudyingToday = prev.lastStudyDate === today;
      const wasStudyingYesterday = (() => {
        if (!prev.lastStudyDate) return false;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0] ?? '';
        return prev.lastStudyDate === yesterdayStr;
      })();

      let newStreak = prev.streakDays;
      if (!wasStudyingToday) {
        if (wasStudyingYesterday) {
          newStreak += 1;
        } else if (prev.lastStudyDate !== today) {
          newStreak = 1;
        }
      }

      // XP for study time (1 XP per minute)
      const xpGained = minutes;
      const newXp = prev.xp + xpGained;
      const newLevel = Math.floor(newXp / 500) + 1;

      return {
        ...prev,
        totalStudyMinutes: prev.totalStudyMinutes + minutes,
        lastStudyDate: today,
        streakDays: newStreak,
        xp: newXp,
        level: newLevel
      };
    });
  }, [setProgress]);

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
    getAccuracy,
    getDisciplineAccuracy,
    clearProgress
  };
}

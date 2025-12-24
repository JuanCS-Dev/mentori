import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistence, useProgress, PersistenceUtils } from './usePersistence';

describe('usePersistence', () => {

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      length: 0,
      key: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should initialize with value from localStorage', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify({ test: true }));

    const { result } = renderHook(() => usePersistence('testKey', { test: false }));

    expect(result.current[0]).toEqual({ test: true });
  });

  it('should use initial value when localStorage is empty', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);

    const { result } = renderHook(() => usePersistence('testKey', 'initial'));

    expect(result.current[0]).toBe('initial');
  });

  it('should use initial value on parse error', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('invalid json');

    const { result } = renderHook(() => usePersistence('testKey', 'fallback'));

    expect(result.current[0]).toBe('fallback');
  });

  it('should save value to localStorage on change', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);

    const { result } = renderHook(() => usePersistence('testKey', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'mentori_testKey',
      JSON.stringify('updated')
    );
  });

  it('should remove from localStorage when value is null', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);

    const { result } = renderHook(() => usePersistence<string | null>('testKey', 'initial'));

    act(() => {
      result.current[1](null);
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith('mentori_testKey');
  });

  it('should clear value and reset to initial', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify('stored'));

    const { result } = renderHook(() => usePersistence('testKey', 'initial'));

    act(() => {
      result.current[2](); // clear function
    });

    expect(localStorage.removeItem).toHaveBeenCalled();
    expect(result.current[0]).toBe('initial');
  });

  it('should support functional updates', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(5));

    const { result } = renderHook(() => usePersistence('counter', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(6);
  });
});

describe('PersistenceUtils', () => {

  beforeEach(() => {
    const mockStorage: Record<string, string> = {
      'mentori_key1': JSON.stringify({ data: 'value1' }),
      'mentori_key2': JSON.stringify({ data: 'value2' }),
      'other_key': 'should be ignored'
    };

    vi.stubGlobal('localStorage', {
      length: Object.keys(mockStorage).length,
      key: (i: number) => Object.keys(mockStorage)[i] || null,
      getItem: (key: string) => mockStorage[key] || null,
      setItem: vi.fn((key, value) => { mockStorage[key] = value; }),
      removeItem: vi.fn((key) => { delete mockStorage[key]; }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getAllData', () => {
    it('should return all ConcursoAI data', () => {
      const data = PersistenceUtils.getAllData();

      expect(data).toHaveProperty('key1');
      expect(data).toHaveProperty('key2');
      expect(data).not.toHaveProperty('other_key');
    });

    it('should parse JSON values', () => {
      const data = PersistenceUtils.getAllData();

      expect(data['key1']).toEqual({ data: 'value1' });
    });
  });

  describe('clearAll', () => {
    it('should remove all ConcursoAI keys', () => {
      PersistenceUtils.clearAll();

      expect(localStorage.removeItem).toHaveBeenCalledWith('mentori_key1');
      expect(localStorage.removeItem).toHaveBeenCalledWith('mentori_key2');
    });
  });

  describe('exportData', () => {
    it('should export data as JSON string', () => {
      const exported = PersistenceUtils.exportData();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveProperty('key1');
      expect(parsed).toHaveProperty('key2');
    });
  });

  describe('importData', () => {
    it('should import valid JSON data', () => {
      const data = JSON.stringify({ newKey: { value: 'imported' } });

      const result = PersistenceUtils.importData(data);

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'mentori_newKey',
        expect.any(String)
      );
    });

    it('should return false on invalid JSON', () => {
      const result = PersistenceUtils.importData('invalid json');

      expect(result).toBe(false);
    });
  });

  describe('getStorageUsage', () => {
    it('should calculate storage usage', () => {
      const usage = PersistenceUtils.getStorageUsage();

      expect(usage).toHaveProperty('used');
      expect(usage).toHaveProperty('available');
      expect(usage).toHaveProperty('percentage');
      expect(usage.available).toBe(5 * 1024 * 1024);
    });
  });
});

describe('useProgress', () => {

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      length: 0,
      key: vi.fn(),
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('should initialize with default progress', () => {
    const { result } = renderHook(() => useProgress());

    expect(result.current.progress.questionsAnswered).toBe(0);
    expect(result.current.progress.xp).toBe(0);
    expect(result.current.progress.level).toBe(1);
  });

  it('should record correct question answer', () => {
    const { result } = renderHook(() => useProgress());

    act(() => {
      result.current.recordQuestionAnswer('Matemática', true);
    });

    expect(result.current.progress.questionsAnswered).toBe(1);
    expect(result.current.progress.questionsCorrect).toBe(1);
    expect(result.current.progress.xp).toBe(25); // 10 base + 15 bonus
    expect(result.current.progress.disciplineStats['Matemática'].correct).toBe(1);
  });

  it('should record incorrect question answer', () => {
    const { result } = renderHook(() => useProgress());

    act(() => {
      result.current.recordQuestionAnswer('Português', false);
    });

    expect(result.current.progress.questionsAnswered).toBe(1);
    expect(result.current.progress.questionsCorrect).toBe(0);
    expect(result.current.progress.xp).toBe(10); // base only
    expect(result.current.progress.disciplineStats['Português'].correct).toBe(0);
  });

  it('should record study time and update streak', () => {
    const { result } = renderHook(() => useProgress());

    act(() => {
      result.current.recordStudyTime(30);
    });

    expect(result.current.progress.totalStudyMinutes).toBe(30);
    expect(result.current.progress.streakDays).toBe(1);
    expect(result.current.progress.lastStudyDate).toBe('2025-01-15');
    expect(result.current.progress.xp).toBe(30); // 1 XP per minute
  });

  it('should increment streak when studying consecutive days', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify({
      questionsAnswered: 0,
      questionsCorrect: 0,
      totalStudyMinutes: 60,
      streakDays: 5,
      lastStudyDate: '2025-01-14', // yesterday
      disciplineStats: {},
      xp: 100,
      level: 1
    }));

    const { result } = renderHook(() => useProgress());

    act(() => {
      result.current.recordStudyTime(30);
    });

    expect(result.current.progress.streakDays).toBe(6);
  });

  it('should reset streak when missing a day', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify({
      questionsAnswered: 0,
      questionsCorrect: 0,
      totalStudyMinutes: 60,
      streakDays: 5,
      lastStudyDate: '2025-01-10', // 5 days ago
      disciplineStats: {},
      xp: 100,
      level: 1
    }));

    const { result } = renderHook(() => useProgress());

    act(() => {
      result.current.recordStudyTime(30);
    });

    expect(result.current.progress.streakDays).toBe(1);
  });

  it('should calculate overall accuracy', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify({
      questionsAnswered: 10,
      questionsCorrect: 8,
      totalStudyMinutes: 0,
      streakDays: 0,
      lastStudyDate: '',
      disciplineStats: {},
      xp: 0,
      level: 1
    }));

    const { result } = renderHook(() => useProgress());

    expect(result.current.getAccuracy()).toBe(80);
  });

  it('should return 0 accuracy when no questions answered', () => {
    const { result } = renderHook(() => useProgress());

    expect(result.current.getAccuracy()).toBe(0);
  });

  it('should calculate discipline-specific accuracy', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify({
      questionsAnswered: 10,
      questionsCorrect: 8,
      totalStudyMinutes: 0,
      streakDays: 0,
      lastStudyDate: '',
      disciplineStats: {
        'Direito': { answered: 5, correct: 4 }
      },
      xp: 0,
      level: 1
    }));

    const { result } = renderHook(() => useProgress());

    expect(result.current.getDisciplineAccuracy('Direito')).toBe(80);
    expect(result.current.getDisciplineAccuracy('Unknown')).toBe(0);
  });

  it('should level up based on XP', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify({
      questionsAnswered: 0,
      questionsCorrect: 0,
      totalStudyMinutes: 0,
      streakDays: 0,
      lastStudyDate: '',
      disciplineStats: {},
      xp: 490,
      level: 1
    }));

    const { result } = renderHook(() => useProgress());

    act(() => {
      result.current.recordQuestionAnswer('Test', true); // +25 XP = 515 XP
    });

    expect(result.current.progress.xp).toBe(515);
    expect(result.current.progress.level).toBe(2); // 500+ XP = level 2
  });

  it('should clear progress', () => {
    const { result } = renderHook(() => useProgress());

    act(() => {
      result.current.recordQuestionAnswer('Test', true);
    });

    act(() => {
      result.current.clearProgress();
    });

    expect(result.current.progress.questionsAnswered).toBe(0);
    expect(result.current.progress.xp).toBe(0);
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StudyScheduler, SchedulerConfig } from './studyScheduler';
import { EditalJSON } from '../types';

describe('StudyScheduler', () => {
  describe('createFromEdital', () => {
    it('should create discipline configs from edital verticalizado', () => {
      const edital: EditalJSON = {
        metadata: { banca: 'CEBRASPE', orgao: 'PF', cargos: ['Agente'], nivel_escolaridade: 'Superior', remuneracao: '12k' },
        verticalizado: [
          { disciplina: 'Direito Constitucional', peso: '3', horas_sugeridas: 20, topicos: [] },
          { disciplina: 'Português', peso: '2', horas_sugeridas: 15, topicos: [] }
        ],
        cronograma: [],
        fases: [],
        alertas: []
      };

      const configs = StudyScheduler.createFromEdital(edital);

      expect(configs).toHaveLength(2);
      expect(configs[0].name).toBe('Direito Constitucional');
      expect(configs[0].weight).toBe(3);
      expect(configs[0].priority).toBe('high');
      expect(configs[1].weight).toBe(2);
      expect(configs[1].priority).toBe('medium');
    });

    it('should return empty array for empty verticalizado', () => {
      const edital: EditalJSON = {
        metadata: { banca: '', orgao: '', cargos: [], nivel_escolaridade: '', remuneracao: '' },
        verticalizado: [],
        cronograma: [],
        fases: [],
        alertas: []
      };

      const configs = StudyScheduler.createFromEdital(edital);
      expect(configs).toHaveLength(0);
    });
  });

  describe('calculateHoursFromWeight', () => {
    it('should return 1h for weight 1', () => {
      expect(StudyScheduler.calculateHoursFromWeight(1)).toBe(1);
    });

    it('should return 1.5h for weight 2', () => {
      expect(StudyScheduler.calculateHoursFromWeight(2)).toBe(1.5);
    });

    it('should return 2h for weight 3', () => {
      expect(StudyScheduler.calculateHoursFromWeight(3)).toBe(2);
    });

    it('should return 2.5h for weight 4+', () => {
      expect(StudyScheduler.calculateHoursFromWeight(4)).toBe(2.5);
      expect(StudyScheduler.calculateHoursFromWeight(5)).toBe(2.5);
    });
  });

  describe('getPriorityFromWeight', () => {
    it('should return correct priorities', () => {
      expect(StudyScheduler.getPriorityFromWeight(1)).toBe('low');
      expect(StudyScheduler.getPriorityFromWeight(2)).toBe('medium');
      expect(StudyScheduler.getPriorityFromWeight(3)).toBe('high');
      expect(StudyScheduler.getPriorityFromWeight(4)).toBe('critical');
      expect(StudyScheduler.getPriorityFromWeight(5)).toBe('critical');
    });
  });

  describe('generateDailySchedule', () => {
    const mockConfig: SchedulerConfig = {
      dailyAvailableHours: 4,
      examDate: '2025-06-01',
      restDays: [0], // Sunday
      preferredStartTime: '08:00',
      blockDurationMinutes: 50,
      breakDurationMinutes: 10
    };

    const mockDisciplines = [
      { id: 'd1', name: 'Direito Constitucional', weight: 3, hoursPerCycle: 2, color: '#3B82F6', priority: 'high' as const, totalMinutes: 0 },
      { id: 'd2', name: 'Português', weight: 2, hoursPerCycle: 1.5, color: '#10B981', priority: 'medium' as const, totalMinutes: 0 }
    ];

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should generate schedule for a weekday', () => {
      // Monday Jan 6, 2025 at noon UTC to avoid timezone issues
      vi.setSystemTime(new Date('2025-01-06T12:00:00Z'));
      const monday = new Date('2025-01-06T12:00:00Z');

      const schedule = StudyScheduler.generateDailySchedule(mockDisciplines, mockConfig, monday);

      expect(schedule.isRestDay).toBe(false);
      expect(schedule.blocks.length).toBeGreaterThan(0);
      expect(schedule.totalMinutes).toBeLessThanOrEqual(mockConfig.dailyAvailableHours * 60);
    });

    it('should mark Sunday as rest day', () => {
      // Sunday Jan 5, 2025 at noon UTC
      vi.setSystemTime(new Date('2025-01-05T12:00:00Z'));
      const sunday = new Date('2025-01-05T12:00:00Z');

      const schedule = StudyScheduler.generateDailySchedule(mockDisciplines, mockConfig, sunday);

      expect(schedule.isRestDay).toBe(true);
      expect(schedule.blocks).toHaveLength(0);
      expect(schedule.totalMinutes).toBe(0);
    });

    it('should distribute time proportionally to weights', () => {
      vi.setSystemTime(new Date('2025-01-06T12:00:00Z'));
      const monday = new Date('2025-01-06T12:00:00Z');

      const schedule = StudyScheduler.generateDailySchedule(mockDisciplines, mockConfig, monday);

      // Higher weight discipline should have more time
      const d1Minutes = schedule.blocks.filter(b => b.disciplineId === 'd1').reduce((sum, b) => sum + b.durationMinutes, 0);
      const d2Minutes = schedule.blocks.filter(b => b.disciplineId === 'd2').reduce((sum, b) => sum + b.durationMinutes, 0);

      // Direito (weight 3) should have more time than Português (weight 2)
      expect(d1Minutes).toBeGreaterThanOrEqual(d2Minutes);
    });
  });

  describe('calculateCountdown', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should calculate days remaining correctly', () => {
      vi.setSystemTime(new Date('2025-01-01'));

      const countdown = StudyScheduler.calculateCountdown('2025-01-31');

      expect(countdown.daysRemaining).toBe(30);
      expect(countdown.weeksRemaining).toBe(4);
      expect(countdown.monthsRemaining).toBe(1);
      expect(countdown.isUrgent).toBe(true);
    });

    it('should mark as urgent when less than 30 days', () => {
      vi.setSystemTime(new Date('2025-01-15'));

      const countdown = StudyScheduler.calculateCountdown('2025-02-01');

      expect(countdown.daysRemaining).toBe(17);
      expect(countdown.isUrgent).toBe(true);
    });

    it('should not be urgent when more than 30 days', () => {
      vi.setSystemTime(new Date('2025-01-01'));

      const countdown = StudyScheduler.calculateCountdown('2025-06-01');

      expect(countdown.isUrgent).toBe(false);
    });

    afterEach(() => {
      vi.useRealTimers();
    });
  });

  describe('calculateGoalProgress', () => {
    const mockConfig: SchedulerConfig = {
      dailyAvailableHours: 4,
      examDate: '2025-06-01',
      restDays: [0],
      preferredStartTime: '08:00',
      blockDurationMinutes: 50,
      breakDurationMinutes: 10
    };

    it('should calculate progress correctly when on track', () => {
      const disciplines = [
        { id: 'd1', name: 'Test', weight: 1, hoursPerCycle: 1, color: '#000', priority: 'low' as const, totalMinutes: 720 } // 12h = 50% of week
      ];

      const progress = StudyScheduler.calculateGoalProgress(mockConfig, disciplines, 720);

      expect(progress.weeklyTarget).toBe(4 * 60 * 6); // 4h * 6 days
    });

    it('should detect critical status when very behind', () => {
      const disciplines = [
        { id: 'd1', name: 'Test', weight: 1, hoursPerCycle: 1, color: '#000', priority: 'low' as const, totalMinutes: 60 }
      ];

      const progress = StudyScheduler.calculateGoalProgress(mockConfig, disciplines, 60);

      expect(progress.deviationPercent).toBeLessThan(-30);
      expect(progress.status).toBe('critical');
    });
  });

  describe('suggestNextBlock', () => {
    it('should prioritize never-studied disciplines', () => {
      const disciplines = [
        { id: 'd1', name: 'Studied', weight: 1, hoursPerCycle: 1, color: '#000', priority: 'low' as const, totalMinutes: 60, lastStudied: new Date().toISOString() },
        { id: 'd2', name: 'Never Studied', weight: 1, hoursPerCycle: 1, color: '#000', priority: 'low' as const, totalMinutes: 0 }
      ];

      const suggested = StudyScheduler.suggestNextBlock(disciplines);

      expect(suggested?.id).toBe('d2');
    });

    it('should prioritize low Elo disciplines', () => {
      const disciplines = [
        { id: 'd1', name: 'Strong', weight: 1, hoursPerCycle: 1, color: '#000', priority: 'low' as const, totalMinutes: 60, lastStudied: new Date().toISOString() },
        { id: 'd2', name: 'Weak', weight: 1, hoursPerCycle: 1, color: '#000', priority: 'low' as const, totalMinutes: 60, lastStudied: new Date().toISOString() }
      ];

      const performanceData = { d1: 1500, d2: 800 };
      const suggested = StudyScheduler.suggestNextBlock(disciplines, performanceData);

      expect(suggested?.id).toBe('d2');
    });
  });

  describe('formatDailyStatus', () => {
    it('should format rest day correctly', () => {
      const schedule = { date: '2025-01-05', blocks: [], totalMinutes: 0, isRestDay: true };

      const status = StudyScheduler.formatDailyStatus(schedule);

      expect(status).toContain('descanso');
    });

    it('should format study day correctly', () => {
      const schedule = {
        date: '2025-01-06',
        blocks: [
          { disciplineId: 'd1', disciplineName: 'Direito', startTime: '08:00', endTime: '08:50', durationMinutes: 50, type: 'theory' as const, color: '#000', completed: false }
        ],
        totalMinutes: 50,
        isRestDay: false
      };

      const status = StudyScheduler.formatDailyStatus(schedule);

      expect(status).toContain('Hoje');
      expect(status).toContain('Direito');
    });
  });

  describe('helpers', () => {
    it('parseTime should convert HH:MM to minutes', () => {
      expect(StudyScheduler.parseTime('08:00')).toBe(480);
      expect(StudyScheduler.parseTime('14:30')).toBe(870);
    });

    it('formatTime should convert minutes to HH:MM', () => {
      expect(StudyScheduler.formatTime(480)).toBe('08:00');
      expect(StudyScheduler.formatTime(870)).toBe('14:30');
      expect(StudyScheduler.formatTime(1440)).toBe('00:00'); // Midnight wrap
    });

    it('daysSince should calculate correctly', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      expect(StudyScheduler.daysSince(yesterday.toISOString())).toBe(1);
    });
  });
});

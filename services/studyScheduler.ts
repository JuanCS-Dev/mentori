/**
 * StudyScheduler - Algoritmo Inteligente de Cronograma
 *
 * Baseado na metodologia Evandro Guedes + Alexandre Meirelles:
 * - Distribuição proporcional aos pesos do edital
 * - Ciclos rotativos para manter variedade
 * - Ajuste dinâmico baseado em performance
 * - Priorização de matérias fracas (SM-2 + Elo)
 *
 * Inputs:
 * - Edital verticalizado (disciplinas + pesos)
 * - Horas disponíveis por dia
 * - Data da prova
 * - Histórico de estudos
 * - Performance por disciplina (Elo)
 */

import { EditalJSON } from '../types';

// ===== TYPES =====

export interface DisciplineConfig {
  id: string;
  name: string;
  weight: number;        // Peso do edital (1-5)
  hoursPerCycle: number; // Horas alvo por ciclo
  color: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  performance?: number;  // Elo rating (0-2000)
  lastStudied?: string;  // ISO date
  totalMinutes: number;  // Total já estudado
}

export interface DailySchedule {
  date: string;          // ISO date (YYYY-MM-DD)
  blocks: StudyBlock[];
  totalMinutes: number;
  isRestDay: boolean;
}

export interface StudyBlock {
  disciplineId: string;
  disciplineName: string;
  startTime: string;     // HH:MM
  endTime: string;       // HH:MM
  durationMinutes: number;
  type: 'theory' | 'questions' | 'review' | 'simulado';
  color: string;
  completed: boolean;
  actualMinutes?: number;
}

export interface StudyGoals {
  dailyHours: number;
  weeklyHours: number;
  targetDate: string;    // Prova date
  daysRemaining: number;
  totalHoursRemaining: number;
  disciplines: DisciplineConfig[];
}

export interface GoalProgress {
  dailyTarget: number;
  dailyActual: number;
  dailyPercentage: number;
  weeklyTarget: number;
  weeklyActual: number;
  weeklyPercentage: number;
  deviationPercent: number;  // Negative = behind, Positive = ahead
  status: 'on_track' | 'ahead' | 'behind' | 'critical';
  alertMessage?: string;
}

export interface SchedulerConfig {
  dailyAvailableHours: number;
  examDate: string;
  restDays: number[];    // 0=Sunday, 6=Saturday
  preferredStartTime: string; // HH:MM
  blockDurationMinutes: number; // Default 50 (Pomodoro-like)
  breakDurationMinutes: number; // Default 10
}

// ===== CONSTANTS =====

const COLORS = [
  '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B',
  '#EF4444', '#06B6D4', '#6366F1', '#EC4899',
  '#14B8A6', '#F97316'
];

const DEFAULT_CONFIG: SchedulerConfig = {
  dailyAvailableHours: 4,
  examDate: '',
  restDays: [0], // Sunday only
  preferredStartTime: '08:00',
  blockDurationMinutes: 50,
  breakDurationMinutes: 10
};

// ===== MAIN SERVICE =====

export const StudyScheduler = {
  /**
   * Cria configuração de disciplinas a partir do edital
   */
  createFromEdital(edital: EditalJSON): DisciplineConfig[] {
    if (!edital.verticalizado || edital.verticalizado.length === 0) {
      return [];
    }

    return edital.verticalizado.map((disc, index) => {
      const weight = parseInt(disc.peso) || 1;

      return {
        id: `disc_${index}_${Date.now()}`,
        name: disc.disciplina,
        weight,
        hoursPerCycle: this.calculateHoursFromWeight(weight),
        color: COLORS[index % COLORS.length] || '#6B7280',
        priority: this.getPriorityFromWeight(weight),
        totalMinutes: 0
      };
    });
  },

  /**
   * Calcula horas por ciclo baseado no peso
   * Peso 1 = 1h, Peso 2 = 1.5h, Peso 3 = 2h, Peso 4+ = 2.5h
   */
  calculateHoursFromWeight(weight: number): number {
    if (weight >= 4) return 2.5;
    if (weight === 3) return 2;
    if (weight === 2) return 1.5;
    return 1;
  },

  /**
   * Determina prioridade baseada no peso
   */
  getPriorityFromWeight(weight: number): 'critical' | 'high' | 'medium' | 'low' {
    if (weight >= 4) return 'critical';
    if (weight === 3) return 'high';
    if (weight === 2) return 'medium';
    return 'low';
  },

  /**
   * Gera cronograma diário inteligente
   */
  generateDailySchedule(
    disciplines: DisciplineConfig[],
    config: SchedulerConfig,
    date: Date = new Date(),
    performanceData?: Record<string, number> // disciplineId -> Elo
  ): DailySchedule {
    const dateStr = date.toISOString().split('T')[0] || '';
    const dayOfWeek = date.getDay();

    // Check if rest day
    if (config.restDays.includes(dayOfWeek)) {
      return {
        date: dateStr,
        blocks: [],
        totalMinutes: 0,
        isRestDay: true
      };
    }

    const totalAvailableMinutes = config.dailyAvailableHours * 60;
    const blocks: StudyBlock[] = [];

    // Calcular distribuição proporcional
    const distribution = this.calculateDistribution(
      disciplines,
      totalAvailableMinutes,
      performanceData
    );

    // Gerar blocos de estudo
    let currentTime = this.parseTime(config.preferredStartTime);

    for (const item of distribution) {
      const discipline = disciplines.find(d => d.id === item.disciplineId);
      if (!discipline) continue;

      // Dividir em blocos de duração configurada
      let remainingMinutes = item.minutes;

      while (remainingMinutes > 0) {
        const blockDuration = Math.min(remainingMinutes, config.blockDurationMinutes);

        blocks.push({
          disciplineId: discipline.id,
          disciplineName: discipline.name,
          startTime: this.formatTime(currentTime),
          endTime: this.formatTime(currentTime + blockDuration),
          durationMinutes: blockDuration,
          type: this.determineBlockType(discipline, blocks.length),
          color: discipline.color,
          completed: false
        });

        currentTime += blockDuration + config.breakDurationMinutes;
        remainingMinutes -= blockDuration;
      }
    }

    return {
      date: dateStr,
      blocks,
      totalMinutes: blocks.reduce((sum, b) => sum + b.durationMinutes, 0),
      isRestDay: false
    };
  },

  /**
   * Calcula distribuição de tempo entre disciplinas
   * Considera: peso do edital + performance (Elo) + tempo desde último estudo
   */
  calculateDistribution(
    disciplines: DisciplineConfig[],
    totalMinutes: number,
    performanceData?: Record<string, number>
  ): { disciplineId: string; minutes: number }[] {
    if (disciplines.length === 0) return [];

    // Calcular score de cada disciplina
    const scores = disciplines.map(d => {
      let score = d.weight; // Base: peso do edital

      // Ajuste por performance (Elo baixo = mais tempo)
      if (performanceData && performanceData[d.id]) {
        const elo = performanceData[d.id];
        if (elo && elo < 1000) score *= 1.3;       // Fraco: +30%
        else if (elo && elo < 1200) score *= 1.15; // Regular: +15%
        // Bom/Expert: mantém base
      }

      // Ajuste por tempo desde último estudo
      if (d.lastStudied) {
        const daysSince = this.daysSince(d.lastStudied);
        if (daysSince > 7) score *= 1.2;      // Mais de 1 semana: +20%
        else if (daysSince > 3) score *= 1.1; // Mais de 3 dias: +10%
      }

      return { disciplineId: d.id, score };
    });

    // Normalizar e distribuir
    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);

    return scores.map(s => ({
      disciplineId: s.disciplineId,
      minutes: Math.round((s.score / totalScore) * totalMinutes)
    }));
  },

  /**
   * Determina tipo de bloco (teoria, questões, revisão)
   * Alterna para manter engajamento
   */
  determineBlockType(
    discipline: DisciplineConfig,
    blockIndex: number
  ): 'theory' | 'questions' | 'review' | 'simulado' {
    // Primeiro bloco: teoria
    // Segundo bloco: questões
    // Terceiro+: alterna
    const pattern = ['theory', 'questions', 'review'] as const;
    return pattern[blockIndex % pattern.length] || 'theory';
  },

  /**
   * Calcula metas e progresso
   */
  calculateGoalProgress(
    config: SchedulerConfig,
    disciplines: DisciplineConfig[],
    weeklyMinutesStudied: number
  ): GoalProgress {
    const dailyTarget = config.dailyAvailableHours * 60;
    const weeklyTarget = dailyTarget * (7 - config.restDays.length);

    // Calcular minutos estudados hoje
    const todayMinutes = disciplines.reduce((sum, d) => {
      // Assume totalMinutes inclui hoje (simplificação)
      return sum + (d.totalMinutes % dailyTarget);
    }, 0);

    const dailyPercentage = dailyTarget > 0 ? (todayMinutes / dailyTarget) * 100 : 0;
    const weeklyPercentage = weeklyTarget > 0 ? (weeklyMinutesStudied / weeklyTarget) * 100 : 0;

    const deviationPercent = weeklyPercentage - 100;

    let status: GoalProgress['status'] = 'on_track';
    let alertMessage: string | undefined;

    if (deviationPercent < -30) {
      status = 'critical';
      alertMessage = `Atenção: ${Math.abs(deviationPercent).toFixed(0)}% abaixo da meta semanal. Intensifique os estudos!`;
    } else if (deviationPercent < -15) {
      status = 'behind';
      alertMessage = `Você está ${Math.abs(deviationPercent).toFixed(0)}% abaixo da meta. Foco!`;
    } else if (deviationPercent > 10) {
      status = 'ahead';
      alertMessage = `Excelente! ${deviationPercent.toFixed(0)}% acima da meta. Mantenha o ritmo!`;
    }

    return {
      dailyTarget,
      dailyActual: todayMinutes,
      dailyPercentage,
      weeklyTarget,
      weeklyActual: weeklyMinutesStudied,
      weeklyPercentage,
      deviationPercent,
      status,
      alertMessage
    };
  },

  /**
   * Calcula countdown até a prova
   */
  calculateCountdown(examDate: string): {
    daysRemaining: number;
    weeksRemaining: number;
    monthsRemaining: number;
    isUrgent: boolean;
  } {
    const exam = new Date(examDate);
    const now = new Date();
    const diffMs = exam.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return {
      daysRemaining,
      weeksRemaining: Math.floor(daysRemaining / 7),
      monthsRemaining: Math.floor(daysRemaining / 30),
      isUrgent: daysRemaining <= 30
    };
  },

  /**
   * Gera sugestão de próximo bloco de estudo
   */
  suggestNextBlock(
    disciplines: DisciplineConfig[],
    performanceData?: Record<string, number>
  ): DisciplineConfig | null {
    if (disciplines.length === 0) return null;

    // Priorizar por:
    // 1. Tempo desde último estudo (mais de 3 dias)
    // 2. Elo baixo (< 1200)
    // 3. Peso alto

    const scored = disciplines.map(d => {
      let score = d.weight * 10; // Base

      // Tempo desde último estudo
      if (d.lastStudied) {
        const days = this.daysSince(d.lastStudied);
        score += days * 5;
      } else {
        score += 50; // Nunca estudada = alta prioridade
      }

      // Elo
      const elo = performanceData?.[d.id] || 1000;
      if (elo < 1000) score += 30;
      else if (elo < 1200) score += 15;

      return { discipline: d, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.discipline || null;
  },

  /**
   * Formata mensagem de status do dia
   */
  formatDailyStatus(schedule: DailySchedule): string {
    if (schedule.isRestDay) {
      return '🌙 Dia de descanso. Aproveite para revisar mentalmente.';
    }

    const totalHours = (schedule.totalMinutes / 60).toFixed(1);
    const disciplines = [...new Set(schedule.blocks.map(b => b.disciplineName))];

    return `📚 Hoje: ${totalHours}h - ${disciplines.join(', ')}`;
  },

  // ===== HELPERS =====

  parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  },

  formatTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  },

  daysSince(isoDate: string): number {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
};

// ===== STORAGE =====

const STORAGE_KEY = 'mentori_study_schedule';
const GOALS_KEY = 'mentori_study_goals';
const CONFIG_KEY = 'mentori_scheduler_config';

export const SchedulerStorage = {
  saveConfig(config: SchedulerConfig): void {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save scheduler config:', e);
    }
  },

  loadConfig(): SchedulerConfig {
    try {
      const stored = localStorage.getItem(CONFIG_KEY);
      return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  },

  saveSchedule(schedule: DailySchedule): void {
    try {
      const schedules = this.loadSchedules();
      schedules[schedule.date] = schedule;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
    } catch (e) {
      console.warn('Failed to save schedule:', e);
    }
  },

  loadSchedules(): Record<string, DailySchedule> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  loadTodaySchedule(): DailySchedule | null {
    const today = new Date().toISOString().split('T')[0] || '';
    const schedules = this.loadSchedules();
    return schedules[today] || null;
  },

  saveDisciplines(disciplines: DisciplineConfig[]): void {
    try {
      localStorage.setItem(GOALS_KEY, JSON.stringify(disciplines));
    } catch (e) {
      console.warn('Failed to save disciplines:', e);
    }
  },

  loadDisciplines(): DisciplineConfig[] {
    try {
      const stored = localStorage.getItem(GOALS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
};

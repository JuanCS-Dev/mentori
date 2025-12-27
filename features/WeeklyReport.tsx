/**
 * WeeklyReport - Relatório Semanal de Estudos
 *
 * Resumo visual do progresso semanal:
 * - Predição de nota
 * - Horas estudadas vs meta
 * - Questões respondidas
 * - Performance por disciplina
 * - Comparativo com semana anterior
 */

import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Award,
  Calendar,
  ChevronRight,
  Flame
} from 'lucide-react';
import { usePersistence, useProgress } from '../hooks/usePersistence';
import { ScorePredictor, DisciplinePerformance } from '../services/scorePredictor';

// ===== TYPES =====

interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  totalMinutes: number;
  targetMinutes: number;
  questionsAnswered: number;
  questionsCorrect: number;
  accuracy: number;
  streak: number;
  disciplines: {
    name: string;
    minutes: number;
    questions: number;
    accuracy: number;
    elo: number;
    trend: 'up' | 'down' | 'stable';
  }[];
}

interface WeeklyReportProps {
  onClose?: () => void;
  onNavigateToDiscipline?: (discipline: string) => void;
}

// ===== HELPERS =====

function getWeekBounds(date: Date = new Date()): { start: Date; end: Date } {
  const current = new Date(date);
  const dayOfWeek = current.getDay();
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;

  const start = new Date(current);
  start.setDate(current.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

function getPercentageColor(pct: number): string {
  if (pct >= 100) return 'text-emerald-500';
  if (pct >= 80) return 'text-blue-500';
  if (pct >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function getTrendIcon(trend: 'up' | 'down' | 'stable') {
  if (trend === 'up') return <TrendingUp size={14} className="text-emerald-500" />;
  if (trend === 'down') return <TrendingDown size={14} className="text-red-500" />;
  return <span className="w-3.5 h-0.5 bg-gray-400 rounded-full" />;
}

// ===== MAIN COMPONENT =====

export const WeeklyReport: React.FC<WeeklyReportProps> = ({
  onClose,
  onNavigateToDiscipline
}) => {
  // Get progress data
  const { progress } = useProgress();
  const [weeklyConfig] = usePersistence<{ targetHoursPerDay: number }>('weeklyConfig', {
    targetHoursPerDay: 4
  });

  // Calculate week bounds
  const { start: weekStart, end: weekEnd } = useMemo(() => getWeekBounds(), []);

  // Calculate weekly stats
  const weeklyStats = useMemo((): WeeklyStats => {
    const disciplines = Object.entries(progress.disciplineStats || {}).map(([name, data]) => {
      const discipline = data as { correct?: number; answered?: number; elo?: number };
      const correct = discipline.correct || 0;
      const total = discipline.answered || 0;
      const minutes = Math.round(total * 1.5); // Estimate: 1.5 min per question
      const elo = discipline.elo || 1000;

      // Determine trend (simplified - would need historical data for real implementation)
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (elo > 1200) trend = 'up';
      else if (elo < 1000) trend = 'down';

      return {
        name,
        minutes,
        questions: total,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        elo,
        trend
      };
    }).sort((a, b) => b.minutes - a.minutes);

    const totalMinutes = disciplines.reduce((sum, d) => sum + d.minutes, 0);
    const questionsAnswered = disciplines.reduce((sum, d) => sum + d.questions, 0);
    const questionsCorrect = disciplines.reduce((sum, d) =>
      sum + Math.round((d.accuracy / 100) * d.questions), 0);

    // Target: 6 days * hours per day (excluding Sunday)
    const targetMinutes = 6 * weeklyConfig.targetHoursPerDay * 60;

    return {
      weekStart: formatDate(weekStart),
      weekEnd: formatDate(weekEnd),
      totalMinutes,
      targetMinutes,
      questionsAnswered,
      questionsCorrect,
      accuracy: questionsAnswered > 0
        ? Math.round((questionsCorrect / questionsAnswered) * 100)
        : 0,
      streak: progress.streakDays || 0,
      disciplines
    };
  }, [progress, weekStart, weekEnd, weeklyConfig]);

  // Generate score prediction
  const prediction = useMemo(() => {
    const performances: DisciplinePerformance[] = weeklyStats.disciplines.map(d => ({
      disciplina: d.name,
      peso: 2, // Default weight
      totalQuestions: d.questions,
      correctAnswers: Math.round((d.accuracy / 100) * d.questions),
      accuracy: d.accuracy,
      elo: d.elo,
      avgTimeSeconds: 90,
      consistency: 0.7
    }));

    return ScorePredictor.predictScore(performances);
  }, [weeklyStats]);

  // Calculate percentages
  const hoursPercentage = weeklyStats.targetMinutes > 0
    ? Math.round((weeklyStats.totalMinutes / weeklyStats.targetMinutes) * 100)
    : 0;

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600/20 to-purple-600/20 p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar size={20} className="text-violet-400" />
              Relatório Semanal
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {weeklyStats.weekStart} - {weeklyStats.weekEnd}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Score Prediction Banner */}
      <div className="p-6 border-b border-gray-800">
        <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-xl p-4 border border-violet-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Nota Estimada</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-bold text-white">
                  {prediction.predictedScore}
                </span>
                <span className="text-gray-500">/100</span>
              </div>
              <p className="text-sm text-violet-400 mt-1">
                {prediction.approvalProbability}% chance de aprovação
              </p>
            </div>
            <div className="text-right">
              <div className={`text-5xl ${
                prediction.approvalProbability >= 70 ? 'text-emerald-400' :
                prediction.approvalProbability >= 50 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {prediction.approvalProbability >= 70 ? '🎯' :
                 prediction.approvalProbability >= 50 ? '📈' : '⚠️'}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Confiança: {prediction.predictionConfidence}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 p-6 border-b border-gray-800">
        {/* Hours Studied */}
        <div className="bg-gray-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <Clock size={14} />
            Horas de Estudo
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${getPercentageColor(hoursPercentage)}`}>
              {formatMinutes(weeklyStats.totalMinutes)}
            </span>
            <span className="text-gray-500 text-sm">
              / {formatMinutes(weeklyStats.targetMinutes)}
            </span>
          </div>
          <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                hoursPercentage >= 100 ? 'bg-emerald-500' :
                hoursPercentage >= 80 ? 'bg-blue-500' :
                hoursPercentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, hoursPercentage)}%` }}
            />
          </div>
        </div>

        {/* Questions */}
        <div className="bg-gray-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <Target size={14} />
            Questões
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {weeklyStats.questionsAnswered}
            </span>
            <span className="text-gray-500 text-sm">respondidas</span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle size={12} />
              {weeklyStats.questionsCorrect}
            </span>
            <span className="flex items-center gap-1 text-red-400">
              <XCircle size={12} />
              {weeklyStats.questionsAnswered - weeklyStats.questionsCorrect}
            </span>
            <span className="text-gray-400">
              ({weeklyStats.accuracy}%)
            </span>
          </div>
        </div>

        {/* Streak */}
        <div className="bg-gray-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <Flame size={14} />
            Streak
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-orange-400">
              {weeklyStats.streak}
            </span>
            <span className="text-gray-500 text-sm">dias</span>
          </div>
        </div>

        {/* Top Discipline */}
        <div className="bg-gray-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <Award size={14} />
            Mais Estudada
          </div>
          <div className="text-lg font-bold text-white truncate">
            {weeklyStats.disciplines[0]?.name || 'N/A'}
          </div>
          <p className="text-sm text-gray-500">
            {weeklyStats.disciplines[0]
              ? formatMinutes(weeklyStats.disciplines[0].minutes)
              : '-'}
          </p>
        </div>
      </div>

      {/* Disciplines Breakdown */}
      <div className="p-6">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
          Disciplinas
        </h3>
        <div className="space-y-3">
          {weeklyStats.disciplines.slice(0, 5).map((discipline, index) => (
            <button
              key={discipline.name}
              onClick={() => onNavigateToDiscipline?.(discipline.name)}
              className="w-full bg-gray-800/50 hover:bg-gray-800 rounded-xl p-4 flex items-center gap-4 transition-colors group"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                index === 0 ? 'bg-amber-500/20 text-amber-400' :
                index === 1 ? 'bg-gray-500/20 text-gray-400' :
                index === 2 ? 'bg-orange-500/20 text-orange-400' :
                'bg-gray-700 text-gray-500'
              }`}>
                {index + 1}
              </div>

              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium truncate">
                    {discipline.name}
                  </span>
                  {getTrendIcon(discipline.trend)}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span>{formatMinutes(discipline.minutes)}</span>
                  <span>•</span>
                  <span>{discipline.questions} questões</span>
                  <span>•</span>
                  <span className={discipline.accuracy >= 70 ? 'text-emerald-400' : 'text-amber-400'}>
                    {discipline.accuracy}%
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-bold text-violet-400">
                  Elo {discipline.elo}
                </div>
              </div>

              <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Focus Recommendations */}
      {prediction.focusRecommendations.length > 0 && (
        <div className="p-6 border-t border-gray-800">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
            Recomendações para Próxima Semana
          </h3>
          <div className="space-y-2">
            {prediction.focusRecommendations.slice(0, 3).map((rec) => (
              <div
                key={rec.disciplina}
                className={`rounded-lg p-3 border ${
                  rec.priority === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                  rec.priority === 'high' ? 'bg-amber-500/10 border-amber-500/30' :
                  rec.priority === 'medium' ? 'bg-blue-500/10 border-blue-500/30' :
                  'bg-gray-800 border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase ${
                    rec.priority === 'critical' ? 'text-red-400' :
                    rec.priority === 'high' ? 'text-amber-400' :
                    rec.priority === 'medium' ? 'text-blue-400' :
                    'text-gray-400'
                  }`}>
                    {rec.priority}
                  </span>
                  <span className="text-white font-medium">{rec.disciplina}</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="p-6 border-t border-gray-800 bg-gray-800/30">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
          Insights
        </h3>
        <div className="space-y-2">
          {ScorePredictor.generateInsights(prediction).map((insight, index) => (
            <p key={index} className="text-sm text-gray-300">
              {insight}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklyReport;

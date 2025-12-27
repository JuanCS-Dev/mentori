import React from 'react';
import { Target, Clock, CheckCircle, XCircle } from 'lucide-react';
import { UserProgress } from '../../hooks/usePersistence';

interface QuickStatsProps {
  progress: UserProgress;
  accuracy: number;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ progress, accuracy }) => {
  const todayStats = getTodayStats();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
        Estatisticas Rapidas
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Questions Today */}
        <StatCard
          icon={Target}
          iconColor="text-blue-500"
          iconBg="bg-blue-50"
          label="Questoes Hoje"
          value={todayStats.questionsToday}
          subtext={`Meta: 20`}
        />

        {/* Accuracy */}
        <StatCard
          icon={CheckCircle}
          iconColor="text-green-500"
          iconBg="bg-green-50"
          label="Taxa de Acerto"
          value={`${accuracy}%`}
          subtext={`${progress.questionsCorrect}/${progress.questionsAnswered}`}
        />

        {/* Study Time */}
        <StatCard
          icon={Clock}
          iconColor="text-purple-500"
          iconBg="bg-purple-50"
          label="Tempo de Estudo"
          value={formatMinutes(progress.totalStudyMinutes)}
          subtext="total acumulado"
        />

        {/* Errors to Review */}
        <StatCard
          icon={XCircle}
          iconColor="text-orange-500"
          iconBg="bg-orange-50"
          label="Erros para Revisar"
          value={progress.questionsAnswered - progress.questionsCorrect}
          subtext="pendentes"
        />
      </div>

      {/* Progress Bar */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">Meta diaria: {todayStats.questionsToday}/20 questoes</span>
          <span className="text-sm font-bold text-slate-900">{Math.min(100, Math.round((todayStats.questionsToday / 20) * 100))}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (todayStats.questionsToday / 20) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.FC<{ size?: number; className?: string }>;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string | number;
  subtext: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, iconColor, iconBg, label, value, subtext }) => (
  <div className="flex items-start gap-3">
    <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
      <Icon size={20} className={iconColor} />
    </div>
    <div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-[10px] text-slate-400">{subtext}</div>
    </div>
  </div>
);

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function getTodayStats() {
  // In a real implementation, this would track daily stats
  // For now, return placeholder
  return {
    questionsToday: Math.floor(Math.random() * 15) + 5
  };
}

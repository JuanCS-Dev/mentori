import React from "react";
import { Target, Clock, CheckCircle, XCircle, Activity } from "lucide-react";
import { UserProgress } from "../../hooks/usePersistence";

interface QuickStatsProps {
  progress: UserProgress;
  accuracy: number;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  progress,
  accuracy,
}) => {
  const todayStats = getTodayStats();

  return (
    <div className="bg-[#121216] rounded-lg border border-zinc-900 p-8 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Activity size={16} className="text-[#00F0FF]" />
          <h3 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-[0.3em]">
            Live Analytics
          </h3>
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-px bg-zinc-800"></div>
          <div className="w-1.5 h-px bg-zinc-800"></div>
          <div className="w-1.5 h-px bg-[#00F0FF]"></div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {/* Questions Today */}
        <StatCard
          icon={Target}
          color="#00F0FF"
          label="Neural Drills"
          value={todayStats.questionsToday}
          subtext={`Target: 20`}
        />

        {/* Accuracy */}
        <StatCard
          icon={CheckCircle}
          color="#22C55E"
          label="Accuracy Rating"
          value={`${accuracy}%`}
          subtext={`${progress.questionsCorrect}/${progress.questionsAnswered}`}
        />

        {/* Study Time */}
        <StatCard
          icon={Clock}
          color="#A855F7"
          label="Uptime"
          value={formatMinutes(progress.totalStudyMinutes)}
          subtext="Cumulative"
        />

        {/* Errors to Review */}
        <StatCard
          icon={XCircle}
          color="#EF4444"
          label="Faults Detected"
          value={progress.questionsAnswered - progress.questionsCorrect}
          subtext="Pending Review"
        />
      </div>

      {/* Progress Bar */}
      <div className="mt-10 pt-6 border-t border-zinc-900/50">
        <div className="flex items-center justify-between mb-3 font-mono">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
            Mission Progress: {todayStats.questionsToday}/20 Cycles
          </span>
          <span className="text-[10px] font-bold text-[#00F0FF]">
            {Math.min(100, Math.round((todayStats.questionsToday / 20) * 100))}%
          </span>
        </div>
        <div className="h-1 bg-black rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00F0FF]/50 to-[#00F0FF] rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(0,240,255,0.4)]"
            style={{
              width: `${Math.min(
                100,
                (todayStats.questionsToday / 20) * 100,
              )}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.FC<{ size?: number; className?: string }>;
  color: string;
  label: string;
  value: string | number;
  subtext: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  color,
  label,
  value,
  subtext,
}) => (
  <div className="flex flex-col gap-3 group/stat">
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded bg-zinc-900/50 border border-zinc-800 group-hover/stat:border-zinc-700 transition-colors">
        <Icon size={14} style={{ color }} />
      </div>
      <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest group-hover/stat:text-zinc-400 transition-colors">
        {label}
      </span>
    </div>
    <div className="flex flex-col">
      <div className="text-3xl font-black text-white italic tracking-tighter font-mono">
        {value}
      </div>
      <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mt-1">
        {subtext}
      </div>
    </div>
  </div>
);

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}M`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}H ${mins}M` : `${hours}H`;
}

function getTodayStats() {
  return {
    questionsToday: Math.floor(Math.random() * 15) + 5,
  };
}

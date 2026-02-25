import React from "react";
import { Flame, Zap, Target, ShieldCheck } from "lucide-react";
import { UserProgress } from "../../hooks/usePersistence";
import { LevelData } from "../Gamification/LevelSystem";

interface WelcomeCardProps {
  progress: UserProgress;
  levelData: LevelData;
}

export const WelcomeCard: React.FC<WelcomeCardProps> = ({
  progress,
  levelData,
}) => {
  const streakData = progress.streakData || { currentStreak: 0 };
  const greeting = getGreeting();

  return (
    <div className="bg-[#121216] border border-zinc-900 rounded-lg p-8 relative overflow-hidden group">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05] pointer-events-none"></div>

      {/* Glow Effect */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#00F0FF]/10 rounded-full blur-[100px] group-hover:bg-[#00F0FF]/20 transition-all duration-700" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-[#00F0FF] rounded-full animate-pulse shadow-[0_0_8px_#00F0FF]"></span>
              <p className="text-[#00F0FF] text-[10px] font-mono uppercase tracking-[0.3em]">
                {greeting} OPERADOR
              </p>
            </div>
            <h2 className="text-4xl font-black tracking-tighter uppercase italic">
              Status da <span className="text-[#00F0FF]">Missão</span>
            </h2>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-black border border-[#00F0FF]/30 rounded-full shadow-[0_0_15px_rgba(0,240,255,0.05)]">
            <ShieldCheck size={16} className="text-[#00F0FF]" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-white">
              {levelData.title}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Streak */}
          <div className="bg-black/40 border border-zinc-800 rounded p-5 hover:border-[#00F0FF]/30 transition-all group/stat">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-500/10 rounded border border-orange-500/20">
                <Flame size={18} className="text-orange-500" />
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest group-hover/stat:text-zinc-300 transition-colors">
                Combat Streak
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-black text-white italic">
                {streakData.currentStreak}
              </div>
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                Days Active
              </div>
            </div>
          </div>

          {/* XP */}
          <div className="bg-black/40 border border-zinc-800 rounded p-5 hover:border-[#00F0FF]/30 transition-all group/stat">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#00F0FF]/10 rounded border border-[#00F0FF]/20">
                <Zap size={18} className="text-[#00F0FF]" />
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest group-hover/stat:text-zinc-300 transition-colors">
                Cognitive XP
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-black text-white italic">
                {progress.xp.toLocaleString()}
              </div>
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                Points
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="bg-black/40 border border-zinc-800 rounded p-5 hover:border-[#00F0FF]/30 transition-all group/stat">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500/10 rounded border border-green-500/20">
                <Target size={18} className="text-green-500" />
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest group-hover/stat:text-zinc-300 transition-colors">
                Operative Rank
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <div className="text-4xl font-black text-white italic">
                {levelData.level}
              </div>
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                Current Tier
              </div>
            </div>
            <div className="relative">
              <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00F0FF] rounded-full transition-all duration-1000 shadow-[0_0_8px_#00F0FF]"
                  style={{ width: `${levelData.xpProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] font-mono text-zinc-600 mt-2 uppercase tracking-widest">
                <span>XP: {levelData.currentXP}</span>
                <span>Target: {levelData.xpToNextLevel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "BOM DIA";
  if (hour < 18) return "BOA TARDE";
  return "BOA NOITE";
}

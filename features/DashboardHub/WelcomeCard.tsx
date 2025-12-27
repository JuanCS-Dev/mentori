import React from 'react';
import { Flame, Zap, Trophy, TrendingUp } from 'lucide-react';
import { UserProgress } from '../../hooks/usePersistence';
import { LevelData } from '../Gamification/LevelSystem';

interface WelcomeCardProps {
  progress: UserProgress;
  levelData: LevelData;
}

export const WelcomeCard: React.FC<WelcomeCardProps> = ({ progress, levelData }) => {
  const streakData = progress.streakData || { currentStreak: 0 };
  const greeting = getGreeting();

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px]" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-white/60 text-sm mb-1">{greeting}</p>
            <h2 className="text-2xl font-bold">Bem-vindo ao Mentori</h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full">
            <Trophy size={14} className="text-yellow-400" />
            <span className="text-sm font-bold">{levelData.title}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Streak */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Flame size={18} className="text-orange-400" />
              <span className="text-xs text-white/60 uppercase tracking-wider">Streak</span>
            </div>
            <div className="text-3xl font-black">{streakData.currentStreak}</div>
            <div className="text-xs text-white/50">dias seguidos</div>
          </div>

          {/* XP */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={18} className="text-yellow-400" />
              <span className="text-xs text-white/60 uppercase tracking-wider">XP Total</span>
            </div>
            <div className="text-3xl font-black">{progress.xp.toLocaleString()}</div>
            <div className="text-xs text-white/50">pontos</div>
          </div>

          {/* Level Progress */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-green-400" />
              <span className="text-xs text-white/60 uppercase tracking-wider">Nivel</span>
            </div>
            <div className="text-3xl font-black">{levelData.level}</div>
            <div className="mt-2">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${levelData.xpProgress}%` }}
                />
              </div>
              <div className="text-[10px] text-white/40 mt-1">
                {levelData.currentXP}/{levelData.xpToNextLevel} XP
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
  if (hour < 12) return 'Bom dia!';
  if (hour < 18) return 'Boa tarde!';
  return 'Boa noite!';
}

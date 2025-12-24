import React from 'react';
import { useEloRating } from './useEloRating';
import { Brain, Trophy } from 'lucide-react';

interface DifficultySelectorProps {
    className?: string; // Standard prop
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
    className = ''
}) => {
    const {
        userRating,
        getUserLevelLabel,
        getUserLevelColor,
        getWinProbability
    } = useEloRating();

    const winProb = Math.round(getWinProbability(1200) * 100); // Ex: chance vs average q
    const levelColor = getUserLevelColor();
    const levelTitle = getUserLevelLabel();

    return (
        <div className={`flex items-center gap-4 bg-white/50 p-3 rounded-xl border border-slate-200 ${className}`}>
            <div className={`p-2 rounded-lg ${levelColor.replace('text-', 'bg-').replace('600', '100')}`}>
                <Brain className={levelColor} size={24} />
            </div>

            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                        Nível de Habilidade
                    </span>
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-400">
                        <Trophy size={12} />
                        <span>Elo {Math.round(userRating)}</span>
                    </div>
                </div>

                <div className="flex items-baseline gap-2 mt-1">
                    <h3 className={`text-lg font-bold ${levelColor}`}>
                        {levelTitle}
                    </h3>
                    <span className="text-xs text-slate-400">
                        (Top {winProb}% est.)
                    </span>
                </div>

                {/* Visual Bar */}
                <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${levelColor.replace('text-', 'bg-')} transition-all duration-1000`}
                        style={{ width: `${Math.min(100, (userRating / 2000) * 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

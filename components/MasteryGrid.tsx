import React from 'react';
import { useProgress } from '../hooks/usePersistence';

/**
 * Mastery Grid (Heatmap)
 * Visualizes topic mastery using color intensity.
 * Red (Critical) -> Green (Mastered) API
 */
export const MasteryGrid: React.FC = () => {
    const { progress, getDisciplineAccuracy } = useProgress();

    const disciplines = Object.keys(progress.disciplineStats);

    const getHeatColor = (accuracy: number) => {
        if (accuracy === 0) return 'bg-gray-100 text-gray-400';
        if (accuracy < 40) return 'bg-red-100 text-red-700 border-red-200';
        if (accuracy < 60) return 'bg-yellow-50 text-yellow-700 border-yellow-200'; // Orange-ish
        if (accuracy < 80) return 'bg-blue-50 text-blue-700 border-blue-200';
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    };

    if (disciplines.length === 0) {
        return (
            <div className="p-4 text-center text-sm text-gray-400 bg-gray-50 rounded-lg">
                Ainda sem dados de domínio. Comece a praticar!
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {disciplines.map(discipline => {
                const accuracy = getDisciplineAccuracy(discipline);
                const stats = progress.disciplineStats[discipline];

                return (
                    <div
                        key={discipline}
                        className={`
              p-3 rounded-lg border text-sm flex flex-col justify-between h-24
              ${getHeatColor(accuracy)}
            `}
                    >
                        <span className="font-semibold truncate" title={discipline}>
                            {discipline}
                        </span>
                        <div className="text-right">
                            <div className="text-2xl font-bold">{accuracy}%</div>
                            <div className="text-xs opacity-75">{stats?.answered || 0} questões</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

import React, { useMemo } from 'react';
import { useProgress } from '../hooks/usePersistence';

/**
 * Streak Widget
 * Displays current streak and "freeze" status.
 * Visual motivation (Loss Aversion).
 */
export const StreakWidget: React.FC = () => {
    const { progress } = useProgress();

    const streakStatus = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const lastStudy = progress.lastStudyDate;

        // Check if studied today
        if (lastStudy === today) return 'active';

        // Check if streak is at risk (missed yesterday?)
        // This logic is simplified; usePersistence handles the actual calculation.
        // Here we just display the state.

        return 'pending';
    }, [progress.lastStudyDate]);

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full border border-orange-100 shadow-sm">
            <div className={`
        text-lg transition-transform duration-500
        ${streakStatus === 'active' ? 'scale-110' : 'grayscale opacity-50'}
      `}>
                🔥
            </div>
            <div className="flex flex-col leading-none">
                <span className="font-bold text-sm tabular-nums">
                    {progress.streakDays}
                </span>
                <span className="text-[10px] uppercase tracking-wider opacity-75">
                    Dias
                </span>
            </div>
        </div>
    );
};

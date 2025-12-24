import React from 'react';

/**
 * StressIndicator - Visual Pressure Meter
 * 
 * Shows current stress level during timed challenge.
 * Color transitions: Green → Yellow → Orange → Red
 */
interface StressIndicatorProps {
    pressureLevel: number; // 0-100
    timeRemaining: number;
    totalTime: number;
}

export const StressIndicator: React.FC<StressIndicatorProps> = ({
    pressureLevel,
    timeRemaining,
    totalTime
}) => {
    const getColor = () => {
        if (pressureLevel < 30) return 'bg-emerald-500';
        if (pressureLevel < 60) return 'bg-yellow-500';
        if (pressureLevel < 85) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getStatusText = () => {
        if (pressureLevel < 30) return 'Tranquilo';
        if (pressureLevel < 60) return 'Atenção';
        if (pressureLevel < 85) return 'Pressão';
        return 'CRÍTICO';
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full max-w-xs">
            {/* Timer Display */}
            <div className={`
        text-center text-3xl font-mono font-bold mb-2 transition-colors duration-300
        ${pressureLevel >= 85 ? 'text-red-600 animate-pulse' : 'text-slate-800'}
      `}>
                {formatTime(timeRemaining)}
            </div>

            {/* Pressure Bar */}
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div
                    className={`h-full ${getColor()} transition-all duration-500 ease-out`}
                    style={{ width: `${100 - (timeRemaining / totalTime) * 100}%` }}
                />
            </div>

            {/* Status Label */}
            <div className={`
        mt-1 text-center text-xs font-bold uppercase tracking-wider
        ${pressureLevel >= 85 ? 'text-red-600' : 'text-slate-500'}
      `}>
                {getStatusText()}
            </div>

            {/* Heart Rate Simulation (Visual Stress Cue) */}
            {pressureLevel >= 60 && (
                <div className="mt-2 flex justify-center items-center gap-1 text-red-500">
                    <span className={`text-lg ${pressureLevel >= 85 ? 'animate-ping' : 'animate-pulse'}`}>
                        ❤️
                    </span>
                    <span className="text-xs font-mono">
                        {Math.floor(70 + pressureLevel * 0.5)} bpm
                    </span>
                </div>
            )}
        </div>
    );
};

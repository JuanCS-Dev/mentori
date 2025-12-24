import React from 'react';

interface InterleaveSettingsProps {
    mixRatio: number;
    setMixRatio: (ratio: number) => void;
    className?: string;
}

export const InterleaveSettings: React.FC<InterleaveSettingsProps> = ({
    mixRatio,
    setMixRatio,
    className = ''
}) => {
    return (
        <div className={`p-4 bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <span>🔀</span> Interleaved Practice
                </h3>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                    Science: +72% Retention
                </span>
            </div>

            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Intensity (Mixing)</span>
                        <span className="font-medium text-indigo-600">{Math.round(mixRatio * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={mixRatio}
                        onChange={(e) => setMixRatio(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Blocked (Easy)</span>
                        <span>Interleaved (Harder)</span>
                    </div>
                </div>

                <p className="text-xs text-gray-500 italic">
                    "Higher interleaving feels harder but produces significantly better long-term retention."
                </p>
            </div>
        </div>
    );
};

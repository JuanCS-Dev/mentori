import React, { useState } from 'react';

interface ConfidenceSliderProps {
    onCommit: (level: number) => void;
    className?: string;
}

export const ConfidenceSlider: React.FC<ConfidenceSliderProps> = ({
    onCommit,
    className = ''
}) => {
    const [value, setValue] = useState(50);
    const [committed, setCommitted] = useState(false);

    const handleCommit = () => {
        setCommitted(true);
        onCommit(value);
    };

    const getLabel = (val: number) => {
        if (val < 25) return "Totalmente Incerto (Chute)";
        if (val < 50) return "Pouca Confiança";
        if (val < 75) return "Confiança Moderada";
        if (val < 90) return "Quase Certeza";
        return "Certeza Absoluta!";
    };

    const getColor = (val: number) => {
        // Red -> Yellow -> Green gradient approximation
        if (val < 50) return 'text-red-500';
        if (val < 80) return 'text-yellow-600';
        return 'text-green-600';
    };

    return (
        <div className={`p-4 bg-white rounded-xl border border-gray-100 ${className}`}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Nível de Confiança (Metacognição)
            </label>

            {!committed ? (
                <>
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-bold ${getColor(value)}`}>
                            {value}% - {getLabel(value)}
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) => setValue(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mb-4"
                    />
                    <button
                        onClick={handleCommit}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Confirmar Confiança
                    </button>
                </>
            ) : (
                <div className="text-center py-2 text-gray-500 text-sm bg-gray-50 rounded-lg">
                    Confiança registrada: <span className="font-bold">{value}%</span>
                </div>
            )}
        </div>
    );
};

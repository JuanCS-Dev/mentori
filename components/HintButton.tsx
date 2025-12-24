import React, { useState } from 'react';

/**
 * Hint System inspired by Google LearnLM.
 * Progressive disclosure reduces cognitive load while providing scaffolding.
 */

export interface HintSystem {
    level1: string;  // Conceptual hint ("Think about X principle")
    level2: string;  // Directional hint ("The answer relates to Y")
    level3: string;  // Near-answer hint ("Look at option Z because...")
}

interface HintButtonProps {
    hints: HintSystem;
    onHintUsed?: (level: number) => void;
}

export const HintButton: React.FC<HintButtonProps> = ({ hints, onHintUsed }) => {
    const [revealedLevel, setRevealedLevel] = useState(0);

    const revealNext = () => {
        if (revealedLevel < 3) {
            const next = revealedLevel + 1;
            setRevealedLevel(next);
            onHintUsed?.(next);
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="flex justify-end mb-2">
                <button
                    onClick={revealNext}
                    disabled={revealedLevel >= 3}
                    className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all
            ${revealedLevel >= 3
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'}
          `}
                >
                    <span>💡</span>
                    <span>{revealedLevel === 0 ? "Pedir Dica" : `Dica ${revealedLevel + 1}/3`}</span>
                </button>
            </div>

            <div className="space-y-2">
                {revealedLevel >= 1 && (
                    <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100 animate-slideDown">
                        <strong>Nível 1 (Conceito):</strong> {hints.level1}
                    </div>
                )}
                {revealedLevel >= 2 && (
                    <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-100 animate-slideDown">
                        <strong>Nível 2 (Direção):</strong> {hints.level2}
                    </div>
                )}
                {revealedLevel >= 3 && (
                    <div className="p-3 bg-green-50 text-green-800 rounded-lg text-sm border border-green-100 animate-slideDown">
                        <strong>Nível 3 (Quase lá):</strong> {hints.level3}
                    </div>
                )}
            </div>
        </div>
    );
};

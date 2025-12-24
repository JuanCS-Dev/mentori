import React from 'react';

type ConfidenceLevel = 'low' | 'medium' | 'high';

interface ConfidenceCheckProps {
    onConfidenceSelect: (level: ConfidenceLevel) => void;
    selected?: ConfidenceLevel;
}

export const ConfidenceCheck: React.FC<ConfidenceCheckProps> = ({
    onConfidenceSelect,
    selected
}) => {
    return (
        <div className="my-4">
            <div className="text-sm text-gray-500 mb-2 flex items-center justify-between">
                <span>Confiança na resposta?</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                    Impacta revisão
                </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <button
                    onClick={() => onConfidenceSelect('low')}
                    className={`
            py-2 px-3 rounded-lg border text-sm font-medium transition-all
            flex flex-col items-center justify-center gap-1
            ${selected === 'low'
                            ? 'bg-red-50 border-red-200 text-red-700 ring-2 ring-red-200'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}
          `}
                >
                    <span>🤔 Chute</span>
                    <span className="text-xs font-normal opacity-75">Baixa</span>
                </button>

                <button
                    onClick={() => onConfidenceSelect('medium')}
                    className={`
            py-2 px-3 rounded-lg border text-sm font-medium transition-all
            flex flex-col items-center justify-center gap-1
            ${selected === 'medium'
                            ? 'bg-yellow-50 border-yellow-200 text-yellow-700 ring-2 ring-yellow-200'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}
          `}
                >
                    <span>😐 Dúvida</span>
                    <span className="text-xs font-normal opacity-75">Média</span>
                </button>

                <button
                    onClick={() => onConfidenceSelect('high')}
                    className={`
            py-2 px-3 rounded-lg border text-sm font-medium transition-all
            flex flex-col items-center justify-center gap-1
            ${selected === 'high'
                            ? 'bg-green-50 border-green-200 text-green-700 ring-2 ring-green-200'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}
          `}
                >
                    <span>😎 Certeza</span>
                    <span className="text-xs font-normal opacity-75">Alta</span>
                </button>
            </div>
        </div>
    );
};

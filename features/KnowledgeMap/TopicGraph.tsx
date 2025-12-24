import React, { useMemo } from 'react';
import { useProgress } from '../../hooks/usePersistence';

/**
 * Knowledge Map - Interactive Topic Graph
 * 
 * Based on EdTech 2024 research:
 * - Concept Maps = Hierarchical (good for legal topics)
 * - Color-coding by mastery level (red → yellow → green)
 * - Clickable nodes showing topic summaries
 * 
 * "Schema building + relationships" - helps visualize knowledge structure.
 */

export interface TopicNode {
    id: string;
    name: string;
    discipline: string;
    mastery: number; // 0-100
    questionsAnswered: number;
    children?: TopicNode[];
}

interface KnowledgeMapProps {
    className?: string;
}

export const KnowledgeMap: React.FC<KnowledgeMapProps> = ({ className = '' }) => {
    const { progress, getDisciplineAccuracy } = useProgress();

    // Transform disciplineStats into topic nodes
    const nodes = useMemo<TopicNode[]>(() => {
        return Object.entries(progress.disciplineStats).map(([discipline, stats]) => ({
            id: discipline.toLowerCase().replace(/\s/g, '-'),
            name: discipline,
            discipline,
            mastery: getDisciplineAccuracy(discipline),
            questionsAnswered: stats.answered
        }));
    }, [progress.disciplineStats, getDisciplineAccuracy]);

    const getMasteryColor = (mastery: number) => {
        if (mastery >= 80) return { bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-emerald-900' };
        if (mastery >= 60) return { bg: 'bg-yellow-400', border: 'border-yellow-500', text: 'text-yellow-900' };
        if (mastery >= 40) return { bg: 'bg-orange-400', border: 'border-orange-500', text: 'text-orange-900' };
        if (mastery > 0) return { bg: 'bg-red-400', border: 'border-red-500', text: 'text-red-900' };
        return { bg: 'bg-slate-200', border: 'border-slate-300', text: 'text-slate-500' };
    };

    const getMasteryLabel = (mastery: number) => {
        if (mastery >= 80) return '🏆 Dominado';
        if (mastery >= 60) return '📈 Aprendendo';
        if (mastery >= 40) return '⚠️ Atenção';
        if (mastery > 0) return '🚨 Crítico';
        return '❓ Não iniciado';
    };

    if (nodes.length === 0) {
        return (
            <div className={`p-8 text-center text-slate-400 bg-slate-50 rounded-2xl ${className}`}>
                <div className="text-4xl mb-4">🧠</div>
                <p className="font-medium">Seu Mapa de Conhecimento está vazio</p>
                <p className="text-sm mt-1">Comece a estudar para visualizar seu domínio!</p>
            </div>
        );
    }

    // Calculate center position for radial layout
    const centerX = 200;
    const centerY = 200;
    const radius = 150;

    return (
        <div className={`relative ${className}`}>
            {/* Legend */}
            <div className="flex justify-center gap-4 mb-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Dominado</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400"></span> Aprendendo</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-400"></span> Atenção</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400"></span> Crítico</span>
            </div>

            {/* SVG Graph */}
            <svg viewBox="0 0 400 400" className="w-full max-w-md mx-auto">
                {/* Center Node (You) */}
                <circle cx={centerX} cy={centerY} r="30" fill="#6366f1" />
                <text x={centerX} y={centerY + 5} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                    VOCÊ
                </text>

                {/* Topic Nodes */}
                {nodes.map((node, index) => {
                    const angle = (2 * Math.PI * index) / nodes.length - Math.PI / 2;
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    const colors = getMasteryColor(node.mastery);
                    const nodeRadius = Math.min(40, 25 + node.questionsAnswered / 10);

                    return (
                        <g key={node.id}>
                            {/* Connection Line */}
                            <line
                                x1={centerX}
                                y1={centerY}
                                x2={x}
                                y2={y}
                                stroke={node.mastery >= 60 ? '#10b981' : '#e2e8f0'}
                                strokeWidth="2"
                                strokeDasharray={node.mastery < 40 ? '5,5' : '0'}
                            />

                            {/* Node Circle */}
                            <circle
                                cx={x}
                                cy={y}
                                r={nodeRadius}
                                className={`${colors.bg} ${colors.border} cursor-pointer transition-all hover:opacity-80`}
                                stroke="currentColor"
                                strokeWidth="2"
                            />

                            {/* Mastery Percentage */}
                            <text
                                x={x}
                                y={y + 4}
                                textAnchor="middle"
                                fontSize="10"
                                fontWeight="bold"
                                fill="white"
                            >
                                {node.mastery}%
                            </text>

                            {/* Topic Label (outside) */}
                            <text
                                x={x + (x > centerX ? 45 : -45)}
                                y={y + 4}
                                textAnchor={x > centerX ? 'start' : 'end'}
                                fontSize="9"
                                fill="#475569"
                                className="font-medium"
                            >
                                {node.name.length > 12 ? node.name.substring(0, 12) + '...' : node.name}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Topic List (Clickable Details) */}
            <div className="mt-6 grid grid-cols-2 gap-2">
                {nodes.map(node => {
                    const colors = getMasteryColor(node.mastery);
                    return (
                        <div
                            key={node.id}
                            className={`p-3 rounded-lg border-2 ${colors.border} ${colors.bg.replace('bg-', 'bg-opacity-20 bg-')} cursor-pointer hover:shadow-md transition-all`}
                        >
                            <div className={`font-semibold text-sm ${colors.text}`}>{node.name}</div>
                            <div className="text-xs text-slate-500 mt-1">
                                {getMasteryLabel(node.mastery)} • {node.questionsAnswered} questões
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

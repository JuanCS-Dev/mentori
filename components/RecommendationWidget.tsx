import React, { useMemo } from 'react';
import { useProgress } from '../hooks/usePersistence';

/**
 * "Where to Next?" Recommendation Engine
 * 
 * Based on Hattie's "Visible Learning": Feedback should answer 
 * "Where am I going?" and "What next?"
 */
export const RecommendationWidget: React.FC = () => {
    const { progress, getDisciplineAccuracy } = useProgress();

    const recommendation = useMemo(() => {
        // 1. Check for weak areas (Mastery < 50%)
        const entries = Object.entries(progress.disciplineStats);
        if (entries.length === 0) {
            return {
                title: "Comece sua jornada!",
                action: "Iniciar Ciclo de Estudos",
                reason: "Sem dados suficientes para recomendação personalizada.",
                type: "START"
            };
        }

        // Sort by accuracy (ascending) - prioritize weakness
        const sortedStats = entries.map(([disc]) => ({
            discipline: disc,
            accuracy: getDisciplineAccuracy(disc)
        })).sort((a, b) => a.accuracy - b.accuracy);

        const weakest = sortedStats[0];

        if (!weakest) {
            return {
                title: "Inicie seus estudos!",
                action: "Começar",
                reason: "Ainda não temos dados suficientes.",
                type: "START"
            };
        }

        if (!weakest) {
            return {
                title: "Inicie seus estudos!",
                action: "Começar",
                reason: "Ainda não temos dados suficientes.",
                type: "START"
            };
        }

        // Priority 1: Fix critical weakness (< 50%)
        if (weakest.accuracy < 50) {
            return {
                title: `🚨 Socorro em ${weakest.discipline}`,
                action: "Revisar Teoria + Questões Fáceis",
                reason: `Sua precisão está em ${weakest.accuracy}%. Volte aos fundamentos (Elo baixo).`,
                type: "RECOVERY"
            };
        }

        // Priority 2: Improve "Learning" zone (50-70%)
        if (weakest.accuracy < 70) {
            return {
                title: `📈 Melhorar ${weakest.discipline}`,
                action: "Bateria de Questões Intercaladas",
                reason: "Você está quase lá. Use Prática Intercalada para consolidar.",
                type: "GROWTH"
            };
        }

        // Priority 3: Maintain Mastery (> 80%)
        return {
            title: "🏆 Manter a Excelência",
            action: "Desafio de Alta Dificuldade",
            reason: "Você dominou a base. Agora enfrente questões 'Expert' para não esquecer.",
            type: "MASTERY"
        };

    }, [progress, getDisciplineAccuracy]);

    const getColors = (type: string) => {
        switch (type) {
            case 'RECOVERY': return 'bg-red-50 border-red-200 text-red-800';
            case 'GROWTH': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            case 'MASTERY': return 'bg-purple-50 border-purple-200 text-purple-800';
            default: return 'bg-gray-50 border-gray-200 text-gray-800';
        }
    };

    return (
        <div className={`p-4 rounded-xl border shadow-sm ${getColors(recommendation.type)}`}>
            <h3 className="text-sm font-semibold uppercase tracking-wide opacity-75 mb-1">
                Recomendação IA: O que fazer agora?
            </h3>
            <div className="flex items-start justify-between">
                <div>
                    <div className="text-lg font-bold mb-1">{recommendation.title}</div>
                    <p className="text-sm opacity-90">{recommendation.reason}</p>
                </div>
                <button className="px-4 py-2 bg-white/50 hover:bg-white/80 rounded-lg text-sm font-semibold shadow-sm transition-all whitespace-nowrap ml-4">
                    {recommendation.action} →
                </button>
            </div>
        </div>
    );
};

import React, { useRef } from 'react';
import { Share2, Zap, Brain, TrendingUp } from 'lucide-react';
import { NeuroStudyPlanJSON } from '../types';

interface NeuroShareCardProps {
    plan?: NeuroStudyPlanJSON | null;
    stats?: {
        focusMinutes: number;
        streakDays: number;
        questionsSolved: number;
    };
    userMood: 'focused' | 'tired' | 'anxious';
}

export const NeuroShareCard: React.FC<NeuroShareCardProps> = ({ plan, stats = { focusMinutes: 45, streakDays: 3, questionsSolved: 12 }, userMood }) => {

    // In a real implementation, we would use html2canvas to export this div as an image
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Meu Neuro-Relatório Mentori',
                    text: `Acabei de completar ${stats.focusMinutes}min de foco profundo no Mentori! 🧠⚡`,
                    url: window.location.href
                });
            } catch (error) {
                console.log('Error sharing', error);
            }
        } else {
            alert('Opção de compartilhamento nativo não suportada neste browser. (Implementar html2canvas aqui)');
        }
    };

    const getMoodColor = () => {
        switch (userMood) {
            case 'focused': return 'from-emerald-600 to-teal-900';
            case 'tired': return 'from-blue-600 to-indigo-900';
            case 'anxious': return 'from-amber-600 to-orange-900';
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {/* THE CARD ITSELF */}
            <div className={`relative w-[320px] h-[500px] rounded-[2rem] overflow-hidden bg-gradient-to-br ${getMoodColor()} shadow-2xl flex flex-col p-6 text-white border-4 border-white/10 group hover:scale-[1.02] transition-transform duration-500`}>

                {/* BACKGROUND NOISE/TEXTURE */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay"></div>

                {/* GLOW EFFECTS */}
                <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-white/30 rounded-full blur-[60px]"></div>
                <div className="absolute bottom-[-20px] left-[-20px] w-60 h-60 bg-black/20 rounded-full blur-[50px]"></div>

                {/* HEADER */}
                <div className="relative z-10 flex justify-between items-center mb-8">
                    <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold font-mono tracking-widest border border-white/20">
                        MENTORI.AI
                    </div>
                    <div className="text-white/80 text-xs font-mono">
                        {new Date().toLocaleDateString()}
                    </div>
                </div>

                {/* CENTRAL STATS */}
                <div className="relative z-10 text-center space-y-2 mb-8">
                    <div className="text-sm font-bold uppercase tracking-widest text-white/60">Sessão de Foco</div>
                    <div className="text-7xl font-black tracking-tighter drop-shadow-lg">
                        {stats.focusMinutes}<span className="text-3xl font-medium text-white/50">min</span>
                    </div>
                    <div className="bg-white/10 inline-block px-4 py-1 rounded-lg text-sm font-medium border border-white/10">
                        Modo: {userMood.toUpperCase()}
                    </div>
                </div>

                {/* METRICS GRID */}
                <div className="relative z-10 grid grid-cols-2 gap-3 mb-auto">
                    <div className="bg-black/20 rounded-xl p-3 backdrop-blur-sm border border-white/5">
                        <div className="text-white/50 text-[10px] uppercase font-bold mb-1 flex items-center gap-1">
                            <Zap size={10} /> Streak
                        </div>
                        <div className="text-2xl font-bold">{stats.streakDays} dias</div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3 backdrop-blur-sm border border-white/5">
                        <div className="text-white/50 text-[10px] uppercase font-bold mb-1 flex items-center gap-1">
                            <Brain size={10} /> XP
                        </div>
                        <div className="text-2xl font-bold">+{stats.questionsSolved * 50}</div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="relative z-10 mt-6 pt-6 border-t border-white/10 text-center">
                    <p className="text-sm font-medium italic text-white/80">
                        "{plan?.diagnostico?.estrategia_adotada || "Construindo neuro-plasticidade..."}"
                    </p>
                    <div className="mt-4 text-[10px] text-white/40 uppercase tracking-[0.2em]">
                        Neuro-Adaptive System
                    </div>
                </div>
            </div>

            {/* SHARE BUTTON */}
            <button
                onClick={handleShare}
                className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-full font-bold shadow-xl hover:bg-slate-100 hover:scale-105 transition-all text-sm"
            >
                <Share2 size={18} /> Compartilhar Conquista
            </button>
        </div>
    );
};

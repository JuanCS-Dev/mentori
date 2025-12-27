import React from 'react';
import { Clock, BookOpen, Brain, PenTool, CheckCircle, Circle } from 'lucide-react';
import { NeuroStudyPlanJSON } from '../../types';

interface TodayPlanProps {
  studyPlan: NeuroStudyPlanJSON | null;
  onStartBlock?: (blockIndex: number) => void;
}

interface StudyBlock {
  horario: string;
  atividade: string;
  metodo: string;
  energia: 'Alta' | 'Media' | 'Baixa';
  completed: boolean;
}

export const TodayPlan: React.FC<TodayPlanProps> = ({ studyPlan, onStartBlock }) => {
  const blocks = studyPlan?.blocos_estudo || getDefaultBlocks();

  // Simulate some completed blocks
  const blocksWithStatus: StudyBlock[] = blocks.slice(0, 4).map((block, i) => ({
    horario: block.horario,
    atividade: block.atividade,
    metodo: block.metodo,
    energia: block.energia_exigida === 'Alta' ? 'Alta' : block.energia_exigida === 'Média' ? 'Media' : 'Baixa',
    completed: i < 1 // First block completed
  }));

  const completedCount = blocksWithStatus.filter(b => b.completed).length;
  const progress = (completedCount / blocksWithStatus.length) * 100;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
          Plano de Hoje
        </h3>
        <span className="text-xs text-slate-400">
          {completedCount}/{blocksWithStatus.length} concluidos
        </span>
      </div>

      {/* Progress Ring */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="#e2e8f0"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="url(#progressGradient)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${progress * 1.76} 176`}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-slate-900">{Math.round(progress)}%</span>
          </div>
        </div>
        <div>
          <div className="font-bold text-slate-900">Progresso Diario</div>
          <div className="text-sm text-slate-500">
            {studyPlan?.diagnostico?.estrategia_adotada || 'Continue focado nos seus objetivos!'}
          </div>
        </div>
      </div>

      {/* Study Blocks */}
      <div className="space-y-3">
        {blocksWithStatus.map((block, index) => (
          <div
            key={index}
            className={`flex items-center gap-4 p-3 rounded-lg border transition-colors cursor-pointer ${
              block.completed
                ? 'bg-green-50 border-green-200'
                : 'bg-slate-50 border-slate-200 hover:border-blue-300'
            }`}
            onClick={() => !block.completed && onStartBlock?.(index)}
          >
            {/* Status Icon */}
            <div className={`shrink-0 ${block.completed ? 'text-green-500' : 'text-slate-300'}`}>
              {block.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">{block.horario}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                  block.energia === 'Alta' ? 'bg-red-100 text-red-700' :
                  block.energia === 'Media' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {block.energia}
                </span>
              </div>
              <div className="font-medium text-slate-900 truncate">{block.atividade}</div>
              <div className="text-xs text-slate-500">{block.metodo}</div>
            </div>

            {/* Icon */}
            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
              block.completed ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
            }`}>
              {getBlockIcon(block.atividade)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function getBlockIcon(atividade: string) {
  const lower = atividade.toLowerCase();
  if (lower.includes('leitura') || lower.includes('teoria')) return <BookOpen size={16} />;
  if (lower.includes('questao') || lower.includes('exercicio')) return <PenTool size={16} />;
  if (lower.includes('revisao') || lower.includes('flashcard')) return <Brain size={16} />;
  return <Clock size={16} />;
}

function getDefaultBlocks() {
  return [
    { horario: '08:00', atividade: 'Leitura Ativa', metodo: 'Tecnica Pomodoro', energia_exigida: 'Alta' as const },
    { horario: '10:00', atividade: 'Questoes CEBRASPE', metodo: 'Revisao Espacada', energia_exigida: 'Alta' as const },
    { horario: '14:00', atividade: 'Flashcards', metodo: 'Anki Method', energia_exigida: 'Média' as const },
    { horario: '16:00', atividade: 'Revisao Geral', metodo: 'Mind Map', energia_exigida: 'Baixa' as const }
  ];
}

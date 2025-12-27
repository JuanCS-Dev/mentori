import React from 'react';
import { Play, RotateCcw, FileText, Brain, ArrowRight } from 'lucide-react';
import { AppView } from '../../types';

interface QuickActionsProps {
  onNavigate: (view: AppView) => void;
  pendingReviews?: number;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onNavigate, pendingReviews = 12 }) => {
  const actions = [
    {
      id: 'continue',
      icon: Play,
      title: 'Continuar Estudando',
      description: 'Retome de onde parou',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      view: AppView.STUDY_CYCLE
    },
    {
      id: 'review',
      icon: RotateCcw,
      title: 'Revisar Erros',
      description: `${pendingReviews} questoes pendentes`,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      view: AppView.QUESTIONS,
      badge: pendingReviews
    },
    {
      id: 'simulate',
      icon: FileText,
      title: 'Simular Prova',
      description: 'Teste completo cronometrado',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      view: AppView.QUESTIONS
    },
    {
      id: 'mentor',
      icon: Brain,
      title: 'Falar com Mentor',
      description: 'Tire suas duvidas',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      view: AppView.DASHBOARD
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
        Acoes Rapidas
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onNavigate(action.view)}
              className={`group relative p-4 rounded-xl text-white text-left transition-all ${action.color} ${action.hoverColor} hover:scale-[1.02] hover:shadow-lg`}
            >
              {/* Badge */}
              {action.badge && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                  {action.badge}
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="font-bold text-sm mb-0.5">{action.title}</div>
              <div className="text-xs text-white/70">{action.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

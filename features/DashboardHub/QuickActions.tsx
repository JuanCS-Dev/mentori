import React from "react";
import {
  Play,
  RotateCcw,
  FileText,
  Brain,
  ArrowRight,
  Zap,
} from "lucide-react";
import { AppView } from "../../types";

interface QuickActionsProps {
  onNavigate: (view: AppView) => void;
  pendingReviews?: number;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onNavigate,
  pendingReviews = 12,
}) => {
  const actions = [
    {
      id: "continue",
      icon: Play,
      title: "RESUME MISSION",
      description: "DEPLOY TO PREVIOUS SECTOR",
      color: "border-[#00F0FF]/30 text-[#00F0FF]",
      glow: "shadow-[0_0_15px_rgba(0,240,255,0.1)]",
      view: AppView.STUDY_CYCLE,
    },
    {
      id: "review",
      icon: RotateCcw,
      title: "RECOVERY PROTOCOL",
      description: `${pendingReviews} FAULTS DETECTED`,
      color: "border-orange-500/30 text-orange-500",
      glow: "shadow-[0_0_15px_rgba(249,115,22,0.1)]",
      view: AppView.QUESTIONS,
      badge: pendingReviews,
    },
    {
      id: "simulate",
      icon: FileText,
      title: "BATTLE SIMULATION",
      description: "TIMED OPERATIVE DRILL",
      color: "border-purple-500/30 text-purple-500",
      glow: "shadow-[0_0_15px_rgba(168,85,247,0.1)]",
      view: AppView.QUESTIONS,
    },
    {
      id: "mentor",
      icon: Brain,
      title: "STRATEGIC COMLINK",
      description: "ACCESS TACTICAL ADVICE",
      color: "border-green-500/30 text-green-500",
      glow: "shadow-[0_0_15px_rgba(34,197,94,0.1)]",
      view: AppView.DASHBOARD,
    },
  ];

  return (
    <div className="bg-[#121216] rounded-lg border border-zinc-900 p-8 relative overflow-hidden group">
      <div className="flex items-center gap-3 mb-8">
        <Zap size={16} className="text-[#00F0FF]" />
        <h3 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-[0.3em]">
          Quick Directives
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onNavigate(action.view)}
              className={`group relative p-5 rounded border bg-black/40 text-left transition-all duration-300 hover:scale-[1.01] ${action.color} ${action.glow} hover:bg-zinc-900/50 hover:border-white/20`}
            >
              {/* Badge */}
              {action.badge && (
                <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-red-600 text-white text-[8px] font-black font-mono rounded shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse">
                  {action.badge} FAULTS
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded border border-zinc-800 flex items-center justify-center group-hover:border-[#00F0FF]/30 transition-colors bg-black">
                  <Icon size={18} />
                </div>
                <ArrowRight
                  size={14}
                  className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-white"
                />
              </div>

              <div className="font-black text-xs mb-1 tracking-widest text-white uppercase italic">
                {action.title}
              </div>
              <div className="text-[9px] font-mono text-zinc-500 group-hover:text-zinc-400 transition-colors uppercase tracking-widest">
                {action.description}
              </div>

              {/* Corner Accent */}
              <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-zinc-800 group-hover:border-[#00F0FF]/50 transition-colors"></div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

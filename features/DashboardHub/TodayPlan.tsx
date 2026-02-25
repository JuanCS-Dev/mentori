import React from "react";
import {
  Clock,
  BookOpen,
  Brain,
  PenTool,
  CheckCircle,
  Circle,
  Target,
  Shield,
} from "lucide-react";
import { NeuroStudyPlanJSON } from "../../types";

interface TodayPlanProps {
  studyPlan: NeuroStudyPlanJSON | null;
  onStartBlock?: (blockIndex: number) => void;
}

interface StudyBlock {
  horario: string;
  atividade: string;
  metodo: string;
  energia: "Alta" | "Media" | "Baixa";
  completed: boolean;
}

export const TodayPlan: React.FC<TodayPlanProps> = ({
  studyPlan,
  onStartBlock,
}) => {
  const blocks = studyPlan?.blocos_estudo || getDefaultBlocks();

  const blocksWithStatus: StudyBlock[] = blocks.slice(0, 4).map((block, i) => ({
    horario: block.horario,
    atividade: block.atividade,
    metodo: block.metodo,
    energia:
      block.energia_exigida === "Alta"
        ? "Alta"
        : block.energia_exigida === "Média"
          ? "Media"
          : "Baixa",
    completed: i < 1,
  }));

  const completedCount = blocksWithStatus.filter((b) => b.completed).length;
  const progress = (completedCount / blocksWithStatus.length) * 100;

  return (
    <div className="bg-[#121216] rounded-lg border border-zinc-900 p-8 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Target size={16} className="text-[#00F0FF]" />
          <h3 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-[0.3em]">
            Deployment Timeline
          </h3>
        </div>
        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
          {completedCount}/{blocksWithStatus.length} OBJECTIVES SECURED
        </span>
      </div>

      {/* Progress Stats */}
      <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-8 border-b border-zinc-900/50">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="44"
              stroke="#09090B"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="48"
              cy="48"
              r="44"
              stroke="#00F0FF"
              strokeWidth="4"
              fill="none"
              strokeLinecap="butt"
              strokeDasharray={`${progress * 2.76} 276`}
              className="transition-all duration-1000 ease-out shadow-[0_0_15px_#00F0FF]"
              style={{ filter: "drop-shadow(0 0 5px #00F0FF)" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white italic font-mono">
              {Math.round(progress)}%
            </span>
            <span className="text-[8px] text-zinc-600 font-mono uppercase tracking-widest">
              Done
            </span>
          </div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="text-xs font-mono font-bold text-white uppercase tracking-widest mb-2 flex items-center justify-center md:justify-start gap-2">
            <Shield size={14} className="text-[#00F0FF]" />
            Active Strategy
          </div>
          <div className="text-sm text-zinc-400 italic">
            "
            {studyPlan?.diagnostico?.estrategia_adotada ||
              "Target acquired. Execute current sequence with maximum precision."}
            "
          </div>
        </div>
      </div>

      {/* Deployment Blocks */}
      <div className="space-y-4">
        {blocksWithStatus.map((block, index) => (
          <div
            key={index}
            className={`flex items-center gap-5 p-4 rounded border transition-all duration-300 group/block ${
              block.completed
                ? "bg-zinc-900/30 border-zinc-800 opacity-60"
                : "bg-black/40 border-zinc-800 hover:border-[#00F0FF]/40 cursor-pointer shadow-lg"
            }`}
            onClick={() => !block.completed && onStartBlock?.(index)}
          >
            {/* Status Icon */}
            <div
              className={`shrink-0 transition-colors ${
                block.completed
                  ? "text-green-500"
                  : "text-zinc-800 group-hover/block:text-[#00F0FF]"
              }`}
            >
              {block.completed ? (
                <CheckCircle size={22} />
              ) : (
                <Circle size={22} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] font-mono text-zinc-500 tracking-widest">
                  {block.horario}Z
                </span>
                <span
                  className={`text-[8px] px-2 py-0.5 rounded-full uppercase font-bold tracking-[0.2em] border ${
                    block.energia === "Alta"
                      ? "border-red-500/30 text-red-500 bg-red-500/5"
                      : block.energia === "Media"
                        ? "border-yellow-500/30 text-yellow-500 bg-yellow-500/5"
                        : "border-blue-500/30 text-blue-500 bg-blue-500/5"
                  }`}
                >
                  {block.energia} Load
                </span>
              </div>
              <div
                className={`font-bold text-sm tracking-tight uppercase ${
                  block.completed ? "text-zinc-500 line-through" : "text-white"
                }`}
              >
                {block.atividade}
              </div>
              <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest mt-1 group-hover/block:text-zinc-400 transition-colors">
                Method: {block.metodo}
              </div>
            </div>

            {/* Tactical Icon */}
            <div
              className={`shrink-0 w-10 h-10 rounded border flex items-center justify-center transition-all ${
                block.completed
                  ? "bg-zinc-900/50 border-zinc-800 text-zinc-700"
                  : "bg-black border-zinc-800 text-zinc-500 group-hover/block:border-[#00F0FF]/30 group-hover/block:text-[#00F0FF]"
              }`}
            >
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
  if (lower.includes("leitura") || lower.includes("teoria"))
    return <BookOpen size={18} />;
  if (lower.includes("questao") || lower.includes("exercicio"))
    return <PenTool size={18} />;
  if (lower.includes("revisao") || lower.includes("flashcard"))
    return <Brain size={18} />;
  return <Clock size={18} />;
}

function getDefaultBlocks() {
  return [
    {
      horario: "08:00",
      atividade: "Active Intel Gathering",
      metodo: "Pomodoro Protocol",
      energia_exigida: "Alta" as const,
    },
    {
      horario: "10:00",
      atividade: "Neural Drill: CEBRASPE",
      metodo: "Spaced Repetition",
      energia_exigida: "Alta" as const,
    },
    {
      horario: "14:00",
      atividade: "Memory Flash Cards",
      metodo: "Anki Subsystem",
      energia_exigida: "Média" as const,
    },
    {
      horario: "16:00",
      atividade: "Tactical Review",
      metodo: "Neural Mapping",
      energia_exigida: "Baixa" as const,
    },
  ];
}

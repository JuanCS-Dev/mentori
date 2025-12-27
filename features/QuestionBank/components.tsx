import React from 'react';
import { Target, TrendingUp, Star, Zap, BookOpen, Clock, Sparkles, Play, RotateCcw } from 'lucide-react';

// =============================================================================
// STATS BAR
// =============================================================================

export interface StatsBarProps {
  questionsAnswered: number;
  accuracy: number;
  disciplineAccuracy: number;
  currentDiscipline: string;
  xp: number;
  dueReviews: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  questionsAnswered,
  accuracy,
  disciplineAccuracy,
  currentDiscipline,
  xp,
  dueReviews
}) => {
  return (
    <div className="flex items-center justify-between bg-white px-2 py-2 rounded-2xl border border-gray-100 shadow-sm mobile-stack">
      <div className="flex items-center gap-1 md:gap-4 overflow-x-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
          <Target size={16} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-700 font-mono">
            {questionsAnswered} questoes
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100">
          <TrendingUp size={16} className="text-emerald-500" />
          <span className="text-xs font-bold text-emerald-700 font-mono">
            {accuracy}% acerto
          </span>
        </div>
        {dueReviews > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-100 animate-pulse">
            <RotateCcw size={16} className="text-purple-500" />
            <span className="text-xs font-bold text-purple-700 font-mono">
              {dueReviews} revisoes
            </span>
          </div>
        )}
        {disciplineAccuracy > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100">
            <Star size={16} className="text-amber-500" />
            <span className="text-xs font-bold text-amber-700 font-mono">
              {disciplineAccuracy}% {currentDiscipline.split(' ')[0]}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-200 ml-4">
        <Zap size={14} className="fill-white text-white" />
        <span className="text-xs font-bold font-mono tracking-wider">{xp} XP</span>
      </div>
    </div>
  );
};

// =============================================================================
// MODE SELECTOR
// =============================================================================

export type QuestionMode = 'questoes' | 'simulado' | 'gerador';

export interface ModeSelectorProps {
  mode: QuestionMode;
  onModeChange: (mode: QuestionMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, onModeChange }) => {
  return (
    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit mx-auto">
      <button
        onClick={() => onModeChange('questoes')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs font-bold transition-all ${
          mode === 'questoes'
            ? 'bg-white text-black shadow-sm'
            : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        <BookOpen size={14} />
        QUESTOES
      </button>
      <button
        onClick={() => onModeChange('simulado')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs font-bold transition-all ${
          mode === 'simulado'
            ? 'bg-white text-black shadow-sm'
            : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        <Clock size={14} />
        SIMULADO
      </button>
      <button
        onClick={() => onModeChange('gerador')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs font-bold transition-all ${
          mode === 'gerador'
            ? 'bg-white text-black shadow-sm'
            : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        <Sparkles size={14} />
        GERADOR IA
      </button>
    </div>
  );
};

// =============================================================================
// SIMULADO CONTROLS
// =============================================================================

export type SimuladoLevel = 'treino' | 'simulado' | 'desafio';

export interface SimuladoConfig {
  level: SimuladoLevel;
  questionCount: number;
  timeLimit: number;
  discipline: string;
  useAI: boolean;
}

export interface DbMeta {
  years: number[];
  disciplinas: string[];
  count: number;
}

export interface SimuladoControlsProps {
  dbMeta: DbMeta;
  loading: boolean;
  userAccuracy?: number;
  onStart: (config: SimuladoConfig) => void;
}

const SIMULADO_LEVELS = {
  treino: {
    name: 'Treino',
    description: 'Pratique por disciplina com questoes reais',
    icon: BookOpen,
    color: 'emerald',
    defaultQuestions: 10,
    defaultTime: 0,
    useAI: false
  },
  simulado: {
    name: 'Simulado',
    description: 'Prova completa no formato oficial',
    icon: Clock,
    color: 'indigo',
    defaultQuestions: 120,
    defaultTime: 240,
    useAI: false
  },
  desafio: {
    name: 'Desafio IA',
    description: 'Questoes personalizadas para nivel avancado',
    icon: Sparkles,
    color: 'amber',
    defaultQuestions: 20,
    defaultTime: 60,
    useAI: true
  }
};

export const SimuladoControls: React.FC<SimuladoControlsProps> = ({ dbMeta, loading, userAccuracy = 0, onStart }) => {
  const [level, setLevel] = React.useState<SimuladoLevel>('treino');
  const [config, setConfig] = React.useState<Omit<SimuladoConfig, 'level' | 'useAI'>>({
    questionCount: 10,
    timeLimit: 0,
    discipline: ''
  });

  const isDesafioUnlocked = userAccuracy >= 70;

  const handleLevelChange = (newLevel: SimuladoLevel) => {
    setLevel(newLevel);
    const levelConfig = SIMULADO_LEVELS[newLevel];
    setConfig({
      ...config,
      questionCount: levelConfig.defaultQuestions,
      timeLimit: levelConfig.defaultTime
    });
  };

  return (
    <div className="space-y-4">
      {/* Level Selector */}
      <div className="grid grid-cols-3 gap-3">
        {(Object.entries(SIMULADO_LEVELS) as [SimuladoLevel, typeof SIMULADO_LEVELS.treino][]).map(([key, lvl]) => {
          const Icon = lvl.icon;
          const isLocked = key === 'desafio' && !isDesafioUnlocked;
          const isSelected = level === key;

          return (
            <button
              key={key}
              onClick={() => !isLocked && handleLevelChange(key)}
              disabled={isLocked}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? `border-${lvl.color}-500 bg-${lvl.color}-50`
                  : isLocked
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {isLocked && (
                <div className="absolute top-2 right-2">
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                    70%+ PARA DESBLOQUEAR
                  </span>
                </div>
              )}
              <div className={`p-2 rounded-lg w-fit mb-2 ${
                isSelected ? `bg-${lvl.color}-100` : 'bg-gray-100'
              }`}>
                <Icon size={18} className={isSelected ? `text-${lvl.color}-600` : 'text-gray-500'} />
              </div>
              <h4 className={`font-bold text-sm ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                {lvl.name}
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5">{lvl.description}</p>
              {key === 'desafio' && (
                <span className="inline-block mt-2 text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                  USA IA
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Config Panel */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
              QUESTOES
            </label>
            <select
              className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-mono"
              value={config.questionCount}
              onChange={e => setConfig({ ...config, questionCount: parseInt(e.target.value) })}
            >
              {level === 'treino' && (
                <>
                  <option value={5}>5 questoes</option>
                  <option value={10}>10 questoes</option>
                  <option value={20}>20 questoes</option>
                  <option value={30}>30 questoes</option>
                </>
              )}
              {level === 'simulado' && (
                <>
                  <option value={60}>60 questoes (Meia prova)</option>
                  <option value={100}>100 questoes</option>
                  <option value={120}>120 questoes (Prova completa)</option>
                </>
              )}
              {level === 'desafio' && (
                <>
                  <option value={10}>10 questoes</option>
                  <option value={20}>20 questoes</option>
                  <option value={30}>30 questoes</option>
                </>
              )}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
              TEMPO
            </label>
            <select
              className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-mono"
              value={config.timeLimit}
              onChange={e => setConfig({ ...config, timeLimit: parseInt(e.target.value) })}
            >
              <option value={0}>Sem limite</option>
              {level !== 'treino' && (
                <>
                  <option value={60}>1 hora</option>
                  <option value={120}>2 horas</option>
                  <option value={180}>3 horas</option>
                  <option value={240}>4 horas</option>
                </>
              )}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
              DISCIPLINA
            </label>
            <select
              className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-mono"
              value={config.discipline}
              onChange={e => setConfig({ ...config, discipline: e.target.value })}
            >
              <option value="">Todas as disciplinas</option>
              {dbMeta.disciplinas.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => onStart({
                ...config,
                level,
                useAI: SIMULADO_LEVELS[level].useAI
              })}
              disabled={loading || (level === 'desafio' && !isDesafioUnlocked)}
              className={`w-full h-10 px-6 rounded-lg font-mono text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                level === 'treino'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : level === 'simulado'
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              <Play size={16} />
              {level === 'treino' ? 'PRATICAR' : level === 'simulado' ? 'INICIAR' : 'DESAFIAR'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              level === 'desafio' ? 'bg-amber-500' : 'bg-emerald-500'
            }`}></div>
            <span className="text-xs text-gray-400 font-mono">
              {level === 'desafio'
                ? 'Questoes geradas por IA (custo por uso)'
                : `${dbMeta.count.toLocaleString()} questoes reais disponiveis`
              }
            </span>
          </div>
          {userAccuracy > 0 && (
            <span className="text-xs text-gray-500 font-mono">
              Seu desempenho: <span className="font-bold text-gray-700">{userAccuracy}%</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

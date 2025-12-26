import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Star, Zap, BookOpen, Clock, Sparkles, Play } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { QuestionsService, RealQuestion } from '../services/questionsService';
import { QuestionsDB } from '../services/database';
import { QuestionAutopsy } from '../types';
import { useProgress } from '../hooks/usePersistence';
import { QuestionCard, DisplayQuestion, EmptyState } from '../components/QuestionCard';
import {
  AIControls,
  ConcursoControls,
  ProgressIndicator
} from '../components/QuestionControls';

type QuestionMode = 'questoes' | 'simulado' | 'gerador';

export const QuestionBank: React.FC = () => {
  const [mode, setMode] = useState<QuestionMode>('questoes');
  const [params, setParams] = useState({
    discipline: '',  // Vazio = todas disciplinas
    topic: '',
    bank: 'CEBRASPE',
    difficulty: 'Medio'
  });
  const [loading, setLoading] = useState(false);
  const [analyzingError, setAnalyzingError] = useState(false);
  const [question, setQuestion] = useState<DisplayQuestion | null>(null);
  const [realQuestions, setRealQuestions] = useState<RealQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [errorAutopsy, setErrorAutopsy] = useState<QuestionAutopsy | null>(null);
  const [xpGained, setXpGained] = useState<number | null>(null);

  const { progress, recordQuestionAnswer, getAccuracy, getDisciplineAccuracy } = useProgress();

  const [filters, setFilters] = useState({
    bank: 'Todas',
    year: 0, // 0 = todos os anos
    difficulty: 'Qualquer'
  });

  // Metadados do banco de questões
  const [dbMeta, setDbMeta] = useState({
    years: [] as number[],
    disciplinas: [] as string[],
    count: 0
  });

  // Carregar metadados do banco ao montar
  useEffect(() => {
    const loadDbMeta = async () => {
      try {
        const [years, disciplinas, count] = await Promise.all([
          QuestionsDB.getAnos(),
          QuestionsDB.getDisciplinas(),
          QuestionsDB.count()
        ]);
        setDbMeta({ years, disciplinas, count });
      } catch (e) {
        console.error('Erro ao carregar metadados:', e);
      }
    };
    loadDbMeta();
  }, []);

  // Buscar questões reais do banco
  const handleSearch = async () => {
    setLoading(true);
    setShowAnswer(false);
    setSelectedOption(null);
    setQuestion(null);
    setErrorAutopsy(null);
    setRealQuestions([]);
    setCurrentQuestionIndex(0);

    try {
      const questions = await QuestionsService.fetchConcursoQuestions({
        discipline: params.discipline,
        bank: filters.bank,
        year: filters.year,
        difficulty: filters.difficulty,
        limit: 10
      });

      if (questions.length > 0) {
        setRealQuestions(questions);
        const first = questions[0];
        if (first) {
          setQuestion({
            id: first.id,
            statement: first.statement,
            options: first.options,
            correctAnswer: first.correctAnswer,
            discipline: first.discipline,
            year: first.year,
            source: 'CONCURSO',
            bank: first.bank,
            role: first.role,
            contextId: first.contextId,
            contextText: first.contextText,
            command: first.command,
            explanation: first.explanation
          });
        }
      } else {
        alert('Nenhuma questão encontrada para estes filtros.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao buscar questões.');
    } finally {
      setLoading(false);
    }
  };

  // Iniciar simulado (com níveis)
  const handleStartSimulado = async (config: {
    level: string;
    questionCount: number;
    timeLimit: number;
    discipline: string;
    useAI: boolean;
  }) => {
    setLoading(true);
    setShowAnswer(false);
    setSelectedOption(null);
    setQuestion(null);
    setErrorAutopsy(null);
    setRealQuestions([]);
    setCurrentQuestionIndex(0);

    try {
      if (config.useAI) {
        // Desafio IA - gerar questões personalizadas
        const aiQuestions: RealQuestion[] = [];
        for (let i = 0; i < Math.min(config.questionCount, 10); i++) {
          const q = await GeminiService.generateQuestion(
            config.discipline || 'Direito Constitucional',
            'Questão avançada',
            'CEBRASPE',
            'Dificil'
          );
          aiQuestions.push({
            id: `ai_desafio_${Date.now()}_${i}`,
            year: new Date().getFullYear(),
            source: 'CONCURSO',
            discipline: q.discipline,
            statement: q.statement,
            options: q.options,
            correctAnswer: q.correctAnswer,
            bank: 'IA Personalizada'
          });
        }

        if (aiQuestions.length > 0) {
          setRealQuestions(aiQuestions);
          const first = aiQuestions[0];
          if (first) {
            setQuestion({
              id: first.id,
              statement: first.statement,
              options: first.options,
              correctAnswer: first.correctAnswer,
              discipline: first.discipline,
              year: first.year,
              source: 'CONCURSO',
              bank: first.bank,
              role: 'IA Personalizada',
              contextId: first.contextId,
              contextText: first.contextText,
              command: first.command
            });
          }
        }
      } else {
        // Treino ou Simulado - questões reais do banco
        const questions = await QuestionsService.fetchConcursoQuestions({
          discipline: config.discipline,
          limit: config.questionCount
        });

        if (questions.length > 0) {
          setRealQuestions(questions);
          const first = questions[0];
          if (first) {
            setQuestion({
              id: first.id,
              statement: first.statement,
              options: first.options,
              correctAnswer: first.correctAnswer,
              discipline: first.discipline,
              year: first.year,
              source: 'CONCURSO',
              bank: first.bank,
              role: first.role,
              contextId: first.contextId,
              contextText: first.contextText,
              command: first.command,
              explanation: first.explanation
            });
          }
        } else {
          alert('Nenhuma questão encontrada para estes filtros.');
        }
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao iniciar simulado.');
    } finally {
      setLoading(false);
    }
  };

  // Gerar questão com IA (modo secundário)
  const handleGenerateAI = async () => {
    setLoading(true);
    setShowAnswer(false);
    setSelectedOption(null);
    setQuestion(null);
    setErrorAutopsy(null);
    setRealQuestions([]);

    try {
      const q = await GeminiService.generateQuestion(
        params.discipline || 'Direito Constitucional',
        params.topic || 'Tópico Geral',
        params.bank,
        params.difficulty
      );
      setQuestion({
        id: `ai_${Date.now()}`,
        statement: q.statement,
        options: q.options,
        correctAnswer: q.correctAnswer,
        discipline: q.discipline,
        bank: q.bank,
        comment: q.comment,
        trap: q.trap
      });
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar questão com IA.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextRealQuestion = () => {
    if (realQuestions.length === 0) return;

    const nextIndex = (currentQuestionIndex + 1) % realQuestions.length;
    setCurrentQuestionIndex(nextIndex);
    setShowAnswer(false);
    setSelectedOption(null);
    setErrorAutopsy(null);

    const next = realQuestions[nextIndex];
    if (next) {
      setQuestion({
        id: next.id,
        statement: next.statement,
        options: next.options,
        correctAnswer: next.correctAnswer,
        discipline: next.discipline,
        year: next.year,
        source: next.source,
        bank: next.bank,
        role: next.role,
        contextId: next.contextId,
        contextText: next.contextText,
        command: next.command,
        explanation: next.explanation
      });
    }
  };

  const handleOptionSelect = (index: number) => {
    if (showAnswer || !question) return;
    setSelectedOption(index);
    setShowAnswer(true);

    const isCorrect = index === question.correctAnswer;
    const discipline = question.discipline || params.discipline || 'Geral';
    recordQuestionAnswer(discipline, isCorrect);

    const baseXp = isCorrect ? 25 : 10;
    const xp = mode === 'questoes' ? baseXp + 5 : baseXp; // Bonus for real questions
    setXpGained(xp);
    setTimeout(() => setXpGained(null), 2000);
  };

  const handleAutopsy = async () => {
    if (!question || selectedOption === null) return;
    setAnalyzingError(true);
    try {
      const result = await GeminiService.analyzeQuestionError(
        question.statement,
        question.options[selectedOption] ?? '',
        question.options[question.correctAnswer] ?? ''
      );
      setErrorAutopsy(result);
    } catch (e) {
      console.error(e);
      alert('Erro na autopsia.');
    } finally {
      setAnalyzingError(false);
    }
  };

  const currentDiscipline = question?.discipline || params.discipline || 'Geral';
  const disciplineAccuracy = getDisciplineAccuracy(currentDiscipline);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {xpGained !== null && (
        <div className="fixed top-20 right-8 z-50 animate-in slide-in-from-right fade-in duration-300">
          <div className="bg-white border border-kitchen-border px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 font-bold font-mono text-amber-600">
            <Zap size={20} className="fill-amber-600" />
            +{xpGained} XP
          </div>
        </div>
      )}

      <StatsBar
        questionsAnswered={progress.questionsAnswered}
        accuracy={getAccuracy()}
        disciplineAccuracy={disciplineAccuracy}
        currentDiscipline={currentDiscipline}
        xp={progress.xp}
      />

      {/* Mode Selector - Tabs */}
      <ModeSelector mode={mode} onModeChange={setMode} />

      {/* Modo: Questões Reais */}
      {mode === 'questoes' && (
        <ConcursoControls
          discipline={params.discipline}
          loading={loading}
          filters={filters}
          availableYears={dbMeta.years}
          availableDisciplinas={dbMeta.disciplinas}
          questionCount={dbMeta.count}
          onDisciplineChange={(discipline) => setParams({ ...params, discipline })}
          onFilterChange={setFilters}
          onGenerate={handleSearch}
        />
      )}

      {/* Modo: Simulado */}
      {mode === 'simulado' && (
        <SimuladoControls
          dbMeta={dbMeta}
          loading={loading}
          userAccuracy={getAccuracy()}
          onStart={handleStartSimulado}
        />
      )}

      {/* Modo: Gerador IA */}
      {mode === 'gerador' && (
        <AIControls
          params={params}
          loading={loading}
          onParamsChange={setParams}
          onGenerate={handleGenerateAI}
        />
      )}

      {realQuestions.length > 0 && (
        <ProgressIndicator
          current={currentQuestionIndex}
          total={realQuestions.length}
        />
      )}

      {question && (
        <QuestionCard
          question={question}
          questionSource={mode === 'gerador' ? 'ai' : 'concurso'}
          selectedOption={selectedOption}
          showAnswer={showAnswer}
          errorAutopsy={errorAutopsy}
          analyzingError={analyzingError}
          realQuestionsCount={realQuestions.length}
          currentQuestionIndex={currentQuestionIndex}
          onOptionSelect={handleOptionSelect}
          onAutopsy={handleAutopsy}
          onNextQuestion={handleNextRealQuestion}
          onGenerate={mode === 'gerador' ? handleGenerateAI : handleSearch}
        />
      )}

      {!question && !loading && (
        <EmptyState questionSource={mode === 'gerador' ? 'ai' : 'concurso'} />
      )}
    </div>
  );
};

interface StatsBarProps {
  questionsAnswered: number;
  accuracy: number;
  disciplineAccuracy: number;
  currentDiscipline: string;
  xp: number;
}

const StatsBar: React.FC<StatsBarProps> = ({
  questionsAnswered,
  accuracy,
  disciplineAccuracy,
  currentDiscipline,
  xp
}) => {
  return (
    <div className="flex items-center justify-between bg-white px-2 py-2 rounded-2xl border border-gray-100 shadow-sm mobile-stack">
      <div className="flex items-center gap-1 md:gap-4 overflow-x-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
          <Target size={16} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-700 font-mono">
            {questionsAnswered} questões
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100">
          <TrendingUp size={16} className="text-emerald-500" />
          <span className="text-xs font-bold text-emerald-700 font-mono">
            {accuracy}% acerto
          </span>
        </div>
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

// Mode Selector Component
type QuestionModeType = 'questoes' | 'simulado' | 'gerador';

interface ModeSelectorProps {
  mode: QuestionModeType;
  onModeChange: (mode: QuestionModeType) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, onModeChange }) => {
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
        QUESTÕES
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

// Simulado Controls Component
type SimuladoLevel = 'treino' | 'simulado' | 'desafio';

interface SimuladoConfig {
  level: SimuladoLevel;
  questionCount: number;
  timeLimit: number;
  discipline: string;
  useAI: boolean;
}

interface SimuladoControlsProps {
  dbMeta: { years: number[]; disciplinas: string[]; count: number };
  loading: boolean;
  userAccuracy?: number; // Para mostrar se o aluno está pronto para Desafio IA
  onStart: (config: SimuladoConfig) => void;
}

const SIMULADO_LEVELS = {
  treino: {
    name: 'Treino',
    description: 'Pratique por disciplina com questões reais',
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
    description: 'Questões personalizadas para nível avançado',
    icon: Sparkles,
    color: 'amber',
    defaultQuestions: 20,
    defaultTime: 60,
    useAI: true
  }
};

const SimuladoControls: React.FC<SimuladoControlsProps> = ({ dbMeta, loading, userAccuracy = 0, onStart }) => {
  const [level, setLevel] = React.useState<SimuladoLevel>('treino');
  const [config, setConfig] = React.useState<Omit<SimuladoConfig, 'level' | 'useAI'>>({
    questionCount: 10,
    timeLimit: 0,
    discipline: ''
  });

  const currentLevel = SIMULADO_LEVELS[level];
  const isDesafioUnlocked = userAccuracy >= 70; // Precisa de 70%+ para desbloquear Desafio IA

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
              QUESTÕES
            </label>
            <select
              className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-mono"
              value={config.questionCount}
              onChange={e => setConfig({ ...config, questionCount: parseInt(e.target.value) })}
            >
              {level === 'treino' && (
                <>
                  <option value={5}>5 questões</option>
                  <option value={10}>10 questões</option>
                  <option value={20}>20 questões</option>
                  <option value={30}>30 questões</option>
                </>
              )}
              {level === 'simulado' && (
                <>
                  <option value={60}>60 questões (Meia prova)</option>
                  <option value={100}>100 questões</option>
                  <option value={120}>120 questões (Prova completa)</option>
                </>
              )}
              {level === 'desafio' && (
                <>
                  <option value={10}>10 questões</option>
                  <option value={20}>20 questões</option>
                  <option value={30}>30 questões</option>
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
                ? 'Questões geradas por IA (custo por uso)'
                : `${dbMeta.count.toLocaleString()} questões reais disponíveis`
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

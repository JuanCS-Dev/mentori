import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { GeminiService } from '../../services/geminiService';
import { QuestionsService, RealQuestion } from '../../services/questionsService';
import { QuestionsDB } from '../../services/database';
import { QuestionAutopsy } from '../../types';
import { useProgress } from '../../hooks/usePersistence';
import { useQuestionReview } from '../../hooks/useQuestionReview';
import { QuestionCard, DisplayQuestion, EmptyState, ReviewBadgeType } from '../../components/QuestionCard';
import { SkeletonQuestion } from '../../components/LoadingStates';
import { NoQuestions } from '../../components/EmptyStates';
import {
  AIControls,
  ConcursoControls,
  ProgressIndicator
} from '../../components/QuestionControls';
import {
  StatsBar,
  ModeSelector,
  SimuladoControls,
  QuestionMode,
  SimuladoConfig,
  DbMeta
} from './components';

export const QuestionBank: React.FC = () => {
  const [mode, setMode] = useState<QuestionMode>('questoes');
  const [params, setParams] = useState({
    discipline: '',
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
  const [noQuestionsFound, setNoQuestionsFound] = useState(false);

  const { progress, recordQuestionAnswer, getAccuracy, getDisciplineAccuracy } = useProgress();
  const {
    recordAnswer: recordSRSAnswer,
    prioritizeQuestions,
    applyInterleaving,
    getQuestionCard,
    isQuestionDue,
    stats: srsStats
  } = useQuestionReview();

  // Compute review badge for current question
  const currentQuestionId = question?.id || '';
  const currentCard = getQuestionCard(currentQuestionId);
  const isDue = isQuestionDue(currentQuestionId);

  const reviewBadge: ReviewBadgeType = currentCard ? (
    currentCard.consecutiveIncorrect > 2 ? 'struggling' :
      currentCard.interval >= 21 ? 'mature' :
        isDue ? 'due' : 'learning'
  ) : null;

  const [filters, setFilters] = useState({
    bank: 'Todas',
    year: 0,
    difficulty: 'Qualquer'
  });

  const [dbMeta, setDbMeta] = useState<DbMeta>({
    years: [],
    disciplinas: [],
    count: 0
  });

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

  const handleSearch = async () => {
    setLoading(true);
    setShowAnswer(false);
    setSelectedOption(null);
    setQuestion(null);
    setErrorAutopsy(null);
    setRealQuestions([]);
    setCurrentQuestionIndex(0);
    setNoQuestionsFound(false);

    try {
      let questions = await QuestionsService.fetchConcursoQuestions({
        discipline: params.discipline,
        bank: filters.bank,
        year: filters.year,
        difficulty: filters.difficulty,
        limit: 20
      });

      if (questions.length > 0) {
        questions = prioritizeQuestions(questions);
        questions = applyInterleaving(questions, 0.7);
        questions = questions.slice(0, 10);

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
            explanation: first.explanation,
            aiExplanation: first.aiExplanation
          });
        }
      } else {
        setNoQuestionsFound(true);
      }
    } catch (e) {
      console.error(e);
      setNoQuestionsFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSimulado = async (config: SimuladoConfig) => {
    setLoading(true);
    setShowAnswer(false);
    setSelectedOption(null);
    setQuestion(null);
    setErrorAutopsy(null);
    setRealQuestions([]);
    setCurrentQuestionIndex(0);
    setNoQuestionsFound(false);

    try {
      if (config.useAI) {
        const aiQuestions: RealQuestion[] = [];
        for (let i = 0; i < Math.min(config.questionCount, 10); i++) {
          const q = await GeminiService.generateQuestion(
            config.discipline || 'Direito Constitucional',
            'Questao avancada',
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
              explanation: first.explanation,
              aiExplanation: first.aiExplanation
            });
          }
        } else {
          setNoQuestionsFound(true);
        }
      }
    } catch (e) {
      console.error(e);
      setNoQuestionsFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    setLoading(true);
    setShowAnswer(false);
    setSelectedOption(null);
    setQuestion(null);
    setErrorAutopsy(null);
    setRealQuestions([]);
    setNoQuestionsFound(false);

    try {
      const q = await GeminiService.generateQuestion(
        params.discipline || 'Direito Constitucional',
        params.topic || 'Topico Geral',
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
      setNoQuestionsFound(true);
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
        explanation: next.explanation,
        aiExplanation: next.aiExplanation
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

    const currentRealQuestion = realQuestions[currentQuestionIndex];
    if (currentRealQuestion) {
      recordSRSAnswer(currentRealQuestion, isCorrect, 'medium');
    }

    const baseXp = isCorrect ? 25 : 10;
    const xp = mode === 'questoes' ? baseXp + 5 : baseXp;
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
        dueReviews={srsStats.dueToday}
      />

      <ModeSelector mode={mode} onModeChange={setMode} />

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

      {mode === 'simulado' && (
        <SimuladoControls
          dbMeta={dbMeta}
          loading={loading}
          userAccuracy={getAccuracy()}
          onStart={handleStartSimulado}
        />
      )}

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
          reviewBadge={reviewBadge}
          onOptionSelect={handleOptionSelect}
          onAutopsy={handleAutopsy}
          onNextQuestion={handleNextRealQuestion}
          onGenerate={mode === 'gerador' ? handleGenerateAI : handleSearch}
        />
      )}

      {loading && !question && (
        <SkeletonQuestion />
      )}

      {noQuestionsFound && !loading && (
        <NoQuestions onLoad={mode === 'gerador' ? handleGenerateAI : handleSearch} />
      )}

      {!question && !loading && !noQuestionsFound && (
        <EmptyState questionSource={mode === 'gerador' ? 'ai' : 'concurso'} />
      )}
    </div>
  );
};

export default QuestionBank;

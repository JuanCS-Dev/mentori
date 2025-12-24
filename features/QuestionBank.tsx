import React, { useState } from 'react';
import { Target, TrendingUp, Star, Zap } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { QuestionsService, RealQuestion } from '../services/questionsService';
import { QuestionAutopsy } from '../types';
import { useProgress } from '../hooks/usePersistence';
import { QuestionCard, DisplayQuestion, EmptyState } from '../components/QuestionCard';
import {
  SourceSelector,
  AIControls,
  ENEMControls,
  ConcursoControls,
  ProgressIndicator
} from '../components/QuestionControls';

type QuestionSource = 'ai' | 'enem' | 'concurso';

export const QuestionBank: React.FC = () => {
  const [questionSource, setQuestionSource] = useState<QuestionSource>('ai');
  const [params, setParams] = useState({
    discipline: 'Direito Constitucional',
    topic: 'Direitos Fundamentais',
    bank: 'FGV',
    difficulty: 'Medio'
  });
  const [enemParams, setEnemParams] = useState({
    discipline: 'linguagens',
    year: 2023
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

  const enemDisciplines = QuestionsService.getAvailableDisciplines();
  const enemYears = QuestionsService.getAvailableYears();

  const handleGenerate = async () => {
    setLoading(true);
    setShowAnswer(false);
    setSelectedOption(null);
    setQuestion(null);
    setErrorAutopsy(null);
    setRealQuestions([]);
    setCurrentQuestionIndex(0);

    try {
      if (questionSource === 'ai') {
        const q = await GeminiService.generateQuestion(
          params.discipline,
          params.topic,
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
      } else if (questionSource === 'enem') {
        const questions = await QuestionsService.fetchENEMQuestions({
          discipline: enemParams.discipline,
          year: enemParams.year,
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
              source: 'ENEM',
              explanation: first.explanation
            });
          }
        } else {
          alert('Nenhuma questao encontrada para os filtros selecionados.');
        }
      } else if (questionSource === 'concurso') {
        const questions = await QuestionsService.fetchConcursoQuestions({
          discipline: params.discipline,
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
              explanation: first.explanation
            });
          }
        } else {
          alert('Nenhuma questao encontrada.');
        }
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao buscar questao.');
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
        explanation: next.explanation
      });
    }
  };

  const handleOptionSelect = (index: number) => {
    if (showAnswer || !question) return;
    setSelectedOption(index);
    setShowAnswer(true);

    const isCorrect = index === question.correctAnswer;
    const discipline = question.discipline || params.discipline;
    recordQuestionAnswer(discipline, isCorrect);

    const baseXp = isCorrect ? 25 : 10;
    const xp = questionSource !== 'ai' ? baseXp + 5 : baseXp;
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

  const currentDiscipline = question?.discipline || params.discipline;
  const disciplineAccuracy = getDisciplineAccuracy(currentDiscipline);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {xpGained !== null && (
        <div className="fixed top-20 right-8 z-50 animate-in slide-in-from-right fade-in duration-300">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-2xl shadow-lg shadow-amber-500/30 flex items-center gap-2 font-bold">
            <Zap size={20} />
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

      <SourceSelector
        questionSource={questionSource}
        onSourceChange={setQuestionSource}
      />

      {questionSource === 'ai' && (
        <AIControls
          params={params}
          loading={loading}
          onParamsChange={setParams}
          onGenerate={handleGenerate}
        />
      )}

      {questionSource === 'enem' && (
        <ENEMControls
          params={enemParams}
          disciplines={enemDisciplines}
          years={enemYears}
          loading={loading}
          onParamsChange={setEnemParams}
          onGenerate={handleGenerate}
        />
      )}

      {questionSource === 'concurso' && (
        <ConcursoControls
          discipline={params.discipline}
          loading={loading}
          onDisciplineChange={(discipline) => setParams({ ...params, discipline })}
          onGenerate={handleGenerate}
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
          questionSource={questionSource}
          selectedOption={selectedOption}
          showAnswer={showAnswer}
          errorAutopsy={errorAutopsy}
          analyzingError={analyzingError}
          realQuestionsCount={realQuestions.length}
          currentQuestionIndex={currentQuestionIndex}
          onOptionSelect={handleOptionSelect}
          onAutopsy={handleAutopsy}
          onNextQuestion={handleNextRealQuestion}
          onGenerate={handleGenerate}
        />
      )}

      {!question && !loading && (
        <EmptyState questionSource={questionSource} />
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
    <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-indigo-500" />
          <span className="text-sm font-medium text-slate-600">
            <span className="font-bold text-slate-800">{questionsAnswered}</span> questoes
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-500" />
          <span className="text-sm font-medium text-slate-600">
            <span className="font-bold text-slate-800">{accuracy}%</span> acerto geral
          </span>
        </div>
        {disciplineAccuracy > 0 && (
          <div className="flex items-center gap-2">
            <Star size={18} className="text-amber-500" />
            <span className="text-sm font-medium text-slate-600">
              <span className="font-bold text-slate-800">{disciplineAccuracy}%</span> em {currentDiscipline}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full">
        <Zap size={14} className="text-indigo-600" />
        <span className="text-sm font-bold text-indigo-700">{xp} XP</span>
      </div>
    </div>
  );
};

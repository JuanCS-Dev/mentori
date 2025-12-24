import React from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Layers,
  Stethoscope,
  Activity,
  ShieldAlert,
  Sparkles,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import { QuestionAutopsy } from '../types';

type QuestionSource = 'ai' | 'enem' | 'concurso';

export interface DisplayQuestion {
  id: string;
  statement: string;
  options: string[];
  correctAnswer: number;
  discipline: string;
  bank?: string;
  comment?: string;
  trap?: string;
  year?: number;
  source?: string;
  explanation?: string;
}

interface QuestionCardProps {
  question: DisplayQuestion;
  questionSource: QuestionSource;
  selectedOption: number | null;
  showAnswer: boolean;
  errorAutopsy: QuestionAutopsy | null;
  analyzingError: boolean;
  realQuestionsCount: number;
  currentQuestionIndex: number;
  onOptionSelect: (index: number) => void;
  onAutopsy: () => void;
  onNextQuestion: () => void;
  onGenerate: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionSource,
  selectedOption,
  showAnswer,
  errorAutopsy,
  analyzingError,
  realQuestionsCount,
  currentQuestionIndex,
  onOptionSelect,
  onAutopsy,
  onNextQuestion,
  onGenerate
}) => {
  return (
    <div className="glass-card rounded-3xl overflow-hidden animate-in zoom-in-95 duration-500 shadow-2xl shadow-indigo-100/50 border border-white/60">
      <div className="bg-slate-50/80 backdrop-blur-md px-8 py-5 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className={`h-2 w-2 rounded-full animate-pulse ${
            questionSource === 'ai' ? 'bg-purple-500' :
            questionSource === 'enem' ? 'bg-emerald-500' : 'bg-amber-500'
          }`}></span>
          {questionSource === 'ai' ? (
            <span className="text-xs font-bold text-slate-800 bg-gradient-to-r from-indigo-100 to-purple-100 px-3 py-1 rounded-full border border-indigo-200 uppercase tracking-wider shadow-sm">
              {question.bank} Simulada
            </span>
          ) : (
            <span className={`text-xs font-bold text-white px-3 py-1 rounded-full uppercase tracking-wider shadow-sm ${
              questionSource === 'enem'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : 'bg-gradient-to-r from-amber-500 to-orange-500'
            }`}>
              {question.source} {question.year}
            </span>
          )}
          {questionSource !== 'ai' && (
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              +5 XP Bonus
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Layers size={14} />
          <span className="text-xs font-bold uppercase tracking-wide">
            {question.discipline}
          </span>
        </div>
      </div>

      <div className="p-10">
        <p className="text-xl text-slate-800 font-medium leading-loose mb-10 tracking-tight">
          {question.statement}
        </p>

        <div className="space-y-4">
          {question.options.map((opt, idx) => {
            let btnClass = "w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 flex items-start gap-4 group ";
            const isSelected = selectedOption === idx;
            const isCorrect = idx === question.correctAnswer;

            if (showAnswer) {
              if (isCorrect) btnClass += "bg-emerald-50/50 border-emerald-400 text-emerald-900 shadow-md";
              else if (isSelected && !isCorrect) btnClass += "bg-red-50/50 border-red-300 text-red-900 opacity-80";
              else btnClass += "bg-white/40 border-transparent text-slate-400 opacity-40 blur-[1px]";
            } else {
              btnClass += "bg-white border-slate-100 hover:border-indigo-400 hover:bg-indigo-50/30 text-slate-600 hover:shadow-md hover:-translate-y-0.5";
            }

            return (
              <button
                key={idx}
                onClick={() => onOptionSelect(idx)}
                className={btnClass}
                disabled={showAnswer}
              >
                <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl border-2 text-sm font-bold transition-colors ${
                  showAnswer && isCorrect
                    ? 'bg-emerald-200 border-emerald-400 text-emerald-800'
                    : 'bg-slate-100 border-slate-200 text-slate-500 group-hover:bg-white group-hover:border-indigo-300 group-hover:text-indigo-600'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="mt-1 font-medium">{opt.replace(/^[A-E]\)\s*/i, '')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {showAnswer && (
        <FeedbackSection
          question={question}
          questionSource={questionSource}
          selectedOption={selectedOption}
          errorAutopsy={errorAutopsy}
          analyzingError={analyzingError}
          realQuestionsCount={realQuestionsCount}
          currentQuestionIndex={currentQuestionIndex}
          onAutopsy={onAutopsy}
          onNextQuestion={onNextQuestion}
          onGenerate={onGenerate}
        />
      )}
    </div>
  );
};

interface FeedbackSectionProps {
  question: DisplayQuestion;
  questionSource: QuestionSource;
  selectedOption: number | null;
  errorAutopsy: QuestionAutopsy | null;
  analyzingError: boolean;
  realQuestionsCount: number;
  currentQuestionIndex: number;
  onAutopsy: () => void;
  onNextQuestion: () => void;
  onGenerate: () => void;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({
  question,
  questionSource,
  selectedOption,
  errorAutopsy,
  analyzingError,
  realQuestionsCount,
  currentQuestionIndex,
  onAutopsy,
  onNextQuestion,
  onGenerate
}) => {
  return (
    <div className="bg-white/60 backdrop-blur-xl border-t border-white p-8 animate-in slide-in-from-bottom-4 duration-500">
      {selectedOption !== question.correctAnswer && !errorAutopsy && (
        <div className="mb-6 flex justify-center">
          <button
            onClick={onAutopsy}
            disabled={analyzingError}
            className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-rose-500/30 flex items-center gap-2 transition-all hover:scale-105"
          >
            {analyzingError ? <Loader2 className="animate-spin" /> : <Stethoscope />}
            Solicitar Autopsia do Erro
          </button>
        </div>
      )}

      {errorAutopsy && (
        <div className="mb-8 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl p-6 animate-in fade-in zoom-in-95">
          <h4 className="flex items-center gap-2 font-bold text-rose-800 mb-4 text-lg">
            <Activity size={20} /> Diagnostico Forense
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-1">Causa Mortis (O Erro)</p>
              <p className="font-bold text-slate-800 text-lg mb-2">{errorAutopsy.diagnostico_erro}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{errorAutopsy.explicacao_tecnica}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-rose-100">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1"><ShieldAlert size={12}/> Vacina Mental</p>
              <p className="text-sm font-medium text-slate-700 italic">"{errorAutopsy.vacina_mental}"</p>
            </div>
          </div>
        </div>
      )}

      {questionSource === 'ai' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
            <h4 className="flex items-center gap-2 font-bold text-emerald-700 mb-3 text-lg">
              <CheckCircle size={20} className="fill-emerald-200" /> Gabarito Comentado
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              {question.comment}
            </p>
          </div>
          <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
            <h4 className="flex items-center gap-2 font-bold text-amber-700 mb-3 text-lg">
              <AlertTriangle size={20} className="fill-amber-200" /> Zona de Perigo
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              {question.trap}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
          <h4 className="flex items-center gap-2 font-bold text-emerald-700 mb-3 text-lg">
            <CheckCircle size={20} className="fill-emerald-200" /> Resposta Correta
          </h4>
          <p className="text-lg font-bold text-emerald-800 mb-2">
            {String.fromCharCode(65 + question.correctAnswer)}) {question.options[question.correctAnswer]?.replace(/^[A-E]\)\s*/i, '')}
          </p>
          {question.explanation && (
            <p className="text-sm text-slate-700 leading-relaxed font-medium mt-4 pt-4 border-t border-emerald-200">
              <span className="font-bold text-slate-800">Explicacao:</span> {question.explanation}
            </p>
          )}
        </div>
      )}

      <div className="mt-8 text-center flex gap-4 justify-center">
        {realQuestionsCount > 1 && (
          <button
            onClick={onNextQuestion}
            className="bg-white text-slate-700 border-2 border-slate-200 px-8 py-3 rounded-full font-bold hover:border-indigo-400 hover:text-indigo-600 transition-colors shadow-lg flex items-center gap-2"
          >
            <RefreshCw size={18} /> Proxima ({currentQuestionIndex + 1}/{realQuestionsCount})
          </button>
        )}
        <button
          onClick={onGenerate}
          className={`px-8 py-3 rounded-full font-bold transition-colors shadow-lg flex items-center gap-2 ${
            questionSource === 'ai'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-500/40'
              : questionSource === 'enem'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/40'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/40'
          }`}
        >
          {questionSource === 'ai' ? <Sparkles size={18} /> : <RefreshCw size={18} />}
          {questionSource === 'ai' ? 'Gerar Nova' : 'Carregar Mais'}
        </button>
      </div>
    </div>
  );
};

interface EmptyStateProps {
  questionSource: QuestionSource;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ questionSource }) => {
  return (
    <div className="text-center py-24">
      <div className={`h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl backdrop-blur-sm border border-white ${
        questionSource === 'ai' ? 'bg-gradient-to-br from-indigo-100 to-purple-100 shadow-indigo-100/50' :
        questionSource === 'enem' ? 'bg-gradient-to-br from-emerald-100 to-teal-100 shadow-emerald-100/50' :
        'bg-gradient-to-br from-amber-100 to-orange-100 shadow-amber-100/50'
      }`}>
        {questionSource === 'ai' ? <Sparkles className="h-10 w-10 text-indigo-400" /> :
          questionSource === 'enem' ? <GraduationCap className="h-10 w-10 text-emerald-500" /> :
          <BookOpen className="h-10 w-10 text-amber-500" />}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">
        {questionSource === 'ai' ? 'Pronto para treinar com IA?' :
          questionSource === 'enem' ? 'Questoes Reais do ENEM' :
          'Questoes de Concursos Publicos'}
      </h3>
      <p className="text-slate-500 max-w-md mx-auto">
        {questionSource === 'ai'
          ? 'Configure os parametros acima e nossa IA criara uma questao inedita baseada no perfil da banca.'
          : questionSource === 'enem'
          ? 'Selecione a area do conhecimento e o ano da prova para praticar com questoes reais do ENEM.'
          : 'Busque questoes de concursos publicos por disciplina para treinar com conteudo real.'}
      </p>
      {questionSource !== 'ai' && (
        <p className="text-emerald-600 font-medium mt-4">
          Questoes reais ganham +5 XP de bonus!
        </p>
      )}
    </div>
  );
};

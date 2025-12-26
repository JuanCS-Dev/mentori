import React from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Layers,
  Stethoscope,
  Activity,
  Sparkles,
  GraduationCap,
  BookOpen,
  Terminal,
  ArrowRight,
  MessageSquare,
  FileText
} from 'lucide-react';
import { QuestionAutopsy } from '../types';
import { useMentor } from '../contexts/MentorContext';

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
  role?: string;        // Cargo (ex: "Agente de Polícia Federal")
  concurso?: string;    // Nome do concurso (ex: "Polícia Federal")
  // Estrutura CEBRASPE para textos de apoio
  contextId?: string;   // Código do texto (ex: "CB1A1")
  contextText?: string; // Conteúdo do texto de apoio
  command?: string;     // Frase introdutória (ex: "Julgue os itens a seguir...")
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
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-500">

      {/* Header */}
      <div className="bg-white px-8 py-6 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100/50">
            <Terminal size={12} className="text-slate-400" />
            <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {questionSource === 'ai' ? 'GENERATION_MODE' : 'DATABASE_FETCH'}
            </span>
          </div>

          <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest pl-2 border-l border-slate-100">
            {questionSource === 'ai'
              ? `BANCA: ${question.bank}`
              : `${question.bank || 'CONCURSO'} ${question.year || ''} ${question.role ? `- ${question.role}` : ''}`}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <Layers size={14} />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
            {question.discipline}
          </span>
        </div>
      </div>

      {/* Question Body */}
      <div className="p-8 md:p-10">
        {/* Context Text (for interpretation questions) */}
        {question.contextText && (
          <div className="mb-8 p-6 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={14} className="text-slate-400" />
              <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {question.contextId ? `TEXTO ${question.contextId}` : 'TEXTO DE APOIO'}
              </span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {question.contextText}
            </p>
          </div>
        )}

        {/* Command (introductory phrase) */}
        {question.command && (
          <p className="text-sm text-slate-500 italic mb-4 pl-4 border-l-2 border-slate-200">
            {question.command}
          </p>
        )}

        <p className="text-xl md:text-2xl text-slate-800 font-medium leading-relaxed mb-10 font-sans tracking-tight">
          {question.statement}
        </p>

        <div className="space-y-4">
          {question.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === question.correctAnswer;

            let containerClass = "w-full text-left p-4 rounded-xl border-2 transition-all duration-300 flex items-start gap-5 font-sans group relative overflow-hidden ";

            if (showAnswer) {
              if (isCorrect) containerClass += "bg-emerald-50/50 border-emerald-500/50 text-emerald-900";
              else if (isSelected && !isCorrect) containerClass += "bg-red-50/50 border-red-500/50 text-red-900";
              else containerClass += "bg-white border-slate-100 text-slate-300 pointer-events-none grayscale opacity-60";
            } else {
              containerClass += isSelected
                ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200 scale-[1.01]"
                : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-600 hover:shadow-md";
            }

            return (
              <button
                key={idx}
                onClick={() => onOptionSelect(idx)}
                className={containerClass}
                disabled={showAnswer}
              >
                {isSelected && !showAnswer && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                )}

                <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg font-mono text-sm font-bold transition-all duration-300 ${showAnswer && isCorrect
                    ? 'bg-emerald-200 text-emerald-800'
                    : isSelected
                      ? 'bg-white/20 text-white backdrop-blur-sm'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  }`}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className={`mt-1 text-[15px] leading-relaxed ${isSelected ? 'font-medium' : 'font-normal'}`}>
                  {opt.replace(/^[A-E]\)\s*/i, '')}
                </span>

                {isSelected && !showAnswer && <ArrowRight className="ml-auto opacity-50 w-4 h-4 animate-pulse" />}
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
  const { askAboutQuestion, isStreaming } = useMentor();

  const handleExplain = () => {
    askAboutQuestion(
      question.statement,
      question.options,
      question.correctAnswer,
      selectedOption !== null && selectedOption !== question.correctAnswer ? selectedOption : undefined
    );
  };

  return (
    <div className="bg-slate-50 border-t border-slate-100 p-8 animate-in slide-in-from-bottom-4 duration-500">

      {/* Action Buttons Row */}
      <div className="mb-8 flex justify-center gap-4">
        {/* Autopsy Button - only if wrong */}
        {selectedOption !== question.correctAnswer && !errorAutopsy && (
          <button
            onClick={onAutopsy}
            disabled={analyzingError}
            className="group bg-white border border-red-100 text-red-600 pl-4 pr-5 py-2.5 rounded-full font-mono text-xs font-bold shadow-sm hover:shadow-md hover:border-red-200 flex items-center gap-3 transition-all active:scale-95"
          >
            <div className="bg-red-50 p-1.5 rounded-full group-hover:bg-red-100 transition-colors">
              {analyzingError ? <Loader2 className="animate-spin" size={14} /> : <Stethoscope size={14} />}
            </div>
            AUTOPSIA.exe
          </button>
        )}

        {/* Explain Button - always available */}
        <button
          onClick={handleExplain}
          disabled={isStreaming}
          className="group bg-white border border-blue-100 text-blue-600 pl-4 pr-5 py-2.5 rounded-full font-mono text-xs font-bold shadow-sm hover:shadow-md hover:border-blue-200 flex items-center gap-3 transition-all active:scale-95"
        >
          <div className="bg-blue-50 p-1.5 rounded-full group-hover:bg-blue-100 transition-colors">
            {isStreaming ? <Loader2 className="animate-spin" size={14} /> : <MessageSquare size={14} />}
          </div>
          EXPLIQUE_MENTOR
        </button>
      </div>

      {/* Autopsy Result */}
      {errorAutopsy && (
        <div className="mb-8 bg-white border border-red-100 rounded-2xl p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
          <h4 className="flex items-center gap-2 font-mono font-bold text-red-600 mb-6 text-xs uppercase tracking-widest border-b border-red-50 pb-4">
            <Activity size={14} /> Relatório de Erro Neural
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <p className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Diagnóstico</p>
                <p className="font-medium text-slate-800 text-sm leading-relaxed">{errorAutopsy.diagnostico_erro}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Explicação Técnica</p>
                <p className="text-sm text-slate-600 leading-relaxed font-mono bg-slate-50 p-4 rounded-xl border border-slate-100/50">{errorAutopsy.explicacao_tecnica}</p>
              </div>
            </div>
            <div>
              <p className="font-mono text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-3">Vacina Cognitiva</p>
              <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100/50 text-emerald-900 text-sm italic font-medium leading-loose relative">
                <span className="absolute top-4 left-4 text-emerald-200 text-4xl font-serif">"</span>
                <span className="relative z-10 px-4 block">{errorAutopsy.vacina_mental}</span>
                <span className="absolute bottom-[-10px] right-4 text-emerald-200 text-4xl font-serif">"</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Answer Explanation */}
      <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
        <h4 className="flex items-center gap-2 font-mono font-bold text-emerald-600 mb-3 text-xs uppercase tracking-widest">
          <CheckCircle size={14} /> Análise da Resposta Correta
        </h4>
        <p className="text-sm text-slate-700 leading-relaxed pl-1">
          {questionSource === 'ai' ? question.comment : (question.explanation || "Gabarito oficial processado.")}
        </p>

        {questionSource === 'ai' && question.trap && (
          <div className="mt-4 pt-4 border-t border-slate-50">
            <h4 className="flex items-center gap-2 font-mono font-bold text-amber-600 mb-2 text-[10px] uppercase tracking-widest">
              <AlertTriangle size={12} /> Ponto de Atenção
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed italic">
              {question.trap}
            </p>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4 justify-end border-t border-slate-100/50 pt-4">
        {realQuestionsCount > 1 && (
          <button
            onClick={onNextQuestion}
            className="text-slate-500 hover:text-slate-800 px-6 py-3 rounded-xl font-mono text-xs font-bold transition-all hover:bg-slate-50 flex items-center gap-2"
          >
            <RefreshCw size={14} /> PULAR_QUESTAO
          </button>
        )}
        <button
          onClick={onGenerate}
          className="px-8 py-3 rounded-xl font-mono text-xs font-bold transition-all shadow-lg hover:shadow-xl shadow-slate-200 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-3 bg-slate-900 text-white hover:bg-black"
        >
          {questionSource === 'ai' ? <Sparkles size={14} /> : <ArrowRight size={14} />}
          {questionSource === 'ai' ? 'GERAR_PROXIMA' : 'PROXIMA_QUESTAO'}
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
    <div className="text-center py-32 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700 cursor-default select-none group">
      <div className="h-20 w-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
        {questionSource === 'ai' ? <Sparkles className="h-8 w-8 text-slate-300" /> :
          questionSource === 'enem' ? <GraduationCap className="h-8 w-8 text-slate-300" /> :
            <BookOpen className="h-8 w-8 text-slate-300" />}
      </div>
      <h3 className="font-mono font-bold text-lg text-slate-800 mb-3 tracking-tight">
        {questionSource === 'ai' ? 'Módulo Neural em Standby' : 'Aguardando Query'}
      </h3>
      <div className="h-1 w-12 bg-slate-200 rounded-full mb-6"></div>
      <p className="text-slate-400 max-w-sm mx-auto text-sm font-medium leading-relaxed">
        {questionSource === 'ai'
          ? 'Defina os parâmetros acima e inicialize o gerador para criar questões inéditas.'
          : 'Utilize os filtros para acessar o banco de dados de questões reais.'}
      </p>
    </div>
  );
};
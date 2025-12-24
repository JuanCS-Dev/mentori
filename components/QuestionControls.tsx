import React from 'react';
import { Loader2, Sparkles, GraduationCap, BookOpen, Calendar } from 'lucide-react';

type QuestionSource = 'ai' | 'enem' | 'concurso';

interface AIParams {
  discipline: string;
  topic: string;
  bank: string;
  difficulty: string;
}

interface ENEMParams {
  discipline: string;
  year: number;
}

interface SourceSelectorProps {
  questionSource: QuestionSource;
  onSourceChange: (source: QuestionSource) => void;
}

export const SourceSelector: React.FC<SourceSelectorProps> = ({
  questionSource,
  onSourceChange
}) => {
  return (
    <div className="glass-card rounded-2xl p-2 flex gap-2">
      <button
        onClick={() => onSourceChange('ai')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
          questionSource === 'ai'
            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
            : 'bg-white/50 text-slate-600 hover:bg-white'
        }`}
      >
        <Sparkles size={18} />
        <span>IA Generativa</span>
      </button>
      <button
        onClick={() => onSourceChange('enem')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
          questionSource === 'enem'
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
            : 'bg-white/50 text-slate-600 hover:bg-white'
        }`}
      >
        <GraduationCap size={18} />
        <span>ENEM Real</span>
      </button>
      <button
        onClick={() => onSourceChange('concurso')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
          questionSource === 'concurso'
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
            : 'bg-white/50 text-slate-600 hover:bg-white'
        }`}
      >
        <BookOpen size={18} />
        <span>Concursos</span>
      </button>
    </div>
  );
};

interface AIControlsProps {
  params: AIParams;
  loading: boolean;
  onParamsChange: (params: AIParams) => void;
  onGenerate: () => void;
}

export const AIControls: React.FC<AIControlsProps> = ({
  params,
  loading,
  onParamsChange,
  onGenerate
}) => {
  return (
    <div className="glass-panel p-6 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
      <div className="lg:col-span-1 space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Disciplina</label>
        <input
          className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 text-sm font-semibold text-slate-700 shadow-sm"
          value={params.discipline}
          onChange={e => onParamsChange({ ...params, discipline: e.target.value })}
        />
      </div>
      <div className="lg:col-span-1 space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Topico</label>
        <input
          className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 text-sm font-semibold text-slate-700 shadow-sm"
          value={params.topic}
          onChange={e => onParamsChange({ ...params, topic: e.target.value })}
        />
      </div>
      <div className="lg:col-span-1 space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Banca</label>
        <input
          className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 text-sm font-semibold text-slate-700 shadow-sm"
          value={params.bank}
          onChange={e => onParamsChange({ ...params, bank: e.target.value })}
        />
      </div>
      <div className="lg:col-span-1 space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Nivel</label>
        <select
          className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 text-sm font-semibold text-slate-700 shadow-sm"
          value={params.difficulty}
          onChange={e => onParamsChange({ ...params, difficulty: e.target.value })}
        >
          <option>Facil</option>
          <option>Medio</option>
          <option>Dificil</option>
        </select>
      </div>
      <div className="lg:col-span-1">
        <button
          onClick={onGenerate}
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white p-3.5 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
          Gerar com IA
        </button>
      </div>
    </div>
  );
};

interface ENEMControlsProps {
  params: ENEMParams;
  disciplines: { value: string; label: string }[];
  years: number[];
  loading: boolean;
  onParamsChange: (params: ENEMParams) => void;
  onGenerate: () => void;
}

export const ENEMControls: React.FC<ENEMControlsProps> = ({
  params,
  disciplines,
  years,
  loading,
  onParamsChange,
  onGenerate
}) => {
  return (
    <div className="glass-panel p-6 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Area do Conhecimento</label>
        <select
          className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 text-sm font-semibold text-slate-700 shadow-sm"
          value={params.discipline}
          onChange={e => onParamsChange({ ...params, discipline: e.target.value })}
        >
          {disciplines.map(d => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-2">
          <Calendar size={14} /> Ano da Prova
        </label>
        <select
          className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 text-sm font-semibold text-slate-700 shadow-sm"
          value={params.year}
          onChange={e => onParamsChange({ ...params, year: parseInt(e.target.value) })}
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <div>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white p-3.5 rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <GraduationCap size={20} />}
          Carregar Questoes
        </button>
      </div>
    </div>
  );
};

interface ConcursoControlsProps {
  discipline: string;
  loading: boolean;
  onDisciplineChange: (discipline: string) => void;
  onGenerate: () => void;
}

export const ConcursoControls: React.FC<ConcursoControlsProps> = ({
  discipline,
  loading,
  onDisciplineChange,
  onGenerate
}) => {
  return (
    <div className="glass-panel p-6 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Disciplina</label>
        <input
          className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/50 text-sm font-semibold text-slate-700 shadow-sm"
          value={discipline}
          onChange={e => onDisciplineChange(e.target.value)}
          placeholder="Ex: Direito Constitucional, Portugues..."
        />
      </div>
      <div>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white p-3.5 rounded-xl font-bold shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <BookOpen size={20} />}
          Buscar Questoes
        </button>
      </div>
    </div>
  );
};

interface ProgressIndicatorProps {
  current: number;
  total: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ current, total }) => {
  return (
    <div className="glass-card rounded-xl p-3 flex items-center justify-between">
      <span className="text-sm font-medium text-slate-600">
        Questao <span className="font-bold text-slate-800">{current + 1}</span> de <span className="font-bold text-slate-800">{total}</span>
      </span>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, idx) => (
          <div
            key={idx}
            className={`w-2 h-2 rounded-full transition-colors ${
              idx === current
                ? 'bg-indigo-500'
                : idx < current
                ? 'bg-emerald-400'
                : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

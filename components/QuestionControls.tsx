import React from 'react';
import { Loader2, Sparkles, GraduationCap, BookOpen, Calendar, Search } from 'lucide-react';

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
    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg mb-8 w-fit mx-auto">
      <button
        onClick={() => onSourceChange('ai')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs font-bold transition-all ${questionSource === 'ai'
            ? 'bg-white text-black shadow-sm'
            : 'text-gray-500 hover:text-gray-900'
          }`}
      >
        <Sparkles size={14} />
        IA GENERATOR
      </button>
      <button
        onClick={() => onSourceChange('enem')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs font-bold transition-all ${questionSource === 'enem'
            ? 'bg-white text-black shadow-sm'
            : 'text-gray-500 hover:text-gray-900'
          }`}
      >
        <GraduationCap size={14} />
        ENEM REAL
      </button>
      <button
        onClick={() => onSourceChange('concurso')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs font-bold transition-all ${questionSource === 'concurso'
            ? 'bg-white text-black shadow-sm'
            : 'text-gray-500 hover:text-gray-900'
          }`}
      >
        <BookOpen size={14} />
        CONCURSOS
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
    <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 w-full">
          <ControlInput
            label="DISCIPLINA"
            value={params.discipline}
            onChange={v => onParamsChange({ ...params, discipline: v })}
            placeholder="Ex: Direito Constitucional"
          />
          <ControlInput
            label="TÓPICO"
            value={params.topic}
            onChange={v => onParamsChange({ ...params, topic: v })}
            placeholder="Ex: Direitos Sociais"
          />
          <ControlInput
            label="BANCA"
            value={params.bank}
            onChange={v => onParamsChange({ ...params, bank: v })}
            placeholder="Ex: FGV"
          />
          <div className="space-y-1">
            <Label>DIFICULDADE</Label>
            <select
              className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-mono text-gray-700 focus:outline-none focus:border-black transition-colors"
              value={params.difficulty}
              onChange={e => onParamsChange({ ...params, difficulty: e.target.value })}
            >
              <option>Facil</option>
              <option>Medio</option>
              <option>Dificil</option>
            </select>
          </div>
        </div>

        <button
          onClick={onGenerate}
          disabled={loading}
          className="h-10 px-6 bg-black text-white rounded-lg font-mono text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
          GERAR
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
    <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 w-full">
          <div className="space-y-1">
            <Label>ÁREA DO CONHECIMENTO</Label>
            <select
              className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-mono text-gray-700 focus:outline-none focus:border-black transition-colors"
              value={params.discipline}
              onChange={e => onParamsChange({ ...params, discipline: e.target.value })}
            >
              {disciplines.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label>ANO DA PROVA</Label>
            <select
              className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-mono text-gray-700 focus:outline-none focus:border-black transition-colors"
              value={params.year}
              onChange={e => onParamsChange({ ...params, year: parseInt(e.target.value) })}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={onGenerate}
          disabled={loading}
          className="h-10 px-6 bg-black text-white rounded-lg font-mono text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity50 whitespace-nowrap"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
          BUSCAR
        </button>
      </div>
    </div>
  );
};

interface ConcursoControlsProps {
  discipline: string;
  loading: boolean;
  filters?: {
    bank: string;
    year: number;
    difficulty: string;
  };
  availableYears?: number[];
  availableDisciplinas?: string[];
  questionCount?: number;
  onDisciplineChange: (discipline: string) => void;
  onFilterChange?: (filters: any) => void;
  onGenerate: () => void;
}

export const ConcursoControls: React.FC<ConcursoControlsProps> = ({
  discipline,
  loading,
  filters = { bank: 'Todas', year: 0, difficulty: 'Qualquer' },
  availableYears = [],
  availableDisciplinas = [],
  questionCount = 0,
  onDisciplineChange,
  onFilterChange,
  onGenerate
}) => {
  const years = availableYears.length > 0 ? availableYears : [2024, 2021, 2020, 2018, 2015];

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 w-full">
          {/* Disciplina - dropdown se tiver opções, senão input */}
          {availableDisciplinas.length > 0 ? (
            <div className="space-y-1">
              <Label>DISCIPLINA</Label>
              <select
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-mono text-gray-700 focus:outline-none focus:border-black transition-colors appearance-none"
                value={discipline}
                onChange={e => onDisciplineChange(e.target.value)}
              >
                <option value="">Todas</option>
                {availableDisciplinas.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          ) : (
            <ControlInput
              label="DISCIPLINA"
              value={discipline}
              onChange={onDisciplineChange}
              placeholder="Ex: Direito Constitucional"
            />
          )}

          <div className="space-y-1">
            <Label>BANCA</Label>
            <select
              className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-mono text-gray-700 focus:outline-none focus:border-black transition-colors appearance-none"
              value={filters.bank}
              onChange={e => onFilterChange && onFilterChange({ ...filters, bank: e.target.value })}
            >
              <option>Todas</option>
              <option>CEBRASPE</option>
              <option>FGV</option>
              <option>FCC</option>
              <option>VUNESP</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label>ANO</Label>
            <select
              className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-mono text-gray-700 focus:outline-none focus:border-black transition-colors appearance-none"
              value={filters.year}
              onChange={e => onFilterChange && onFilterChange({ ...filters, year: parseInt(e.target.value) })}
            >
              <option value={0}>Todos</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <Label>TIPO</Label>
            <select
              className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-mono text-gray-700 focus:outline-none focus:border-black transition-colors appearance-none"
              value={filters.difficulty}
              onChange={e => onFilterChange && onFilterChange({ ...filters, difficulty: e.target.value })}
            >
              <option value="Qualquer">Qualquer</option>
              <option value="certo_errado">Certo/Errado</option>
              <option value="multipla_escolha">Múltipla Escolha</option>
            </select>
          </div>

        </div>

        <button
          onClick={onGenerate}
          disabled={loading}
          className="h-10 px-6 bg-black text-white rounded-lg font-mono text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
          BUSCAR
        </button>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
        <span className="text-xs text-gray-400 font-mono">
          BANCO DE DADOS: <span className="text-gray-600 font-bold">{questionCount.toLocaleString()}</span> QUESTÕES REAIS
        </span>
      </div>
    </div>
  );
};

export const ProgressIndicator: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  return (
    <div className="flex items-center justify-between mb-4 px-1">
      <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
        PROGRESSO DA SESSÃO
      </span>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, idx) => (
          <div
            key={idx}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === current
                ? 'bg-black scale-125'
                : idx < current
                  ? 'bg-gray-400'
                  : 'bg-gray-200'
              }`}
          />
        ))}
      </div>
    </div>
  );
};

// --- Internal Helper Components ---

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1 mb-1 block font-mono">
    {children}
  </label>
);

const ControlInput: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-1">
    <Label>{label}</Label>
    <input
      className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-mono text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-black transition-colors shadow-sm"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

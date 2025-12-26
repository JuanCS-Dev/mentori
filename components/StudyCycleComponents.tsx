import React, { useState } from 'react';
import {
  Play,
  Pause,
  CheckCircle,
  BookOpen,
  Plus,
  Trash2,
  Save,
  X,
  ChevronRight,
  RefreshCw,
  Zap
} from 'lucide-react';

interface CycleSubject {
  id: string;
  name: string;
  targetHours: number;
  completedMinutes: number;
  color: string;
  priority: 'alta' | 'media' | 'baixa';
}

// Format time helper
export const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

interface ActiveStudyAreaProps {
  subject: CycleSubject;
  currentIndex: number;
  totalSubjects: number;
  elapsedSeconds: number;
  isStudying: boolean;
  onToggleStudy: () => void;
  onNextSubject: () => void;
  onMarkComplete: (id: string) => void;
}

export const ActiveStudyArea: React.FC<ActiveStudyAreaProps> = ({
  subject,
  currentIndex,
  totalSubjects,
  elapsedSeconds,
  isStudying,
  onToggleStudy,
  onNextSubject,
  onMarkComplete
}) => {
  const progress = (subject.completedMinutes / (subject.targetHours * 60)) * 100;

  return (
    <div className="bg-white border border-kitchen-border rounded-xl p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${subject.color}`} />
          <h2 className="text-xl font-bold font-mono text-gray-800">Sessão_Atual</h2>
        </div>
        <span className="text-gray-500 font-mono text-xs uppercase tracking-wider">
          {currentIndex + 1} DE {totalSubjects}
        </span>
      </div>

      <div className="text-center py-8">
        <h3 className="text-3xl font-bold text-gray-800 mb-4 font-mono tracking-tight">
          {subject.name}
        </h3>

        <div className="text-6xl font-mono font-bold text-gray-800 mb-6 tracking-tighter">
          {formatTime(elapsedSeconds)}
        </div>

        <div className="max-w-md mx-auto mb-8">
          <div className="flex justify-between text-xs font-mono text-gray-500 mb-2 uppercase tracking-wide">
            <span>{Math.floor(subject.completedMinutes / 60)}h {subject.completedMinutes % 60}m concluído</span>
            <span>Meta: {subject.targetHours}h</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
            <div
              className={`h-full ${subject.color} rounded-full transition-all`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={onToggleStudy}
            className={`flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-bold font-mono transition-all border ${
              isStudying
                ? 'bg-white border-amber-500 text-amber-600 hover:bg-amber-50'
                : 'bg-black text-white hover:bg-gray-800 border-black'
            }`}
          >
            {isStudying ? <Pause size={16} /> : <Play size={16} />}
            {isStudying ? 'PAUSAR' : 'INICIAR'}
          </button>

          <button
            onClick={onNextSubject}
            className="flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-bold font-mono bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
          >
            <ChevronRight size={16} />
            PRÓXIMA
          </button>

          <button
            onClick={() => onMarkComplete(subject.id)}
            className="flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-bold font-mono bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-all"
          >
            <CheckCircle size={16} />
            CONCLUÍDO
          </button>
        </div>
      </div>
    </div>
  );
};

interface SubjectListProps {
  subjects: CycleSubject[];
  currentSubjectIndex: number;
  hasEditalData: boolean;
  onAddSubject: (name: string, hours: number) => void;
  onRemoveSubject: (id: string) => void;
  onImportFromEdital: () => void;
}

export const SubjectList: React.FC<SubjectListProps> = ({
  subjects,
  currentSubjectIndex,
  hasEditalData,
  onAddSubject,
  onRemoveSubject,
  onImportFromEdital
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectHours, setNewSubjectHours] = useState(1);

  const handleAdd = () => {
    if (!newSubjectName.trim()) return;
    onAddSubject(newSubjectName.trim(), newSubjectHours);
    setNewSubjectName('');
    setNewSubjectHours(1);
    setShowAddForm(false);
  };

  return (
    <div className="bg-white border border-kitchen-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="text-gray-400" size={20} />
          <h2 className="text-lg font-bold font-mono text-gray-800">Disciplinas_do_Ciclo</h2>
        </div>
        <div className="flex gap-2">
          {hasEditalData && subjects.length === 0 && (
            <button
              onClick={onImportFromEdital}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold font-mono hover:bg-blue-100 transition-colors"
            >
              <Zap size={14} />
              Importar_Dados
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-xs font-bold font-mono hover:bg-gray-100 transition-colors"
          >
            <Plus size={14} />
            Adicionar_Nova
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-mono font-bold text-gray-500 mb-1 uppercase">Nome da Disciplina</label>
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Ex: Direito Constitucional"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 text-sm font-mono"
              />
            </div>
            <div className="w-32">
              <label className="block text-xs font-mono font-bold text-gray-500 mb-1 uppercase">Horas</label>
              <input
                type="number"
                value={newSubjectHours}
                onChange={(e) => setNewSubjectHours(Number(e.target.value))}
                min={1}
                max={10}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 text-sm font-mono"
              />
            </div>
            <button
              onClick={handleAdd}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Save size={18} />
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-xl">
          <RefreshCw size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-mono text-sm">Nenhuma disciplina no ciclo</p>
          <p className="text-xs mt-1 font-mono">
            {hasEditalData
              ? 'Clique em "Importar_Dados" para buscar do Edital'
              : 'Adicione disciplinas manualmente'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {subjects.map((subject, index) => {
            const progress = (subject.completedMinutes / (subject.targetHours * 60)) * 100;
            const isComplete = progress >= 100;
            const isCurrent = index === currentSubjectIndex;

            return (
              <div
                key={subject.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-blue-400 bg-blue-50/50'
                    : isComplete
                    ? 'border-green-200 bg-green-50/30'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${subject.color}`} />

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold font-mono text-sm ${isCurrent ? 'text-blue-700' : 'text-gray-700'}`}>
                        {subject.name}
                      </span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded uppercase font-bold tracking-wider border border-blue-200">
                          ATIVA
                        </span>
                      )}
                      {isComplete && (
                        <CheckCircle size={14} className="text-green-500" />
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                        <div
                          className={`h-full rounded-full ${subject.color}`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-gray-400 w-24 text-right">
                        {Math.floor(subject.completedMinutes / 60)}h{subject.completedMinutes % 60}m / {subject.targetHours}h
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveSubject(subject.id)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

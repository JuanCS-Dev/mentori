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
    <div className="glass-card rounded-3xl p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${subject.color}`} />
          <h2 className="text-2xl font-bold text-slate-800">Estudando Agora</h2>
        </div>
        <span className="text-slate-500">
          {currentIndex + 1} de {totalSubjects}
        </span>
      </div>

      <div className="text-center py-8">
        <h3 className="text-4xl font-bold text-slate-800 mb-4">
          {subject.name}
        </h3>

        <div className="text-6xl font-mono font-bold text-slate-700 mb-6">
          {formatTime(elapsedSeconds)}
        </div>

        <div className="max-w-md mx-auto mb-8">
          <div className="flex justify-between text-sm text-slate-500 mb-2">
            <span>{Math.floor(subject.completedMinutes / 60)}h {subject.completedMinutes % 60}m estudados</span>
            <span>Meta: {subject.targetHours}h</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${subject.color} rounded-full transition-all`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={onToggleStudy}
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-bold transition-all ${
              isStudying
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            {isStudying ? <Pause size={24} /> : <Play size={24} />}
            {isStudying ? 'Pausar' : 'Iniciar'}
          </button>

          <button
            onClick={onNextSubject}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
          >
            <ChevronRight size={24} />
            Proxima
          </button>

          <button
            onClick={() => onMarkComplete(subject.id)}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition-all"
          >
            <CheckCircle size={24} />
            Concluir
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
    <div className="glass-card rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="text-slate-600" size={24} />
          <h2 className="text-xl font-bold text-slate-800">Materias do Ciclo</h2>
        </div>
        <div className="flex gap-2">
          {hasEditalData && subjects.length === 0 && (
            <button
              onClick={onImportFromEdital}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Zap size={16} />
              Importar do Edital
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
          >
            <Plus size={16} />
            Adicionar
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 bg-slate-50 rounded-2xl">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-600 mb-1">Materia</label>
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Ex: Direito Constitucional"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-slate-600 mb-1">Horas/Ciclo</label>
              <input
                type="number"
                value={newSubjectHours}
                onChange={(e) => setNewSubjectHours(Number(e.target.value))}
                min={1}
                max={10}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600"
            >
              <Save size={20} />
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-300"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <RefreshCw size={48} className="mx-auto mb-4 opacity-50" />
          <p className="font-medium">Nenhuma materia no ciclo</p>
          <p className="text-sm mt-2">
            {hasEditalData
              ? 'Clique em "Importar do Edital" para comecar rapidamente'
              : 'Adicione materias manualmente para criar seu ciclo'}
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
                className={`p-4 rounded-2xl border-2 transition-all ${
                  isCurrent
                    ? 'border-indigo-400 bg-indigo-50'
                    : isComplete
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${subject.color}`} />

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${isCurrent ? 'text-indigo-700' : 'text-slate-700'}`}>
                        {subject.name}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-indigo-500 text-white text-xs rounded-full font-bold">
                          ATUAL
                        </span>
                      )}
                      {isComplete && (
                        <CheckCircle size={16} className="text-emerald-500" />
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${subject.color}`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-24 text-right">
                        {Math.floor(subject.completedMinutes / 60)}h{subject.completedMinutes % 60}m / {subject.targetHours}h
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveSubject(subject.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
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

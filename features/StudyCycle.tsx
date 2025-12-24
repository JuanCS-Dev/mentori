import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Target } from 'lucide-react';
import { usePersistence } from '../hooks/usePersistence';
import { EditalJSON } from '../types';
import { ActiveStudyArea, SubjectList } from '../components/StudyCycleComponents';

/**
 * Ciclo de Estudos - Metodo Alexandre Meirelles
 *
 * O ciclo de estudos e o metodo mais usado por concurseiros aprovados.
 * Permite estudar multiplas materias de forma rotativa e flexivel,
 * adaptando-se a imprevistos sem perder o ritmo.
 */

interface CycleSubject {
  id: string;
  name: string;
  targetHours: number;
  completedMinutes: number;
  color: string;
  priority: 'alta' | 'media' | 'baixa';
}

interface StudyCycleData {
  subjects: CycleSubject[];
  currentSubjectIndex: number;
  cycleNumber: number;
  totalCyclesCompleted: number;
  createdAt: string;
  lastStudyDate: string;
}

interface StudyCycleProps {
  editalData?: EditalJSON | null;
}

const COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500',
  'bg-teal-500', 'bg-orange-500'
];

const defaultCycleData: StudyCycleData = {
  subjects: [],
  currentSubjectIndex: 0,
  cycleNumber: 1,
  totalCyclesCompleted: 0,
  createdAt: new Date().toISOString(),
  lastStudyDate: ''
};

export const StudyCycle: React.FC<StudyCycleProps> = ({ editalData }) => {
  const [cycleData, setCycleData] = usePersistence<StudyCycleData>('studyCycle', defaultCycleData);
  const [isStudying, setIsStudying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isStudying) {
      interval = setInterval(() => {
        setElapsedSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStudying]);

  const currentSubject = cycleData.subjects[cycleData.currentSubjectIndex];

  const cycleProgress = useMemo(() => {
    if (cycleData.subjects.length === 0) return 0;
    const totalTarget = cycleData.subjects.reduce((sum, s) => sum + s.targetHours * 60, 0);
    const totalCompleted = cycleData.subjects.reduce((sum, s) => sum + s.completedMinutes, 0);
    return totalTarget > 0 ? (totalCompleted / totalTarget) * 100 : 0;
  }, [cycleData.subjects]);

  const importFromEdital = useCallback(() => {
    if (!editalData?.verticalizado) return;

    const newSubjects: CycleSubject[] = editalData.verticalizado.map((disc, index) => ({
      id: `subject_${Date.now()}_${index}`,
      name: disc.disciplina,
      targetHours: getHoursFromWeight(disc.peso),
      completedMinutes: 0,
      color: COLORS[index % COLORS.length] ?? 'bg-slate-500',
      priority: getPriorityFromWeight(disc.peso)
    }));

    setCycleData(prev => ({
      ...prev,
      subjects: newSubjects,
      currentSubjectIndex: 0,
      cycleNumber: 1
    }));
  }, [editalData, setCycleData]);

  const addSubject = (name: string, hours: number) => {
    const newSubject: CycleSubject = {
      id: `subject_${Date.now()}`,
      name,
      targetHours: hours,
      completedMinutes: 0,
      color: COLORS[cycleData.subjects.length % COLORS.length] ?? 'bg-slate-500',
      priority: 'media'
    };

    setCycleData(prev => ({
      ...prev,
      subjects: [...prev.subjects, newSubject]
    }));
  };

  const removeSubject = (id: string) => {
    setCycleData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s.id !== id),
      currentSubjectIndex: Math.min(prev.currentSubjectIndex, Math.max(0, prev.subjects.length - 2))
    }));
  };

  const toggleStudy = () => {
    if (isStudying) {
      const minutesStudied = Math.floor(elapsedSeconds / 60);
      if (minutesStudied > 0 && currentSubject) {
        setCycleData(prev => ({
          ...prev,
          subjects: prev.subjects.map(s =>
            s.id === currentSubject.id
              ? { ...s, completedMinutes: s.completedMinutes + minutesStudied }
              : s
          ),
          lastStudyDate: new Date().toISOString()
        }));
      }
      setElapsedSeconds(0);
    }
    setIsStudying(!isStudying);
  };

  const nextSubject = () => {
    if (isStudying && elapsedSeconds > 0 && currentSubject) {
      const minutesStudied = Math.floor(elapsedSeconds / 60);
      setCycleData(prev => ({
        ...prev,
        subjects: prev.subjects.map(s =>
          s.id === currentSubject.id
            ? { ...s, completedMinutes: s.completedMinutes + minutesStudied }
            : s
        )
      }));
    }

    setIsStudying(false);
    setElapsedSeconds(0);

    setCycleData(prev => {
      const nextIndex = (prev.currentSubjectIndex + 1) % prev.subjects.length;
      const completedCycle = nextIndex === 0;

      return {
        ...prev,
        currentSubjectIndex: nextIndex,
        cycleNumber: completedCycle ? prev.cycleNumber + 1 : prev.cycleNumber,
        totalCyclesCompleted: completedCycle ? prev.totalCyclesCompleted + 1 : prev.totalCyclesCompleted,
        subjects: completedCycle
          ? prev.subjects.map(s => ({ ...s, completedMinutes: 0 }))
          : prev.subjects
      };
    });
  };

  const markSubjectComplete = (id: string) => {
    setCycleData(prev => ({
      ...prev,
      subjects: prev.subjects.map(s =>
        s.id === id
          ? { ...s, completedMinutes: s.targetHours * 60 }
          : s
      )
    }));

    if (currentSubject?.id === id) {
      nextSubject();
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 space-y-8">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-teal-600 to-emerald-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <RefreshCw size={28} />
              <h1 className="text-3xl font-bold">Ciclo de Estudos</h1>
            </div>
            <p className="text-teal-100 text-lg">
              Metodo Alexandre Meirelles - Estude todas as materias de forma rotativa
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-2xl px-6 py-3 backdrop-blur-sm">
              <div className="text-sm text-teal-100">Ciclo Atual</div>
              <div className="text-3xl font-bold">#{cycleData.cycleNumber}</div>
            </div>
            <div className="bg-white/20 rounded-2xl px-6 py-3 backdrop-blur-sm">
              <div className="text-sm text-teal-100">Ciclos Completos</div>
              <div className="text-3xl font-bold">{cycleData.totalCyclesCompleted}</div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progresso do Ciclo</span>
            <span>{cycleProgress.toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${cycleProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* ACTIVE STUDY AREA */}
      {currentSubject && (
        <ActiveStudyArea
          subject={currentSubject}
          currentIndex={cycleData.currentSubjectIndex}
          totalSubjects={cycleData.subjects.length}
          elapsedSeconds={elapsedSeconds}
          isStudying={isStudying}
          onToggleStudy={toggleStudy}
          onNextSubject={nextSubject}
          onMarkComplete={markSubjectComplete}
        />
      )}

      {/* SUBJECT LIST */}
      <SubjectList
        subjects={cycleData.subjects}
        currentSubjectIndex={cycleData.currentSubjectIndex}
        hasEditalData={!!editalData?.verticalizado}
        onAddSubject={addSubject}
        onRemoveSubject={removeSubject}
        onImportFromEdital={importFromEdital}
      />

      {/* TIPS */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-3xl p-6 border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Target size={18} className="text-teal-600" />
          Como usar o Ciclo de Estudos
        </h3>
        <ul className="text-slate-600 space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal-500 font-bold">1.</span>
            <span>Adicione todas as materias do edital com o tempo ideal para cada uma</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-500 font-bold">2.</span>
            <span>Estude seguindo a ordem do ciclo - ele se adapta ao seu ritmo</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-500 font-bold">3.</span>
            <span>Se precisar parar, nao tem problema - continue de onde parou</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-500 font-bold">4.</span>
            <span>Ao completar um ciclo, ele reinicia automaticamente para nova rodada</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

// Helpers
function getHoursFromWeight(peso: string): number {
  const pesoNum = parseInt(peso) || 1;
  if (pesoNum >= 3) return 3;
  if (pesoNum === 2) return 2;
  return 1;
}

function getPriorityFromWeight(peso: string): 'alta' | 'media' | 'baixa' {
  const pesoNum = parseInt(peso) || 1;
  if (pesoNum >= 3) return 'alta';
  if (pesoNum === 2) return 'media';
  return 'baixa';
}

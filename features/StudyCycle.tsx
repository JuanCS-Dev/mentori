import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Target, Calendar, Clock, Settings } from 'lucide-react';
import { usePersistence, useProgress } from '../hooks/usePersistence';
import { EditalJSON } from '../types';
import { ActiveStudyArea, SubjectList } from '../components/StudyCycleComponents';
import {
  StudyScheduler,
  SchedulerConfig
} from '../services/studyScheduler';
import {
  AlertBanner,
  generateProgressAlerts,
  StreakAlert,
  CountdownBadge
} from '../components/AlertBanner';

/**
 * Ciclo de Estudos - Kitchen Theme Refactor
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
  const [showConfig, setShowConfig] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Scheduler config
  const [schedulerConfig, setSchedulerConfig] = usePersistence<SchedulerConfig>('schedulerConfig', {
    dailyAvailableHours: 4,
    examDate: '',
    restDays: [0],
    preferredStartTime: '08:00',
    blockDurationMinutes: 50,
    breakDurationMinutes: 10
  });

  // Progress for alerts
  const { progress } = useProgress();

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

  // Countdown para a prova
  const countdown = useMemo(() => {
    if (!schedulerConfig.examDate) return null;
    return StudyScheduler.calculateCountdown(schedulerConfig.examDate);
  }, [schedulerConfig.examDate]);

  // Calcular progresso de metas
  const goalProgress = useMemo(() => {
    const weeklyMinutes = cycleData.subjects.reduce((sum, s) => sum + s.completedMinutes, 0);
    const dailyTarget = schedulerConfig.dailyAvailableHours * 60;
    const weeklyTarget = dailyTarget * (7 - schedulerConfig.restDays.length);

    // Estimar minutos estudados hoje baseado no ciclo atual
    const todayMinutes = isStudying ? Math.floor(elapsedSeconds / 60) : 0;
    const dailyPercentage = dailyTarget > 0 ? (todayMinutes / dailyTarget) * 100 : 0;
    const weeklyPercentage = weeklyTarget > 0 ? (weeklyMinutes / weeklyTarget) * 100 : 0;
    const deviationPercent = weeklyPercentage - 100;

    let status: 'on_track' | 'ahead' | 'behind' | 'critical' = 'on_track';
    if (deviationPercent < -30) status = 'critical';
    else if (deviationPercent < -15) status = 'behind';
    else if (deviationPercent > 10) status = 'ahead';

    return { deviationPercent, status, dailyPercentage };
  }, [cycleData.subjects, schedulerConfig, elapsedSeconds, isStudying]);

  // Gerar alertas
  const alerts = useMemo(() => {
    const allAlerts = generateProgressAlerts(
      goalProgress,
      countdown || undefined,
      progress.streakDays
    );
    return allAlerts.filter(a => !dismissedAlerts.has(a.id));
  }, [goalProgress, countdown, progress.streakDays, dismissedAlerts]);

  const handleDismissAlert = (id: string) => {
    setDismissedAlerts(prev => new Set([...prev, id]));
  };

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
      {/* ALERTS */}
      {alerts.length > 0 && (
        <AlertBanner alerts={alerts} onDismiss={handleDismissAlert} />
      )}

      {/* STREAK */}
      {progress.streakDays >= 3 && (
        <StreakAlert streak={progress.streakDays} />
      )}

      {/* HEADER */}
      <div className="bg-white border border-kitchen-border rounded-xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <RefreshCw size={24} className="text-kitchen-text-secondary" />
              <h1 className="text-2xl font-mono font-bold text-kitchen-text-primary">Ciclo_de_Estudos.exe</h1>
            </div>
            <p className="text-kitchen-text-secondary font-mono text-sm">
              Método: Alexandre Meirelles // Modo: Rotativo
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Countdown Badge */}
            {countdown && (
              <CountdownBadge daysRemaining={countdown.daysRemaining} />
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">Ciclo_Atual</div>
              <div className="text-xl font-mono font-bold text-gray-800">#{cycleData.cycleNumber}</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">Concluídos</div>
              <div className="text-xl font-mono font-bold text-gray-800">{cycleData.totalCyclesCompleted}</div>
            </div>

            {/* Config Button */}
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Settings size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Goals Config Panel */}
        {showConfig && (
          <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-xl animate-in slide-in-from-top duration-300">
            <h3 className="font-mono font-bold text-sm text-gray-700 mb-4 flex items-center gap-2">
              <Target size={16} />
              Configuração de Metas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">
                  Horas Diárias
                </label>
                <select
                  value={schedulerConfig.dailyAvailableHours}
                  onChange={(e) => setSchedulerConfig(prev => ({
                    ...prev,
                    dailyAvailableHours: Number(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm"
                >
                  {[2, 3, 4, 5, 6, 8, 10].map(h => (
                    <option key={h} value={h}>{h} horas</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">
                  Data da Prova
                </label>
                <input
                  type="date"
                  value={schedulerConfig.examDate}
                  onChange={(e) => setSchedulerConfig(prev => ({
                    ...prev,
                    examDate: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">
                  Horário de Início
                </label>
                <input
                  type="time"
                  value={schedulerConfig.preferredStartTime}
                  onChange={(e) => setSchedulerConfig(prev => ({
                    ...prev,
                    preferredStartTime: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm"
                />
              </div>
            </div>

            {/* Meta Summary */}
            {schedulerConfig.examDate && countdown && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-gray-600">
                      <strong>{countdown.daysRemaining}</strong> dias restantes
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-gray-600">
                      <strong>{(countdown.daysRemaining * schedulerConfig.dailyAvailableHours).toFixed(0)}</strong>h totais disponíveis
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target size={14} className="text-gray-400" />
                    <span className="text-gray-600">
                      Meta: <strong>{schedulerConfig.dailyAvailableHours}h/dia</strong>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs font-mono text-gray-500 mb-2 uppercase tracking-wide">
            <span>Progresso do Ciclo</span>
            <span>{cycleProgress.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
            <div
              className="h-full bg-kitchen-accent-greenText/80 rounded-full transition-all duration-500"
              style={{ width: `${cycleProgress}%` }}
            />
          </div>
        </div>

        {/* Daily Goal Progress */}
        {schedulerConfig.dailyAvailableHours > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs font-mono text-gray-500 mb-2 uppercase tracking-wide">
              <span>Meta Diária ({schedulerConfig.dailyAvailableHours}h)</span>
              <span className={goalProgress.status === 'behind' ? 'text-amber-600' : goalProgress.status === 'critical' ? 'text-red-600' : ''}>
                {goalProgress.dailyPercentage.toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  goalProgress.status === 'critical' ? 'bg-red-500' :
                  goalProgress.status === 'behind' ? 'bg-amber-500' :
                  goalProgress.status === 'ahead' ? 'bg-emerald-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, goalProgress.dailyPercentage)}%` }}
              />
            </div>
          </div>
        )}
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
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h3 className="font-bold font-mono text-gray-700 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
          <Target size={16} />
          Instruções de Uso
        </h3>
        <ul className="text-gray-600 space-y-2 text-sm font-mono">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">01.</span>
            <span>Adicione disciplinas do Edital com metas de horas.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">02.</span>
            <span>Siga a sequência. O sistema se adapta ao seu ritmo.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">03.</span>
            <span>Pause/Retome livremente. O estado é persistido.</span>
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

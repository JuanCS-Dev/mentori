import React, { useState, useEffect, Suspense } from 'react';
import { Layout } from './components/Layout';
import { LoadingFallback } from './components/LoadingFallback';
import { LevelUpModal } from './components/LevelUpModal';
import { BadgeUnlockModal } from './components/LevelUpModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { EditalJSON, BankProfileJSON, NeuroStudyPlanJSON, AppView } from './types';
import { BarChart2, CheckSquare, ArrowRight, TrendingUp, AlertTriangle, PenTool, Brain, Play, BookOpen, Layers } from 'lucide-react';
import { usePersistence, useProgress } from './hooks/usePersistence';
import { MentorProvider } from './contexts/MentorContext';
import { LevelUpResult } from './features/Gamification/LevelSystem';
import { Badge } from './features/Gamification/BadgeSystem';
import { useExplanationGenerator } from './hooks/useExplanationGenerator';

// =============================================================================
// LAZY LOADED FEATURES (CODE SPLITTING)
// =============================================================================
const EditalAnalyzer = React.lazy(() => import('./features/EditalAnalyzer').then(module => ({ default: module.EditalAnalyzer })));
const BankProfiler = React.lazy(() => import('./features/BankProfiler').then(module => ({ default: module.BankProfiler })));
const StudyPlanner = React.lazy(() => import('./features/StudyPlanner').then(module => ({ default: module.StudyPlanner })));
const QuestionBank = React.lazy(() => import('./features/QuestionBank').then(module => ({ default: module.QuestionBank })));
const MaterialGenerator = React.lazy(() => import('./features/MaterialGenerator').then(module => ({ default: module.MaterialGenerator })));
const DiscursiveMentor = React.lazy(() => import('./features/DiscursiveMentor').then(module => ({ default: module.DiscursiveMentor })));
const ProgressDashboard = React.lazy(() => import('./features/ProgressDashboard').then(module => ({ default: module.ProgressDashboard })));
const StudyCycle = React.lazy(() => import('./features/StudyCycle').then(module => ({ default: module.StudyCycle })));
const WeeklyReport = React.lazy(() => import('./features/WeeklyReport').then(module => ({ default: module.WeeklyReport })));
import { LandingPage } from './features/LandingPage';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);

  // Persisted State (survives page refresh)
  const [editalData, setEditalData] = usePersistence<EditalJSON | null>('editalData', null);
  const [profileData, setProfileData] = usePersistence<BankProfileJSON | null>('profileData', null);
  const [studyPlan, setStudyPlan] = usePersistence<NeuroStudyPlanJSON | null>('studyPlan', null);
  const [userMood] = usePersistence<'focused' | 'tired' | 'anxious'>('userMood', 'focused');

  // Gamification modals state
  const [levelUpData, setLevelUpData] = useState<LevelUpResult | null>(null);
  const [unlockedBadge, setUnlockedBadge] = useState<Badge | null>(null);

  // Get gamification events from progress hook
  const { consumeGamificationEvents } = useProgress();

  // Background AI explanation generation (runs in idle time)
  const explanationState = useExplanationGenerator(true, 5);

  // Log explanation generation status (development only)
  useEffect(() => {
    if (explanationState.isGenerating) {
      console.log(`🧠 Generating explanations... ${explanationState.questionsProcessed} done, ${explanationState.questionsRemaining} remaining`);
    }
  }, [explanationState.isGenerating, explanationState.questionsProcessed, explanationState.questionsRemaining]);

  // Poll for gamification events (triggered by question answers)
  useEffect(() => {
    const checkEvents = () => {
      const events = consumeGamificationEvents();
      for (const event of events) {
        if (event.type === 'level_up') {
          setLevelUpData(event.data as LevelUpResult);
        } else if (event.type === 'badge_unlocked') {
          setUnlockedBadge(event.data as Badge);
        }
      }
    };

    // Check every second for new events
    const interval = setInterval(checkEvents, 1000);
    return () => clearInterval(interval);
  }, [consumeGamificationEvents]);

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* COMMAND CENTER HEADER */}
      <div className="flex items-center justify-between border-b border-kitchen-border pb-6">
        <div>
          <h2 className="text-2xl font-mono font-bold text-kitchen-text-primary flex items-center gap-2">
            <Brain className="text-gray-400" /> Centro de Comando de Estudos
          </h2>
          <p className="text-kitchen-text-secondary font-mono text-sm mt-1">
            Sessão ativa atual: {studyPlan ? 'Plano Estratégico #492' : 'Nenhuma sessão ativa'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCurrentView(AppView.PLAN)} className="bg-kitchen-accent-blue text-kitchen-accent-blueText px-4 py-2 rounded-lg text-sm font-bold font-mono hover:opacity-90 transition-opacity">
            + Novo Plano de Estudo
          </button>
        </div>
      </div>

      {/* ACTIVE SESSION CARD */}
      <div className="bg-white border border-kitchen-border rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg">Missão Diária: Protocolo {userMood.toUpperCase()}</h3>
                <span className="bg-kitchen-accent-green text-kitchen-accent-greenText text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  EM ANDAMENTO
                </span>
              </div>
              <p className="text-gray-500 text-sm max-w-xl">
                {studyPlan
                  ? "Execução de blocos estratégicos baseados na carga cognitiva atual."
                  : "Inicialize um Plano de Estudo para começar sua sessão."}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-2xl font-mono font-bold text-gray-800">00:45:00</span>
            <span className="text-xs text-gray-400 uppercase tracking-wider">Tempo Restante</span>
          </div>
        </div>

        {/* REQUIRED MATERIALS */}
        <div className="border-t border-gray-100 pt-6">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">MATERIAIS NECESSÁRIOS</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <BookOpen size={16} className="text-blue-500" />
              <span className="font-mono text-sm">Leis 8.112 (Leitura)</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <Layers size={16} className="text-amber-500" />
              <span className="font-mono text-sm">Flashcards (Revisão)</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <PenTool size={16} className="text-rose-500" />
              <span className="font-mono text-sm">Discursiva (Escrita)</span>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setCurrentView(AppView.STUDY_CYCLE)}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-mono text-sm font-bold hover:bg-gray-800 transition-colors"
          >
            <Play size={16} /> Iniciar Modo Foco
          </button>
          <button
            onClick={() => setCurrentView(AppView.PLAN)}
            className="px-6 py-3 border border-gray-200 text-gray-600 rounded-lg font-mono text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            Ajustar Plano
          </button>
        </div>
      </div>

      {/* COGNITIVE MODULES */}
      <div>
        <h3 className="font-mono font-bold text-sm text-gray-500 uppercase tracking-wider mb-4">MÓDULOS COGNITIVOS</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div onClick={() => setCurrentView(AppView.EDITAL)} className="bg-white border border-kitchen-border p-4 rounded-xl hover:shadow-md transition-all cursor-pointer group">
            <div className="text-blue-500 mb-2 group-hover:scale-110 transition-transform"><CheckSquare size={24} /></div>
            <div className="font-mono font-bold text-sm">Edital_Analyzer()</div>
          </div>
          <div onClick={() => setCurrentView(AppView.PROFILE)} className="bg-white border border-kitchen-border p-4 rounded-xl hover:shadow-md transition-all cursor-pointer group">
            <div className="text-purple-500 mb-2 group-hover:scale-110 transition-transform"><BarChart2 size={24} /></div>
            <div className="font-mono font-bold text-sm">Bank_Profiler()</div>
          </div>
          <div onClick={() => setCurrentView(AppView.DISCURSIVE)} className="bg-white border border-kitchen-border p-4 rounded-xl hover:shadow-md transition-all cursor-pointer group">
            <div className="text-rose-500 mb-2 group-hover:scale-110 transition-transform"><PenTool size={24} /></div>
            <div className="font-mono font-bold text-sm">Discursive_Mentor()</div>
          </div>
          <div onClick={() => setCurrentView(AppView.QUESTIONS)} className="bg-white border border-kitchen-border p-4 rounded-xl hover:shadow-md transition-all cursor-pointer group">
            <div className="text-orange-500 mb-2 group-hover:scale-110 transition-transform"><TrendingUp size={24} /></div>
            <div className="font-mono font-bold text-sm">Question_Bank()</div>
          </div>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {currentView === AppView.LANDING ? (
        <LandingPage onEnterApp={() => setCurrentView(AppView.DASHBOARD)} />
      ) : (
        <MentorProvider currentView={currentView}>
          <Layout currentView={currentView} onNavigate={setCurrentView}>
            <Suspense fallback={<LoadingFallback />}>
            {currentView === AppView.DASHBOARD && renderDashboard()}

            {currentView === AppView.EDITAL && (
              <EditalAnalyzer onDataUpdate={setEditalData} savedData={editalData} />
            )}

            {currentView === AppView.PROFILE && (
              <BankProfiler onDataUpdate={setProfileData} savedData={profileData} />
            )}

            {currentView === AppView.PLAN && (
              <StudyPlanner
                editalData={editalData}
                profileData={profileData}
                onPlanUpdate={setStudyPlan}
                savedPlan={studyPlan}
              />
            )}

            {currentView === AppView.PROGRESS && <ProgressDashboard userMood={userMood} studyPlan={studyPlan} />}

            {currentView === AppView.STUDY_CYCLE && <StudyCycle editalData={editalData} />}

            {currentView === AppView.QUESTIONS && <QuestionBank />}

            {currentView === AppView.MATERIAL && <MaterialGenerator bankProfile={profileData ? JSON.stringify(profileData) : ""} />}

            {currentView === AppView.DISCURSIVE && editalData && <DiscursiveMentor metadata={editalData.metadata} />}

            {currentView === AppView.DISCURSIVE && !editalData && (
              <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-10 rounded-xl inline-block shadow-sm border border-kitchen-border">
                  <div className="mb-6 bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle size={40} className="text-red-500" />
                  </div>
                  <h2 className="text-xl font-bold font-mono text-gray-800 mb-2">Acesso Negado</h2>
                  <p className="text-gray-500 mb-8 max-w-md font-mono text-sm">
                    Erro: Dados do edital não encontrados. Por favor, execute Edital_Analyzer() primeiro.
                  </p>
                  <button
                    onClick={() => setCurrentView(AppView.EDITAL)}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold font-mono hover:bg-blue-700 transition-all flex items-center gap-2 mx-auto"
                  >
                    Executar Analisador <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {currentView === AppView.WEEKLY_REPORT && (
              <WeeklyReport
                onClose={() => setCurrentView(AppView.PROGRESS)}
                onNavigateToDiscipline={(discipline) => {
                  console.log('Navigate to discipline:', discipline);
                  setCurrentView(AppView.QUESTIONS);
                }}
              />
            )}
            </Suspense>

            {/* Offline Indicator */}
            <OfflineIndicator className="fixed bottom-4 right-4 z-50" />
          </Layout>
        </MentorProvider>
      )}

      {/* Gamification Modals */}
      {levelUpData && (
        <LevelUpModal
          result={levelUpData}
          onClose={() => setLevelUpData(null)}
        />
      )}

      {unlockedBadge && (
        <BadgeUnlockModal
          badge={unlockedBadge}
          onClose={() => setUnlockedBadge(null)}
        />
      )}
    </>
  );
};

export default App;

import React, { useState, useEffect, Suspense } from 'react';
import { Layout } from './components/Layout';
import { LoadingFallback } from './components/LoadingFallback';
import { LevelUpModal } from './components/LevelUpModal';
import { BadgeUnlockModal } from './components/LevelUpModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { EditalJSON, BankProfileJSON, NeuroStudyPlanJSON, AppView } from './types';
import { ArrowRight, AlertTriangle } from 'lucide-react';
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
const SalesLanding = React.lazy(() => import('./features/SalesLanding').then(module => ({ default: module.SalesLanding })));
const DashboardHub = React.lazy(() => import('./features/DashboardHub').then(module => ({ default: module.DashboardHub })));
import { LandingPage } from './features/LandingPage';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.SALES_LANDING);

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

  return (
    <>
      {currentView === AppView.SALES_LANDING ? (
        <Suspense fallback={<LoadingFallback />}>
          <SalesLanding onEnterApp={() => setCurrentView(AppView.DASHBOARD)} />
        </Suspense>
      ) : currentView === AppView.LANDING ? (
        <LandingPage onEnterApp={() => setCurrentView(AppView.DASHBOARD)} />
      ) : (
        <MentorProvider currentView={currentView}>
          <Layout currentView={currentView} onNavigate={setCurrentView}>
            <Suspense fallback={<LoadingFallback />}>
            {currentView === AppView.DASHBOARD && (
              <DashboardHub studyPlan={studyPlan} onNavigate={setCurrentView} />
            )}

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

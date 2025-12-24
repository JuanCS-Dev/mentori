import React, { useState, Suspense } from 'react';
import { Layout } from './components/Layout';
import { LoadingFallback } from './components/LoadingFallback';
import { EditalJSON, BankProfileJSON, NeuroStudyPlanJSON, AppView } from './types';
import { BarChart2, CheckSquare, ArrowRight, TrendingUp, Zap, Battery, Activity, AlertTriangle, PenTool } from 'lucide-react';
import { usePersistence } from './hooks/usePersistence';

// =============================================================================
// LAZY LOADED FEATURES (CODE SPLITTING)
// =============================================================================
// Using named export handling pattern for React.lazy
const EditalAnalyzer = React.lazy(() => import('./features/EditalAnalyzer').then(module => ({ default: module.EditalAnalyzer })));
const BankProfiler = React.lazy(() => import('./features/BankProfiler').then(module => ({ default: module.BankProfiler })));
const StudyPlanner = React.lazy(() => import('./features/StudyPlanner').then(module => ({ default: module.StudyPlanner })));
const QuestionBank = React.lazy(() => import('./features/QuestionBank').then(module => ({ default: module.QuestionBank })));
const MaterialGenerator = React.lazy(() => import('./features/MaterialGenerator').then(module => ({ default: module.MaterialGenerator })));
const DiscursiveMentor = React.lazy(() => import('./features/DiscursiveMentor').then(module => ({ default: module.DiscursiveMentor })));
const ProgressDashboard = React.lazy(() => import('./features/ProgressDashboard').then(module => ({ default: module.ProgressDashboard })));
const StudyCycle = React.lazy(() => import('./features/StudyCycle').then(module => ({ default: module.StudyCycle })));

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);

  // Persisted State (survives page refresh)
  const [editalData, setEditalData] = usePersistence<EditalJSON | null>('editalData', null);
  const [profileData, setProfileData] = usePersistence<BankProfileJSON | null>('profileData', null);
  const [studyPlan, setStudyPlan] = usePersistence<NeuroStudyPlanJSON | null>('studyPlan', null);
  const [userMood, setUserMood] = usePersistence<'focused' | 'tired' | 'anxious'>('userMood', 'focused');

  const getMentorMessage = () => {
      switch (userMood) {
          case 'focused': return "Sua mente está afiada. Hoje é dia de atacar os tópicos de alta complexidade (Peso 3). Vamos elevar a barra.";
          case 'tired': return "Detectei fadiga. Ajustei a rota: vamos focar em revisão ativa leve e questões simples para manter a constância sem burnout.";
          case 'anxious': return "Respire. A ansiedade é apenas ruído. Quebrei sua meta em micro-tarefas de 15 minutos. Apenas comece a primeira.";
      }
  };

  const getDailyMission = () => {
      if (!studyPlan) return "Sua missão será definida assim que gerarmos seu Plano Estratégico.";
      switch (userMood) {
          case 'focused': return "Simular Prova Discursiva de Alto Nível (Peça Profissional).";
          case 'tired': return "Revisar Flashcards de 'Atos Administrativos' por 20 minutos.";
          case 'anxious': return "Fazer 5 questões fáceis de 'Português' para ganhar confiança.";
      }
  };

  const renderDashboard = () => (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 space-y-8">
      
      {/* MENTOR COMMAND CENTER */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] opacity-30 transition-colors duration-1000 pointer-events-none
              ${userMood === 'focused' ? 'bg-emerald-500' : userMood === 'tired' ? 'bg-blue-500' : 'bg-amber-500'}`}>
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-7 space-y-8">
                  <div>
                      <div className="flex items-center gap-2 mb-2 text-slate-400 font-mono text-xs uppercase tracking-widest">
                          <Activity size={14} className={userMood === 'focused' ? 'text-emerald-400' : 'text-slate-400'} />
                          Status do Sistema Cognitivo
                      </div>
                      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                          Bom dia, Juan.
                      </h1>
                      <p className="text-xl leading-relaxed font-medium text-slate-200">
                          {getMentorMessage()}
                      </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 inline-block border border-white/10">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-3 px-1">Calibrar Estratégia do Dia</p>
                      <div className="flex gap-2">
                          <button 
                            onClick={() => setUserMood('focused')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${userMood === 'focused' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                          >
                              <Zap size={16} /> Focado
                          </button>
                          <button 
                            onClick={() => setUserMood('tired')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${userMood === 'tired' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                          >
                              <Battery size={16} /> Cansado
                          </button>
                          <button 
                            onClick={() => setUserMood('anxious')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${userMood === 'anxious' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                          >
                              <AlertTriangle size={16} /> Ansioso
                          </button>
                      </div>
                  </div>
              </div>

              <div className="lg:col-span-5">
                  <div className="h-full bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col justify-between hover:bg-white/10 transition-colors cursor-default group">
                      <div>
                          <div className="flex justify-between items-start mb-6">
                              <div className="p-3 bg-white rounded-2xl text-slate-900 shadow-lg group-hover:scale-110 transition-transform">
                                  <TrendingUp size={24} />
                              </div>
                              <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30 animate-pulse">
                                  PRIORIDADE ALTA
                              </span>
                          </div>
                          <h3 className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-2">Missão Tática de Hoje</h3>
                          <p className="text-2xl font-bold text-white leading-snug">
                              "{getDailyMission()}"
                          </p>
                      </div>
                      <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                           <span className="text-sm font-mono text-slate-400">Tempo estimado: 45 min</span>
                           <button onClick={() => setCurrentView(userMood === 'focused' ? AppView.DISCURSIVE : AppView.PLAN)} className="text-sm font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-2 transition-colors">
                               Iniciar Protocolo <ArrowRight size={16} />
                           </button>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* QUICK ACTIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card p-6 rounded-3xl hover:-translate-y-2 transition-transform duration-300 group cursor-pointer relative overflow-hidden" onClick={() => setCurrentView(AppView.EDITAL)}>
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CheckSquare size={100} />
             </div>
             <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors shadow-sm">
                <CheckSquare size={24} />
             </div>
             <h3 className="font-bold text-xl text-slate-800 mb-2">Edital</h3>
             <p className="text-slate-500 text-sm mb-6 font-medium leading-relaxed">
                {editalData ? 'Análise concluída.' : 'Pendente. Importe o edital.'}
             </p>
             <div className="flex items-center gap-2 text-sm font-bold text-blue-600 group-hover:translate-x-2 transition-transform">
                {editalData ? 'Ver Análise' : 'Iniciar'} <ArrowRight size={16} />
             </div>
        </div>

        <div className="glass-card p-6 rounded-3xl hover:-translate-y-2 transition-transform duration-300 group cursor-pointer relative overflow-hidden" onClick={() => setCurrentView(AppView.PROFILE)}>
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BarChart2 size={100} />
             </div>
             <div className="h-12 w-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:bg-purple-500 group-hover:text-white transition-colors shadow-sm">
                <BarChart2 size={24} />
             </div>
             <h3 className="font-bold text-xl text-slate-800 mb-2">Inteligência da Banca</h3>
             <p className="text-slate-500 text-sm mb-6 font-medium leading-relaxed">
                {profileData ? 'Dossiê disponível.' : 'Descubra o perfil da banca.'}
             </p>
             <div className="flex items-center gap-2 text-sm font-bold text-purple-600 group-hover:translate-x-2 transition-transform">
                {profileData ? 'Ver Dossiê' : 'Investigar'} <ArrowRight size={16} />
             </div>
        </div>

        <div className="glass-card p-6 rounded-3xl hover:-translate-y-2 transition-transform duration-300 group cursor-pointer relative overflow-hidden" onClick={() => setCurrentView(AppView.DISCURSIVE)}>
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <PenTool size={100} />
             </div>
             <div className="h-12 w-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-600 mb-6 group-hover:bg-rose-500 group-hover:text-white transition-colors shadow-sm">
                <PenTool size={24} />
             </div>
             <h3 className="font-bold text-xl text-slate-800 mb-2">Batalha Discursiva</h3>
             <p className="text-slate-500 text-sm mb-6 font-medium leading-relaxed">
                Treine escrita sob pressão com correção instantânea.
             </p>
             <div className="flex items-center gap-2 text-sm font-bold text-rose-600 group-hover:translate-x-2 transition-transform">
                Iniciar Simulado <ArrowRight size={16} />
             </div>
        </div>
      </div>
    </div>
  );

  return (
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
        
        {currentView === AppView.PROGRESS && <ProgressDashboard />}
        
        {currentView === AppView.STUDY_CYCLE && <StudyCycle editalData={editalData} />}
        
        {currentView === AppView.QUESTIONS && <QuestionBank />}
        
        {currentView === AppView.MATERIAL && <MaterialGenerator bankProfile={profileData ? JSON.stringify(profileData) : ""} />}
        
        {currentView === AppView.DISCURSIVE && editalData && <DiscursiveMentor metadata={editalData.metadata} />}
        
        {currentView === AppView.DISCURSIVE && !editalData && (
          <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/50 backdrop-blur-sm p-10 rounded-3xl inline-block shadow-xl border border-slate-100">
              <div className="mb-6 bg-rose-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={40} className="text-rose-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Acesso Restrito</h2>
              <p className="text-slate-500 mb-8 max-w-md">
                Para iniciar a Batalha Discursiva, nossa IA precisa primeiro analisar o DNA do seu edital.
              </p>
              <button
                onClick={() => setCurrentView(AppView.EDITAL)}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 mx-auto"
              >
                Ir para Análise de Edital <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </Suspense>
    </Layout>
  );
};

export default App;

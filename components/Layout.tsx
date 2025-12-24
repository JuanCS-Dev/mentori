import React from 'react';
import { FileText, BarChart2, Calendar, Brain, Settings, FileOutput, Sparkles, PenTool, TrendingUp, RefreshCw } from 'lucide-react';
import { AppView } from '../types';

interface LayoutProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children }) => {
  const navItems = [
    { view: AppView.DASHBOARD, label: 'Dashboard', icon: <BarChart2 size={20} /> },
    { view: AppView.PROGRESS, label: 'Meu Progresso', icon: <TrendingUp size={20} /> },
    { view: AppView.EDITAL, label: 'Análise de Edital', icon: <FileText size={20} /> },
    { view: AppView.PROFILE, label: 'Perfil da Banca', icon: <Settings size={20} /> },
    { view: AppView.PLAN, label: 'Plano de Estudos', icon: <Calendar size={20} /> },
    { view: AppView.STUDY_CYCLE, label: 'Ciclo de Estudos', icon: <RefreshCw size={20} /> },
    { view: AppView.QUESTIONS, label: 'Banco de Questões', icon: <Brain size={20} /> },
    { view: AppView.DISCURSIVE, label: 'Batalha Discursiva', icon: <PenTool size={20} /> },
    { view: AppView.MATERIAL, label: 'Material Estratégico', icon: <FileOutput size={20} /> },
  ];

  return (
    // Outer Container handling the "Margins before the menu"
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-6 lg:p-8 overflow-hidden">

      {/* The Floating App Window */}
      <div className="flex w-full max-w-[1600px] h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/50 ring-1 ring-black/5 overflow-hidden relative">

        {/* Sidebar */}
        <aside className="w-[280px] bg-slate-900/95 backdrop-blur-xl text-slate-300 flex flex-col border-r border-white/10 z-20 flex-shrink-0 h-full">
          <div className="p-8 flex items-center gap-3 text-white">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30 text-2xl">
              🎓
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight leading-none">Mentori</h1>
              <span className="text-[10px] uppercase tracking-widest text-indigo-300 font-semibold">Seu Mentor IA</span>
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-hide">
            <div className="px-4 pb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Menu Principal</div>
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${currentView === item.view
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-900/40 border border-white/10'
                  : 'hover:bg-white/5 hover:text-white text-slate-400'
                  }`}
              >
                <span className={`transition-transform duration-300 ${currentView === item.view ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                <span className="font-medium tracking-wide text-sm">{item.label}</span>
                {currentView === item.view && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-6 mt-auto">
            <div className="glass bg-indigo-900/30 border border-indigo-500/20 rounded-2xl p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-indigo-500 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="flex items-center gap-2 text-indigo-200 mb-1">
                <Sparkles size={14} className="text-yellow-300" />
                <span className="text-xs font-bold uppercase tracking-wide">Gemini 3.0 Pro</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Motor neural ativo.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-white/40">
          <header className="px-10 py-6 flex items-center justify-between z-10 bg-white/30 backdrop-blur-sm border-b border-white/40">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                {navItems.find(i => i.view === currentView)?.label}
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                Bem-vindo à sua central de aprovação.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="glass px-4 py-2 rounded-full flex items-center gap-2 shadow-sm border border-white/60">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold text-slate-600 tracking-wide uppercase">Online</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 border border-white shadow-md flex items-center justify-center text-slate-600 font-bold text-sm">
                US
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto px-10 pb-10 pt-8 scrollbar-hide relative">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

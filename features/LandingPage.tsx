import React from 'react';
import { BookOpen, Plus, Terminal, GraduationCap } from 'lucide-react';

export const LandingPage: React.FC<{ onEnterApp?: () => void }> = ({ onEnterApp }) => {
  return (
    <div className="min-h-screen bg-kitchen-bg font-sans text-kitchen-text-primary p-8">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-mono font-bold mb-2 flex items-center gap-3">
          Espaço Mentori AI
        </h1>
        <p className="text-kitchen-text-secondary font-mono">
          Desafie seus limites cognitivos com planejamento de estudos via IA:
        </p>
      </div>

      {/* BANNER */}
      <div className="max-w-7xl mx-auto bg-kitchen-accent-blue border border-blue-200 rounded-xl p-6 mb-12 flex items-center justify-center text-center shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-kitchen-accent-blueText flex items-center justify-center gap-2 mb-2 font-mono tracking-wide">
            <GraduationCap className="text-blue-600" /> DESAFIO SUPREMO DA APROVAÇÃO <GraduationCap className="text-blue-600" />
          </h2>
          <p className="text-blue-800 opacity-80 font-mono text-sm">
            Sequencie blocos de estudo e ferramentas cognitivas para dominar seu edital
          </p>
        </div>
      </div>

      {/* ORDERS SECTION -> ACTIVE MISSIONS */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="mb-4">
          <h3 className="font-mono font-bold text-sm text-kitchen-text-secondary uppercase tracking-wider">MISSÕES ATIVAS</h3>
          <p className="text-sm text-gray-500">Metas de prova para cumprir com sessões de estudo</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Card 1: Easy */}
          <div className="bg-white border border-kitchen-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4">
              <span className="bg-kitchen-accent-green text-kitchen-accent-greenText text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                BASE
              </span>
            </div>
            <div className="flex items-center justify-center mb-4 text-4xl">
              ⚖️
            </div>
            <h4 className="font-bold text-center mb-1">Lei 8.112</h4>
            <p className="text-xs text-center text-gray-500 mb-6">Não iniciado</p>
            <button 
              onClick={onEnterApp}
              className="w-full py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Iniciar Módulo
            </button>
          </div>

          {/* Card 2: Intermediate */}
          <div className="bg-white border border-kitchen-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4">
              <span className="bg-kitchen-accent-yellow text-kitchen-accent-yellowText text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                INTERMEDIÁRIO
              </span>
            </div>
            <div className="flex items-center justify-center mb-4 text-4xl">
              📜
            </div>
            <h4 className="font-bold text-center mb-1">Constitucional</h4>
            <p className="text-xs text-center text-gray-500 mb-6">Em andamento</p>
            <button 
              onClick={onEnterApp}
              className="w-full py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Continuar
            </button>
          </div>

          {/* Card 3: Difficult */}
          <div className="bg-white border border-kitchen-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4">
              <span className="bg-kitchen-accent-red text-kitchen-accent-redText text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                AVANÇADO
              </span>
            </div>
            <div className="flex items-center justify-center mb-4 text-4xl">
              ✍️
            </div>
            <h4 className="font-bold text-center mb-1">Discursiva</h4>
            <p className="text-xs text-center text-gray-500 mb-6">Não iniciado</p>
            <button 
              onClick={onEnterApp}
              className="w-full py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Simular
            </button>
          </div>

          {/* Card 4: Add New */}
          <div className="border border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer group" onClick={onEnterApp}>
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Plus size={24} />
            </div>
            <span className="text-sm font-medium text-gray-600">Nova Meta</span>
            <span className="text-xs text-gray-400 mt-1">Clique para adicionar</span>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: KNOWLEDGE BASE & TOOLS */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* INGREDIENTS -> KNOWLEDGE BASE */}
        <div>
          <div className="flex justify-between items-end mb-4 border-b border-gray-200 pb-2">
            <div>
              <h3 className="font-mono font-bold text-sm text-kitchen-text-secondary uppercase tracking-wider">BASE DE CONHECIMENTO</h3>
              <p className="text-xs text-gray-500">Selecione as disciplinas para focar</p>
            </div>
            <span className="font-mono text-xs text-gray-400">total: 12</span>
          </div>

          <div className="bg-white border border-kitchen-border rounded-xl overflow-hidden shadow-sm">
            {['Atos Administrativos', 'Crase & Sintaxe', 'Probabilidade', 'Redes de Computadores', 'Responsabilidade Civil', 'Licitações 14.133', 'Juros Compostos'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors">
                <span className="text-lg text-gray-400">
                  <BookOpen size={16} />
                </span>
                <span className="font-mono text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* TOOLS -> COGNITIVE TOOLS */}
        <div>
          <div className="flex justify-between items-end mb-4 border-b border-gray-200 pb-2">
            <div>
              <h3 className="font-mono font-bold text-sm text-kitchen-text-secondary uppercase tracking-wider">FERRAMENTAS COGNITIVAS</h3>
              <p className="text-xs text-gray-500">Use chamadas de função para acelerar o aprendizado</p>
            </div>
            <span className="font-mono text-xs text-gray-400">total: 8</span>
          </div>

          <div className="bg-white border border-kitchen-border rounded-xl overflow-hidden shadow-sm">
             {['study_flashcards()', 'solve_quiz()', 'summarize_pdf()', 'generate_map()', 'explain_concept()', 'track_progress()', 'simulate_exam()'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors group">
                <span className="text-gray-400 group-hover:text-blue-500 transition-colors">
                  <Terminal size={16} />
                </span>
                <span className="font-mono text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import {
  BarChart2, Calendar, Brain, Settings,
  Sparkles, PenTool, TrendingUp, RefreshCw, MessageSquare,
  Terminal, Command, Loader2, Send
} from 'lucide-react';
import { AppView } from '../types';
import { useMentor } from '../contexts/MentorContext';

interface LayoutProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children }) => {
  const { messages, isStreaming, isOpen, setIsOpen, sendMessage } = useMentor();
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detect if should use Pro model (commands or long text)
  const shouldUsePro = (text: string): boolean => {
    const proCommands = ['/analisar', '/explicar', '/autopsia', '/plano', '/material'];
    return proCommands.some(cmd => text.toLowerCase().startsWith(cmd)) || text.length > 200;
  };

  // Send message handler
  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const currentInput = input.trim();
    setInput('');
    await sendMessage(currentInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const navItems = [
    { view: AppView.DASHBOARD, label: 'Painel', icon: <BarChart2 size={20} /> },
    { view: AppView.STUDY_CYCLE, label: 'Ciclos', icon: <RefreshCw size={20} /> },
    { view: AppView.PLAN, label: 'Plano', icon: <Calendar size={20} /> },
    { view: AppView.QUESTIONS, label: 'Questões', icon: <Brain size={20} /> },
    { view: AppView.PROGRESS, label: 'Estatísticas', icon: <TrendingUp size={20} /> },
    { view: AppView.DISCURSIVE, label: 'Mentor', icon: <PenTool size={20} /> },
  ];

  return (
    <div className="flex h-screen w-full bg-kitchen-bg font-sans text-kitchen-text-primary overflow-hidden">
      
      {/* 1. LEFT RAIL (Navigation) */}
      <nav className="w-16 flex-shrink-0 bg-white border-r border-kitchen-border flex flex-col items-center py-6 z-20">
        <div className="mb-8 p-2 bg-blue-50 rounded-xl text-blue-600">
          <Brain size={24} />
        </div>
        
        <div className="flex-1 w-full flex flex-col items-center gap-4">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`p-3 rounded-xl transition-all duration-200 group relative ${
                currentView === item.view 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              }`}
              title={item.label}
            >
              {item.icon}
              {/* Tooltip */}
              <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                {item.label}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-auto pb-4">
          <button className="p-3 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
            <Settings size={20} />
          </button>
        </div>
      </nav>

      {/* 2. CENTER STAGE (Main Content) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-kitchen-border bg-white flex-shrink-0">
          <div>
            <h1 className="text-xl font-mono font-bold tracking-tight flex items-center gap-2">
              Painel Mentori
              <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">v2.1</span>
            </h1>
            <p className="text-xs text-gray-500 font-mono">Otimize seu desempenho cognitivo</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
            >
              <MessageSquare size={16} />
              {isOpen ? 'Esconder Console' : 'Mostrar Console'}
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            {children}
          </div>
        </div>
      </main>

      {/* 3. RIGHT SIDEBAR (Mentor Console) */}
      <aside
        className={`bg-[#1e1e1e] text-gray-300 border-l border-gray-700 transition-all duration-300 ease-in-out flex flex-col ${
          isOpen ? 'w-[400px]' : 'w-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-700 flex-shrink-0 bg-[#1e1e1e]">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-400" />
            <span className="font-mono font-bold text-white tracking-tight">Console do Mentor</span>
          </div>
          <div className="flex gap-2">
            <button className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors">
              <Terminal size={14} />
            </button>
          </div>
        </div>

        {/* Console / Chat Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-sm bg-[#1e1e1e]">

          {/* System Log - Always visible */}
          <div className="bg-[#2d2d2d] p-4 rounded-lg border border-gray-600 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-3 uppercase tracking-widest font-bold">
              <Terminal size={12} />
              <span>Log do Sistema</span>
            </div>
            <div className="space-y-1">
              <p className="text-green-400 font-bold flex gap-2">
                <span className="opacity-50">$</span> Motor Cognitivo inicializado.
              </p>
              <p className="text-gray-400 flex gap-2">
                <span className="opacity-50">#</span> {messages.length === 0 ? 'Digite uma mensagem para começar...' : `${messages.length} mensagens na sessão`}
              </p>
            </div>
          </div>

          {/* Dynamic Messages */}
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={msg.timestamp + idx} className="flex flex-col gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest pl-1 ${
                  msg.role === 'user' ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {msg.role === 'user' ? 'Estudante' : 'Mentor IA'}
                </span>
                <div className={`leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#2d2d2d] p-3 rounded-lg text-white border border-gray-600 shadow-sm'
                    : 'text-gray-300 pl-1'
                }`}>
                  {msg.content || (isStreaming && idx === messages.length - 1 && (
                    <span className="inline-flex items-center gap-2 text-gray-500">
                      <Loader2 size={14} className="animate-spin" />
                      Pensando...
                    </span>
                  ))}
                  {/* Streaming cursor */}
                  {isStreaming && idx === messages.length - 1 && msg.content && (
                    <span className="inline-block w-2 h-4 bg-yellow-400 ml-1 animate-pulse" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Auto-scroll anchor */}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-700 bg-[#1e1e1e] flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-3 bg-[#2d2d2d] rounded-lg border border-gray-600 focus-within:border-gray-500 focus-within:ring-1 focus-within:ring-gray-500 transition-all shadow-inner">
            <Command size={14} className="text-gray-400" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Pergunte ao seu mentor..."
              disabled={isStreaming}
              className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-gray-500 font-mono disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isStreaming}
              className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <div className="flex justify-between items-center mt-3 text-[10px] text-gray-500 font-mono px-1">
            <span className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`} />
              {isStreaming ? 'Processando...' : 'Pronto'}
            </span>
            <span>{shouldUsePro(input) ? 'Gemini Pro 2.5' : 'Gemini Flash 2.5'}</span>
          </div>
        </div>
      </aside>

    </div>
  );
};

import React, { useState, useRef, useEffect } from "react";
import {
  Calendar,
  Brain,
  Settings,
  PenTool,
  TrendingUp,
  RefreshCw,
  Terminal,
  Loader2,
  Send,
  FileText,
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity,
} from "lucide-react";
import { AppView } from "../types";
import { useMentor } from "../contexts/MentorContext";

interface LayoutProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentView,
  onNavigate,
  children,
}) => {
  const { messages, isStreaming, isOpen, setIsOpen, sendMessage } = useMentor();
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const shouldUsePro = (text: string): boolean => {
    const proCommands = [
      "/analisar",
      "/explicar",
      "/autopsia",
      "/plano",
      "/material",
    ];
    return (
      proCommands.some((cmd) => text.toLowerCase().startsWith(cmd)) ||
      text.length > 200
    );
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const currentInput = input.trim();
    setInput("");
    await sendMessage(currentInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const navItems = [
    {
      view: AppView.DASHBOARD,
      label: "OPS CENTER",
      icon: <Activity size={20} />,
    },
    {
      view: AppView.STUDY_CYCLE,
      label: "TACTICAL CYCLES",
      icon: <RefreshCw size={20} />,
    },
    { view: AppView.PLAN, label: "BATTLE PLAN", icon: <Calendar size={20} /> },
    {
      view: AppView.QUESTIONS,
      label: "NEURAL DRILL",
      icon: <Brain size={20} />,
    },
    {
      view: AppView.PROGRESS,
      label: "INTEL REPORT",
      icon: <TrendingUp size={20} />,
    },
    {
      view: AppView.WEEKLY_REPORT,
      label: "MISSION BRIEF",
      icon: <FileText size={20} />,
    },
    {
      view: AppView.DISCURSIVE,
      label: "STRATEGIC MENTOR",
      icon: <PenTool size={20} />,
    },
  ];

  return (
    <div className="flex h-screen w-full bg-[#09090B] font-sans text-[#FAFAFA] overflow-hidden">
      {/* 1. LEFT RAIL (Tactical Navigation) */}
      <nav className="w-20 flex-shrink-0 bg-[#09090B] border-r border-zinc-800 flex flex-col items-center py-8 z-20">
        <div className="mb-10 p-2.5 bg-[#00F0FF]/10 rounded-lg text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.1)] border border-[#00F0FF]/20">
          <ShieldCheck size={28} />
        </div>

        <div className="flex-1 w-full flex flex-col items-center gap-6">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`p-3 rounded-lg transition-all duration-300 group relative ${
                currentView === item.view
                  ? "bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 shadow-[0_0_10px_rgba(0,240,255,0.1)]"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50"
              }`}
              title={item.label}
            >
              {item.icon}
              {/* Tooltip */}
              <div className="absolute left-16 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black border border-zinc-800 text-[#FAFAFA] text-[10px] font-mono tracking-widest uppercase rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all">
                {item.label}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-auto pb-4">
          <button className="p-3 text-zinc-600 hover:text-zinc-200 transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </nav>

      {/* 2. CENTER STAGE (Main Content) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-10 border-b border-zinc-900 bg-[#09090B]/80 backdrop-blur-md flex-shrink-0 z-10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tighter uppercase italic">
                Mentori <span className="text-[#00F0FF] glow-text">OS</span>
              </h1>
              <span className="text-[10px] font-mono text-[#00F0FF]/60 border border-[#00F0FF]/30 px-2 py-0.5 rounded uppercase tracking-[0.2em] bg-[#00F0FF]/5">
                V3.0_SOVEREIGN
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-1">
              <Activity size={10} className="text-[#00F0FF]" />
              <span className="uppercase tracking-widest">
                Neural link active
              </span>
              <span className="text-zinc-800">|</span>
              <span className="uppercase tracking-widest">
                Protocol: 100% Secure
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6 mr-6">
              <div className="flex flex-col items-end">
                <span className="mono-label">Cognitive Load</span>
                <div className="w-24 h-1 bg-zinc-900 mt-1 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00F0FF] w-1/3 shadow-[0_0_5px_#00F0FF]"></div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="mono-label">System Health</span>
                <span className="text-[10px] font-mono text-green-500 uppercase tracking-widest mt-1">
                  Nominal
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#00F0FF] hover:bg-[#00F0FF]/5 rounded border border-[#00F0FF]/30 transition-all hover:shadow-[0_0_10px_rgba(0,240,255,0.1)]"
            >
              <Terminal size={14} />
              {isOpen ? "Close Console" : "Access Console"}
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-fixed opacity-[0.03] pointer-events-none absolute inset-0"></div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-10 relative">
          <div className="max-w-6xl mx-auto space-y-10 animate-tactical-entry">
            {children}
          </div>
        </div>
      </main>

      {/* 3. RIGHT SIDEBAR (Tactical Console) */}
      <aside
        className={`bg-[#0C0C0E] text-zinc-400 border-l border-zinc-900 transition-all duration-500 ease-in-out flex flex-col relative ${
          isOpen ? "w-[450px]" : "w-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="h-20 flex items-center justify-between px-8 border-b border-zinc-900 flex-shrink-0 bg-[#0C0C0E]">
          <div className="flex items-center gap-3">
            <Zap size={16} className="text-[#00F0FF]" />
            <span className="font-mono text-xs font-bold text-white tracking-[0.3em] uppercase">
              Sovereign_Mentor_v3
            </span>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-zinc-900 rounded text-zinc-600 hover:text-[#00F0FF] transition-all">
              <Terminal size={14} />
            </button>
          </div>
        </div>

        {/* Console Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-xs bg-[#0C0C0E]">
          {/* System Status Display */}
          <div className="bg-black/40 p-4 rounded border border-zinc-800/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[9px] text-[#00F0FF] uppercase tracking-[0.2em] font-bold">
                <Terminal size={10} />
                <span>System_Diagnostics</span>
              </div>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
            <div className="space-y-1.5 opacity-80">
              <p className="text-green-500/80 flex gap-2">
                <span className="text-zinc-700">INF</span> [CORE] Engine:
                Nebius_OpenAI_v1
              </p>
              <p className="text-zinc-500 flex gap-2">
                <span className="text-zinc-700">LOG</span>{" "}
                {messages.length === 0
                  ? "Awaiting user input sequence..."
                  : `${messages.length} frames logged in session`}
              </p>
            </div>
          </div>

          {/* Message Stream */}
          <div className="space-y-8">
            {messages.map((msg, idx) => (
              <div
                key={msg.timestamp + idx}
                className="flex flex-col gap-3 group"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded ${
                      msg.role === "user"
                        ? "bg-zinc-800 text-zinc-400"
                        : "bg-[#00F0FF]/10 text-[#00F0FF]"
                    }`}
                  >
                    {msg.role === "user" ? "Operator" : "Sovereign_AI"}
                  </span>
                  <span className="text-[8px] text-zinc-700 group-hover:text-zinc-500 transition-colors">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div
                  className={`leading-relaxed relative ${
                    msg.role === "user"
                      ? "bg-zinc-900/50 p-4 rounded border border-zinc-800 text-zinc-200"
                      : "text-zinc-300 pl-4 border-l border-zinc-800 ml-1"
                  }`}
                >
                  {msg.content ||
                    (isStreaming && idx === messages.length - 1 && (
                      <div className="flex items-center gap-3 text-zinc-600 animate-pulse">
                        <Loader2 size={12} className="animate-spin" />
                        <span>SYNCHRONIZING...</span>
                      </div>
                    ))}
                  {isStreaming &&
                    idx === messages.length - 1 &&
                    msg.content && (
                      <span className="inline-block w-1.5 h-3 bg-[#00F0FF] ml-2 animate-pulse shadow-[0_0_5px_#00F0FF]" />
                    )}
                </div>
              </div>
            ))}
          </div>
          <div ref={chatEndRef} />
        </div>

        {/* Tactical Input */}
        <div className="p-6 border-t border-zinc-900 bg-[#0C0C0E] flex-shrink-0">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <ChevronRight
                size={14}
                className="text-zinc-600 group-focus-within:text-[#00F0FF] transition-colors"
              />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter command or query..."
              disabled={isStreaming}
              className="w-full bg-black border border-zinc-800 rounded px-10 py-4 text-xs text-white outline-none focus:border-[#00F0FF]/50 focus:shadow-[0_0_15px_rgba(0,240,255,0.05)] transition-all font-mono placeholder-zinc-700"
            />
            <div className="absolute inset-y-0 right-4 flex items-center">
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isStreaming}
                className="p-1.5 text-zinc-600 hover:text-[#00F0FF] disabled:opacity-20 transition-all"
              >
                {isStreaming ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 text-[9px] font-mono px-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isStreaming
                    ? "bg-[#00F0FF] animate-pulse shadow-[0_0_5px_#00F0FF]"
                    : "bg-green-500"
                }`}
              />
              <span
                className={
                  isStreaming
                    ? "text-[#00F0FF]"
                    : "text-zinc-600 uppercase tracking-widest"
                }
              >
                {isStreaming ? "LINK_ACTIVE" : "STANDBY"}
              </span>
            </div>
            <span className="text-zinc-700 uppercase tracking-widest">
              {shouldUsePro(input)
                ? "Logic_Core: Qwen_480B"
                : "Chat_Core: Llama_3.3"}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
};

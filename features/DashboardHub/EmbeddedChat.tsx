import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Trash2, Terminal, Zap, Shield } from "lucide-react";
import { useMentor } from "../../contexts/MentorContext";

export const EmbeddedChat: React.FC = () => {
  const { messages, isStreaming, sendMessage, clearMessages } = useMentor();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const message = input.trim();
    setInput("");
    await sendMessage(message);
  };

  const quickPrompts = [
    { label: "DIAGNOSTIC", prompt: "/analisar " },
    { label: "AUTOPSY", prompt: "/autopsia " },
    { label: "STRATEGY", prompt: "Me dê uma estratégia para " },
  ];

  return (
    <div className="bg-[#0C0C0E] rounded-lg border border-zinc-900 flex flex-col h-[550px] shadow-2xl relative overflow-hidden group">
      {/* Tactical Grid Background Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-black/40 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded border border-[#00F0FF]/30 bg-[#00F0FF]/5 flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.1)]">
            <Zap size={18} className="text-[#00F0FF]" />
          </div>
          <div>
            <div className="font-bold text-[10px] text-white uppercase tracking-[0.3em]">
              Neural_Mentor_v3
            </div>
            <div className="text-[8px] text-[#00F0FF] flex items-center gap-1.5 font-mono uppercase tracking-widest mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse shadow-[0_0_5px_#00F0FF]" />
              Link Secured
            </div>
          </div>
        </div>
        <button
          onClick={clearMessages}
          className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/5 rounded transition-all"
          title="PURGE COMLINK"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 rounded-full border border-dashed border-[#00F0FF]/20 flex items-center justify-center mb-6 animate-spin-slow">
              <Shield size={32} className="text-[#00F0FF]/40" />
            </div>
            <h4 className="font-black text-white text-lg mb-2 uppercase italic tracking-tighter">
              Initializing <span className="text-[#00F0FF]">COMLINK</span>
            </h4>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] max-w-[200px] leading-loose">
              Access tactical advice, deep explanations, or mission
              intelligence.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-8">
              {quickPrompts.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => setInput(qp.prompt)}
                  className="px-3 py-1.5 bg-zinc-900/50 hover:bg-[#00F0FF]/10 border border-zinc-800 hover:border-[#00F0FF]/30 rounded text-[9px] font-mono font-bold text-zinc-400 hover:text-[#00F0FF] transition-all uppercase tracking-widest"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col gap-2 ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[8px] font-mono font-black uppercase tracking-[0.2em] ${
                      msg.role === "user" ? "text-zinc-600" : "text-[#00F0FF]"
                    }`}
                  >
                    {msg.role === "user" ? "Operator" : "AI_System"}
                  </span>
                </div>
                <div
                  className={`max-w-[90%] px-4 py-3 text-xs leading-relaxed shadow-lg ${
                    msg.role === "user"
                      ? "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-l-lg rounded-tr-lg"
                      : "bg-black/50 border-l-2 border-[#00F0FF] text-zinc-300 rounded-r-lg rounded-tl-lg font-mono"
                  }`}
                >
                  <p className="whitespace-pre-wrap">
                    {msg.content || "SYNCHRONIZING..."}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-6 border-t border-zinc-900 bg-black/40 backdrop-blur-md relative z-10">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative flex-1 group">
            <Terminal
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#00F0FF] transition-colors"
            />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter directive..."
              disabled={isStreaming}
              className="w-full pl-10 pr-4 py-3 bg-black border border-zinc-800 rounded text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-[#00F0FF]/50 transition-all font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="px-5 bg-[#00F0FF] text-black rounded hover:opacity-90 transition-all disabled:opacity-20 disabled:grayscale font-bold shadow-[0_0_15px_rgba(0,240,255,0.2)]"
          >
            {isStreaming ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { useMentor } from '../../contexts/MentorContext';

export const EmbeddedChat: React.FC = () => {
  const { messages, isStreaming, sendMessage, clearMessages } = useMentor();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const quickPrompts = [
    { label: 'Duvida', prompt: 'Tenho uma duvida sobre ' },
    { label: 'Explicar', prompt: '/explicar ' },
    { label: 'Dica', prompt: 'Me de uma dica de estudo para ' }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900">Mentor IA</div>
            <div className="text-[10px] text-green-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Online
            </div>
          </div>
        </div>
        <button
          onClick={clearMessages}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Limpar conversa"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-white" />
            </div>
            <h4 className="font-bold text-slate-900 mb-1">Ola! Sou seu Mentor IA</h4>
            <p className="text-sm text-slate-500 mb-4">
              Tire duvidas, peca explicacoes ou solicite dicas de estudo.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {quickPrompts.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => setInput(qp.prompt)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-medium text-slate-700 transition-colors"
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
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'mentor' && (
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Bot size={14} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-900 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content || '...'}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                    <User size={14} className="text-slate-600" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua duvida..."
            disabled={isStreaming}
            className="flex-1 px-4 py-2.5 bg-slate-100 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

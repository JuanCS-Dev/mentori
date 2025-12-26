/**
 * Mentor Context - Permite enviar mensagens ao console do Mentor de qualquer componente
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { MentorMessage, ChatContext, AppView } from '../types';
import { GeminiService } from '../services/geminiService';

interface MentorContextType {
  messages: MentorMessage[];
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  sendMessage: (message: string) => Promise<void>;
  askAboutQuestion: (question: string, options: string[], correctAnswer: number, userAnswer?: number) => Promise<void>;
  clearMessages: () => void;
}

const MentorContext = createContext<MentorContextType | null>(null);

export const useMentor = () => {
  const context = useContext(MentorContext);
  if (!context) {
    throw new Error('useMentor must be used within MentorProvider');
  }
  return context;
};

interface MentorProviderProps {
  children: React.ReactNode;
  currentView: AppView;
}

export const MentorProvider: React.FC<MentorProviderProps> = ({ children, currentView }) => {
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Format history for Gemini
  const formatHistory = (msgs: MentorMessage[]): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> => {
    return msgs.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
  };

  // Detect if should use Pro model
  const shouldUsePro = (text: string): boolean => {
    const proCommands = ['/analisar', '/explicar', '/autopsia', '/plano', '/material'];
    return proCommands.some(cmd => text.toLowerCase().startsWith(cmd)) || text.length > 200;
  };

  // Send message to Mentor
  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || isStreaming) return;

    const userMsg: MentorMessage = { role: 'user', content: input.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    // Open console if closed
    setIsOpen(true);

    // Add empty mentor message for streaming
    const mentorMsg: MentorMessage = { role: 'mentor', content: '', timestamp: Date.now() };
    setMessages(prev => [...prev, mentorMsg]);

    try {
      const history = formatHistory(messages);
      const context: ChatContext = { currentView, sessionActive: true };
      const usePro = shouldUsePro(input);

      for await (const chunk of GeminiService.mentorChat(input, history, context, usePro)) {
        setMessages(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg) {
            updated[updated.length - 1] = {
              ...lastMsg,
              content: lastMsg.content + chunk
            };
          }
          return updated;
        });
      }
    } catch (error) {
      console.error('Mentor chat error:', error);
      setMessages(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg) {
          updated[updated.length - 1] = {
            ...lastMsg,
            content: 'Erro na conexão com o mentor. Tente novamente.'
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [messages, isStreaming, currentView]);

  // Ask Mentor about a specific question
  const askAboutQuestion = useCallback(async (
    question: string,
    options: string[],
    correctAnswer: number,
    userAnswer?: number
  ) => {
    const optionsText = options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n');
    const correctOption = options[correctAnswer] || 'N/A';

    let prompt = `/explicar\n\n**QUESTÃO:**\n${question}\n\n**ALTERNATIVAS:**\n${optionsText}\n\n**GABARITO:** ${String.fromCharCode(65 + correctAnswer)}) ${correctOption}`;

    if (userAnswer !== undefined && userAnswer !== correctAnswer) {
      const userOption = options[userAnswer] || 'N/A';
      prompt += `\n\n**RESPOSTA DO ALUNO:** ${String.fromCharCode(65 + userAnswer)}) ${userOption}\n\nExplique por que a resposta do aluno está errada e por que o gabarito está correto. Use exemplos práticos.`;
    } else {
      prompt += `\n\nExplique esta questão de forma didática, usando exemplos práticos e indicando possíveis pegadinhas da banca.`;
    }

    await sendMessage(prompt);
  }, [sendMessage]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <MentorContext.Provider value={{
      messages,
      isStreaming,
      isOpen,
      setIsOpen,
      sendMessage,
      askAboutQuestion,
      clearMessages
    }}>
      {children}
    </MentorContext.Provider>
  );
};

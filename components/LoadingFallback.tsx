import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export const LoadingFallback: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full min-h-[400px] animate-in fade-in duration-300">
      <div className="relative">
        {/* Background Blur Effect */}
        <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
        
        <div className="relative bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="h-10 w-10 text-indigo-400 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
            </div>
          </div>
          
          <div className="text-center space-y-1">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">
              Carregando Módulo
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Otimizando experiência...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

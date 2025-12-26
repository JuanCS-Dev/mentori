import React from 'react';
import { Loader2, Brain } from 'lucide-react';

export const LoadingFallback: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full min-h-[400px] animate-in fade-in duration-300">
      <div className="bg-white border border-kitchen-border p-8 rounded-xl shadow-sm flex flex-col items-center gap-4 max-w-sm w-full">
        <div className="relative">
          <Loader2 className="h-10 w-10 text-kitchen-text-secondary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="h-4 w-4 text-kitchen-accent-blueText" />
          </div>
        </div>
        
        <div className="text-center space-y-1">
          <h3 className="text-sm font-bold font-mono text-kitchen-text-primary uppercase tracking-wider">
            Initializing Workspace...
          </h3>
          <p className="text-xs font-mono text-kitchen-text-secondary">
            Loading cognitive modules and data...
          </p>
        </div>
      </div>
    </div>
  );
};

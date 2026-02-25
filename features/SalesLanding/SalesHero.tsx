import React from "react";
import { ArrowRight, Play, Zap } from "lucide-react";

interface SalesHeroProps {
  onCTA: () => void;
  onWatchDemo?: () => void;
}

export const SalesHero: React.FC<SalesHeroProps> = ({ onCTA, onWatchDemo }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#09090B]">
      {/* Background Tactical Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Radial Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00F0FF]/5 rounded-full blur-[150px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#00F0FF]/10 rounded-full blur-[180px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-8 py-32 text-center">
        {/* Security Badge */}
        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-black border border-[#00F0FF]/30 mb-10 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
          <Zap size={14} className="text-[#00F0FF] animate-pulse" />
          <span className="text-[10px] font-mono font-black text-white uppercase tracking-[0.3em]">
            Deployment Active: Nebius_Elite_AI_Cores
          </span>
        </div>

        {/* Tactical Headline */}
        <h1 className="text-6xl md:text-8xl font-black text-white mb-8 leading-[0.9] tracking-tighter uppercase italic">
          Forge Your <br />
          <span className="text-[#00F0FF] glow-text">Competitive</span> <br />
          Edge
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto mb-14 leading-relaxed font-mono uppercase tracking-widest">
          The only <span className="text-white">Neural OS</span> engineered to
          decimate public exam barriers via{" "}
          <span className="text-white">Sovereign Intelligence</span>.
        </p>

        {/* Action Interface */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20">
          <button
            onClick={onCTA}
            className="group relative px-10 py-5 bg-[#00F0FF] text-black font-black text-xs uppercase tracking-[0.3em] rounded border border-[#00F0FF] shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:shadow-[0_0_50px_rgba(0,240,255,0.5)] transition-all hover:scale-105 active:scale-95"
          >
            <span className="flex items-center gap-3">
              Initiate Infiltration
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </span>
          </button>

          {onWatchDemo && (
            <button
              onClick={onWatchDemo}
              className="flex items-center gap-3 px-8 py-5 text-zinc-400 hover:text-[#00F0FF] font-mono text-[10px] uppercase tracking-widest transition-all group"
            >
              <div className="w-12 h-12 rounded border border-zinc-800 flex items-center justify-center group-hover:border-[#00F0FF]/30 transition-all bg-black">
                <Play size={16} className="fill-current" />
              </div>
              View System Demo
            </button>
          )}
        </div>

        {/* Mission Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto pt-16 border-t border-zinc-900/50">
          <div className="flex flex-col items-center gap-2">
            <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em] mb-2">
              Drill Count
            </div>
            <div className="text-3xl font-black text-white italic tracking-tighter">
              700+ <span className="text-[#00F0FF] text-sm">Real</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 border-l border-zinc-900">
            <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em] mb-2">
              Success Rate
            </div>
            <div className="text-3xl font-black text-white italic tracking-tighter">
              95.4%
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 border-l border-zinc-900">
            <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em] mb-2">
              Neural Link
            </div>
            <div className="text-3xl font-black text-white italic tracking-tighter">
              24/7
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 border-l border-zinc-900">
            <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em] mb-2">
              Latency
            </div>
            <div className="text-3xl font-black text-white italic tracking-tighter">
              ~42ms
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Corner Accents */}
      <div className="absolute top-10 left-10 w-20 h-20 border-t border-l border-zinc-800 opacity-50"></div>
      <div className="absolute bottom-10 right-10 w-20 h-20 border-b border-r border-zinc-800 opacity-50"></div>
    </section>
  );
};

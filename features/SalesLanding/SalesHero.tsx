import React from 'react';
import { Sparkles, ArrowRight, Play, CheckCircle } from 'lucide-react';

interface SalesHeroProps {
  onCTA: () => void;
  onWatchDemo?: () => void;
}

export const SalesHero: React.FC<SalesHeroProps> = ({ onCTA, onWatchDemo }) => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px]" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-8">
          <Sparkles size={14} className="text-yellow-400" />
          <span className="text-sm font-medium text-white/80">
            Powered by Gemini AI
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
          Estude{' '}
          <span className="relative">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              3x Mais Rapido
            </span>
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
              <path d="M2 10C50 2 150 2 298 10" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round"/>
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="300" y2="0">
                  <stop offset="0%" stopColor="#60A5FA"/>
                  <stop offset="50%" stopColor="#A78BFA"/>
                  <stop offset="100%" stopColor="#F472B6"/>
                </linearGradient>
              </defs>
            </svg>
          </span>
          <br />
          com IA
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed">
          O unico app de concursos que usa{' '}
          <span className="text-white font-semibold">Inteligencia Artificial</span>{' '}
          para criar seu plano de estudos personalizado e garantir sua aprovacao.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button
            onClick={onCTA}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg rounded-xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105"
          >
            <span className="flex items-center gap-2">
              Comecar Agora - 7 Dias Gratis
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

          {onWatchDemo && (
            <button
              onClick={onWatchDemo}
              className="flex items-center gap-2 px-6 py-4 text-white/80 hover:text-white font-medium transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Play size={16} fill="currentColor" />
              </div>
              Ver Demo
            </button>
          )}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-white/50 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />
            <span>Sem cartao de credito</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />
            <span>Cancele quando quiser</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />
            <span>+700 questoes reais</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-black text-white mb-1">700+</div>
            <div className="text-sm text-white/50">Questoes Reais</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black text-white mb-1">95%</div>
            <div className="text-sm text-white/50">Taxa Retencao</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black text-white mb-1">24/7</div>
            <div className="text-sm text-white/50">Mentor IA</div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-white/50 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

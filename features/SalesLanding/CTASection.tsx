import React from 'react';
import { ArrowRight, Sparkles, Shield, Clock } from 'lucide-react';

interface CTASectionProps {
  onCTA: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onCTA }) => {
  return (
    <section className="py-24 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-8">
          <Sparkles size={40} className="text-white" />
        </div>

        {/* Headline */}
        <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
          Sua Aprovacao Comeca{' '}
          <span className="underline decoration-yellow-400 decoration-4 underline-offset-8">
            Agora
          </span>
        </h2>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto mb-10">
          Junte-se a centenas de concurseiros que ja estao estudando de forma mais inteligente.
        </p>

        {/* CTA Button */}
        <button
          onClick={onCTA}
          className="group relative inline-flex items-center gap-3 px-10 py-5 bg-white text-purple-700 font-bold text-xl rounded-2xl shadow-2xl hover:shadow-white/20 hover:scale-105 transition-all duration-300"
        >
          Comecar Meus 7 Dias Gratis
          <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />

          {/* Shine Effect */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
        </button>

        {/* Trust Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-white/70">
          <div className="flex items-center gap-2">
            <Shield size={18} />
            <span>Garantia 7 dias</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={18} />
            <span>Acesso imediato</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} />
            <span>Sem cartao</span>
          </div>
        </div>

        {/* Urgency */}
        <div className="mt-12 inline-block px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
          <p className="text-white/90 font-medium">
            <span className="text-yellow-400 font-bold">+23 pessoas</span> se inscreveram nas ultimas 24 horas
          </p>
        </div>
      </div>
    </section>
  );
};

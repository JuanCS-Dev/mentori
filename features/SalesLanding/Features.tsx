import React from 'react';
import {
  Brain,
  Target,
  BarChart3,
  Zap,
  BookOpen,
  Trophy,
  Calendar,
  Shield
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'IA Personalizada',
    description: 'Planos de estudo unicos baseados no seu perfil cognitivo e disponibilidade.'
  },
  {
    icon: Target,
    title: 'Foco Inteligente',
    description: 'Sistema identifica suas fraquezas e prioriza o que mais cai na sua prova.'
  },
  {
    icon: BarChart3,
    title: 'Analytics Avancado',
    description: 'Acompanhe seu progresso com metricas de desempenho em tempo real.'
  },
  {
    icon: Zap,
    title: 'Spaced Repetition',
    description: 'Algoritmo cientifico que otimiza o momento ideal de cada revisao.'
  },
  {
    icon: BookOpen,
    title: 'Banco de Questoes',
    description: '+700 questoes reais CEBRASPE, FGV, CESPE com explicacoes detalhadas.'
  },
  {
    icon: Trophy,
    title: 'Gamificacao',
    description: 'XP, niveis e conquistas para manter sua motivacao em alta.'
  },
  {
    icon: Calendar,
    title: 'Cronograma Adaptativo',
    description: 'Rotina de estudos que se adapta ao seu dia e energia disponivel.'
  },
  {
    icon: Shield,
    title: 'Anti-Burnout',
    description: 'Sistema detecta sinais de esgotamento e sugere pausas estrategicas.'
  }
];

export const Features: React.FC = () => {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold mb-4">
            FUNCIONALIDADES
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
            Tudo Que Voce Precisa
            <br />
            <span className="text-blue-600">Em Um So Lugar</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Ferramentas poderosas que trabalham juntas para acelerar sua aprovacao.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon size={24} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Feature Highlight */}
        <div className="mt-16 p-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-2">
                Integracao Completa
              </h3>
              <p className="text-white/80 max-w-xl">
                Todas as funcionalidades trabalham em sincronia. Seu progresso nas questoes alimenta o sistema de revisao, que atualiza seu plano de estudos, que ajusta as recomendacoes do mentor.
              </p>
            </div>
            <div className="shrink-0 text-center">
              <div className="text-5xl font-black">100%</div>
              <div className="text-sm text-white/80">Automatizado</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

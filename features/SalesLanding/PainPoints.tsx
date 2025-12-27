import React from 'react';
import { Clock, Brain, FileQuestion, TrendingDown } from 'lucide-react';

const painPoints = [
  {
    icon: Clock,
    title: 'Horas Perdidas',
    description: 'Voce estuda 4-6 horas por dia, mas sente que nao avanca. O material e infinito e o tempo e curto.',
    stat: '73%',
    statLabel: 'dos concurseiros sentem isso'
  },
  {
    icon: Brain,
    title: 'Esquecimento Constante',
    description: 'Revisou semana passada, mas hoje ja nao lembra. A curva do esquecimento e implacavel.',
    stat: '80%',
    statLabel: 'do conteudo e esquecido em 7 dias'
  },
  {
    icon: FileQuestion,
    title: 'Edital Confuso',
    description: 'Edital com 50+ paginas, dezenas de materias. Por onde comecar? Qual a prioridade?',
    stat: '60%',
    statLabel: 'desistem por falta de direcao'
  },
  {
    icon: TrendingDown,
    title: 'Sem Evolucao Visivel',
    description: 'Voce estuda muito mas nao ve progresso. Sem metricas, sem feedback, sem motivacao.',
    stat: '45%',
    statLabel: 'abandonam em 3 meses'
  }
];

export const PainPoints: React.FC = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold mb-4">
            O PROBLEMA
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
            Por Que 90% dos Concurseiros
            <br />
            <span className="text-red-500">Nao Conseguem Aprovacao?</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Nao e falta de esforco. E falta de metodo cientifico e tecnologia adequada.
          </p>
        </div>

        {/* Pain Points Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {painPoints.map((pain, index) => {
            const Icon = pain.icon;
            return (
              <div
                key={index}
                className="group relative p-8 bg-slate-50 rounded-2xl border border-slate-200 hover:border-red-200 hover:bg-red-50/30 transition-all duration-300"
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon size={28} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {pain.title}
                </h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {pain.description}
                </p>

                {/* Stat */}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-red-500">{pain.stat}</span>
                  <span className="text-sm text-slate-500">{pain.statLabel}</span>
                </div>

                {/* Decorative */}
                <div className="absolute top-4 right-4 text-6xl font-black text-slate-100 group-hover:text-red-100 transition-colors">
                  {index + 1}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-2xl font-bold text-slate-900 mb-2">
            Voce se identificou com algum desses problemas?
          </p>
          <p className="text-lg text-slate-600">
            A boa noticia: existe uma solucao baseada em ciencia e IA.
          </p>
        </div>
      </div>
    </section>
  );
};

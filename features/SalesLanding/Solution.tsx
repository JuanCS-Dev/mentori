import React from 'react';
import { Sparkles, FileText, RotateCcw, MessageCircle, ArrowRight } from 'lucide-react';

const solutions = [
  {
    icon: FileText,
    title: 'Analise Automatica do Edital',
    description: 'Cole o PDF do edital e nossa IA extrai todas as materias, pesos e topicos automaticamente. Em segundos.',
    color: 'blue'
  },
  {
    icon: RotateCcw,
    title: 'Spaced Repetition Cientifico',
    description: 'Sistema baseado em neurociencia que calcula o momento exato para revisar cada conteudo. Nunca mais esqueca.',
    color: 'purple'
  },
  {
    icon: Sparkles,
    title: '700+ Questoes Reais CEBRASPE/FGV',
    description: 'Banco de questoes reais de provas anteriores, com explicacoes detalhadas geradas por IA.',
    color: 'pink'
  },
  {
    icon: MessageCircle,
    title: 'Mentor IA 24/7',
    description: 'Tire duvidas a qualquer hora. Nosso mentor entende seu edital e responde com base no seu contexto.',
    color: 'green'
  }
];

const colorClasses = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    border: 'border-blue-200',
    gradient: 'from-blue-500 to-blue-600'
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    border: 'border-purple-200',
    gradient: 'from-purple-500 to-purple-600'
  },
  pink: {
    bg: 'bg-pink-100',
    text: 'text-pink-600',
    border: 'border-pink-200',
    gradient: 'from-pink-500 to-pink-600'
  },
  green: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    gradient: 'from-emerald-500 to-emerald-600'
  }
};

export const Solution: React.FC = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-bold mb-4">
            A SOLUCAO
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Como o <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Mentori</span> Resolve
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Combinamos Inteligencia Artificial de ponta com metodos cientificos de aprendizagem.
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {solutions.map((solution, index) => {
            const Icon = solution.icon;
            const colors = colorClasses[solution.color as keyof typeof colorClasses];

            return (
              <div
                key={index}
                className="group relative p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex gap-6">
                  {/* Icon */}
                  <div className={`shrink-0 w-14 h-14 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon size={28} />
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {solution.title}
                    </h3>
                    <p className="text-white/60 leading-relaxed">
                      {solution.description}
                    </p>
                  </div>
                </div>

                {/* Hover Arrow */}
                <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight size={20} className="text-white/40" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Transformation Arrow */}
        <div className="mt-16 flex items-center justify-center gap-4">
          <div className="h-px flex-1 max-w-[200px] bg-gradient-to-r from-transparent to-white/20" />
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            <ArrowRight size={24} className="text-white" />
          </div>
          <div className="h-px flex-1 max-w-[200px] bg-gradient-to-l from-transparent to-white/20" />
        </div>

        {/* Result Statement */}
        <div className="mt-8 text-center">
          <p className="text-2xl font-bold text-white">
            Resultado:{' '}
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Voce estuda menos, aprende mais, e esquece nunca.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

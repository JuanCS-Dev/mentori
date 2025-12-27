import React from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Joao Silva',
    role: 'Aprovado PRF 2024',
    avatar: 'JS',
    content: 'Depois de 3 anos tentando, finalmente passei usando o Mentori. O sistema de revisao espacada foi game changer. Nunca mais esqueci os artigos da 8.112.',
    stars: 5,
    highlight: '3 anos tentando -> Aprovado em 8 meses'
  },
  {
    name: 'Maria Santos',
    role: 'Aprovada TRT-SP',
    avatar: 'MS',
    content: 'O mentor IA me ajudou demais nas duvidas de madrugada. Eu trabalhava de dia e estudava a noite. Ter suporte 24h foi essencial.',
    stars: 5,
    highlight: 'Estudando so a noite -> Top 50 colocados'
  },
  {
    name: 'Carlos Oliveira',
    role: 'Aprovado INSS',
    avatar: 'CO',
    content: 'As questoes comentadas com IA sao incriveis. Cada explicacao e personalizada pro meu nivel. Minha taxa de acerto foi de 45% pra 78%.',
    stars: 5,
    highlight: '45% -> 78% taxa de acerto'
  },
  {
    name: 'Ana Rodrigues',
    role: 'Aprovada Receita Federal',
    avatar: 'AR',
    content: 'O cronograma adaptativo entendeu meu ritmo. Nos dias que eu tava cansada, ele ajustava automaticamente. Zero burnout ate a prova.',
    stars: 5,
    highlight: 'Zero burnout em 10 meses de estudo'
  }
];

export const Testimonials: React.FC = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold mb-4">
            DEPOIMENTOS
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
            Quem Usou,{' '}
            <span className="text-yellow-500">Aprovou</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Historias reais de concurseiros que transformaram seus resultados.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="relative p-8 bg-slate-50 rounded-2xl border border-slate-200 hover:border-yellow-200 hover:shadow-lg transition-all duration-300"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 text-slate-200">
                <Quote size={40} />
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.stars }).map((_, i) => (
                  <Star key={i} size={16} fill="#FBBF24" className="text-yellow-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-slate-700 leading-relaxed mb-6 relative z-10">
                "{testimonial.content}"
              </p>

              {/* Highlight Badge */}
              <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
                {testimonial.highlight}
              </div>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{testimonial.name}</div>
                  <div className="text-sm text-slate-500">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Metrics */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 p-8 bg-slate-900 rounded-2xl text-white">
          <div className="text-center">
            <div className="text-4xl font-black text-yellow-400 mb-1">4.9</div>
            <div className="text-sm text-white/60">Avaliacao Media</div>
            <div className="flex justify-center gap-1 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={12} fill="#FBBF24" className="text-yellow-400" />
              ))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black text-green-400 mb-1">847</div>
            <div className="text-sm text-white/60">Usuarios Ativos</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black text-blue-400 mb-1">92%</div>
            <div className="text-sm text-white/60">Taxa Retencao</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black text-purple-400 mb-1">156</div>
            <div className="text-sm text-white/60">Aprovacoes 2024</div>
          </div>
        </div>
      </div>
    </section>
  );
};

import React from 'react';
import { Check, Zap, Crown, Sparkles } from 'lucide-react';

interface PricingProps {
  onSelectPlan: (plan: 'monthly' | 'yearly') => void;
}

export const Pricing: React.FC<PricingProps> = ({ onSelectPlan }) => {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-5xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold mb-4">
            INVESTIMENTO
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
            Quanto Custa Sua{' '}
            <span className="text-purple-600">Aprovacao?</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Menos que um cafe por dia para ter a melhor tecnologia de estudos do Brasil.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <div className="relative p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-purple-200 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Mensal</h3>
                <p className="text-sm text-slate-500">Cancele quando quiser</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <Zap size={24} className="text-slate-600" />
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-slate-500">R$</span>
                <span className="text-5xl font-black text-slate-900">47</span>
                <span className="text-slate-500">/mes</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Menos de R$1,57/dia
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                'Acesso completo a plataforma',
                '+700 questoes reais comentadas',
                'Mentor IA 24/7',
                'Spaced Repetition ilimitado',
                'Analytics de performance',
                'Suporte por email'
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700">
                  <Check size={18} className="text-green-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => onSelectPlan('monthly')}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Comecar 7 Dias Gratis
            </button>
          </div>

          {/* Yearly Plan - Featured */}
          <div className="relative p-8 bg-gradient-to-b from-purple-600 to-purple-700 rounded-2xl text-white shadow-2xl shadow-purple-500/30">
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="px-4 py-1 bg-yellow-400 text-yellow-900 text-sm font-bold rounded-full flex items-center gap-1">
                <Crown size={14} />
                MAIS POPULAR
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold">Anual</h3>
                <p className="text-sm text-white/70">Economia de 40%</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles size={24} />
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-white/70">R$</span>
                <span className="text-5xl font-black">29</span>
                <span className="text-white/70">/mes</span>
              </div>
              <p className="text-sm text-white/70 mt-1">
                Cobrado R$348/ano (R$0,96/dia)
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                'Tudo do plano mensal',
                'Economia de R$216/ano',
                'Prioridade no suporte',
                'Acesso antecipado a novidades',
                'Garantia estendida 30 dias',
                'Materiais exclusivos'
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-white/90">
                  <Check size={18} className="text-yellow-400 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => onSelectPlan('yearly')}
              className="w-full py-4 bg-white text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition-colors"
            >
              Garantir Desconto Anual
            </button>
          </div>
        </div>

        {/* Guarantee */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-50 border border-green-200 rounded-full">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Check size={20} className="text-green-600" />
            </div>
            <div className="text-left">
              <div className="font-bold text-green-900">Garantia Incondicional</div>
              <div className="text-sm text-green-700">7 dias para testar. Nao gostou? Devolvemos 100%.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

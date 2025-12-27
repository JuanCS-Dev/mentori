import React, { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';

const faqs = [
  {
    question: 'O Mentori funciona para qualquer concurso?',
    answer: 'Sim! O Mentori analisa qualquer edital e cria um plano personalizado. Temos foco especial em concursos federais (INSS, Receita, PRF, PF) e tribunais, mas funciona para qualquer area.'
  },
  {
    question: 'Como funciona o periodo de teste?',
    answer: 'Voce tem 7 dias para testar todas as funcionalidades sem pagar nada. Nao pedimos cartao de credito no inicio. Se nao gostar, basta nao continuar - sem burocracia.'
  },
  {
    question: 'A IA substitui um professor?',
    answer: 'O Mentori complementa seus estudos. Nossa IA explica questoes, tira duvidas e organiza seu cronograma. Para aprender a materia, recomendamos cursos e materiais em conjunto.'
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer: 'Sim! No plano mensal, voce cancela quando quiser sem multa. No anual, temos garantia de 30 dias. Nao queremos prender ninguem - queremos que voce fique por resultados.'
  },
  {
    question: 'De onde vem as questoes?',
    answer: 'Todas as +700 questoes sao de provas reais aplicadas por bancas como CEBRASPE, FGV, FCC e VUNESP. Cada questao tem explicacao detalhada gerada por nossa IA.'
  },
  {
    question: 'Funciona no celular?',
    answer: 'Sim! O Mentori e totalmente responsivo e funciona em qualquer dispositivo - computador, tablet ou celular. Estude onde e quando quiser.'
  },
  {
    question: 'O que e Spaced Repetition?',
    answer: 'E uma tecnica cientifica baseada na curva do esquecimento. O sistema calcula o momento ideal para voce revisar cada conteudo, maximizando a retencao de longo prazo.'
  },
  {
    question: 'Quanto tempo leva para ver resultados?',
    answer: 'A maioria dos usuarios reporta melhora na organizacao em 1 semana e aumento na taxa de acertos em 30 dias. Resultados concretos dependem do seu comprometimento.'
  }
];

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-slate-900">
      <div className="max-w-4xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-bold mb-4">
            FAQ
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Perguntas{' '}
            <span className="text-blue-400">Frequentes</span>
          </h2>
          <p className="text-xl text-white/60">
            Tudo que voce precisa saber antes de comecar.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`rounded-xl border transition-colors ${
                openIndex === index
                  ? 'bg-white/10 border-white/20'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-bold text-white pr-8">{faq.question}</span>
                <ChevronDown
                  size={20}
                  className={`text-white/60 shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className="text-white/70 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <div className="mt-12 text-center">
          <p className="text-white/60 mb-4">Ainda tem duvidas?</p>
          <a
            href="mailto:suporte@mentori.app"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white font-medium transition-colors"
          >
            <MessageCircle size={18} />
            Fale com nosso suporte
          </a>
        </div>
      </div>
    </section>
  );
};

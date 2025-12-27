import React from 'react';
import { SalesHero } from './SalesHero';
import { PainPoints } from './PainPoints';
import { Solution } from './Solution';
import { Features } from './Features';
import { Testimonials } from './Testimonials';
import { Pricing } from './Pricing';
import { FAQ } from './FAQ';
import { CTASection } from './CTASection';

interface SalesLandingProps {
  onEnterApp: () => void;
}

export const SalesLanding: React.FC<SalesLandingProps> = ({ onEnterApp }) => {
  const handleCTA = () => {
    onEnterApp();
  };

  const handleSelectPlan = (plan: 'monthly' | 'yearly') => {
    console.log('Selected plan:', plan);
    // Checkout integration happens via external Kiwify/Hotmart links
    // User is redirected to platform checkout, then back to app
    onEnterApp();
  };

  const handleWatchDemo = () => {
    // Scroll to features section as demo preview
    const featuresSection = document.getElementById('features');
    featuresSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <span className="font-bold text-white tracking-tight">Mentori</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-white/70 hover:text-white transition-colors">
              Funcionalidades
            </a>
            <a href="#pricing" className="text-sm text-white/70 hover:text-white transition-colors">
              Precos
            </a>
            <a href="#faq" className="text-sm text-white/70 hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          <button
            onClick={handleCTA}
            className="px-4 py-2 bg-white text-slate-900 font-bold text-sm rounded-lg hover:bg-slate-100 transition-colors"
          >
            Comecar Gratis
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <SalesHero onCTA={handleCTA} onWatchDemo={handleWatchDemo} />

        <PainPoints />

        <Solution />

        <div id="features">
          <Features />
        </div>

        <Testimonials />

        <div id="pricing">
          <Pricing onSelectPlan={handleSelectPlan} />
        </div>

        <div id="faq">
          <FAQ />
        </div>

        <CTASection onCTA={handleCTA} />
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  M
                </div>
                <span className="font-bold text-white tracking-tight">Mentori</span>
              </div>
              <p className="text-sm text-white/50">
                Plataforma de estudos com IA para concursos publicos.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-bold text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#features" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Precos</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Reembolso</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="mailto:suporte@mentori.app" className="hover:text-white transition-colors">suporte@mentori.app</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">
              2025 Mentori. Todos os direitos reservados.
            </p>
            <p className="text-sm text-white/40">
              Feito com IA para concurseiros de verdade.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SalesLanding;

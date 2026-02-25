import React from "react";
import { SalesHero } from "./SalesHero";
import { PainPoints } from "./PainPoints";
import { Solution } from "./Solution";
import { Features } from "./Features";
import { Testimonials } from "./Testimonials";
import { Pricing } from "./Pricing";
import { FAQ } from "./FAQ";
import { CTASection } from "./CTASection";
import { Shield, Activity, Terminal } from "lucide-react";

interface SalesLandingProps {
  onEnterApp: () => void;
}

export const SalesLanding: React.FC<SalesLandingProps> = ({ onEnterApp }) => {
  const handleCTA = () => {
    onEnterApp();
  };

  const handleSelectPlan = (plan: "monthly" | "yearly") => {
    console.warn("Selected plan:", plan);
    onEnterApp();
  };

  const handleWatchDemo = () => {
    const featuresSection = document.getElementById("features");
    featuresSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-white font-sans selection:bg-[#00F0FF] selection:text-black">
      {/* Tactical Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#09090B]/80 backdrop-blur-xl border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-10 h-10 rounded border border-[#00F0FF]/30 bg-[#00F0FF]/5 flex items-center justify-center text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.1)] group-hover:scale-110 transition-transform">
              <Shield size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter uppercase italic leading-none">
                Mentori <span className="text-[#00F0FF]">OS</span>
              </span>
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-[0.4em] mt-1">
                Sovereign_System
              </span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-10 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            <a
              href="#features"
              className="hover:text-[#00F0FF] transition-all flex items-center gap-2"
            >
              <span className="text-zinc-800">01.</span> Features
            </a>
            <a
              href="#pricing"
              className="hover:text-[#00F0FF] transition-all flex items-center gap-2"
            >
              <span className="text-zinc-800">02.</span> Pricing
            </a>
            <a
              href="#faq"
              className="hover:text-[#00F0FF] transition-all flex items-center gap-2"
            >
              <span className="text-zinc-800">03.</span> FAQ
            </a>
          </nav>

          <div className="flex items-center gap-6">
            <button
              onClick={handleCTA}
              className="hidden md:flex items-center gap-2 text-[10px] font-mono font-bold text-zinc-400 hover:text-white transition-colors"
            >
              <Terminal size={14} />
              Operator Login
            </button>
            <button
              onClick={handleCTA}
              className="px-6 py-2.5 bg-[#00F0FF] text-black font-black text-[10px] uppercase tracking-[0.2em] rounded border border-[#00F0FF] hover:bg-transparent hover:text-[#00F0FF] transition-all shadow-[0_0_20px_rgba(0,240,255,0.2)] active:scale-95"
            >
              Start Infiltration
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative pt-20">
        {/* Global Tactical Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(0,240,255,0.05)_0%,transparent_70%)] pointer-events-none"></div>

        <SalesHero onCTA={handleCTA} onWatchDemo={handleWatchDemo} />

        <PainPoints />

        <Solution />

        <div id="features" className="scroll-mt-20">
          <Features />
        </div>

        <Testimonials />

        <div id="pricing" className="scroll-mt-20">
          <Pricing onSelectPlan={handleSelectPlan} />
        </div>

        <div id="faq" className="scroll-mt-20">
          <FAQ />
        </div>

        <CTASection onCTA={handleCTA} />
      </main>

      {/* Footer */}
      <footer className="bg-black py-20 border-t border-zinc-900 relative z-10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded border border-[#00F0FF]/30 bg-[#00F0FF]/5 flex items-center justify-center text-[#00F0FF]">
                  <Shield size={20} />
                </div>
                <span className="font-black text-2xl tracking-tighter uppercase italic">
                  Mentori <span className="text-[#00F0FF]">OS</span>
                </span>
              </div>
              <p className="text-sm text-zinc-500 max-w-xs leading-relaxed font-mono uppercase tracking-widest text-[10px]">
                Elite Neural Intelligence for Public Service Candidates.
                Rebuilding cognitive frameworks since 2025.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-mono text-[10px] font-bold text-white mb-6 uppercase tracking-[0.3em] text-[#00F0FF]">
                System
              </h4>
              <ul className="space-y-4 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Components
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    Licensing
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    Protocols
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-[10px] font-bold text-white mb-6 uppercase tracking-[0.3em] text-[#00F0FF]">
                Compliance
              </h4>
              <ul className="space-y-4 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Data Sovereignty
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Shield
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Refund Logic
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-[10px] font-bold text-white mb-6 uppercase tracking-[0.3em] text-[#00F0FF]">
                Comlink
              </h4>
              <ul className="space-y-4 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                <li>
                  <a
                    href="mailto:hq@mentori.app"
                    className="hover:text-white transition-colors"
                  >
                    hq@mentori.app
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Support Node
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-10 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-[8px] uppercase tracking-[0.4em] text-zinc-700">
            <p>© 2026 MENTORI SYSTEMS. ALL RIGHTS RESERVED.</p>
            <div className="flex items-center gap-3">
              <Activity size={10} className="text-green-500" />
              <span>ALL SYSTEMS OPERATIONAL</span>
            </div>
            <p>HARDENED WITH NEBIUS AI CORES</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SalesLanding;

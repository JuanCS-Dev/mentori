import React, { useState } from 'react';
import { Target, Loader2, PieChart, Microscope, ChevronRight, AlertCircle, Bookmark, Zap, Activity } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { BankProfileJSON } from '../types';

interface Props {
  onDataUpdate: (data: BankProfileJSON | null) => void;
  savedData: BankProfileJSON | null;
}

export const BankProfiler: React.FC<Props> = ({ onDataUpdate, savedData }) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!inputText) return;
    setLoading(true);
    try {
      const result = await GeminiService.analyzeBankProfile(inputText);
      onDataUpdate(result);
    } catch (error) {
        console.error(error);
        alert("Erro ao analisar perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {!savedData && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Info Card */}
            <div className="md:col-span-4 bg-white border border-kitchen-border rounded-xl p-8 shadow-sm flex flex-col justify-between">
                <div>
                    <div className="h-12 w-12 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center mb-6 text-blue-600">
                            <Microscope size={24} />
                    </div>
                    <h3 className="text-xl font-mono font-bold text-gray-800 mb-3 tracking-tight">Decodificador de Banca</h3>
                    <p className="text-gray-500 font-mono text-xs mb-6 leading-relaxed">
                        Nossa IA analisa padrões semânticos em milhares de questões para revelar o que os examinadores tentam esconder.
                    </p>
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                            <Target size={16} className="text-green-600" />
                            <span className="text-xs font-bold font-mono text-gray-700">Detecção de Pegadinhas</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                            <PieChart size={16} className="text-purple-600" />
                            <span className="text-xs font-bold font-mono text-gray-700">Mapa de Calor de Tópicos</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Input Card */}
            <div className="md:col-span-8 bg-white border border-kitchen-border rounded-xl p-8 flex flex-col justify-between shadow-sm">
                <div>
                    <label className="flex items-center justify-between text-sm font-bold text-slate-700 mb-4">
                        <span>Dados de Entrada</span>
                        <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded-md">Texto ou Nome da Banca</span>
                    </label>
                    <textarea
                        className="w-full h-48 p-5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none text-sm text-slate-600 shadow-sm"
                        placeholder="Ex: 'Perfil da Banca FGV para Direito Administrativo' ou cole questões anteriores..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    ></textarea>
                </div>
                
                <div className="flex justify-end mt-6">
                    <button
                    onClick={handleAnalyze}
                    disabled={loading || !inputText}
                    className="group flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white pl-6 pr-4 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:transform-none"
                    >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <span>Gerar Dossiê de Inteligência</span>}
                    <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
                        <ChevronRight size={16} />
                    </div>
                    </button>
                </div>
            </div>
        </div>
      )}

      {savedData && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
           {/* Top Profile Header */}
           <div className="bg-white rounded-xl p-8 shadow-sm border border-kitchen-border flex flex-col md:flex-row gap-8">
              <div className="flex-shrink-0">
                 <div className="w-24 h-24 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center text-indigo-600">
                    <Target size={40} />
                 </div>
              </div>
              <div className="flex-1">
                 <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-mono font-bold text-gray-800 tracking-tight">{savedData.perfil.nome}</h2>
                    <span className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-mono font-bold uppercase border border-red-100">Dificuldade: {savedData.perfil.dificuldade}/10</span>
                 </div>
                 <div className="flex items-center gap-2 text-indigo-600 font-mono text-sm font-bold mb-4">
                    <Activity size={16} />
                    <span>DNA Predominante: {savedData.perfil.estilo}</span>
                 </div>
                 <p className="text-gray-600 text-sm font-mono leading-relaxed max-w-3xl">
                    {savedData.perfil.descricao_estilo}
                 </p>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* DNA de Pegadinhas */}
              <div className="lg:col-span-7 space-y-6">
                 <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 px-2">
                    <AlertCircle className="text-red-500" /> DNA de Pegadinhas (Padrão de Erro)
                 </h3>
                 <div className="grid grid-cols-1 gap-4">
                    {savedData.dna_pegadinhas.map((trap, i) => (
                       <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-red-200 transition-colors group">
                          <div className="flex justify-between items-start mb-3">
                             <span className="font-black text-slate-800 uppercase tracking-tight text-sm">{trap.tipo}</span>
                             <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 uppercase">{trap.frequencia}</span>
                          </div>
                          <p className="text-slate-600 text-sm italic group-hover:text-slate-900 transition-colors">
                             "{trap.exemplo}"
                          </p>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Mapa de Calor */}
              <div className="lg:col-span-5 space-y-6">
                 <h3 className="text-lg font-mono font-bold text-gray-800 flex items-center gap-2 px-2">
                    <Zap className="text-amber-500" size={18} /> Mapa de Calor (Prioridade)
                 </h3>
                 <div className="bg-white border border-kitchen-border rounded-xl p-6 shadow-sm">
                    <div className="space-y-6">
                       {savedData.mapa_calor.map((item, i) => (
                          <div key={i} className="space-y-2">
                             <div className="flex justify-between text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">
                                <span>{item.materia}</span>
                                <span className="text-amber-600">{item.frequencia}</span>
                             </div>
                             <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: item.frequencia }}></div>
                             </div>
                             <p className="text-[10px] text-gray-400 font-mono font-bold">FOCO: {item.foco}</p>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>

           {/* Strategic Verdict Card */}
           <div className="bg-white border border-kitchen-border rounded-xl p-8 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                 <h3 className="text-xl font-mono font-bold text-gray-800 mb-4 flex items-center gap-3">
                    <Bookmark size={20} className="text-indigo-600" /> Veredito Estratégico do Especialista
                 </h3>
                 <p className="text-lg font-mono text-gray-600 leading-relaxed italic border-l-4 border-indigo-500 pl-4 py-2 bg-gray-50 rounded-r-lg">
                    "{savedData.vereditto_estrategico}"
                 </p>
              </div>
           </div>

           <div className="flex justify-center pb-10">
              <button 
                onClick={() => onDataUpdate(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold flex items-center gap-2 transition-colors"
              >
                Refazer Análise de Banca
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

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
            <div className="md:col-span-4 bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
            
            <div className="relative z-10">
                <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10">
                        <Microscope className="h-6 w-6 text-indigo-300" />
                </div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight">Decodificador de Banca</h3>
                <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                    Nossa IA analisa padrões semânticos em milhares de questões para revelar o que os examinadores tentam esconder.
                </p>
                
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <Target size={18} className="text-emerald-400" />
                        <span className="text-xs font-semibold text-slate-200">Detecção de Pegadinhas</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <PieChart size={18} className="text-purple-400" />
                        <span className="text-xs font-semibold text-slate-200">Mapa de Calor de Tópicos</span>
                    </div>
                </div>
            </div>
            </div>

            {/* Input Card */}
            <div className="md:col-span-8 glass-panel rounded-3xl p-8 flex flex-col justify-between">
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
           <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 flex flex-col md:flex-row gap-10">
              <div className="flex-shrink-0">
                 <div className="w-32 h-32 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
                    <Target size={48} />
                 </div>
              </div>
              <div className="flex-1">
                 <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">{savedData.perfil.nome}</h2>
                    <span className="px-4 py-1 bg-red-100 text-red-700 rounded-full text-xs font-black uppercase tracking-widest border border-red-200">Dificuldade: {savedData.perfil.dificuldade}/10</span>
                 </div>
                 <div className="flex items-center gap-2 text-indigo-600 font-bold mb-4">
                    <Activity size={18} />
                    <span>DNA Predominante: {savedData.perfil.estilo}</span>
                 </div>
                 <p className="text-slate-500 text-lg leading-relaxed max-w-3xl">
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
                 <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 px-2">
                    <Zap className="text-amber-500 fill-amber-500" /> Mapa de Calor (Prioridade)
                 </h3>
                 <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl">
                    <div className="space-y-6">
                       {savedData.mapa_calor.map((item, i) => (
                          <div key={i} className="space-y-2">
                             <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <span>{item.materia}</span>
                                <span className="text-amber-400">{item.frequencia}</span>
                             </div>
                             <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: item.frequencia }}></div>
                             </div>
                             <p className="text-[10px] text-slate-500 font-medium">FOCO: {item.foco}</p>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>

           {/* Strategic Verdict Card */}
           <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-10 opacity-10">
                 <Bookmark size={150} />
              </div>
              <div className="relative z-10">
                 <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Zap size={24} className="text-yellow-300 fill-yellow-300" /> Veredito Estratégico do Especialista
                 </h3>
                 <p className="text-xl font-medium leading-relaxed italic opacity-90">
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

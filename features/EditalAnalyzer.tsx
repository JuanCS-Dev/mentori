import React, { useState, useRef } from 'react';
import { Search, Loader2, FileUp, Calendar, AlertTriangle, Scale, BookOpen, Printer } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { MarkItDownService } from '../services/MarkItDownService';
import { EditalJSON } from '../types';

interface Props {
  onDataUpdate: (data: EditalJSON) => void;
  savedData: EditalJSON | null;
}

export const EditalAnalyzer: React.FC<Props> = ({ onDataUpdate, savedData }) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'vertical' | 'print'>('overview');
  const [dragActive, setDragActive] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!inputText) return;
    setLoading(true);
    try {
      const result = await GeminiService.analyzeEdital(inputText);
      onDataUpdate(result);
    } catch (error) {
      console.error(error);
      alert("Erro ao conectar com a IA.");
    } finally {
      setLoading(false);
    }
  };

  const processFile = async (file: File) => {
      setProcessingFile(true);
      try {
          const result = await MarkItDownService.convertFile(file);
          if (result.error) alert(result.error);
          else setInputText(prev => prev + (prev ? '\n\n' : '') + result.text);
      } catch (e) {
          console.error(e);
          alert("Falha ao ler arquivo.");
      } finally {
          setProcessingFile(false);
          setDragActive(false);
      }
  };

  // Drag & Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  if (savedData && activeTab === 'print') {
      return (
          <div className="bg-white min-h-screen text-slate-900 font-serif p-16 max-w-4xl mx-auto print:p-0 print:max-w-none">
              <div className="flex justify-between items-start mb-12 border-b-4 border-slate-900 pb-6 print:border-black">
                  <div>
                      <h1 className="text-4xl font-bold uppercase tracking-wide mb-2">{savedData.metadata.orgao}</h1>
                      <h2 className="text-xl text-slate-600 font-sans uppercase tracking-widest">{savedData.metadata.banca} • {savedData.metadata.cargos[0]}</h2>
                  </div>
                  <div className="text-right">
                      <button onClick={() => setActiveTab('overview')} className="print:hidden bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded mb-2 block w-full text-sm font-sans font-bold text-slate-600">Voltar</button>
                      <button onClick={() => window.print()} className="print:hidden bg-slate-900 text-white px-4 py-2 rounded block w-full text-sm font-sans font-bold">Imprimir PDF</button>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-12 mb-12 font-sans">
                  <div>
                      <h3 className="text-sm font-bold uppercase border-b border-slate-300 mb-4 pb-1">Cronograma Crítico</h3>
                      <ul className="space-y-3">
                          {savedData.cronograma.map((c, i) => (
                              <li key={i} className="flex justify-between text-sm">
                                  <span className={c.critical ? "font-bold text-red-700" : "text-slate-700"}>{c.evento}</span>
                                  <span className="font-mono">{c.data}</span>
                              </li>
                          ))}
                      </ul>
                  </div>
                  <div>
                      <h3 className="text-sm font-bold uppercase border-b border-slate-300 mb-4 pb-1">Alertas Estratégicos</h3>
                      <ul className="space-y-2">
                          {savedData.alertas.map((a, i) => (
                              <li key={i} className="text-sm text-slate-700 bg-red-50 p-2 border-l-2 border-red-500 italic">
                                  "{a}"
                              </li>
                          ))}
                      </ul>
                  </div>
              </div>

              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <span className="bg-slate-900 text-white w-8 h-8 flex items-center justify-center rounded text-sm font-sans">01</span>
                  Edital Verticalizado
              </h3>

              <div className="space-y-8">
                  {savedData.verticalizado.map((disc, i) => (
                      <div key={i} className="break-inside-avoid">
                          <div className="flex justify-between items-end mb-3 border-b-2 border-slate-200 pb-2">
                              <h4 className="font-bold text-lg">{disc.disciplina}</h4>
                              <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">Peso: {disc.peso} | {disc.questoes} Questões</span>
                          </div>
                          <ul className="grid grid-cols-2 gap-x-8 gap-y-2">
                              {disc.topicos.map((topico, j) => (
                                  <li key={j} className="flex items-start gap-2 text-sm leading-snug">
                                      <div className="w-4 h-4 border border-slate-300 rounded-sm mt-0.5 flex-shrink-0"></div>
                                      <span className="text-slate-700">{topico}</span>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  ))}
              </div>
          </div>
      )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {!savedData && (
          <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">Importação de Edital</h3>
                    <p className="text-slate-500 text-sm mt-1">Cole o texto ou faça upload do documento.</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div 
                    className={`lg:col-span-1 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-6 text-center cursor-pointer group relative overflow-hidden ${dragActive ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <input ref={inputRef} type="file" className="hidden" onChange={handleChange} accept=".txt,.md,.json,.csv,.pdf,.docx" />
                    {processingFile ? (
                        <div className="flex flex-col items-center animate-pulse">
                            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-3" />
                            <p className="text-sm font-semibold text-indigo-700">Lendo Arquivo...</p>
                        </div>
                    ) : (
                        <>
                            <div className="h-14 w-14 bg-white rounded-full shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <FileUp className="text-indigo-600 h-7 w-7" />
                            </div>
                            <p className="text-sm font-bold text-slate-700 mb-1">Clique ou Arraste</p>
                            <p className="text-xs text-slate-500 px-4">PDF, DOCX ou TXT</p>
                        </>
                    )}
                </div>

                <div className="lg:col-span-2 relative">
                    <textarea
                        className="w-full h-64 p-6 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none text-sm font-mono text-slate-700 shadow-inner"
                        placeholder="Cole o texto do edital aqui..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    ></textarea>
                    <div className="absolute bottom-4 right-4 z-10">
                        <button
                            onClick={handleAnalyze}
                            disabled={loading || !inputText}
                            className="flex items-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                            <span>Análise Estruturada</span>
                        </button>
                    </div>
                </div>
            </div>
          </div>
      )}

      {savedData && (
        <div className="glass-panel rounded-3xl overflow-hidden min-h-[800px] flex flex-col">
            {/* Header */}
            <div className="bg-slate-900 p-8 text-white flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                         <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">ATIVO</span>
                         <span className="text-slate-400 text-xs font-mono tracking-wider">{savedData.metadata.banca}</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-1">{savedData.metadata.orgao}</h1>
                    <p className="text-indigo-300 font-medium">{savedData.metadata.cargos.join(', ')}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-400">{savedData.metadata.remuneracao}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Remuneração Inicial</p>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex border-b border-slate-200 bg-white px-8">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    Visão Geral
                </button>
                <button 
                    onClick={() => setActiveTab('vertical')}
                    className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'vertical' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    Edital Verticalizado
                </button>
                <button 
                    onClick={() => setActiveTab('print')}
                    className={`ml-auto px-6 py-4 text-sm font-bold border-b-2 border-transparent text-slate-500 hover:text-indigo-600 flex items-center gap-2`}
                >
                    <Printer size={16} /> Modo Impressão
                </button>
            </div>

            {/* Content */}
            <div className="p-8 bg-slate-50/50 flex-1">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                                    <Calendar className="text-indigo-500" size={20} /> Cronograma Oficial
                                </h3>
                                <div className="space-y-4">
                                    {savedData.cronograma.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <span className={`font-medium ${item.critical ? 'text-slate-900' : 'text-slate-600'}`}>{item.evento}</span>
                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${item.critical ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'}`}>
                                                {item.data}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                                    <Scale className="text-purple-500" size={20} /> Regras do Jogo
                                </h3>
                                <div className="space-y-3">
                                    {savedData.fases.map((fase, idx) => (
                                        <div key={idx} className="p-3 border-l-4 border-purple-500 bg-purple-50/50">
                                            <div className="font-bold text-slate-800">{fase.nome}</div>
                                            <div className="text-xs text-purple-700 font-semibold uppercase mt-1">{fase.carater}</div>
                                            <p className="text-sm text-slate-600 mt-2 leading-relaxed">{fase.detalhes}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                                <h3 className="flex items-center gap-2 font-bold text-amber-800 mb-4">
                                    <AlertTriangle className="fill-amber-500 text-white" size={20} /> Atenção Redobrada
                                </h3>
                                <ul className="space-y-3">
                                    {savedData.alertas.map((alerta, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-sm text-amber-900 font-medium">
                                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                                            {alerta}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'vertical' && (
                    <div className="space-y-6">
                        {savedData.verticalizado.map((disc, idx) => (
                            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <BookOpen size={18} className="text-indigo-500" />
                                        {disc.disciplina}
                                    </h4>
                                    <div className="flex gap-2">
                                        <span className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-500">Peso {disc.peso}</span>
                                        <span className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-500">{disc.questoes} Questões</span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {disc.topicos.map((topico, tIdx) => (
                                            <label key={tIdx} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200 group">
                                                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-slate-600 group-hover:text-slate-900 font-medium leading-snug">{topico}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

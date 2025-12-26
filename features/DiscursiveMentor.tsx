import React, { useState, useEffect } from 'react';
import { PenTool, Timer, Loader2, Award, Eye, RefreshCw } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { DiscursiveTheme, DiscursiveEvaluation, EditalJSON } from '../types';

interface Props {
    metadata: EditalJSON['metadata'];
}

export const DiscursiveMentor: React.FC<Props> = ({ metadata }) => {
    const [theme, setTheme] = useState<DiscursiveTheme | null>(null);
    const [studentText, setStudentText] = useState('');
    const [loading, setLoading] = useState(false);
    const [evaluation, setEvaluation] = useState<DiscursiveEvaluation | null>(null);
    const [timeLeft, setTimer] = useState(3600); // 60 min
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    const startBattle = async () => {
        setLoading(true);
        try {
            const t = await GeminiService.generateDiscursiveTheme(
                metadata?.cargos?.[0] || "Geral",
                metadata?.banca || "FGV",
                JSON.stringify(metadata)
            );
            setTheme(t);
            setStudentText('');
            setEvaluation(null);
            setTimer(3600);
            setIsTimerRunning(true);
        } catch (_e) {
            alert("Erro ao gerar tema.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isTimerRunning && timeLeft > 0) {
            interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            setIsTimerRunning(false);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timeLeft]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const submitForCorrection = async () => {
        if (!studentText) return;
        setIsTimerRunning(false);
        setLoading(true);
        try {
            const result = await GeminiService.evaluateDiscursive(theme!, studentText, metadata?.banca || "FGV");
            setEvaluation(result);
        } catch (_e) {
            alert("Erro na correcao.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {!theme && !loading && (
                <div className="bg-white border border-kitchen-border rounded-xl p-16 text-center shadow-sm">
                    <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-2xl">
                        <PenTool size={48} />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-800 mb-4">Sala de Batalha Discursiva</h2>
                    <p className="text-slate-500 max-w-xl mx-auto text-lg mb-10">
                        Treine com temas inéditos gerados pelo DNA da sua banca. Receba correção instantânea com barema oficial de 2025.
                    </p>
                    <button
                        onClick={startBattle}
                        className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-600 transition-all shadow-xl hover:shadow-indigo-500/20"
                    >
                        Sortear Novo Tema
                    </button>
                </div>
            )}

            {loading && (
                <div className="py-24 text-center">
                    <Loader2 className="animate-spin h-16 w-16 text-indigo-600 mx-auto mb-6" />
                    <p className="text-xl font-bold text-slate-700">O Mentor está preparando sua prova...</p>
                </div>
            )}

            {theme && !evaluation && !loading && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar: Theme & Rules */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white border border-kitchen-border p-8 rounded-xl shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-center mb-8">
                                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-100">Simulado Ativo</span>
                                <div className={`flex items-center gap-2 font-mono text-2xl font-bold ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                                    <Timer size={24} /> {formatTime(timeLeft)}
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-4 leading-tight">{theme.titulo}</h3>
                            <div className="prose prose-sm text-slate-600 mb-8 max-h-[400px] overflow-y-auto pr-4 scrollbar-hide">
                                <p className="font-medium text-slate-800 mb-4 italic border-l-4 border-slate-200 pl-4">"{theme.enunciado}"</p>
                                <ul className="space-y-3 list-none pl-0">
                                    {theme.quesitos.map((q: string, i: number) => (
                                        <li key={i} className="flex gap-3 text-sm">
                                            <span className="text-indigo-600 font-bold font-mono">{(i + 1).toString().padStart(2, '0')}</span>
                                            {q}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight bg-gray-50 p-3 rounded-lg border border-gray-100">
                                {theme.instrucoes}
                            </p>
                        </div>
                    </div>

                    {/* Main Editor */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white border border-kitchen-border rounded-xl p-8 flex flex-col h-[700px] shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <PenTool size={14} /> Folha de Resposta Digital
                                </h4>
                                <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded">{studentText.length} caracteres • ~{Math.ceil(studentText.length / 70)} linhas</span>
                            </div>
                            <textarea
                                className="flex-1 w-full bg-white border border-gray-200 rounded-lg p-8 text-lg font-serif leading-relaxed text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none shadow-inner"
                                placeholder="Inicie sua redação aqui..."
                                value={studentText}
                                onChange={(e) => setStudentText(e.target.value)}
                            ></textarea>
                            <div className="mt-6 flex justify-end gap-4">
                                <button onClick={() => setTheme(null)} className="px-6 py-2 text-gray-500 font-bold hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm">Desistir</button>
                                <button
                                    onClick={submitForCorrection}
                                    disabled={!studentText}
                                    className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-green-700 transition-all text-sm shadow-sm"
                                >
                                    Finalizar e Corrigir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {evaluation && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {/* Score Dashboard */}
                    <div className="bg-white border border-kitchen-border rounded-xl p-8 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="md:col-span-1 flex flex-col items-center justify-center border-r border-gray-100 pr-8">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nota Final</div>
                            <div className={`text-6xl font-mono font-bold ${evaluation.pontuacao.total >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                {evaluation.pontuacao.total}
                            </div>
                            <div className="text-xs font-mono text-gray-400 mt-2">/ 100</div>
                        </div>
                        <div className="md:col-span-3 grid grid-cols-3 gap-6">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Conteúdo</div>
                                <div className="text-xl font-mono font-bold text-slate-800">{evaluation.pontuacao.conteudo}/50</div>
                                <div className="h-1.5 w-full bg-gray-200 rounded-full mt-3 overflow-hidden">
                                    <div className="h-full bg-indigo-500" style={{ width: `${(evaluation.pontuacao.conteudo / 50) * 100}%` }}></div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Estrutura</div>
                                <div className="text-xl font-mono font-bold text-slate-800">{evaluation.pontuacao.estrutura}/30</div>
                                <div className="h-1.5 w-full bg-gray-200 rounded-full mt-3 overflow-hidden">
                                    <div className="h-full bg-purple-500" style={{ width: `${(evaluation.pontuacao.estrutura / 30) * 100}%` }}></div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Gramática</div>
                                <div className="text-xl font-mono font-bold text-slate-800">{evaluation.pontuacao.gramatica}/20</div>
                                <div className="h-1.5 w-full bg-gray-200 rounded-full mt-3 overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: `${(evaluation.pontuacao.gramatica / 20) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feedback Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white border border-kitchen-border rounded-xl p-8 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Award size={20} className="text-indigo-600" /> Parecer do Especialista
                            </h3>
                            <p className="text-slate-600 leading-relaxed text-sm italic border-l-4 border-indigo-100 pl-4">
                                "{evaluation.parecer_pedagogico}"
                            </p>

                            <div className="mt-8 space-y-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Correções Cirúrgicas</h4>
                                {evaluation.erros_identificados.map((erro, i: number) => (
                                    <div key={i} className="p-4 bg-red-50 border border-red-100 rounded-lg">
                                        <p className="text-xs font-bold text-red-700 line-through mb-1 opacity-70">{erro.trecho}</p>
                                        <p className="text-sm font-bold text-green-700 mb-2">➜ {erro.correcao}</p>
                                        <p className="text-xs text-slate-500 font-medium">{erro.motivo}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white border border-kitchen-border rounded-xl p-8 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Eye size={20} className="text-amber-500" /> O Espelho de Ouro
                            </h3>
                            <div className="prose prose-sm max-w-none font-serif leading-loose text-slate-600 italic bg-gray-50 p-6 rounded-lg border border-gray-100">
                                {evaluation.espelho_ideal}
                            </div>
                            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Modelo de Resposta Nota 100</span>
                                <button onClick={startBattle} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm">
                                    <RefreshCw size={14} /> Próximo Tema
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

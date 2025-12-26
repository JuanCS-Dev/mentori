import React, { useState } from 'react';
import { FileOutput, Loader2, BookOpen, Printer, Layers, Zap, Scale, Gavel, ChevronLeft, ChevronRight } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { MaterialJSON } from '../types';

interface Props {
    bankProfile: string;
}

export const MaterialGenerator: React.FC<Props> = ({ bankProfile }) => {
    const [topic, setTopic] = useState('');
    const [material, setMaterial] = useState<MaterialJSON | null>(null);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'read' | 'flashcards'>('read');

    // Flashcard State
    const [currentCard, setCurrentCard] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const handleGenerate = async () => {
        if (!topic) return;
        setLoading(true);
        setMaterial(null);
        try {
            const result = await GeminiService.generateSurgicalMaterial(topic, bankProfile || "Banca padrão");
            setMaterial(result);
        } catch (e) {
            console.error(e);
            alert("Erro ao gerar material.");
        } finally {
            setLoading(false);
        }
    };

    const nextCard = () => {
        if (material && currentCard < material.flashcards.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentCard(prev => prev + 1), 150);
        }
    };

    const prevCard = () => {
        if (currentCard > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentCard(prev => prev - 1), 150);
        }
    };

    return (
        <div className="max-w-6xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Input Area */}
            <div className="bg-white border border-kitchen-border p-2 rounded-xl mb-8 flex gap-2 print:hidden shadow-sm">
                <input
                    type="text"
                    className="flex-1 p-4 bg-transparent border-none focus:ring-0 text-lg font-medium placeholder-slate-400 text-slate-800"
                    placeholder="Tópico (Ex: Controle de Constitucionalidade, Atos Administrativos...)"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                />
                <button
                    onClick={handleGenerate}
                    disabled={loading || !topic}
                    className="bg-slate-900 hover:bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <FileOutput />}
                    Gerar Material 80/20
                </button>
            </div>

            {material ? (
                <div className="flex-1 bg-white shadow-2xl shadow-slate-300/50 rounded-xl overflow-hidden flex flex-col border border-slate-200 relative group min-h-[600px]">

                    {/* Toolbar */}
                    <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center z-10 relative print:hidden">
                        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                            <button
                                onClick={() => setMode('read')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${mode === 'read' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <BookOpen size={16} /> Leitura
                            </button>
                            <button
                                onClick={() => setMode('flashcards')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${mode === 'flashcards' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <Zap size={16} /> Flashcards ({material.flashcards.length})
                            </button>
                        </div>

                        {mode === 'read' && (
                            <div className="flex items-center gap-2">
                                <button onClick={() => window.print()} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors tooltip" title="Imprimir PDF">
                                    <Printer size={20} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* CONTENT: READ MODE */}
                    {mode === 'read' && (
                        <div className="flex-1 overflow-auto bg-white relative">
                            <article className="max-w-4xl mx-auto p-16 print:p-0 print:max-w-none">
                                <div className="mb-10 border-b-2 border-slate-900 pb-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs font-black text-indigo-600 tracking-[0.2em] uppercase mb-2 block">Material Cirúrgico • Mentori</span>
                                            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-2">{material.titulo}</h1>
                                        </div>
                                        <div className="text-right hidden print:block">
                                            <div className="text-xs text-slate-400 font-mono">DOC REF: {Math.floor(Math.random() * 10000)}</div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-6 flex gap-4 items-start">
                                        <Zap className="text-amber-500 fill-amber-500 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">Raio-X da Banca</p>
                                            <p className="text-sm text-slate-600 leading-relaxed">{material.raio_x}</p>
                                        </div>
                                        <div className="ml-auto text-xs font-bold text-slate-400 whitespace-nowrap bg-white px-2 py-1 rounded border border-slate-200">
                                            ⏱️ {material.estimativa_leitura}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-12">
                                    {material.modulos.map((mod, idx) => (
                                        <section key={idx}>
                                            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3 border-l-4 border-indigo-500 pl-4">
                                                {mod.tipo === 'Jurisprudencia' ? <Gavel size={24} className="text-slate-400" /> : <Scale size={24} className="text-slate-400" />}
                                                {mod.titulo}
                                            </h2>
                                            <div className="prose prose-slate prose-lg max-w-none text-justify prose-p:leading-7 prose-li:marker:text-indigo-500">
                                                <MarkdownRenderer content={mod.conteudo} />
                                            </div>
                                        </section>
                                    ))}
                                </div>

                                <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 font-medium uppercase tracking-wider print:mt-10">
                                    <span>Gerado via Neural Engine 3.0</span>
                                    <span>Foco Total: 80/20</span>
                                    <span>Pagina 1 de 1</span>
                                </div>
                            </article>
                        </div>
                    )}

                    {/* CONTENT: FLASHCARD MODE */}
                    {mode === 'flashcards' && (
                        <div className="flex-1 bg-slate-100 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

                            <div className="w-full max-w-2xl perspective-1000 group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                                <div className={`relative w-full aspect-[16/9] transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

                                    {/* FRONT */}
                                    <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-2xl border border-slate-200 p-10 flex flex-col items-center justify-center text-center">
                                        <div className="absolute top-6 left-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Pergunta {currentCard + 1}/{material.flashcards.length}</div>
                                        <h3 className="text-2xl font-bold text-slate-800 leading-relaxed">
                                            {material.flashcards[currentCard]?.front}
                                        </h3>
                                        <p className="text-sm text-slate-400 mt-8 font-medium animate-pulse">Clique para ver a resposta</p>
                                    </div>

                                    {/* BACK */}
                                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900 rounded-3xl shadow-2xl p-10 flex flex-col items-center justify-center text-center text-white">
                                        <div className="absolute top-6 left-6 text-xs font-bold text-indigo-400 uppercase tracking-widest">Resposta</div>
                                        <p className="text-xl font-medium leading-relaxed">
                                            {material.flashcards[currentCard]?.back}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 mt-12">
                                <button
                                    onClick={prevCard}
                                    disabled={currentCard === 0}
                                    className="p-4 bg-white rounded-full shadow-lg text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <span className="font-bold text-slate-400 text-lg font-mono">
                                    {currentCard + 1} <span className="text-slate-300">/</span> {material.flashcards.length}
                                </span>
                                <button
                                    onClick={nextCard}
                                    disabled={currentCard === material.flashcards.length - 1}
                                    className="p-4 bg-white rounded-full shadow-lg text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300/60 rounded-3xl bg-white/30 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-full shadow-xl shadow-indigo-100/50 mb-6 animate-bounce">
                        <Layers className="h-12 w-12 text-indigo-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Material Cirúrgico 80/20</h3>
                    <p className="text-slate-500 max-w-md text-center leading-relaxed">
                        Nossos algoritmos cortam a gordura e geram PDFs densos + Flashcards de revisão ativa. <br />
                        <span className="text-indigo-600 font-bold">Economize tempo, maximize a retenção.</span>
                    </p>
                </div>
            )}
        </div>
    );
};

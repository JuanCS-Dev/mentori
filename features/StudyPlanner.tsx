import React, { useState } from 'react';
import { Clock, Loader2, Award, Zap, Sun, Battery, BatteryCharging, Brain, Coffee, Activity } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { EditalJSON, BankProfileJSON, NeuroStudyPlanJSON } from '../types';

interface Props {
    editalData: EditalJSON | null;
    profileData: BankProfileJSON | null;
    onPlanUpdate: (plan: NeuroStudyPlanJSON | null) => void;
    savedPlan: NeuroStudyPlanJSON | null;
}

export const StudyPlanner: React.FC<Props> = ({ editalData, profileData, onPlanUpdate, savedPlan }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Anamnese State
    const [anamnese, setAnamnese] = useState({
        cronotipo: 'Matutino (Cotovia)',
        foco_maximo: 50,
        nivel_estresse: 'Médio',
        horas_diarias: 4,
        dias_prova: 60
    });

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const plan = await GeminiService.generateNeuroStudyPlan({
                ...anamnese,
                editalSummary: editalData ? JSON.stringify(editalData) : "Genérico",
                bankProfile: profileData ? JSON.stringify(profileData) : "Genérico"
            });
            onPlanUpdate(plan);
        } catch (e) {
            console.error(e);
            alert("Erro ao gerar plano neuro-adaptativo.");
        } finally {
            setLoading(false);
        }
    };

    const renderWizard = () => (
        <div className="glass-panel p-8 rounded-3xl max-w-4xl mx-auto relative overflow-hidden animate-in zoom-in-95 duration-500">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: step === 1 ? '50%' : '100%' }}></div>
            </div>

            <div className="mb-8 mt-4 text-center">
                <h2 className="text-2xl font-bold text-slate-800">Calibragem Neuro-Cognitiva</h2>
                <p className="text-slate-500">Para criar o plano perfeito, precisamos entender sua biologia.</p>
            </div>

            {step === 1 && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Cronotipo */}
                        <div className="space-y-3">
                            <label className="font-bold text-slate-700 flex items-center gap-2"><Sun size={18} className="text-orange-500" /> Seu Cronotipo (Pico de Energia)</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['Matutino (Cotovia)', 'Vespertino (Intermediário)', 'Noturno (Coruja)'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setAnamnese({ ...anamnese, cronotipo: type })}
                                        className={`p-4 rounded-xl border-2 text-sm font-bold transition-all ${anamnese.cronotipo === type ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 hover:border-emerald-200'}`}
                                    >
                                        {type.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Foco (Ultradian) */}
                        <div className="space-y-3">
                            <label className="font-bold text-slate-700 flex items-center gap-2"><Battery size={18} className="text-indigo-500" /> Ciclo de Foco (Ultradiano)</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[30, 50, 90].map(mins => (
                                    <button
                                        key={mins}
                                        onClick={() => setAnamnese({ ...anamnese, foco_maximo: mins })}
                                        className={`p-4 rounded-xl border-2 text-sm font-bold transition-all ${anamnese.foco_maximo === mins ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 hover:border-indigo-200'}`}
                                    >
                                        {mins} min
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-slate-400">Tempo que consegue estudar sem perder a atenção.</p>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button onClick={() => setStep(2)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">Próximo: Contexto</button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Estresse */}
                        <div className="space-y-3">
                            <label className="font-bold text-slate-700 flex items-center gap-2"><Activity size={18} className="text-rose-500" /> Nível de Estresse Atual</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Baixo', 'Médio', 'Alto'].map(level => (
                                    <button
                                        key={level}
                                        onClick={() => setAnamnese({ ...anamnese, nivel_estresse: level })}
                                        className={`p-4 rounded-xl border-2 text-sm font-bold transition-all ${anamnese.nivel_estresse === level ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-100 hover:border-rose-200'}`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Horas */}
                        <div className="space-y-3">
                            <label className="font-bold text-slate-700 flex items-center gap-2"><Clock size={18} className="text-blue-500" /> Horas Líquidas Diárias</label>
                            <input
                                type="range" min="1" max="12" step="0.5"
                                value={anamnese.horas_diarias}
                                onChange={e => setAnamnese({ ...anamnese, horas_diarias: Number(e.target.value) })}
                                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="text-center font-black text-2xl text-blue-600">{anamnese.horas_diarias}h</div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-600 font-bold">Voltar</button>
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Brain />}
                            Gerar Neuro-Plano
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {!savedPlan ? renderWizard() : (
                <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                    {/* Header Diagnóstico */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30">
                                <Brain size={40} className="text-white" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-3xl font-bold mb-2">Diagnóstico Bio-Adaptativo</h2>
                                <p className="text-emerald-100 text-lg font-medium">{savedPlan.diagnostico.perfil_cognitivo}</p>
                                <div className="mt-4 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20 text-sm font-bold">
                                    <Zap size={16} className="text-yellow-300" />
                                    Estratégia: {savedPlan.diagnostico.estrategia_adotada}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rotina Timeline */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Morning Routine */}
                        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><Sun className="text-orange-500" /> Protocolo Matinal</h3>
                            <ul className="space-y-4">
                                {savedPlan.rotina_matinal.map((action: string, i: number) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                                        <div className="h-2 w-2 rounded-full bg-orange-400"></div>
                                        {action}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Main Blocks */}
                        <div className="lg:col-span-2 space-y-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2 px-2"><Activity className="text-indigo-500" /> Blocos de Alta Performance</h3>
                            {savedPlan.blocos_estudo.map((block, i: number) => (
                                <div key={i} className={`p-5 rounded-2xl flex items-center gap-6 transition-all hover:scale-[1.01] ${block.energia_exigida === 'Alta' ? 'bg-white border-l-4 border-indigo-500 shadow-md' : 'bg-slate-50 border border-slate-100 opacity-80'}`}>
                                    <div className="text-center min-w-[80px]">
                                        <div className="font-black text-slate-800">{block.horario.split(' - ')[0]}</div>
                                        <div className="text-xs text-slate-400 font-bold">{block.horario.split(' - ')[1]}</div>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`font-bold text-lg ${block.energia_exigida === 'Alta' ? 'text-indigo-700' : 'text-slate-600'}`}>{block.atividade}</h4>
                                        <p className="text-xs text-slate-500 mt-1 font-medium bg-slate-100 inline-block px-2 py-1 rounded">{block.metodo}</p>
                                        {block.motivo && <p className="text-xs text-emerald-600 mt-2 italic flex items-center gap-1"><Brain size={12} /> {block.motivo}</p>}
                                    </div>
                                    {block.energia_exigida === 'Alta' ? <BatteryCharging className="text-indigo-400" /> : <Coffee className="text-slate-400" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dopamine Triggers */}
                    <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 p-8 rounded-3xl text-white shadow-xl flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-xl mb-2 flex items-center gap-2"><Award /> Gatilhos de Dopamina</h3>
                            <p className="text-white/80 text-sm">O cérebro precisa de recompensa para criar o hábito.</p>
                        </div>
                        <div className="text-right">
                            {savedPlan.dopamina_triggers.map((trigger: string, i: number) => (
                                <div key={i} className="font-bold text-lg bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20">
                                    {trigger}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-center pt-8">
                        <button onClick={() => onPlanUpdate(null)} className="text-slate-400 font-bold hover:text-slate-600 text-sm">Recalibrar Perfil</button>
                    </div>
                </div>
            )}
        </div>
    );
};

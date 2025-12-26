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
        <div className="bg-white border border-kitchen-border p-8 rounded-xl max-w-4xl mx-auto relative overflow-hidden animate-in zoom-in-95 duration-500 shadow-sm">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: step === 1 ? '50%' : '100%' }}></div>
            </div>

            <div className="mb-8 mt-4 text-center">
                <h2 className="text-2xl font-mono font-bold text-slate-800">Calibragem Neuro-Cognitiva</h2>
                <p className="text-slate-500 font-mono text-sm mt-2">Para criar o plano perfeito, precisamos entender sua biologia.</p>
            </div>

            {step === 1 && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        {/* Cronotipo */}
                        <div className="space-y-4">
                            <label className="font-bold font-mono text-sm text-slate-700 flex items-center gap-2">
                                <Sun size={18} className="text-orange-500" /> Seu Cronotipo (Pico de Energia)
                            </label>
                            <div className="flex flex-col gap-3">
                                {['Matutino', 'Vespertino', 'Noturno'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setAnamnese({ ...anamnese, cronotipo: type })}
                                        className={`p-4 rounded-xl border-2 text-sm font-bold font-mono transition-all text-center hover:scale-[1.02] active:scale-95 ${
                                            anamnese.cronotipo === type 
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                                            : 'border-white bg-white shadow-sm hover:border-gray-200 text-slate-400'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Foco (Ultradian) */}
                        <div className="space-y-4">
                            <label className="font-bold font-mono text-sm text-slate-700 flex items-center gap-2">
                                <Battery size={18} className="text-blue-500" /> Ciclo de Foco (Ultradiano)
                            </label>
                            <div className="flex gap-3">
                                {[30, 50, 90].map(mins => (
                                    <button
                                        key={mins}
                                        onClick={() => setAnamnese({ ...anamnese, foco_maximo: mins })}
                                        className={`flex-1 py-4 rounded-xl border-2 text-sm font-bold font-mono transition-all hover:scale-[1.02] active:scale-95 ${
                                            anamnese.foco_maximo === mins 
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                                            : 'border-white bg-white shadow-sm hover:border-gray-200 text-slate-400'
                                        }`}
                                    >
                                        {mins} min
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-slate-400 font-mono mt-2 text-center">Tempo que consegue estudar sem perder a atenção.</p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button 
                            onClick={() => setStep(2)} 
                            className="bg-[#0f172a] text-white px-8 py-3 rounded-lg font-bold font-mono hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                        >
                            Próximo: Contexto
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Estresse */}
                        <div className="space-y-3">
                            <label className="font-bold font-mono text-sm text-slate-700 flex items-center gap-2"><Activity size={16} className="text-rose-500" /> NÍVEL DE ESTRESSE</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Baixo', 'Médio', 'Alto'].map(level => (
                                    <button
                                        key={level}
                                        onClick={() => setAnamnese({ ...anamnese, nivel_estresse: level })}
                                        className={`p-4 rounded-lg border text-sm font-bold font-mono transition-all ${anamnese.nivel_estresse === level ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-slate-600'}`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Horas */}
                        <div className="space-y-3">
                            <label className="font-bold font-mono text-sm text-slate-700 flex items-center gap-2"><Clock size={16} className="text-blue-500" /> HORAS LÍQUIDAS</label>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                                <input
                                    type="range" min="1" max="12" step="0.5"
                                    value={anamnese.horas_diarias}
                                    onChange={e => setAnamnese({ ...anamnese, horas_diarias: Number(e.target.value) })}
                                    className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="text-center font-mono font-bold text-3xl text-blue-600 mt-4">{anamnese.horas_diarias}h</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-600 font-bold font-mono text-sm">&lt; Voltar</button>
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-bold font-mono hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2 text-sm"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <Brain size={16} />}
                            Gerar Neuro-Plano
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {!savedPlan ? renderWizard() : (
                <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                    {/* Header Diagnóstico */}
                    <div className="bg-white border border-kitchen-border rounded-xl p-8 shadow-sm flex flex-col md:flex-row gap-8 items-center">
                        <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center">
                            <Brain size={32} className="text-emerald-600" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-mono font-bold text-slate-800 mb-2">Diagnóstico Bio-Adaptativo</h2>
                            <p className="text-slate-500 font-mono text-sm">{savedPlan.diagnostico.perfil_cognitivo}</p>
                            <div className="mt-4 inline-flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200 text-xs font-bold text-yellow-700 uppercase tracking-wide">
                                <Zap size={14} className="text-yellow-600" />
                                Estratégia: {savedPlan.diagnostico.estrategia_adotada}
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
                                <div key={i} className={`p-5 rounded-xl border border-kitchen-border bg-white shadow-sm flex items-center gap-6 transition-all hover:shadow-md ${block.energia_exigida === 'Alta' ? 'border-l-4 border-l-indigo-500' : ''}`}>
                                    <div className="text-center min-w-[80px]">
                                        <div className="font-mono font-bold text-slate-800">{block.horario.split(' - ')[0]}</div>
                                        <div className="text-xs font-mono text-slate-400">{block.horario.split(' - ')[1]}</div>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`font-bold text-sm ${block.energia_exigida === 'Alta' ? 'text-indigo-700' : 'text-slate-700'}`}>{block.atividade}</h4>
                                        <p className="text-xs text-slate-500 mt-1 font-mono bg-gray-50 inline-block px-2 py-1 rounded border border-gray-100">{block.metodo}</p>
                                        {block.motivo && <p className="text-xs text-emerald-600 mt-2 italic flex items-center gap-1"><Brain size={12} /> {block.motivo}</p>}
                                    </div>
                                    {block.energia_exigida === 'Alta' ? <BatteryCharging className="text-indigo-400" size={20} /> : <Coffee className="text-slate-400" size={20} />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dopamine Triggers */}
                    <div className="bg-white border border-kitchen-border rounded-xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h3 className="font-bold text-xl mb-2 flex items-center gap-2 text-slate-800"><Award className="text-purple-500" /> Gatilhos de Dopamina</h3>
                            <p className="text-slate-500 text-sm">O cérebro precisa de recompensa para criar o hábito.</p>
                        </div>
                        <div className="text-right flex flex-wrap gap-2 justify-end">
                            {savedPlan.dopamina_triggers.map((trigger: string, i: number) => (
                                <div key={i} className="font-mono font-bold text-xs bg-purple-50 text-purple-700 px-4 py-2 rounded-lg border border-purple-100">
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

import React, { useState, useEffect } from 'react';
import {
    getChaosStatus,
    setChaosConfig,
    getHealthStatus,
    getCircuitStatus,
    HealthSignal
} from '../services/chaosOrchestrator';
import { Zap, Activity, AlertTriangle, ShieldAlert, X } from 'lucide-react';

export function ChaosControlPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState(getChaosStatus());
    const [health, setHealth] = useState(getHealthStatus());
    const [circuits, setCircuits] = useState(getCircuitStatus());

    // Auto-refresh stats when open
    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(() => {
            setHealth(getHealthStatus());
            setCircuits(getCircuitStatus());
        }, 1000);
        return () => clearInterval(interval);
    }, [isOpen]);

    const toggleChaos = () => {
        const newEnabled = !config.enabled;
        setChaosConfig({ enabled: newEnabled });
        setConfig(getChaosStatus());
    };

    const toggleExperiment = (name: 'LATENCY' | 'PARTITION' | 'CRASH' | 'CORRUPTION') => {
        const currentExp = config.experiments[name];
        // Toggle: if exists, remove it. If not, add with default prob 0.5
        const newExperiments = { ...config.experiments };

        if (currentExp) {
            delete newExperiments[name];
        } else {
            newExperiments[name] = { probability: 0.5, config: name === 'LATENCY' ? { delayMs: 2000 } : undefined };
        }

        setChaosConfig({ experiments: newExperiments });
        setConfig(getChaosStatus());
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-red-900/80 hover:bg-red-700 text-white p-3 rounded-full shadow-lg z-50 border border-red-500/50 backdrop-blur-sm transition-all"
                title="Chaos Control Panel"
            >
                <Zap size={20} />
            </button>
        );
    }

    return (
        <div className="fixed top-4 right-4 w-96 bg-gray-900/95 border border-red-500/30 text-white rounded-lg shadow-2xl z-50 backdrop-blur-md flex flex-col max-h-[90vh]">

            {/* HEADER */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <div className="flex items-center gap-2 text-red-400 font-bold">
                    <Zap size={18} />
                    <span>CHAOS ORCHESTRATOR</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                    <X size={18} />
                </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-6">

                {/* MASTER SWITCH */}
                <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">Master Chaos Switch</span>
                        <span className="text-xs text-gray-400">{config.enabled ? 'SYSTEM UNSTABLE' : 'System Normal'}</span>
                    </div>
                    <button
                        onClick={toggleChaos}
                        className={`w-12 h-6 rounded-full transition-colors relative ${config.enabled ? 'bg-red-600' : 'bg-gray-600'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${config.enabled ? 'translate-x-6' : ''}`} />
                    </button>
                </div>

                {/* EXPERIMENTS */}
                <div className={`space-y-3 transition-opacity ${config.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Experiments</h3>

                    <div className="grid grid-cols-2 gap-2">
                        {(['LATENCY', 'PARTITION', 'CRASH', 'CORRUPTION'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => toggleExperiment(type)}
                                className={`p-2 rounded border text-xs font-medium flex items-center justify-between ${config.experiments[type]
                                        ? 'bg-red-900/30 border-red-500/50 text-red-200'
                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
                                    }`}
                            >
                                {type}
                                {config.experiments[type] && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* HEALTH SIGNALS */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Activity size={12} /> Health Signals
                    </h3>

                    {health.length === 0 ? (
                        <div className="text-xs text-gray-500 italic">No activity recorded yet.</div>
                    ) : (
                        <div className="space-y-2">
                            {health.map((signal, i) => (
                                <div key={i} className="text-xs flex items-center justify-between p-2 bg-gray-800/50 rounded border-l-2 border-gray-700" style={{
                                    borderLeftColor: signal.status === 'healthy' ? '#10b981' : signal.status === 'degraded' ? '#f59e0b' : '#ef4444'
                                }}>
                                    <span className="font-mono truncate max-w-[140px]" title={signal.service}>{signal.service.replace('gemini:', '')}</span>
                                    <div className="flex items-center gap-2">
                                        {signal.latency && <span className="text-gray-400">{signal.latency}ms</span>}
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${signal.status === 'healthy' ? 'bg-green-900/30 text-green-400' :
                                                signal.status === 'degraded' ? 'bg-yellow-900/30 text-yellow-400' :
                                                    'bg-red-900/30 text-red-400'
                                            }`}>{signal.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* CIRCUIT BREAKERS */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <ShieldAlert size={12} /> Circuit Breakers
                    </h3>

                    {Object.keys(circuits).length === 0 ? (
                        <div className="text-xs text-gray-500 italic">All circuits closed (idle).</div>
                    ) : (
                        <div className="space-y-2">
                            {Object.entries(circuits).map(([name, state]) => (
                                <div key={name} className="p-2 bg-gray-800/50 rounded border border-gray-700 flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-mono font-medium">{name}</span>
                                        <span className={`text-[10px] uppercase font-bold px-1.5 rounded ${state.state === 'closed' ? 'bg-green-900/20 text-green-500' :
                                                state.state === 'open' ? 'bg-red-900/20 text-red-500' :
                                                    'bg-yellow-900/20 text-yellow-500'
                                            }`}>{state.state}</span>
                                    </div>
                                    {state.failures > 0 && (
                                        <div className="text-[10px] text-gray-400 flex justify-between">
                                            <span>Failures: {state.failures}</span>
                                            <span>Last: {new Date(state.lastFailure).toLocaleTimeString()}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

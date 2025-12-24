import React, { useState } from 'react';
import { GripVertical, Plus, Trash2, Clock, BookOpen } from 'lucide-react';

/**
 * Canvas Workspace - Study Plan Builder
 * 
 * Based on Google LearnLM Canvas concept:
 * - Structured planning workspace
 * - Drag-and-drop for cognitive load reduction
 * - Visual time blocking
 * 
 * "Reduces choice paralysis" - Duolingo Psychology Principles
 */

export interface StudyBlock {
    id: string;
    discipline: string;
    duration: number; // minutes
    type: 'study' | 'review' | 'practice' | 'break';
    order: number;
}

interface StudyPlannerProps {
    disciplines: string[];
    onSave?: (blocks: StudyBlock[]) => void;
}

const BLOCK_TYPES = [
    { value: 'study', label: '📖 Estudo', color: 'bg-blue-100 border-blue-300' },
    { value: 'review', label: '🔄 Revisão', color: 'bg-purple-100 border-purple-300' },
    { value: 'practice', label: '✏️ Questões', color: 'bg-green-100 border-green-300' },
    { value: 'break', label: '☕ Pausa', color: 'bg-amber-100 border-amber-300' }
];

export const StudyPlanner: React.FC<StudyPlannerProps> = ({
    disciplines,
    onSave
}) => {
    const [blocks, setBlocks] = useState<StudyBlock[]>([]);
    const [draggedId, setDraggedId] = useState<string | null>(null);

    const addBlock = () => {
        const newBlock: StudyBlock = {
            id: `block-${Date.now()}`,
            discipline: disciplines[0] || 'Geral',
            duration: 30,
            type: 'study',
            order: blocks.length
        };
        setBlocks([...blocks, newBlock]);
    };

    const removeBlock = (id: string) => {
        setBlocks(blocks.filter(b => b.id !== id));
    };

    const updateBlock = (id: string, updates: Partial<StudyBlock>) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const handleDragStart = (id: string) => {
        setDraggedId(id);
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedId || draggedId === targetId) return;

        const draggedIndex = blocks.findIndex(b => b.id === draggedId);
        const targetIndex = blocks.findIndex(b => b.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const newBlocks = [...blocks];
        const [draggedBlock] = newBlocks.splice(draggedIndex, 1);
        if (!draggedBlock) return;
        newBlocks.splice(targetIndex, 0, draggedBlock);

        // Update order
        newBlocks.forEach((b, i) => b.order = i);
        setBlocks(newBlocks);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
    };

    const totalMinutes = blocks.reduce((sum, b) => sum + b.duration, 0);
    const studyMinutes = blocks.filter(b => b.type !== 'break').reduce((sum, b) => sum + b.duration, 0);

    const getBlockColor = (type: string) => {
        return BLOCK_TYPES.find(t => t.value === type)?.color || 'bg-slate-100';
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">📋 Planejador de Estudos</h2>
                    <p className="text-sm text-slate-500">Arraste para reorganizar seus blocos</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-slate-600">
                        <Clock size={16} />
                        {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}min total
                    </span>
                    <span className="flex items-center gap-1 text-blue-600 font-medium">
                        <BookOpen size={16} />
                        {Math.floor(studyMinutes / 60)}h {studyMinutes % 60}min estudo
                    </span>
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-2 mb-6">
                {blocks.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed">
                        <p className="font-medium">Nenhum bloco de estudo</p>
                        <p className="text-sm">Clique em "Adicionar Bloco" para começar</p>
                    </div>
                ) : (
                    blocks.map((block) => (
                        <div
                            key={block.id}
                            draggable
                            onDragStart={() => handleDragStart(block.id)}
                            onDragOver={(e) => handleDragOver(e, block.id)}
                            onDragEnd={handleDragEnd}
                            className={`
                flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-move
                ${getBlockColor(block.type)}
                ${draggedId === block.id ? 'opacity-50 scale-95' : 'opacity-100'}
              `}
                        >
                            <GripVertical className="text-slate-400" size={20} />

                            {/* Type Selector */}
                            <select
                                value={block.type}
                                onChange={(e) => updateBlock(block.id, { type: e.target.value as StudyBlock['type'] })}
                                className="bg-white/50 border border-slate-200 rounded-lg px-2 py-1 text-sm"
                            >
                                {BLOCK_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>

                            {/* Discipline Selector (only for non-breaks) */}
                            {block.type !== 'break' && (
                                <select
                                    value={block.discipline}
                                    onChange={(e) => updateBlock(block.id, { discipline: e.target.value })}
                                    className="flex-1 bg-white/50 border border-slate-200 rounded-lg px-2 py-1 text-sm"
                                >
                                    {disciplines.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                    {disciplines.length === 0 && <option value="Geral">Geral</option>}
                                </select>
                            )}

                            {block.type === 'break' && (
                                <span className="flex-1 text-sm text-slate-600">Descanso</span>
                            )}

                            {/* Duration */}
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    value={block.duration}
                                    onChange={(e) => updateBlock(block.id, { duration: parseInt(e.target.value) || 0 })}
                                    className="w-16 bg-white/50 border border-slate-200 rounded-lg px-2 py-1 text-sm text-center"
                                    min={5}
                                    max={120}
                                    step={5}
                                />
                                <span className="text-xs text-slate-500">min</span>
                            </div>

                            {/* Delete */}
                            <button
                                onClick={() => removeBlock(block.id)}
                                className="p-1 text-red-400 hover:text-red-600 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={addBlock}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-50 text-indigo-600 font-medium rounded-xl hover:bg-indigo-100 transition-colors"
                >
                    <Plus size={20} />
                    Adicionar Bloco
                </button>

                {blocks.length > 0 && onSave && (
                    <button
                        onClick={() => onSave(blocks)}
                        className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                        Salvar Plano
                    </button>
                )}
            </div>

            {/* Quick Templates */}
            <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase mb-3">Templates Rápidos</p>
                <div className="flex gap-2">
                    <button
                        onClick={() => setBlocks([
                            { id: 'p1', discipline: disciplines[0] || 'Geral', duration: 50, type: 'study', order: 0 },
                            { id: 'p2', discipline: '', duration: 10, type: 'break', order: 1 },
                            { id: 'p3', discipline: disciplines[0] || 'Geral', duration: 30, type: 'practice', order: 2 },
                        ])}
                        className="text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200"
                    >
                        🍅 Pomodoro (50/10/30)
                    </button>
                    <button
                        onClick={() => setBlocks([
                            { id: 'c1', discipline: disciplines[0] || 'A', duration: 40, type: 'study', order: 0 },
                            { id: 'c2', discipline: disciplines[1] || 'B', duration: 40, type: 'study', order: 1 },
                            { id: 'c3', discipline: disciplines[2] || 'C', duration: 40, type: 'study', order: 2 },
                            { id: 'c4', discipline: '', duration: 20, type: 'break', order: 3 },
                            { id: 'c5', discipline: disciplines[0] || 'A', duration: 30, type: 'practice', order: 4 },
                        ])}
                        className="text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200"
                    >
                        🔄 Ciclo Meirelles
                    </button>
                </div>
            </div>
        </div>
    );
};

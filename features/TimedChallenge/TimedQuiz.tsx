import React, { useState, useEffect, useCallback } from 'react';
import { Question } from '../../types';
import { StressIndicator } from './StressIndicator';
import {
    ChallengeConfig,
    ChallengeState,
    ChallengeResult,
    initializeChallenge,
    calculatePressureLevel,
    calculateResults,
    getStressFeedback,
    getDifficultyMultiplier
} from './ChallengeEngine';

interface TimedQuizProps {
    questions: Question[];
    config: ChallengeConfig;
    onComplete: (result: ChallengeResult) => void;
    onCancel: () => void;
}

export const TimedQuiz: React.FC<TimedQuizProps> = ({
    questions,
    config,
    onComplete,
    onCancel
}) => {
    const [state, setState] = useState<ChallengeState>(() =>
        initializeChallenge(questions, config)
    );
    const [timings, setTimings] = useState<number[]>([]);
    const [showResult, setShowResult] = useState(false);

    const multiplier = getDifficultyMultiplier(config.difficulty);
    const totalTimePerQuestion = Math.floor(config.timePerQuestion * multiplier);
    const currentQuestion = questions[state.currentIndex];

    // Timer countdown
    useEffect(() => {
        if (state.isComplete) return;

        const timer = setInterval(() => {
            setState(prev => {
                const newTime = prev.timeRemaining - 1;

                if (newTime <= 0) {
                    // Time's up - auto-advance
                    return handleNextQuestion(prev, null);
                }

                return {
                    ...prev,
                    timeRemaining: newTime,
                    pressureLevel: calculatePressureLevel(newTime, totalTimePerQuestion)
                };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [state.isComplete, state.currentIndex, totalTimePerQuestion]);

    const handleNextQuestion = useCallback((prevState: ChallengeState, answer: number | null): ChallengeState => {
        const timeSpent = totalTimePerQuestion - prevState.timeRemaining;
        setTimings(prev => [...prev, timeSpent]);

        const newAnswers = [...prevState.answers];
        newAnswers[prevState.currentIndex] = answer;

        if (prevState.currentIndex >= questions.length - 1) {
            // Last question - complete
            return {
                ...prevState,
                answers: newAnswers,
                isComplete: true
            };
        }

        // Next question
        return {
            ...prevState,
            answers: newAnswers,
            currentIndex: prevState.currentIndex + 1,
            questionStartTime: Date.now(),
            timeRemaining: totalTimePerQuestion,
            pressureLevel: 0
        };
    }, [questions.length, totalTimePerQuestion]);

    const handleAnswer = (optionIndex: number) => {
        if (state.isComplete) return;
        setState(prev => handleNextQuestion(prev, optionIndex));
    };

    // Show results when complete
    useEffect(() => {
        if (state.isComplete && !showResult) {
            setShowResult(true);
        }
    }, [state.isComplete, showResult]);

    if (showResult) {
        const result = calculateResults(questions, state, timings);
        const feedback = getStressFeedback(result);
        const accuracy = Math.round((result.correct / result.total) * 100);

        return (
            <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-slate-800 mb-4 text-center">
                    🎯 Desafio Concluído!
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-emerald-50 p-4 rounded-xl text-center">
                        <div className="text-3xl font-bold text-emerald-600">{accuracy}%</div>
                        <div className="text-sm text-emerald-700">Precisão</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl text-center">
                        <div className="text-3xl font-bold text-blue-600">{result.averageTimePerQuestion}s</div>
                        <div className="text-sm text-blue-700">Média/Questão</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-xl text-center">
                        <div className="text-3xl font-bold text-orange-600">{result.questionsUnderPressure}</div>
                        <div className="text-sm text-orange-700">Sob Pressão</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl text-center">
                        <div className="text-3xl font-bold text-red-600">{result.timeoutCount}</div>
                        <div className="text-sm text-red-700">Timeouts</div>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl mb-6">
                    <p className="text-slate-700">{feedback}</p>
                </div>

                <button
                    onClick={() => onComplete(result)}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                    Continuar
                </button>
            </div>
        );
    }

    if (!currentQuestion) return null;

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <span className="text-sm text-slate-500">
                        Questão {state.currentIndex + 1} de {questions.length}
                    </span>
                    <div className="text-xs text-slate-400 mt-1">
                        {config.difficulty === 'extreme' ? '🔥 MODO EXTREMO' :
                            config.difficulty === 'pressure' ? '⚡ SOB PRESSÃO' : '📚 Normal'}
                    </div>
                </div>

                {config.showTimer && (
                    <StressIndicator
                        pressureLevel={state.pressureLevel}
                        timeRemaining={state.timeRemaining}
                        totalTime={totalTimePerQuestion}
                    />
                )}
            </div>

            {/* Question */}
            <div className="mb-6">
                <p className="text-lg text-slate-800 font-medium leading-relaxed">
                    {currentQuestion.statement}
                </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        className={`
              w-full p-4 text-left rounded-xl border-2 transition-all duration-200
              ${state.pressureLevel >= 85
                                ? 'border-red-200 hover:border-red-400 hover:bg-red-50'
                                : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50'}
            `}
                    >
                        <span className="font-bold text-slate-500 mr-2">
                            {String.fromCharCode(65 + idx)}.
                        </span>
                        {option}
                    </button>
                ))}
            </div>

            {/* Cancel Button */}
            <button
                onClick={onCancel}
                className="mt-6 text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
                ← Cancelar Desafio
            </button>
        </div>
    );
};

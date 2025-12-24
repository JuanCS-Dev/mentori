/**
 * Challenge Engine - Stress Inoculation Training (SIT)
 * 
 * Based on SIT meta-analyses: Controlled exposure to time pressure
 * reduces test anxiety and improves performance under stress.
 * 
 * "VR Stress Simulation" was MODIFIED to "Timed Challenges with Countdown"
 */

import { Question } from '../../types';

export interface ChallengeConfig {
    totalQuestions: number;
    timePerQuestion: number; // seconds
    difficulty: 'normal' | 'pressure' | 'extreme';
    showTimer: boolean;
}

export interface ChallengeState {
    currentIndex: number;
    answers: (number | null)[];
    startTime: number;
    questionStartTime: number;
    timeRemaining: number;
    pressureLevel: number; // 0-100 (visual stress indicator)
    isComplete: boolean;
}

export interface ChallengeResult {
    correct: number;
    total: number;
    averageTimePerQuestion: number;
    questionsUnderPressure: number; // answered with <20% time left
    timeoutCount: number;
}

/**
 * Calculates pressure level based on remaining time.
 * High pressure = more adrenaline = simulates real exam conditions.
 */
export function calculatePressureLevel(
    timeRemaining: number,
    totalTime: number
): number {
    const ratio = timeRemaining / totalTime;

    if (ratio > 0.5) return 0;       // Calm (>50% time left)
    if (ratio > 0.3) return 30;      // Mild pressure
    if (ratio > 0.2) return 60;      // Moderate pressure
    if (ratio > 0.1) return 85;      // High pressure
    return 100;                       // Critical (red zone)
}

/**
 * Returns difficulty multiplier for time calculation.
 */
export function getDifficultyMultiplier(
    difficulty: ChallengeConfig['difficulty']
): number {
    switch (difficulty) {
        case 'normal': return 1.0;    // Full time
        case 'pressure': return 0.7;  // 70% time (moderate stress)
        case 'extreme': return 0.5;   // 50% time (high stress)
    }
}

/**
 * Creates initial challenge state.
 */
export function initializeChallenge(
    questions: Question[],
    config: ChallengeConfig
): ChallengeState {
    const multiplier = getDifficultyMultiplier(config.difficulty);
    const adjustedTime = Math.floor(config.timePerQuestion * multiplier);

    return {
        currentIndex: 0,
        answers: new Array(questions.length).fill(null),
        startTime: Date.now(),
        questionStartTime: Date.now(),
        timeRemaining: adjustedTime,
        pressureLevel: 0,
        isComplete: false
    };
}

/**
 * Calculates final challenge results.
 */
export function calculateResults(
    questions: Question[],
    state: ChallengeState,
    timings: number[] // time spent per question
): ChallengeResult {
    let correct = 0;
    let underPressure = 0;
    let timeouts = 0;

    questions.forEach((q, i) => {
        const answer = state.answers[i];
        if (answer === null) {
            timeouts++;
        } else if (answer === q.correctAnswer) {
            correct++;
        }

        // Count questions answered with <20% time remaining
        if (timings[i] && timings[i] > 0.8 * 60) { // Assuming 60s base
            underPressure++;
        }
    });

    const avgTime = timings.length > 0
        ? timings.reduce((a, b) => a + b, 0) / timings.length
        : 0;

    return {
        correct,
        total: questions.length,
        averageTimePerQuestion: Math.round(avgTime),
        questionsUnderPressure: underPressure,
        timeoutCount: timeouts
    };
}

/**
 * Generates feedback based on performance under pressure.
 */
export function getStressFeedback(result: ChallengeResult): string {
    const accuracy = (result.correct / result.total) * 100;
    const pressureRatio = result.questionsUnderPressure / result.total;

    if (accuracy >= 80 && pressureRatio < 0.3) {
        return "🏆 Excelente! Você manteve a calma e performou bem sob pressão.";
    }

    if (accuracy >= 60) {
        if (pressureRatio > 0.5) {
            return "⚠️ Boa precisão, mas você está correndo demais. Gerencie melhor seu tempo.";
        }
        return "👍 Bom desempenho. Continue praticando para fortalecer sua resistência.";
    }

    if (result.timeoutCount > result.total * 0.2) {
        return "⏱️ Muitas questões sem resposta. Pratique decisões rápidas (mesmo que erradas é melhor em muitas bancas).";
    }

    return "💪 O estresse atrapalhou. Pratique mais simulados cronometrados para dessensibilizar.";
}

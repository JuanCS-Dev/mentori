/**
 * Calibration Engine
 * 
 * Measures "Metacognitive Intelligence": How well does the student judge their own knowledge?
 * A well-calibrated student knows when they don't know (avoiding negative marks in CESPE).
 */

export interface ConfidenceLog {
    confidence: number; // 0-100
    wasCorrect: boolean;
    timestamp: string;
}

/**
 * Calculates a calibration score (0 to 1).
 * 1.0 = Perfect calibration (100% confidence on correct, 0% on wrong).
 * 0.0 = Complete delusion (100% confidence on wrong).
 */
export function calculateCalibrationScore(logs: ConfidenceLog[]): number {
    if (logs.length === 0) return 0.5; // Neutral start

    const bins = [0, 20, 40, 60, 80, 100];
    let weightedErrorSum = 0;

    // Brier Score component analysis
    // We want to minimize the difference between "Confidence" and "Actual Accuracy"

    for (let i = 0; i < bins.length - 1; i++) {
        const min = bins[i] ?? 0;
        const max = bins[i + 1] ?? 100;

        // Find logs in this confidence bin
        const binLogs = logs.filter(l => l.confidence >= min && l.confidence < max);

        if (binLogs.length > 0) {
            const avgConfidence = binLogs.reduce((acc, l) => acc + l.confidence, 0) / binLogs.length / 100;
            const accuracy = binLogs.filter(l => l.wasCorrect).length / binLogs.length;

            // Error = |Confidence - Accuracy|
            const error = Math.abs(avgConfidence - accuracy);

            // Weight by number of logs in this bin
            weightedErrorSum += error * (binLogs.length / logs.length);
        }
    }

    // Score = 1 - Error (normalize to positive metric)
    return Math.max(0, 1 - weightedErrorSum);
}

export function getCalibrationFeedback(score: number): string {
    if (score > 0.9) return "🎯 Mestre da Metacognição! Você sabe exatamente o que sabe.";
    if (score > 0.8) return "🧠 Ótima calibração. Sua autoavaliação é confiável.";
    if (score > 0.6) return "⚠️ Atenção: Você tende a confiar demais ou de menos.";
    return "🚨 Perigo: 'Ilusão de Competência'. Você acha que sabe, mas está errando muito (Dunning-Kruger).";
}

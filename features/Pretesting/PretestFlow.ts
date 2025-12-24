import { Question } from '../../types';

/**
 * Pretest / Hypercorrection Logic
 * 
 * "Hypercorrection Effect": High-confidence errors are more likely to be corrected
 * and remembered than low-confidence errors.
 */

export interface PretestResult {
    question: Question;
    studentAnswer: number;
    confidence: 'low' | 'medium' | 'high';
    wasCorrect: boolean;
    timestamp: string;
}

/**
 * Sorts questions for review based on Hypercorrection principles.
 * High-confidence errors get absolute PROIRITY.
 */
export function prioritizeReview(results: PretestResult[]): Question[] {
    // 1. Separate errors from correct answers
    const errors = results.filter(r => !r.wasCorrect);
    const correct = results.filter(r => r.wasCorrect);

    // 2. Sort errors: High confidence -> Low confidence
    // "I was sure I knew this!" -> Max surprise -> Max learning opportunity
    const sortedErrors = errors.sort((a, b) => {
        const score = (conf: string) => {
            if (conf === 'high') return 3;
            if (conf === 'medium') return 2;
            return 1;
        };
        return score(b.confidence) - score(a.confidence); // Descending
    });

    // 3. Return sorted questions (errors first)
    return [...sortedErrors, ...correct].map(r => r.question);
}

/**
 * Generates an insight message for the user based on their pretest performance
 */
export function getHypercorrectionInsight(results: PretestResult[]): string {
    const highConfErrors = results.filter(r => !r.wasCorrect && r.confidence === 'high').length;

    if (highConfErrors > 0) {
        return `⚠️ ${highConfErrors} Erros de Alta Confiança detectados! Estes são seus pontos cegos mais perigosos ("Hypercorrection Opportunity"). Revise-os primeiro.`;
    }

    const correctHighConf = results.filter(r => r.wasCorrect && r.confidence === 'high').length;
    if (correctHighConf > 3) {
        return `✅ Excelente calibração! Você está acertando o que confia.`;
    }

    return `💡 Use o feedback imediato para corrigir erros enquanto a memória está fresca.`;
}

/**
 * Elo Rating Engine for ConcursoAI
 * 
 * Based on research: "Elo Rating System in Educational Assessment" (2024)
 * Provides scientific difficulty estimation for students and questions.
 */

export interface EloState {
    rating: number;      // Current rating (default 1000)
    kFactor: number;     // Learning rate / volatility
    matches: number;     // Number of problems attempted
}

export const INITIAL_RATING = 1000;
export const INITIAL_K_FACTOR = 32;
export const MIN_K_FACTOR = 16;
export const STABILIZATION_MATCHES = 30;

/**
 * Calculates the expected probability of winning (answering correctly)
 * based on student rating vs question difficulty.
 * 
 * Formula: P(A) = 1 / (1 + 10^((Rb - Ra) / 400))
 */
export function getExpectedScore(studentRating: number, questionDifficulty: number): number {
    return 1 / (1 + Math.pow(10, (questionDifficulty - studentRating) / 400));
}

/**
 * Updates the student's rating based on the outcome.
 * 
 * @param currentRating Student's current rating
 * @param questionDifficulty Difficulty of the question (Elo)
 * @param actualScore 1 for correct, 0 for incorrect
 * @param kFactor Volatility factor (higher = faster changes)
 */
export function calculateNewRating(
    currentRating: number,
    questionDifficulty: number,
    actualScore: 0 | 1,
    kFactor: number = 32
): number {
    const expectedScore = getExpectedScore(currentRating, questionDifficulty);
    return Math.round(currentRating + kFactor * (actualScore - expectedScore));
}

/**
 * Dynamic K-Factor adjustment.
 * High volatility for new users/topics (fast convergence),
 * lower volatility for established users (stability).
 */
export function getKFactor(matchesPlayed: number): number {
    if (matchesPlayed < STABILIZATION_MATCHES) {
        return INITIAL_K_FACTOR; // 32
    }
    return MIN_K_FACTOR; // 16
}

/**
 * Estimates initial difficulty for a question based on metadata if no Elo exists.
 */
export function estimateInitialDifficulty(
    difficultyLevel: 'Easy' | 'Medium' | 'Hard' | 'Expert'
): number {
    switch (difficultyLevel) {
        case 'Easy': return 800;
        case 'Medium': return 1000;
        case 'Hard': return 1200;
        case 'Expert': return 1400;
        default: return 1000;
    }
}

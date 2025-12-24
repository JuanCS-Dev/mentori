/**
 * Reward System (Variable Ratio Schedule)
 * 
 * Based on behavioral psychology (B.F. Skinner):
 * Unpredictable rewards create higher engagement than fixed rewards.
 */

export interface RewardEvent {
    xp: number;
    bonusType?: 'CRITICAL' | 'STREAK' | 'RANDOM_GIFT';
    message?: string;
}

export const RewardSystem = {
    /**
     * Calculates XP reward with variable probability.
     * - Base XP: Guaranteed
     * - Streak Bonus: Progressive
     * - Random Bonus (30% chance): "Dopamine hit"
     */
    calculateReward(streak: number, isCorrect: boolean): RewardEvent {
        if (!isCorrect) return { xp: 5 }; // Participation award

        const BASE_XP = 10;
        const STREAK_MULTIPLIER = 2;

        // 1. Streak Bonus
        const streakBonus = Math.min(streak * STREAK_MULTIPLIER, 50); // Cap at 50

        // 2. Variable (Random) Bonus - 30% chance
        // "Intermittent Reinforcement"
        let variableBonus = 0;
        let bonusType: RewardEvent['bonusType'] | undefined;
        let message: string | undefined;

        const roll = Math.random();

        if (roll < 0.05) { // 5% chance of SUPER WIN (Rare)
            variableBonus = 100;
            bonusType = 'CRITICAL';
            message = "JACKPOT! 💎💎💎";
        } else if (roll < 0.30) { // 25% chance of small bonus
            variableBonus = Math.floor(Math.random() * 20) + 10;
            bonusType = 'RANDOM_GIFT';
            message = "Bônus Surpresa! 🎁";
        }

        // Streak milestones
        if (streak > 0 && streak % 10 === 0) {
            variableBonus += 50;
            bonusType = 'STREAK';
            message = `🔥 ${streak} ACERTOS SEGUIDOS!`;
        }

        return {
            xp: BASE_XP + streakBonus + variableBonus,
            bonusType,
            message
        };
    }
};

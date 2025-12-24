// import { EloState } from '../features/AdaptiveDifficulty/EloEngine';

/**
 * Service to handle Elo-related operations not directly tied to React state.
 * Currently serves as a facade for the engine and potential future backend sync.
 */
export const EloService = {
    /**
     * Returns the difficulty description based on Elo rating
     */
    getDifficultyLabel(rating: number): 'Iniciante' | 'Intermediário' | 'Avançado' | 'Expert' {
        if (rating < 1200) return 'Iniciante';
        if (rating < 1500) return 'Intermediário';
        if (rating < 1800) return 'Avançado';
        return 'Expert';
    },

    /**
     * Returns the color associated with the difficulty level
     */
    getDifficultyColor(rating: number): string {
        if (rating < 1200) return 'text-green-500';
        if (rating < 1500) return 'text-yellow-500';
        if (rating < 1800) return 'text-orange-500';
        return 'text-red-500';
    }
};

import { useProgress } from '../../hooks/usePersistence';
import { getExpectedScore } from './EloEngine';
import { EloService } from '../../services/eloService';

export function useEloRating() {
    const { progress } = useProgress();
    const userRating = progress.overallElo;

    /**
     * Get the probability (0-1) of answering a question correctly
     * given its difficulty rating.
     */
    const getWinProbability = (questionDifficulty: number) => {
        return getExpectedScore(userRating, questionDifficulty);
    };

    /**
     * Get the current difficulty level label for the user
     */
    const getUserLevelLabel = () => {
        return EloService.getDifficultyLabel(userRating);
    };

    /**
     * Get the color class for the user's current level
     */
    const getUserLevelColor = () => {
        return EloService.getDifficultyColor(userRating);
    };

    return {
        userRating,
        getWinProbability,
        getUserLevelLabel,
        getUserLevelColor
    };
}

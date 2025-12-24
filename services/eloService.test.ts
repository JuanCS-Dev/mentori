import { describe, it, expect } from 'vitest';
import { EloService } from './eloService';

describe('eloService', () => {
    describe('getDifficultyLabel', () => {
        it('should return "Iniciante" for elo < 1200', () => {
            expect(EloService.getDifficultyLabel(800)).toBe('Iniciante');
            expect(EloService.getDifficultyLabel(1100)).toBe('Iniciante');
        });

        it('should return "Intermediário" for elo 1200-1499', () => {
            expect(EloService.getDifficultyLabel(1200)).toBe('Intermediário');
            expect(EloService.getDifficultyLabel(1400)).toBe('Intermediário');
        });

        it('should return "Avançado" for elo 1500-1799', () => {
            expect(EloService.getDifficultyLabel(1500)).toBe('Avançado');
            expect(EloService.getDifficultyLabel(1700)).toBe('Avançado');
        });

        it('should return "Expert" for elo >= 1800', () => {
            expect(EloService.getDifficultyLabel(1800)).toBe('Expert');
            expect(EloService.getDifficultyLabel(2000)).toBe('Expert');
        });
    });

    describe('getDifficultyColor', () => {
        it('should return green color for elo < 1200', () => {
            expect(EloService.getDifficultyColor(800)).toBe('text-green-500');
        });

        it('should return yellow color for elo 1200-1499', () => {
            expect(EloService.getDifficultyColor(1300)).toBe('text-yellow-500');
        });

        it('should return orange color for elo 1500-1799', () => {
            expect(EloService.getDifficultyColor(1600)).toBe('text-orange-500');
        });

        it('should return red color for elo >= 1800', () => {
            expect(EloService.getDifficultyColor(1900)).toBe('text-red-500');
        });
    });
});

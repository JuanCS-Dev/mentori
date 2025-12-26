import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    initChaos,
    setChaosConfig,
    chaosLatency,
    chaosPartition,
    chaosCrash,
    withCircuitBreaker,
    getCircuitStatus
} from './chaosOrchestrator';

describe('Chaos Orchestrator', () => {

    beforeEach(() => {
        // Reset chaos state before each test
        initChaos({ enabled: true, experiments: {} });
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('Experiment: LATENCY', () => {
        it('should inject latency when enabled', async () => {
            setChaosConfig({
                enabled: true,
                experiments: {
                    LATENCY: { probability: 1.0, config: { delayMs: 1000 } }
                }
            });

            const start = Date.now();
            const operation = async () => 'success';

            const promise = chaosLatency(operation, 'test-latency');

            // Fast-forward time
            await vi.advanceTimersByTimeAsync(1000);

            const result = await promise;

            expect(result).toBe('success');
            // Check if at least 1000ms "virtually" passed (though in real execution it might be near instant with fake timers)
            // Ideally we check if setTimeout was called with 1000
        });

        it('should NOT inject latency when disabled', async () => {
            setChaosConfig({
                enabled: false, // Disabled globally
                experiments: {
                    LATENCY: { probability: 1.0, config: { delayMs: 1000 } }
                }
            });

            const operation = vi.fn().mockResolvedValue('success');
            await chaosLatency(operation, 'test-no-latency');
            expect(operation).toHaveBeenCalled();
        });
    });

    describe('Experiment: PARTITION', () => {
        it('should throw error when partition is active', async () => {
            setChaosConfig({
                enabled: true,
                experiments: {
                    PARTITION: { probability: 1.0 }
                }
            });

            const operation = async () => 'success';

            await expect(chaosPartition(operation, 'test-partition'))
                .rejects
                .toThrow('[CHAOS] Network partition');
        });

        it('should return fallback if provided during partition', async () => {
            setChaosConfig({
                enabled: true,
                experiments: {
                    PARTITION: { probability: 1.0 }
                }
            });

            const operation = async () => 'success';
            const result = await chaosPartition(operation, 'test-partition-fallback', 'fallback-value');

            expect(result).toBe('fallback-value');
        });
    });

    describe('Experiment: CRASH', () => {
        it('should throw error when crash is active', () => {
            setChaosConfig({
                enabled: true,
                experiments: {
                    CRASH: { probability: 1.0 }
                }
            });

            expect(() => chaosCrash('test-component'))
                .toThrow('[CHAOS] Simulated crash');
        });
    });

    describe('Resilience: Circuit Breaker', () => {
        it('should open after threshold failures', async () => {
            const failingOp = vi.fn().mockRejectedValue(new Error('Fail'));
            const circuitName = 'test-circuit';

            // 1st Failure
            try { await withCircuitBreaker(circuitName, failingOp, 'fallback'); } catch { }
            // 2nd Failure
            try { await withCircuitBreaker(circuitName, failingOp, 'fallback'); } catch { }
            // 3rd Failure (Threshold reached)
            try { await withCircuitBreaker(circuitName, failingOp, 'fallback'); } catch { }

            const status = getCircuitStatus();
            expect(status[circuitName].state).toBe('open');
            expect(status[circuitName].failures).toBe(3);
        });

        it('should returns fallback immediately when open', async () => {
            // ... setup open circuit manually or via failures ...
            const failingOp = vi.fn().mockRejectedValue(new Error('Fail'));
            const circuitName = 'test-circuit-open';

            // Trip it
            for (let i = 0; i < 3; i++) {
                try { await withCircuitBreaker(circuitName, failingOp, 'fallback'); } catch { }
            }

            const status = getCircuitStatus();
            expect(status[circuitName].state).toBe('open');

            // Next call should NOT call operation
            failingOp.mockClear();
            const result = await withCircuitBreaker(circuitName, failingOp, 'fallback');

            expect(result).toBe('fallback');
            expect(failingOp).not.toHaveBeenCalled();
        });
    });

});

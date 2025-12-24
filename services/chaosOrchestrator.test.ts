import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    initChaos,
    setChaosConfig,
    getChaosStatus,
    withCircuitBreaker,
    recordHealth,
    getHealthStatus,
    getCircuitStatus
} from './chaosOrchestrator';

describe('Chaos Orchestrator', () => {
    beforeEach(() => {
        // Reset to default state
        initChaos({ enabled: false, experiments: {} });
    });

    describe('Configuration', () => {
        it('should initialize with chaos disabled by default', () => {
            const status = getChaosStatus();
            expect(status.enabled).toBe(false);
        });

        it('should allow enabling chaos mode', () => {
            setChaosConfig({ enabled: true });
            const status = getChaosStatus();
            expect(status.enabled).toBe(true);
        });

        it('should allow setting experiments', () => {
            setChaosConfig({
                enabled: true,
                experiments: {
                    LATENCY: { probability: 0.5, config: { delayMs: 1000 } }
                }
            });

            const status = getChaosStatus();
            expect(status.experiments.LATENCY?.probability).toBe(0.5);
        });
    });

    describe('Circuit Breaker', () => {
        it('should return operation result when successful', async () => {
            const operation = vi.fn().mockResolvedValue('success');

            const result = await withCircuitBreaker('test-circuit', operation, 'fallback');

            expect(result).toBe('success');
            expect(operation).toHaveBeenCalled();
        });

        it('should return fallback after threshold failures', async () => {
            const failingOp = vi.fn().mockRejectedValue(new Error('fail'));

            // Trip the circuit (3 failures)
            await withCircuitBreaker('trip-test', failingOp, 'fallback');
            await withCircuitBreaker('trip-test', failingOp, 'fallback');
            await withCircuitBreaker('trip-test', failingOp, 'fallback');

            // Circuit should now be open
            const successOp = vi.fn().mockResolvedValue('success');
            const result = await withCircuitBreaker('trip-test', successOp, 'fallback');

            expect(result).toBe('fallback');
            expect(successOp).not.toHaveBeenCalled(); // Blocked by open circuit
        });

        it('should record health signals', async () => {
            const operation = vi.fn().mockResolvedValue('ok');

            await withCircuitBreaker('health-test', operation, 'fallback');

            const health = getHealthStatus();
            const signal = health.find(h => h.service === 'health-test');

            expect(signal).toBeDefined();
            expect(signal?.status).toBe('healthy');
        });
    });

    describe('Health Signals', () => {
        it('should record and retrieve health signals', () => {
            recordHealth({ service: 'api', status: 'healthy', latency: 100 });
            recordHealth({ service: 'database', status: 'degraded', latency: 5000 });

            const signals = getHealthStatus();

            // Check that our signals are present (other tests may add more)
            expect(signals.find(s => s.service === 'api')?.status).toBe('healthy');
            expect(signals.find(s => s.service === 'database')?.status).toBe('degraded');
        });
    });

    describe('Circuit Status', () => {
        it('should track circuit states', async () => {
            const operation = vi.fn().mockResolvedValue('ok');

            await withCircuitBreaker('status-test', operation, 'fallback');

            const circuits = getCircuitStatus();
            expect(circuits['status-test']).toBeDefined();
            expect(circuits['status-test'].state).toBe('closed');
        });
    });
});

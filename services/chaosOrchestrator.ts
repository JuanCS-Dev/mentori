/**
 * 🌪️ CHAOS ORCHESTRATOR - Resilience Engineering for Mentori
 * 
 * Purpose: Inject controlled failure modes to test system resilience.
 * Enable in development only via VITE_CHAOS_MODE=true
 * 
 * Experiments:
 * - LATENCY: Add artificial delays
 * - PARTITION: Simulate network failures
 * - CRASH: Trigger controlled exceptions
 */

type ChaosExperiment = 'LATENCY' | 'PARTITION' | 'CRASH' | 'CORRUPTION';

interface ChaosConfig {
    enabled: boolean;
    experiments: {
        [K in ChaosExperiment]?: {
            probability: number; // 0-1
            config?: Record<string, number | string>;
        };
    };
}

// Default: Chaos disabled in production
const DEFAULT_CONFIG: ChaosConfig = {
    enabled: false,
    experiments: {}
};

// Global chaos state
let chaosConfig: ChaosConfig = { ...DEFAULT_CONFIG };

/**
 * Initialize Chaos Orchestrator
 * Reads from localStorage or environment
 */
export function initChaos(config?: Partial<ChaosConfig>): void {
    const envEnabled = typeof import.meta !== 'undefined' &&
        import.meta.env?.VITE_CHAOS_MODE === 'true';

    if (config) {
        chaosConfig = { ...DEFAULT_CONFIG, ...config, enabled: config.enabled ?? envEnabled };
    } else {
        // Try to load from localStorage in dev
        try {
            const stored = localStorage.getItem('__mentori_chaos_config');
            if (stored) {
                chaosConfig = JSON.parse(stored);
            }
        } catch {
            chaosConfig = { ...DEFAULT_CONFIG, enabled: envEnabled };
        }
    }

    if (chaosConfig.enabled) {
        console.warn('🌪️ CHAOS MODE ENABLED - This should NOT be in production!');
    }
}

/**
 * Save chaos config to localStorage (dev tools)
 */
export function setChaosConfig(config: Partial<ChaosConfig>): void {
    chaosConfig = { ...chaosConfig, ...config };
    try {
        localStorage.setItem('__mentori_chaos_config', JSON.stringify(chaosConfig));
    } catch {
        // Ignore storage errors
    }
}

/**
 * Get current chaos status
 */
export function getChaosStatus(): ChaosConfig {
    return { ...chaosConfig };
}

/**
 * Check if specific experiment should fire based on probability
 */
function shouldInjectChaos(experiment: ChaosExperiment): boolean {
    if (!chaosConfig.enabled) return false;

    const exp = chaosConfig.experiments[experiment];
    if (!exp) return false;

    return Math.random() < exp.probability;
}

//=============================================================================
// CHAOS EXPERIMENT IMPLEMENTATIONS
//=============================================================================

/**
 * E1: LATENCY INJECTION
 * Adds artificial delay to simulate slow networks
 */
export async function chaosLatency<T>(
    operation: () => Promise<T>,
    operationName: string
): Promise<T> {
    if (shouldInjectChaos('LATENCY')) {
        const delay = chaosConfig.experiments.LATENCY?.config?.delayMs ?? 3000;
        console.warn(`🌪️ [CHAOS] Injecting ${delay}ms latency into ${operationName}`);
        await new Promise(resolve => setTimeout(resolve, Number(delay)));
    }
    return operation();
}

/**
 * E2: NETWORK PARTITION
 * Simulates complete network failure
 */
export async function chaosPartition<T>(
    operation: () => Promise<T>,
    operationName: string,
    fallback?: T
): Promise<T> {
    if (shouldInjectChaos('PARTITION')) {
        console.warn(`🌪️ [CHAOS] Simulating network partition for ${operationName}`);

        if (fallback !== undefined) {
            console.warn(`🌪️ [CHAOS] Using fallback value`);
            return fallback;
        }

        throw new Error(`[CHAOS] Network partition: ${operationName} unreachable`);
    }
    return operation();
}

/**
 * E3: CRASH SIMULATION
 * Throws controlled exceptions to test error boundaries
 */
export function chaosCrash(componentName: string): void {
    if (shouldInjectChaos('CRASH')) {
        console.warn(`🌪️ [CHAOS] Crashing component: ${componentName}`);
        throw new Error(`[CHAOS] Simulated crash in ${componentName}`);
    }
}

/**
 * E4: DATA CORRUPTION
 * Returns corrupted/invalid data to test parsing resilience
 */
export function chaosCorruption<T>(data: T, operationName: string): T {
    if (shouldInjectChaos('CORRUPTION')) {
        console.warn(`🌪️ [CHAOS] Corrupting data for ${operationName}`);

        // Return invalid data structures
        if (typeof data === 'object' && data !== null) {
            return { __chaos_corrupted: true } as unknown as T;
        }
        if (typeof data === 'string') {
            return '{{CHAOS_CORRUPTED_DATA}}' as unknown as T;
        }
        return null as unknown as T;
    }
    return data;
}

//=============================================================================
// OBSERVABILITY: Health Signals
//=============================================================================

export interface HealthSignal {
    service: string;
    status: 'healthy' | 'degraded' | 'failed';
    latency?: number;
    lastError?: string;
    timestamp: number;
}

const healthRegistry: Map<string, HealthSignal> = new Map();

/**
 * Record health signal for a service
 */
export function recordHealth(signal: Omit<HealthSignal, 'timestamp'>): void {
    healthRegistry.set(signal.service, {
        ...signal,
        timestamp: Date.now()
    });
}

/**
 * Get all health signals
 */
export function getHealthStatus(): HealthSignal[] {
    return Array.from(healthRegistry.values());
}

/**
 * Check if system is degraded
 */
export function isSystemDegraded(): boolean {
    const signals = getHealthStatus();
    return signals.some(s => s.status === 'degraded' || s.status === 'failed');
}

//=============================================================================
// SELF-HEALING: Circuit Breaker
//=============================================================================

interface CircuitState {
    failures: number;
    lastFailure: number;
    state: 'closed' | 'open' | 'half-open';
}

const circuits: Map<string, CircuitState> = new Map();

const FAILURE_THRESHOLD = 3;
const RECOVERY_TIMEOUT_MS = 30000;

/**
 * Circuit Breaker wrapper for operations
 * Prevents cascading failures by cutting off failing services
 */
export async function withCircuitBreaker<T>(
    circuitName: string,
    operation: () => Promise<T>,
    fallback: T
): Promise<T> {
    let circuit = circuits.get(circuitName);

    if (!circuit) {
        circuit = { failures: 0, lastFailure: 0, state: 'closed' };
        circuits.set(circuitName, circuit);
    }

    // Check if circuit is open
    if (circuit.state === 'open') {
        const timeSinceFailure = Date.now() - circuit.lastFailure;

        if (timeSinceFailure > RECOVERY_TIMEOUT_MS) {
            circuit.state = 'half-open';
            console.info(`🔌 [CIRCUIT] ${circuitName}: Moving to half-open`);
        } else {
            console.warn(`🔌 [CIRCUIT] ${circuitName}: Open - using fallback`);
            recordHealth({ service: circuitName, status: 'failed' });
            return fallback;
        }
    }

    try {
        const start = Date.now();
        const result = await operation();
        const latency = Date.now() - start;

        // Success: reset circuit
        circuit.failures = 0;
        circuit.state = 'closed';

        recordHealth({
            service: circuitName,
            status: latency > 5000 ? 'degraded' : 'healthy',
            latency
        });

        return result;
    } catch (error) {
        circuit.failures += 1;
        circuit.lastFailure = Date.now();

        if (circuit.failures >= FAILURE_THRESHOLD) {
            circuit.state = 'open';
            console.error(`🔌 [CIRCUIT] ${circuitName}: OPEN after ${circuit.failures} failures`);
        }

        recordHealth({
            service: circuitName,
            status: 'failed',
            lastError: error instanceof Error ? error.message : 'Unknown error'
        });

        // If no fallback provided, re-throw the error
        if (fallback === undefined) {
            throw error;
        }

        console.warn(`🔌 [CIRCUIT] ${circuitName}: Failure (${circuit.failures}/${FAILURE_THRESHOLD}) - using fallback`);
        return fallback;
    }
}

/**
 * Get circuit breaker status for debugging
 */
export function getCircuitStatus(): Record<string, CircuitState> {
    const status: Record<string, CircuitState> = {};
    circuits.forEach((state, name) => {
        status[name] = { ...state };
    });
    return status;
}

/**
 * Reset all circuits to closed state (for testing)
 */
export function resetCircuits(): void {
    circuits.clear();
}

/**
 * Reset health registry (for testing)
 */
export function resetHealthRegistry(): void {
    healthRegistry.clear();
}

//=============================================================================
// DEV TOOLS: Chaos Control Panel (for browser console)
//=============================================================================

if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__mentori_chaos = {
        enable: () => setChaosConfig({ enabled: true }),
        disable: () => setChaosConfig({ enabled: false }),
        status: getChaosStatus,
        health: getHealthStatus,
        circuits: getCircuitStatus,
        setExperiment: (exp: ChaosExperiment, probability: number, config?: Record<string, number>) => {
            setChaosConfig({
                experiments: {
                    ...chaosConfig.experiments,
                    [exp]: { probability, config }
                }
            });
        },
        presets: {
            slowNetwork: () => setChaosConfig({
                enabled: true,
                experiments: { LATENCY: { probability: 0.5, config: { delayMs: 5000 } } }
            }),
            unstableAPI: () => setChaosConfig({
                enabled: true,
                experiments: { PARTITION: { probability: 0.3 } }
            }),
            fullChaos: () => setChaosConfig({
                enabled: true,
                experiments: {
                    LATENCY: { probability: 0.3, config: { delayMs: 3000 } },
                    PARTITION: { probability: 0.2 },
                    CRASH: { probability: 0.1 },
                    CORRUPTION: { probability: 0.1 }
                }
            })
        }
    };
}

// Auto-init on import
initChaos();

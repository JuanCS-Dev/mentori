/**
 * 🛡️ Resilient Service Wrapper
 * 
 * Wraps external service calls with:
 * - Circuit breaker protection
 * - Chaos experiment injection
 * - Health signal recording
 * - Graceful degradation
 */

import {
    withCircuitBreaker,
    chaosLatency,
    chaosPartition,
    chaosCorruption,
    recordHealth
} from './chaosOrchestrator';

export interface ResilientOptions<T> {
    serviceName: string;
    fallback: T;
    timeout?: number;
}

/**
 * Wrap any async operation with resilience patterns
 */
export async function resilientCall<T>(
    operation: () => Promise<T>,
    options: ResilientOptions<T>
): Promise<T> {
    const { serviceName, fallback, timeout = 30000 } = options;

    // Layer 1: Circuit Breaker
    return withCircuitBreaker(
        serviceName,
        async () => {
            // Layer 2: Chaos - Network Partition
            return chaosPartition(
                async () => {
                    // Layer 3: Chaos - Latency
                    return chaosLatency(
                        async () => {
                            // Layer 4: Timeout protection
                            const result = await Promise.race([
                                operation(),
                                new Promise<never>((_, reject) =>
                                    setTimeout(() => reject(new Error(`Timeout: ${serviceName}`)), timeout)
                                )
                            ]);

                            // Layer 5: Chaos - Data Corruption
                            return chaosCorruption(result, serviceName);
                        },
                        serviceName
                    );
                },
                serviceName,
                fallback
            );
        },
        fallback
    );
}

/**
 * Wrap localStorage operations with resilience
 */
export function resilientStorage<T>(
    key: string,
    fallback: T
): {
    get: () => T;
    set: (value: T) => boolean;
    remove: () => boolean;
} {
    return {
        get: () => {
            try {
                const stored = localStorage.getItem(key);
                if (!stored) return fallback;

                const parsed = JSON.parse(stored) as T;
                return chaosCorruption(parsed, `storage:${key}`);
            } catch (error) {
                recordHealth({
                    service: `storage:${key}`,
                    status: 'failed',
                    lastError: error instanceof Error ? error.message : 'Parse error'
                });
                return fallback;
            }
        },

        set: (value: T) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                recordHealth({ service: `storage:${key}`, status: 'healthy' });
                return true;
            } catch (error) {
                recordHealth({
                    service: `storage:${key}`,
                    status: 'failed',
                    lastError: error instanceof Error ? error.message : 'Write error'
                });
                return false;
            }
        },

        remove: () => {
            try {
                localStorage.removeItem(key);
                return true;
            } catch {
                return false;
            }
        }
    };
}

/**
 * Create a resilient API client wrapper
 */
export function createResilientClient<T extends Record<string, (...args: unknown[]) => Promise<unknown>>>(
    client: T,
    serviceName: string,
    fallbacks: Partial<{ [K in keyof T]: ReturnType<T[K]> extends Promise<infer R> ? R : never }>
): T {
    const wrapped = {} as T;

    for (const key of Object.keys(client) as Array<keyof T>) {
        if (typeof client[key] === 'function') {
            (wrapped as Record<keyof T, unknown>)[key] = async (...args: unknown[]) => {
                const fallback = fallbacks[key];

                return resilientCall(
                    () => (client[key] as (...args: unknown[]) => Promise<unknown>)(...args),
                    {
                        serviceName: `${serviceName}.${String(key)}`,
                        fallback: fallback ?? null,
                        timeout: 60000
                    }
                );
            };
        }
    }

    return wrapped;
}

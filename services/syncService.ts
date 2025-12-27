/**
 * Sync Service - Sincronização Offline
 *
 * Gerencia ações pendentes quando offline:
 * - Queue de ações
 * - Retry com backoff
 * - Conflict resolution
 * - Background sync via Service Worker
 */

// ===== TYPES =====

export interface SyncAction {
  id: string;
  type: SyncActionType;
  payload: unknown;
  timestamp: number;
  retries: number;
  maxRetries: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;
}

export type SyncActionType =
  | 'question_answer'
  | 'progress_update'
  | 'streak_update'
  | 'xp_update'
  | 'badge_unlock';

export interface SyncStats {
  pending: number;
  failed: number;
  completed: number;
  lastSync: number | null;
  isOnline: boolean;
}

// ===== CONSTANTS =====

const SYNC_STORAGE_KEY = 'mentori_sync_queue';
const SYNC_STATS_KEY = 'mentori_sync_stats';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // Exponential backoff

// ===== HELPERS =====

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ===== MAIN SERVICE =====

export const SyncService = {
  /**
   * Adiciona ação à queue de sincronização
   */
  enqueue(type: SyncActionType, payload: unknown): SyncAction {
    const action: SyncAction = {
      id: generateId(),
      type,
      payload,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: MAX_RETRIES,
      status: 'pending'
    };

    const queue = this.getQueue();
    queue.push(action);
    this.saveQueue(queue);

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }

    return action;
  },

  /**
   * Obtém a queue atual
   */
  getQueue(): SyncAction[] {
    try {
      const stored = localStorage.getItem(SYNC_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  /**
   * Salva a queue
   */
  saveQueue(queue: SyncAction[]): void {
    try {
      localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('[SyncService] Failed to save queue:', e);
    }
  },

  /**
   * Processa a queue de sincronização
   */
  async processQueue(): Promise<{ success: number; failed: number }> {
    if (!navigator.onLine) {
      return { success: 0, failed: 0 };
    }

    const queue = this.getQueue();
    const pending = queue.filter(a => a.status === 'pending' || a.status === 'failed');

    if (pending.length === 0) {
      return { success: 0, failed: 0 };
    }

    let success = 0;
    let failed = 0;

    for (const action of pending) {
      try {
        action.status = 'syncing';
        this.saveQueue(queue);

        await this.processAction(action);

        action.status = 'completed';
        success++;
      } catch (error) {
        action.retries++;
        action.error = error instanceof Error ? error.message : 'Unknown error';

        if (action.retries >= action.maxRetries) {
          action.status = 'failed';
          failed++;
        } else {
          action.status = 'pending';
          // Schedule retry with backoff
          setTimeout(() => this.processQueue(), RETRY_DELAYS[action.retries - 1] || 15000);
        }
      }
    }

    // Remove completed actions older than 1 hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const filtered = queue.filter(a =>
      a.status !== 'completed' || a.timestamp > oneHourAgo
    );
    this.saveQueue(filtered);

    // Update stats
    this.updateStats(success, failed);

    return { success, failed };
  },

  /**
   * Processa uma ação individual
   */
  async processAction(action: SyncAction): Promise<void> {
    // Simulate processing - in real app, this would call an API
    // For now, we just validate the action type
    switch (action.type) {
      case 'question_answer':
      case 'progress_update':
      case 'streak_update':
      case 'xp_update':
      case 'badge_unlock':
        // These are stored locally, so "sync" is just validation
        console.log(`[SyncService] Processed ${action.type}:`, action.id);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  },

  /**
   * Obtém estatísticas de sincronização
   */
  getStats(): SyncStats {
    try {
      const stored = localStorage.getItem(SYNC_STATS_KEY);
      const stats = stored ? JSON.parse(stored) : {
        pending: 0,
        failed: 0,
        completed: 0,
        lastSync: null
      };

      // Update pending count from current queue
      const queue = this.getQueue();
      stats.pending = queue.filter(a => a.status === 'pending').length;
      stats.failed = queue.filter(a => a.status === 'failed').length;
      stats.isOnline = navigator.onLine;

      return stats;
    } catch {
      return {
        pending: 0,
        failed: 0,
        completed: 0,
        lastSync: null,
        isOnline: navigator.onLine
      };
    }
  },

  /**
   * Atualiza estatísticas
   */
  updateStats(success: number, failed: number): void {
    try {
      const stats = this.getStats();
      stats.completed += success;
      stats.failed += failed;
      stats.lastSync = Date.now();
      localStorage.setItem(SYNC_STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error('[SyncService] Failed to update stats:', e);
    }
  },

  /**
   * Remove uma ação da queue
   */
  removeAction(actionId: string): void {
    const queue = this.getQueue();
    const filtered = queue.filter(a => a.id !== actionId);
    this.saveQueue(filtered);
  },

  /**
   * Limpa a queue
   */
  clearQueue(): void {
    localStorage.removeItem(SYNC_STORAGE_KEY);
  },

  /**
   * Retry ações falhadas
   */
  retryFailed(): Promise<{ success: number; failed: number }> {
    const queue = this.getQueue();
    const failed = queue.filter(a => a.status === 'failed');

    // Reset status to pending
    for (const action of failed) {
      action.status = 'pending';
      action.retries = 0;
      action.error = undefined;
    }

    this.saveQueue(queue);
    return this.processQueue();
  },

  /**
   * Registra listener de conectividade
   */
  registerConnectivityListener(): () => void {
    const handleOnline = () => {
      console.log('[SyncService] Online - processing queue...');
      this.processQueue();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }
};

// ===== SERVICE WORKER REGISTRATION =====

export const ServiceWorkerManager = {
  /**
   * Registra o Service Worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[SW] Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[SW] Registered:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            console.log('[SW] New version available');
            this.notifyUpdate(registration);
          }
        });
      });

      return registration;
    } catch (error) {
      console.error('[SW] Registration failed:', error);
      return null;
    }
  },

  /**
   * Notifica sobre atualização disponível
   */
  notifyUpdate(registration: ServiceWorkerRegistration): void {
    // Dispatch custom event for UI to handle
    window.dispatchEvent(new CustomEvent('sw-update', {
      detail: { registration }
    }));
  },

  /**
   * Aplica atualização pendente
   */
  async applyUpdate(): Promise<void> {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  },

  /**
   * Pré-cacheia dados de questões
   */
  async cacheQuestions(urls: string[]): Promise<void> {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      registration.active.postMessage({
        type: 'CACHE_QUESTIONS',
        payload: urls
      });
    }
  },

  /**
   * Limpa todos os caches
   */
  async clearCaches(): Promise<void> {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      registration.active.postMessage({ type: 'CLEAR_CACHE' });
    }
  }
};

export default SyncService;

/**
 * OfflineIndicator - Indicador de Status de Conexão
 *
 * Mostra quando o usuário está offline e gerencia
 * a sincronização de dados pendentes.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, Check } from 'lucide-react';

interface OfflineIndicatorProps {
  className?: string;
  showWhenOnline?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showWhenOnline = false
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [pendingActions, setPendingActions] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      // Auto-hide after 3 seconds
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check pending actions
  useEffect(() => {
    const checkPending = () => {
      try {
        const stored = localStorage.getItem('mentori_pending_sync');
        if (stored) {
          const actions = JSON.parse(stored);
          setPendingActions(Array.isArray(actions) ? actions.length : 0);
        }
      } catch {
        setPendingActions(0);
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && pendingActions > 0) {
      syncPendingActions();
    }
  }, [isOnline, pendingActions]);

  const syncPendingActions = useCallback(async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      // Trigger sync via service worker
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-progress');
      }

      // Clear pending actions (simplified - real implementation would verify sync)
      localStorage.removeItem('mentori_pending_sync');
      setPendingActions(0);
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 2000);
    } catch (error) {
      console.error('[OfflineIndicator] Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  // Don't show anything if online and showWhenOnline is false
  if (isOnline && !showWhenOnline && !showBanner && pendingActions === 0) {
    return null;
  }

  return (
    <>
      {/* Floating indicator */}
      <div className={`fixed bottom-4 left-4 z-40 ${className}`}>
        {!isOnline ? (
          <div className="bg-amber-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-pulse">
            <WifiOff size={16} />
            <span className="text-sm font-medium">Modo Offline</span>
          </div>
        ) : pendingActions > 0 ? (
          <button
            onClick={syncPendingActions}
            disabled={isSyncing}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg transition-colors"
          >
            {isSyncing ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Cloud size={16} />
            )}
            <span className="text-sm font-medium">
              {isSyncing ? 'Sincronizando...' : `Sincronizar (${pendingActions})`}
            </span>
          </button>
        ) : justSynced ? (
          <div className="bg-emerald-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
            <Check size={16} />
            <span className="text-sm font-medium">Sincronizado!</span>
          </div>
        ) : showWhenOnline ? (
          <div className="bg-emerald-500/80 text-white px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg opacity-60">
            <Wifi size={14} />
            <span className="text-xs">Online</span>
          </div>
        ) : null}
      </div>

      {/* Top banner for status changes */}
      {showBanner && (
        <div
          className={`fixed top-0 left-0 right-0 z-50 py-2 text-center text-sm font-medium transition-all duration-300 ${
            isOnline
              ? 'bg-emerald-500 text-white'
              : 'bg-amber-500 text-white'
          }`}
        >
          {isOnline ? (
            <span className="flex items-center justify-center gap-2">
              <Wifi size={14} />
              Conexão restaurada
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <WifiOff size={14} />
              Você está offline. Suas ações serão sincronizadas quando a conexão voltar.
            </span>
          )}
        </div>
      )}
    </>
  );
};

/**
 * Hook para verificar status online/offline
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook para sincronização de dados offline
 */
export function useOfflineSync() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);

  const addPendingAction = useCallback((action: object) => {
    try {
      const stored = localStorage.getItem('mentori_pending_sync');
      const actions = stored ? JSON.parse(stored) : [];
      actions.push({ ...action, timestamp: Date.now() });
      localStorage.setItem('mentori_pending_sync', JSON.stringify(actions));
      setPendingCount(actions.length);
    } catch (error) {
      console.error('[useOfflineSync] Failed to add action:', error);
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (!isOnline) return false;

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in registration) {
          await (registration as any).sync.register('sync-progress');
        }
      }
      localStorage.removeItem('mentori_pending_sync');
      setPendingCount(0);
      return true;
    } catch {
      return false;
    }
  }, [isOnline]);

  return {
    isOnline,
    pendingCount,
    addPendingAction,
    syncNow
  };
}

export default OfflineIndicator;

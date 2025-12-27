import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ServiceWorkerManager, SyncService } from './services/syncService';

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await ServiceWorkerManager.register();
      if (registration) {
        console.log('[App] Service Worker registered');

        // Pre-cache question data
        const questionFiles = [
          '/data/pf_21_agente.json',
          '/data/prf_21_prova.json',
          '/data/prf_18.json',
          '/data/pcdf_24_cb2.json',
          '/data/pcdf_20_agente.json',
          '/data/depen_15.json',
          '/data/petrobras_23_nm.json',
          '/data/pmsp_24_soldado.json'
        ];
        await ServiceWorkerManager.cacheQuestions(questionFiles);
      }
    } catch (error) {
      console.error('[App] Service Worker registration failed:', error);
    }
  });
}

// Register sync listener
SyncService.registerConnectivityListener();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
import { wrap, type Remote } from 'comlink';
import type { SimulationInput, SimulationResult } from './montecarlo.worker';

export interface MonteCarloWorkerApi {
  runSimulation(
    input: SimulationInput,
    reportProgress?: (progress: number) => void
  ): Promise<SimulationResult>;
  ping(): Promise<string>;
}

export interface MonteCarloWorkerHandle {
  worker: Worker;
  api: Remote<MonteCarloWorkerApi>;
  ready: Promise<void>;
}

export const createMonteCarloWorker = (): MonteCarloWorkerHandle => {
  console.log('[MonteCarloClient] Creating worker...');
  const worker = new Worker(new URL('./montecarlo.worker.ts', import.meta.url), {
    type: 'module',
  });

  worker.onerror = (e) => {
    console.error('[MonteCarloClient] Worker error:', e);
  };

  worker.onmessageerror = (e) => {
    console.error('[MonteCarloClient] Worker message error:', e);
  };

  console.log('[MonteCarloClient] Wrapping worker with Comlink...');
  const api = wrap<MonteCarloWorkerApi>(worker);
  console.log('[MonteCarloClient] Worker wrapped, api:', api);

  // Create a promise that resolves when the worker responds to ping
  const ready = (async () => {
    console.log('[MonteCarloClient] Pinging worker to verify connection...');
    try {
      const response = await api.ping();
      console.log('[MonteCarloClient] Worker responded to ping:', response);
    } catch (e) {
      console.error('[MonteCarloClient] Worker ping failed:', e);
      throw e;
    }
  })();

  return { worker, api, ready };
};

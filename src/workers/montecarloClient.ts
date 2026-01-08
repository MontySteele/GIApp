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
  const worker = new Worker(new URL('./montecarlo.worker.ts', import.meta.url), {
    type: 'module',
  });

  const api = wrap<MonteCarloWorkerApi>(worker);

  // Create a promise that resolves when the worker responds to ping
  const ready = (async () => {
    await api.ping();
  })();

  return { worker, api, ready };
};

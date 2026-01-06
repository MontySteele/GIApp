import { wrap, type Remote } from 'comlink';
import type { SimulationInput, SimulationResult } from './montecarlo.worker';

export interface MonteCarloWorkerApi {
  runSimulation(
    input: SimulationInput,
    reportProgress?: (progress: number) => void
  ): Promise<SimulationResult>;
}

export interface MonteCarloWorkerHandle {
  worker: Worker;
  api: Remote<MonteCarloWorkerApi>;
}

export const createMonteCarloWorker = (): MonteCarloWorkerHandle => {
  const worker = new Worker(new URL('./montecarlo.worker.ts', import.meta.url), {
    type: 'module',
  });

  const api = wrap<MonteCarloWorkerApi>(worker);

  return { worker, api };
};

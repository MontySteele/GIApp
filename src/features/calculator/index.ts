/**
 * Calculator Feature
 *
 * Public API for wish probability calculations
 */

// Pages
export { default as CalculatorPage } from './pages/CalculatorPage';

// Components
export { default as SingleTargetCalculator } from './components/SingleTargetCalculator';
export { MultiTargetCalculator } from './components/MultiTargetCalculator';
export { ReverseCalculator } from './components/ReverseCalculator';
export { default as ProbabilityChart } from './components/ProbabilityChart';

// Domain - Pity Engine
export {
  getPullProbability,
  getFeaturedProbability,
  simulatePull,
  calculateDistribution,
  pullsForProbability,
} from './domain/pityEngine';

// Domain - Analytical Calculator
export {
  calculateSingleTarget,
  calculateRequiredIncome,
  type AnalyticalResult,
} from './domain/analyticalCalc';

// Selectors
export {
  getAvailablePullsFromTracker,
  type AvailablePullsResult,
} from './selectors/availablePulls';

// Repository
export { scenarioRepo } from './repo/scenarioRepo';

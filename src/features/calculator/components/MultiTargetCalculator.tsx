import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { proxy } from 'comlink';
import { useLiveQuery } from 'dexie-react-hooks';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Plus, Download, RotateCcw, Save, FolderOpen, BarChart3 } from 'lucide-react';
import { GACHA_RULES } from '@/lib/constants';
import type { BannerType, CalculatorScenario, CalculatorScenarioTarget } from '@/types';
import type { SimulationInput, SimulationResult } from '@/workers/montecarlo.worker';
import { createMonteCarloWorker, type MonteCarloWorkerHandle } from '@/workers/montecarloClient';
import { getAvailablePullsFromTracker } from '@/features/calculator/selectors/availablePulls';
import { scenarioRepo } from '../repo/scenarioRepo';
import TargetCard, { type Target } from './TargetCard';
import SimulationResults from './SimulationResults';
import { SaveScenarioModal, LoadScenarioModal, CompareScenarioModal } from './ScenarioModals';

// Convert internal Target to CalculatorScenarioTarget
function targetToScenarioTarget(target: Target): CalculatorScenarioTarget {
  return {
    characterName: target.characterName,
    bannerType: target.bannerType,
    constellation: target.constellation,
    pity: target.pity,
    guaranteed: target.guaranteed,
    radiantStreak: target.radiantStreak,
    fatePoints: target.fatePoints,
    useInheritedPity: target.useInheritedPity,
  };
}

// Convert CalculatorScenarioTarget to internal Target
function scenarioTargetToTarget(target: CalculatorScenarioTarget): Target {
  return { ...target, id: crypto.randomUUID() };
}

const STORAGE_KEY = 'multi-target-calculator-state';

interface PersistedState {
  targets: Target[];
  availablePulls: number;
  iterations: number;
}

function loadPersistedState(): PersistedState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as PersistedState) : null;
  } catch {
    return null;
  }
}

function savePersistedState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

function clearPersistedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

export function MultiTargetCalculator() {
  const initialState = useRef(loadPersistedState());
  const [targets, setTargets] = useState<Target[]>(initialState.current?.targets ?? []);
  const [availablePulls, setAvailablePulls] = useState(initialState.current?.availablePulls ?? 0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoadingPulls, setIsLoadingPulls] = useState(false);
  const [progress, setProgress] = useState(0);
  const [iterations, setIterations] = useState(initialState.current?.iterations ?? 5000);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const workerRef = useRef<MonteCarloWorkerHandle | null>(null);

  // Modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [compareScenarios, setCompareScenarios] = useState<CalculatorScenario[]>([]);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const savedScenarios = useLiveQuery(() => scenarioRepo.getAll(), []);

  const getWorker = useCallback(() => {
    if (!workerRef.current) workerRef.current = createMonteCarloWorker();
    return workerRef.current;
  }, []);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.worker.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    savePersistedState({ targets, availablePulls, iterations });
  }, [targets, availablePulls, iterations]);

  const validateTargets = useCallback((targetsToValidate: Target[]): Map<string, string> => {
    const newErrors = new Map<string, string>();
    targetsToValidate.forEach((target) => {
      const bannerRules = GACHA_RULES[target.bannerType];
      if (!bannerRules) return;

      if (target.pity < 0 || target.pity >= bannerRules.hardPity) {
        newErrors.set(`pity-${target.id}`, `Pity must be between 0 and ${bannerRules.hardPity - 1}`);
      }
      if (target.bannerType === 'character' && (target.radiantStreak < 0 || target.radiantStreak > 3)) {
        newErrors.set(`radiant-${target.id}`, 'Radiant streak should be 0-2');
      }
      if (target.bannerType === 'weapon' && (target.fatePoints < 0 || target.fatePoints > 2)) {
        newErrors.set(`fatePoints-${target.id}`, 'Fate points should be 0-2');
      }
      if (target.constellation < 0 || target.constellation > 6) {
        newErrors.set(`constellation-${target.id}`, 'Constellation must be C0-C6');
      }
    });
    return newErrors;
  }, []);

  const handleReset = useCallback(() => {
    setTargets([]);
    setAvailablePulls(0);
    setIterations(5000);
    setResults(null);
    setErrors(new Map());
    clearPersistedState();
  }, []);

  const importAvailablePulls = useCallback(async () => {
    setIsLoadingPulls(true);
    try {
      const result = await getAvailablePullsFromTracker();
      setAvailablePulls(result.availablePulls);
    } catch (error) {
      console.error('Failed to load available pulls:', error);
    } finally {
      setIsLoadingPulls(false);
    }
  }, []);

  const addTarget = useCallback((bannerType: BannerType = 'character') => {
    setTargets((current) => {
      const isFirst = current.length === 0;
      const newTarget: Target = {
        id: crypto.randomUUID(),
        characterName: '',
        bannerType,
        constellation: 0,
        pity: 0,
        guaranteed: false,
        radiantStreak: 0,
        fatePoints: 0,
        useInheritedPity: !isFirst,
      };
      const updated = [...current, newTarget];
      setErrors(validateTargets(updated));
      return updated;
    });
    setResults(null);
  }, [validateTargets]);

  const removeTarget = useCallback((id: string) => {
    setTargets((current) => {
      const updated = current.filter((t) => t.id !== id);
      setErrors(validateTargets(updated));
      return updated;
    });
    setResults(null);
  }, [validateTargets]);

  const updateTarget = useCallback((id: string, updates: Partial<Target>) => {
    setTargets((current) => {
      const updated = current.map((t) => (t.id === id ? { ...t, ...updates } : t));
      setErrors(validateTargets(updated));
      return updated;
    });
    setResults(null);
  }, [validateTargets]);

  const moveTarget = useCallback((index: number, direction: 'up' | 'down') => {
    setTargets((current) => {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= current.length) return current;
      const newTargets = [...current];
      [newTargets[index], newTargets[newIndex]] = [newTargets[newIndex]!, newTargets[index]!];
      return newTargets.map((t, i) => ({ ...t, useInheritedPity: i === 0 ? false : t.useInheritedPity }));
    });
    setResults(null);
  }, []);

  const canCalculate = useMemo(() => targets.length > 0 && errors.size === 0, [targets.length, errors.size]);

  const handleCalculate = useCallback(async () => {
    if (errors.size > 0 || targets.length === 0) return;

    setIsCalculating(true);
    setProgress(0);
    const minimumLoadingDuration = new Promise((resolve) => setTimeout(resolve, 25));

    try {
      const perTargetStates = targets.map((target) => ({
        pity: target.useInheritedPity ? null : target.pity,
        guaranteed: target.useInheritedPity ? null : target.guaranteed,
        radiantStreak: target.useInheritedPity ? null : target.radiantStreak,
        fatePoints: target.useInheritedPity ? null : target.fatePoints,
      }));

      const simulationInput: SimulationInput = {
        targets: targets.map((target, index) => ({
          id: target.id,
          characterKey: target.characterName || `Target ${index + 1}`,
          expectedStartDate: new Date().toISOString(),
          expectedEndDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 1,
          maxPullBudget: null,
          isConfirmed: true,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          bannerType: target.bannerType,
          copiesNeeded: target.constellation + 1,
        })),
        startingPity: targets[0]?.pity ?? 0,
        startingGuaranteed: targets[0]?.guaranteed ?? false,
        startingRadiantStreak: targets[0]?.radiantStreak ?? 0,
        startingFatePoints: targets[0]?.fatePoints ?? 0,
        startingPulls: availablePulls,
        incomePerDay: 0,
        config: { iterations, seed: Date.now(), chunkSize: 500 },
        perTargetStates,
      };

      const worker = getWorker();
      await worker.ready;
      const result = await worker.api.runSimulation(
        simulationInput,
        proxy((value: number) => { if (isMountedRef.current) setProgress(value); })
      );
      if (isMountedRef.current) setResults(result);
    } catch (error) {
      console.error('Simulation error:', error);
      alert(`Simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      await minimumLoadingDuration;
      if (isMountedRef.current) setIsCalculating(false);
    }
  }, [targets, availablePulls, iterations, errors.size, getWorker]);

  const handleSaveScenario = useCallback(async () => {
    if (!scenarioName.trim() || targets.length === 0) return;
    setIsSaving(true);
    try {
      await scenarioRepo.saveScenario(
        scenarioName.trim(),
        targets.map(targetToScenarioTarget),
        availablePulls,
        iterations,
        results?.allMustHavesProbability
      );
      setShowSaveModal(false);
      setScenarioName('');
    } catch (error) {
      console.error('Failed to save scenario:', error);
    } finally {
      setIsSaving(false);
    }
  }, [scenarioName, targets, availablePulls, iterations, results]);

  const handleLoadScenario = useCallback((scenario: CalculatorScenario) => {
    setTargets(scenario.targets.map(scenarioTargetToTarget));
    setAvailablePulls(scenario.availablePulls);
    setIterations(scenario.iterations);
    setResults(null);
    setShowLoadModal(false);
  }, []);

  const handleDeleteScenario = useCallback(async (id: string) => {
    try {
      await scenarioRepo.delete(id);
      setCompareScenarios((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Failed to delete scenario:', error);
    }
  }, []);

  const toggleCompareScenario = useCallback((scenario: CalculatorScenario) => {
    setCompareScenarios((prev) => {
      const exists = prev.find((s) => s.id === scenario.id);
      return exists ? prev.filter((s) => s.id !== scenario.id) : [...prev, scenario];
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Multi-Target Planner</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowLoadModal(true)}
            disabled={!savedScenarios || savedScenarios.length === 0} title="Load scenario">
            <FolderOpen className="w-4 h-4 mr-1" />Load
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowSaveModal(true)}
            disabled={targets.length === 0} title="Save scenario">
            <Save className="w-4 h-4 mr-1" />Save
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowCompareModal(true)}
            disabled={!savedScenarios || savedScenarios.length < 2} title="Compare scenarios">
            <BarChart3 className="w-4 h-4 mr-1" />Compare
          </Button>
          <Button size="sm" variant="ghost" onClick={handleReset}
            disabled={targets.length === 0 && availablePulls === 0} title="Reset all settings">
            <RotateCcw className="w-4 h-4 mr-1" />Reset
          </Button>
        </div>
      </div>

      {/* Simulation Settings */}
      <Card>
        <CardHeader><h3 className="font-semibold">Simulation Settings</h3></CardHeader>
        <CardContent className="space-y-2">
          <Select label="Simulation Count" value={String(iterations)}
            onChange={(e) => setIterations(Number(e.target.value))}
            options={[
              { value: '5000', label: '5,000 (fast)' },
              { value: '20000', label: '20,000 (balanced)' },
              { value: '100000', label: '100,000 (slow, more accurate)' },
            ]}
          />
          <p className="text-sm text-amber-300">
            Higher iterations improve accuracy but can take longer to run.
          </p>
        </CardContent>
      </Card>

      {/* Empty State */}
      {targets.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            <p className="mb-4">Add characters you want to pull for to get started</p>
          </CardContent>
        </Card>
      )}

      {/* Target Cards */}
      {targets.length > 0 && (
        <div className="space-y-4">
          {targets.map((target, index) => (
            <TargetCard
              key={target.id}
              target={target}
              index={index}
              totalTargets={targets.length}
              errors={errors}
              onUpdate={updateTarget}
              onRemove={removeTarget}
              onMoveUp={(i) => moveTarget(i, 'up')}
              onMoveDown={(i) => moveTarget(i, 'down')}
            />
          ))}
        </div>
      )}

      {/* Add Target Buttons */}
      <div className="flex gap-2">
        <Button onClick={() => addTarget('character')} variant={targets.length === 0 ? 'primary' : 'secondary'} className="flex-1">
          <Plus className="w-4 h-4 mr-2" />Add Character
        </Button>
        <Button onClick={() => addTarget('weapon')} variant="secondary" className="flex-1">
          <Plus className="w-4 h-4 mr-2" />Add Weapon
        </Button>
      </div>

      {/* Available Resources */}
      <Card>
        <CardHeader><h3 className="font-semibold">Available Resources</h3></CardHeader>
        <CardContent className="space-y-3">
          <Input label="Available Pulls" type="number" value={availablePulls}
            onChange={(e) => setAvailablePulls(Number(e.target.value))} min={0} />
          <Button size="sm" variant="secondary" onClick={importAvailablePulls}
            disabled={isLoadingPulls} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            {isLoadingPulls ? 'Loading...' : 'Import from Tracker'}
          </Button>
          <p className="text-xs text-slate-400">
            Imports your current primogems and fates from the resource tracker.
          </p>
        </CardContent>
      </Card>

      {/* Calculate Button */}
      <div className="space-y-2">
        <Button onClick={handleCalculate} disabled={!canCalculate} className="w-full" variant="primary">
          {isCalculating ? 'Working…' : 'Calculate'}
        </Button>
        {isCalculating && (
          <div className="text-sm text-center text-slate-300">{(progress * 100).toFixed(0)}% complete</div>
        )}
      </div>

      {/* Results */}
      {results && <SimulationResults results={results} />}

      {/* Modals */}
      <SaveScenarioModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        scenarioName={scenarioName}
        onScenarioNameChange={setScenarioName}
        targets={targets}
        availablePulls={availablePulls}
        results={results}
        isSaving={isSaving}
        onSave={handleSaveScenario}
      />
      <LoadScenarioModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        scenarios={savedScenarios}
        onLoad={handleLoadScenario}
        onDelete={handleDeleteScenario}
      />
      <CompareScenarioModal
        isOpen={showCompareModal}
        onClose={() => { setShowCompareModal(false); setCompareScenarios([]); }}
        scenarios={savedScenarios}
        selectedScenarios={compareScenarios}
        onToggleScenario={toggleCompareScenario}
      />
    </div>
  );
}

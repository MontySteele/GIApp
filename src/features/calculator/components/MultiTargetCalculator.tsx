import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { proxy } from 'comlink';
import { useLiveQuery } from 'dexie-react-hooks';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ChevronUp, ChevronDown, Trash2, Plus, Download, RotateCcw, Save, FolderOpen, BarChart3 } from 'lucide-react';
import { GACHA_RULES } from '@/lib/constants';
import type { BannerType, CalculatorScenario, CalculatorScenarioTarget } from '@/types';
import type { SimulationInput, SimulationResult } from '@/workers/montecarlo.worker';
import { createMonteCarloWorker, type MonteCarloWorkerHandle } from '@/workers/montecarloClient';
import { getAvailablePullsFromTracker } from '@/features/calculator/selectors/availablePulls';
import { scenarioRepo } from '../repo/scenarioRepo';

interface Target {
  id: string;
  characterName: string;
  bannerType: BannerType;
  constellation: number; // 0-6, how many copies (C0 = 1 copy, C6 = 7 copies)
  pity: number;
  guaranteed: boolean;
  radiantStreak: number;
  fatePoints: number; // For weapon banner
  useInheritedPity: boolean; // If true, inherit pity from previous target's simulation result
}

// Convert internal Target to CalculatorScenarioTarget (without id)
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

// Convert CalculatorScenarioTarget to internal Target (add id)
function scenarioTargetToTarget(target: CalculatorScenarioTarget): Target {
  return {
    ...target,
    id: crypto.randomUUID(),
  };
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
    if (stored) {
      return JSON.parse(stored) as PersistedState;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function savePersistedState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

function clearPersistedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function MultiTargetCalculator() {
  // Load initial state from localStorage
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

  // Scenario management state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [compareScenarios, setCompareScenarios] = useState<CalculatorScenario[]>([]);

  // Load saved scenarios from database
  const savedScenarios = useLiveQuery(() => scenarioRepo.getAll(), []);

  // Lazy worker initialization - only create once
  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = createMonteCarloWorker();
    }
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

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    savePersistedState({ targets, availablePulls, iterations });
  }, [targets, availablePulls, iterations]);

  // Memoize validation function
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

  // Reset all state to defaults
  const handleReset = useCallback(() => {
    setTargets([]);
    setAvailablePulls(0);
    setIterations(5000);
    setResults(null);
    setErrors(new Map());
    clearPersistedState();
  }, []);

  // Import available pulls from tracked resources
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
    setTargets((currentTargets) => {
      const isFirstTarget = currentTargets.length === 0;
      const newTarget: Target = {
        id: crypto.randomUUID(),
        characterName: '',
        bannerType,
        constellation: 0,
        pity: 0,
        guaranteed: false,
        radiantStreak: 0,
        fatePoints: 0,
        useInheritedPity: !isFirstTarget,
      };
      const updatedTargets = [...currentTargets, newTarget];
      setErrors(validateTargets(updatedTargets));
      return updatedTargets;
    });
    setResults(null);
  }, [validateTargets]);

  const removeTarget = useCallback((id: string) => {
    setTargets((currentTargets) => {
      const updatedTargets = currentTargets.filter((t) => t.id !== id);
      setErrors(validateTargets(updatedTargets));
      return updatedTargets;
    });
    setResults(null);
  }, [validateTargets]);

  const updateTarget = useCallback((id: string, updates: Partial<Target>) => {
    setTargets((currentTargets) => {
      const updatedTargets = currentTargets.map((t) => (t.id === id ? { ...t, ...updates } : t));
      setErrors(validateTargets(updatedTargets));
      return updatedTargets;
    });
    setResults(null);
  }, [validateTargets]);

  const moveTargetUp = useCallback((index: number) => {
    if (index === 0) return;
    setTargets((currentTargets) => {
      const newTargets = [...currentTargets];
      const current = newTargets[index];
      const prev = newTargets[index - 1];
      if (current && prev) {
        newTargets[index - 1] = current;
        newTargets[index] = prev;
      }
      return newTargets.map((t, i) => ({
        ...t,
        useInheritedPity: i === 0 ? false : t.useInheritedPity,
      }));
    });
    setResults(null);
  }, []);

  const moveTargetDown = useCallback((index: number) => {
    setTargets((currentTargets) => {
      if (index === currentTargets.length - 1) return currentTargets;
      const newTargets = [...currentTargets];
      const current = newTargets[index];
      const next = newTargets[index + 1];
      if (current && next) {
        newTargets[index] = next;
        newTargets[index + 1] = current;
      }
      return newTargets.map((t, i) => ({
        ...t,
        useInheritedPity: i === 0 ? false : t.useInheritedPity,
      }));
    });
    setResults(null);
  }, []);

  // Validate and update errors
  const validate = useCallback((): boolean => {
    const newErrors = validateTargets(targets);
    setErrors(newErrors);
    return newErrors.size === 0 && targets.length > 0;
  }, [targets, validateTargets]);

  // Memoize whether form is valid
  const canCalculate = useMemo(() => {
    return targets.length > 0 && errors.size === 0;
  }, [targets.length, errors.size]);

  const handleCalculate = useCallback(async () => {
    if (!validate()) return;

    setIsCalculating(true);
    setProgress(0);

    const minimumLoadingDuration = new Promise((resolve) => setTimeout(resolve, 25));

    try {
      // Build per-target pity states for more accurate simulation
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
          // Extended fields for multi-banner support
          bannerType: target.bannerType,
          copiesNeeded: target.constellation + 1, // C0 = 1, C1 = 2, ..., C6 = 7
        })),
        startingPity: targets[0]?.pity ?? 0,
        startingGuaranteed: targets[0]?.guaranteed ?? false,
        startingRadiantStreak: targets[0]?.radiantStreak ?? 0,
        startingFatePoints: targets[0]?.fatePoints ?? 0,
        startingPulls: availablePulls,
        incomePerDay: 0,
        config: {
          iterations,
          seed: Date.now(),
          chunkSize: 500,
        },
        perTargetStates,
      };

      const worker = getWorker();
      await worker.ready;
      const result = await worker.api.runSimulation(
        simulationInput,
        proxy((value: number) => setProgress(value))
      );
      setResults(result);
    } catch (error) {
      console.error('Simulation error:', error);
      // Show user-visible error
      alert(`Simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Ensure the loading state is visible for at least a brief moment
      await minimumLoadingDuration;
      setIsCalculating(false);
    }
  }, [validate, targets, availablePulls, iterations, getWorker]);

  // Scenario management handlers
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
      if (exists) {
        return prev.filter((s) => s.id !== scenario.id);
      }
      return [...prev, scenario];
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Multi-Target Planner</h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowLoadModal(true)}
            disabled={!savedScenarios || savedScenarios.length === 0}
            title="Load scenario"
          >
            <FolderOpen className="w-4 h-4 mr-1" />
            Load
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowSaveModal(true)}
            disabled={targets.length === 0}
            title="Save scenario"
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowCompareModal(true)}
            disabled={!savedScenarios || savedScenarios.length < 2}
            title="Compare scenarios"
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            Compare
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            disabled={targets.length === 0 && availablePulls === 0}
            title="Reset all settings"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold">Simulation Settings</h3>
        </CardHeader>
        <CardContent className="space-y-2">
          <Select
            label="Simulation Count"
            value={String(iterations)}
            onChange={(e) => setIterations(Number(e.target.value))}
            options={[
              { value: '5000', label: '5,000 (fast)' },
              { value: '20000', label: '20,000 (balanced)' },
              { value: '100000', label: '100,000 (slow, more accurate)' },
            ]}
          />
          <p className="text-sm text-amber-300">
            Higher iterations improve accuracy but can take longer to run. 100k may feel slow on
            some devices.
          </p>
        </CardContent>
      </Card>

      {targets.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            <p className="mb-4">Add characters you want to pull for to get started</p>
          </CardContent>
        </Card>
      )}

      {targets.length > 0 && (
        <div className="space-y-4">
          {targets.map((target, index) => (
            <Card key={target.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    Target {index + 1}
                    <span className="ml-2 text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                      {target.bannerType === 'character' ? 'Character' : target.bannerType === 'weapon' ? 'Weapon' : 'Standard'}
                    </span>
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveTargetUp(index)}
                      disabled={index === 0}
                      aria-label="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveTargetDown(index)}
                      disabled={index === targets.length - 1}
                      aria-label="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => removeTarget(target.id)}
                      aria-label="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label={target.bannerType === 'weapon' ? 'Weapon Name' : 'Character Name'}
                      value={target.characterName}
                      onChange={(e) => updateTarget(target.id, { characterName: e.target.value })}
                      placeholder={target.bannerType === 'weapon' ? 'Weapon name' : 'Character name'}
                    />
                    <Select
                      label={target.bannerType === 'weapon' ? 'Refinement' : 'Constellation'}
                      value={String(target.constellation)}
                      onChange={(e) => updateTarget(target.id, { constellation: Number(e.target.value) })}
                      options={
                        target.bannerType === 'weapon'
                          ? [
                              { value: '0', label: 'R1 (1 copy)' },
                              { value: '1', label: 'R2 (2 copies)' },
                              { value: '2', label: 'R3 (3 copies)' },
                              { value: '3', label: 'R4 (4 copies)' },
                              { value: '4', label: 'R5 (5 copies)' },
                            ]
                          : [
                              { value: '0', label: 'C0 (1 copy)' },
                              { value: '1', label: 'C1 (2 copies)' },
                              { value: '2', label: 'C2 (3 copies)' },
                              { value: '3', label: 'C3 (4 copies)' },
                              { value: '4', label: 'C4 (5 copies)' },
                              { value: '5', label: 'C5 (6 copies)' },
                              { value: '6', label: 'C6 (7 copies)' },
                            ]
                      }
                      error={errors.get(`constellation-${target.id}`)}
                    />
                  </div>

                  {/* First target always shows pity inputs; subsequent targets have inherit option */}
                  {index === 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Current Pity"
                        type="number"
                        value={target.pity}
                        onChange={(e) =>
                          updateTarget(target.id, { pity: Number(e.target.value) })
                        }
                        error={errors.get(`pity-${target.id}`)}
                        min={0}
                        max={target.bannerType === 'weapon' ? 79 : 89}
                      />
                      {target.bannerType === 'character' ? (
                        <Input
                          label="Radiant Streak"
                          type="number"
                          value={target.radiantStreak}
                          onChange={(e) =>
                            updateTarget(target.id, { radiantStreak: Number(e.target.value) })
                          }
                          error={errors.get(`radiant-${target.id}`)}
                          min={0}
                          max={3}
                        />
                      ) : target.bannerType === 'weapon' ? (
                        <Input
                          label="Fate Points"
                          type="number"
                          value={target.fatePoints}
                          onChange={(e) =>
                            updateTarget(target.id, { fatePoints: Number(e.target.value) })
                          }
                          error={errors.get(`fatePoints-${target.id}`)}
                          min={0}
                          max={2}
                        />
                      ) : null}
                      <div className="flex items-center gap-2 col-span-2">
                        <input
                          type="checkbox"
                          id={`guaranteed-${target.id}`}
                          checked={target.guaranteed}
                          onChange={(e) =>
                            updateTarget(target.id, { guaranteed: e.target.checked })
                          }
                          className="rounded"
                        />
                        <label htmlFor={`guaranteed-${target.id}`}>Guaranteed 5★</label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`inherit-${target.id}`}
                          checked={target.useInheritedPity}
                          onChange={(e) =>
                            updateTarget(target.id, { useInheritedPity: e.target.checked })
                          }
                          className="rounded"
                        />
                        <label htmlFor={`inherit-${target.id}`} className="text-sm">
                          Inherit pity from previous target&apos;s pulls
                        </label>
                      </div>

                      {target.useInheritedPity ? (
                        <p className="text-sm text-slate-400 pl-6">
                          Pity state will carry over from simulation results of previous target(s)
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-slate-700">
                          <Input
                            label="Starting Pity"
                            type="number"
                            value={target.pity}
                            onChange={(e) =>
                              updateTarget(target.id, { pity: Number(e.target.value) })
                            }
                            error={errors.get(`pity-${target.id}`)}
                            min={0}
                            max={target.bannerType === 'weapon' ? 79 : 89}
                          />
                          {target.bannerType === 'character' ? (
                            <Input
                              label="Radiant Streak"
                              type="number"
                              value={target.radiantStreak}
                              onChange={(e) =>
                                updateTarget(target.id, { radiantStreak: Number(e.target.value) })
                              }
                              error={errors.get(`radiant-${target.id}`)}
                              min={0}
                              max={3}
                            />
                          ) : target.bannerType === 'weapon' ? (
                            <Input
                              label="Fate Points"
                              type="number"
                              value={target.fatePoints}
                              onChange={(e) =>
                                updateTarget(target.id, { fatePoints: Number(e.target.value) })
                              }
                              error={errors.get(`fatePoints-${target.id}`)}
                              min={0}
                              max={2}
                            />
                          ) : null}
                          <div className="flex items-center gap-2 col-span-2">
                            <input
                              type="checkbox"
                              id={`guaranteed-${target.id}`}
                              checked={target.guaranteed}
                              onChange={(e) =>
                                updateTarget(target.id, { guaranteed: e.target.checked })
                              }
                              className="rounded"
                            />
                            <label htmlFor={`guaranteed-${target.id}`}>Guaranteed 5★</label>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={() => addTarget('character')}
          variant={targets.length === 0 ? 'primary' : 'secondary'}
          className="flex-1"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Character
        </Button>
        <Button
          onClick={() => addTarget('weapon')}
          variant="secondary"
          className="flex-1"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Weapon
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold">Available Resources</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            label="Available Pulls"
            type="number"
            value={availablePulls}
            onChange={(e) => setAvailablePulls(Number(e.target.value))}
            min={0}
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={importAvailablePulls}
            disabled={isLoadingPulls}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            {isLoadingPulls ? 'Loading...' : 'Import from Tracker'}
          </Button>
          <p className="text-xs text-slate-400">
            Imports your current primogems and fates from the resource tracker.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Button
          onClick={handleCalculate}
          disabled={!canCalculate}
          className="w-full"
          variant="primary"
        >
          {isCalculating ? 'Working…' : 'Calculate'}
        </Button>
        {isCalculating && (
          <div className="text-sm text-center text-slate-300">{(progress * 100).toFixed(0)}% complete</div>
        )}
      </div>

      {results && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Results</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-slate-400 mb-1">Probability of Getting All Targets</div>
              <div className="text-3xl font-bold text-primary-400">
                {(results.allMustHavesProbability * 100).toFixed(1)}%
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-300">Per-Target Breakdown</div>

              {/* Nothing result - probability of getting zero copies from all targets */}
              <div className="p-4 bg-slate-900 border border-slate-600 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-slate-300">Nothing</div>
                  <div className="text-2xl font-bold text-slate-400">
                    {(results.nothingProbability * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Probability of not getting any target
                </div>
              </div>

              {/* Per-character constellation breakdown */}
              {results.perCharacter.map((char, charIndex) => (
                <div key={`${char.characterKey}-${charIndex}`} className="space-y-2">
                  <div className="text-sm font-medium text-slate-200 px-1">
                    {char.characterKey || `Target ${charIndex + 1}`}
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                      {char.bannerType === 'weapon' ? 'Weapon' : 'Character'}
                    </span>
                  </div>
                  {char.constellations.map((cons) => (
                    <div
                      key={`${char.characterKey}-${cons.label}`}
                      className="p-3 bg-slate-800 border border-slate-700 rounded-lg ml-2"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-slate-100">{cons.label}</div>
                        <div
                          className={`text-lg font-bold ${
                            cons.probability >= 0.8
                              ? 'text-green-400'
                              : cons.probability >= 0.5
                                ? 'text-yellow-400'
                                : cons.probability >= 0.2
                                  ? 'text-orange-400'
                                  : 'text-red-400'
                          }`}
                        >
                          {(cons.probability * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-slate-400">Avg Pulls</div>
                          <div className="font-semibold text-slate-100">
                            {cons.averagePullsUsed > 0 ? cons.averagePullsUsed.toFixed(0) : '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Median</div>
                          <div className="font-semibold text-slate-100">
                            {cons.medianPullsUsed > 0 ? cons.medianPullsUsed : '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Scenario Modal */}
      <Modal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} title="Save Scenario" size="sm">
        <div className="space-y-4">
          <Input
            label="Scenario Name"
            placeholder="e.g., Furina + Neuvillette plan"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            autoFocus
          />
          <div className="text-sm text-slate-400">
            <p>{targets.length} target(s), {availablePulls} pulls available</p>
            {results && <p>Last result: {(results.allMustHavesProbability * 100).toFixed(1)}% success</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowSaveModal(false)}>Cancel</Button>
            <Button onClick={handleSaveScenario} loading={isSaving} disabled={!scenarioName.trim()}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Load Scenario Modal */}
      <Modal isOpen={showLoadModal} onClose={() => setShowLoadModal(false)} title="Load Scenario" size="md">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {savedScenarios?.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No saved scenarios yet.</p>
          ) : (
            savedScenarios?.map((scenario) => (
              <div
                key={scenario.id}
                className="p-3 bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-100 truncate">{scenario.name}</h4>
                    <div className="text-sm text-slate-400 mt-1">
                      <span>{scenario.targets.length} target(s)</span>
                      <span className="mx-2">•</span>
                      <span>{scenario.availablePulls} pulls</span>
                      {scenario.resultProbability !== undefined && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="text-primary-400">{(scenario.resultProbability * 100).toFixed(1)}%</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {scenario.targets.map((t) => t.characterName || 'Unnamed').join(', ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="primary" onClick={() => handleLoadScenario(scenario)}>
                      Load
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteScenario(scenario.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Compare Scenarios Modal */}
      <Modal isOpen={showCompareModal} onClose={() => { setShowCompareModal(false); setCompareScenarios([]); }} title="Compare Scenarios" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Select scenarios to compare side by side.</p>

          {/* Scenario Selection */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {savedScenarios?.map((scenario) => {
              const isSelected = compareScenarios.some((s) => s.id === scenario.id);
              return (
                <button
                  key={scenario.id}
                  onClick={() => toggleCompareScenario(scenario)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? 'bg-primary-600/20 border-primary-500'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-100">{scenario.name}</span>
                      <span className="ml-2 text-sm text-slate-400">
                        ({scenario.targets.length} targets, {scenario.availablePulls} pulls)
                      </span>
                    </div>
                    {scenario.resultProbability !== undefined && (
                      <span className="text-primary-400 font-semibold">
                        {(scenario.resultProbability * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Comparison Table */}
          {compareScenarios.length >= 2 && (
            <div className="mt-4 border border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="p-2 text-left text-slate-300">Scenario</th>
                    <th className="p-2 text-right text-slate-300">Pulls</th>
                    <th className="p-2 text-right text-slate-300">Targets</th>
                    <th className="p-2 text-right text-slate-300">Probability</th>
                  </tr>
                </thead>
                <tbody>
                  {compareScenarios.map((scenario, idx) => (
                    <tr key={scenario.id} className={idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/50'}>
                      <td className="p-2 font-medium text-slate-100">{scenario.name}</td>
                      <td className="p-2 text-right text-slate-300">{scenario.availablePulls}</td>
                      <td className="p-2 text-right text-slate-300">{scenario.targets.length}</td>
                      <td className="p-2 text-right">
                        {scenario.resultProbability !== undefined ? (
                          <span className={
                            scenario.resultProbability >= 0.8 ? 'text-green-400' :
                            scenario.resultProbability >= 0.5 ? 'text-yellow-400' :
                            'text-red-400'
                          }>
                            {(scenario.resultProbability * 100).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {compareScenarios.length < 2 && (
            <p className="text-sm text-slate-500 text-center py-2">
              Select at least 2 scenarios to compare.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}

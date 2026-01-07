import { useCallback, useEffect, useRef, useState } from 'react';
import { proxy } from 'comlink';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ChevronUp, ChevronDown, Trash2, Plus, Download } from 'lucide-react';
import { GACHA_RULES } from '@/lib/constants';
import type { BannerType } from '@/types';
import type { SimulationInput, SimulationResult } from '@/workers/montecarlo.worker';
import { createMonteCarloWorker, type MonteCarloWorkerHandle } from '@/workers/montecarloClient';
import { getAvailablePullsFromTracker } from '@/features/calculator/selectors/availablePulls';

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

export function MultiTargetCalculator() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [availablePulls, setAvailablePulls] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoadingPulls, setIsLoadingPulls] = useState(false);
  const [progress, setProgress] = useState(0);
  const [iterations, setIterations] = useState(5000);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const workerRef = useRef<MonteCarloWorkerHandle | null>(null);

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

  // Import available pulls from tracked resources
  const importAvailablePulls = async () => {
    setIsLoadingPulls(true);
    try {
      const result = await getAvailablePullsFromTracker();
      setAvailablePulls(result.availablePulls);
    } catch (error) {
      console.error('Failed to load available pulls:', error);
    } finally {
      setIsLoadingPulls(false);
    }
  };

  const addTarget = (bannerType: BannerType = 'character') => {
    const isFirstTarget = targets.length === 0;
    const newTarget: Target = {
      id: crypto.randomUUID(),
      characterName: '',
      bannerType,
      constellation: 0, // C0 = 1 copy
      pity: 0,
      guaranteed: false,
      radiantStreak: 0,
      fatePoints: 0,
      useInheritedPity: !isFirstTarget, // First target uses specified pity, others inherit
    };
    setTargets([...targets, newTarget]);
    setErrors(validateTargets([...targets, newTarget]));
    setResults(null); // Clear results when adding target
  };

  const removeTarget = (id: string) => {
    const updatedTargets = targets.filter((t) => t.id !== id);
    setTargets(updatedTargets);
    setErrors(validateTargets(updatedTargets));
    setResults(null); // Clear results when removing target
  };

  const validateTargets = (targetsToValidate: Target[]): Map<string, string> => {
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
  };

  const updateTarget = (id: string, updates: Partial<Target>) => {
    const updatedTargets = targets.map((t) => (t.id === id ? { ...t, ...updates } : t));
    setTargets(updatedTargets);
    setErrors(validateTargets(updatedTargets));
    setResults(null); // Clear results when updating target
  };

  const moveTargetUp = (index: number) => {
    if (index === 0) return;
    const newTargets = [...targets];
    const current = newTargets[index];
    const prev = newTargets[index - 1];
    if (current && prev) {
      newTargets[index - 1] = current;
      newTargets[index] = prev;
    }
    // Update useInheritedPity based on new positions
    const updatedTargets = newTargets.map((t, i) => ({
      ...t,
      useInheritedPity: i === 0 ? false : t.useInheritedPity,
    }));
    setTargets(updatedTargets);
    setResults(null);
  };

  const moveTargetDown = (index: number) => {
    if (index === targets.length - 1) return;
    const newTargets = [...targets];
    const current = newTargets[index];
    const next = newTargets[index + 1];
    if (current && next) {
      newTargets[index] = next;
      newTargets[index + 1] = current;
    }
    // Update useInheritedPity based on new positions
    const updatedTargets = newTargets.map((t, i) => ({
      ...t,
      useInheritedPity: i === 0 ? false : t.useInheritedPity,
    }));
    setTargets(updatedTargets);
    setResults(null);
  };

  const validate = (): boolean => {
    const newErrors = validateTargets(targets);
    setErrors(newErrors);
    return newErrors.size === 0 && targets.length > 0;
  };

  const handleCalculate = async () => {
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

      // Get constellation label for display
      const getConstellationLabel = (c: number) => c === 0 ? 'C0' : `C${c}`;

      const simulationInput: SimulationInput = {
        targets: targets.map((target, index) => ({
          id: target.id,
          characterKey: target.characterName
            ? `${target.characterName} (${getConstellationLabel(target.constellation)})`
            : `Target ${index + 1} (${getConstellationLabel(target.constellation)})`,
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
  };

  const canCalculate = targets.length > 0 && !isCalculating;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Multi-Target Planner</h2>

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
              <div className="text-sm font-semibold text-slate-300">Per-Character Results</div>
              {results.perCharacter.map((char) => (
                <div
                  key={char.characterKey}
                  className="p-4 bg-slate-800 border border-slate-700 rounded-lg"
                >
                  <div className="font-medium mb-2 text-slate-100">{char.characterKey}</div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-slate-400">Success Rate</div>
                      <div className="font-semibold text-slate-100" aria-hidden="true">
                        {(char.probability * 100).toFixed(1)}
                      </div>
                      <span className="sr-only">
                        {`${(char.probability * 100).toFixed(1)} percent success rate`}
                      </span>
                    </div>
                    <div>
                      <div className="text-slate-400">Average Pulls</div>
                      <div className="font-semibold text-slate-100">{char.averagePullsUsed.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Median Pulls</div>
                      <div className="font-semibold text-slate-100">{char.medianPullsUsed}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { proxy } from 'comlink';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react';
import { GACHA_RULES } from '@/lib/constants';
import type { BannerType } from '@/types';
import type { SimulationInput, SimulationResult } from '@/workers/montecarlo.worker';
import { createMonteCarloWorker } from '@/workers/montecarloClient';
import { useCurrentPity } from '@/features/wishes/hooks/useCurrentPity';

interface Target {
  id: string;
  characterName: string;
  pity: number;
  guaranteed: boolean;
  radiantStreak: number;
  useInheritedPity: boolean; // If true, inherit pity from previous target's simulation result
}

export function MultiTargetCalculator() {
  const [bannerType, setBannerType] = useState<BannerType>('character');
  const pitySnapshot = useCurrentPity(bannerType);
  const [targets, setTargets] = useState<Target[]>([]);
  const [availablePulls, setAvailablePulls] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [iterations, setIterations] = useState(5000);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const workerRef = useRef(createMonteCarloWorker());
  const rules = GACHA_RULES[bannerType];

  useEffect(() => {
    const currentWorker = workerRef.current;

    return () => {
      currentWorker.worker.terminate();
    };
  }, []);

  useEffect(() => {
    setErrors(validateTargets(targets, GACHA_RULES[bannerType]));
  }, [bannerType]);

  const addTarget = () => {
    const isFirstTarget = targets.length === 0;
    const newTarget: Target = {
      id: crypto.randomUUID(),
      characterName: '',
      pity: 0,
      guaranteed: false,
      radiantStreak: 0,
      useInheritedPity: !isFirstTarget, // First target uses specified pity, others inherit
    };
    setTargets([...targets, newTarget]);
    setErrors(validateTargets([...targets, newTarget], rules));
    setResults(null); // Clear results when adding target
  };

  const removeTarget = (id: string) => {
    const updatedTargets = targets.filter((t) => t.id !== id);
    setTargets(updatedTargets);
    setErrors(validateTargets(updatedTargets, rules));
    setResults(null); // Clear results when removing target
  };

  const validateTargets = (targetsToValidate: Target[], bannerRules = rules): Map<string, string> => {
    const newErrors = new Map<string, string>();
    if (!bannerRules) return newErrors;

    targetsToValidate.forEach((target) => {
      if (target.pity < 0 || target.pity >= bannerRules.hardPity) {
        newErrors.set(`pity-${target.id}`, `Pity must be between 0 and ${bannerRules.hardPity - 1}`);
      }
      if (target.radiantStreak < 0 || target.radiantStreak > 3) {
        newErrors.set(`radiant-${target.id}`, 'Radiant streak should be 0-2');
      }
    });

    return newErrors;
  };

  const updateTarget = (id: string, updates: Partial<Target>) => {
    const updatedTargets = targets.map((t) => (t.id === id ? { ...t, ...updates } : t));
    setTargets(updatedTargets);
    setErrors(validateTargets(updatedTargets, rules));
    setResults(null); // Clear results when updating target
  };

  const prefillFromCurrentPity = () => {
    if (!pitySnapshot) return;

    const weaponRules = GACHA_RULES.weapon;
    const nextTargetValues = {
      pity: pitySnapshot.pity,
      guaranteed: pitySnapshot.banner === 'weapon'
        ? (pitySnapshot.fatePoints ?? 0) >= (weaponRules?.maxFatePoints ?? 2)
        : pitySnapshot.guaranteed,
      radiantStreak: pitySnapshot.radiantStreak,
    };

    if (targets.length === 0) {
      setTargets([
        {
          id: crypto.randomUUID(),
          characterName: '',
          useInheritedPity: false, // First target uses specified pity
          ...nextTargetValues,
        },
      ]);
      return;
    }

    // Only update first target's pity state
    setTargets(
      targets.map((target, index) =>
        index === 0 ? { ...target, ...nextTargetValues, useInheritedPity: false } : target
      )
    );
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
    return newErrors.size === 0;
  };

  const handleCalculate = async () => {
    if (!validate() || !rules) return;

    setIsCalculating(true);
    setProgress(0);

    const minimumLoadingDuration = new Promise((resolve) => setTimeout(resolve, 25));

    try {
      // Build per-target pity states for more accurate simulation
      const perTargetStates = targets.map((target) => ({
        pity: target.useInheritedPity ? null : target.pity, // null means inherit from previous
        guaranteed: target.useInheritedPity ? null : target.guaranteed,
        radiantStreak: target.useInheritedPity ? null : target.radiantStreak,
      }));

      const simulationInput: SimulationInput = {
        targets: targets.map((target, index) => ({
          id: target.id,
          characterKey: target.characterName || `Target ${index + 1}`,
          expectedStartDate: new Date().toISOString(), // Immediate
          expectedEndDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days
          priority: 1,
          maxPullBudget: null,
          isConfirmed: true,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
        startingPity: targets[0]?.pity ?? 0,
        startingGuaranteed: targets[0]?.guaranteed ?? false,
        startingRadiantStreak: targets[0]?.radiantStreak ?? 0,
        startingPulls: availablePulls,
        incomePerDay: 0, // No daily income for this calculation
        rules,
        config: {
          iterations,
          seed: Date.now(),
          chunkSize: 500,
        },
        perTargetStates, // Pass per-target pity overrides
      };

      console.log('[Main] Calling worker.runSimulation...');
      const result = await workerRef.current.api.runSimulation(
        simulationInput,
        proxy((value: number) => {
          console.log('[Main] Progress callback received:', value);
          setProgress(value);
        })
      );
      console.log('[Main] Got result:', result);
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Multi-Target Planner</h2>
        <Select
          label="Banner Type"
          value={bannerType}
          onChange={(e) => setBannerType(e.target.value as BannerType)}
          options={[
            { value: 'character', label: 'Character Event' },
            { value: 'weapon', label: 'Weapon Event' },
            { value: 'standard', label: 'Standard' },
          ]}
        />
      </div>
      <div className="flex justify-end">
        <Button size="sm" variant="secondary" onClick={prefillFromCurrentPity} disabled={!pitySnapshot}>
          Use current pity
        </Button>
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
                  <span className="font-semibold">Target {index + 1}</span>
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
                  <Input
                    label="Character Name"
                    value={target.characterName}
                    onChange={(e) => updateTarget(target.id, { characterName: e.target.value })}
                    placeholder="Character name"
                  />

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
                        max={89}
                      />
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
                            max={89}
                          />
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

      <Button onClick={addTarget} variant={targets.length === 0 ? 'primary' : 'secondary'} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Target
      </Button>

      <Card>
        <CardHeader>
          <h3 className="font-semibold">Available Resources</h3>
        </CardHeader>
        <CardContent>
          <Input
            label="Available Pulls"
            type="number"
            value={availablePulls}
            onChange={(e) => setAvailablePulls(Number(e.target.value))}
            min={0}
          />
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

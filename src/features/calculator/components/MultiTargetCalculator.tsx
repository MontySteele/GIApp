import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react';
import { GACHA_RULES } from '@/lib/constants';
import type { BannerType } from '@/types';
import { runSimulation } from '@/workers/montecarlo.worker';
import type { SimulationInput, SimulationResult } from '@/workers/montecarlo.worker';

interface Target {
  id: string;
  characterName: string;
  pity: number;
  guaranteed: boolean;
  radiantStreak: number;
}

export function MultiTargetCalculator() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [availablePulls, setAvailablePulls] = useState(0);
  const [bannerType, setBannerType] = useState<BannerType>('character');
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  const addTarget = () => {
    const newTarget: Target = {
      id: crypto.randomUUID(),
      characterName: '',
      pity: 0,
      guaranteed: false,
      radiantStreak: 0,
    };
    setTargets([...targets, newTarget]);
    setResults(null); // Clear results when adding target
  };

  const removeTarget = (id: string) => {
    setTargets(targets.filter((t) => t.id !== id));
    setResults(null); // Clear results when removing target
  };

  const updateTarget = (id: string, updates: Partial<Target>) => {
    setTargets(
      targets.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    setResults(null); // Clear results when updating target
  };

  const moveTargetUp = (index: number) => {
    if (index === 0) return;
    const newTargets = [...targets];
    [newTargets[index - 1], newTargets[index]] = [newTargets[index], newTargets[index - 1]];
    setTargets(newTargets);
    setResults(null);
  };

  const moveTargetDown = (index: number) => {
    if (index === targets.length - 1) return;
    const newTargets = [...targets];
    [newTargets[index], newTargets[index + 1]] = [newTargets[index + 1], newTargets[index]];
    setTargets(newTargets);
    setResults(null);
  };

  const validate = (): boolean => {
    const newErrors = new Map<string, string>();
    const rules = GACHA_RULES[bannerType];

    targets.forEach((target) => {
      if (target.pity < 0 || target.pity >= rules.hardPity) {
        newErrors.set(`pity-${target.id}`, `Pity must be between 0 and ${rules.hardPity - 1}`);
      }
      if (target.radiantStreak < 0 || target.radiantStreak > 3) {
        newErrors.set(`radiant-${target.id}`, 'Radiant streak should be 0-2');
      }
    });

    setErrors(newErrors);
    return newErrors.size === 0;
  };

  const handleCalculate = async () => {
    if (!validate()) return;

    setIsCalculating(true);

    try {
      // For multi-target, we'll use current state for all targets
      // In a real implementation, each target might have different states
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
        startingPity: targets[0]?.pity || 0,
        startingGuaranteed: targets[0]?.guaranteed || false,
        startingRadiantStreak: targets[0]?.radiantStreak || 0,
        startingPulls: availablePulls,
        incomePerDay: 0, // No daily income for this calculation
        rules: GACHA_RULES[bannerType],
        config: {
          iterations: 10000,
          seed: Date.now(),
        },
      };

      const result = runSimulation(simulationInput);
      setResults(result);
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
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
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Character Name"
                    value={target.characterName}
                    onChange={(e) => updateTarget(target.id, { characterName: e.target.value })}
                    placeholder="Character name"
                  />
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
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`guaranteed-${target.id}`}
                      checked={target.guaranteed}
                      onChange={(e) =>
                        updateTarget(target.id, { guaranteed: e.target.checked })
                      }
                      className="rounded"
                    />
                    <label htmlFor={`guaranteed-${target.id}`}>Guaranteed</label>
                  </div>
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

      <Button
        onClick={handleCalculate}
        disabled={!canCalculate}
        className="w-full"
        variant="primary"
      >
        {isCalculating ? 'Calculating...' : 'Calculate'}
      </Button>

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
                      <div className="font-semibold text-slate-100">{(char.probability * 100).toFixed(1)}%</div>
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

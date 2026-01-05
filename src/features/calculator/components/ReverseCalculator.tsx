import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { GACHA_RULES } from '@/lib/constants';
import { calculateRequiredIncome } from '../domain/analyticalCalc';
import type { BannerType } from '@/types';

export function ReverseCalculator() {
  const [numTargets, setNumTargets] = useState(1);
  const [targetProbability, setTargetProbability] = useState(80);
  const [daysAvailable, setDaysAvailable] = useState(42);
  const [currentPity, setCurrentPity] = useState(0);
  const [isGuaranteed, setIsGuaranteed] = useState(false);
  const [radiantStreak, setRadiantStreak] = useState(0);
  const [bannerType, setBannerType] = useState<BannerType>('character');
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  const [results, setResults] = useState<ReturnType<typeof calculateRequiredIncome> | null>(null);

  const validate = (): boolean => {
    const newErrors = new Map<string, string>();
    const rules = GACHA_RULES[bannerType];

    if (numTargets < 1) {
      newErrors.set('numTargets', 'Must be at least 1');
    }
    if (targetProbability < 0 || targetProbability > 100) {
      newErrors.set('targetProbability', 'Must be between 0 and 100');
    }
    if (daysAvailable < 1) {
      newErrors.set('daysAvailable', 'Must be at least 1');
    }
    if (currentPity < 0 || currentPity >= rules.hardPity) {
      newErrors.set('currentPity', `Pity must be between 0 and ${rules.hardPity - 1}`);
    }
    if (radiantStreak < 0 || radiantStreak > 3) {
      newErrors.set('radiantStreak', 'Radiant streak should be 0-2');
    }

    setErrors(newErrors);
    return newErrors.size === 0;
  };

  const calculate = () => {
    if (!validate()) return;

    const result = calculateRequiredIncome(
      numTargets,
      targetProbability / 100,
      daysAvailable,
      currentPity,
      isGuaranteed,
      radiantStreak,
      GACHA_RULES[bannerType]
    );

    setResults(result);
  };

  // Validate when inputs change
  useEffect(() => {
    validate();
  }, [numTargets, targetProbability, daysAvailable, currentPity, radiantStreak, bannerType]);

  // Auto-calculate when inputs change
  useEffect(() => {
    if (results) {
      calculate();
    }
  }, [numTargets, targetProbability, daysAvailable, currentPity, isGuaranteed, radiantStreak, bannerType]);

  const setProbabilityPreset = (prob: number) => {
    setTargetProbability(prob);
  };

  const getFeasibilityColor = (feasibility: string) => {
    switch (feasibility) {
      case 'easy':
        return 'text-green-600';
      case 'possible':
        return 'text-blue-600';
      case 'difficult':
        return 'text-orange-600';
      case 'unlikely':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getFeasibilityBg = (feasibility: string) => {
    switch (feasibility) {
      case 'easy':
        return 'bg-green-100';
      case 'possible':
        return 'bg-blue-100';
      case 'difficult':
        return 'bg-orange-100';
      case 'unlikely':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reverse Calculator</h2>
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

      <Card>
        <CardHeader>
          <h3 className="font-semibold">Target Goals</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Number of Targets"
            type="number"
            value={numTargets}
            onChange={(e) => setNumTargets(Number(e.target.value))}
            error={errors.get('numTargets')}
            min={1}
          />

          <div>
            <div className="flex gap-2 mb-2">
              <Button
                size="sm"
                variant={targetProbability === 50 ? 'primary' : 'secondary'}
                onClick={() => setProbabilityPreset(50)}
              >
                50%
              </Button>
              <Button
                size="sm"
                variant={targetProbability === 80 ? 'primary' : 'secondary'}
                onClick={() => setProbabilityPreset(80)}
              >
                80%
              </Button>
              <Button
                size="sm"
                variant={targetProbability === 90 ? 'primary' : 'secondary'}
                onClick={() => setProbabilityPreset(90)}
              >
                90%
              </Button>
            </div>
            <Input
              label="Target Probability"
              type="number"
              value={targetProbability}
              onChange={(e) => setTargetProbability(Number(e.target.value))}
              error={errors.get('targetProbability')}
              min={0}
              max={100}
            />
          </div>

          <Input
            label="Days Available"
            type="number"
            value={daysAvailable}
            onChange={(e) => setDaysAvailable(Number(e.target.value))}
            error={errors.get('daysAvailable')}
            min={1}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-semibold">Current State</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Current Pity"
            type="number"
            value={currentPity}
            onChange={(e) => setCurrentPity(Number(e.target.value))}
            error={errors.get('currentPity')}
            min={0}
            max={89}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="guaranteed"
              checked={isGuaranteed}
              onChange={(e) => setIsGuaranteed(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="guaranteed">Guaranteed</label>
          </div>

          <Input
            label="Radiant Streak"
            type="number"
            value={radiantStreak}
            onChange={(e) => setRadiantStreak(Number(e.target.value))}
            error={errors.get('radiantStreak')}
            min={0}
            max={3}
          />
        </CardContent>
      </Card>

      <Button onClick={calculate} className="w-full" variant="primary">
        Calculate
      </Button>

      {results && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Required Income</h3>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Pulls Per Day</div>
                <div className="text-2xl font-bold">{results.requiredPullsPerDay.toFixed(2)}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Primogems Per Day</div>
                <div className="text-2xl font-bold">{results.requiredPrimosPerDay.toFixed(0)}</div>
              </div>
            </div>

            {/* Feasibility */}
            <div
              className={`p-4 rounded-lg ${getFeasibilityBg(results.feasibility)}`}
            >
              <div className="text-sm mb-1">Feasibility</div>
              <div className={`text-2xl font-bold capitalize ${getFeasibilityColor(results.feasibility)}`}>
                {results.feasibility}
              </div>
            </div>

            {/* Income comparisons */}
            <div className="space-y-3">
              <div className="text-sm font-semibold">Compared to Income Sources</div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">F2P (~60 primos/day)</span>
                  <span className="text-sm font-semibold">×{results.comparedToF2P.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gray-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, results.comparedToF2P * 100)}%` }}
                    role="progressbar"
                    aria-valuenow={results.comparedToF2P}
                    aria-valuemin={0}
                    aria-valuemax={1}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Welkin (~150 primos/day)</span>
                  <span className="text-sm font-semibold">×{results.comparedToWelkin.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, results.comparedToWelkin * 100)}%` }}
                    role="progressbar"
                    aria-valuenow={results.comparedToWelkin}
                    aria-valuemin={0}
                    aria-valuemax={1}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Welkin + BP (~170 primos/day)</span>
                  <span className="text-sm font-semibold">×{results.comparedToWelkinBP.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, results.comparedToWelkinBP * 100)}%` }}
                    role="progressbar"
                    aria-valuenow={results.comparedToWelkinBP}
                    aria-valuemin={0}
                    aria-valuemax={1}
                  />
                </div>
              </div>
            </div>

            {/* Help text */}
            <div className="text-sm text-gray-600 space-y-2 pt-4 border-t">
              <p>
                <strong>Easy:</strong> Achievable with F2P income (daily commissions, events)
              </p>
              <p>
                <strong>Possible:</strong> Requires Welkin Moon or equivalent
              </p>
              <p>
                <strong>Difficult:</strong> Requires Welkin + BP or high spending
              </p>
              <p>
                <strong>Unlikely:</strong> Requires significant spending beyond Welkin + BP
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState } from 'react';
import { calculateSingleTarget, type AnalyticalResult } from '../domain/analyticalCalc';
import { GACHA_RULES } from '@/lib/constants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Calculator } from 'lucide-react';

export default function SingleTargetCalculator() {
  const [currentPity, setCurrentPity] = useState(0);
  const [isGuaranteed, setIsGuaranteed] = useState(false);
  const [radiantStreak, setRadiantStreak] = useState(0);
  const [availablePulls, setAvailablePulls] = useState(0);
  const [result, setResult] = useState<AnalyticalResult | null>(null);

  const handleCalculate = () => {
    const res = calculateSingleTarget(
      currentPity,
      isGuaranteed,
      radiantStreak,
      availablePulls,
      GACHA_RULES.character
    );
    setResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Current State</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Current Pity"
              type="number"
              min="0"
              max="89"
              value={currentPity}
              onChange={(e) => setCurrentPity(parseInt(e.target.value) || 0)}
            />

            <Input
              label="Available Pulls"
              type="number"
              min="0"
              value={availablePulls}
              onChange={(e) => setAvailablePulls(parseInt(e.target.value) || 0)}
            />

            <Select
              label="Guarantee Status"
              value={isGuaranteed ? 'guaranteed' : 'not-guaranteed'}
              onChange={(e) => setIsGuaranteed(e.target.value === 'guaranteed')}
              options={[
                { value: 'not-guaranteed', label: 'Not Guaranteed (50/50)' },
                { value: 'guaranteed', label: 'Guaranteed Featured' },
              ]}
            />

            <Input
              label="Radiant Streak"
              type="number"
              min="0"
              max="2"
              value={radiantStreak}
              onChange={(e) => setRadiantStreak(parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="mt-6">
            <Button onClick={handleCalculate} className="w-full md:w-auto">
              <Calculator className="w-4 h-4" />
              Calculate Probability
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Results</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Probability */}
                <div className="col-span-full">
                  <div className="bg-primary-900/20 border-2 border-primary-500 rounded-lg p-6 text-center">
                    <div className="text-sm text-slate-400 mb-2">
                      Probability with {availablePulls} pulls
                    </div>
                    <div className="text-5xl font-bold text-primary-400">
                      {(result.probabilityWithCurrentPulls * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Confidence Levels */}
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">50% Confidence</div>
                  <div className="text-2xl font-bold text-slate-100">
                    {result.pullsFor50} pulls
                  </div>
                </div>

                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">80% Confidence</div>
                  <div className="text-2xl font-bold text-slate-100">
                    {result.pullsFor80} pulls
                  </div>
                </div>

                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">90% Confidence</div>
                  <div className="text-2xl font-bold text-slate-100">
                    {result.pullsFor90} pulls
                  </div>
                </div>

                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">99% Confidence</div>
                  <div className="text-2xl font-bold text-slate-100">
                    {result.pullsFor99} pulls
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-300">
                  <strong className="text-slate-100">Tip:</strong> An 80% confidence level
                  means you have an 80% chance of getting the character within that many pulls.
                  The 50% mark is your "average case" scenario.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

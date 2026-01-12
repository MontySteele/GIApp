import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import type { SimulationResult } from '@/workers/montecarlo.worker';

interface SimulationResultsProps {
  results: SimulationResult;
}

export default function SimulationResults({ results }: SimulationResultsProps) {
  return (
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

          {/* Nothing result */}
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

          {/* Per-character breakdown */}
          {results.perCharacter.map((char, charIndex) => (
            <CharacterResult key={`${char.characterKey}-${charIndex}`} char={char} charIndex={charIndex} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface CharacterResultProps {
  char: SimulationResult['perCharacter'][number];
  charIndex: number;
}

function CharacterResult({ char, charIndex }: CharacterResultProps) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-slate-200 px-1">
        {char.characterKey || `Target ${charIndex + 1}`}
        <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
          {char.bannerType === 'weapon' ? 'Weapon' : 'Character'}
        </span>
      </div>
      {char.constellations.map((cons) => (
        <ConstellationResult key={`${char.characterKey}-${cons.label}`} cons={cons} />
      ))}
    </div>
  );
}

interface ConstellationResultProps {
  cons: SimulationResult['perCharacter'][number]['constellations'][number];
}

function ConstellationResult({ cons }: ConstellationResultProps) {
  const probabilityColorClass =
    cons.probability >= 0.8
      ? 'text-green-400'
      : cons.probability >= 0.5
        ? 'text-yellow-400'
        : cons.probability >= 0.2
          ? 'text-orange-400'
          : 'text-red-400';

  return (
    <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg ml-2">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-slate-100">{cons.label}</div>
        <div className={`text-lg font-bold ${probabilityColorClass}`}>
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
  );
}

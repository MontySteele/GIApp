import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, Hammer, Sparkles, Target } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import Select from '@/components/ui/Select';
import { buildCampaignPrefillUrl } from '@/features/campaigns/lib/campaignLinks';
import { ALL_CHARACTERS } from '@/lib/constants/characterList';
import type { CampaignBuildGoal } from '@/types';

type TargetMode = 'pull' | 'build';

const BUILD_GOAL_OPTIONS: { value: CampaignBuildGoal; label: string }[] = [
  { value: 'functional', label: 'Functional' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'full', label: 'Full build' },
];

function buildCalculatorHref(characterKey: string, copies: number, savedPulls: string): string {
  const params = new URLSearchParams();
  params.set('mode', 'multi');
  params.append('target', JSON.stringify({
    name: characterKey,
    banner: 'character',
    copies,
  }));

  if (savedPulls) {
    params.set('pulls', savedPulls);
  }

  return `/pulls/calculator?${params.toString()}`;
}

export default function TargetQuickStart() {
  const [mode, setMode] = useState<TargetMode>('pull');
  const [characterKey, setCharacterKey] = useState('');
  const [buildGoal, setBuildGoal] = useState<CampaignBuildGoal>('comfortable');
  const [deadline, setDeadline] = useState('');
  const [pullBudget, setPullBudget] = useState('');
  const [targetConstellation, setTargetConstellation] = useState('');
  const [savedPulls, setSavedPulls] = useState('');

  const characterOptions = useMemo(
    () =>
      ALL_CHARACTERS
        .map((character) => ({
          value: character.key,
          label: character.name,
          sublabel: `${character.rarity} star ${character.element} ${character.weapon}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    []
  );

  const trimmedConstellation = targetConstellation.trim();
  const targetConstellationValue = Number(trimmedConstellation);
  const hasConstellationTarget = mode === 'pull' &&
    trimmedConstellation.length > 0 &&
    Number.isInteger(targetConstellationValue) &&
    targetConstellationValue >= 0 &&
    targetConstellationValue <= 6;
  const hasInvalidConstellationTarget = mode === 'pull' &&
    trimmedConstellation.length > 0 &&
    !hasConstellationTarget;
  const desiredCopies = hasConstellationTarget
    ? Math.max(1, targetConstellationValue + 1)
    : 1;
  const targetHref = buildCampaignPrefillUrl({
    campaignType: mode === 'pull' ? 'character-acquisition' : 'character-polish',
    characterKey,
    buildGoal,
    includePullTarget: mode === 'pull',
    ...(deadline ? { deadline } : {}),
    ...(pullBudget ? { maxPullBudget: Number(pullBudget) } : {}),
    ...(hasConstellationTarget ? { targetConstellation: targetConstellationValue, desiredCopies } : {}),
  });
  const calculatorHref = characterKey ? buildCalculatorHref(characterKey, desiredCopies, savedPulls) : '/pulls/calculator';
  const canStart = characterKey.trim().length > 0 && !hasInvalidConstellationTarget;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Start a Target</h2>
          <p className="text-sm text-slate-400">
            Pick a character, then jump straight into a target draft or odds check.
          </p>
        </div>
        <div className="flex rounded-lg bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => setMode('pull')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
              mode === 'pull' ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Get
          </button>
          <button
            type="button"
            onClick={() => setMode('build')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
              mode === 'build' ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Hammer className="h-4 w-4" />
            Build
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7">
        <div className="xl:col-span-2">
          <SearchableSelect
            label="Character"
            placeholder="Search character..."
            options={characterOptions}
            value={characterKey}
            onChange={setCharacterKey}
          />
        </div>
        <Select
          label="Build goal"
          value={buildGoal}
          onChange={(event) => setBuildGoal(event.target.value as CampaignBuildGoal)}
          options={BUILD_GOAL_OPTIONS}
        />
        {mode === 'pull' ? (
          <>
            <Input
              label="Target C"
              type="number"
              min="0"
              max="6"
              value={targetConstellation}
              onChange={(event) => setTargetConstellation(event.target.value)}
              placeholder="0"
              error={hasInvalidConstellationTarget ? 'Use C0-C6' : undefined}
            />
            <Input
              label="Pulls saved"
              type="number"
              min="0"
              value={savedPulls}
              onChange={(event) => setSavedPulls(event.target.value)}
              placeholder="0"
            />
            <Input
              label="Banner deadline"
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
            <Input
              label="Pull budget"
              type="number"
              min="0"
              value={pullBudget}
              onChange={(event) => setPullBudget(event.target.value)}
              placeholder="optional"
            />
          </>
        ) : (
          <Input
            label="Deadline"
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
          />
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {canStart ? (
          <>
            <Link
              to={targetHref}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              <Target className="h-4 w-4" />
              Start Target
            </Link>
            {mode === 'pull' && (
              <Link
                to={calculatorHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-600"
              >
                <Calculator className="h-4 w-4" />
                Check Odds
              </Link>
            )}
          </>
        ) : (
          <Button disabled>
            <Target className="h-4 w-4" />
            Start Target
          </Button>
        )}
      </div>
    </section>
  );
}

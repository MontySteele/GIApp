import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, CheckCircle2, Hammer, Sparkles, Target, UsersRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import Select from '@/components/ui/Select';
import { useTeams } from '@/features/roster/hooks/useTeams';
import { ALL_CHARACTERS } from '@/lib/constants/characterList';
import type { CampaignBuildGoal } from '@/types';
import {
  buildTargetWizardPreview,
  isValidConstellationInput,
  type TargetWizardMode,
  type TargetWizardState,
} from '../domain/targetWizard';

const BUILD_GOAL_OPTIONS: { value: CampaignBuildGoal; label: string }[] = [
  { value: 'functional', label: 'Functional' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'full', label: 'Full build' },
];

const MODE_OPTIONS: { value: TargetWizardMode; label: string; icon: LucideIcon }[] = [
  { value: 'get-character', label: 'Get', icon: Sparkles },
  { value: 'build-character', label: 'Build', icon: Hammer },
  { value: 'polish-team', label: 'Team', icon: UsersRound },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function getInitialState(): TargetWizardState {
  return {
    mode: 'get-character',
    characterKey: '',
    teamId: '',
    buildGoal: 'comfortable',
    deadline: todayIso(),
    savedPulls: '0',
    currentPity: '0',
    currentConstellation: '',
    targetConstellation: '',
    pullBudget: '',
    guaranteed: false,
    useWishHistory: false,
  };
}

function getStepLabel(step: number): string {
  return ['Goal', 'Details', 'Preview'][step] ?? 'Preview';
}

export default function TargetQuickStart() {
  const { teams } = useTeams();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<TargetWizardState>(() => getInitialState());

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
  const teamOptions = useMemo(
    () => [
      { value: '', label: teams.length > 0 ? 'Select a team...' : 'No teams yet' },
      ...teams.map((team) => ({ value: team.id, label: team.name })),
    ],
    [teams]
  );

  const preview = useMemo(() => buildTargetWizardPreview(state), [state]);
  const selectedMode = MODE_OPTIONS.find((mode) => mode.value === state.mode) ?? MODE_OPTIONS[0]!;
  const SelectedIcon = selectedMode.icon;
  const hasInvalidCurrentConstellation = !isValidConstellationInput(state.currentConstellation);
  const hasInvalidTargetConstellation = !isValidConstellationInput(state.targetConstellation);
  const hasInvalidConstellation = hasInvalidCurrentConstellation || hasInvalidTargetConstellation;

  const updateState = (patch: Partial<TargetWizardState>) => {
    setState((current) => ({ ...current, ...patch }));
  };

  const handleModeChange = (mode: TargetWizardMode) => {
    updateState({
      mode,
      ...(mode !== 'polish-team' ? { teamId: '' } : { characterKey: '' }),
      ...(mode !== 'get-character'
        ? { savedPulls: '0', currentPity: '0', currentConstellation: '', targetConstellation: '', pullBudget: '', guaranteed: false }
        : {}),
    });
    setStep(1);
  };

  const canOpenPreview = preview.canPreview && !hasInvalidConstellation;
  const canAdvance = step === 0 || (step === 1 && canOpenPreview);
  const canOpenStep = (targetStep: number) => targetStep < 2 || canOpenPreview;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Start a Target</h2>
          <p className="text-sm text-slate-400">
            {getStepLabel(step)}: {step === 2 ? preview.title : selectedMode.label}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-slate-800 p-1">
          {[0, 1, 2].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                if (canOpenStep(item)) {
                  setStep(item);
                }
              }}
              disabled={!canOpenStep(item)}
              className={`h-2.5 w-8 rounded-full transition-colors ${
                item <= step ? 'bg-primary-500' : 'bg-slate-700'
              } disabled:cursor-not-allowed disabled:opacity-50`}
              aria-label={`Go to ${getStepLabel(item)} step`}
            />
          ))}
        </div>
      </div>

      {step === 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {MODE_OPTIONS.map((mode) => {
            const Icon = mode.icon;
            const active = mode.value === state.mode;

            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => handleModeChange(mode.value)}
                className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                  active
                    ? 'border-primary-500 bg-primary-950/30 text-primary-100'
                    : 'border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="font-medium">{mode.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {state.mode === 'polish-team' ? (
              <Select
                label="Target team"
                value={state.teamId}
                onChange={(event) => updateState({ teamId: event.target.value })}
                options={teamOptions}
                disabled={teams.length === 0}
              />
            ) : (
              <SearchableSelect
                label="Target character"
                placeholder="Search character..."
                options={characterOptions}
                value={state.characterKey}
                onChange={(characterKey) => updateState({ characterKey })}
              />
            )}
            <Select
              label="Build goal"
              value={state.buildGoal}
              onChange={(event) => updateState({ buildGoal: event.target.value as CampaignBuildGoal })}
              options={BUILD_GOAL_OPTIONS}
            />
            <Input
              label={state.mode === 'get-character' ? 'Banner deadline' : 'Deadline'}
              type="date"
              value={state.deadline}
              onChange={(event) => updateState({ deadline: event.target.value })}
            />
          </div>

          {state.mode === 'get-character' && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Input
                  label="Pulls saved"
                  type="number"
                  min="0"
                  value={state.savedPulls}
                  onChange={(event) => updateState({ savedPulls: event.target.value })}
                />
                <Input
                  label="Current pity"
                  type="number"
                  min="0"
                  max="89"
                  value={state.currentPity}
                  onChange={(event) => updateState({ currentPity: event.target.value })}
                />
                <Input
                  label="Current C"
                  type="number"
                  min="0"
                  max="6"
                  value={state.currentConstellation}
                  onChange={(event) => updateState({ currentConstellation: event.target.value })}
                  placeholder="optional"
                  error={hasInvalidCurrentConstellation ? 'Use C0-C6' : undefined}
                />
                <Input
                  label="Target C"
                  type="number"
                  min="0"
                  max="6"
                  value={state.targetConstellation}
                  onChange={(event) => updateState({ targetConstellation: event.target.value })}
                  placeholder="0"
                  error={hasInvalidTargetConstellation ? 'Use C0-C6' : undefined}
                />
                <Input
                  label="Pull budget"
                  type="number"
                  min="0"
                  value={state.pullBudget}
                  onChange={(event) => updateState({ pullBudget: event.target.value })}
                  placeholder="optional"
                />
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={state.guaranteed}
                    onChange={(event) => updateState({ guaranteed: event.target.checked })}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-primary-600 focus:ring-primary-500"
                  />
                  Guaranteed
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={state.useWishHistory}
                    onChange={(event) => updateState({ useWishHistory: event.target.checked })}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-primary-600 focus:ring-primary-500"
                  />
                  Use tracker
                </label>
              </div>
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <div className="mb-2 flex items-center gap-2">
              <SelectedIcon className="h-5 w-5 text-primary-300" aria-hidden="true" />
              <div>
                <h3 className="font-semibold text-slate-100">{preview.title}</h3>
                <p className="text-sm text-slate-400">{preview.summary}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <PreviewStat label="Copies" value={String(preview.desiredCopies)} />
              <PreviewStat label="Shortfall" value={`${preview.pullShortfall} pulls`} />
              <PreviewStat label="Daily pace" value={preview.pullsPerDay === null ? 'Set' : `${preview.pullsPerDay}/day`} />
            </div>
          </div>

          <div className="space-y-2">
            {preview.adviceRows.map((row) => (
              <div key={row} className="flex items-start gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-300" aria-hidden="true" />
                <span>{row}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {step > 0 && (
          <Button type="button" variant="ghost" onClick={() => setStep((current) => Math.max(0, current - 1))}>
            Back
          </Button>
        )}
        {step < 2 ? (
          <Button
            type="button"
            onClick={() => setStep((current) => Math.min(2, current + 1))}
            disabled={!canAdvance}
          >
            Next
          </Button>
        ) : (
          <>
            {preview.canCreate && !hasInvalidConstellation ? (
              <Link
                to={preview.createHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                <Target className="h-4 w-4" aria-hidden="true" />
                Create Target
              </Link>
            ) : (
              <Button disabled>
                <Target className="h-4 w-4" aria-hidden="true" />
                Create Target
              </Button>
            )}
            {preview.calculatorHref && (
              <Link
                to={preview.calculatorHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-600"
              >
                <Calculator className="h-4 w-4" aria-hidden="true" />
                Check Odds
              </Link>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-900 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-100">{value}</div>
    </div>
  );
}

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Archive,
  ArrowRight,
  Calendar,
  CheckCircle2,
  CirclePause,
  CirclePlay,
  Plus,
  Sparkles,
  Target,
  Trash2,
  UsersRound,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import DeleteConfirmModal from '@/features/roster/components/DeleteConfirmModal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useTeams } from '@/features/roster/hooks/useTeams';
import AccountDataFreshnessCallout from '@/features/sync/components/AccountDataFreshnessCallout';
import { useAccountDataFreshness } from '@/features/sync';
import { ALL_CHARACTERS } from '@/lib/constants/characterList';
import { getDisplayName } from '@/lib/gameData';
import type {
  Campaign,
  CampaignBuildGoal,
  CampaignCharacterTarget,
  CampaignPullTarget,
  CampaignStatus,
  CampaignType,
  Team,
} from '@/types';
import type { CampaignNextAction, CampaignPlan } from '../domain/campaignPlan';
import { getCampaignPullTargets } from '../domain/campaignPlan';
import { useCampaignPlanContext } from '../hooks/useCampaignPlanContext';
import { useCampaigns } from '../hooks/useCampaigns';
import { useCampaignPlans } from '../hooks/useCampaignPlans';

const BUILD_GOAL_OPTIONS: { value: CampaignBuildGoal; label: string }[] = [
  { value: 'functional', label: 'Functional' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'full', label: 'Full' },
];

const BUILD_GOAL_VALUES = new Set<CampaignBuildGoal>(['functional', 'comfortable', 'full']);
const DEFAULT_CHARACTER_KEY = ALL_CHARACTERS[0]?.key ?? '';

const PRIORITY_OPTIONS = [
  { value: '1', label: '1 - Must do' },
  { value: '2', label: '2 - High' },
  { value: '3', label: '3 - Medium' },
  { value: '4', label: '4 - Low' },
  { value: '5', label: '5 - Someday' },
];

const STATUS_BADGE: Record<CampaignStatus, 'success' | 'warning' | 'secondary' | 'outline'> = {
  active: 'success',
  paused: 'warning',
  completed: 'secondary',
  archived: 'outline',
};

const ACTION_BADGE: Record<CampaignNextAction['category'], 'primary' | 'secondary' | 'success' | 'warning' | 'outline'> = {
  pulls: 'primary',
  materials: 'warning',
  build: 'secondary',
  roster: 'outline',
  done: 'success',
};

const PLAN_STATUS_BADGE: Record<CampaignPlan['status'], 'success' | 'warning' | 'danger'> = {
  ready: 'success',
  attention: 'warning',
  blocked: 'danger',
};

function formatBuildGoal(value: CampaignBuildGoal): string {
  return BUILD_GOAL_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function toPriority(value: string): Campaign['priority'] {
  const parsed = Number(value);
  if (parsed >= 1 && parsed <= 5) {
    return parsed as Campaign['priority'];
  }
  return 3;
}

function getBuildGoalParam(value: string | null): CampaignBuildGoal {
  return BUILD_GOAL_VALUES.has(value as CampaignBuildGoal)
    ? (value as CampaignBuildGoal)
    : 'comfortable';
}

function getCharacterParam(value: string | null): string {
  if (!value) return DEFAULT_CHARACTER_KEY;
  return ALL_CHARACTERS.find((character) => character.key.toLowerCase() === value.toLowerCase())?.key
    ?? DEFAULT_CHARACTER_KEY;
}

function getPositiveIntegerParam(value: string | null, fallback: string): string {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return String(parsed);
}

function getBudgetParam(value: string | null): string {
  if (!value) return '';
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return String(parsed);
}

function getPullPlanParam(value: string | null): boolean | null {
  if (value === null) return null;
  return !['0', 'false', 'no'].includes(value.toLowerCase());
}

function formatDate(value: string | undefined): string {
  if (!value) return 'No deadline';
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

function buildCharacterTarget(
  characterKey: string,
  ownedKeys: Set<string>,
  buildGoal: CampaignBuildGoal
): CampaignCharacterTarget {
  return {
    id: crypto.randomUUID(),
    characterKey,
    ownership: ownedKeys.has(characterKey.toLowerCase()) ? 'owned' : 'wishlist',
    buildGoal,
  };
}

function buildPullTarget(
  characterKey: string,
  desiredCopies: number,
  maxPullBudget: string
): CampaignPullTarget {
  const parsedBudget = Number(maxPullBudget);

  return {
    id: crypto.randomUUID(),
    itemKey: characterKey,
    itemType: 'character',
    bannerType: 'character',
    desiredCopies,
    maxPullBudget: Number.isFinite(parsedBudget) && parsedBudget > 0 ? parsedBudget : null,
    isConfirmed: false,
  };
}

function getTeamMemberTargets(
  team: Team | undefined,
  ownedKeys: Set<string>,
  buildGoal: CampaignBuildGoal
): CampaignCharacterTarget[] {
  if (!team) return [];
  return team.characterKeys.map((key) => buildCharacterTarget(key, ownedKeys, buildGoal));
}

function isOpenCampaign(campaign: Campaign): boolean {
  return campaign.status === 'active' || campaign.status === 'paused';
}

function findMatchingOpenCampaign(
  campaigns: Campaign[],
  campaignType: CampaignType,
  characterKey: string,
  teamId: string
): Campaign | undefined {
  return campaigns.find((campaign) => {
    if (!isOpenCampaign(campaign) || campaign.type !== campaignType) {
      return false;
    }

    if (campaignType === 'character-acquisition') {
      return campaign.characterTargets.some(
        (target) => target.characterKey.toLowerCase() === characterKey.toLowerCase()
      );
    }

    return Boolean(teamId) && campaign.teamTarget?.teamId === teamId;
  });
}

export default function CampaignsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { campaigns, createCampaign, updateCampaign, deleteCampaign, isLoading } = useCampaigns();
  const {
    context: campaignPlanContext,
    characters,
    isLoading: campaignPlanContextLoading,
    charactersLoading,
  } = useCampaignPlanContext();
  const { teams, isLoading: teamsLoading } = useTeams();
  const accountDataFreshness = useAccountDataFreshness();

  const initialTeamId = searchParams.get('team') ?? '';
  const initialCharacterKey = getCharacterParam(searchParams.get('character'));
  const [campaignType, setCampaignType] = useState<CampaignType>(
    initialTeamId ? 'team-polish' : 'character-acquisition'
  );
  const [selectedCharacterKey, setSelectedCharacterKey] = useState(initialCharacterKey);
  const [selectedTeamId, setSelectedTeamId] = useState(initialTeamId);
  const [buildGoal, setBuildGoal] = useState<CampaignBuildGoal>(getBuildGoalParam(searchParams.get('buildGoal')));
  const [priority, setPriority] = useState(String(toPriority(searchParams.get('priority') ?? '2')));
  const [deadline, setDeadline] = useState('');
  const [desiredCopies, setDesiredCopies] = useState(getPositiveIntegerParam(searchParams.get('copies'), '1'));
  const [maxPullBudget, setMaxPullBudget] = useState(getBudgetParam(searchParams.get('budget')));
  const [includePullTarget, setIncludePullTarget] = useState(getPullPlanParam(searchParams.get('pullPlan')) ?? true);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { plans, isCalculating: plansCalculating } = useCampaignPlans(
    campaigns,
    campaignPlanContext,
    campaignPlanContextLoading
  );
  const prefillSignature = searchParams.toString();

  const ownedKeys = useMemo(
    () => new Set(characters.map((character) => character.key.toLowerCase())),
    [characters]
  );

  useEffect(() => {
    if (!prefillSignature) return;

    const teamId = searchParams.get('team') ?? '';
    const characterKey = getCharacterParam(searchParams.get('character'));
    const pullPlan = getPullPlanParam(searchParams.get('pullPlan'));

    if (teamId) {
      setCampaignType('team-polish');
      setSelectedTeamId(teamId);
    } else if (searchParams.has('character')) {
      setCampaignType('character-acquisition');
      setSelectedCharacterKey(characterKey);
      setSelectedTeamId('');
    }

    if (searchParams.has('buildGoal')) {
      setBuildGoal(getBuildGoalParam(searchParams.get('buildGoal')));
    }
    if (searchParams.has('priority')) {
      setPriority(String(toPriority(searchParams.get('priority') ?? '3')));
    }
    if (searchParams.has('copies')) {
      setDesiredCopies(getPositiveIntegerParam(searchParams.get('copies'), '1'));
    }
    if (searchParams.has('budget')) {
      setMaxPullBudget(getBudgetParam(searchParams.get('budget')));
    }
    if (pullPlan !== null) {
      setIncludePullTarget(pullPlan);
    }
  }, [prefillSignature, searchParams]);

  const characterOptions = useMemo(
    () =>
      ALL_CHARACTERS
        .map((character) => ({
          value: character.key,
          label: `${character.name}${ownedKeys.has(character.key.toLowerCase()) ? ' (owned)' : ''}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [ownedKeys]
  );

  const teamOptions = useMemo(
    () => [
      { value: '', label: teams.length > 0 ? 'Select a team...' : 'No teams yet' },
      ...teams.map((team) => ({ value: team.id, label: team.name })),
    ],
    [teams]
  );

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId),
    [teams, selectedTeamId]
  );
  const hasCampaignPrefill = searchParams.has('character') || searchParams.has('team');
  const matchingOpenCampaign = useMemo(
    () => findMatchingOpenCampaign(campaigns, campaignType, selectedCharacterKey, selectedTeamId),
    [campaigns, campaignType, selectedCharacterKey, selectedTeamId]
  );

  const resetForm = () => {
    setDeadline('');
    setDesiredCopies('1');
    setMaxPullBudget('');
    setNotes('');
    setError('');
    setSearchParams({}, { replace: true });
  };

  const createCampaignFromDraft = async (): Promise<string | null> => {
    setError('');

    if (campaignType === 'character-acquisition' && !selectedCharacterKey) {
      setError('Choose a character target.');
      return null;
    }

    if (campaignType === 'team-polish' && !selectedTeam) {
      setError('Choose a team to polish.');
      return null;
    }

    setIsCreating(true);
    const copies = Math.max(1, Number(desiredCopies) || 1);
    const characterTargets =
      campaignType === 'character-acquisition'
        ? [buildCharacterTarget(selectedCharacterKey, ownedKeys, buildGoal)]
        : getTeamMemberTargets(selectedTeam, ownedKeys, buildGoal);

    const pullTargets =
      campaignType === 'character-acquisition' && includePullTarget
        ? [buildPullTarget(selectedCharacterKey, copies, maxPullBudget)]
        : [];

    const campaignName =
      campaignType === 'character-acquisition'
        ? `Recruit ${getDisplayName(selectedCharacterKey)}`
        : `Polish ${selectedTeam?.name ?? 'Team'}`;

    let campaignId: string;
    try {
      campaignId = await createCampaign({
        type: campaignType,
        name: campaignName,
        status: 'active',
        priority: toPriority(priority),
        ...(deadline ? { deadline } : {}),
        pullTargets,
        characterTargets,
        ...(selectedTeam
          ? {
              teamTarget: {
                teamId: selectedTeam.id,
                name: selectedTeam.name,
                memberKeys: selectedTeam.characterKeys,
              },
            }
          : {}),
        notes,
      });
    } catch {
      setError('Failed to create campaign. Please try again.');
      return null;
    } finally {
      setIsCreating(false);
    }

    resetForm();
    return campaignId;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const campaignId = await createCampaignFromDraft();
    if (!campaignId) return;
    navigate(`/campaigns/${campaignId}`);
  };

  const [mutationError, setMutationError] = useState('');

  const updateStatus = async (campaign: Campaign, status: CampaignStatus) => {
    try {
      setMutationError('');
      await updateCampaign(campaign.id, { status });
    } catch {
      setMutationError(`Failed to update "${campaign.name}" status.`);
    }
  };

  const pageLoading = isLoading || charactersLoading || teamsLoading;

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading campaigns...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Campaigns</h1>
          <p className="text-slate-400">
            Plan character pulls, pre-farming, and team polish from one place.
          </p>
        </div>
        <Badge variant="primary" className="w-fit">
          {campaigns.filter((campaign) => campaign.status === 'active').length} active
        </Badge>
      </div>

      <AccountDataFreshnessCallout freshness={accountDataFreshness} context="campaign" />

      {hasCampaignPrefill && (
        <CampaignDraftCard
          campaignType={campaignType}
          characterKey={selectedCharacterKey}
          selectedTeam={selectedTeam}
          buildGoal={buildGoal}
          priority={toPriority(priority)}
          includePullTarget={includePullTarget}
          desiredCopies={desiredCopies}
          maxPullBudget={maxPullBudget}
          matchingCampaign={matchingOpenCampaign}
          isCreating={isCreating}
          onCreate={async () => {
            const campaignId = await createCampaignFromDraft();
            if (campaignId) {
              navigate(`/campaigns/${campaignId}`);
            }
          }}
          onClear={() => setSearchParams({}, { replace: true })}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold">New Campaign</h2>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Campaign type"
                value={campaignType}
                onChange={(event) => setCampaignType(event.target.value as CampaignType)}
                options={[
                  { value: 'character-acquisition', label: 'Get a character' },
                  { value: 'team-polish', label: 'Polish a team' },
                ]}
              />

              {campaignType === 'character-acquisition' ? (
                <Select
                  label="Target character"
                  value={selectedCharacterKey}
                  onChange={(event) => {
                    const nextKey = event.target.value;
                    setSelectedCharacterKey(nextKey);
                    setIncludePullTarget(!ownedKeys.has(nextKey.toLowerCase()));
                  }}
                  options={characterOptions}
                />
              ) : (
                <Select
                  label="Target team"
                  value={selectedTeamId}
                  onChange={(event) => setSelectedTeamId(event.target.value)}
                  options={teamOptions}
                  disabled={teams.length === 0}
                />
              )}

              <Select
                label="Build goal"
                value={buildGoal}
                onChange={(event) => setBuildGoal(event.target.value as CampaignBuildGoal)}
                options={BUILD_GOAL_OPTIONS}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                label="Priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                options={PRIORITY_OPTIONS}
              />
              <Input
                label="Deadline"
                type="date"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
              />
              <Input
                label="Copies"
                type="number"
                min="1"
                max="7"
                value={desiredCopies}
                onChange={(event) => setDesiredCopies(event.target.value)}
                disabled={campaignType !== 'character-acquisition' || !includePullTarget}
              />
              <Input
                label="Pull budget"
                type="number"
                min="0"
                value={maxPullBudget}
                onChange={(event) => setMaxPullBudget(event.target.value)}
                disabled={campaignType !== 'character-acquisition' || !includePullTarget}
              />
            </div>

            {campaignType === 'character-acquisition' && (
              <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={includePullTarget}
                  onChange={(event) => setIncludePullTarget(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-primary-600 focus:ring-primary-500"
                />
                Include pull plan
              </label>
            )}

            <Input
              label="Notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional context, target constellation, or farming notes"
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button
              type="submit"
              loading={isCreating}
              disabled={campaignType === 'team-polish' && teams.length === 0}
            >
              <Plus className="w-4 h-4" />
              Create Campaign
            </Button>
          </form>
        </CardContent>
      </Card>

      {mutationError && (
        <div className="rounded-lg border border-red-700 bg-red-950/30 p-3 text-sm text-red-200">
          {mutationError}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {campaigns.length === 0 ? (
          <Card className="xl:col-span-2">
            <CardContent className="py-10 text-center">
              <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-slate-300 mb-1">No campaigns yet</h2>
              <p className="text-slate-400">
                Create a character acquisition or team polish campaign to turn your account data into next actions.
              </p>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              plan={plans[campaign.id]}
              isPlanLoading={plansCalculating && !plans[campaign.id]}
              onStatusChange={updateStatus}
              onDelete={async (id) => {
                try {
                  setMutationError('');
                  await deleteCampaign(id);
                } catch {
                  setMutationError('Failed to delete campaign.');
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CampaignDraftCard({
  campaignType,
  characterKey,
  selectedTeam,
  buildGoal,
  priority,
  includePullTarget,
  desiredCopies,
  maxPullBudget,
  matchingCampaign,
  isCreating,
  onCreate,
  onClear,
}: {
  campaignType: CampaignType;
  characterKey: string;
  selectedTeam: Team | undefined;
  buildGoal: CampaignBuildGoal;
  priority: Campaign['priority'];
  includePullTarget: boolean;
  desiredCopies: string;
  maxPullBudget: string;
  matchingCampaign: Campaign | undefined;
  isCreating: boolean;
  onCreate: () => Promise<void>;
  onClear: () => void;
}) {
  const isTeamCampaign = campaignType === 'team-polish';
  const title = isTeamCampaign
    ? `Polish ${selectedTeam?.name ?? 'selected team'}`
    : `Recruit ${getDisplayName(characterKey)}`;
  const Icon = isTeamCampaign ? UsersRound : Sparkles;
  const copyCount = Math.max(1, Number(desiredCopies) || 1);
  const pullLabel = !isTeamCampaign && includePullTarget
    ? `${copyCount} ${copyCount === 1 ? 'copy' : 'copies'}${maxPullBudget ? `, ${maxPullBudget} pull budget` : ''}`
    : 'No pull plan';
  const targetLabel = isTeamCampaign
    ? `${selectedTeam?.characterKeys.length ?? 0} members`
    : getDisplayName(characterKey);

  return (
    <Card className="border-primary-900/60 bg-primary-950/20">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-lg bg-primary-500/20 p-2">
              <Icon className="h-5 w-5 text-primary-300" />
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="primary">Campaign draft</Badge>
                {matchingCampaign && <Badge variant="warning">Existing campaign found</Badge>}
              </div>
              <h2 className="truncate text-lg font-semibold text-slate-100">{title}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">{targetLabel}</Badge>
                <Badge variant="outline">{formatBuildGoal(buildGoal)}</Badge>
                <Badge variant="outline">P{priority}</Badge>
                <Badge variant="outline">{pullLabel}</Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            {matchingCampaign ? (
              <Link
                to={`/campaigns/${matchingCampaign.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                <ArrowRight className="h-4 w-4" />
                Open Existing
              </Link>
            ) : (
              <Button type="button" onClick={onCreate} loading={isCreating}>
                <Plus className="h-4 w-4" />
                Create Draft
              </Button>
            )}
            {matchingCampaign && (
              <Button type="button" variant="secondary" onClick={onCreate} loading={isCreating}>
                <Plus className="h-4 w-4" />
                Create Anyway
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={onClear} disabled={isCreating}>
              Clear Draft
            </Button>
          </div>
        </div>

        {matchingCampaign && (
          <p className="rounded-lg bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
            {matchingCampaign.name} is already {matchingCampaign.status}. Open it to continue, or create a separate campaign if this is a different goal.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function CampaignCard({
  campaign,
  plan,
  isPlanLoading,
  onStatusChange,
  onDelete,
}: {
  campaign: Campaign;
  plan: CampaignPlan | undefined;
  isPlanLoading: boolean;
  onStatusChange: (campaign: Campaign, status: CampaignStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isCharacterCampaign = campaign.type === 'character-acquisition';
  const Icon = isCharacterCampaign ? Sparkles : UsersRound;
  const targetCount = campaign.characterTargets.length;
  const pullTargets = getCampaignPullTargets(campaign);
  const pullCopyGoal = pullTargets.reduce((sum, target) => sum + target.desiredCopies, 0);
  const pullGoalLabel = pullTargets.length > 0
    ? `${pullCopyGoal} ${pullCopyGoal === 1 ? 'copy' : 'copies'}`
    : 'None';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-primary-500/20">
              <Icon className="w-5 h-5 text-primary-400" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-100 truncate">{campaign.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant={STATUS_BADGE[campaign.status]}>{campaign.status}</Badge>
                {plan && <Badge variant={PLAN_STATUS_BADGE[plan.status]}>{plan.overallPercent}% ready</Badge>}
                <Badge variant="outline">P{campaign.priority}</Badge>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(campaign.deadline)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-500 mb-1">Targets</div>
            <div className="text-lg font-semibold text-slate-100">{targetCount}</div>
          </div>
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-500 mb-1">Pull Goal</div>
            <div className="text-lg font-semibold text-slate-100">{pullGoalLabel}</div>
          </div>
        </div>

        {isPlanLoading && (
          <div className="grid grid-cols-3 gap-3">
            <div className="h-16 bg-slate-900 rounded-lg animate-pulse" />
            <div className="h-16 bg-slate-900 rounded-lg animate-pulse" />
            <div className="h-16 bg-slate-900 rounded-lg animate-pulse" />
          </div>
        )}

        {plan && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PlanStat
              label="Pulls"
              value={`${plan.pullReadiness.percent}%`}
              detail={
                plan.pullReadiness.hasTargets
                  ? `${plan.pullReadiness.availablePulls}/${plan.pullReadiness.targetPulls}`
                  : 'No pull target'
              }
            />
            <PlanStat
              label="Build"
              value={`${plan.buildReadiness.percent}%`}
              detail={`${plan.buildReadiness.readyCount ?? 0}/${plan.buildReadiness.targetCount} built`}
            />
            <PlanStat
              label="Materials"
              value={`${plan.materialReadiness.percent}%`}
              detail={
                plan.materialReadiness.hasTargets
                  ? `${plan.materialReadiness.deficitMaterials} deficits`
                  : 'No materials'
              }
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {campaign.characterTargets.map((target) => (
            <Badge key={target.id} variant={target.ownership === 'owned' ? 'secondary' : 'primary'}>
              {getDisplayName(target.characterKey)} - {target.buildGoal}
            </Badge>
          ))}
        </div>

        {campaign.notes && (
          <p className="text-sm text-slate-400 bg-slate-900/60 rounded-lg p-3">{campaign.notes}</p>
        )}

        {plan && (
          <div className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Next Actions</div>
            <div className="space-y-2">
              {plan.nextActions.slice(0, 3).map((action) => (
                <div
                  key={action.id}
                  className="flex items-start justify-between gap-3 rounded-lg bg-slate-900/70 p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-200">{action.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{action.detail}</div>
                  </div>
                  <Badge variant={ACTION_BADGE[action.category]}>{action.category}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            to={`/campaigns/${campaign.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-600"
          >
            <ArrowRight className="w-4 h-4" />
            Open
          </Link>
          {campaign.status === 'active' ? (
            <Button size="sm" variant="secondary" onClick={() => onStatusChange(campaign, 'paused')}>
              <CirclePause className="w-4 h-4" />
              Pause
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => onStatusChange(campaign, 'active')}>
              <CirclePlay className="w-4 h-4" />
              Activate
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => onStatusChange(campaign, 'completed')}>
            <CheckCircle2 className="w-4 h-4" />
            Complete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onStatusChange(campaign, 'archived')}>
            <Archive className="w-4 h-4" />
            Archive
          </Button>
          <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>

        <DeleteConfirmModal
          isOpen={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            onDelete(campaign.id);
          }}
          title="Delete Campaign"
          itemName={campaign.name}
          description="This will permanently delete the campaign, including all targets and planning data. This action cannot be undone."
        />
      </CardContent>
    </Card>
  );
}

function PlanStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="bg-slate-900 rounded-lg p-3">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-lg font-semibold text-slate-100">{value}</div>
      <div className="text-xs text-slate-500 truncate">{detail}</div>
    </div>
  );
}

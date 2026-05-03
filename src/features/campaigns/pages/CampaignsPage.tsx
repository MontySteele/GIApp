import { FormEvent, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useCharacters } from '@/features/roster/hooks/useCharacters';
import { useTeams } from '@/features/roster/hooks/useTeams';
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
import { useCampaigns } from '../hooks/useCampaigns';
import { useCampaignPlans } from '../hooks/useCampaignPlans';

const BUILD_GOAL_OPTIONS: { value: CampaignBuildGoal; label: string }[] = [
  { value: 'functional', label: 'Functional' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'full', label: 'Full' },
];

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

function toPriority(value: string): Campaign['priority'] {
  const parsed = Number(value);
  if (parsed >= 1 && parsed <= 5) {
    return parsed as Campaign['priority'];
  }
  return 3;
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

export default function CampaignsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { campaigns, createCampaign, updateCampaign, deleteCampaign, isLoading } = useCampaigns();
  const { characters, isLoading: charactersLoading } = useCharacters();
  const { teams, isLoading: teamsLoading } = useTeams();

  const initialTeamId = searchParams.get('team') ?? '';
  const [campaignType, setCampaignType] = useState<CampaignType>(
    initialTeamId ? 'team-polish' : 'character-acquisition'
  );
  const [selectedCharacterKey, setSelectedCharacterKey] = useState(ALL_CHARACTERS[0]?.key ?? '');
  const [selectedTeamId, setSelectedTeamId] = useState(initialTeamId);
  const [buildGoal, setBuildGoal] = useState<CampaignBuildGoal>('comfortable');
  const [priority, setPriority] = useState('2');
  const [deadline, setDeadline] = useState('');
  const [desiredCopies, setDesiredCopies] = useState('1');
  const [maxPullBudget, setMaxPullBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const { plans, isCalculating: plansCalculating } = useCampaignPlans(campaigns);

  const ownedKeys = useMemo(
    () => new Set(characters.map((character) => character.key.toLowerCase())),
    [characters]
  );

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

  const resetForm = () => {
    setDeadline('');
    setDesiredCopies('1');
    setMaxPullBudget('');
    setNotes('');
    setError('');
    setSearchParams({}, { replace: true });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (campaignType === 'character-acquisition' && !selectedCharacterKey) {
      setError('Choose a character target.');
      return;
    }

    if (campaignType === 'team-polish' && !selectedTeam) {
      setError('Choose a team to polish.');
      return;
    }

    const copies = Math.max(1, Number(desiredCopies) || 1);
    const characterTargets =
      campaignType === 'character-acquisition'
        ? [buildCharacterTarget(selectedCharacterKey, ownedKeys, buildGoal)]
        : getTeamMemberTargets(selectedTeam, ownedKeys, buildGoal);

    const pullTargets =
      campaignType === 'character-acquisition'
        ? [buildPullTarget(selectedCharacterKey, copies, maxPullBudget)]
        : [];

    const campaignName =
      campaignType === 'character-acquisition'
        ? `Recruit ${getDisplayName(selectedCharacterKey)}`
        : `Polish ${selectedTeam?.name ?? 'Team'}`;

    await createCampaign({
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

    resetForm();
  };

  const updateStatus = async (campaign: Campaign, status: CampaignStatus) => {
    await updateCampaign(campaign.id, { status });
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
                  onChange={(event) => setSelectedCharacterKey(event.target.value)}
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
                disabled={campaignType !== 'character-acquisition'}
              />
              <Input
                label="Pull budget"
                type="number"
                min="0"
                value={maxPullBudget}
                onChange={(event) => setMaxPullBudget(event.target.value)}
                disabled={campaignType !== 'character-acquisition'}
              />
            </div>

            <Input
              label="Notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional context, target constellation, or farming notes"
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button type="submit" disabled={campaignType === 'team-polish' && teams.length === 0}>
              <Plus className="w-4 h-4" />
              Create Campaign
            </Button>
          </form>
        </CardContent>
      </Card>

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
              onDelete={deleteCampaign}
            />
          ))
        )}
      </div>
    </div>
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
  const isCharacterCampaign = campaign.type === 'character-acquisition';
  const Icon = isCharacterCampaign ? Sparkles : UsersRound;
  const targetCount = campaign.characterTargets.length;
  const pullTarget = campaign.pullTargets[0];
  const pullGoalLabel = pullTarget
    ? `${pullTarget.desiredCopies} ${pullTarget.desiredCopies === 1 ? 'copy' : 'copies'}`
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
              detail={`${plan.buildReadiness.ownedCount}/${plan.buildReadiness.targetCount} owned`}
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
          <Button size="sm" variant="danger" onClick={() => onDelete(campaign.id)}>
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
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

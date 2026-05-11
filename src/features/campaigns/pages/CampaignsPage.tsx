import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Plus,
  Target,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import SearchableSelect from '@/components/ui/SearchableSelect';
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
import CampaignCard from '../components/CampaignCard';
import CampaignDraftCard from '../components/CampaignDraftCard';
import { useCampaignPlanContext } from '../hooks/useCampaignPlanContext';
import { useCampaigns } from '../hooks/useCampaigns';
import { useCampaignPlans } from '../hooks/useCampaignPlans';
import { sortCampaignsForControlCenter } from '../lib/campaignOrdering';

const BUILD_GOAL_OPTIONS: { value: CampaignBuildGoal; label: string }[] = [
  { value: 'functional', label: 'Functional' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'full', label: 'Full' },
];

const BUILD_GOAL_VALUES = new Set<CampaignBuildGoal>(['functional', 'comfortable', 'full']);
const CAMPAIGN_TYPE_VALUES = new Set<CampaignType>([
  'character-acquisition',
  'character-polish',
  'team-polish',
]);
const DEFAULT_CHARACTER_KEY = ALL_CHARACTERS[0]?.key ?? '';

const PRIORITY_OPTIONS = [
  { value: '1', label: '1 - Must do' },
  { value: '2', label: '2 - High' },
  { value: '3', label: '3 - Medium' },
  { value: '4', label: '4 - Low' },
  { value: '5', label: '5 - Someday' },
];

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
  const normalized = value.trim();
  if (!normalized) return DEFAULT_CHARACTER_KEY;
  return ALL_CHARACTERS.find(
    (character) =>
      character.key.toLowerCase() === normalized.toLowerCase() ||
      character.name.toLowerCase() === normalized.toLowerCase()
  )?.key ?? normalized;
}

function getCampaignTypeParam(value: string | null, hasTeamTarget = false): CampaignType {
  if (hasTeamTarget) return 'team-polish';
  return CAMPAIGN_TYPE_VALUES.has(value as CampaignType)
    ? (value as CampaignType)
    : 'character-acquisition';
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

function getDeadlineParam(value: string | null): string {
  if (!value) return '';
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? '' : value;
}

function getConstellationParam(value: string | null): string {
  if (!value) return '';
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 6) return '';
  return String(parsed);
}

function getConstellationValue(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 6 ? parsed : null;
}

function getCopiesForTargetConstellation(currentConstellation: number, targetConstellation: number): string {
  return String(Math.max(1, targetConstellation - currentConstellation));
}

function getPullPlanParam(value: string | null): boolean | null {
  if (value === null) return null;
  return !['0', 'false', 'no'].includes(value.toLowerCase());
}

function isClosedCampaign(campaign: Campaign): boolean {
  return campaign.status === 'completed' || campaign.status === 'archived';
}

function buildCharacterTarget(
  characterKey: string,
  ownedKeys: Set<string>,
  buildGoal: CampaignBuildGoal,
  targetConstellation: number | null = null
): CampaignCharacterTarget {
  return {
    id: crypto.randomUUID(),
    characterKey,
    ownership: ownedKeys.has(characterKey.toLowerCase()) ? 'owned' : 'wishlist',
    buildGoal,
    ...(targetConstellation !== null
      ? { notes: `Target constellation C${targetConstellation}` }
      : {}),
  };
}

function buildPullTarget(
  characterKey: string,
  desiredCopies: number,
  maxPullBudget: string,
  targetConstellation: number | null = null
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
    ...(targetConstellation !== null
      ? { notes: `Target constellation C${targetConstellation}` }
      : {}),
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

function getCampaignDraftTitle(
  campaignType: CampaignType,
  characterKey: string,
  selectedTeam: Team | undefined,
  targetConstellation: number | null
): string {
  if (campaignType === 'team-polish') {
    return `Polish ${selectedTeam?.name ?? 'selected team'}`;
  }

  if (campaignType === 'character-polish') {
    return `Polish ${getDisplayName(characterKey)}`;
  }

  return targetConstellation !== null
    ? `Chase C${targetConstellation} ${getDisplayName(characterKey)}`
    : `Recruit ${getDisplayName(characterKey)}`;
}

function getCampaignDraftTargetLabel(
  campaignType: CampaignType,
  characterKey: string,
  selectedTeam: Team | undefined
): string {
  return campaignType === 'team-polish'
    ? `${selectedTeam?.characterKeys.length ?? 0} members`
    : getDisplayName(characterKey);
}

function getCampaignDraftPullLabel(
  campaignType: CampaignType,
  includePullTarget: boolean,
  desiredCopies: string,
  maxPullBudget: string
): string {
  if (campaignType !== 'character-acquisition' || !includePullTarget) {
    return 'No pull plan';
  }

  const copyCount = Math.max(1, Number(desiredCopies) || 1);
  return `${copyCount} ${copyCount === 1 ? 'copy' : 'copies'}${
    maxPullBudget ? `, ${maxPullBudget} pull budget` : ''
  }`;
}

function isOpenCampaign(campaign: Campaign): boolean {
  return campaign.status === 'active' || campaign.status === 'paused';
}

function findMatchingOpenCampaign(
  campaigns: Campaign[],
  campaignType: CampaignType,
  characterKey: string,
  teamId: string,
  targetConstellation: number | null = null
): Campaign | undefined {
  return campaigns.find((campaign) => {
    if (!isOpenCampaign(campaign) || campaign.type !== campaignType) {
      return false;
    }

    if (campaignType === 'character-acquisition' || campaignType === 'character-polish') {
      const matchesCharacter = campaign.characterTargets.some(
        (target) => target.characterKey.toLowerCase() === characterKey.toLowerCase()
      );
      if (!matchesCharacter) return false;
      if (campaignType === 'character-polish') return true;
      if (targetConstellation === null) return true;

      const targetLabel = `c${targetConstellation}`;
      return campaign.name.toLowerCase().includes(targetLabel) ||
        campaign.notes.toLowerCase().includes(targetLabel) ||
        campaign.characterTargets.some((target) => target.notes?.toLowerCase().includes(targetLabel));
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
    getCampaignTypeParam(searchParams.get('type'), Boolean(initialTeamId))
  );
  const [selectedCharacterKey, setSelectedCharacterKey] = useState(initialCharacterKey);
  const [selectedTeamId, setSelectedTeamId] = useState(initialTeamId);
  const [buildGoal, setBuildGoal] = useState<CampaignBuildGoal>(getBuildGoalParam(searchParams.get('buildGoal')));
  const [priority, setPriority] = useState(String(toPriority(searchParams.get('priority') ?? '2')));
  const [deadline, setDeadline] = useState(getDeadlineParam(searchParams.get('deadline')));
  const [desiredCopies, setDesiredCopies] = useState(getPositiveIntegerParam(searchParams.get('copies'), '1'));
  const [targetConstellation, setTargetConstellation] = useState(getConstellationParam(searchParams.get('constellation')));
  const [maxPullBudget, setMaxPullBudget] = useState(getBudgetParam(searchParams.get('budget')));
  const [includePullTarget, setIncludePullTarget] = useState(getPullPlanParam(searchParams.get('pullPlan')) ?? true);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
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

  const selectedCharacter = useMemo(
    () => characters.find((character) => character.key.toLowerCase() === selectedCharacterKey.toLowerCase()),
    [characters, selectedCharacterKey]
  );

  const updateConstellationTarget = (value: string, characterConstellation = selectedCharacter?.constellation ?? 0) => {
    setTargetConstellation(value);
    const nextTarget = getConstellationValue(value);
    if (nextTarget === null) return;

    setIncludePullTarget(true);
    setDesiredCopies(getCopiesForTargetConstellation(characterConstellation, nextTarget));
  };

  useEffect(() => {
    if (!prefillSignature) return;

    const teamId = searchParams.get('team') ?? '';
    const characterKey = getCharacterParam(searchParams.get('character'));
    const nextCampaignType = getCampaignTypeParam(searchParams.get('type'), Boolean(teamId));
    const pullPlan = getPullPlanParam(searchParams.get('pullPlan'));

    if (teamId) {
      setCampaignType('team-polish');
      setSelectedTeamId(teamId);
    } else if (searchParams.has('character')) {
      setCampaignType(nextCampaignType);
      setSelectedCharacterKey(characterKey);
      setSelectedTeamId('');
    } else if (searchParams.has('type')) {
      setCampaignType(nextCampaignType);
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
    if (searchParams.has('constellation')) {
      setTargetConstellation(getConstellationParam(searchParams.get('constellation')));
    }
    if (searchParams.has('budget')) {
      setMaxPullBudget(getBudgetParam(searchParams.get('budget')));
    }
    if (searchParams.has('deadline')) {
      setDeadline(getDeadlineParam(searchParams.get('deadline')));
    }
    if (pullPlan !== null) {
      setIncludePullTarget(pullPlan);
    } else if (nextCampaignType === 'character-polish') {
      setIncludePullTarget(false);
    }
  }, [prefillSignature, searchParams]);

  const characterOptions = useMemo(
    () =>
      ALL_CHARACTERS
        .map((character) => ({
          value: character.key,
          label: character.name,
          ...(ownedKeys.has(character.key.toLowerCase()) ? { sublabel: 'Owned' } : {}),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [ownedKeys]
  );

  const ownedCharacterOptions = useMemo(
    () =>
      characters
        .map((character) => ({
          value: character.key,
          label: getDisplayName(character.key),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [characters]
  );

  const activeCharacterOptions = useMemo(
    () => {
      if (campaignType !== 'character-polish') return characterOptions;
      return ownedCharacterOptions.length > 0
        ? ownedCharacterOptions
        : [{ value: '', label: 'No owned characters yet' }];
    },
    [campaignType, characterOptions, ownedCharacterOptions]
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
  const hasOwnedCharacters = ownedCharacterOptions.length > 0;
  const hasCampaignPrefill = searchParams.has('character') || searchParams.has('team');
  const sortedCampaigns = useMemo(
    () => sortCampaignsForControlCenter(campaigns, plans),
    [campaigns, plans]
  );
  const openCampaigns = sortedCampaigns.filter((campaign) => !isClosedCampaign(campaign));
  const closedCampaigns = sortedCampaigns.filter(isClosedCampaign);
  const shouldShowCreateForm = campaigns.length === 0 || hasCampaignPrefill || showCreateForm;
  const targetConstellationValue = getConstellationValue(targetConstellation);
  const matchingOpenCampaign = useMemo(
    () => findMatchingOpenCampaign(
      campaigns,
      campaignType,
      selectedCharacterKey,
      selectedTeamId,
      targetConstellationValue
    ),
    [campaigns, campaignType, selectedCharacterKey, selectedTeamId, targetConstellationValue]
  );
  const campaignDraftTitle = getCampaignDraftTitle(
    campaignType,
    selectedCharacterKey,
    selectedTeam,
    targetConstellationValue
  );
  const campaignDraftTargetLabel = getCampaignDraftTargetLabel(
    campaignType,
    selectedCharacterKey,
    selectedTeam
  );
  const campaignDraftPullLabel = getCampaignDraftPullLabel(
    campaignType,
    includePullTarget,
    desiredCopies,
    maxPullBudget
  );
  const campaignDraftConstellationLabel =
    campaignType === 'character-acquisition' && targetConstellationValue !== null
      ? `C${targetConstellationValue} target`
      : null;

  const resetForm = () => {
    setDeadline('');
    setDesiredCopies('1');
    setTargetConstellation('');
    setMaxPullBudget('');
    setNotes('');
    setError('');
    setSearchParams({}, { replace: true });
  };

  useEffect(() => {
    if (hasCampaignPrefill) {
      setShowCreateForm(true);
    }
  }, [hasCampaignPrefill]);

  const handleCampaignTypeChange = (nextType: CampaignType) => {
    setCampaignType(nextType);
    setError('');

    if (nextType === 'team-polish') {
      setIncludePullTarget(false);
      return;
    }

    setSelectedTeamId('');

    if (nextType === 'character-polish') {
      const selectedIsOwned = ownedKeys.has(selectedCharacterKey.toLowerCase());
      setSelectedCharacterKey(selectedIsOwned ? selectedCharacterKey : (ownedCharacterOptions[0]?.value ?? ''));
      setIncludePullTarget(false);
      setTargetConstellation('');
      return;
    }

    setIncludePullTarget(!ownedKeys.has(selectedCharacterKey.toLowerCase()));
  };

  const createCampaignFromDraft = async (): Promise<string | null> => {
    setError('');
    const isSingleCharacterCampaign = campaignType !== 'team-polish';

    if (isSingleCharacterCampaign && !selectedCharacterKey) {
      setError('Choose a character target.');
      return null;
    }

    if (campaignType === 'character-polish' && !ownedKeys.has(selectedCharacterKey.toLowerCase())) {
      setError('Choose an owned character to polish.');
      return null;
    }

    if (campaignType === 'team-polish' && !selectedTeam) {
      setError('Choose a team to polish.');
      return null;
    }

    setIsCreating(true);
    const copies = Math.max(1, Number(desiredCopies) || 1);
    const targetConstellationValue = campaignType === 'character-acquisition'
      ? getConstellationValue(targetConstellation)
      : null;
    const characterTargets =
      isSingleCharacterCampaign
        ? [buildCharacterTarget(selectedCharacterKey, ownedKeys, buildGoal, targetConstellationValue)]
        : getTeamMemberTargets(selectedTeam, ownedKeys, buildGoal);

    const pullTargets =
      campaignType === 'character-acquisition' && includePullTarget
        ? [buildPullTarget(selectedCharacterKey, copies, maxPullBudget, targetConstellationValue)]
        : [];

    const campaignName =
      campaignType === 'character-acquisition'
        ? targetConstellationValue !== null
          ? `Chase C${targetConstellationValue} ${getDisplayName(selectedCharacterKey)}`
          : `Recruit ${getDisplayName(selectedCharacterKey)}`
        : campaignType === 'character-polish'
          ? `Polish ${getDisplayName(selectedCharacterKey)}`
        : `Polish ${selectedTeam?.name ?? 'Team'}`;
    const campaignNotes = notes || (
      campaignType === 'character-acquisition' && targetConstellationValue !== null
        ? `Target constellation: C${targetConstellationValue}.`
        : ''
    );

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
        notes: campaignNotes,
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

  const refreshPlan = async (campaign: Campaign) => {
    try {
      setMutationError('');
      await updateCampaign(campaign.id, { updatedAt: new Date().toISOString() });
    } catch {
      setMutationError(`Failed to refresh "${campaign.name}".`);
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
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary" className="w-fit">
            {campaigns.filter((campaign) => campaign.status === 'active').length} active
          </Badge>
          {campaigns.length > 0 && !shouldShowCreateForm && (
            <Button type="button" onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4" />
              New Campaign
            </Button>
          )}
        </div>
      </div>

      <AccountDataFreshnessCallout freshness={accountDataFreshness} context="campaign" />

      {hasCampaignPrefill && (
        <CampaignDraftCard
          campaignType={campaignType}
          title={campaignDraftTitle}
          targetLabel={campaignDraftTargetLabel}
          constellationLabel={campaignDraftConstellationLabel}
          buildGoalLabel={formatBuildGoal(buildGoal)}
          priority={toPriority(priority)}
          pullLabel={campaignDraftPullLabel}
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

      {shouldShowCreateForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-400" />
                <h2 className="text-lg font-semibold">New Campaign</h2>
              </div>
              {campaigns.length > 0 && !hasCampaignPrefill && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowCreateForm(false)}>
                  Hide
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Campaign type"
                value={campaignType}
                onChange={(event) => handleCampaignTypeChange(event.target.value as CampaignType)}
                options={[
                  { value: 'character-acquisition', label: 'Get a character' },
                  { value: 'character-polish', label: 'Polish a character' },
                  { value: 'team-polish', label: 'Polish a team' },
                ]}
              />

              {campaignType === 'character-acquisition' ? (
                <SearchableSelect
                  label="Target character"
                  placeholder="Search or type a future character..."
                  value={selectedCharacterKey}
                  onChange={(nextKey) => {
                    const nextCharacter = characters.find(
                      (character) => character.key.toLowerCase() === nextKey.toLowerCase()
                    );
                    const nextTarget = getConstellationValue(targetConstellation);
                    setSelectedCharacterKey(nextKey);
                    setIncludePullTarget(!ownedKeys.has(nextKey.toLowerCase()));
                    if (nextTarget !== null) {
                      setIncludePullTarget(true);
                      setDesiredCopies(getCopiesForTargetConstellation(nextCharacter?.constellation ?? 0, nextTarget));
                    }
                  }}
                  options={characterOptions}
                  allowFreeText
                />
              ) : campaignType === 'character-polish' ? (
                <Select
                  label="Owned character"
                  value={selectedCharacterKey}
                  onChange={(event) => {
                    const nextKey = event.target.value;
                    setSelectedCharacterKey(nextKey);
                    setIncludePullTarget(false);
                  }}
                  options={activeCharacterOptions}
                  disabled={!hasOwnedCharacters}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                label="Target constellation"
                type="number"
                min="0"
                max="6"
                value={targetConstellation}
                onChange={(event) => updateConstellationTarget(event.target.value)}
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
              disabled={
                (campaignType === 'team-polish' && teams.length === 0) ||
                (campaignType === 'character-polish' && !hasOwnedCharacters)
              }
            >
              <Plus className="w-4 h-4" />
              Create Campaign
            </Button>
            </form>
          </CardContent>
        </Card>
      )}

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
                Create a character, build, or team campaign to turn your account data into next actions.
              </p>
            </CardContent>
          </Card>
        ) : openCampaigns.length === 0 ? (
          <Card className="xl:col-span-2">
            <CardContent className="py-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-slate-300 mb-1">No active campaigns</h2>
              <p className="text-slate-400">
                Start a new campaign or reopen one below when you have a target to chase.
              </p>
            </CardContent>
          </Card>
        ) : (
          openCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              plan={plans[campaign.id]}
              isPlanLoading={plansCalculating && !plans[campaign.id]}
              dataFreshnessStatus={accountDataFreshness.status}
              onStatusChange={updateStatus}
              onRefresh={refreshPlan}
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

      {closedCampaigns.length > 0 && (
        <details className="rounded-lg border border-slate-800 bg-slate-900/30">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-300">
            Completed and archived campaigns ({closedCampaigns.length})
          </summary>
          <div className="grid grid-cols-1 gap-4 border-t border-slate-800 p-4 xl:grid-cols-2">
            {closedCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                plan={plans[campaign.id]}
                isPlanLoading={plansCalculating && !plans[campaign.id]}
                dataFreshnessStatus={accountDataFreshness.status}
                onStatusChange={updateStatus}
                onRefresh={refreshPlan}
                onDelete={async (id) => {
                  try {
                    setMutationError('');
                    await deleteCampaign(id);
                  } catch {
                    setMutationError('Failed to delete campaign.');
                  }
                }}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

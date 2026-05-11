import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Save, Target, X } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import Select from '@/components/ui/Select';
import { ALL_CHARACTERS } from '@/lib/constants/characterList';
import { getDisplayName } from '@/lib/gameData';
import { formatCampaignDate } from '../lib/campaignOrdering';
import type { Campaign, CampaignBuildGoal, CampaignCharacterTarget } from '@/types';

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

interface CampaignSetupCardProps {
  campaign: Campaign;
  ownedKeys: Set<string>;
  onSave: (updates: Partial<Omit<Campaign, 'id' | 'createdAt'>>) => Promise<void>;
}

function toPriority(value: string): Campaign['priority'] {
  const parsed = Number(value);
  if (parsed >= 1 && parsed <= 5) {
    return parsed as Campaign['priority'];
  }
  return 3;
}

function clampCopies(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.min(7, Math.floor(parsed)));
}

function parsePullBudget(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
}

function getTargetDraft(campaign: Campaign): CampaignCharacterTarget[] {
  return campaign.characterTargets.map((target) => ({ ...target }));
}

function buildDraftTarget(
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

function SetupStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-900 p-3">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-sm font-medium text-slate-100">{value}</div>
    </div>
  );
}

function formatCampaignType(type: Campaign['type']): string {
  if (type === 'team-polish') return 'Team polish';
  if (type === 'character-polish') return 'Character polish';
  return 'Character acquisition';
}

export default function CampaignSetupCard({
  campaign,
  ownedKeys,
  onSave,
}: CampaignSetupCardProps) {
  const firstPullTarget = campaign.pullTargets[0];
  const [isEditing, setIsEditing] = useState(false);
  const [draftPriority, setDraftPriority] = useState(String(campaign.priority));
  const [draftDeadline, setDraftDeadline] = useState(campaign.deadline ?? '');
  const [draftNotes, setDraftNotes] = useState(campaign.notes);
  const [draftTargets, setDraftTargets] = useState<CampaignCharacterTarget[]>(
    () => getTargetDraft(campaign)
  );
  const [targetToAdd, setTargetToAdd] = useState('');
  const [draftIncludePullTarget, setDraftIncludePullTarget] = useState(campaign.pullTargets.length > 0);
  const [draftCopies, setDraftCopies] = useState(String(firstPullTarget?.desiredCopies ?? 1));
  const [draftPullBudget, setDraftPullBudget] = useState(
    firstPullTarget?.maxPullBudget ? String(firstPullTarget.maxPullBudget) : ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const resetDraft = useCallback(() => {
    const pullTarget = campaign.pullTargets[0];
    setDraftPriority(String(campaign.priority));
    setDraftDeadline(campaign.deadline ?? '');
    setDraftNotes(campaign.notes);
    setDraftTargets(getTargetDraft(campaign));
    setTargetToAdd('');
    setDraftIncludePullTarget(campaign.pullTargets.length > 0);
    setDraftCopies(String(pullTarget?.desiredCopies ?? 1));
    setDraftPullBudget(pullTarget?.maxPullBudget ? String(pullTarget.maxPullBudget) : '');
  }, [campaign]);

  useEffect(() => {
    if (!isEditing) {
      resetDraft();
    }
  }, [isEditing, resetDraft]);

  const startEditing = () => {
    resetDraft();
    setIsEditing(true);
  };

  const cancelEditing = () => {
    resetDraft();
    setIsEditing(false);
  };

  const updateBuildGoal = (targetId: string, buildGoal: CampaignBuildGoal) => {
    setDraftTargets((current) =>
      current.map((target) => (target.id === targetId ? { ...target, buildGoal } : target))
    );
  };

  const removeTarget = (targetId: string) => {
    setDraftTargets((current) => current.filter((target) => target.id !== targetId));
  };

  const addTarget = () => {
    if (!targetToAdd || draftTargets.some((target) => target.characterKey === targetToAdd)) return;

    const defaultGoal = draftTargets[0]?.buildGoal ?? 'comfortable';
    setDraftTargets((current) => [
      ...current,
      buildDraftTarget(targetToAdd, ownedKeys, defaultGoal),
    ]);
    setTargetToAdd('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveError('');

    try {
      const characterTargets = draftTargets;

      let pullTargets = campaign.pullTargets;
      if (campaign.type === 'character-acquisition') {
        if (!draftIncludePullTarget) {
          pullTargets = [];
        } else {
          const targetKey = characterTargets[0]?.characterKey;
          const existingPullTarget = campaign.pullTargets[0];
          if (existingPullTarget) {
            pullTargets = [
              {
                ...existingPullTarget,
                desiredCopies: clampCopies(draftCopies),
                maxPullBudget: parsePullBudget(draftPullBudget),
              },
            ];
          } else if (targetKey) {
            pullTargets = [
              {
                id: crypto.randomUUID(),
                itemKey: targetKey,
                itemType: 'character',
                bannerType: 'character',
                desiredCopies: clampCopies(draftCopies),
                maxPullBudget: parsePullBudget(draftPullBudget),
                isConfirmed: false,
              },
            ];
          }
        }
      }

      const updates: Partial<Omit<Campaign, 'id' | 'createdAt'>> = {
        priority: toPriority(draftPriority),
        deadline: draftDeadline || undefined,
        notes: draftNotes,
        characterTargets,
        pullTargets,
      };

      if (campaign.type === 'team-polish') {
        updates.teamTarget = {
          ...(campaign.teamTarget ?? {}),
          name: campaign.teamTarget?.name ?? campaign.name,
          memberKeys: characterTargets.map((target) => target.characterKey),
        };
      }

      await onSave(updates);
      setIsEditing(false);
    } catch {
      setSaveError('Failed to save target setup. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const pullSummary = firstPullTarget
    ? `${firstPullTarget.desiredCopies} ${firstPullTarget.desiredCopies === 1 ? 'copy' : 'copies'}${
        firstPullTarget.maxPullBudget ? `, ${firstPullTarget.maxPullBudget} pull budget` : ''
      }`
    : 'No pull target';
  const selectedTargetKeys = useMemo(
    () => new Set(draftTargets.map((target) => target.characterKey)),
    [draftTargets]
  );
  const targetOptions = useMemo(
    () =>
      ALL_CHARACTERS
        .filter((character) => !selectedTargetKeys.has(character.key))
        .map((character) => ({
          value: character.key,
          label: character.name,
          sublabel: `${character.rarity} star ${character.element} ${character.weapon}`,
        })),
    [selectedTargetKeys]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold">Target Setup</h2>
          </div>
          {isEditing ? (
            <Button type="button" size="sm" variant="ghost" onClick={cancelEditing}>
              <X className="w-4 h-4" />
              Cancel
            </Button>
          ) : (
            <Button type="button" size="sm" variant="secondary" onClick={startEditing}>
              <Edit2 className="w-4 h-4" />
              Edit Setup
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Select
                label="Priority"
                value={draftPriority}
                onChange={(event) => setDraftPriority(event.target.value)}
                options={PRIORITY_OPTIONS}
              />
              <Input
                label="Deadline"
                type="date"
                value={draftDeadline}
                onChange={(event) => setDraftDeadline(event.target.value)}
              />
              <Input
                label="Notes"
                value={draftNotes}
                onChange={(event) => setDraftNotes(event.target.value)}
                placeholder="Banner timing, artifact caveats, or farming reminders"
              />
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-300">Target Lineup</div>
                  <p className="mt-1 text-xs text-slate-500">
                    Targets can include owned and wishlist characters.
                  </p>
                </div>
                {campaign.type === 'team-polish' && (
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-80 sm:flex-row sm:items-end">
                    <SearchableSelect
                      label="Add target"
                      placeholder="Search characters..."
                      options={targetOptions}
                      value={targetToAdd}
                      onChange={setTargetToAdd}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={addTarget}
                      disabled={!targetToAdd}
                    >
                      <Plus className="w-4 h-4" />
                      Add Target
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {draftTargets.map((target) => (
                  <div
                    key={target.id}
                    className="grid grid-cols-1 gap-3 rounded-lg bg-slate-900/70 p-3 md:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)_auto] md:items-end"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-100">
                        {getDisplayName(target.characterKey)}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge variant={target.ownership === 'owned' ? 'secondary' : 'primary'}>
                          {target.ownership}
                        </Badge>
                      </div>
                    </div>
                    <Select
                      label="Build goal"
                      value={target.buildGoal}
                      onChange={(event) => updateBuildGoal(target.id, event.target.value as CampaignBuildGoal)}
                      options={BUILD_GOAL_OPTIONS}
                    />
                    {campaign.type === 'team-polish' && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeTarget(target.id)}
                        disabled={draftTargets.length <= 1}
                      >
                        <X className="w-4 h-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {campaign.type === 'character-acquisition' && (
              <div className="space-y-3 rounded-lg bg-slate-900/70 p-3">
                <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={draftIncludePullTarget}
                    onChange={(event) => setDraftIncludePullTarget(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-primary-600 focus:ring-primary-500"
                  />
                  Include pull target
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="Desired copies"
                    type="number"
                    min="1"
                    max="7"
                    value={draftCopies}
                    onChange={(event) => setDraftCopies(event.target.value)}
                    disabled={!draftIncludePullTarget}
                  />
                  <Input
                    label="Pull budget"
                    type="number"
                    min="0"
                    value={draftPullBudget}
                    onChange={(event) => setDraftPullBudget(event.target.value)}
                    disabled={!draftIncludePullTarget}
                    description="Leave blank to use the default pull estimate."
                  />
                </div>
              </div>
            )}

            {saveError && (
              <p className="text-sm text-red-400">{saveError}</p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={isSaving}>
                <Save className="w-4 h-4" />
                Save Setup
              </Button>
              <Button type="button" variant="secondary" onClick={cancelEditing} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SetupStat label="Type" value={formatCampaignType(campaign.type)} />
              <SetupStat label="Priority" value={`P${campaign.priority}`} />
              <SetupStat label="Deadline" value={formatCampaignDate(campaign.deadline)} />
              <SetupStat label="Pull Target" value={pullSummary} />
            </div>
            <div className="flex flex-wrap gap-2">
              {campaign.characterTargets.map((target) => (
                <Badge key={target.id} variant={target.ownership === 'owned' ? 'secondary' : 'primary'}>
                  {getDisplayName(target.characterKey)} - {target.buildGoal}
                </Badge>
              ))}
            </div>
            <p className="rounded-lg bg-slate-900/70 p-3 text-sm text-slate-400">
              {campaign.notes || 'No notes for this target yet.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

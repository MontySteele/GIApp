import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Plus,
  Sparkles,
  Target,
  UsersRound,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { getDisplayName } from '@/lib/gameData';
import type {
  Campaign,
  CampaignType,
  Team,
} from '@/types';

interface CampaignDraftCardProps {
  campaignType: CampaignType;
  characterKey: string;
  selectedTeam: Team | undefined;
  buildGoalLabel: string;
  priority: Campaign['priority'];
  includePullTarget: boolean;
  desiredCopies: string;
  targetConstellationValue: number | null;
  maxPullBudget: string;
  matchingCampaign: Campaign | undefined;
  isCreating: boolean;
  onCreate: () => Promise<void>;
  onClear: () => void;
}

export default function CampaignDraftCard({
  campaignType,
  characterKey,
  selectedTeam,
  buildGoalLabel,
  priority,
  includePullTarget,
  desiredCopies,
  targetConstellationValue,
  maxPullBudget,
  matchingCampaign,
  isCreating,
  onCreate,
  onClear,
}: CampaignDraftCardProps) {
  const isTeamCampaign = campaignType === 'team-polish';
  const isCharacterPolishCampaign = campaignType === 'character-polish';
  const title = isTeamCampaign
    ? `Polish ${selectedTeam?.name ?? 'selected team'}`
    : isCharacterPolishCampaign
      ? `Polish ${getDisplayName(characterKey)}`
      : targetConstellationValue !== null
        ? `Chase C${targetConstellationValue} ${getDisplayName(characterKey)}`
        : `Recruit ${getDisplayName(characterKey)}`;
  const Icon = isTeamCampaign ? UsersRound : isCharacterPolishCampaign ? Target : Sparkles;
  const copyCount = Math.max(1, Number(desiredCopies) || 1);
  const pullLabel = campaignType === 'character-acquisition' && includePullTarget
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
                {targetConstellationValue !== null && (
                  <Badge variant="outline">C{targetConstellationValue} target</Badge>
                )}
                <Badge variant="outline">{buildGoalLabel}</Badge>
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

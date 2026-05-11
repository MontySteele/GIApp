/**
 * MaterialsTab - Dedicated material inventory and deficit tracking view
 *
 * Shows material inventory status and deficit priorities across all planned characters.
 */

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Flag,
  Package,
  AlertCircle,
  Coins,
  Pencil,
} from 'lucide-react';
import { useCharacters } from '@/features/roster/hooks/useCharacters';
import { useCampaignPlans } from '@/features/campaigns/hooks/useCampaignPlans';
import { useCampaigns } from '@/features/campaigns/hooks/useCampaigns';
import { getHighestPriorityCampaign } from '@/features/campaigns/lib/campaignOrdering';
import AccountDataFreshnessCallout from '@/features/sync/components/AccountDataFreshnessCallout';
import { useAccountDataFreshness } from '@/features/sync';
import { getAvailablePullsFromTracker } from '@/lib/services/resourceService';
import { useMaterials } from '../hooks/useMaterials';
import { useMultiCharacterPlan } from '../hooks/useMultiCharacterPlan';
import DeficitPriorityCard from '../components/DeficitPriorityCard';
import { MaterialsList } from '../components/MaterialsList';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  analyzeFarmingSchedule,
  getFarmingSummary,
  type FarmingRecommendation,
} from '../domain/farmingSchedule';
import type { Campaign } from '@/types';
import type { CampaignPlanContext } from '@/features/campaigns/domain/campaignPlan';
import type { MaterialRequirement } from '../domain/ascensionCalculator';

function normalizeMaterialKey(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findFocusedMaterial(
  materials: MaterialRequirement[],
  focusedMaterialKey: string | null
): MaterialRequirement | undefined {
  const normalizedFocus = normalizeMaterialKey(focusedMaterialKey);
  if (!normalizedFocus) return undefined;

  return materials.find((material) =>
    [material.key, material.name].some((value) => normalizeMaterialKey(value) === normalizedFocus)
  );
}

export default function MaterialsTab() {
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaign');
  const scope = searchParams.get('scope');
  const usePriorityFallback = scope === 'priority';
  const focusedMaterialKey = searchParams.get('material');
  const { characters, isLoading: loadingChars } = useCharacters();
  const { materials, isLoading: loadingMats, hasMaterials, totalMaterialTypes, setMaterial } = useMaterials();
  const { campaigns, isLoading: loadingCampaigns } = useCampaigns();
  const availablePulls = useLiveQuery(() => getAvailablePullsFromTracker(), []);
  const accountDataFreshness = useAccountDataFreshness();

  // Inline Mora editing state
  const [editingMora, setEditingMora] = useState(false);
  const [moraInput, setMoraInput] = useState('');
  const moraInputRef = useRef<HTMLInputElement>(null);

  // Get all main priority characters for material planning
  const mainCharacters = useMemo(
    () => characters.filter((c) => c.priority === 'main' || c.priority === 'secondary'),
    [characters]
  );

  // Multi-character plan for all priority characters
  const multiPlan = useMultiCharacterPlan({
    characters: mainCharacters,
    inventory: materials,
    initialGoalType: 'full',
  });

  const activeCampaign = useMemo(
    () => getHighestPriorityCampaign(campaigns),
    [campaigns]
  );
  const campaign = useMemo(
    () => {
      if (usePriorityFallback) return undefined;
      return campaignId
        ? campaigns.find((candidate) => candidate.id === campaignId)
        : activeCampaign;
    },
    [activeCampaign, campaignId, campaigns, usePriorityFallback]
  );
  const isDefaultCampaignContext = Boolean(campaign && !campaignId);
  const campaignList = useMemo(() => (campaign ? [campaign] : []), [campaign]);
  const campaignPlanContext = useMemo<CampaignPlanContext | null>(
    () => (
      availablePulls === undefined
        ? null
        : {
            characters,
            materials,
            availablePulls,
          }
    ),
    [availablePulls, characters, materials]
  );
  const {
    plans: campaignPlans,
    isLoading: loadingCampaignPlan,
    isCalculating: calculatingCampaignPlan,
  } = useCampaignPlans(
    campaignList,
    campaignPlanContext,
    loadingChars || loadingMats || availablePulls === undefined
  );
  const campaignPlan = campaign ? campaignPlans[campaign.id] : undefined;

  const isCampaignContext = Boolean(campaignId);
  const isLoading = loadingChars || loadingMats || (isCampaignContext && loadingCampaigns);
  const isCampaignPlanLoading = Boolean(
    campaign && (loadingCampaignPlan || calculatingCampaignPlan || !campaignPlan)
  );

  const activeSummary = campaignPlan?.materialReadiness.summary ?? multiPlan.summary;
  const activeGroupedMaterials = activeSummary?.groupedMaterials;
  const activeMaterials = useMemo(
    () => activeSummary?.aggregatedMaterials ?? [],
    [activeSummary]
  );
  const focusedMaterial = findFocusedMaterial(activeMaterials, focusedMaterialKey);
  const showPriorityFallback = !campaign;
  const farmingSchedule = useMemo(
    () => {
      if (!campaign || !campaignPlan) return null;
      const talentDeficits = activeMaterials.filter(
        (material) => material.category === 'talent' && material.deficit > 0
      );
      return talentDeficits.length > 0 ? analyzeFarmingSchedule(talentDeficits) : null;
    },
    [activeMaterials, campaign, campaignPlan]
  );

  const currentMora = materials['Mora'] ?? materials['mora'] ?? 0;

  const startEditingMora = useCallback(() => {
    setMoraInput(String(currentMora));
    setEditingMora(true);
  }, [currentMora]);

  const saveMora = useCallback(() => {
    setEditingMora(false);
    const parsed = parseInt(moraInput, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed !== currentMora) {
      setMaterial('Mora', parsed);
    }
  }, [moraInput, currentMora, setMaterial]);

  useEffect(() => {
    if (editingMora && moraInputRef.current) {
      moraInputRef.current.focus();
      moraInputRef.current.select();
    }
  }, [editingMora]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading materials...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">Material Inventory</h1>
        <p className="text-slate-400">
          {campaign
            ? `Target material plan for ${campaign.name}`
            : 'Track your materials and see what you need to farm for your priority characters'}
        </p>
      </div>

      {campaign && (
        <CampaignMaterialContextCard
          campaign={campaign}
          isDefaultCampaignContext={isDefaultCampaignContext}
          focusedMaterial={focusedMaterial}
          focusedMaterialKey={focusedMaterialKey}
        />
      )}

      {!campaign && usePriorityFallback && activeCampaign && (
        <PriorityFallbackContextCard activeCampaign={activeCampaign} />
      )}

      <AccountDataFreshnessCallout
        freshness={accountDataFreshness}
        context="materials"
      />

      {campaignId && !campaign && !loadingCampaigns && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-400">Target not found</h3>
              <p className="text-sm text-slate-400 mt-1">
                Showing priority character materials instead.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Inventory Status */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-500/20 rounded-lg">
            <Package className="w-5 h-5 text-primary-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">Material Inventory</span>
              <span className="text-sm text-slate-400">
                {hasMaterials ? `${totalMaterialTypes} types tracked` : 'No materials imported'}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm">
              <Coins className="w-4 h-4 text-yellow-500" />
              {editingMora ? (
                <div className="flex items-center gap-2">
                  <label className="text-slate-400">Mora:</label>
                  <input
                    ref={moraInputRef}
                    type="text"
                    inputMode="numeric"
                    value={moraInput}
                    onChange={(e) => setMoraInput(e.target.value.replace(/[^0-9]/g, ''))}
                    onBlur={saveMora}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveMora();
                      else if (e.key === 'Escape') setEditingMora(false);
                    }}
                    className="w-32 px-2 py-0.5 text-sm bg-slate-800 border border-primary-500 rounded text-slate-200 focus:outline-none"
                  />
                </div>
              ) : (
                <button
                  onClick={startEditingMora}
                  className="group flex items-center gap-1.5 text-slate-400 hover:text-primary-300 transition-colors"
                >
                  <span>
                    Mora: <span className="text-amber-400 font-medium">{currentMora.toLocaleString()}</span>
                  </span>
                  <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* No Materials Warning */}
      {!hasMaterials && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-400">No Materials Imported</h3>
              <p className="text-sm text-slate-400 mt-1">
                Import your materials using Irminsul or GOOD from the roster import flow to track
                inventory and calculate deficits.
              </p>
            </div>
          </div>
        </Card>
      )}

      {isCampaignPlanLoading && (
        <Card className="p-4">
          <div className="h-5 w-48 bg-slate-700 rounded animate-pulse mb-3" />
          <div className="h-16 bg-slate-900 rounded animate-pulse" />
        </Card>
      )}

      {!isCampaignPlanLoading && campaign && campaignPlan && farmingSchedule && (
        <CampaignFarmTodayCard
          campaign={campaign}
          campaignPlanPercent={campaignPlan.materialReadiness.percent}
          totalEstimatedResin={campaignPlan.materialReadiness.totalEstimatedResin}
          totalEstimatedDays={campaignPlan.materialReadiness.totalEstimatedDays}
          schedule={farmingSchedule}
        />
      )}

      {/* Deficit Priority */}
      {!isCampaignPlanLoading && activeGroupedMaterials && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {campaign ? 'Target Deficits' : 'Priority Deficits'}
          </h2>
          <DeficitPriorityCard
            groupedMaterials={activeGroupedMaterials}
            compact={false}
          />
        </div>
      )}

      {/* Full Materials List */}
      {!isCampaignPlanLoading && activeMaterials.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {campaign ? 'Target Materials' : 'All Required Materials'}
          </h2>
          <MaterialsList
            materials={activeMaterials}
            onUpdateMaterial={setMaterial}
            highlightedMaterialKey={focusedMaterialKey}
          />
        </div>
      )}

      {/* No Priority Characters */}
      {showPriorityFallback && mainCharacters.length === 0 && (
        <Card className="p-8 text-center">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">No Priority Characters</h3>
          <p className="text-slate-400">
            Set some characters as "Main" or "Secondary" priority in your Roster
            to see their material requirements here.
          </p>
        </Card>
      )}
    </div>
  );
}

function CampaignMaterialContextCard({
  campaign,
  isDefaultCampaignContext,
  focusedMaterial,
  focusedMaterialKey,
}: {
  campaign: Campaign;
  isDefaultCampaignContext: boolean;
  focusedMaterial: MaterialRequirement | undefined;
  focusedMaterialKey: string | null;
}) {
  return (
    <Card className="p-4 border-primary-900/60 bg-primary-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="primary">
              {isDefaultCampaignContext ? 'Active target' : 'Selected target'}
            </Badge>
            <span className="text-xs uppercase text-slate-500">Material plan</span>
          </div>
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 flex-shrink-0 text-primary-400" />
            <h2 className="truncate text-base font-semibold text-slate-100">{campaign.name}</h2>
          </div>
          {focusedMaterial ? (
            <p className="mt-1 text-sm text-slate-400">
              Focused on {focusedMaterial.name}: {focusedMaterial.deficit.toLocaleString()} still needed.
            </p>
          ) : focusedMaterialKey ? (
            <p className="mt-1 text-sm text-slate-400">
              The linked material is not currently blocking this target.
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-400">
              Showing only materials required by this target.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/campaigns/${campaign.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Target
          </Link>
          <Link
            to="/campaigns/materials?scope=priority"
            className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
          >
            Priority Materials
          </Link>
        </div>
      </div>
    </Card>
  );
}

function PriorityFallbackContextCard({ activeCampaign }: { activeCampaign: Campaign }) {
  return (
    <Card className="p-4 border-slate-800 bg-slate-900/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">Priority roster</Badge>
            <span className="text-xs uppercase text-slate-500">Fallback material plan</span>
          </div>
          <h2 className="text-base font-semibold text-slate-100">Showing roster priority materials</h2>
          <p className="mt-1 text-sm text-slate-400">
            Active target context is available for {activeCampaign.name}.
          </p>
        </div>
        <Link
          to={`/campaigns/materials?campaign=${encodeURIComponent(activeCampaign.id)}`}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          <Flag className="h-4 w-4" />
          Active Target
        </Link>
      </div>
    </Card>
  );
}

function CampaignFarmTodayCard({
  campaign,
  campaignPlanPercent,
  totalEstimatedResin,
  totalEstimatedDays,
  schedule,
}: {
  campaign: Campaign;
  campaignPlanPercent: number;
  totalEstimatedResin: number;
  totalEstimatedDays: number;
  schedule: ReturnType<typeof analyzeFarmingSchedule>;
}) {
  const waitEntries = Object.entries(schedule.waitFor)
    .filter(([, recommendations]) => recommendations.length > 0)
    .sort(([, first], [, second]) => {
      const firstDays = first[0]?.daysUntilAvailable ?? 0;
      const secondDays = second[0]?.daysUntilAvailable ?? 0;
      return firstDays - secondDays;
    });

  return (
    <Card className="p-4 border-primary-900/60 bg-primary-950/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="warning">Farm today</Badge>
            <Badge variant="outline">{schedule.dayName}</Badge>
          </div>
          <h2 className="text-lg font-semibold text-slate-100">Farm Today For Target</h2>
          <p className="mt-1 text-sm text-slate-400">{getFarmingSummary(schedule)}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:min-w-72">
          <CampaignFarmStat label="Resin estimate" value={`${totalEstimatedResin.toLocaleString()}`} />
          <CampaignFarmStat label="Days estimate" value={`${totalEstimatedDays}`} />
          <CampaignFarmStat label="Material readiness" value={`${campaignPlanPercent}%`} />
          <CampaignFarmStat label="Talent deficit" value={`${schedule.totalDeficit.toLocaleString()}`} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg bg-slate-900/70 p-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            Available today
          </div>
          {schedule.farmToday.length > 0 ? (
            <FarmingRecommendationLinks
              campaignId={campaign.id}
              recommendations={schedule.farmToday}
            />
          ) : (
            <p className="text-sm text-slate-500">No target talent books are available today.</p>
          )}
        </div>
        <div className="rounded-lg bg-slate-900/70 p-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
            <Clock className="h-4 w-4 text-yellow-400" />
            Next farming windows
          </div>
          {waitEntries.length > 0 ? (
            <div className="space-y-3">
              {waitEntries.slice(0, 3).map(([day, recommendations]) => (
                <div key={day}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-300">
                      <Calendar className="h-3.5 w-3.5" />
                      {day}
                    </span>
                    <span className="text-xs text-slate-500">
                      in {recommendations[0]?.daysUntilAvailable ?? 0}d
                    </span>
                  </div>
                  <FarmingRecommendationLinks
                    campaignId={campaign.id}
                    recommendations={recommendations}
                    compact
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No rotating talent books are waiting on another day.</p>
          )}
        </div>
      </div>
    </Card>
  );
}

function CampaignFarmStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-900/80 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-base font-semibold text-slate-100">{value}</div>
    </div>
  );
}

function FarmingRecommendationLinks({
  campaignId,
  recommendations,
  compact = false,
}: {
  campaignId: string;
  recommendations: FarmingRecommendation[];
  compact?: boolean;
}) {
  return (
    <div className="space-y-2">
      {recommendations.slice(0, compact ? 2 : 4).map((recommendation) => (
        <Link
          key={`${recommendation.material.key}-${recommendation.material.tier ?? 'base'}`}
          to={`/campaigns/materials?campaign=${encodeURIComponent(campaignId)}&material=${encodeURIComponent(recommendation.material.key)}`}
          className="flex items-center justify-between gap-3 rounded-md bg-slate-950/60 px-3 py-2 transition-colors hover:bg-slate-800"
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-slate-100">
              {recommendation.material.name}
            </span>
            <span className="block text-xs text-slate-500">
              {recommendation.series} - {recommendation.region}
            </span>
          </span>
          <span className="flex flex-shrink-0 items-center gap-2 text-right text-xs">
            <span>
              <span className="block font-medium text-yellow-300">
                {recommendation.material.deficit.toLocaleString()} short
              </span>
              <span className="block capitalize text-slate-500">{recommendation.priority}</span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
          </span>
        </Link>
      ))}
      {recommendations.length > (compact ? 2 : 4) && (
        <p className="text-xs text-slate-500">
          {recommendations.length - (compact ? 2 : 4)} more target deficits share this window.
        </p>
      )}
    </div>
  );
}

/**
 * MaterialsTab - Dedicated material inventory and deficit tracking view
 *
 * Shows material inventory status and deficit priorities across all planned characters.
 */

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Flag, Package, AlertCircle, Coins, Pencil } from 'lucide-react';
import { useCharacters } from '@/features/roster/hooks/useCharacters';
import { useCampaignPlans, useCampaigns } from '@/features/campaigns';
import { useMaterials } from '../hooks/useMaterials';
import { useMultiCharacterPlan } from '../hooks/useMultiCharacterPlan';
import DeficitPriorityCard from '../components/DeficitPriorityCard';
import { MaterialsList } from '../components/MaterialsList';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { Campaign } from '@/types';
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
  const focusedMaterialKey = searchParams.get('material');
  const { characters, isLoading: loadingChars } = useCharacters();
  const { materials, isLoading: loadingMats, hasMaterials, totalMaterialTypes, setMaterial } = useMaterials();
  const { campaigns, isLoading: loadingCampaigns } = useCampaigns();

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

  const campaign = useMemo(
    () => campaigns.find((candidate) => candidate.id === campaignId),
    [campaignId, campaigns]
  );
  const campaignList = useMemo(() => (campaign ? [campaign] : []), [campaign]);
  const {
    plans: campaignPlans,
    isLoading: loadingCampaignPlan,
    isCalculating: calculatingCampaignPlan,
  } = useCampaignPlans(campaignList);
  const campaignPlan = campaign ? campaignPlans[campaign.id] : undefined;

  const isCampaignContext = Boolean(campaignId);
  const isLoading = loadingChars || loadingMats || (isCampaignContext && loadingCampaigns);
  const isCampaignPlanLoading = Boolean(
    campaign && (loadingCampaignPlan || calculatingCampaignPlan || !campaignPlan)
  );

  const activeSummary = campaignPlan?.materialReadiness.summary ?? multiPlan.summary;
  const activeGroupedMaterials = activeSummary?.groupedMaterials;
  const activeMaterials = activeSummary?.aggregatedMaterials ?? [];
  const focusedMaterial = findFocusedMaterial(activeMaterials, focusedMaterialKey);
  const showPriorityFallback = !campaign;

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
            ? `Campaign material plan for ${campaign.name}`
            : 'Track your materials and see what you need to farm for your priority characters'}
        </p>
      </div>

      {campaign && (
        <CampaignMaterialContextCard
          campaign={campaign}
          focusedMaterial={focusedMaterial}
          focusedMaterialKey={focusedMaterialKey}
        />
      )}

      {campaignId && !campaign && !loadingCampaigns && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-400">Campaign not found</h3>
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
                Import your materials using GOOD format or Irminsul export in Settings to track
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

      {/* Deficit Priority */}
      {!isCampaignPlanLoading && activeGroupedMaterials && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {campaign ? 'Campaign Deficits' : 'Priority Deficits'}
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
            {campaign ? 'Campaign Materials' : 'All Required Materials'}
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
  focusedMaterial,
  focusedMaterialKey,
}: {
  campaign: Campaign;
  focusedMaterial: MaterialRequirement | undefined;
  focusedMaterialKey: string | null;
}) {
  return (
    <Card className="p-4 border-primary-900/60 bg-primary-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="primary">Campaign</Badge>
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
              The linked material is not currently blocking this campaign.
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-400">
              Showing only materials required by this campaign.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/campaigns/${campaign.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Campaign
          </Link>
          <Link
            to="/planner/materials"
            className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
          >
            Priority Materials
          </Link>
        </div>
      </div>
    </Card>
  );
}

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Users } from 'lucide-react';
import { useCharacters } from '@/features/roster/hooks/useCharacters';
import { useTeams } from '@/features/roster/hooks/useTeams';
import { useWeapons } from '@/features/weapons/hooks/useWeapons';
import { useMaterials } from '../hooks/useMaterials';
import { useMultiCharacterPlan } from '../hooks/useMultiCharacterPlan';
import { useWeaponPlan } from '../hooks/useWeaponPlan';
import { usePlannerState } from '../hooks/usePlannerState';
import { markChecklistItem } from '@/hooks/useOnboarding';

// Sub-components
import ResinTracker from '../components/ResinTracker';
import TodaysFarmingRecommendations from '../components/TodaysFarmingRecommendations';
import DeficitPriorityCard from '../components/DeficitPriorityCard';
import ResinEfficiencyCard from '../components/ResinEfficiencyCard';
import DomainScheduleCard from '../components/DomainScheduleCard';
import CharacterSelection from '../components/CharacterSelection';
import MultiModeSelection from '../components/MultiModeSelection';
import { SingleGoalSummary, MultiGoalSummary } from '../components/GoalSummary';
import { SingleMaterialsBreakdown, MultiMaterialsBreakdown } from '../components/MaterialsBreakdown';
import {
  MaterialInventoryStatus,
  CalculationErrorCard,
  StaleDataWarning,
  ResinTipsCard,
} from '../components/PlannerStatusCards';
import { SingleModeEmptyState, MultiModeEmptyState } from '../components/PlannerEmptyStates';
import WishlistSection from '../components/WishlistSection';

// Domain logic
import {
  calculateAscensionSummary,
  createGoalFromCharacter,
  createComfortableBuildGoal,
  createFunctionalBuildGoal,
  createNextAscensionGoal,
  type AscensionGoal,
  type AscensionSummary,
} from '../domain/ascensionCalculator';

export default function PlannerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { characters, isLoading: loadingChars } = useCharacters();
  const { teams } = useTeams();
  const { weapons: enrichedWeapons, isLoading: loadingWeapons, hasWeapons } = useWeapons();
  const { materials, isLoading: loadingMats, hasMaterials, totalMaterialTypes, setMaterial } = useMaterials();

  // Check for query params to auto-select characters
  const teamIdFromUrl = searchParams.get('team');
  const characterKeyFromUrl = searchParams.get('character');
  const teamFromUrl = teamIdFromUrl ? teams.find((t) => t.id === teamIdFromUrl) : null;

  // Find character by key for single-character mode
  const characterFromUrl = useMemo(() => {
    if (characterKeyFromUrl) {
      return characters.find((c) => c.key.toLowerCase() === characterKeyFromUrl.toLowerCase());
    }
    return null;
  }, [characterKeyFromUrl, characters]);

  const initialSelectedKeys = useMemo(() => {
    if (teamFromUrl) {
      // Map team character keys to actual character keys (case-insensitive matching)
      return teamFromUrl.characterKeys.filter((key) =>
        characters.some((c) => c.key.toLowerCase() === key.toLowerCase())
      );
    }
    return [];
  }, [teamFromUrl, characters]);

  // Use persisted planner state with URL param overrides
  const plannerState = usePlannerState({
    initialModeFromUrl: teamFromUrl ? 'multi' : undefined,
    initialCharacterKeysFromUrl: initialSelectedKeys,
    initialCharacterIdFromUrl: characterFromUrl?.id,
  });

  const {
    plannerMode,
    setPlannerMode,
    selectedCharacterId,
    setSelectedCharacterId,
    singleGoalType: goalType,
    setSingleGoalType: setGoalType,
    multiTab,
    setMultiTab,
    multiSelectedKeys,
    setMultiSelectedKeys,
  } = plannerState;

  // Clear query params after initial load to prevent re-selection on navigation
  useEffect(() => {
    if ((teamIdFromUrl && teamFromUrl) || (characterKeyFromUrl && characterFromUrl)) {
      setSearchParams({}, { replace: true });
    }
  }, [teamIdFromUrl, teamFromUrl, characterKeyFromUrl, characterFromUrl, setSearchParams]);

  // Auto-select character from URL param (when character data loads after URL parse)
  useEffect(() => {
    if (characterFromUrl && !selectedCharacterId) {
      setSelectedCharacterId(characterFromUrl.id);
    }
  }, [characterFromUrl, selectedCharacterId, setSelectedCharacterId]);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'materials']));
  const [summary, setSummary] = useState<AscensionSummary | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Mark planner as visited for onboarding checklist
  useEffect(() => {
    markChecklistItem('hasVisitedPlanner');
  }, []);

  // Transform enriched weapons for hooks
  const weaponsForPlan = useMemo(() => {
    return enrichedWeapons.map((w) => ({
      id: w.id,
      key: w.key,
      level: w.level,
      ascension: w.ascension,
      rarity: (w.displayRarity === 5 ? 5 : 4) as 4 | 5,
      refinement: w.refinement,
      equippedBy: w.location,
    }));
  }, [enrichedWeapons]);

  // Multi-character mode hook - use persisted keys as initial selection
  const multiPlan = useMultiCharacterPlan({
    characters,
    inventory: materials,
    initialGoalType: plannerState.multiGoalType,
    initialSelectedKeys: multiSelectedKeys.length > 0 ? multiSelectedKeys : initialSelectedKeys,
  });

  // Track if we've synced initial state
  const hasSyncedMultiPlan = useRef(false);

  // Sync multi-plan selection changes to persisted state
  useEffect(() => {
    // Skip the first render to avoid overwriting persisted state
    if (!hasSyncedMultiPlan.current) {
      hasSyncedMultiPlan.current = true;
      return;
    }
    setMultiSelectedKeys(multiPlan.selectedCharacterKeys);
  }, [multiPlan.selectedCharacterKeys, setMultiSelectedKeys]);

  // Weapon plan hook
  const weaponPlan = useWeaponPlan({
    weapons: weaponsForPlan,
    inventory: materials,
    initialGoalType: 'full',
  });

  // Derived values
  const selectedCharacter = useMemo(
    () => characters.find((c) => c.id === selectedCharacterId),
    [characters, selectedCharacterId]
  );

  const goal = useMemo<AscensionGoal | null>(() => {
    if (!selectedCharacter) return null;
    switch (goalType) {
      case 'full':
        return createGoalFromCharacter(selectedCharacter);
      case 'comfortable':
        return createComfortableBuildGoal(selectedCharacter);
      case 'functional':
        return createFunctionalBuildGoal(selectedCharacter);
      case 'next':
      default:
        return createNextAscensionGoal(selectedCharacter);
    }
  }, [selectedCharacter, goalType]);

  // Calculate summary when goal or materials change
  useEffect(() => {
    if (!goal) {
      setSummary(null);
      setCalculationError(null);
      return;
    }

    let isCancelled = false;

    const calculate = async () => {
      setIsCalculating(true);
      setCalculationError(null);
      try {
        const result = await calculateAscensionSummary(goal, materials);
        if (!isCancelled) {
          setSummary(result);
          setCalculationError(null);
        }
      } catch (error) {
        console.error('Failed to calculate ascension summary:', error);
        if (!isCancelled) {
          setSummary(null);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setCalculationError(`Failed to calculate materials: ${errorMessage}`);
        }
      } finally {
        if (!isCancelled) {
          setIsCalculating(false);
        }
      }
    };

    void calculate();
    return () => { isCancelled = true; };
  }, [goal, materials]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const isLoading = loadingChars || loadingMats || loadingWeapons;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  const currentMora = materials['Mora'] ?? materials['mora'] ?? 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      {/* Main Content */}
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Ascension Planner</h1>
            <p className="text-slate-400">
              Calculate materials needed to level up your characters
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            <button
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                plannerMode === 'single'
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setPlannerMode('single')}
            >
              <User className="w-4 h-4" />
              Single
            </button>
            <button
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                plannerMode === 'multi'
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setPlannerMode('multi')}
            >
              <Users className="w-4 h-4" />
              Multi
            </button>
          </div>
        </div>

        {/* Material Inventory Status */}
        <MaterialInventoryStatus
          hasMaterials={hasMaterials}
          totalMaterialTypes={totalMaterialTypes}
          currentMora={currentMora}
          onMoraChange={(value) => setMaterial('Mora', value)}
        />

        {/* Single Character Selection */}
        {plannerMode === 'single' && (
          <CharacterSelection
            characters={characters}
            selectedCharacterId={selectedCharacterId}
            onCharacterChange={setSelectedCharacterId}
            goalType={goalType}
            onGoalTypeChange={setGoalType}
          />
        )}

        {/* Multi-Mode Selection */}
        {plannerMode === 'multi' && (
          <MultiModeSelection
            multiTab={multiTab}
            onTabChange={setMultiTab}
            characters={characters}
            selectedCharacterCount={multiPlan.selectedCount}
            characterGoalType={multiPlan.goalType}
            onCharacterGoalTypeChange={multiPlan.setGoalType}
            isCharacterSelected={multiPlan.isSelected}
            onToggleCharacter={multiPlan.toggleCharacter}
            onSelectAllCharacters={multiPlan.selectAll}
            onDeselectAllCharacters={multiPlan.deselectAll}
            weapons={enrichedWeapons}
            hasWeapons={hasWeapons}
            selectedWeaponCount={weaponPlan.selectedCount}
            weaponGoalType={weaponPlan.goalType}
            onWeaponGoalTypeChange={weaponPlan.setGoalType}
            isWeaponSelected={weaponPlan.isSelected}
            onToggleWeapon={weaponPlan.toggleWeapon}
            onSelectAllWeapons={weaponPlan.selectAll}
            onDeselectAllWeapons={weaponPlan.deselectAll}
          />
        )}

        {/* Wishlist Section - Pre-farm for characters not yet owned */}
        {plannerMode === 'multi' && multiTab === 'characters' && (
          <WishlistSection
            ownedCharacterKeys={characters.map((c) => c.key)}
          />
        )}

        {/* Single Character Goal Summary */}
        {plannerMode === 'single' && selectedCharacter && goal && (
          <SingleGoalSummary character={selectedCharacter} goal={goal} summary={summary} />
        )}

        {/* Multi-Character Summary */}
        {plannerMode === 'multi' && multiPlan.hasSelection && multiPlan.summary && (
          <MultiGoalSummary
            selectedCount={multiPlan.selectedCount}
            selectedCharacters={multiPlan.selectedCharacters}
            summary={multiPlan.summary}
            onDeselectCharacter={multiPlan.deselectCharacter}
          />
        )}

        {/* Error Display */}
        {((plannerMode === 'single' && calculationError) ||
          (plannerMode === 'multi' && multiPlan.calculationError)) && (
          <CalculationErrorCard
            error={plannerMode === 'single' ? calculationError! : multiPlan.calculationError!}
          />
        )}

        {/* Stale Data Warning */}
        {((plannerMode === 'single' && summary?.isStale) ||
          (plannerMode === 'multi' && multiPlan.summary?.anyStale)) && (
          <StaleDataWarning
            message={
              plannerMode === 'single'
                ? summary?.error
                : 'Some material data may be outdated. Check your internet connection.'
            }
          />
        )}

        {/* Single Character Materials Breakdown */}
        {plannerMode === 'single' && summary && (
          <SingleMaterialsBreakdown
            summary={summary}
            isExpanded={expandedSections.has('materials')}
            isCalculating={isCalculating}
            onToggle={() => toggleSection('materials')}
          />
        )}

        {/* Multi-Character Materials Breakdown */}
        {plannerMode === 'multi' && multiPlan.hasSelection && multiPlan.summary && (
          <MultiMaterialsBreakdown
            summary={multiPlan.summary}
            isExpanded={expandedSections.has('materials')}
            isCalculating={multiPlan.isCalculating}
            onToggle={() => toggleSection('materials')}
          />
        )}

        {/* Empty States */}
        {plannerMode === 'single' && !selectedCharacter && <SingleModeEmptyState />}
        {plannerMode === 'multi' && !multiPlan.hasSelection && <MultiModeEmptyState />}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <ResinTracker />

        {/* Today's Farming Recommendations */}
        {plannerMode === 'single' && summary?.materials && (
          <TodaysFarmingRecommendations
            talentMaterials={summary.materials.filter((m) => m.category === 'talent')}
            compact
          />
        )}
        {plannerMode === 'multi' && multiPlan.summary?.groupedMaterials?.talent && (
          <TodaysFarmingRecommendations
            talentMaterials={multiPlan.summary.groupedMaterials.talent}
            compact
          />
        )}

        {/* Deficit Priority */}
        {plannerMode === 'multi' && multiPlan.summary?.groupedMaterials && (
          <DeficitPriorityCard
            groupedMaterials={multiPlan.summary.groupedMaterials}
            compact
          />
        )}

        {/* Resin Efficiency */}
        {plannerMode === 'multi' && multiPlan.summary?.groupedMaterials && (
          <ResinEfficiencyCard
            groupedMaterials={multiPlan.summary.groupedMaterials}
            compact
          />
        )}

        {/* Today's Domain Schedule */}
        <DomainScheduleCard />

        {/* Daily Resin Tips */}
        <ResinTipsCard />
      </div>
    </div>
  );
}

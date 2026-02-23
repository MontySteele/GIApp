import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCharacters } from '@/features/roster/hooks/useCharacters';
import { useMaterials } from '../hooks/useMaterials';
import { usePlannerState } from '../hooks/usePlannerState';
import { markChecklistItem } from '@/hooks/useOnboarding';

// Sub-components
import ResinTracker from '../components/ResinTracker';
import TodaysFarmingRecommendations from '../components/TodaysFarmingRecommendations';
import DomainScheduleCard from '../components/DomainScheduleCard';
import CharacterSelection from '../components/CharacterSelection';
import { SingleGoalSummary } from '../components/GoalSummary';
import { SingleMaterialsBreakdown } from '../components/MaterialsBreakdown';
import {
  MaterialInventoryStatus,
  CalculationErrorCard,
  StaleDataWarning,
  ResinTipsCard,
} from '../components/PlannerStatusCards';
import { SingleModeEmptyState } from '../components/PlannerEmptyStates';

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
  const { materials, isLoading: loadingMats, hasMaterials, totalMaterialTypes, setMaterial } = useMaterials();

  // Check for query params to auto-select character
  const characterKeyFromUrl = searchParams.get('character');

  const characterFromUrl = useMemo(() => {
    if (characterKeyFromUrl) {
      return characters.find((c) => c.key.toLowerCase() === characterKeyFromUrl.toLowerCase());
    }
    return null;
  }, [characterKeyFromUrl, characters]);

  // Use persisted planner state
  const plannerState = usePlannerState({
    initialCharacterIdFromUrl: characterFromUrl?.id,
  });

  const {
    selectedCharacterId,
    setSelectedCharacterId,
    singleGoalType: goalType,
    setSingleGoalType: setGoalType,
  } = plannerState;

  // Clear query params after initial load
  useEffect(() => {
    if (characterKeyFromUrl && characterFromUrl) {
      setSearchParams({}, { replace: true });
    }
  }, [characterKeyFromUrl, characterFromUrl, setSearchParams]);

  // Auto-select character from URL param
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

  const isLoading = loadingChars || loadingMats;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  const currentMora = materials['Mora'] ?? materials['mora'] ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">Ascension Planner</h1>
        <p className="text-slate-400">
          Select a character to see the materials needed
        </p>
      </div>

      {/* Material Inventory Status */}
      <MaterialInventoryStatus
        hasMaterials={hasMaterials}
        totalMaterialTypes={totalMaterialTypes}
        currentMora={currentMora}
        onMoraChange={(value) => setMaterial('Mora', value)}
      />

      {/* Character Selection */}
      <CharacterSelection
        characters={characters}
        selectedCharacterId={selectedCharacterId}
        onCharacterChange={setSelectedCharacterId}
        goalType={goalType}
        onGoalTypeChange={setGoalType}
      />

      {/* Goal Summary */}
      {selectedCharacter && goal && (
        <SingleGoalSummary character={selectedCharacter} goal={goal} summary={summary} />
      )}

      {/* Error Display */}
      {calculationError && (
        <CalculationErrorCard error={calculationError} />
      )}

      {/* Stale Data Warning */}
      {summary?.isStale && (
        <StaleDataWarning message={summary.error} />
      )}

      {/* Materials Breakdown */}
      {summary && (
        <SingleMaterialsBreakdown
          summary={summary}
          isExpanded={expandedSections.has('materials')}
          isCalculating={isCalculating}
          onToggle={() => toggleSection('materials')}
        />
      )}

      {/* Today's Farming Recommendations */}
      {summary?.materials && (
        <TodaysFarmingRecommendations
          talentMaterials={summary.materials.filter((m) => m.category === 'talent')}
        />
      )}

      {/* Empty State */}
      {!selectedCharacter && <SingleModeEmptyState />}

      {/* Supplementary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResinTracker />
        <DomainScheduleCard />
        <ResinTipsCard />
      </div>
    </div>
  );
}

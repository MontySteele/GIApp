import { useState, useMemo, useEffect, useCallback } from 'react';
import { Target, Package, Clock, ChevronDown, ChevronUp, Check, AlertCircle, Calendar, WifiOff, Coins, Users, User, Sword } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import { useCharacters } from '@/features/roster/hooks/useCharacters';
import { useWeapons } from '@/features/weapons/hooks/useWeapons';
import { useMaterials } from '../hooks/useMaterials';
import { useMultiCharacterPlan, type GoalType } from '../hooks/useMultiCharacterPlan';
import { useWeaponPlan, type WeaponGoalType } from '../hooks/useWeaponPlan';
import ResinTracker from '../components/ResinTracker';
import {
  calculateAscensionSummary,
  createGoalFromCharacter,
  createComfortableBuildGoal,
  createFunctionalBuildGoal,
  createNextAscensionGoal,
  type AscensionGoal,
  type AscensionSummary,
  type MaterialRequirement,
} from '../domain/ascensionCalculator';
import type { GroupedMaterials } from '../domain/multiCharacterCalculator';
import { RESIN_REGEN, DOMAIN_SCHEDULE } from '../domain/materialConstants';

type PlannerMode = 'single' | 'multi';
type MultiTab = 'characters' | 'weapons';

// Helper to get today's available talent materials
function getTodaysMaterials(): { materials: string[]; dayName: string } {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
  const today = new Date();
  const dayName = days[today.getDay()] ?? 'Sunday';

  const materials: string[] = [];
  for (const [material, availableDays] of Object.entries(DOMAIN_SCHEDULE)) {
    if (availableDays.includes(dayName)) {
      materials.push(material);
    }
  }

  return { materials, dayName };
}

// Region grouping for talent materials
const TALENT_BOOK_REGIONS: Record<string, string[]> = {
  'Mondstadt': ['Freedom', 'Resistance', 'Ballad'],
  'Liyue': ['Prosperity', 'Diligence', 'Gold'],
  'Inazuma': ['Transience', 'Elegance', 'Light'],
  'Sumeru': ['Admonition', 'Ingenuity', 'Praxis'],
  'Fontaine': ['Equity', 'Justice', 'Order'],
  'Natlan': ['Contention', 'Kindling', 'Conflict'],
};

export default function PlannerPage() {
  const { characters, isLoading: loadingChars } = useCharacters();
  const { weapons: enrichedWeapons, isLoading: loadingWeapons, hasWeapons } = useWeapons();
  const { materials, isLoading: loadingMats, hasMaterials, totalMaterialTypes, setMaterial } = useMaterials();

  // Planner mode (single vs multi-character)
  const [plannerMode, setPlannerMode] = useState<PlannerMode>('single');

  // Multi-mode tab (characters vs weapons)
  const [multiTab, setMultiTab] = useState<MultiTab>('characters');

  // Single character mode state
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [goalType, setGoalType] = useState<GoalType>('next');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'materials']));
  const [summary, setSummary] = useState<AscensionSummary | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [moraInput, setMoraInput] = useState<string>('');

  // Transform enriched weapons to match hook expectations
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

  // Multi-character mode hook
  const multiPlan = useMultiCharacterPlan({
    characters,
    inventory: materials,
    initialGoalType: goalType,
  });

  // Weapon plan hook
  const weaponPlan = useWeaponPlan({
    weapons: weaponsForPlan,
    inventory: materials,
    initialGoalType: 'full',
  });

  // Initialize mora input from materials
  useEffect(() => {
    const currentMora = materials['Mora'] ?? materials['mora'] ?? 0;
    setMoraInput(currentMora > 0 ? currentMora.toString() : '');
  }, [materials]);

  // Handle mora input change with debounce
  const handleMoraChange = useCallback((value: string) => {
    // Allow empty or numbers only
    const numericValue = value.replace(/[^0-9]/g, '');
    setMoraInput(numericValue);
  }, []);

  // Save mora when input loses focus
  const handleMoraSave = useCallback(async () => {
    const moraValue = parseInt(moraInput, 10) || 0;
    await setMaterial('Mora', moraValue);
  }, [moraInput, setMaterial]);

  const selectedCharacter = useMemo(
    () => characters.find((c) => c.id === selectedCharacterId),
    [characters, selectedCharacterId]
  );

  // Sort characters alphabetically by name
  const sortedCharacters = useMemo(
    () => [...characters].sort((a, b) => a.key.localeCompare(b.key)),
    [characters]
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

  // Calculate summary asynchronously when goal or materials change
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

    return () => {
      isCancelled = true;
    };
  }, [goal, materials]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
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

  // Sort weapons by rarity then name
  const sortedWeapons = [...enrichedWeapons].sort((a, b) => {
    if (a.displayRarity !== b.displayRarity) return b.displayRarity - a.displayRarity;
    return a.displayName.localeCompare(b.displayName);
  });

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
        <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-slate-400" />
              <div>
                <div className="text-sm font-medium text-slate-200">Material Inventory</div>
                <div className="text-xs text-slate-400">
                  {hasMaterials
                    ? `${totalMaterialTypes} material types tracked`
                    : 'No materials imported yet'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Manual Mora Input */}
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-500" />
                <label className="text-sm text-slate-400">Mora:</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={moraInput}
                  onChange={(e) => handleMoraChange(e.target.value)}
                  onBlur={handleMoraSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void handleMoraSave();
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  placeholder="Enter mora"
                  className="w-32 px-2 py-1 text-sm bg-slate-800 border border-slate-700 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
                />
              </div>
              {!hasMaterials && (
                <Badge variant="warning">Import from Irminsul to track materials</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Single Character Selection */}
      {plannerMode === 'single' && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5" />
              Select Character
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Character</label>
                <Select
                  value={selectedCharacterId}
                  onChange={(e) => setSelectedCharacterId(e.target.value)}
                  options={[
                    { value: '', label: 'Select a character...' },
                    ...sortedCharacters.map((c) => ({
                      value: c.id,
                      label: `${c.key} (Lv. ${c.level})`,
                    })),
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Goal</label>
                <Select
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value as GoalType)}
                  options={[
                    { value: 'next', label: 'Next Ascension' },
                    { value: 'functional', label: 'Functional (80/1/6/6)' },
                    { value: 'comfortable', label: 'Comfortable (80/8/8/8)' },
                    { value: 'full', label: 'Full Build (90/10/10/10)' },
                  ]}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Multi-Mode Selection */}
      {plannerMode === 'multi' && (
        <Card className="mb-6">
          <CardHeader>
            {/* Tab Switcher */}
            <div className="flex items-center gap-4 mb-2">
              <button
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  multiTab === 'characters'
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => setMultiTab('characters')}
              >
                <Users className="w-4 h-4" />
                Characters
                {multiPlan.selectedCount > 0 && (
                  <Badge variant="primary" className="text-xs">{multiPlan.selectedCount}</Badge>
                )}
              </button>
              <button
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  multiTab === 'weapons'
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => setMultiTab('weapons')}
              >
                <Sword className="w-4 h-4" />
                Weapons
                {weaponPlan.selectedCount > 0 && (
                  <Badge variant="primary" className="text-xs">{weaponPlan.selectedCount}</Badge>
                )}
              </button>
            </div>

            {/* Selection Controls */}
            <div className="flex items-center justify-end gap-2">
              <button
                className="text-xs text-primary-400 hover:text-primary-300"
                onClick={multiTab === 'characters' ? multiPlan.selectAll : weaponPlan.selectAll}
              >
                Select All
              </button>
              <span className="text-slate-600">|</span>
              <button
                className="text-xs text-slate-400 hover:text-slate-300"
                onClick={multiTab === 'characters' ? multiPlan.deselectAll : weaponPlan.deselectAll}
              >
                Clear
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Character Tab */}
            {multiTab === 'characters' && (
              <>
                {/* Goal Type */}
                <div className="mb-4">
                  <label className="block text-sm text-slate-400 mb-2">Goal for All Characters</label>
                  <Select
                    value={multiPlan.goalType}
                    onChange={(e) => multiPlan.setGoalType(e.target.value as GoalType)}
                    options={[
                      { value: 'next', label: 'Next Ascension' },
                      { value: 'functional', label: 'Functional (80/1/6/6)' },
                      { value: 'comfortable', label: 'Comfortable (80/8/8/8)' },
                      { value: 'full', label: 'Full Build (90/10/10/10)' },
                    ]}
                  />
                </div>

                {/* Character Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                  {sortedCharacters.map((character) => {
                    const isSelected = multiPlan.isSelected(character.key);
                    return (
                      <button
                        key={character.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-primary-900/30 border-primary-500 text-primary-200'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                        onClick={() => multiPlan.toggleCharacter(character.key)}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected
                              ? 'bg-primary-500 border-primary-500'
                              : 'border-slate-500'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 text-left overflow-hidden">
                          <div className="text-sm font-medium truncate">{character.key}</div>
                          <div className="text-xs text-slate-500">Lv. {character.level}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Weapon Tab */}
            {multiTab === 'weapons' && (
              <>
                {/* Goal Type */}
                <div className="mb-4">
                  <label className="block text-sm text-slate-400 mb-2">Goal for All Weapons</label>
                  <Select
                    value={weaponPlan.goalType}
                    onChange={(e) => weaponPlan.setGoalType(e.target.value as WeaponGoalType)}
                    options={[
                      { value: 'next', label: 'Next Ascension' },
                      { value: 'comfortable', label: 'Level 80' },
                      { value: 'full', label: 'Level 90' },
                    ]}
                  />
                </div>

                {/* Weapon Grid */}
                {hasWeapons ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                    {sortedWeapons.filter((w) => w.displayRarity >= 4).map((weapon) => {
                      const isSelected = weaponPlan.isSelected(weapon.key);
                      return (
                        <button
                          key={weapon.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                            isSelected
                              ? 'bg-primary-900/30 border-primary-500 text-primary-200'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                          }`}
                          onClick={() => weaponPlan.toggleWeapon(weapon.key)}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              isSelected
                                ? 'bg-primary-500 border-primary-500'
                                : 'border-slate-500'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 text-left overflow-hidden">
                            <div className="text-sm font-medium truncate">{weapon.displayName}</div>
                            <div className="text-xs text-slate-500">
                              {weapon.displayRarity}★ Lv. {weapon.level}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Sword className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No weapons imported yet.</p>
                    <p className="text-xs mt-1">Import weapons via Irminsul to plan weapon ascensions.</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Single Character Goal Summary */}
      {plannerMode === 'single' && selectedCharacter && goal && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{selectedCharacter.key} - Goal</h2>
              {summary?.canAscend && (
                <Badge variant="success" className="flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Ready!
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-slate-900 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Level</div>
                <div className="text-lg font-bold text-slate-100">
                  {goal.currentLevel} → {goal.targetLevel}
                </div>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Ascension</div>
                <div className="text-lg font-bold text-slate-100">
                  A{goal.currentAscension} → A{goal.targetAscension}
                </div>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Talents</div>
                <div className="text-sm font-bold text-slate-100">
                  {goal.currentTalents.auto}/{goal.currentTalents.skill}/{goal.currentTalents.burst}
                  {' → '}
                  {goal.targetTalents.auto}/{goal.targetTalents.skill}/{goal.targetTalents.burst}
                </div>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Est. Time
                </div>
                <div className="text-lg font-bold text-slate-100">
                  {summary?.estimatedDays || 0} days
                </div>
                <div className="text-xs text-slate-500">
                  ~{summary?.estimatedResin || 0} resin
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Multi-Character Summary */}
      {plannerMode === 'multi' && multiPlan.hasSelection && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {multiPlan.selectedCount} Characters - Combined Goal
              </h2>
              {multiPlan.summary?.allCanAscend && (
                <Badge variant="success" className="flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  All Ready!
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Selected Character Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {multiPlan.selectedCharacters.map((char) => (
                <Badge key={char.id} variant="default" className="flex items-center gap-1">
                  {char.key}
                  <button
                    className="ml-1 text-slate-400 hover:text-slate-200"
                    onClick={() => multiPlan.deselectCharacter(char.key)}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Total Mora</div>
                <div className="text-lg font-bold text-slate-100">
                  {(multiPlan.summary?.totalMora || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Hero's Wit</div>
                <div className="text-lg font-bold text-slate-100">
                  {Math.ceil((multiPlan.summary?.totalExp || 0) / 20000).toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Total Resin</div>
                <div className="text-lg font-bold text-primary-400">
                  {(multiPlan.summary?.totalEstimatedResin || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Est. Days
                </div>
                <div className="text-lg font-bold text-primary-400">
                  {multiPlan.summary?.totalEstimatedDays || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calculation Error Display */}
      {((plannerMode === 'single' && calculationError) ||
        (plannerMode === 'multi' && multiPlan.calculationError)) && (
        <Card className="mb-6 border-red-900/30 bg-red-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <div className="text-sm font-medium text-red-200">Calculation Error</div>
                <div className="text-xs text-red-400">
                  {plannerMode === 'single' ? calculationError : multiPlan.calculationError}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Status Warning */}
      {((plannerMode === 'single' && summary?.isStale) ||
        (plannerMode === 'multi' && multiPlan.summary?.anyStale)) && (
        <Card className="mb-6 border-yellow-900/30 bg-yellow-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <WifiOff className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="text-sm font-medium text-yellow-200">Using Cached Data</div>
                <div className="text-xs text-yellow-400">
                  {plannerMode === 'single'
                    ? (summary?.error || 'Material data may be outdated. Check your internet connection.')
                    : 'Some material data may be outdated. Check your internet connection.'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Single Character Materials Breakdown */}
      {plannerMode === 'single' && summary && (
        <Card>
          <CardHeader>
            <button
              className="flex items-center justify-between w-full"
              onClick={() => toggleSection('materials')}
            >
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Materials Required</h2>
                {isCalculating && (
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </div>
                )}
              </div>
              {expandedSections.has('materials') ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
          </CardHeader>
          {expandedSections.has('materials') && (
            <CardContent>
              <MaterialsList materials={summary.materials} />

              {/* Summary Stats */}
              <div className="mt-6 pt-4 border-t border-slate-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-slate-100">
                      {summary.totalMora.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400">Total Mora</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-100">
                      {Math.ceil(summary.totalExp / 20000).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400">Hero's Wit</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary-400">
                      {summary.estimatedResin.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400">Total Resin</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary-400">
                      {summary.estimatedDays}
                    </div>
                    <div className="text-xs text-slate-400">Days (~{RESIN_REGEN.perDay}/day)</div>
                  </div>
                </div>
                {/* Resin Breakdown */}
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-lg font-bold text-blue-400">
                        {summary.resinBreakdown.talentBoss.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400">Talents / Boss</div>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-lg font-bold text-green-400">
                        {summary.resinBreakdown.expMora.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400">EXP / Mora</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Multi-Character Materials Breakdown */}
      {plannerMode === 'multi' && multiPlan.hasSelection && multiPlan.summary && (
        <Card>
          <CardHeader>
            <button
              className="flex items-center justify-between w-full"
              onClick={() => toggleSection('materials')}
            >
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Combined Materials Required</h2>
                {multiPlan.isCalculating && (
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </div>
                )}
              </div>
              {expandedSections.has('materials') ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
          </CardHeader>
          {expandedSections.has('materials') && (
            <CardContent>
              <GroupedMaterialsList groupedMaterials={multiPlan.summary.groupedMaterials} />

              {/* Summary Stats */}
              <div className="mt-6 pt-4 border-t border-slate-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-slate-100">
                      {multiPlan.summary.totalMora.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400">Total Mora</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-100">
                      {Math.ceil(multiPlan.summary.totalExp / 20000).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400">Hero's Wit</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary-400">
                      {multiPlan.summary.totalEstimatedResin.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400">Total Resin</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary-400">
                      {multiPlan.summary.totalEstimatedDays}
                    </div>
                    <div className="text-xs text-slate-400">Days (~{RESIN_REGEN.perDay}/day)</div>
                  </div>
                </div>
                {/* Resin Breakdown */}
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-lg font-bold text-blue-400">
                        {multiPlan.summary.resinBreakdown.talentBoss.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400">Talents / Boss</div>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-lg font-bold text-green-400">
                        {multiPlan.summary.resinBreakdown.expMora.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400">EXP / Mora</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

        {/* Single Mode Empty State */}
        {plannerMode === 'single' && !selectedCharacter && (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">Select a character to calculate materials</p>
              <p className="text-sm text-slate-500">
                Characters are pulled from your roster. Import via Enka or Irminsul first.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Multi Mode Empty State */}
        {plannerMode === 'multi' && !multiPlan.hasSelection && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">Select characters to calculate combined materials</p>
              <p className="text-sm text-slate-500">
                Click on characters above or use "Select All" to start planning.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <ResinTracker />

        {/* Today's Domain Schedule */}
        <DomainScheduleCard />

        {/* Daily Resin Tips */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-200">Resin Tips</h3>
          </CardHeader>
          <CardContent className="text-sm text-slate-400 space-y-2">
            <p>Daily resin regeneration: {RESIN_REGEN.perDay} resin</p>
            <p>Condensed resin doubles domain drops</p>
            <p>Weekly bosses have discounted 30 resin (first 3)</p>
            <p>Use fragile resin for time-limited events</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Material item component
function MaterialItem({ mat }: { mat: MaterialRequirement }) {
  return (
    <div
      className={`flex items-start justify-between p-3 rounded-lg ${
        mat.deficit > 0 ? 'bg-red-900/20 border border-red-900/30' : 'bg-slate-900'
      }`}
    >
      <div className="flex items-start gap-3 flex-1">
        <div
          className={`w-2 h-2 rounded-full mt-1.5 ${
            mat.deficit > 0 ? 'bg-red-500' : 'bg-green-500'
          }`}
        />
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-200">{mat.name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500 capitalize">{mat.category}</span>
            {mat.tier && (
              <span className="text-xs text-slate-600">• Tier {mat.tier}</span>
            )}
          </div>
          {/* Source and availability info */}
          {(mat.source || mat.availability) && (
            <div className="mt-1 flex items-center gap-2">
              {mat.availability && mat.availability.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-blue-400">
                  <Calendar className="w-3 h-3" />
                  <span>{mat.availability.join(', ')}</span>
                </div>
              )}
              {mat.source && !mat.availability && (
                <div className="text-xs text-slate-500">
                  {mat.source}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm text-slate-300">
            {mat.owned.toLocaleString()} / {mat.required.toLocaleString()}
          </div>
          {mat.deficit > 0 && (
            <div className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Need {mat.deficit.toLocaleString()} more
            </div>
          )}
        </div>
        {mat.deficit === 0 && (
          <Check className="w-5 h-5 text-green-500" />
        )}
      </div>
    </div>
  );
}

// Flat materials list component
function MaterialsList({ materials }: { materials: MaterialRequirement[] }) {
  return (
    <div className="space-y-3">
      {materials.map((mat) => (
        <MaterialItem key={`${mat.key}-${mat.tier || 0}`} mat={mat} />
      ))}
    </div>
  );
}

// Category labels
const CATEGORY_LABELS: Record<string, string> = {
  mora: 'Mora',
  exp: 'EXP Materials',
  boss: 'Boss Materials',
  gem: 'Elemental Gems',
  localSpecialty: 'Local Specialties',
  common: 'Common Materials',
  talent: 'Talent Books',
  weekly: 'Weekly Boss Materials',
  crown: 'Crowns',
};

// Grouped materials list component for multi-character view
function GroupedMaterialsList({ groupedMaterials }: { groupedMaterials: GroupedMaterials }) {
  const categories = [
    'mora',
    'exp',
    'boss',
    'gem',
    'localSpecialty',
    'common',
    'talent',
    'weekly',
    'crown',
  ] as const;

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const materials = groupedMaterials[category];
        if (!materials || materials.length === 0) return null;

        return (
          <div key={category}>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
              {CATEGORY_LABELS[category] || category}
            </h3>
            <div className="space-y-2">
              {materials.map((mat) => (
                <MaterialItem key={`${mat.key}-${mat.tier || 0}`} mat={mat} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DomainScheduleCard() {
  const { materials: todayMaterials, dayName } = getTodaysMaterials();

  // Group today's materials by region
  const materialsByRegion: Record<string, string[]> = {};
  for (const [region, books] of Object.entries(TALENT_BOOK_REGIONS)) {
    const available = books.filter((book) => todayMaterials.includes(book));
    if (available.length > 0) {
      materialsByRegion[region] = available;
    }
  }

  const isSunday = dayName === 'Sunday';

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Today's Domains
        </h3>
        <div className="text-xs text-slate-400">{dayName}</div>
      </CardHeader>
      <CardContent>
        {isSunday ? (
          <div className="text-sm text-green-400 mb-3">All materials available!</div>
        ) : (
          <div className="space-y-3">
            {Object.entries(materialsByRegion).map(([region, books]) => (
              <div key={region}>
                <div className="text-xs text-slate-500 mb-1">{region}</div>
                <div className="flex flex-wrap gap-1">
                  {books.map((book) => (
                    <Badge key={book} variant="default" className="text-xs">
                      {book}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full schedule reference */}
        <div className="mt-4 pt-3 border-t border-slate-700">
          <div className="text-xs text-slate-500 mb-2">Schedule</div>
          <div className="grid grid-cols-3 gap-1 text-xs">
            <div className="text-slate-400">Mon/Thu</div>
            <div className="text-slate-400">Tue/Fri</div>
            <div className="text-slate-400">Wed/Sat</div>
            <div className="text-slate-300">Freedom</div>
            <div className="text-slate-300">Resistance</div>
            <div className="text-slate-300">Ballad</div>
            <div className="text-slate-300">Prosperity</div>
            <div className="text-slate-300">Diligence</div>
            <div className="text-slate-300">Gold</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

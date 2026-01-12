import { useState, useMemo } from 'react';
import { Target, Package, Clock, ChevronDown, ChevronUp, Check, AlertCircle, Calendar } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import { useCharacters } from '@/features/roster/hooks/useCharacters';
import { useMaterials } from '../hooks/useMaterials';
import ResinTracker from '../components/ResinTracker';
import {
  calculateAscensionSummary,
  createGoalFromCharacter,
  createNextAscensionGoal,
  type AscensionGoal,
  type AscensionSummary,
} from '../domain/ascensionCalculator';
import { RESIN_REGEN, DOMAIN_SCHEDULE } from '../domain/materialConstants';

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
  const { materials, isLoading: loadingMats, hasMaterials, totalMaterialTypes } = useMaterials();
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [goalType, setGoalType] = useState<'full' | 'next'>('next');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  const selectedCharacter = useMemo(
    () => characters.find((c) => c.id === selectedCharacterId),
    [characters, selectedCharacterId]
  );

  const goal = useMemo<AscensionGoal | null>(() => {
    if (!selectedCharacter) return null;
    return goalType === 'full'
      ? createGoalFromCharacter(selectedCharacter)
      : createNextAscensionGoal(selectedCharacter);
  }, [selectedCharacter, goalType]);

  const summary = useMemo<AscensionSummary | null>(() => {
    if (!goal) return null;
    return calculateAscensionSummary(goal, materials);
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

  const isLoading = loadingChars || loadingMats;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

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
        </div>

        {/* Material Inventory Status */}
        <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
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
            {!hasMaterials && (
              <Badge variant="warning">Import from Irminsul to track materials</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Character Selection */}
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
                  ...characters.map((c) => ({
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
                onChange={(e) => setGoalType(e.target.value as 'full' | 'next')}
                options={[
                  { value: 'next', label: 'Next Ascension' },
                  { value: 'full', label: 'Full Build (90/10/10/10)' },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goal Summary */}
      {selectedCharacter && goal && (
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

      {/* Materials Breakdown */}
      {summary && (
        <Card>
          <CardHeader>
            <button
              className="flex items-center justify-between w-full"
              onClick={() => toggleSection('materials')}
            >
              <h2 className="text-lg font-semibold">Materials Required</h2>
              {expandedSections.has('materials') ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
          </CardHeader>
          {expandedSections.has('materials') && (
            <CardContent>
              <div className="space-y-3">
                {summary.materials.map((mat) => (
                  <div
                    key={mat.key}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      mat.deficit > 0 ? 'bg-red-900/20 border border-red-900/30' : 'bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          mat.deficit > 0 ? 'bg-red-500' : 'bg-green-500'
                        }`}
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-200">{mat.name}</div>
                        <div className="text-xs text-slate-500 capitalize">{mat.category}</div>
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
                ))}
              </div>

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
                    <div className="text-xs text-slate-400">Resin Needed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary-400">
                      {summary.estimatedDays}
                    </div>
                    <div className="text-xs text-slate-400">Days (~{RESIN_REGEN.perDay}/day)</div>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

        {/* Empty State */}
        {!selectedCharacter && (
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

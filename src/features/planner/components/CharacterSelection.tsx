import { Target } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import type { Character } from '@/types';
import type { GoalType } from '../hooks/useMultiCharacterPlan';

interface CharacterSelectionProps {
  characters: Character[];
  selectedCharacterId: string;
  onCharacterChange: (id: string) => void;
  goalType: GoalType;
  onGoalTypeChange: (type: GoalType) => void;
}

export default function CharacterSelection({
  characters,
  selectedCharacterId,
  onCharacterChange,
  goalType,
  onGoalTypeChange,
}: CharacterSelectionProps) {
  // Sort characters alphabetically by name
  const sortedCharacters = [...characters].sort((a, b) => a.key.localeCompare(b.key));

  return (
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
              onChange={(e) => onCharacterChange(e.target.value)}
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
              onChange={(e) => onGoalTypeChange(e.target.value as GoalType)}
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
  );
}

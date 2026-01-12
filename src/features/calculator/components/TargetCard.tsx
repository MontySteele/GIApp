import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import type { BannerType } from '@/types';

export interface Target {
  id: string;
  characterName: string;
  bannerType: BannerType;
  constellation: number;
  pity: number;
  guaranteed: boolean;
  radiantStreak: number;
  fatePoints: number;
  useInheritedPity: boolean;
}

interface TargetCardProps {
  target: Target;
  index: number;
  totalTargets: number;
  errors: Map<string, string>;
  onUpdate: (id: string, updates: Partial<Target>) => void;
  onRemove: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export default function TargetCard({
  target,
  index,
  totalTargets,
  errors,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: TargetCardProps) {
  const isFirstTarget = index === 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <span className="font-semibold">
            Target {index + 1}
            <span className="ml-2 text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
              {target.bannerType === 'character' ? 'Character' : target.bannerType === 'weapon' ? 'Weapon' : 'Standard'}
            </span>
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMoveUp(index)}
              disabled={isFirstTarget}
              aria-label="Move up"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMoveDown(index)}
              disabled={index === totalTargets - 1}
              aria-label="Move down"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => onRemove(target.id)}
              aria-label="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={target.bannerType === 'weapon' ? 'Weapon Name' : 'Character Name'}
              value={target.characterName}
              onChange={(e) => onUpdate(target.id, { characterName: e.target.value })}
              placeholder={target.bannerType === 'weapon' ? 'Weapon name' : 'Character name'}
            />
            <Select
              label={target.bannerType === 'weapon' ? 'Refinement' : 'Constellation'}
              value={String(target.constellation)}
              onChange={(e) => onUpdate(target.id, { constellation: Number(e.target.value) })}
              options={
                target.bannerType === 'weapon'
                  ? [
                      { value: '0', label: 'R1 (1 copy)' },
                      { value: '1', label: 'R2 (2 copies)' },
                      { value: '2', label: 'R3 (3 copies)' },
                      { value: '3', label: 'R4 (4 copies)' },
                      { value: '4', label: 'R5 (5 copies)' },
                    ]
                  : [
                      { value: '0', label: 'C0 (1 copy)' },
                      { value: '1', label: 'C1 (2 copies)' },
                      { value: '2', label: 'C2 (3 copies)' },
                      { value: '3', label: 'C3 (4 copies)' },
                      { value: '4', label: 'C4 (5 copies)' },
                      { value: '5', label: 'C5 (6 copies)' },
                      { value: '6', label: 'C6 (7 copies)' },
                    ]
              }
              error={errors.get(`constellation-${target.id}`)}
            />
          </div>

          {/* First target always shows pity inputs; subsequent targets have inherit option */}
          {isFirstTarget ? (
            <PityInputs target={target} errors={errors} onUpdate={onUpdate} />
          ) : (
            <InheritablePityInputs target={target} errors={errors} onUpdate={onUpdate} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PityInputsProps {
  target: Target;
  errors: Map<string, string>;
  onUpdate: (id: string, updates: Partial<Target>) => void;
}

function PityInputs({ target, errors, onUpdate }: PityInputsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Input
        label="Current Pity"
        type="number"
        value={target.pity}
        onChange={(e) => onUpdate(target.id, { pity: Number(e.target.value) })}
        error={errors.get(`pity-${target.id}`)}
        min={0}
        max={target.bannerType === 'weapon' ? 79 : 89}
      />
      {target.bannerType === 'character' ? (
        <Input
          label="Radiant Streak"
          type="number"
          value={target.radiantStreak}
          onChange={(e) => onUpdate(target.id, { radiantStreak: Number(e.target.value) })}
          error={errors.get(`radiant-${target.id}`)}
          min={0}
          max={3}
        />
      ) : target.bannerType === 'weapon' ? (
        <Input
          label="Fate Points"
          type="number"
          value={target.fatePoints}
          onChange={(e) => onUpdate(target.id, { fatePoints: Number(e.target.value) })}
          error={errors.get(`fatePoints-${target.id}`)}
          min={0}
          max={2}
        />
      ) : null}
      <div className="flex items-center gap-2 col-span-2">
        <input
          type="checkbox"
          id={`guaranteed-${target.id}`}
          checked={target.guaranteed}
          onChange={(e) => onUpdate(target.id, { guaranteed: e.target.checked })}
          className="rounded"
        />
        <label htmlFor={`guaranteed-${target.id}`}>Guaranteed 5★</label>
      </div>
    </div>
  );
}

function InheritablePityInputs({ target, errors, onUpdate }: PityInputsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`inherit-${target.id}`}
          checked={target.useInheritedPity}
          onChange={(e) => onUpdate(target.id, { useInheritedPity: e.target.checked })}
          className="rounded"
        />
        <label htmlFor={`inherit-${target.id}`} className="text-sm">
          Inherit pity from previous target&apos;s pulls
        </label>
      </div>

      {target.useInheritedPity ? (
        <p className="text-sm text-slate-400 pl-6">
          Pity state will carry over from simulation results of previous target(s)
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-slate-700">
          <Input
            label="Starting Pity"
            type="number"
            value={target.pity}
            onChange={(e) => onUpdate(target.id, { pity: Number(e.target.value) })}
            error={errors.get(`pity-${target.id}`)}
            min={0}
            max={target.bannerType === 'weapon' ? 79 : 89}
          />
          {target.bannerType === 'character' ? (
            <Input
              label="Radiant Streak"
              type="number"
              value={target.radiantStreak}
              onChange={(e) => onUpdate(target.id, { radiantStreak: Number(e.target.value) })}
              error={errors.get(`radiant-${target.id}`)}
              min={0}
              max={3}
            />
          ) : target.bannerType === 'weapon' ? (
            <Input
              label="Fate Points"
              type="number"
              value={target.fatePoints}
              onChange={(e) => onUpdate(target.id, { fatePoints: Number(e.target.value) })}
              error={errors.get(`fatePoints-${target.id}`)}
              min={0}
              max={2}
            />
          ) : null}
          <div className="flex items-center gap-2 col-span-2">
            <input
              type="checkbox"
              id={`guaranteed-${target.id}`}
              checked={target.guaranteed}
              onChange={(e) => onUpdate(target.id, { guaranteed: e.target.checked })}
              className="rounded"
            />
            <label htmlFor={`guaranteed-${target.id}`}>Guaranteed 5★</label>
          </div>
        </div>
      )}
    </div>
  );
}

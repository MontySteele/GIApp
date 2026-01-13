import { useMemo } from 'react';
import {
  Check,
  AlertTriangle,
  X,
  ChevronUp,
  Sword,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { Character, BuildTemplate } from '@/types';

interface BuildGapDisplayProps {
  character: Character;
  template: BuildTemplate;
  compact?: boolean;
}

interface GapItem {
  label: string;
  current: string;
  target: string;
  status: 'complete' | 'partial' | 'missing';
  category: 'level' | 'weapon' | 'artifact' | 'talent' | 'stats';
}

interface BuildGapAnalysis {
  overallScore: number;
  gaps: GapItem[];
  levelGaps: GapItem[];
  weaponGaps: GapItem[];
  artifactGaps: GapItem[];
  talentGaps: GapItem[];
}

function analyzeGap(character: Character, template: BuildTemplate): BuildGapAnalysis {
  const gaps: GapItem[] = [];
  let totalItems = 0;
  let completeItems = 0;

  // Level gap
  const targetLevel = template.leveling.targetLevel || 90;
  const levelStatus = character.level >= targetLevel
    ? 'complete'
    : character.level >= targetLevel - 10
    ? 'partial'
    : 'missing';
  const levelGap: GapItem = {
    label: 'Character Level',
    current: `Lv.${character.level}`,
    target: `Lv.${targetLevel}`,
    status: levelStatus,
    category: 'level',
  };
  gaps.push(levelGap);
  totalItems++;
  if (levelStatus === 'complete') completeItems++;
  else if (levelStatus === 'partial') completeItems += 0.5;

  // Ascension gap
  const targetAscension = template.leveling.targetAscension || 6;
  const ascensionStatus = character.ascension >= targetAscension
    ? 'complete'
    : character.ascension >= targetAscension - 1
    ? 'partial'
    : 'missing';
  const ascensionGap: GapItem = {
    label: 'Ascension',
    current: `A${character.ascension}`,
    target: `A${targetAscension}`,
    status: ascensionStatus,
    category: 'level',
  };
  gaps.push(ascensionGap);
  totalItems++;
  if (ascensionStatus === 'complete') completeItems++;
  else if (ascensionStatus === 'partial') completeItems += 0.5;

  // Weapon gap
  const primaryWeapons = template.weapons.primary.map((w) => w.toLowerCase());
  const altWeapons = template.weapons.alternatives.map((w) => w.toLowerCase());
  const currentWeaponKey = character.weapon?.key?.toLowerCase() || '';

  let weaponStatus: 'complete' | 'partial' | 'missing' = 'missing';
  if (primaryWeapons.includes(currentWeaponKey)) {
    weaponStatus = 'complete';
  } else if (altWeapons.includes(currentWeaponKey)) {
    weaponStatus = 'partial';
  }

  const weaponGap: GapItem = {
    label: 'Weapon',
    current: character.weapon?.key || 'None',
    target: template.weapons.primary[0] || 'Any',
    status: weaponStatus,
    category: 'weapon',
  };
  gaps.push(weaponGap);
  totalItems++;
  if (weaponStatus === 'complete') completeItems++;
  else if (weaponStatus === 'partial') completeItems += 0.5;

  // Talent gaps
  const talentTarget = template.leveling.talentTarget || { auto: 9, skill: 9, burst: 9 };
  const talentNames = ['auto', 'skill', 'burst'] as const;

  for (const talentName of talentNames) {
    const currentLevel = character.talent[talentName];
    const targetLevel = talentTarget[talentName];

    let status: 'complete' | 'partial' | 'missing' = 'missing';
    if (currentLevel >= targetLevel) {
      status = 'complete';
    } else if (currentLevel >= targetLevel - 2) {
      status = 'partial';
    }

    gaps.push({
      label: `${talentName.charAt(0).toUpperCase() + talentName.slice(1)} Talent`,
      current: `${currentLevel}`,
      target: `${targetLevel}`,
      status,
      category: 'talent',
    });
    totalItems++;
    if (status === 'complete') completeItems++;
    else if (status === 'partial') completeItems += 0.5;
  }

  // Artifact set gap
  if (template.artifacts.sets.length > 0) {
    const recommendedSets = template.artifacts.sets[0] || [];
    const characterSets = new Map<string, number>();

    for (const artifact of character.artifacts || []) {
      const setKey = artifact?.setKey?.toLowerCase() || '';
      if (setKey) {
        characterSets.set(setKey, (characterSets.get(setKey) || 0) + 1);
      }
    }

    let setMatchScore = 0;
    for (const rec of recommendedSets) {
      const recSetKey = rec.setKey.toLowerCase();
      const owned = characterSets.get(recSetKey) || 0;
      if (owned >= rec.pieces) {
        setMatchScore += 1;
      } else if (owned >= 2) {
        setMatchScore += 0.5;
      }
    }

    const setStatus = setMatchScore >= recommendedSets.length
      ? 'complete'
      : setMatchScore > 0
      ? 'partial'
      : 'missing';

    const targetSetsStr = recommendedSets
      .map((s) => `${s.pieces}pc ${s.setKey}`)
      .join(' + ');

    gaps.push({
      label: 'Artifact Sets',
      current: [...characterSets.entries()]
        .filter(([_, count]) => count >= 2)
        .map(([set, count]) => `${count >= 4 ? '4pc' : '2pc'} ${set}`)
        .join(' + ') || 'Mixed',
      target: targetSetsStr || 'Any',
      status: setStatus,
      category: 'artifact',
    });
    totalItems++;
    if (setStatus === 'complete') completeItems++;
    else if (setStatus === 'partial') completeItems += 0.5;
  }

  // Main stats gap (simplified check)
  const slotMap: Record<string, string> = {
    sands: 'sands',
    goblet: 'goblet',
    circlet: 'circlet',
  };

  for (const [slot, templateKey] of Object.entries(slotMap)) {
    const recommendedStats = template.artifacts.mainStats[templateKey as keyof typeof template.artifacts.mainStats];
    if (!recommendedStats?.length) continue;

    const artifact = character.artifacts?.find(
      (a) => a?.slotKey === slot
    );
    const currentStat = artifact?.mainStatKey?.toLowerCase() || '';
    const recommendedLower = recommendedStats.map((s) => s.toLowerCase());

    const status = recommendedLower.includes(currentStat)
      ? 'complete'
      : 'missing';

    gaps.push({
      label: `${slot.charAt(0).toUpperCase() + slot.slice(1)} Main Stat`,
      current: currentStat || 'None',
      target: recommendedStats.slice(0, 2).join(' / '),
      status,
      category: 'artifact',
    });
    totalItems++;
    if (status === 'complete') completeItems++;
  }

  const overallScore = totalItems > 0 ? Math.round((completeItems / totalItems) * 100) : 0;

  return {
    overallScore,
    gaps,
    levelGaps: gaps.filter((g) => g.category === 'level'),
    weaponGaps: gaps.filter((g) => g.category === 'weapon'),
    artifactGaps: gaps.filter((g) => g.category === 'artifact'),
    talentGaps: gaps.filter((g) => g.category === 'talent'),
  };
}

function GapStatusIcon({ status }: { status: 'complete' | 'partial' | 'missing' }) {
  switch (status) {
    case 'complete':
      return <Check className="w-4 h-4 text-green-400" />;
    case 'partial':
      return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    case 'missing':
      return <X className="w-4 h-4 text-red-400" />;
  }
}

function GapRow({ gap }: { gap: GapItem }) {
  const bgColor = {
    complete: 'bg-green-900/20 border-green-700/30',
    partial: 'bg-yellow-900/20 border-yellow-700/30',
    missing: 'bg-red-900/20 border-red-700/30',
  }[gap.status];

  return (
    <div className={`flex items-center gap-2 p-2 rounded border ${bgColor}`}>
      <GapStatusIcon status={gap.status} />
      <span className="text-sm text-slate-300 flex-1">{gap.label}</span>
      <span className="text-xs text-slate-400">{gap.current}</span>
      <ChevronUp className="w-3 h-3 text-slate-500 rotate-90" />
      <span className="text-xs text-slate-200 font-medium">{gap.target}</span>
    </div>
  );
}

export default function BuildGapDisplay({
  character,
  template,
  compact = false,
}: BuildGapDisplayProps) {
  const analysis = useMemo(
    () => analyzeGap(character, template),
    [character, template]
  );

  const scoreColor =
    analysis.overallScore >= 80
      ? 'text-green-400'
      : analysis.overallScore >= 50
      ? 'text-yellow-400'
      : 'text-red-400';

  const progressColor =
    analysis.overallScore >= 80
      ? 'bg-green-500'
      : analysis.overallScore >= 50
      ? 'bg-yellow-500'
      : 'bg-red-500';

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: `conic-gradient(${
              analysis.overallScore >= 80 ? '#22c55e' : analysis.overallScore >= 50 ? '#eab308' : '#ef4444'
            } ${analysis.overallScore}%, #1e293b ${analysis.overallScore}%)`,
          }}
        >
          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
            <span className={`text-sm font-bold ${scoreColor}`}>{analysis.overallScore}%</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-200 truncate">
            {template.name}
          </div>
          <div className="text-xs text-slate-400">
            {analysis.gaps.filter((g) => g.status === 'complete').length}/{analysis.gaps.length} complete
          </div>
        </div>
        {analysis.overallScore < 100 && (
          <Badge
            className={`text-xs ${
              analysis.overallScore >= 80
                ? 'bg-green-900/30 text-green-300'
                : analysis.overallScore >= 50
                ? 'bg-yellow-900/30 text-yellow-300'
                : 'bg-red-900/30 text-red-300'
            }`}
          >
            {analysis.gaps.filter((g) => g.status !== 'complete').length} gaps
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Build Gap Analysis</h3>
            <p className="text-sm text-slate-400">
              Comparing to: <span className="text-slate-200">{template.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={`text-2xl font-bold ${scoreColor}`}>{analysis.overallScore}%</div>
              <div className="text-xs text-slate-400">Complete</div>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="stroke-slate-700"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={progressColor.replace('bg-', 'stroke-')}
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${analysis.overallScore}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Level & Ascension */}
        {analysis.levelGaps.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <ChevronUp className="w-4 h-4" />
              Level & Ascension
            </div>
            <div className="space-y-1">
              {analysis.levelGaps.map((gap) => (
                <GapRow key={gap.label} gap={gap} />
              ))}
            </div>
          </div>
        )}

        {/* Weapon */}
        {analysis.weaponGaps.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Sword className="w-4 h-4" />
              Weapon
            </div>
            <div className="space-y-1">
              {analysis.weaponGaps.map((gap) => (
                <GapRow key={gap.label} gap={gap} />
              ))}
            </div>
          </div>
        )}

        {/* Talents */}
        {analysis.talentGaps.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Sparkles className="w-4 h-4" />
              Talents
            </div>
            <div className="space-y-1">
              {analysis.talentGaps.map((gap) => (
                <GapRow key={gap.label} gap={gap} />
              ))}
            </div>
          </div>
        )}

        {/* Artifacts */}
        {analysis.artifactGaps.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Shield className="w-4 h-4" />
              Artifacts
            </div>
            <div className="space-y-1">
              {analysis.artifactGaps.map((gap) => (
                <GapRow key={gap.label} gap={gap} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { analyzeGap, type BuildGapAnalysis, type GapItem };

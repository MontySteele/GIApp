import { useMemo } from 'react';
import { CheckCircle, Info, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  getCharacterBuild,
  isRecommendedSet,
  calculateCharacterFitScore,
  type SlotKey,
} from '../domain/setRecommendations';
import { formatStatName } from '@/lib/gameData';
import type { Character } from '@/types';

interface BuildRecommendationsProps {
  character: Character;
}

const ROLE_COLORS: Record<string, string> = {
  dps: 'bg-red-900/30 border-red-700 text-red-200',
  'sub-dps': 'bg-orange-900/30 border-orange-700 text-orange-200',
  support: 'bg-green-900/30 border-green-700 text-green-200',
  healer: 'bg-pink-900/30 border-pink-700 text-pink-200',
  shielder: 'bg-amber-900/30 border-amber-700 text-amber-200',
};

export default function BuildRecommendations({ character }: BuildRecommendationsProps) {
  const build = useMemo(() => getCharacterBuild(character.key), [character.key]);

  // Calculate how well current artifacts match the build
  const artifactAnalysis = useMemo(() => {
    if (!build || character.artifacts.length === 0) return null;

    const analysis = character.artifacts.map((artifact) => {
      const { score, reasons } = calculateCharacterFitScore(
        character.key,
        artifact.setKey,
        artifact.slotKey as SlotKey,
        artifact.mainStatKey,
        artifact.substats
      );
      return {
        slot: artifact.slotKey,
        setKey: artifact.setKey,
        score,
        reasons,
        isRecommendedSet: isRecommendedSet(character.key, artifact.setKey),
      };
    });

    const avgScore = Math.round(
      analysis.reduce((sum, a) => sum + a.score, 0) / analysis.length
    );

    // Count set bonuses
    const setCounts = new Map<string, number>();
    for (const artifact of character.artifacts) {
      setCounts.set(artifact.setKey, (setCounts.get(artifact.setKey) ?? 0) + 1);
    }

    const activeSets = Array.from(setCounts.entries())
      .filter(([, count]) => count >= 2)
      .map(([key, count]) => ({
        key,
        count: count >= 4 ? 4 : 2,
        isRecommended: isRecommendedSet(character.key, key),
      }));

    return { analysis, avgScore, activeSets };
  }, [build, character.key, character.artifacts]);

  if (!build) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-400" aria-hidden="true" />
            <h2 className="text-xl font-semibold">Build Recommendations</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-lg">
            <Info className="w-5 h-5 text-slate-400" aria-hidden="true" />
            <p className="text-slate-400">
              No build recommendations available for this character yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-400" aria-hidden="true" />
            <h2 className="text-xl font-semibold">Build Recommendations</h2>
          </div>
          <Badge className={ROLE_COLORS[build.role] ?? ''}>
            {build.role.replace('-', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Build Score */}
        {artifactAnalysis && (
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-slate-200">Current Build Score</h3>
              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl font-bold ${
                    artifactAnalysis.avgScore >= 80
                      ? 'text-green-400'
                      : artifactAnalysis.avgScore >= 60
                        ? 'text-yellow-400'
                        : 'text-red-400'
                  }`}
                >
                  {artifactAnalysis.avgScore}
                </span>
                <span className="text-slate-500">/ 100</span>
              </div>
            </div>

            {/* Active Set Bonuses */}
            {artifactAnalysis.activeSets.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-slate-500 mb-2">Active Set Bonuses</div>
                <div className="flex flex-wrap gap-2">
                  {artifactAnalysis.activeSets.map(({ key, count, isRecommended }) => (
                    <div
                      key={key}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                        isRecommended
                          ? 'bg-green-900/30 border border-green-700 text-green-200'
                          : 'bg-slate-800 border border-slate-700 text-slate-300'
                      }`}
                    >
                      {isRecommended && <CheckCircle className="w-3 h-3" aria-hidden="true" />}
                      <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-slate-500">({count}pc)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Per-slot scores */}
            <div className="grid grid-cols-5 gap-2">
              {['flower', 'plume', 'sands', 'goblet', 'circlet'].map((slot) => {
                const analysis = artifactAnalysis.analysis.find((a) => a.slot === slot);
                if (!analysis) {
                  return (
                    <div key={slot} className="text-center p-2 bg-slate-800 rounded">
                      <div className="text-xs text-slate-500 capitalize mb-1">{slot}</div>
                      <div className="text-sm text-slate-600">-</div>
                    </div>
                  );
                }
                return (
                  <div
                    key={slot}
                    className={`text-center p-2 rounded ${
                      analysis.score >= 80
                        ? 'bg-green-900/20 border border-green-800'
                        : analysis.score >= 60
                          ? 'bg-yellow-900/20 border border-yellow-800'
                          : 'bg-slate-800 border border-slate-700'
                    }`}
                    title={analysis.reasons.join(', ')}
                  >
                    <div className="text-xs text-slate-400 capitalize mb-1">{slot}</div>
                    <div
                      className={`text-sm font-medium ${
                        analysis.score >= 80
                          ? 'text-green-400'
                          : analysis.score >= 60
                            ? 'text-yellow-400'
                            : 'text-slate-300'
                      }`}
                    >
                      {analysis.score}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommended Artifact Sets */}
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3">Recommended Artifact Sets</h3>
          <div className="space-y-2">
            {build.recommendedSets.map((setCombo, idx) => {
              const isActive = artifactAnalysis?.activeSets.some((as) =>
                setCombo.some((s) => s.setKey === as.key && s.pieces <= as.count)
              );
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    isActive
                      ? 'bg-green-900/20 border border-green-800'
                      : 'bg-slate-900 border border-slate-800'
                  }`}
                >
                  {isActive && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" aria-hidden="true" />}
                  <div className="flex flex-wrap items-center gap-2">
                    {setCombo.map((set, setIdx) => (
                      <span key={setIdx} className="text-sm text-slate-200">
                        {setIdx > 0 && <span className="text-slate-500"> + </span>}
                        {set.name} ({set.pieces}pc)
                      </span>
                    ))}
                  </div>
                  {idx === 0 && (
                    <Badge variant="primary" className="ml-auto text-[10px]">
                      Best
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Stats */}
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3">Recommended Main Stats</h3>
          <div className="grid grid-cols-3 gap-3">
            {(['sands', 'goblet', 'circlet'] as const).map((slot) => (
              <div key={slot} className="bg-slate-900 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-2 capitalize">{slot}</div>
                <div className="space-y-1">
                  {build.mainStats[slot].map((stat, idx) => {
                    const currentArtifact = character.artifacts.find((a) => a.slotKey === slot);
                    const isCurrentStat =
                      currentArtifact?.mainStatKey.toLowerCase().replace(/%/g, '_') ===
                      stat.toLowerCase();
                    return (
                      <div
                        key={idx}
                        className={`text-sm flex items-center gap-1.5 ${
                          isCurrentStat ? 'text-green-400' : 'text-slate-300'
                        }`}
                      >
                        {isCurrentStat && <CheckCircle className="w-3 h-3" aria-hidden="true" />}
                        {formatStatName(stat)}
                        {idx === 0 && (
                          <span className="text-[10px] text-slate-500 ml-1">(best)</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Substat Priority */}
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3">Substat Priority</h3>
          <div className="flex flex-wrap gap-2">
            {build.substats.map((stat, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-800"
              >
                <span className="text-xs text-slate-500 font-mono">{idx + 1}.</span>
                <span className="text-sm text-slate-200">{formatStatName(stat)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Build Notes */}
        {build.notes && (
          <div className="flex items-start gap-2 p-3 bg-primary-900/20 border border-primary-800 rounded-lg">
            <Info className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-primary-200">{build.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

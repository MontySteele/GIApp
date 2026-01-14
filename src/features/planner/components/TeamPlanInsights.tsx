/**
 * TeamPlanInsights - Display team-level planning insights
 *
 * Shows:
 * - Shared materials across team members
 * - Boss optimization recommendations
 * - Domain efficiency analysis
 */

import { Users, Skull, BookOpen, Sparkles, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface SharedMaterial {
  key: string;
  name: string;
  category: string;
  sharedBy: string[];
  totalNeeded: number;
  totalHave: number;
  deficit: number;
}

interface BossOptimization {
  bossName: string;
  materials: string[];
  benefitsCharacters: string[];
  priority: 'high' | 'medium' | 'low';
}

interface DomainEfficiency {
  domainName: string;
  materials: string[];
  benefitsCharacters: string[];
  daysAvailable: string[];
  efficiency: number;
}

interface TeamPlanInsightsProps {
  teamName: string;
  memberCount: number;
  sharedMaterials: SharedMaterial[];
  bossOptimizations: BossOptimization[];
  domainEfficiencies: DomainEfficiency[];
  aggregateStats: {
    totalMora: number;
    totalExp: number;
    totalResin: number;
    estimatedDays: number;
    sharedMaterialCount: number;
    bossesNeeded: number;
  };
}

export default function TeamPlanInsights({
  teamName,
  memberCount,
  sharedMaterials,
  bossOptimizations,
  domainEfficiencies,
  aggregateStats,
}: TeamPlanInsightsProps) {
  return (
    <div className="space-y-6">
      {/* Team Overview Card */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary-500/20 rounded-lg">
            <Users className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold">{teamName}</h3>
            <p className="text-sm text-slate-400">{memberCount} members</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatBlock label="Total Mora" value={formatNumber(aggregateStats.totalMora)} />
          <StatBlock label="EXP Books" value={formatNumber(aggregateStats.totalExp)} />
          <StatBlock label="Est. Resin" value={formatNumber(aggregateStats.totalResin)} />
          <StatBlock label="Est. Days" value={aggregateStats.estimatedDays.toString()} />
        </div>
      </Card>

      {/* Shared Materials */}
      {sharedMaterials.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold">Shared Materials</h3>
            <span className="text-sm text-slate-400">
              ({sharedMaterials.length} materials benefit multiple characters)
            </span>
          </div>

          <div className="space-y-3">
            {sharedMaterials.slice(0, 5).map((mat) => (
              <div
                key={mat.key}
                className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg"
              >
                <div>
                  <div className="font-medium text-sm">{mat.name}</div>
                  <div className="text-xs text-slate-400">
                    Needed by: {mat.sharedBy.join(', ')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    {mat.totalHave} / {mat.totalNeeded}
                  </div>
                  {mat.deficit > 0 && (
                    <div className="text-xs text-red-400">-{mat.deficit} needed</div>
                  )}
                </div>
              </div>
            ))}

            {sharedMaterials.length > 5 && (
              <div className="text-sm text-slate-400 text-center">
                +{sharedMaterials.length - 5} more shared materials
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Boss Optimization */}
      {bossOptimizations.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Skull className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold">Boss Priority</h3>
            <span className="text-sm text-slate-400">
              (Farm these first for max efficiency)
            </span>
          </div>

          <div className="space-y-3">
            {bossOptimizations.map((boss) => (
              <div
                key={boss.bossName}
                className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <PriorityBadge priority={boss.priority} />
                  <div>
                    <div className="font-medium text-sm">{boss.bossName}</div>
                    <div className="text-xs text-slate-400">
                      Benefits: {boss.benefitsCharacters.join(', ')}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-slate-400">
                  {boss.benefitsCharacters.length}/{memberCount} members
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Domain Efficiency */}
      {domainEfficiencies.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold">Domain Efficiency</h3>
            <span className="text-sm text-slate-400">
              (Optimize your daily domain runs)
            </span>
          </div>

          <div className="space-y-3">
            {domainEfficiencies.map((domain) => (
              <div
                key={domain.domainName}
                className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg"
              >
                <div>
                  <div className="font-medium text-sm">{domain.domainName}</div>
                  <div className="text-xs text-slate-400">
                    {domain.daysAvailable.join(', ')}
                  </div>
                  <div className="text-xs text-slate-500">
                    For: {domain.benefitsCharacters.join(', ')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <EfficiencyBar efficiency={domain.efficiency} />
                  <span className="text-sm font-medium">
                    {Math.round(domain.efficiency * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* No insights message */}
      {sharedMaterials.length === 0 &&
        bossOptimizations.length === 0 &&
        domainEfficiencies.length === 0 && (
          <Card className="p-8 text-center">
            <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">
              No Team Insights Available
            </h3>
            <p className="text-slate-400">
              Team insights will appear once material calculations are complete.
            </p>
          </Card>
        )}
    </div>
  );
}

// Helper components

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-slate-200">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded border ${colors[priority]}`}
    >
      {priority.toUpperCase()}
    </span>
  );
}

function EfficiencyBar({ efficiency }: { efficiency: number }) {
  const width = Math.round(efficiency * 100);
  const color =
    efficiency >= 0.75
      ? 'bg-green-500'
      : efficiency >= 0.5
        ? 'bg-amber-500'
        : 'bg-red-500';

  return (
    <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} transition-all`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

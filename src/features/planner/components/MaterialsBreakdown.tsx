import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { MaterialsList, GroupedMaterialsList } from './MaterialsList';
import { RESIN_REGEN } from '../domain/materialConstants';
import type { AscensionSummary } from '../domain/ascensionCalculator';
import type { AggregatedMaterialSummary } from '../domain/multiCharacterCalculator';

interface ResinBreakdownDisplayProps {
  resinBreakdown: { talentBoss: number; expMora: number };
}

function ResinBreakdownDisplay({ resinBreakdown }: ResinBreakdownDisplayProps) {
  return (
    <div className="mt-4 pt-4 border-t border-slate-700/50">
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-slate-900/50 rounded-lg p-3">
          <div className="text-lg font-bold text-blue-400">
            {resinBreakdown.talentBoss.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">Talents / Boss</div>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3">
          <div className="text-lg font-bold text-green-400">
            {resinBreakdown.expMora.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">EXP / Mora</div>
        </div>
      </div>
    </div>
  );
}

interface SummaryStatsProps {
  totalMora: number;
  totalExp: number;
  estimatedResin: number;
  estimatedDays: number;
  resinBreakdown?: { talentBoss: number; expMora: number };
}

function SummaryStats({
  totalMora,
  totalExp,
  estimatedResin,
  estimatedDays,
  resinBreakdown,
}: SummaryStatsProps) {
  return (
    <div className="mt-6 pt-4 border-t border-slate-700">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-slate-100">
            {totalMora.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">Total Mora</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-100">
            {Math.ceil(totalExp / 20000).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">Hero's Wit</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-primary-400">
            {estimatedResin.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">Total Resin</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-primary-400">
            {estimatedDays}
          </div>
          <div className="text-xs text-slate-400">Days (~{RESIN_REGEN.perDay}/day)</div>
        </div>
      </div>
      {resinBreakdown && <ResinBreakdownDisplay resinBreakdown={resinBreakdown} />}
    </div>
  );
}

interface SingleMaterialsBreakdownProps {
  summary: AscensionSummary;
  isExpanded: boolean;
  isCalculating: boolean;
  onToggle: () => void;
  onUpdateMaterial?: (key: string, count: number) => void;
}

export function SingleMaterialsBreakdown({
  summary,
  isExpanded,
  isCalculating,
  onToggle,
  onUpdateMaterial,
}: SingleMaterialsBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <button
          className="flex items-center justify-between w-full"
          onClick={onToggle}
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
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <MaterialsList materials={summary.materials} onUpdateMaterial={onUpdateMaterial} />
          <SummaryStats
            totalMora={summary.totalMora}
            totalExp={summary.totalExp}
            estimatedResin={summary.estimatedResin}
            estimatedDays={summary.estimatedDays}
            resinBreakdown={summary.resinBreakdown}
          />
        </CardContent>
      )}
    </Card>
  );
}

interface MultiMaterialsBreakdownProps {
  summary: AggregatedMaterialSummary;
  isExpanded: boolean;
  isCalculating: boolean;
  onToggle: () => void;
  onUpdateMaterial?: (key: string, count: number) => void;
}

export function MultiMaterialsBreakdown({
  summary,
  isExpanded,
  isCalculating,
  onToggle,
  onUpdateMaterial,
}: MultiMaterialsBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <button
          className="flex items-center justify-between w-full"
          onClick={onToggle}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Combined Materials Required</h2>
            {isCalculating && (
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                Loading...
              </div>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <GroupedMaterialsList groupedMaterials={summary.groupedMaterials} onUpdateMaterial={onUpdateMaterial} />
          <SummaryStats
            totalMora={summary.totalMora}
            totalExp={summary.totalExp}
            estimatedResin={summary.totalEstimatedResin}
            estimatedDays={summary.totalEstimatedDays}
            resinBreakdown={summary.resinBreakdown}
          />
        </CardContent>
      )}
    </Card>
  );
}

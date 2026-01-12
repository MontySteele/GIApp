import { useCallback, useEffect, useState } from 'react';
import { Package, Coins, AlertCircle, WifiOff } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { RESIN_REGEN } from '../domain/materialConstants';

interface MaterialInventoryStatusProps {
  hasMaterials: boolean;
  totalMaterialTypes: number;
  currentMora: number;
  onMoraChange: (value: number) => Promise<void>;
}

export function MaterialInventoryStatus({
  hasMaterials,
  totalMaterialTypes,
  currentMora,
  onMoraChange,
}: MaterialInventoryStatusProps) {
  const [moraInput, setMoraInput] = useState<string>('');

  // Initialize mora input from prop
  useEffect(() => {
    setMoraInput(currentMora > 0 ? currentMora.toString() : '');
  }, [currentMora]);

  const handleMoraInputChange = useCallback((value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setMoraInput(numericValue);
  }, []);

  const handleMoraSave = useCallback(async () => {
    const moraValue = parseInt(moraInput, 10) || 0;
    await onMoraChange(moraValue);
  }, [moraInput, onMoraChange]);

  return (
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
                onChange={(e) => handleMoraInputChange(e.target.value)}
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
  );
}

interface CalculationErrorCardProps {
  error: string;
}

export function CalculationErrorCard({ error }: CalculationErrorCardProps) {
  return (
    <Card className="mb-6 border-red-900/30 bg-red-900/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div>
            <div className="text-sm font-medium text-red-200">Calculation Error</div>
            <div className="text-xs text-red-400">{error}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StaleDataWarningProps {
  message?: string;
}

export function StaleDataWarning({ message }: StaleDataWarningProps) {
  return (
    <Card className="mb-6 border-yellow-900/30 bg-yellow-900/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-yellow-500" />
          <div>
            <div className="text-sm font-medium text-yellow-200">Using Cached Data</div>
            <div className="text-xs text-yellow-400">
              {message || 'Material data may be outdated. Check your internet connection.'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ResinTipsCard() {
  return (
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
  );
}

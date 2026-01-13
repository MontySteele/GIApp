import { Sparkles, Swords, Gift, BookOpen } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { useAllCurrentPity } from '../hooks/useCurrentPity';
import type { BannerType } from '@/types';

interface BannerPityDisplayProps {
  banner: BannerType;
  label: string;
  icon: typeof Sparkles;
  pity: number;
  guaranteed: boolean;
  fatePoints?: number;
  radianceActive?: boolean;
  hardPity: number;
}

function BannerPityDisplay({
  label,
  icon: Icon,
  pity,
  guaranteed,
  fatePoints,
  radianceActive,
  hardPity,
}: BannerPityDisplayProps) {
  const progress = Math.min((pity / hardPity) * 100, 100);
  const isNearPity = pity >= hardPity - 20;

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className={`p-2 rounded-lg ${isNearPity ? 'bg-amber-900/30' : 'bg-slate-800'}`}>
        <Icon className={`w-4 h-4 ${isNearPity ? 'text-amber-400' : 'text-slate-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-slate-200 truncate">{label}</span>
          <span className={`text-sm font-bold ${isNearPity ? 'text-amber-400' : 'text-slate-300'}`}>
            {pity}/{hardPity}
          </span>
          {guaranteed && (
            <Badge className="text-xs bg-green-900/30 text-green-300 border border-green-700/50">
              Guaranteed
            </Badge>
          )}
          {radianceActive && (
            <Badge className="text-xs bg-purple-900/30 text-purple-300 border border-purple-700/50">
              Radiance
            </Badge>
          )}
          {fatePoints !== undefined && fatePoints > 0 && (
            <Badge className="text-xs bg-blue-900/30 text-blue-300 border border-blue-700/50">
              {fatePoints}/2 EP
            </Badge>
          )}
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${isNearPity ? 'bg-amber-500' : 'bg-primary-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function PityHeader() {
  const pityState = useAllCurrentPity();

  if (!pityState) {
    return (
      <div className="bg-slate-900/50 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-center h-12">
          <span className="text-sm text-slate-500">Loading pity state...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border-b border-slate-800 px-4 py-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <BannerPityDisplay
          banner="character"
          label="Character"
          icon={Sparkles}
          pity={pityState.character.pity}
          guaranteed={pityState.character.guaranteed}
          radianceActive={pityState.character.radianceActive}
          hardPity={90}
        />
        <BannerPityDisplay
          banner="weapon"
          label="Weapon"
          icon={Swords}
          pity={pityState.weapon.pity}
          guaranteed={pityState.weapon.guaranteed}
          fatePoints={pityState.weapon.fatePoints}
          hardPity={80}
        />
        <BannerPityDisplay
          banner="standard"
          label="Standard"
          icon={Gift}
          pity={pityState.standard.pity}
          guaranteed={false}
          hardPity={90}
        />
        <BannerPityDisplay
          banner="chronicled"
          label="Chronicled"
          icon={BookOpen}
          pity={pityState.chronicled.pity}
          guaranteed={pityState.chronicled.guaranteed}
          hardPity={90}
        />
      </div>
    </div>
  );
}

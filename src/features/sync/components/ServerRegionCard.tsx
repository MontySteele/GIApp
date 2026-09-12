import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import {
  SERVER_REGIONS,
  SERVER_REGION_LABELS,
  SERVER_UTC_OFFSET_HOURS,
  getNextDailyReset,
  getNextWeeklyReset,
  isServerRegion,
  serverOffsetString,
} from '@/lib/time/serverTime';
import { useUIStore, useServerRegion } from '@/stores/uiStore';

const REGION_OPTIONS = SERVER_REGIONS.map((region) => ({
  value: region,
  label: `${SERVER_REGION_LABELS[region]} (UTC${serverOffsetString(region)})`,
}));

function formatLocal(date: Date): string {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatUntil(target: Date, now: Date): string {
  const diff = Math.max(0, target.getTime() - now.getTime());
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(' ');
}

/**
 * Lets the user pick which Genshin server they play on and previews the next
 * daily / weekly reset for that server in their local time.
 */
export default function ServerRegionCard() {
  const region = useServerRegion();
  const updateSettings = useUIStore((state) => state.updateSettings);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const nextDaily = getNextDailyReset(region, now);
  const nextWeekly = getNextWeeklyReset(region, now);
  const offset = SERVER_UTC_OFFSET_HOURS[region];

  return (
    <Card data-testid="server-region-card">
      <CardHeader>
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Server Region
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Daily and weekly resets, and today&apos;s domain rotation, follow your server&apos;s clock
          (04:00 server time). Genshin servers do not observe daylight saving.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          id="server-region-select"
          label="Server"
          options={REGION_OPTIONS}
          value={region}
          onChange={(event) => {
            const next = event.target.value;
            if (isServerRegion(next)) {
              updateSettings({ serverRegion: next });
            }
          }}
          description={`Server clock is UTC${offset >= 0 ? '+' : ''}${offset}.`}
        />

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/50">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Next daily reset</dt>
            <dd className="text-slate-200 mt-1">
              <time dateTime={nextDaily.toISOString()} data-testid="next-daily-reset">
                {formatLocal(nextDaily)}
              </time>
              <span className="text-slate-400"> · in {formatUntil(nextDaily, now)}</span>
            </dd>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/50">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Next weekly reset</dt>
            <dd className="text-slate-200 mt-1">
              <time dateTime={nextWeekly.toISOString()} data-testid="next-weekly-reset">
                {formatLocal(nextWeekly)}
              </time>
              <span className="text-slate-400"> · in {formatUntil(nextWeekly, now)}</span>
            </dd>
          </div>
        </dl>
        <p className="text-xs text-slate-500">Times shown in your local timezone.</p>
      </CardContent>
    </Card>
  );
}

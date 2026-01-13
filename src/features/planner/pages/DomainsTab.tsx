/**
 * DomainsTab - Domain schedule and reset timers
 *
 * Shows the weekly domain schedule for talent books and weapon materials,
 * plus server reset timers (merged from Calendar).
 */

import { ExternalLink, Info, Calendar as CalendarIcon } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import DomainScheduleCard from '../components/DomainScheduleCard';
import ResetTimers from '@/features/calendar/components/ResetTimers';
import { Card } from '@/components/ui/Card';

/**
 * Open external URL in browser using Tauri's shell plugin
 */
function openExternal(url: string) {
  open(url).catch((err) => {
    console.error('Failed to open URL:', err);
    // Fallback for non-Tauri environments (e.g., browser dev mode)
    window.open(url, '_blank', 'noopener,noreferrer');
  });
}

export default function DomainsTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">Domain Schedule</h1>
        <p className="text-slate-400">
          Plan your daily domain runs based on material availability
        </p>
      </div>

      {/* Reset Timers */}
      <ResetTimers />

      {/* Domain Schedule */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Weekly Material Schedule</h2>
        <DomainScheduleCard />
      </div>

      {/* Events Link Card */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-200">Events & Timelines</h2>
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary-500/20 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-primary-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-slate-200 mb-2">
                View Current Events & Banners
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                For the most up-to-date event information, banners, and timelines,
                visit Paimon.moe's calendar which is maintained by the community.
              </p>
              <button
                onClick={() => openExternal('https://paimon.moe/timeline')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
              >
                Open Paimon.moe Timeline
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-200">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ResourceLink
            title="Paimon.moe Calendar"
            description="Events, banners, birthdays"
            url="https://paimon.moe/timeline"
          />
          <ResourceLink
            title="HoYoLAB Events"
            description="Official event announcements"
            url="https://www.hoyolab.com/home"
          />
          <ResourceLink
            title="Daily Check-In"
            description="Claim daily login rewards"
            url="https://act.hoyolab.com/ys/event/signin-sea-v3/index.html?act_id=e202102251931481"
          />
        </div>
      </div>

      {/* Info footer */}
      <div className="bg-slate-800/30 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-slate-500">
          <p>
            Reset times are calculated for <strong>US Server (UTC-5)</strong>.
            All timers update automatically. Domain materials rotate daily at server reset.
          </p>
        </div>
      </div>
    </div>
  );
}

function ResourceLink({
  title,
  description,
  url,
}: {
  title: string;
  description: string;
  url: string;
}) {
  return (
    <button
      onClick={() => openExternal(url)}
      className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-primary-500/50 transition-colors group text-left w-full"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-200 group-hover:text-primary-400 transition-colors">
          {title}
        </h3>
        <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-primary-400 transition-colors" />
      </div>
      <p className="text-sm text-slate-400 mt-1">{description}</p>
    </button>
  );
}

/**
 * BannersTab - Banner information and external resources
 *
 * Links to external community resources for up-to-date banner information.
 * Since banner data changes frequently and there's no public API,
 * we direct users to well-maintained community sites.
 */

import { ExternalLink, Calendar, Info, Clock, Star } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import { Card } from '@/components/ui/Card';

/**
 * Open external URL in browser
 */
function openExternal(url: string) {
  open(url).catch((err) => {
    console.error('Failed to open URL:', err);
    window.open(url, '_blank', 'noopener,noreferrer');
  });
}

export default function BannersTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">Banner Information</h1>
        <p className="text-slate-400">
          View current and upcoming banners, character rerun history, and more
        </p>
      </div>

      {/* Info Card */}
      <Card className="p-4 border-primary-500/30 bg-primary-500/5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-primary-400">Community Resources</h3>
            <p className="text-sm text-slate-400 mt-1">
              Banner information changes frequently. We link to community-maintained
              resources that provide the most accurate and up-to-date data.
            </p>
          </div>
        </div>
      </Card>

      {/* Primary Resources */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Current Banners & Timeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResourceCard
            icon={Calendar}
            title="Paimon.moe Timeline"
            description="Comprehensive event calendar, banner schedule, and countdown timers"
            url="https://paimon.moe/timeline"
            primary
          />
          <ResourceCard
            icon={Clock}
            title="Paimon.moe Wish Counter"
            description="Track your pity, view pull statistics, and import wish history"
            url="https://paimon.moe/wish"
            primary
          />
        </div>
      </div>

      {/* Character Rerun History */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Character Rerun History</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ResourceCard
            icon={Star}
            title="Samsara Banner Tracker"
            description="Track how long since each character's last banner appearance"
            url="https://samsara.pages.dev/"
          />
          <ResourceCard
            icon={Star}
            title="Genshin Banners Statistics"
            description="Complete banner history analysis and rerun predictions"
            url="https://genshin-banners.com/"
          />
          <ResourceCard
            icon={Star}
            title="Game8 Banner History"
            description="Full list of all past banners with featured characters"
            url="https://game8.co/games/Genshin-Impact/archives/297500"
          />
        </div>
      </div>

      {/* Additional Resources */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Additional Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ResourceCard
            icon={ExternalLink}
            title="Genshin Wiki"
            description="Official fan wiki with detailed banner and character information"
            url="https://genshin-impact.fandom.com/wiki/Wishes"
          />
          <ResourceCard
            icon={ExternalLink}
            title="HoYoLAB"
            description="Official community hub with announcements and news"
            url="https://www.hoyolab.com/home"
          />
          <ResourceCard
            icon={ExternalLink}
            title="Reddit r/Genshin_Impact"
            description="Community discussions and leak-free banner speculation"
            url="https://www.reddit.com/r/Genshin_Impact/"
          />
        </div>
      </div>

      {/* Tips */}
      <Card className="p-4 bg-slate-800/50">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          Banner Planning Tips
        </h3>
        <ul className="text-sm text-slate-400 space-y-2">
          <li>• <strong>Average rerun cycle:</strong> 5-6 versions (~10-12 months) for most characters</li>
          <li>• <strong>Popular characters</strong> like Raiden and Kazuha may rerun more frequently</li>
          <li>• <strong>Archon reruns</strong> often coincide with story updates for their regions</li>
          <li>• <strong>Anniversary banners</strong> (late September) often feature popular reruns</li>
          <li>• <strong>Lantern Rite</strong> (Chinese New Year) typically features Liyue character reruns</li>
        </ul>
      </Card>
    </div>
  );
}

function ResourceCard({
  icon: Icon,
  title,
  description,
  url,
  primary = false,
}: {
  icon: typeof Calendar;
  title: string;
  description: string;
  url: string;
  primary?: boolean;
}) {
  return (
    <button
      onClick={() => openExternal(url)}
      className={`text-left w-full p-4 rounded-lg border transition-colors group ${
        primary
          ? 'bg-primary-500/10 border-primary-500/30 hover:border-primary-500/50'
          : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${primary ? 'bg-primary-500/20' : 'bg-slate-700'}`}>
          <Icon className={`w-5 h-5 ${primary ? 'text-primary-400' : 'text-slate-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`font-medium group-hover:text-primary-400 transition-colors ${
              primary ? 'text-primary-300' : 'text-slate-200'
            }`}>
              {title}
            </h3>
            <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-primary-400 transition-colors flex-shrink-0" />
          </div>
          <p className="text-sm text-slate-400 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
}

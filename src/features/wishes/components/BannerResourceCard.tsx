import { ExternalLink, type LucideIcon } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';

function openExternal(url: string) {
  open(url).catch((err) => {
    console.error('Failed to open URL:', err);
    window.open(url, '_blank', 'noopener,noreferrer');
  });
}

interface BannerResourceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  url: string;
  primary?: boolean;
}

export default function BannerResourceCard({
  icon: Icon,
  title,
  description,
  url,
  primary = false,
}: BannerResourceCardProps) {
  return (
    <button
      type="button"
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
            <h3
              className={`font-medium group-hover:text-primary-400 transition-colors ${
                primary ? 'text-primary-300' : 'text-slate-200'
              }`}
            >
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

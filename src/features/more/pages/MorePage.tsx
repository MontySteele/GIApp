import { Link } from 'react-router-dom';
import {
  ArrowRight,
  NotebookText,
  Settings,
  Target,
  UsersRound,
  WandSparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface MoreLink {
  label: string;
  detail: string;
  href: string;
  icon: LucideIcon;
}

const MORE_LINKS: MoreLink[] = [
  {
    label: 'Teams',
    detail: 'Teams, bosses',
    href: '/teams',
    icon: UsersRound,
  },
  {
    label: 'Planner',
    detail: 'Materials, domains',
    href: '/planner',
    icon: Target,
  },
  {
    label: 'Build Templates',
    detail: 'Roster builds',
    href: '/roster/builds',
    icon: WandSparkles,
  },
  {
    label: 'Notes',
    detail: 'Planning notes',
    href: '/notes',
    icon: NotebookText,
  },
  {
    label: 'Settings & Sync',
    detail: 'Import, backup, restore',
    href: '/settings',
    icon: Settings,
  },
];

export default function MorePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-3xl font-bold">More</h1>
        <p className="text-slate-400">Secondary planning tools and account utilities.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {MORE_LINKS.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className="flex items-center justify-between gap-4 rounded-lg border border-slate-700 bg-slate-800 p-4 transition-colors hover:border-primary-500 hover:bg-slate-800/80"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-primary-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-slate-100">{item.label}</span>
                  <span className="mt-0.5 block text-sm text-slate-400">{item.detail}</span>
                </span>
              </span>
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-500" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

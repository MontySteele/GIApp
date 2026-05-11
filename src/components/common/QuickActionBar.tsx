import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Database, Edit3, NotebookPen, Plus, Sparkles, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
}

const ACTIONS: QuickAction[] = [
  { label: 'Start Target', href: '/campaigns', icon: Target },
  { label: 'Log Primos', href: '/#quick-resource-logger', icon: Sparkles },
  { label: 'Update Pity', href: '/pulls/history', icon: Edit3 },
  { label: 'Import Data', href: '/imports', icon: Database },
  { label: 'Add Note', href: '/notes', icon: NotebookPen },
];

export default function QuickActionBar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const desktopVisibilityClass = location.pathname === '/' ? 'md:hidden' : 'md:block';

  return (
    <div className={`fixed bottom-20 right-4 z-40 hidden md:bottom-6 ${desktopVisibilityClass}`}>
      {open && (
        <div className="mb-2 w-48 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
          {ACTIONS.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.href}
                to={action.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 transition-colors hover:bg-slate-800"
              >
                <Icon className="h-4 w-4 text-primary-300" aria-hidden="true" />
                <span>{action.label}</span>
              </Link>
            );
          })}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-slate-950"
        aria-expanded={open}
        aria-label="Quick actions"
      >
        <Plus className={`h-5 w-5 transition-transform ${open ? 'rotate-45' : ''}`} aria-hidden="true" />
      </button>
    </div>
  );
}

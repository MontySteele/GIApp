import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Sparkles,
  Target,
  Settings,
} from 'lucide-react';
import { TABS } from '@/lib/constants';

const icons = {
  dashboard: LayoutDashboard,
  roster: Users,
  teams: UsersRound,
  pulls: Sparkles,
  planner: Target,
  settings: Settings,
};

export default function TabNav() {
  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-[73px] z-40 hidden md:block">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex gap-1 overflow-x-auto scrollbar-thin">
          {TABS.map((tab) => {
            const Icon = icons[tab.id as keyof typeof icons];
            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                end={tab.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-primary-400 border-b-2 border-primary-400'
                      : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

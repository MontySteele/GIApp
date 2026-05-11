import { NavLink } from 'react-router-dom';
import { Users, Sword, Gem, Layers, UsersRound, Target, Calendar, Skull } from 'lucide-react';

const SUB_TABS = [
  { id: 'characters', label: 'Characters', path: '/roster', icon: Users, end: true },
  { id: 'teams', label: 'Teams', path: '/roster/teams', icon: UsersRound, end: false },
  { id: 'weapons', label: 'Weapons', path: '/roster/weapons', icon: Sword, end: false },
  { id: 'artifacts', label: 'Artifacts', path: '/roster/artifacts', icon: Gem, end: false },
  { id: 'builds', label: 'Builds', path: '/roster/builds', icon: Layers, end: false },
  { id: 'planner', label: 'Progression', path: '/roster/planner', icon: Target, end: false },
  { id: 'domains', label: 'Domains', path: '/roster/domains', icon: Calendar, end: false },
  { id: 'bosses', label: 'Bosses', path: '/roster/bosses', icon: Skull, end: false },
] as const;

export default function RosterSubNav() {
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-800 pb-4">
      {SUB_TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.id}
            to={tab.path}
            end={tab.end}
            className={({ isActive }) =>
              `flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`
            }
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {tab.label}
          </NavLink>
        );
      })}
    </div>
  );
}

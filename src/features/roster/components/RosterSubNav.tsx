import { NavLink } from 'react-router-dom';
import { Users, Sword, Gem } from 'lucide-react';

const SUB_TABS = [
  { id: 'characters', label: 'Characters', path: '/roster', icon: Users, end: true },
  { id: 'weapons', label: 'Weapons', path: '/roster/weapons', icon: Sword, end: false },
  { id: 'artifacts', label: 'Artifacts', path: '/roster/artifacts', icon: Gem, end: false },
] as const;

export default function RosterSubNav() {
  return (
    <div className="flex gap-1 mb-6 border-b border-slate-800 pb-4">
      {SUB_TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.id}
            to={tab.path}
            end={tab.end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </NavLink>
        );
      })}
    </div>
  );
}

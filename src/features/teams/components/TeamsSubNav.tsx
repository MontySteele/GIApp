import { NavLink } from 'react-router-dom';
import { Users, Layers, Target, Skull } from 'lucide-react';

const SUB_TABS = [
  { id: 'list', label: 'My Teams', path: '/teams', icon: Users, end: true },
  { id: 'planner', label: 'Planner', path: '/teams/planner', icon: Target, end: false },
  { id: 'templates', label: 'Build Templates', path: '/teams/templates', icon: Layers, end: false },
  { id: 'bosses', label: 'Weekly Bosses', path: '/teams/bosses', icon: Skull, end: false },
] as const;

export default function TeamsSubNav() {
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

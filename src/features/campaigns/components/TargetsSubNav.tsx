import { NavLink } from 'react-router-dom';
import { Flag, Package } from 'lucide-react';

const SUB_TABS = [
  { id: 'targets', label: 'Targets', path: '/campaigns', icon: Flag, end: true },
  { id: 'materials', label: 'Materials', path: '/campaigns/materials', icon: Package, end: false },
] as const;

export default function TargetsSubNav() {
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
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
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

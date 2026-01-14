/**
 * Mobile Bottom Navigation
 *
 * A fixed bottom navigation bar optimized for mobile devices.
 * Shows the most important navigation items with icons.
 * Hidden on desktop where the top TabNav is used instead.
 */

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Sparkles,
  Target,
} from 'lucide-react';

// Mobile-optimized navigation items (subset of main tabs)
// Settings accessible via header menu on mobile
const MOBILE_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { id: 'roster', label: 'Roster', path: '/roster', icon: Users },
  { id: 'teams', label: 'Teams', path: '/teams', icon: UsersRound },
  { id: 'pulls', label: 'Pulls', path: '/pulls', icon: Sparkles },
  { id: 'planner', label: 'Planner', path: '/planner', icon: Target },
] as const;

export default function MobileBottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 md:hidden safe-area-inset-bottom"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 px-3 min-w-[64px] transition-colors ${
                  isActive
                    ? 'text-primary-400'
                    : 'text-slate-400 active:text-slate-200'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium leading-tight">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

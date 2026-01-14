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
  Settings,
} from 'lucide-react';

// Mobile-optimized navigation items
// Includes Settings for easy access to data import (critical for new users)
const MOBILE_NAV_ITEMS = [
  { id: 'dashboard', label: 'Home', path: '/', icon: LayoutDashboard },
  { id: 'roster', label: 'Roster', path: '/roster', icon: Users },
  { id: 'teams', label: 'Teams', path: '/teams', icon: UsersRound },
  { id: 'pulls', label: 'Pulls', path: '/pulls', icon: Sparkles },
  { id: 'planner', label: 'Plan', path: '/planner', icon: Target },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
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
                `flex flex-col items-center justify-center py-2 px-1.5 min-w-0 flex-1 transition-colors ${
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

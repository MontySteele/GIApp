/**
 * Mobile Bottom Navigation
 *
 * A fixed bottom navigation bar optimized for mobile devices.
 * Shows the most important navigation items with icons.
 * Hidden on desktop where the top TabNav is used instead.
 */

import { NavLink, useLocation } from 'react-router-dom';
import {
  type LucideIcon,
  LayoutDashboard,
  Menu,
  Target,
  Users,
  Sparkles,
} from 'lucide-react';

type MobileNavItem = {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  end?: boolean;
  activePaths?: readonly string[];
  inactivePaths?: readonly string[];
};

function pathMatches(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

const MOBILE_NAV_ITEMS: readonly MobileNavItem[] = [
  { id: 'dashboard', label: 'Home', path: '/', icon: LayoutDashboard, end: true },
  { id: 'campaigns', label: 'Targets', path: '/campaigns', icon: Target },
  { id: 'roster', label: 'Roster', path: '/roster', icon: Users, inactivePaths: ['/roster/builds'] },
  { id: 'pulls', label: 'Pulls', path: '/pulls', icon: Sparkles },
  {
    id: 'more',
    label: 'More',
    path: '/more',
    icon: Menu,
    activePaths: ['/more', '/teams', '/planner', '/notes', '/settings', '/imports', '/roster/builds'],
  },
] as const;

export default function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 md:hidden safe-area-inset-bottom"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isSecondaryRouteActive = item.activePaths?.some((path) => pathMatches(location.pathname, path)) ?? false;
          const isActiveSuppressed = item.inactivePaths?.some((path) => pathMatches(location.pathname, path)) ?? false;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 px-1.5 min-w-0 flex-1 transition-colors ${
                  (isActive || isSecondaryRouteActive) && !isActiveSuppressed
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

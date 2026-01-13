/**
 * Breadcrumbs Component
 *
 * Navigation breadcrumbs for detail pages to show hierarchy
 * and provide easy navigation back to parent pages.
 */

import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /** Show home icon as first item */
  showHome?: boolean;
}

export default function Breadcrumbs({ items, showHome = true }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-sm">
        {showHome && (
          <li className="flex items-center">
            <Link
              to="/"
              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
              aria-label="Home"
            >
              <Home className="w-4 h-4" aria-hidden="true" />
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-600 mx-1" aria-hidden="true" />
          </li>
        )}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.path} className="flex items-center">
              {isLast ? (
                <span
                  className="text-slate-200 font-medium truncate max-w-[200px]"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <>
                  <Link
                    to={item.path}
                    className="text-slate-400 hover:text-slate-200 transition-colors truncate max-w-[150px]"
                  >
                    {item.label}
                  </Link>
                  <ChevronRight className="w-4 h-4 text-slate-600 mx-1" aria-hidden="true" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

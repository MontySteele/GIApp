import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, useLocation, useParams } from 'react-router-dom';
import Layout from './Layout';
import RouteErrorPage, { NotFoundPage } from './RouteErrorPage';

const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const CampaignsLayout = lazy(() => import('@/features/campaigns/pages/CampaignsLayout'));
const CampaignsPage = lazy(() => import('@/features/campaigns/pages/CampaignsPage'));
const CampaignDetailPage = lazy(() => import('@/features/campaigns/pages/CampaignDetailPage'));
const RosterLayout = lazy(() => import('@/features/roster/pages/RosterLayout'));
const RosterPage = lazy(() => import('@/features/roster/pages/RosterPage'));
const CharacterDetailPage = lazy(() => import('@/features/roster/pages/CharacterDetailPage'));
const WeaponsTab = lazy(() => import('@/features/roster/pages/WeaponsTab'));
const ArtifactsTab = lazy(() => import('@/features/roster/pages/ArtifactsTab'));
const PullsLayout = lazy(() => import('@/features/wishes/pages/PullsLayout'));
const HistoryTab = lazy(() => import('@/features/wishes/pages/HistoryTab'));
const CalculatorTab = lazy(() => import('@/features/wishes/pages/CalculatorTab'));
const BudgetTab = lazy(() => import('@/features/wishes/pages/BudgetTab'));
const BannersTab = lazy(() => import('@/features/wishes/pages/BannersTab'));
const TeamsPage = lazy(() => import('@/features/teams/pages/TeamsPage'));
const TeamDetailPage = lazy(() => import('@/features/teams/pages/TeamDetailPage'));
const TemplatesTab = lazy(() => import('@/features/teams/pages/TemplatesTab'));
const BossesTab = lazy(() => import('@/features/teams/pages/BossesTab'));
const PlannerPage = lazy(() => import('@/features/planner/pages/PlannerPage'));
const MaterialsTab = lazy(() => import('@/features/planner/pages/MaterialsTab'));
const DomainsTab = lazy(() => import('@/features/planner/pages/DomainsTab'));
const MorePage = lazy(() => import('@/features/more/pages/MorePage'));
const NotesPage = lazy(() => import('@/features/notes/pages/NotesPage'));
const SyncPage = lazy(() => import('@/features/sync/pages/SyncPage'));
const ImportHubPage = lazy(() => import('@/features/sync/pages/ImportHubPage'));

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-primary-500"
        aria-hidden="true"
      />
      <span className="sr-only">Loading page</span>
    </div>
  );
}

function RouteSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      {children}
    </Suspense>
  );
}

function routeElement(children: ReactNode) {
  return <RouteSuspense>{children}</RouteSuspense>;
}

function RedirectPreserveSearch({ pathname }: { pathname: string }) {
  const location = useLocation();
  return (
    <Navigate
      to={{ pathname, search: location.search, hash: location.hash }}
      replace
    />
  );
}

function TeamDetailRedirect() {
  const { id } = useParams();
  return <RedirectPreserveSearch pathname={`/roster/teams/${id ?? ''}`} />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        element: routeElement(<DashboardPage />),
      },
      {
        path: 'campaigns',
        element: routeElement(<CampaignsLayout />),
        children: [
          {
            index: true,
            element: routeElement(<CampaignsPage />),
          },
          {
            path: 'materials',
            element: routeElement(<MaterialsTab />),
          },
          {
            path: ':id',
            element: routeElement(<CampaignDetailPage />),
          },
        ],
      },
      // Roster with nested routes for Characters, Weapons, Artifacts, Builds
      {
        path: 'roster',
        element: routeElement(<RosterLayout />),
        children: [
          {
            index: true,
            element: routeElement(<RosterPage />),
          },
          {
            path: 'weapons',
            element: routeElement(<WeaponsTab />),
          },
          {
            path: 'artifacts',
            element: routeElement(<ArtifactsTab />),
          },
          {
            path: 'builds',
            element: routeElement(<TemplatesTab />),
          },
          {
            path: 'teams',
            element: routeElement(<TeamsPage />),
          },
          {
            path: 'teams/:id',
            element: routeElement(<TeamDetailPage />),
          },
          {
            path: 'planner',
            element: routeElement(<PlannerPage />),
          },
          {
            path: 'domains',
            element: routeElement(<DomainsTab />),
          },
          {
            path: 'bosses',
            element: routeElement(<BossesTab />),
          },
        ],
      },
      {
        path: 'roster/:id',
        element: routeElement(<CharacterDetailPage />),
      },
      // Pulls (renamed from Wishes) with nested routes for Budget, Calculator, History, Banners
      {
        path: 'pulls',
        element: routeElement(<PullsLayout />),
        children: [
          {
            index: true,
            element: routeElement(<BudgetTab />),
          },
          {
            path: 'budget',
            element: <RedirectPreserveSearch pathname="/pulls" />,
          },
          {
            path: 'calculator',
            element: routeElement(<CalculatorTab />),
          },
          {
            path: 'history',
            element: routeElement(<HistoryTab />),
          },
          {
            path: 'banners',
            element: routeElement(<BannersTab />),
          },
        ],
      },
      // Redirects from old routes (backwards compatibility)
      {
        path: 'artifacts',
        element: <Navigate to="/roster/artifacts" replace />,
      },
      {
        path: 'weapons',
        element: <Navigate to="/roster/weapons" replace />,
      },
      // Wishes -> Pulls redirects
      {
        path: 'wishes',
        element: <Navigate to="/pulls" replace />,
      },
      {
        path: 'wishes/calculator',
        element: <Navigate to="/pulls/calculator" replace />,
      },
      {
        path: 'wishes/budget',
        element: <RedirectPreserveSearch pathname="/pulls" />,
      },
      {
        path: 'calculator',
        element: <Navigate to="/pulls/calculator" replace />,
      },
      {
        path: 'ledger',
        element: <RedirectPreserveSearch pathname="/pulls" />,
      },
      // Teams and Planner -> Roster/Targets redirects
      {
        path: 'teams/planner',
        element: <RedirectPreserveSearch pathname="/roster/planner" />,
      },
      {
        path: 'teams/bosses',
        element: <RedirectPreserveSearch pathname="/roster/bosses" />,
      },
      {
        path: 'teams/templates',
        element: <RedirectPreserveSearch pathname="/roster/builds" />,
      },
      {
        path: 'teams/:id',
        element: <TeamDetailRedirect />,
      },
      {
        path: 'teams',
        element: <RedirectPreserveSearch pathname="/roster/teams" />,
      },
      {
        path: 'builds',
        element: <Navigate to="/roster/builds" replace />,
      },
      {
        path: 'bosses',
        element: <RedirectPreserveSearch pathname="/roster/bosses" />,
      },
      {
        path: 'planner/materials',
        element: <RedirectPreserveSearch pathname="/campaigns/materials" />,
      },
      {
        path: 'planner/domains',
        element: <RedirectPreserveSearch pathname="/roster/domains" />,
      },
      {
        path: 'planner',
        element: <RedirectPreserveSearch pathname="/roster/planner" />,
      },
      // Calendar -> Planner domains redirect
      {
        path: 'calendar',
        element: <RedirectPreserveSearch pathname="/roster/domains" />,
      },
      {
        path: 'notes',
        element: routeElement(<NotesPage />),
      },
      {
        path: 'more',
        element: routeElement(<MorePage />),
      },
      {
        path: 'imports',
        element: routeElement(<ImportHubPage />),
      },
      {
        path: 'settings',
        element: routeElement(<SyncPage />),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

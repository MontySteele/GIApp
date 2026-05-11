import { createBrowserRouter, Navigate, useLocation, useParams } from 'react-router-dom';
import Layout from './Layout';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import RosterLayout from '@/features/roster/pages/RosterLayout';
import RosterPage from '@/features/roster/pages/RosterPage';
import CharacterDetailPage from '@/features/roster/pages/CharacterDetailPage';
import WeaponsTab from '@/features/roster/pages/WeaponsTab';
import ArtifactsTab from '@/features/roster/pages/ArtifactsTab';
import PullsLayout from '@/features/wishes/pages/PullsLayout';
import HistoryTab from '@/features/wishes/pages/HistoryTab';
import CalculatorTab from '@/features/wishes/pages/CalculatorTab';
import BudgetTab from '@/features/wishes/pages/BudgetTab';
import BannersTab from '@/features/wishes/pages/BannersTab';
import { CampaignDetailPage, CampaignsLayout, CampaignsPage } from '@/features/campaigns';
import {
  TeamsPage,
  TeamDetailPage,
  TemplatesTab,
  BossesTab,
} from '@/features/teams';
import PlannerPage from '@/features/planner/pages/PlannerPage';
import MaterialsTab from '@/features/planner/pages/MaterialsTab';
import DomainsTab from '@/features/planner/pages/DomainsTab';
import MorePage from '@/features/more/pages/MorePage';
import NotesPage from '@/features/notes/pages/NotesPage';
import SyncPage from '@/features/sync/pages/SyncPage';
import ImportHubPage from '@/features/sync/pages/ImportHubPage';

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
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'campaigns',
        element: <CampaignsLayout />,
        children: [
          {
            index: true,
            element: <CampaignsPage />,
          },
          {
            path: 'materials',
            element: <MaterialsTab />,
          },
          {
            path: ':id',
            element: <CampaignDetailPage />,
          },
        ],
      },
      // Roster with nested routes for Characters, Weapons, Artifacts, Builds
      {
        path: 'roster',
        element: <RosterLayout />,
        children: [
          {
            index: true,
            element: <RosterPage />,
          },
          {
            path: 'weapons',
            element: <WeaponsTab />,
          },
          {
            path: 'artifacts',
            element: <ArtifactsTab />,
          },
          {
            path: 'builds',
            element: <TemplatesTab />,
          },
          {
            path: 'teams',
            element: <TeamsPage />,
          },
          {
            path: 'teams/:id',
            element: <TeamDetailPage />,
          },
          {
            path: 'planner',
            element: <PlannerPage />,
          },
          {
            path: 'domains',
            element: <DomainsTab />,
          },
          {
            path: 'bosses',
            element: <BossesTab />,
          },
        ],
      },
      {
        path: 'roster/:id',
        element: <CharacterDetailPage />,
      },
      // Pulls (renamed from Wishes) with nested routes for Budget, Calculator, History, Banners
      {
        path: 'pulls',
        element: <PullsLayout />,
        children: [
          {
            index: true,
            element: <BudgetTab />,
          },
          {
            path: 'budget',
            element: <RedirectPreserveSearch pathname="/pulls" />,
          },
          {
            path: 'calculator',
            element: <CalculatorTab />,
          },
          {
            path: 'history',
            element: <HistoryTab />,
          },
          {
            path: 'banners',
            element: <BannersTab />,
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
        element: <NotesPage />,
      },
      {
        path: 'more',
        element: <MorePage />,
      },
      {
        path: 'imports',
        element: <ImportHubPage />,
      },
      {
        path: 'settings',
        element: <SyncPage />,
      },
    ],
  },
]);

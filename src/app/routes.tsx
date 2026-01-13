import { createBrowserRouter, Navigate } from 'react-router-dom';
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
import {
  TeamsLayout,
  TeamsPage,
  TeamDetailPage,
  TemplatesTab,
  BossesTab,
} from '@/features/teams';
import PlannerLayout from '@/features/planner/pages/PlannerLayout';
import PlannerPage from '@/features/planner/pages/PlannerPage';
import MaterialsTab from '@/features/planner/pages/MaterialsTab';
import DomainsTab from '@/features/planner/pages/DomainsTab';
import NotesPage from '@/features/notes/pages/NotesPage';
import SyncPage from '@/features/sync/pages/SyncPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
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
        ],
      },
      {
        path: 'roster/:id',
        element: <CharacterDetailPage />,
      },
      // Teams hub with nested routes for My Teams, Bosses
      {
        path: 'teams',
        element: <TeamsLayout />,
        children: [
          {
            index: true,
            element: <TeamsPage />,
          },
          {
            path: 'bosses',
            element: <BossesTab />,
          },
        ],
      },
      {
        path: 'teams/:id',
        element: <TeamDetailPage />,
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
      // Planner (promoted to top-level) with Overview, Materials, Domains
      {
        path: 'planner',
        element: <PlannerLayout />,
        children: [
          {
            index: true,
            element: <PlannerPage />,
          },
          {
            path: 'materials',
            element: <MaterialsTab />,
          },
          {
            path: 'domains',
            element: <DomainsTab />,
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
        element: <Navigate to="/pulls/budget" replace />,
      },
      {
        path: 'calculator',
        element: <Navigate to="/pulls/calculator" replace />,
      },
      {
        path: 'ledger',
        element: <Navigate to="/pulls/budget" replace />,
      },
      // Teams -> new locations redirects
      {
        path: 'teams/planner',
        element: <Navigate to="/planner" replace />,
      },
      {
        path: 'teams/templates',
        element: <Navigate to="/roster/builds" replace />,
      },
      {
        path: 'builds',
        element: <Navigate to="/roster/builds" replace />,
      },
      {
        path: 'bosses',
        element: <Navigate to="/teams/bosses" replace />,
      },
      // Calendar -> Planner domains redirect
      {
        path: 'calendar',
        element: <Navigate to="/planner/domains" replace />,
      },
      {
        path: 'notes',
        element: <NotesPage />,
      },
      {
        path: 'settings',
        element: <SyncPage />,
      },
    ],
  },
]);

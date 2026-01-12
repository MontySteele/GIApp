import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './Layout';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import RosterLayout from '@/features/roster/pages/RosterLayout';
import RosterPage from '@/features/roster/pages/RosterPage';
import CharacterDetailPage from '@/features/roster/pages/CharacterDetailPage';
import WeaponsTab from '@/features/roster/pages/WeaponsTab';
import ArtifactsTab from '@/features/roster/pages/ArtifactsTab';
import WishesLayout from '@/features/wishes/pages/WishesLayout';
import HistoryTab from '@/features/wishes/pages/HistoryTab';
import CalculatorTab from '@/features/wishes/pages/CalculatorTab';
import BudgetTab from '@/features/wishes/pages/BudgetTab';
import {
  TeamsLayout,
  TeamsPage,
  TeamDetailPage,
  PlannerTab,
  TemplatesTab,
  BossesTab,
} from '@/features/teams';
import CalendarPage from '@/features/calendar/pages/CalendarPage';
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
      // Roster with nested routes for Characters, Weapons, Artifacts
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
        ],
      },
      {
        path: 'roster/:id',
        element: <CharacterDetailPage />,
      },
      // Teams hub with nested routes for My Teams, Planner, Templates, Bosses
      {
        path: 'teams',
        element: <TeamsLayout />,
        children: [
          {
            index: true,
            element: <TeamsPage />,
          },
          {
            path: 'planner',
            element: <PlannerTab />,
          },
          {
            path: 'templates',
            element: <TemplatesTab />,
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
      // Wishes with nested routes for History, Calculator, Budget
      {
        path: 'wishes',
        element: <WishesLayout />,
        children: [
          {
            index: true,
            element: <HistoryTab />,
          },
          {
            path: 'calculator',
            element: <CalculatorTab />,
          },
          {
            path: 'budget',
            element: <BudgetTab />,
          },
        ],
      },
      // Redirects from old standalone routes
      {
        path: 'artifacts',
        element: <Navigate to="/roster/artifacts" replace />,
      },
      {
        path: 'weapons',
        element: <Navigate to="/roster/weapons" replace />,
      },
      {
        path: 'calculator',
        element: <Navigate to="/wishes/calculator" replace />,
      },
      {
        path: 'ledger',
        element: <Navigate to="/wishes/budget" replace />,
      },
      {
        path: 'planner',
        element: <Navigate to="/teams/planner" replace />,
      },
      {
        path: 'builds',
        element: <Navigate to="/teams/templates" replace />,
      },
      {
        path: 'bosses',
        element: <Navigate to="/teams/bosses" replace />,
      },
      {
        path: 'calendar',
        element: <CalendarPage />,
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

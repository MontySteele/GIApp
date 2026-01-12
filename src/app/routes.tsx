import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './Layout';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import RosterLayout from '@/features/roster/pages/RosterLayout';
import RosterPage from '@/features/roster/pages/RosterPage';
import CharacterDetailPage from '@/features/roster/pages/CharacterDetailPage';
import WeaponsTab from '@/features/roster/pages/WeaponsTab';
import ArtifactsTab from '@/features/roster/pages/ArtifactsTab';
import PlannerPage from '@/features/planner/pages/PlannerPage';
import WishesPage from '@/features/wishes/pages/WishesPage';
import LedgerPage from '@/features/ledger/pages/LedgerPage';
import CalculatorPage from '@/features/calculator/pages/CalculatorPage';
import CalendarPage from '@/features/calendar/pages/CalendarPage';
import NotesPage from '@/features/notes/pages/NotesPage';
import SyncPage from '@/features/sync/pages/SyncPage';
import { BuildTemplatesPage } from '@/features/builds';
import { WeeklyBossTrackerPage } from '@/features/bosses';

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
        path: 'planner',
        element: <PlannerPage />,
      },
      {
        path: 'wishes',
        element: <WishesPage />,
      },
      {
        path: 'ledger',
        element: <LedgerPage />,
      },
      {
        path: 'calculator',
        element: <CalculatorPage />,
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
        path: 'builds',
        element: <BuildTemplatesPage />,
      },
      {
        path: 'bosses',
        element: <WeeklyBossTrackerPage />,
      },
      {
        path: 'settings',
        element: <SyncPage />,
      },
    ],
  },
]);

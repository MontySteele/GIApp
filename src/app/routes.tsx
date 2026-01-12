import { createBrowserRouter } from 'react-router-dom';
import Layout from './Layout';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import RosterPage from '@/features/roster/pages/RosterPage';
import CharacterDetailPage from '@/features/roster/pages/CharacterDetailPage';
import ArtifactsPage from '@/features/artifacts/pages/ArtifactsPage';
import WeaponsPage from '@/features/weapons/pages/WeaponsPage';
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
      {
        path: 'roster',
        element: <RosterPage />,
      },
      {
        path: 'roster/:id',
        element: <CharacterDetailPage />,
      },
      {
        path: 'artifacts',
        element: <ArtifactsPage />,
      },
      {
        path: 'weapons',
        element: <WeaponsPage />,
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

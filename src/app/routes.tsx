import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './Layout';
import RosterPage from '@/features/roster/pages/RosterPage';
import CharacterDetailPage from '@/features/roster/pages/CharacterDetailPage';
import ArtifactsPage from '@/features/artifacts/pages/ArtifactsPage';
import WishesPage from '@/features/wishes/pages/WishesPage';
import LedgerPage from '@/features/ledger/pages/LedgerPage';
import CalculatorPage from '@/features/calculator/pages/CalculatorPage';
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
        element: <Navigate to="/roster" replace />,
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
        path: 'settings',
        element: <SyncPage />,
      },
    ],
  },
]);

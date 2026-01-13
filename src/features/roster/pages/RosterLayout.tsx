import { Outlet } from 'react-router-dom';
import RosterSubNav from '../components/RosterSubNav';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function RosterLayout() {
  return (
    <div>
      <RosterSubNav />
      <ErrorBoundary featureName="Roster">
        <Outlet />
      </ErrorBoundary>
    </div>
  );
}

import { Outlet } from 'react-router-dom';
import TeamsSubNav from '../components/TeamsSubNav';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function TeamsLayout() {
  return (
    <div>
      <TeamsSubNav />
      <ErrorBoundary featureName="Teams">
        <Outlet />
      </ErrorBoundary>
    </div>
  );
}

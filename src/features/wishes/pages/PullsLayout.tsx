import { Outlet } from 'react-router-dom';
import PullsSubNav from '../components/PullsSubNav';
import PityHeader from '../components/PityHeader';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function PullsLayout() {
  return (
    <div className="space-y-0">
      <PityHeader />
      <PullsSubNav />
      <ErrorBoundary featureName="Pulls">
        <Outlet />
      </ErrorBoundary>
    </div>
  );
}

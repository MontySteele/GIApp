import { Outlet } from 'react-router-dom';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import TargetsSubNav from '../components/TargetsSubNav';

export default function CampaignsLayout() {
  return (
    <div>
      <TargetsSubNav />
      <ErrorBoundary featureName="Targets">
        <Outlet />
      </ErrorBoundary>
    </div>
  );
}

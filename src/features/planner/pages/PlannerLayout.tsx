import { Outlet } from 'react-router-dom';
import PlannerSubNav from '../components/PlannerSubNav';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function PlannerLayout() {
  return (
    <div>
      <PlannerSubNav />
      <ErrorBoundary featureName="Planner">
        <Outlet />
      </ErrorBoundary>
    </div>
  );
}

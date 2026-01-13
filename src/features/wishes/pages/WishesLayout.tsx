import { Outlet } from 'react-router-dom';
import WishesSubNav from '../components/WishesSubNav';
import PityHeader from '../components/PityHeader';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function WishesLayout() {
  return (
    <div className="space-y-0">
      <PityHeader />
      <WishesSubNav />
      <ErrorBoundary featureName="Wishes">
        <Outlet />
      </ErrorBoundary>
    </div>
  );
}

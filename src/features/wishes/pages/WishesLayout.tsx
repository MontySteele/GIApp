import { Outlet } from 'react-router-dom';
import WishesSubNav from '../components/WishesSubNav';
import PityHeader from '../components/PityHeader';

export default function WishesLayout() {
  return (
    <div className="space-y-0">
      <PityHeader />
      <WishesSubNav />
      <Outlet />
    </div>
  );
}

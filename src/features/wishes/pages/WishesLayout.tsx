import { Outlet } from 'react-router-dom';
import WishesSubNav from '../components/WishesSubNav';

export default function WishesLayout() {
  return (
    <div>
      <WishesSubNav />
      <Outlet />
    </div>
  );
}

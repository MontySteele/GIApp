import { Outlet } from 'react-router-dom';
import RosterSubNav from '../components/RosterSubNav';

export default function RosterLayout() {
  return (
    <div>
      <RosterSubNav />
      <Outlet />
    </div>
  );
}

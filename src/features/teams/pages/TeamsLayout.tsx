import { Outlet } from 'react-router-dom';
import TeamsSubNav from '../components/TeamsSubNav';

export default function TeamsLayout() {
  return (
    <div>
      <TeamsSubNav />
      <Outlet />
    </div>
  );
}

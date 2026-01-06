import { Outlet } from 'react-router-dom';
import Header from '@/components/common/Header';
import TabNav from '@/components/common/TabNav';
import PWANotifications from '@/components/pwa/PWANotifications';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <TabNav />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        <Outlet />
      </main>
      <PWANotifications />
    </div>
  );
}

import { Outlet } from 'react-router-dom';
import Header from '@/components/common/Header';
import TabNav from '@/components/common/TabNav';
import BackupReminderBanner from '@/features/sync/components/BackupReminderBanner';
import { useTheme } from '@/hooks/useTheme';

export default function Layout() {
  // Initialize theme on mount
  useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 dark:bg-slate-950 light:bg-slate-50 text-slate-100 dark:text-slate-100 light:text-slate-900">
      <Header />
      <TabNav />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        <BackupReminderBanner />
        <Outlet />
      </main>
    </div>
  );
}

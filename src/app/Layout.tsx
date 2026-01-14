import { Outlet } from 'react-router-dom';
import Header from '@/components/common/Header';
import TabNav from '@/components/common/TabNav';
import MobileBottomNav from '@/components/common/MobileBottomNav';
import BackupReminderBanner from '@/features/sync/components/BackupReminderBanner';
import ToastContainer from '@/components/ui/Toast';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import OnboardingWizard from '@/components/common/OnboardingWizard';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingContext } from '@/contexts/OnboardingContext';

/** Skip link component for keyboard navigation */
function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      Skip to main content
    </a>
  );
}

export default function Layout() {
  // Initialize theme on mount
  useTheme();

  const { showWizard, closeWizard, completeOnboarding } = useOnboardingContext();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 dark:bg-slate-950 light:bg-slate-50 text-slate-100 dark:text-slate-100 light:text-slate-900">
      <SkipLink />
      <Header />
      <nav aria-label="Main navigation">
        <TabNav />
      </nav>
      <main
        id="main-content"
        className="flex-1 container mx-auto px-4 py-6 max-w-7xl pb-20 md:pb-6"
        tabIndex={-1}
      >
        <BackupReminderBanner />
        <ErrorBoundary featureName="Application">
          <Outlet />
        </ErrorBoundary>
      </main>
      <MobileBottomNav />
      <ToastContainer />
      <OnboardingWizard
        isOpen={showWizard}
        onClose={closeWizard}
        onComplete={completeOnboarding}
      />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import { useServiceWorkerRegistration } from '@/lib/pwa';

type Props = {
  className?: string;
};

export default function PWANotifications({ className = '' }: Props) {
  const { offlineReady, needRefresh, updateServiceWorker } = useServiceWorkerRegistration();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!offlineReady && !needRefresh && !isOffline) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 max-w-sm space-y-2 z-50 ${className}`}>
      {isOffline && (
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 shadow-xl">
          <WifiOff className="w-5 h-5 text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-slate-100">Offline mode</p>
            <p className="text-xs text-slate-400">
              You&apos;re offline. Cached content is being served until your connection returns.
            </p>
          </div>
        </div>
      )}

      {offlineReady && (
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 shadow-xl">
          <p className="text-sm font-semibold text-primary-200">Offline cache ready</p>
        </div>
      )}

      {needRefresh && (
        <button
          type="button"
          className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 shadow-xl text-left"
          onClick={() => updateServiceWorker(true)}
        >
          <RefreshCw className="w-5 h-5 text-primary-300" />
          <div>
            <p className="text-sm font-semibold text-slate-100">Update available</p>
            <p className="text-xs text-slate-400">Tap to refresh and load the latest content.</p>
          </div>
        </button>
      )}
    </div>
  );
}

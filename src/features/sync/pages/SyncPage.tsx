import { useEffect, useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { listCaches, clearCaches } from '../services/cacheService';
import { APP_VERSION } from '@/lib/pwa';

type CacheState = {
  version: string;
  caches: string[];
};

export default function SyncPage() {
  const [cacheState, setCacheState] = useState<CacheState>({ version: APP_VERSION, caches: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshCaches = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const nextState = await listCaches();
      setCacheState(nextState);
      setMessage(nextState.caches.length === 0 ? 'No caches found.' : 'Cache list updated.');
    } catch (err) {
      console.error(err);
      setError('Unable to read caches in this environment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCaches = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const deletedCount = await clearCaches();
      setMessage(`Cleared ${deletedCount} cache${deletedCount === 1 ? '' : 's'}.`);
      await refreshCaches();
    } catch (err) {
      console.error(err);
      setError('Unable to clear caches in this environment.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshCaches();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings & Sync</h1>
        <p className="text-slate-400">Manage app storage, offline cache, and diagnostics.</p>
      </div>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-200">Offline cache</p>
            <p className="text-xs text-slate-400">Version {cacheState.version}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={refreshCaches}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-100 hover:bg-slate-700 transition disabled:opacity-50"
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleClearCaches}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition disabled:opacity-50"
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4" />
              Clear caches
            </button>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-2">
          <p className="text-xs uppercase tracking-wide text-slate-400">Cached buckets</p>
          {cacheState.caches.length === 0 ? (
            <p className="text-sm text-slate-300">No caches detected yet.</p>
          ) : (
            <ul className="space-y-1 text-sm text-slate-200">
              {cacheState.caches.map((cacheName) => (
                <li key={cacheName} className="break-all">
                  {cacheName}
                </li>
              ))}
            </ul>
          )}
        </div>

        {message && <p className="text-sm text-emerald-300">{message}</p>}
        {error && <p className="text-sm text-rose-300">{error}</p>}
      </section>
    </div>
  );
}

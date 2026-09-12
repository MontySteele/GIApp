import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Dexie from 'dexie';
import { initializeDatabase } from '@/db/migrations';
import { db } from '@/db/schema';

type GateState =
  | { status: 'opening' }
  | { status: 'ready' }
  | { status: 'error'; error: Error };

interface DatabaseGateProps {
  children: ReactNode;
  /** Injectable for tests; defaults to the real initializer. */
  initialize?: () => Promise<unknown>;
  /** Injectable for tests; defaults to deleting the real database and reloading. */
  resetDatabase?: () => Promise<void>;
  /** Called once after the database has opened successfully. */
  onReady?: () => void;
}

async function defaultReset(): Promise<void> {
  db.close();
  await Dexie.delete(db.name);
  window.location.reload();
}

/**
 * Blocks the router until IndexedDB has opened and migrated. If that fails the app
 * shows a recovery screen instead of running against a half-open database.
 */
export default function DatabaseGate({
  children,
  initialize = initializeDatabase,
  resetDatabase = defaultReset,
  onReady,
}: DatabaseGateProps) {
  const [state, setState] = useState<GateState>({ status: 'opening' });
  const [attempt, setAttempt] = useState(0);
  const [confirmText, setConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'opening' });
    initialize()
      .then(() => {
        if (cancelled) return;
        setState({ status: 'ready' });
        onReady?.();
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error('Database failed to open', error);
        setState({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) });
      });
    return () => {
      cancelled = true;
    };
  }, [initialize, attempt, onReady]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const handleReset = useCallback(async () => {
    setResetting(true);
    try {
      await resetDatabase();
    } catch (error) {
      console.error('Database reset failed', error);
      setResetting(false);
    }
  }, [resetDatabase]);

  if (state.status === 'ready') {
    return <>{children}</>;
  }

  if (state.status === 'opening') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300" role="status">
        <p>Opening your local database…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="max-w-lg w-full bg-slate-800 border border-red-500/50 rounded-lg p-6 space-y-4" role="alert">
        <h1 className="text-xl font-semibold text-red-200">The local database could not be opened</h1>
        <p className="text-sm text-slate-300">
          GIApp stores everything in your browser&apos;s IndexedDB. It refused to open or migrate, so the app
          will not start rather than risk running on partial data.
        </p>
        <pre className="text-xs bg-slate-900 text-red-300 p-3 rounded overflow-x-auto whitespace-pre-wrap">
          {state.error.message}
        </pre>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={retry}
            className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium"
          >
            Try again
          </button>
        </div>
        <details className="text-sm text-slate-300">
          <summary className="cursor-pointer text-slate-200">Reset the database (deletes all local data)</summary>
          <p className="mt-2">
            If you have a backup file, resetting is safe: you can restore it from Settings afterwards.
            Type <span className="font-mono text-red-200">DELETE</span> to confirm.
          </p>
          <div className="mt-2 flex gap-2">
            <input
              aria-label="Type DELETE to confirm database reset"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="flex-1 px-3 py-2 rounded bg-slate-900 border border-slate-600 text-slate-100 text-sm"
            />
            <button
              type="button"
              disabled={confirmText !== 'DELETE' || resetting}
              onClick={() => void handleReset()}
              className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium"
            >
              {resetting ? 'Resetting…' : 'Reset database'}
            </button>
          </div>
        </details>
      </div>
    </div>
  );
}

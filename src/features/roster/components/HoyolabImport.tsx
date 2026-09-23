import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Download, Info, MonitorX } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';
import {
  fetchHoyolabCharacters,
  fromHoyolab,
  validateHoyolabCookie,
  deriveServerFromUid,
} from '@/mappers/hoyolab';
import { writeLastImportSummary } from '@/features/sync/domain/lastImportSummary';
import { buildRosterImportImpactSummary } from '@/features/sync/domain/rosterImportImpact';
import { importHoyolabCharacters } from '../services/hoyolabImport';

const isTauri = '__TAURI__' in window;

const CREDENTIALS_STORAGE_KEY = 'hoyolab-import-credentials';

interface StoredCredentials {
  uid: string;
  cookie: string;
}

function readStoredCredentials(): StoredCredentials | null {
  try {
    const raw = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCredentials;
    if (typeof parsed.uid !== 'string' || typeof parsed.cookie !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

interface HoyolabImportProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function HoyolabImport({ onSuccess, onCancel }: HoyolabImportProps) {
  const toast = useToast();
  const [uid, setUid] = useState('');
  const [cookie, setCookie] = useState('');
  const [remember, setRemember] = useState(true);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState<{ created: number; updated: number } | null>(null);

  useEffect(() => {
    const stored = readStoredCredentials();
    if (stored) {
      setUid(stored.uid);
      setCookie(stored.cookie);
      setHasStoredCredentials(true);
    }
  }, []);

  const handleClearCredentials = () => {
    localStorage.removeItem(CREDENTIALS_STORAGE_KEY);
    setUid('');
    setCookie('');
    setHasStoredCredentials(false);
  };

  const handleImport = async () => {
    if (!uid || uid.length < 9 || !deriveServerFromUid(uid)) {
      setError('Please enter a valid UID (9-10 digits)');
      return;
    }

    const cookieError = validateHoyolabCookie(cookie);
    if (cookieError) {
      setError(cookieError);
      return;
    }

    setError('');
    setLoading(true);
    setImportResult(null);

    try {
      const details = await fetchHoyolabCharacters(uid, cookie);
      const characters = fromHoyolab(details);

      if (characters.length === 0) {
        throw new Error('No characters found in your Battle Chronicle. Make sure the account has logged into Genshin at least once.');
      }

      const { created, updated } = await importHoyolabCharacters(characters);

      if (remember) {
        localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify({ uid, cookie }));
        setHasStoredCredentials(true);
      }

      writeLastImportSummary(buildRosterImportImpactSummary({
        source: 'HoYoLAB',
        charactersCreated: created,
        charactersUpdated: updated,
        artifactsChanged: characters.reduce((sum, c) => sum + c.artifacts.length, 0),
        weaponsChanged: characters.length,
        materialsChanged: 0,
      }));

      setImportResult({ created, updated });

      const message = [
        created > 0 ? `${created} added` : null,
        updated > 0 ? `${updated} updated` : null,
      ].filter(Boolean).join(', ');
      toast.success('Sync Successful', message || 'Roster synced from HoYoLAB');

      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Import failed';
      setError(errorMessage);
      toast.error('Sync Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-slate-400 mb-4">
          Sync your full roster — levels, constellations, talents, weapons, and equipped
          artifacts — straight from your HoYoLAB account. Works even if you only play on
          console: nothing needs to run on this computer.
        </p>

        {!isTauri && (
          <div className="flex items-start gap-2 p-3 bg-amber-900/20 border border-amber-700 rounded-lg mb-4">
            <MonitorX className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm text-amber-200">
              HoYoLAB sync needs the desktop app. Browsers cannot send the login cookie to
              HoYoLAB from another site, so this import is only available in the GIApp
              desktop build.
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2 mb-2">
            <Info className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm text-slate-300 font-medium">
              How to get your HoYoLAB cookie:
            </div>
          </div>
          <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside ml-6">
            <li>Sign in at hoyolab.com in your browser</li>
            <li>Open DevTools (F12 or Cmd+Option+I) → Application → Cookies</li>
            <li>Copy the values of <code className="rounded bg-white/10 px-1">ltuid_v2</code> and <code className="rounded bg-white/10 px-1">ltoken_v2</code></li>
            <li>Paste them below as <code className="rounded bg-white/10 px-1">ltuid_v2=...; ltoken_v2=...</code></li>
          </ol>
          <p className="text-xs text-slate-500 mt-2">
            Your Battle Chronicle must be enabled (visit it once on HoYoLAB). The cookie
            stays on this device and is only sent to HoYoLAB.
          </p>
        </div>

        <div className="mb-4">
          <Input
            label="Genshin UID"
            placeholder="e.g., 601234567"
            value={uid}
            onChange={(e) => {
              setUid(e.target.value.trim());
              setError('');
            }}
            disabled={loading}
            maxLength={10}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="hoyolab-cookie">
            HoYoLAB cookie
          </label>
          <textarea
            id="hoyolab-cookie"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-primary-500 focus:outline-none"
            rows={3}
            placeholder="ltuid_v2=12345678; ltoken_v2=v2_..."
            value={cookie}
            onChange={(e) => {
              setCookie(e.target.value);
              setError('');
            }}
            disabled={loading}
            spellCheck={false}
          />
          <div className="mt-1 flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={loading}
              />
              Remember on this device for one-click refreshes
            </label>
            {hasStoredCredentials && (
              <button
                type="button"
                className="text-xs text-slate-500 underline hover:text-slate-300"
                onClick={handleClearCredentials}
                disabled={loading}
              >
                Clear saved login
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-700 rounded-lg mb-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-200">{error}</div>
          </div>
        )}

        {/* Success */}
        {importResult && (
          <div className="flex items-start gap-2 p-3 bg-green-900/20 border border-green-700 rounded-lg mb-4">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-200">
              Roster synced from HoYoLAB!
              {importResult.created > 0 && (
                <span className="block">
                  Added {importResult.created} new {importResult.created === 1 ? 'character' : 'characters'}
                </span>
              )}
              {importResult.updated > 0 && (
                <span className="block">
                  Updated {importResult.updated} existing {importResult.updated === 1 ? 'character' : 'characters'}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 mb-4">
          <p className="text-xs text-slate-400">
            <strong className="text-slate-300">Note:</strong> HoYoLAB only exposes equipped
            gear, so unequipped artifacts, spare weapons, and material counts still come
            from an Irminsul scan. Notes, priorities, and team assignments you set in GIApp
            are preserved on refresh.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          loading={loading}
          disabled={!isTauri || !uid || !cookie || loading}
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Sync from HoYoLAB
        </Button>
      </div>
    </div>
  );
}

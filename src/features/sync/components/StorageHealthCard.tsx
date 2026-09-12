import { useCallback, useEffect, useState } from 'react';
import { HardDrive, ShieldCheck, ShieldAlert, Trash2, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import {
  formatBytes,
  getStorageEstimate,
  requestPersistentStorage,
  resetAllLocalData,
  type StorageEstimate,
} from '../services/storageHealth';

const RESET_CONFIRM_WORD = 'DELETE';

interface StorageHealthCardProps {
  /** Injectable for tests; defaults to the real reset (deletes DB, clears keys, reloads). */
  onReset?: () => Promise<void>;
}

/**
 * Settings card for D-05 / D-15: shows storage usage and quota, whether the
 * browser has granted persistent (eviction-safe) storage, a button to request
 * it, and a typed-confirmation "Reset all data" flow.
 */
export default function StorageHealthCard({ onReset = resetAllLocalData }: StorageHealthCardProps) {
  const [estimate, setEstimate] = useState<StorageEstimate | null | undefined>(undefined);
  const [requesting, setRequesting] = useState(false);
  const [requestOutcome, setRequestOutcome] = useState<'granted' | 'denied' | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setEstimate(await getStorageEstimate());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleRequestPersistence = async () => {
    setRequesting(true);
    try {
      const granted = await requestPersistentStorage();
      setRequestOutcome(granted ? 'granted' : 'denied');
      await refresh();
    } finally {
      setRequesting(false);
    }
  };

  const closeResetModal = () => {
    if (resetting) return;
    setShowResetModal(false);
    setConfirmText('');
    setResetError(null);
  };

  const handleReset = async () => {
    if (confirmText !== RESET_CONFIRM_WORD) return;
    setResetting(true);
    setResetError(null);
    try {
      await onReset();
    } catch (error) {
      setResetError(error instanceof Error ? error.message : 'Reset failed');
      setResetting(false);
    }
  };

  const usagePercent =
    estimate && estimate.quota > 0 ? Math.min(100, Math.round((estimate.usage / estimate.quota) * 100)) : null;
  const isPersisted = estimate?.persisted ?? false;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-primary-400" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-50">Storage</h2>
        </div>
        <p className="text-slate-400 text-sm">
          Everything lives in this browser. Persistent storage stops the browser from silently deleting it when
          space runs low or the site goes unused.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">Usage</span>
            <span className="text-slate-100" data-testid="storage-usage">
              {estimate === undefined
                ? 'Checking...'
                : estimate === null
                  ? 'Not available in this browser'
                  : `${formatBytes(estimate.usage)} of ${formatBytes(estimate.quota)}${
                      usagePercent !== null ? ` (${usagePercent}%)` : ''
                    }`}
            </span>
          </div>
          {usagePercent !== null && (
            <div
              className="h-2 w-full rounded-full bg-slate-700 overflow-hidden"
              role="progressbar"
              aria-label="Storage used"
              aria-valuenow={usagePercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full bg-primary-500" style={{ width: `${usagePercent}%` }} />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm" data-testid="storage-persisted">
            {isPersisted ? (
              <>
                <ShieldCheck className="w-4 h-4 text-green-400" aria-hidden="true" />
                <span className="text-green-300">Persistent storage granted</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span className="text-amber-200">Storage may be evicted by the browser</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => void refresh()} aria-label="Refresh storage estimate">
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
            </Button>
            {!isPersisted && (
              <Button variant="secondary" size="sm" onClick={handleRequestPersistence} loading={requesting}>
                Request persistent storage
              </Button>
            )}
          </div>
        </div>
        {requestOutcome === 'denied' && !isPersisted && (
          <p className="text-xs text-slate-400" role="status">
            The browser declined for now. Installing the app or bookmarking the site usually makes it eligible;
            export a backup regularly in the meantime.
          </p>
        )}

        <div className="border-t border-slate-700 pt-4 space-y-2">
          <h3 className="text-sm font-semibold text-red-300">Danger zone</h3>
          <p className="text-slate-400 text-sm">
            Reset deletes the local database and every setting this app stores in this browser. Export a backup
            first if you want to keep anything.
          </p>
          <Button variant="danger" size="sm" onClick={() => setShowResetModal(true)}>
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Reset all data
          </Button>
        </div>
      </CardContent>

      <Modal isOpen={showResetModal} onClose={closeResetModal} title="Reset all data?" size="sm">
        <div className="space-y-4">
          <p className="text-slate-300 text-sm">
            This permanently deletes characters, wishes, ledger entries, targets, notes, inventory and every
            local preference. It cannot be undone. Type <span className="font-mono font-semibold">{RESET_CONFIRM_WORD}</span>{' '}
            to confirm.
          </p>
          <Input
            label={`Type ${RESET_CONFIRM_WORD} to confirm`}
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            disabled={resetting}
          />
          {resetError && (
            <p className="text-sm text-red-400" role="alert">
              {resetError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeResetModal} disabled={resetting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReset}
              disabled={confirmText !== RESET_CONFIRM_WORD}
              loading={resetting}
            >
              Delete everything
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

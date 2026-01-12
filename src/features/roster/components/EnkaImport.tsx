import { useState } from 'react';
import { Download, CheckCircle, AlertCircle, Info, Camera, Keyboard } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { fetchEnkaData, fromEnka } from '@/mappers/enka';
import { characterRepo } from '../repo/characterRepo';
import QRCameraScanner from './QRCameraScanner';
import type { QRScanResult } from '@/lib/qrScanner';

type InputMode = 'manual' | 'camera';

interface EnkaImportProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EnkaImport({ onSuccess, onCancel }: EnkaImportProps) {
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [uid, setUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState<{
    success: boolean;
    created: number;
    updated: number;
    skipped?: number;
  } | null>(null);

  const handleImport = async () => {
    // Validate UID
    if (!uid || uid.length < 9) {
      setError('Please enter a valid UID (9 digits)');
      return;
    }

    setError('');
    setLoading(true);
    setImportResult(null);

    try {
      // Fetch data from Enka.network
      const enkaData = await fetchEnkaData(uid);

      // Convert to internal format
      const characters = fromEnka(enkaData);
      const showcaseCount = enkaData.avatarInfoList?.length ?? 0;

      if (characters.length === 0) {
        throw new Error('No characters found in showcase. Make sure you have characters displayed in your showcase in-game.');
      }

      // Import characters (upsert to avoid duplicates)
      const { created, updated } = await characterRepo.bulkUpsert(characters);

      setImportResult({
        success: true,
        created,
        updated,
        skipped: Math.max(0, showcaseCount - characters.length),
      });

      // Auto-close after 2 seconds
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setImportResult({
        success: false,
        created: 0,
        updated: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = (result: QRScanResult) => {
    if (result.type === 'enka_url' && result.parsedUid) {
      // Set the UID from the scanned QR code
      setUid(result.parsedUid);
      setInputMode('manual');
      setError('');
      // Auto-trigger import after a brief delay
      setTimeout(() => {
        // Re-validate and import
        if (result.parsedUid && result.parsedUid.length >= 9) {
          handleImportWithUid(result.parsedUid);
        }
      }, 100);
    } else {
      setError('Invalid QR code. Please scan a QR code from Enka.network that contains a UID.');
    }
  };

  const handleImportWithUid = async (uidToImport: string) => {
    if (!uidToImport || uidToImport.length < 9) {
      setError('Please enter a valid UID (9 digits)');
      return;
    }

    setError('');
    setLoading(true);
    setImportResult(null);

    try {
      const enkaData = await fetchEnkaData(uidToImport);
      const characters = fromEnka(enkaData);
      const showcaseCount = enkaData.avatarInfoList?.length ?? 0;

      if (characters.length === 0) {
        throw new Error('No characters found in showcase. Make sure you have characters displayed in your showcase in-game.');
      }

      const { created, updated } = await characterRepo.bulkUpsert(characters);

      setImportResult({
        success: true,
        created,
        updated,
        skipped: Math.max(0, showcaseCount - characters.length),
      });

      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setImportResult({
        success: false,
        created: 0,
        updated: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-slate-400 mb-4">
          Import characters directly from the game by entering your UID or scanning a QR code.
          Your showcase must be public for this to work.
        </p>

        {/* Input Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={inputMode === 'manual' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setInputMode('manual')}
            disabled={loading}
            aria-pressed={inputMode === 'manual'}
          >
            <Keyboard className="w-4 h-4" aria-hidden="true" />
            Enter UID
          </Button>
          <Button
            variant={inputMode === 'camera' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setInputMode('camera')}
            disabled={loading}
            aria-pressed={inputMode === 'camera'}
          >
            <Camera className="w-4 h-4" aria-hidden="true" />
            Scan QR Code
          </Button>
        </div>

        {inputMode === 'manual' ? (
          <>
            {/* Instructions */}
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2 mb-2">
                <Info className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-sm text-slate-300 font-medium">
                  How to find your UID:
                </div>
              </div>
              <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside ml-6">
                <li>Open Genshin Impact</li>
                <li>Press ESC (PC) or open the menu (mobile)</li>
                <li>Your UID is displayed in the bottom-right corner</li>
                <li>Make sure your "Show Character Details" is enabled in Settings → Other</li>
              </ol>
            </div>

            {/* UID Input */}
            <div className="mb-4">
              <Input
                label="Enter your UID"
                placeholder="e.g., 123456789"
                value={uid}
                onChange={(e) => {
                  setUid(e.target.value);
                  setError('');
                }}
                disabled={loading}
                maxLength={9}
              />
              <p className="text-xs text-slate-500 mt-1">
                Only characters in your showcase (up to 8) will be imported
              </p>
            </div>
          </>
        ) : (
          <div className="mb-4">
            <QRCameraScanner
              onScan={handleQRScan}
              onCancel={() => setInputMode('manual')}
              autoClose={true}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-700 rounded-lg mb-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-200">{error}</div>
          </div>
        )}

        {/* Success */}
        {importResult?.success && (
          <div className="flex items-start gap-2 p-3 bg-green-900/20 border border-green-700 rounded-lg mb-4">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-200">
              Successfully imported from your showcase!
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
              {!!importResult.skipped && importResult.skipped > 0 && (
                <span className="block text-yellow-200">
                  Some characters were skipped due to missing or incomplete data ({importResult.skipped}).
                </span>
              )}
            </div>
          </div>
        )}

        {/* Cache Notice */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 mb-4">
          <p className="text-xs text-slate-400">
            <strong className="text-slate-300">Note:</strong> Enka.network updates every 5-10 minutes.
            If you just changed your showcase, please wait a few minutes before importing.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        {inputMode === 'manual' && (
          <Button
            onClick={handleImport}
            loading={loading}
            disabled={!uid || uid.length < 9 || loading}
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Import from Enka
          </Button>
        )}
      </div>
    </div>
  );
}

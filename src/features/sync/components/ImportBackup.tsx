import { useState, useRef, type ChangeEvent } from 'react';
import { Upload, AlertCircle, CheckCircle2, FileJson, Info } from 'lucide-react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import {
  validateBackup,
  importBackup,
  type MergeStrategy,
  type BackupData,
  type ImportResult,
  type ValidationResult,
} from '../services/importService';
import { parseSyncPayload, unwrapFromTextImport, type SyncPayload } from '../services/syncUtils';

interface ImportBackupProps {
  onImportComplete?: (result: ImportResult) => void;
}

const mergeStrategyOptions = [
  { value: 'newer_wins', label: 'Newer Wins - Keep newer records from either source' },
  { value: 'replace', label: 'Replace All - Overwrite local data with imported data' },
  { value: 'keep_local', label: 'Keep Local - Only add new records, skip existing' },
];

type ImportStep = 'select' | 'validate' | 'configure' | 'importing' | 'complete';

export default function ImportBackup({ onImportComplete }: ImportBackupProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ImportStep>('select');
  const [error, setError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<MergeStrategy>('newer_wins');
  const [backupData, setBackupData] = useState<BackupData | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState<{ stage: string; percent: number } | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [needsPassphrase, setNeedsPassphrase] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<SyncPayload | null>(null);

  const resetState = () => {
    setStep('select');
    setError(null);
    setBackupData(null);
    setValidation(null);
    setImportResult(null);
    setProgress(null);
    setPassphrase('');
    setNeedsPassphrase(false);
    setPendingPayload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processBackupData = async (data: unknown) => {
    const validationResult = validateBackup(data);
    setValidation(validationResult);

    if (!validationResult.valid) {
      setError(validationResult.errors.join('. '));
      setStep('select');
      return;
    }

    setBackupData(data as BackupData);
    setStep('configure');
  };

  const processPayload = async (payload: SyncPayload) => {
    // Check if encrypted
    if (payload.format === 'enc' || payload.format === 'lzenc') {
      setNeedsPassphrase(true);
      setPendingPayload(payload);
      return;
    }

    try {
      const data = await parseSyncPayload(payload);
      await processBackupData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse sync data');
    }
  };

  const handleDecryptAndProcess = async () => {
    if (!pendingPayload || !passphrase) return;

    setError(null);
    try {
      const data = await parseSyncPayload(pendingPayload, { passphrase });
      setNeedsPassphrase(false);
      setPendingPayload(null);
      await processBackupData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decryption failed');
    }
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setStep('validate');

    try {
      const text = await file.text();

      // Try to detect format
      if (text.startsWith('===GIAPP-SYNC===')) {
        // Wrapped sync payload
        const payload = unwrapFromTextImport(text);
        await processPayload(payload);
      } else {
        // Plain JSON
        const parsed = JSON.parse(text);

        // Check if it's a SyncPayload
        if (parsed.format && parsed.checksum && parsed.data) {
          await processPayload(parsed as SyncPayload);
        } else {
          // Direct backup data
          await processBackupData(parsed);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
      setStep('select');
    }
  };

  const handleImport = async () => {
    if (!backupData) return;

    setStep('importing');
    setError(null);

    const result = await importBackup(backupData, strategy, (stage, percent) => {
      setProgress({ stage, percent });
    });

    setImportResult(result);
    setStep('complete');
    onImportComplete?.(result);
  };

  const getTotalStats = () => {
    if (!importResult) return { created: 0, updated: 0, skipped: 0 };

    const stats = importResult.stats;
    let created = 0, updated = 0, skipped = 0;

    for (const key of Object.keys(stats) as (keyof typeof stats)[]) {
      created += stats[key].created;
      updated += 'updated' in stats[key] ? (stats[key] as { updated: number }).updated : 0;
      skipped += stats[key].skipped;
    }

    return { created, updated, skipped };
  };

  return (
    <div className="space-y-4">
      {/* File Input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Step: Select File */}
      {step === 'select' && (
        <div className="space-y-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-8 border-2 border-dashed border-slate-600 rounded-lg hover:border-primary-500 hover:bg-slate-800/50 transition-colors group"
          >
            <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-primary-400">
              <Upload className="w-10 h-10" />
              <div className="text-center">
                <p className="font-medium text-lg">Select backup file</p>
                <p className="text-sm">Supports JSON backups and sync payloads</p>
              </div>
            </div>
          </button>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-200 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Step: Validating */}
      {step === 'validate' && (
        <div className="flex items-center justify-center gap-3 py-8 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          <span>Validating backup file...</span>
        </div>
      )}

      {/* Passphrase Modal */}
      {needsPassphrase && (
        <Modal isOpen={true} onClose={() => setNeedsPassphrase(false)} title="Enter Passphrase" size="sm">
          <div className="space-y-4">
            <p className="text-slate-300 text-sm">
              This backup is encrypted. Enter the passphrase to decrypt it.
            </p>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter passphrase"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <div className="flex gap-2">
              <Button onClick={handleDecryptAndProcess} disabled={!passphrase}>
                Decrypt
              </Button>
              <Button variant="secondary" onClick={() => { setNeedsPassphrase(false); resetState(); }}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Step: Configure */}
      {step === 'configure' && validation && (
        <div className="space-y-4">
          {/* Backup Info */}
          <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <FileJson className="w-5 h-5 text-primary-400" />
              <span className="font-medium text-slate-100">Backup Details</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-slate-400">Exported:</div>
              <div className="text-slate-100">
                {new Date(validation.backupInfo!.exportedAt).toLocaleString()}
              </div>
              <div className="text-slate-400">Schema Version:</div>
              <div className="text-slate-100">{validation.backupInfo!.schemaVersion}</div>
            </div>

            {/* Record Counts */}
            <div className="mt-3 pt-3 border-t border-slate-700">
              <div className="text-sm text-slate-400 mb-2">Records to import:</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                {Object.entries(validation.backupInfo!.recordCounts).map(([table, count]) => (
                  count > 0 && (
                    <div key={table} className="flex justify-between">
                      <span className="text-slate-400 capitalize">{table}:</span>
                      <span className="text-slate-100">{count}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-900/30 border border-amber-700 rounded-lg text-amber-200 text-sm">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                {validation.warnings.map((warning, i) => (
                  <p key={i}>{warning}</p>
                ))}
              </div>
            </div>
          )}

          {/* Merge Strategy */}
          <Select
            label="Merge Strategy"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as MergeStrategy)}
            options={mergeStrategyOptions}
          />

          <div className="text-xs text-slate-500 space-y-1">
            <p><strong>Newer Wins:</strong> Compares timestamps and keeps the more recent version.</p>
            <p><strong>Replace All:</strong> Overwrites existing data with imported data.</p>
            <p><strong>Keep Local:</strong> Only imports new records, never updates existing ones.</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleImport}>
              <Upload className="w-4 h-4" />
              Import Data
            </Button>
            <Button variant="secondary" onClick={resetState}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Step: Importing */}
      {step === 'importing' && progress && (
        <div className="space-y-4 py-4">
          <div className="text-center text-slate-300">
            {progress.stage}
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Step: Complete */}
      {step === 'complete' && importResult && (
        <div className="space-y-4">
          {importResult.success ? (
            <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-200">
              <CheckCircle2 className="w-5 h-5" />
              <span>Import completed successfully!</span>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <div>
                <p>Import completed with errors:</p>
                {importResult.errors.map((err, i) => (
                  <p key={i} className="text-sm">{err}</p>
                ))}
              </div>
            </div>
          )}

          {/* Stats Summary */}
          <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg">
            <div className="text-sm font-medium text-slate-100 mb-3">Import Summary</div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">{getTotalStats().created}</div>
                <div className="text-xs text-slate-400">Created</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{getTotalStats().updated}</div>
                <div className="text-xs text-slate-400">Updated</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-400">{getTotalStats().skipped}</div>
                <div className="text-xs text-slate-400">Skipped</div>
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <details className="text-sm">
            <summary className="text-slate-400 cursor-pointer hover:text-slate-300">
              View detailed breakdown
            </summary>
            <div className="mt-2 p-3 bg-slate-900/50 rounded-lg space-y-1">
              {Object.entries(importResult.stats).map(([table, stats]) => (
                <div key={table} className="flex justify-between">
                  <span className="text-slate-400 capitalize">{table}:</span>
                  <span className="text-slate-300">
                    +{stats.created}
                    {'updated' in stats && <span className="text-blue-400"> ~{stats.updated}</span>}
                    {stats.skipped > 0 && <span className="text-slate-500"> -{stats.skipped}</span>}
                  </span>
                </div>
              ))}
            </div>
          </details>

          <Button variant="secondary" onClick={resetState}>
            Import Another
          </Button>
        </div>
      )}
    </div>
  );
}

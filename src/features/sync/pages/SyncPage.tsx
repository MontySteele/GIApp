import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { AlertTriangle, DownloadCloud, QrCode, ShieldCheck, UploadCloud } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useAppMetaStatus } from '../hooks/useAppMetaStatus';
import { BackupError, backupService, type BackupExportResult, type MergeStrategy } from '../services/backupService';

const mergeStrategyOptions: { value: MergeStrategy; label: string; helper: string }[] = [
  { value: 'replace', label: 'Replace all data', helper: 'Clear local data and replace with the backup.' },
  {
    value: 'newer-wins',
    label: 'Newer wins',
    helper: 'Compare updatedAt/createdAt and deletedAt timestamps to keep the freshest record.',
  },
  {
    value: 'keep-local',
    label: 'Keep local data',
    helper: 'Keep your current data while importing only missing records (including tombstones).',
  },
];

function StatusBadge({ label, tone }: { label: string; tone: 'success' | 'warning' | 'danger' }) {
  const tones: Record<'success' | 'warning' | 'danger', string> = {
    success: 'bg-emerald-900 text-emerald-200 border-emerald-700',
    warning: 'bg-amber-900 text-amber-100 border-amber-700',
    danger: 'bg-red-900 text-red-100 border-red-700',
  };

  return <span className={`px-3 py-1 rounded-full text-xs border ${tones[tone]}`}>{label}</span>;
}

export default function SyncPage() {
  const { status, isLoading } = useAppMetaStatus();
  const [passphrase, setPassphrase] = useState('');
  const [mergeStrategy, setMergeStrategy] = useState<MergeStrategy>('newer-wins');
  const [exportResult, setExportResult] = useState<BackupExportResult | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [importPayload, setImportPayload] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanActive, setScanActive] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (exportResult?.blob) {
      const url = URL.createObjectURL(exportResult.blob);
      setDownloadUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setDownloadUrl(null);
    return undefined;
  }, [exportResult]);

  useEffect(() => {
    if (!scanActive || typeof window === 'undefined') return;

    let scanner: any;
    let cancelled = false;

    import('html5-qrcode')
      .then(({ Html5QrcodeScanner }) => {
        if (cancelled) return;

        scanner = new Html5QrcodeScanner('qr-reader', { fps: 5, qrbox: 200 });
        scanner.render(
          (decodedText: string) => {
            setImportPayload(decodedText);
            setScanMessage('QR code captured');
          },
          (err: string) => {
            setScanMessage(typeof err === 'string' ? err : 'Waiting for QR code...');
          },
        );
      })
      .catch((err) => setScanMessage(`Unable to start camera scanner: ${err instanceof Error ? err.message : String(err)}`));

    return () => {
      cancelled = true;
      if (scanner?.clear) {
        scanner.clear().catch(() => {});
      }
    };
  }, [scanActive]);

  const readinessBadges = useMemo(() => {
    const badges = [];
    if (!isLoading && status.schemaMismatch) {
      badges.push(<StatusBadge key="schema" label="Schema mismatch" tone="danger" />);
    } else if (!isLoading) {
      badges.push(<StatusBadge key="schema" label={`Schema v${status.schemaVersion ?? 'unknown'}`} tone="success" />);
    }

    if (!isLoading && status.needsBackup) {
      badges.push(<StatusBadge key="backup" label="Backup recommended" tone="warning" />);
    } else if (!isLoading) {
      badges.push(<StatusBadge key="backup" label="Backup is current" tone="success" />);
    }

    return badges;
  }, [isLoading, status.needsBackup, status.schemaMismatch, status.schemaVersion]);

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);
    setError(null);

    try {
      const result = await backupService.exportBackup(passphrase.trim());
      setExportResult(result);
      setMessage(result.route === 'qr' ? 'Encrypted backup ready to display as a QR code.' : 'Encrypted backup ready for download.');
    } catch (err) {
      setError(err instanceof BackupError ? err.message : 'Unable to create backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    setMessage(null);
    setError(null);

    try {
      const result = await backupService.restoreBackup(importPayload.trim(), passphrase.trim(), mergeStrategy);
      setMessage(
        `Restore completed with "${mergeStrategy}" merge. Backup exported at ${new Date(result.metadata.exportedAt).toLocaleString()}.`,
      );
    } catch (err) {
      setError(err instanceof BackupError ? err.message : 'Unable to restore backup.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleFileImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const contents = await file.text();
    setImportPayload(contents);
    setScanMessage(`Loaded ${file.name}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Settings & Sync</h1>
          <p className="text-slate-400">Encrypt, compress, and move your data between devices safely.</p>
        </div>
        <div className="flex flex-wrap gap-2">{readinessBadges}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-lg font-semibold">Create encrypted backup</p>
              <p className="text-sm text-slate-400">
                Data is compressed with LZ-String, encrypted with AES-GCM (PBKDF2 salt + IV), and routed to QR or file automatically.
              </p>
            </div>
          </div>

          <Input
            label="Passphrase"
            type="password"
            placeholder="Enter a secret phrase"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
          />

          <Button className="w-full" onClick={handleExport} loading={isExporting} disabled={!passphrase.trim()}>
            <UploadCloud className="w-4 h-4" />
            Generate backup
          </Button>

          {message && !error && <p className="text-sm text-emerald-300">{message}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}

          {exportResult && (
            <div className="border border-slate-700 rounded-lg p-4 space-y-3 bg-slate-900/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Schema v{exportResult.envelope.schemaVersion}</p>
                  <p className="text-slate-200 text-sm">Device: {exportResult.envelope.deviceId}</p>
                </div>
                <StatusBadge
                  label={exportResult.route === 'qr' ? 'QR payload' : 'Download payload'}
                  tone={exportResult.route === 'qr' ? 'warning' : 'success'}
                />
              </div>

              {exportResult.route === 'qr' && (
                <div className="flex flex-col items-center gap-2">
                  <QRCodeSVG value={exportResult.serialized} size={220} />
                  <p className="text-xs text-slate-400 text-center">
                    Scan to transfer. If your camera cannot scan, copy the payload below.
                  </p>
                  <textarea
                    className="w-full h-28 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                    readOnly
                    value={exportResult.serialized}
                  />
                </div>
              )}

              {exportResult.route === 'file' && downloadUrl && (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-300">Backup is large; download the encrypted blob.</p>
                  <a
                    href={downloadUrl}
                    download={`giapp-backup-${exportResult.envelope.exportedAt}.json`}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    Download
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-lg font-semibold">Restore & Merge</p>
              <p className="text-sm text-slate-400">
                Decrypts, decompresses, validates schema, and merges using the strategy you choose.
              </p>
            </div>
          </div>

          <Select
            label="Merge strategy"
            value={mergeStrategy}
            onChange={(e) => setMergeStrategy(e.target.value as MergeStrategy)}
            options={mergeStrategyOptions.map((option) => ({ value: option.value, label: option.label }))}
          />
          <p className="text-xs text-slate-400">
            {mergeStrategyOptions.find((opt) => opt.value === mergeStrategy)?.helper}
          </p>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Backup payload (from file or QR scan)</label>
            <textarea
              value={importPayload}
              onChange={(e) => setImportPayload(e.target.value)}
              placeholder="Paste the encrypted payload or scan a QR code"
              className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-100"
            />
            <input type="file" accept="application/json" onChange={handleFileImport} className="text-sm text-slate-300" />

            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => setScanActive((prev) => !prev)}>
                <QrCode className="w-4 h-4" />
                {scanActive ? 'Stop camera scanner' : 'Scan QR code'}
              </Button>
              <Button
                variant="primary"
                onClick={handleRestore}
                loading={isRestoring}
                disabled={!passphrase.trim() || !importPayload.trim()}
              >
                <DownloadCloud className="w-4 h-4" />
                Restore backup
              </Button>
            </div>
            {scanActive && <div id="qr-reader" className="border border-slate-700 rounded-lg p-2 bg-slate-950" />}
            {scanMessage && <p className="text-xs text-slate-400">{scanMessage}</p>}
          </div>

          {message && !error && <p className="text-sm text-emerald-300">{message}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Copy, Check, QrCode, Lock, Unlock, Download, AlertCircle, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { appMetaService } from '../services/appMetaService';
import {
  createSyncPayload,
  parseSyncPayload,
  wrapForTextExport,
  unwrapFromTextImport,
  getPayloadSize,
  isQRCodeCompatible,
  type SyncPayload,
} from '../services/syncUtils';
import { validateBackup, importBackup, type BackupData, type MergeStrategy } from '../services/importService';
import { APP_SCHEMA_VERSION } from '@/lib/constants';

type TransferMode = 'export' | 'import';
type ExportFormat = 'text' | 'qr';

interface DataTransferProps {
  onTransferComplete?: () => void;
}

export default function DataTransfer({ onTransferComplete }: DataTransferProps) {
  const [mode, setMode] = useState<TransferMode>('export');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('text');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Export state
  const [exportText, setExportText] = useState<string | null>(null);
  const [qrPayload, setQrPayload] = useState<SyncPayload | null>(null);
  const [qrCompatible, setQrCompatible] = useState(false);
  const [copied, setCopied] = useState(false);

  // Encryption
  const [useEncryption, setUseEncryption] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [passphraseConfirm, setPassphraseConfirm] = useState('');

  // Import state
  const [importText, setImportText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPassphrase, setImportPassphrase] = useState('');
  const [pendingImport, setPendingImport] = useState<SyncPayload | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset states when mode changes
  useEffect(() => {
    setError(null);
    setSuccess(null);
    setExportText(null);
    setQrPayload(null);
    setCopied(false);
    setImportText('');
  }, [mode]);

  const generateExport = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    setCopied(false);

    try {
      // Validate passphrase if encryption enabled
      if (useEncryption) {
        if (!passphrase) {
          setError('Passphrase is required for encryption');
          setIsProcessing(false);
          return;
        }
        if (passphrase !== passphraseConfirm) {
          setError('Passphrases do not match');
          setIsProcessing(false);
          return;
        }
        if (passphrase.length < 4) {
          setError('Passphrase must be at least 4 characters');
          setIsProcessing(false);
          return;
        }
      }

      const backup = await appMetaService.exportBackup();

      const payload = await createSyncPayload(backup, APP_SCHEMA_VERSION, {
        compress: true,
        encrypt: useEncryption,
        passphrase: useEncryption ? passphrase : undefined,
      });

      const wrapped = wrapForTextExport(payload);
      setExportText(wrapped);
      setQrPayload(payload);
      setQrCompatible(isQRCodeCompatible(payload));

      setSuccess(`Export ready! Size: ${(getPayloadSize(payload) / 1024).toFixed(1)} KB`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate export');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (!exportText) return;

    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const handleDownloadText = () => {
    if (!exportText) return;

    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `giapp-sync-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const processImport = async (payload: SyncPayload, passphrase?: string) => {
    try {
      const data = await parseSyncPayload<BackupData>(payload, { passphrase });
      const validation = validateBackup(data);

      if (!validation.valid) {
        throw new Error(validation.errors.join('. '));
      }

      // Use newer_wins as default strategy for quick transfer
      const result = await importBackup(data, 'newer_wins' as MergeStrategy);

      if (result.success) {
        const total = Object.values(result.stats).reduce(
          (acc, s) => acc + s.created + ('updated' in s ? s.updated : 0),
          0
        );
        setSuccess(`Import successful! ${total} records processed.`);
        setImportText('');
        onTransferComplete?.();
      } else {
        throw new Error(result.errors.join('. '));
      }
    } catch (err) {
      throw err;
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      setError('Please paste the sync data');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = unwrapFromTextImport(importText);

      // Check if encrypted
      if (payload.format === 'enc' || payload.format === 'lzenc') {
        setPendingImport(payload);
        setShowImportModal(true);
        setIsProcessing(false);
        return;
      }

      await processImport(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecryptAndImport = async () => {
    if (!pendingImport || !importPassphrase) return;

    setIsProcessing(true);
    setError(null);

    try {
      await processImport(pendingImport, importPassphrase);
      setShowImportModal(false);
      setPendingImport(null);
      setImportPassphrase('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decryption failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex rounded-lg overflow-hidden border border-slate-700">
        <button
          onClick={() => setMode('export')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'export'
              ? 'bg-primary-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Export to Another Device
        </button>
        <button
          onClick={() => setMode('import')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'import'
              ? 'bg-primary-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Import from Another Device
        </button>
      </div>

      {/* Export Mode */}
      {mode === 'export' && (
        <div className="space-y-4">
          {/* Encryption Toggle */}
          <label className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors">
            <input
              type="checkbox"
              checked={useEncryption}
              onChange={(e) => setUseEncryption(e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-primary-500"
            />
            <div className="flex items-center gap-2">
              {useEncryption ? (
                <Lock className="w-4 h-4 text-green-400" />
              ) : (
                <Unlock className="w-4 h-4 text-slate-400" />
              )}
              <div>
                <p className="text-slate-100 font-medium">Encrypt with passphrase</p>
                <p className="text-slate-400 text-sm">Secure your data during transfer</p>
              </div>
            </div>
          </label>

          {/* Passphrase Fields */}
          {useEncryption && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                type="password"
                label="Passphrase"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter passphrase"
              />
              <Input
                type="password"
                label="Confirm Passphrase"
                value={passphraseConfirm}
                onChange={(e) => setPassphraseConfirm(e.target.value)}
                placeholder="Confirm passphrase"
              />
            </div>
          )}

          {/* Generate Button */}
          {!exportText && (
            <Button onClick={generateExport} loading={isProcessing} className="w-full">
              Generate Sync Data
            </Button>
          )}

          {/* Export Result */}
          {exportText && (
            <div className="space-y-4">
              {/* Format Toggle */}
              <div className="flex rounded-lg overflow-hidden border border-slate-700">
                <button
                  onClick={() => setExportFormat('text')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    exportFormat === 'text'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  Copy Text
                </button>
                <button
                  onClick={() => setExportFormat('qr')}
                  disabled={!qrCompatible}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    exportFormat === 'qr'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <QrCode className="w-4 h-4" />
                  QR Code
                  {!qrCompatible && <span className="text-xs">(too large)</span>}
                </button>
              </div>

              {/* Text Export */}
              {exportFormat === 'text' && (
                <div className="space-y-3">
                  <textarea
                    ref={textareaRef}
                    readOnly
                    value={exportText}
                    className="w-full h-32 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 text-xs font-mono resize-none focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleCopy} variant={copied ? 'primary' : 'secondary'}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy to Clipboard'}
                    </Button>
                    <Button onClick={handleDownloadText} variant="secondary">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Copy this text and paste it on your other device to import.
                  </p>
                </div>
              )}

              {/* QR Code Export */}
              {exportFormat === 'qr' && qrPayload && qrCompatible && (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-white rounded-lg">
                    <QRCodeSVG
                      value={JSON.stringify(qrPayload)}
                      size={256}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Smartphone className="w-4 h-4" />
                    <span>Scan this QR code on your other device</span>
                  </div>
                </div>
              )}

              {/* New Export Button */}
              <Button variant="ghost" onClick={() => { setExportText(null); setQrPayload(null); }}>
                Generate New Export
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Import Mode */}
      {mode === 'import' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Paste sync data from your other device
            </label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste the ===GIAPP-SYNC=== data here..."
              className="w-full h-40 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <Button onClick={handleImport} loading={isProcessing} disabled={!importText.trim()}>
            Import Data
          </Button>

          <p className="text-xs text-slate-500">
            Uses "Newer Wins" merge strategy by default. For more control, use the file import option.
          </p>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-200 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-200 text-sm">
          <Check className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Decrypt Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => { setShowImportModal(false); setPendingImport(null); }}
        title="Enter Passphrase"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-300 text-sm">
            This data is encrypted. Enter the passphrase to decrypt it.
          </p>
          <Input
            type="password"
            value={importPassphrase}
            onChange={(e) => setImportPassphrase(e.target.value)}
            placeholder="Enter passphrase"
          />
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <div className="flex gap-2">
            <Button onClick={handleDecryptAndImport} loading={isProcessing} disabled={!importPassphrase}>
              Decrypt & Import
            </Button>
            <Button
              variant="secondary"
              onClick={() => { setShowImportModal(false); setPendingImport(null); setError(null); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

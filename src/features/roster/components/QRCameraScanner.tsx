import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { Camera, CameraOff, RefreshCw, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { QRScannerManager, type QRScanResult, type CameraDevice } from '@/lib/qrScanner';

interface QRCameraScannerProps {
  /** Called when a QR code is successfully scanned */
  onScan: (result: QRScanResult) => void;
  /** Called when scanning is cancelled */
  onCancel?: () => void;
  /** Auto-close after successful scan */
  autoClose?: boolean;
}

type ScannerState = 'idle' | 'requesting' | 'scanning' | 'error';

export default function QRCameraScanner({
  onScan,
  onCancel,
  autoClose = true,
}: QRCameraScannerProps) {
  const [state, setState] = useState<ScannerState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>();
  const [lastScan, setLastScan] = useState<QRScanResult | null>(null);

  const scannerRef = useRef<QRScannerManager | null>(null);
  const scannerElementId = useId().replace(/:/g, '');
  const hasScannedRef = useRef(false);

  // Initialize scanner
  useEffect(() => {
    scannerRef.current = new QRScannerManager();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
      }
    };
  }, []);

  // Load available cameras
  useEffect(() => {
    async function loadCameras() {
      if (scannerRef.current) {
        const availableCameras = await scannerRef.current.getCameras();
        setCameras(availableCameras);
      }
    }
    loadCameras();
  }, []);

  const handleScan = useCallback((result: QRScanResult) => {
    // Prevent duplicate scans
    if (hasScannedRef.current) return;
    hasScannedRef.current = true;

    setLastScan(result);
    onScan(result);

    if (autoClose) {
      // Stop scanning after successful scan
      scannerRef.current?.stop();
      setState('idle');
    }
  }, [onScan, autoClose]);

  const startScanning = useCallback(async () => {
    if (!scannerRef.current) return;

    setState('requesting');
    setError(null);
    hasScannedRef.current = false;

    try {
      await scannerRef.current.start(
        `qr-scanner-${scannerElementId}`,
        handleScan,
        selectedCamera
      );
      setState('scanning');
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setState('error');

      const errorMsg = err instanceof Error ? err.message : String(err);

      // Provide specific error messages based on the error type
      if (errorMsg.includes('NotAllowedError') || errorMsg.includes('Permission denied')) {
        setError('Camera permission denied. Please click the lock icon in your address bar, allow camera access, and try again.');
      } else if (errorMsg.includes('NotFoundError') || errorMsg.includes('Requested device not found')) {
        setError('No camera found. Please connect a camera and try again.');
      } else if (errorMsg.includes('NotReadableError') || errorMsg.includes('Could not start video source')) {
        setError('Camera is in use by another application. Please close other apps using the camera and try again.');
      } else if (errorMsg.includes('OverconstrainedError')) {
        setError('Camera does not support the required settings. Try selecting a different camera.');
      } else if (errorMsg.includes('SecurityError')) {
        setError('Camera access requires HTTPS. If running locally, use http://localhost instead of 127.0.0.1');
      } else {
        setError(`Failed to start camera: ${errorMsg}`);
      }
    }
  }, [scannerElementId, selectedCamera, handleScan]);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
    }
    setState('idle');
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    hasScannedRef.current = false;
    startScanning();
  }, [startScanning]);

  return (
    <div className="space-y-4">
      {/* Scanner viewport */}
      <div className="relative bg-slate-800 rounded-lg overflow-hidden aspect-square max-w-[400px] mx-auto">
        {state === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <Camera className="w-16 h-16 mb-4 opacity-50" aria-hidden="true" />
            <p>Click "Start Camera" to scan a QR code</p>
          </div>
        )}

        {state === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mb-4" aria-hidden="true" />
            <p>Requesting camera access...</p>
          </div>
        )}

        {state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-6 text-center">
            <AlertCircle className="w-12 h-12 mb-4" aria-hidden="true" />
            <p className="mb-4">{error}</p>
            <Button onClick={handleRetry} variant="secondary" size="sm">
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Try Again
            </Button>
          </div>
        )}

        {/* QR Scanner video element - explicit styles for Tauri webview compatibility */}
        <div
          id={`qr-scanner-${scannerElementId}`}
          className={state === 'scanning' ? 'w-full h-full' : 'hidden'}
          style={{
            minHeight: state === 'scanning' ? '300px' : undefined,
          }}
        />
        {/* Force video element styles for webview compatibility */}
        <style>{`
          #qr-scanner-${scannerElementId} video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            background: #000;
          }
          #qr-scanner-${scannerElementId} > div {
            width: 100% !important;
            height: 100% !important;
          }
        `}</style>

        {/* Scanning overlay */}
        {state === 'scanning' && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Scan target box */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-primary-400 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary-400 rounded-tl" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary-400 rounded-tr" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary-400 rounded-bl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary-400 rounded-br" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Camera selector */}
      {cameras.length > 1 && state !== 'scanning' && (
        <div>
          <label htmlFor="camera-select" className="block text-sm font-medium text-slate-300 mb-1">
            Select Camera
          </label>
          <select
            id="camera-select"
            value={selectedCamera ?? ''}
            onChange={(e) => setSelectedCamera(e.target.value || undefined)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
          >
            <option value="">Default (Back Camera)</option>
            {cameras.map((cam) => (
              <option key={cam.id} value={cam.id}>
                {cam.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Instructions */}
      <p className="text-sm text-slate-400 text-center">
        Point your camera at a QR code from{' '}
        <a
          href="https://enka.network"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-400 hover:underline"
        >
          Enka.network
        </a>{' '}
        to import character data
      </p>

      {/* Last scan result */}
      {lastScan && (
        <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg">
          <p className="text-sm text-green-400">
            {lastScan.type === 'enka_url'
              ? `Detected Enka UID: ${lastScan.parsedUid}`
              : lastScan.type === 'sync_payload'
                ? 'Detected sync data'
                : 'Unknown QR code format'}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {state === 'idle' || state === 'error' ? (
          <Button onClick={startScanning}>
            <Camera className="w-4 h-4" aria-hidden="true" />
            Start Camera
          </Button>
        ) : state === 'scanning' ? (
          <Button onClick={stopScanning} variant="secondary">
            <CameraOff className="w-4 h-4" aria-hidden="true" />
            Stop Camera
          </Button>
        ) : null}

        {onCancel && (
          <Button onClick={onCancel} variant="ghost">
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

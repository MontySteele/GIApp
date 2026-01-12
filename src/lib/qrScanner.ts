/**
 * QR Code Scanner Wrapper
 *
 * Provides a clean interface over html5-qrcode library with:
 * - Camera permission handling
 * - Proper cleanup on unmount
 * - Error handling
 */

import { Html5Qrcode } from 'html5-qrcode';

export interface QRScanResult {
  type: 'enka_url' | 'sync_payload' | 'unknown';
  data: string;
  parsedUid?: string;
}

export interface CameraDevice {
  id: string;
  label: string;
}

/**
 * Parse a scanned QR code to determine its type
 */
export function parseQRResult(data: string): QRScanResult {
  // Check for Enka.network URL pattern
  const enkaUrlPattern = /enka\.network\/u\/(\d+)/i;
  const enkaMatch = data.match(enkaUrlPattern);
  if (enkaMatch) {
    return {
      type: 'enka_url',
      data,
      parsedUid: enkaMatch[1],
    };
  }

  // Check for sync payload (base64 JSON)
  try {
    const decoded = atob(data);
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === 'object') {
      return {
        type: 'sync_payload',
        data,
      };
    }
  } catch {
    // Not a valid sync payload
  }

  return {
    type: 'unknown',
    data,
  };
}

/**
 * QR Scanner Manager class
 * Handles camera lifecycle and scanning operations
 */
export class QRScannerManager {
  private scanner: Html5Qrcode | null = null;
  private isScanning: boolean = false;

  /**
   * Get list of available cameras
   */
  async getCameras(): Promise<CameraDevice[]> {
    try {
      const devices = await Html5Qrcode.getCameras();
      return devices.map((d) => ({ id: d.id, label: d.label || `Camera ${d.id}` }));
    } catch (error) {
      console.error('Failed to get cameras:', error);
      return [];
    }
  }

  /**
   * Check if camera permission is granted
   */
  async checkCameraPermission(): Promise<boolean> {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state === 'granted';
    } catch {
      // Permissions API not supported, try to get cameras
      try {
        const cameras = await Html5Qrcode.getCameras();
        return cameras.length > 0;
      } catch {
        return false;
      }
    }
  }

  /**
   * Start scanning from camera
   * @param elementId - DOM element ID to render the video feed
   * @param onScan - Callback when QR code is detected
   * @param cameraId - Optional camera ID (uses back camera by default)
   */
  async start(
    elementId: string,
    onScan: (result: QRScanResult) => void,
    cameraId?: string
  ): Promise<void> {
    if (this.isScanning) {
      await this.stop();
    }

    this.scanner = new Html5Qrcode(elementId);

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    const successCallback = (decodedText: string) => {
      const result = parseQRResult(decodedText);
      onScan(result);
    };
    const errorCallback = () => {}; // Ignore QR not found

    try {
      if (cameraId) {
        await this.scanner.start(cameraId, config, successCallback, errorCallback);
      } else {
        // Try to get the first available camera
        try {
          const cameras = await Html5Qrcode.getCameras();
          const firstCamera = cameras[0];
          if (firstCamera) {
            // Use the first camera directly by ID
            await this.scanner.start(firstCamera.id, config, successCallback, errorCallback);
          } else {
            // Fallback: try user-facing camera (front camera on laptops)
            await this.scanner.start({ facingMode: 'user' }, config, successCallback, errorCallback);
          }
        } catch {
          // Last resort: try environment facing (back camera)
          await this.scanner.start({ facingMode: 'environment' }, config, successCallback, errorCallback);
        }
      }
      this.isScanning = true;
    } catch (error) {
      this.scanner = null;
      throw error;
    }
  }

  /**
   * Stop scanning and release camera
   */
  async stop(): Promise<void> {
    if (this.scanner && this.isScanning) {
      try {
        await this.scanner.stop();
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
      this.scanner.clear();
      this.scanner = null;
      this.isScanning = false;
    }
  }

  /**
   * Check if currently scanning
   */
  getIsScanning(): boolean {
    return this.isScanning;
  }
}

// Singleton instance for convenience
let defaultScanner: QRScannerManager | null = null;

export function getScanner(): QRScannerManager {
  if (!defaultScanner) {
    defaultScanner = new QRScannerManager();
  }
  return defaultScanner;
}

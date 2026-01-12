/**
 * Sync Utilities - Compression and Encryption for cross-device data transfer
 */
import LZString from 'lz-string';

// Export format type markers
export const SYNC_FORMAT = {
  JSON: 'json',
  COMPRESSED: 'lz',
  ENCRYPTED: 'enc',
  COMPRESSED_ENCRYPTED: 'lzenc',
} as const;

export type SyncFormat = (typeof SYNC_FORMAT)[keyof typeof SYNC_FORMAT];

export interface SyncPayload {
  format: SyncFormat;
  version: number;
  data: string; // Either raw JSON, compressed, or encrypted
  checksum: string;
}

// Calculate simple checksum for data integrity
export function calculateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  // Convert to positive hex string
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// ----- COMPRESSION -----

export function compressData(jsonString: string): string {
  return LZString.compressToBase64(jsonString);
}

export function decompressData(compressed: string): string {
  const result = LZString.decompressFromBase64(compressed);
  if (result === null) {
    throw new Error('Failed to decompress data - invalid format');
  }
  return result;
}

// ----- ENCRYPTION (AES-GCM with passphrase) -----

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passphraseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(data: string, passphrase: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    encoder.encode(data)
  );

  // Combine salt + iv + ciphertext into a single array
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

export async function decryptData(encryptedBase64: string, passphrase: string): Promise<string> {
  const decoder = new TextDecoder();

  // Decode base64
  const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));

  // Extract salt, iv, and ciphertext
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  const key = await deriveKey(passphrase, salt);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      ciphertext.buffer as ArrayBuffer
    );
    return decoder.decode(decrypted);
  } catch {
    throw new Error('Decryption failed - invalid passphrase or corrupted data');
  }
}

// ----- SYNC PAYLOAD CREATION -----

export interface CreatePayloadOptions {
  compress?: boolean;
  encrypt?: boolean;
  passphrase?: string;
}

export async function createSyncPayload(
  data: unknown,
  schemaVersion: number,
  options: CreatePayloadOptions = {}
): Promise<SyncPayload> {
  const { compress = true, encrypt = false, passphrase } = options;

  if (encrypt && !passphrase) {
    throw new Error('Passphrase required for encryption');
  }

  // Start with JSON string
  let processedData = JSON.stringify(data);
  let format: SyncFormat = SYNC_FORMAT.JSON;

  // Apply compression if enabled
  if (compress) {
    processedData = compressData(processedData);
    format = SYNC_FORMAT.COMPRESSED;
  }

  // Apply encryption if enabled
  if (encrypt && passphrase) {
    processedData = await encryptData(processedData, passphrase);
    format = compress ? SYNC_FORMAT.COMPRESSED_ENCRYPTED : SYNC_FORMAT.ENCRYPTED;
  }

  return {
    format,
    version: schemaVersion,
    data: processedData,
    checksum: calculateChecksum(processedData),
  };
}

export interface ParsePayloadOptions {
  passphrase?: string;
}

export async function parseSyncPayload<T = unknown>(
  payload: SyncPayload,
  options: ParsePayloadOptions = {}
): Promise<T> {
  const { passphrase } = options;

  // Verify checksum
  const computedChecksum = calculateChecksum(payload.data);
  if (computedChecksum !== payload.checksum) {
    throw new Error('Checksum mismatch - data may be corrupted');
  }

  let processedData = payload.data;

  // Handle encryption
  if (payload.format === SYNC_FORMAT.ENCRYPTED || payload.format === SYNC_FORMAT.COMPRESSED_ENCRYPTED) {
    if (!passphrase) {
      throw new Error('Passphrase required to decrypt this data');
    }
    processedData = await decryptData(processedData, passphrase);
  }

  // Handle compression
  if (payload.format === SYNC_FORMAT.COMPRESSED || payload.format === SYNC_FORMAT.COMPRESSED_ENCRYPTED) {
    processedData = decompressData(processedData);
  }

  // Parse JSON
  return JSON.parse(processedData) as T;
}

// ----- PAYLOAD SIZE UTILITIES -----

export function getPayloadSize(payload: SyncPayload): number {
  return JSON.stringify(payload).length;
}

export function isQRCodeCompatible(payload: SyncPayload): boolean {
  // QR codes can typically hold around 3KB of data in high EC mode
  // Using 2KB as safe limit for reliable scanning
  return getPayloadSize(payload) <= 2000;
}

// ----- TEXT EXPORT FORMAT -----

const SYNC_HEADER = '===GIAPP-SYNC===';
const SYNC_FOOTER = '===END-SYNC===';

export function wrapForTextExport(payload: SyncPayload): string {
  const payloadJson = JSON.stringify(payload);
  const base64 = btoa(payloadJson);
  return `${SYNC_HEADER}\n${base64}\n${SYNC_FOOTER}`;
}

export function unwrapFromTextImport(text: string): SyncPayload {
  const trimmed = text.trim();

  if (!trimmed.startsWith(SYNC_HEADER) || !trimmed.endsWith(SYNC_FOOTER)) {
    throw new Error('Invalid sync data format - missing header/footer');
  }

  const base64 = trimmed
    .slice(SYNC_HEADER.length, -SYNC_FOOTER.length)
    .trim();

  try {
    const payloadJson = atob(base64);
    return JSON.parse(payloadJson) as SyncPayload;
  } catch {
    throw new Error('Invalid sync data format - corrupted data');
  }
}

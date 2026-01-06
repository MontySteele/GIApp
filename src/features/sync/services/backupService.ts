import LZString from 'lz-string';
import type {
  AbyssRun,
  AppMeta,
  Character,
  ExternalCache,
  FateEntry,
  Goal,
  Note,
  PlannedBanner,
  PrimogemEntry,
  ResourceSnapshot,
  Team,
  WishRecord,
} from '@/types';
import { db, type GenshinTrackerDB } from '@/db/schema';
import { LATEST_SCHEMA_VERSION } from '@/db/version';
import type { EntityTable } from 'dexie';

export type MergeStrategy = 'replace' | 'newer-wins' | 'keep-local';
export type BackupRoute = 'qr' | 'file';

export const QR_BYTE_LIMIT = 1500;

export interface BackupMetadata {
  schemaVersion: number;
  deviceId: string;
  createdAt?: string;
  exportedAt: string;
}

export interface BackupTables {
  characters: Character[];
  teams: Team[];
  wishRecords: WishRecord[];
  primogemEntries: PrimogemEntry[];
  fateEntries: FateEntry[];
  resourceSnapshots: ResourceSnapshot[];
  abyssRuns: AbyssRun[];
  goals: Goal[];
  notes: Note[];
  plannedBanners: PlannedBanner[];
  externalCache: ExternalCache[];
  appMeta: AppMeta[];
}

export interface BackupSnapshot {
  metadata: BackupMetadata;
  tables: BackupTables;
}

interface BackupEnvelope extends BackupMetadata {
  formatVersion: 1;
  algorithm: 'AES-GCM';
  derivation: 'PBKDF2';
  compression: 'lz-string';
  salt: string;
  iv: string;
  cipherText: string;
}

export interface BackupExportResult {
  serialized: string;
  envelope: BackupEnvelope;
  route: BackupRoute;
  blob?: Blob;
}

export interface BackupRestoreResult {
  metadata: BackupMetadata;
  strategy: MergeStrategy;
}

export type BackupErrorCode = 'INVALID_PAYLOAD' | 'DECRYPTION_FAILED' | 'SCHEMA_MISMATCH' | 'INVALID_PASSPHRASE';

export class BackupError extends Error {
  code: BackupErrorCode;

  constructor(code: BackupErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const textEncoder = new TextEncoder();

function bufferToBase64(buffer: ArrayBuffer | Uint8Array) {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }

  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToUint8Array(value: string) {
  if (typeof Buffer !== 'undefined') {
    return Uint8Array.from(Buffer.from(value, 'base64'));
  }

  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function selectRoute(serialized: string): BackupRoute {
  const size = textEncoder.encode(serialized).byteLength;
  return size <= QR_BYTE_LIMIT ? 'qr' : 'file';
}

async function deriveKey(passphrase: string, salt: Uint8Array) {
  const keyMaterial = await crypto.subtle.importKey('raw', textEncoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encryptBytes(payload: Uint8Array, passphrase: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, payload);
  return { cipherBuffer, salt, iv };
}

async function decryptBytes(cipherText: Uint8Array, passphrase: string, salt: Uint8Array, iv: Uint8Array) {
  const key = await deriveKey(passphrase, salt);
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherText);
}

function resolveTimestamp(record: any): number {
  const fields = ['deletedAt', 'updatedAt', 'createdAt', 'timestamp', 'fetchedAt'];
  for (const field of fields) {
    const value = record?.[field];
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return 0;
}

function mergeRecords<T extends { id: string }>(existing: T[], incoming: T[], strategy: MergeStrategy): T[] {
  if (strategy === 'replace') {
    return [...incoming];
  }

  const merged = new Map(existing.map((record) => [record.id, record]));

  if (strategy === 'keep-local') {
    for (const record of incoming) {
      if (!merged.has(record.id)) {
        merged.set(record.id, record);
      }
    }
    return Array.from(merged.values());
  }

  for (const record of incoming) {
    const current = merged.get(record.id);
    if (!current) {
      merged.set(record.id, record);
      continue;
    }

    if (resolveTimestamp(record) >= resolveTimestamp(current)) {
      merged.set(record.id, { ...current, ...record });
    }
  }

  return Array.from(merged.values());
}

async function mergeTable<T extends { id: string }>(table: EntityTable<T, 'id'>, incoming: T[], strategy: MergeStrategy) {
  const existing = await table.toArray();
  const merged = mergeRecords(existing, incoming, strategy);

  await table.clear();
  if (merged.length > 0) {
    await table.bulkPut(merged);
  }
}

async function mergeAppMeta(
  incoming: AppMeta[],
  metadata: BackupMetadata,
  strategy: MergeStrategy,
  database: GenshinTrackerDB,
) {
  const existing = await database.appMeta.toArray();
  const merged = new Map<string, any>();

  if (strategy !== 'replace') {
    existing.forEach((entry) => merged.set(entry.key, entry.value));
  }

  incoming.forEach((entry) => {
    if (strategy === 'keep-local' && merged.has(entry.key)) {
      return;
    }
    merged.set(entry.key, entry.value);
  });

  if (metadata.deviceId) {
    merged.set('deviceId', metadata.deviceId);
  }
  if (metadata.createdAt) {
    merged.set('createdAt', metadata.createdAt);
  }

  merged.set('schemaVersion', LATEST_SCHEMA_VERSION);

  await database.appMeta.clear();
  await database.appMeta.bulkPut(Array.from(merged.entries()).map(([key, value]) => ({ key, value })));
}

async function applyMergeStrategy(snapshot: BackupSnapshot, strategy: MergeStrategy, database: GenshinTrackerDB = db) {
  const { tables, metadata } = snapshot;

  await database.transaction(
    'rw',
    database.characters,
    database.teams,
    database.wishRecords,
    database.primogemEntries,
    database.fateEntries,
    database.resourceSnapshots,
    database.abyssRuns,
    database.goals,
    database.notes,
    database.plannedBanners,
    database.externalCache,
    database.appMeta,
    async () => {
      await mergeTable(database.characters, tables.characters, strategy);
      await mergeTable(database.teams, tables.teams, strategy);
      await mergeTable(database.wishRecords, tables.wishRecords, strategy);
      await mergeTable(database.primogemEntries, tables.primogemEntries, strategy);
      await mergeTable(database.fateEntries, tables.fateEntries, strategy);
      await mergeTable(database.resourceSnapshots, tables.resourceSnapshots, strategy);
      await mergeTable(database.abyssRuns, tables.abyssRuns, strategy);
      await mergeTable(database.goals, tables.goals, strategy);
      await mergeTable(database.notes, tables.notes, strategy);
      await mergeTable(database.plannedBanners, tables.plannedBanners, strategy);
      await mergeTable(database.externalCache, tables.externalCache, strategy);
      await mergeAppMeta(tables.appMeta ?? [], metadata, strategy, database);
    },
  );
}

async function prepareMetadata(database: GenshinTrackerDB) {
  const metaEntries = await database.appMeta.toArray();
  const metaMap = new Map(metaEntries.map((entry) => [entry.key, entry.value]));

  let deviceId = typeof metaMap.get('deviceId') === 'string' ? (metaMap.get('deviceId') as string) : undefined;
  let createdAt = typeof metaMap.get('createdAt') === 'string' ? (metaMap.get('createdAt') as string) : undefined;

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    await database.appMeta.put({ key: 'deviceId', value: deviceId });
  }

  if (!createdAt) {
    createdAt = new Date().toISOString();
    await database.appMeta.put({ key: 'createdAt', value: createdAt });
  }

  await database.appMeta.put({ key: 'schemaVersion', value: LATEST_SCHEMA_VERSION });

  const refreshedMeta = await database.appMeta.toArray();

  return {
    metadata: {
      schemaVersion: LATEST_SCHEMA_VERSION,
      deviceId,
      createdAt,
      exportedAt: new Date().toISOString(),
    },
    metaEntries: refreshedMeta,
  };
}

async function collectSnapshot(database: GenshinTrackerDB = db): Promise<BackupSnapshot> {
  const { metadata, metaEntries } = await prepareMetadata(database);

  const tables: BackupTables = {
    characters: await database.characters.toArray(),
    teams: await database.teams.toArray(),
    wishRecords: await database.wishRecords.toArray(),
    primogemEntries: await database.primogemEntries.toArray(),
    fateEntries: await database.fateEntries.toArray(),
    resourceSnapshots: await database.resourceSnapshots.toArray(),
    abyssRuns: await database.abyssRuns.toArray(),
    goals: await database.goals.toArray(),
    notes: await database.notes.toArray(),
    plannedBanners: await database.plannedBanners.toArray(),
    externalCache: await database.externalCache.toArray(),
    appMeta: metaEntries,
  };

  return {
    metadata,
    tables,
  };
}

async function encryptSnapshot(snapshot: BackupSnapshot, passphrase: string): Promise<BackupEnvelope> {
  const compressed = LZString.compressToUint8Array(JSON.stringify(snapshot));
  const { cipherBuffer, salt, iv } = await encryptBytes(compressed, passphrase);

  return {
    formatVersion: 1,
    algorithm: 'AES-GCM',
    derivation: 'PBKDF2',
    compression: 'lz-string',
    schemaVersion: snapshot.metadata.schemaVersion,
    deviceId: snapshot.metadata.deviceId,
    createdAt: snapshot.metadata.createdAt,
    exportedAt: snapshot.metadata.exportedAt,
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    cipherText: bufferToBase64(cipherBuffer),
  };
}

async function decryptSnapshot(envelope: BackupEnvelope, passphrase: string): Promise<BackupSnapshot> {
  try {
    const salt = base64ToUint8Array(envelope.salt);
    const iv = base64ToUint8Array(envelope.iv);
    const cipherText = base64ToUint8Array(envelope.cipherText);
    const decrypted = await decryptBytes(cipherText, passphrase, salt, iv);
    const decompressed = LZString.decompressFromUint8Array(new Uint8Array(decrypted));

    if (!decompressed) {
      throw new BackupError('DECRYPTION_FAILED', 'Unable to decompress backup payload');
    }

    const snapshot = JSON.parse(decompressed) as BackupSnapshot;
    return snapshot;
  } catch (error) {
    if (error instanceof BackupError) {
      throw error;
    }
    throw new BackupError('DECRYPTION_FAILED', 'Unable to decrypt backup. Check your passphrase and payload.');
  }
}

export const backupService = {
  async exportBackup(passphrase: string, database: GenshinTrackerDB = db): Promise<BackupExportResult> {
    if (!passphrase) {
      throw new BackupError('INVALID_PASSPHRASE', 'A passphrase is required to encrypt your backup.');
    }

    const snapshot = await collectSnapshot(database);
    const envelope = await encryptSnapshot(snapshot, passphrase);
    const serialized = JSON.stringify(envelope);
    const route = selectRoute(serialized);
    const blob = route === 'file' ? new Blob([serialized], { type: 'application/json' }) : undefined;

    return { serialized, envelope, route, blob };
  },

  async restoreBackup(
    serializedPayload: string,
    passphrase: string,
    strategy: MergeStrategy,
    database: GenshinTrackerDB = db,
  ): Promise<BackupRestoreResult> {
    if (!passphrase) {
      throw new BackupError('INVALID_PASSPHRASE', 'A passphrase is required to decrypt your backup.');
    }

    let envelope: BackupEnvelope;
    try {
      envelope = JSON.parse(serializedPayload) as BackupEnvelope;
    } catch {
      throw new BackupError('INVALID_PAYLOAD', 'Backup payload is not valid JSON.');
    }

    const snapshot = await decryptSnapshot(envelope, passphrase);

    if (snapshot.metadata.schemaVersion !== LATEST_SCHEMA_VERSION) {
      throw new BackupError(
        'SCHEMA_MISMATCH',
        `Backup schema version ${snapshot.metadata.schemaVersion} does not match app schema ${LATEST_SCHEMA_VERSION}.`,
      );
    }

    await applyMergeStrategy(snapshot, strategy, database);

    return {
      metadata: snapshot.metadata,
      strategy,
    };
  },

  routeForPayload: selectRoute,
};

export const __testUtils = {
  mergeRecords,
  resolveTimestamp,
  encryptSnapshot,
  decryptSnapshot,
  selectRoute,
};

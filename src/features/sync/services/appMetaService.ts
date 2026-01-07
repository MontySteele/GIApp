import { db } from '@/db/schema';
import { APP_SCHEMA_VERSION, BACKUP_REMINDER_DAYS } from '@/lib/constants';
import { DEFAULT_SETTINGS, useUIStore } from '@/stores/uiStore';

export interface AppMetaStatus {
  createdAt?: string;
  lastBackupAt?: string;
  schemaVersion?: number;
  needsBackup: boolean;
  schemaMismatch: boolean;
}

function parseSchemaVersion(rawValue: unknown): number | undefined {
  if (typeof rawValue === 'number') {
    return rawValue;
  }

  if (typeof rawValue === 'string') {
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

export function parseDateString(value: unknown): Date | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function resolveBackupCadenceDays(rawCadence?: number): number {
  if (typeof rawCadence === 'number' && Number.isFinite(rawCadence) && rawCadence > 0) {
    return rawCadence;
  }

  if (
    typeof DEFAULT_SETTINGS.backupReminderCadenceDays === 'number' &&
    Number.isFinite(DEFAULT_SETTINGS.backupReminderCadenceDays) &&
    DEFAULT_SETTINGS.backupReminderCadenceDays > 0
  ) {
    return DEFAULT_SETTINGS.backupReminderCadenceDays;
  }

  return BACKUP_REMINDER_DAYS;
}

function shouldRemindBackup(
  lastBackupAt: string | undefined,
  createdAt: string | undefined,
  now: Date,
  cadenceDays?: number
): boolean {
  const cadence = resolveBackupCadenceDays(cadenceDays);
  const referenceDate = parseDateString(lastBackupAt) ?? parseDateString(createdAt);

  if (!referenceDate) {
    return true;
  }

  const msDiff = now.getTime() - referenceDate.getTime();
  const daysDiff = msDiff / (1000 * 60 * 60 * 24);

  return daysDiff >= cadence;
}

export const appMetaService = {
  async getMetaStatus(now: Date = new Date()): Promise<AppMetaStatus> {
    const metaEntries = await db.appMeta.toArray();
    const metaMap = new Map(metaEntries.map((entry) => [entry.key, entry.value]));
    const cadence = useUIStore.getState().settings.backupReminderCadenceDays;

    const rawSchemaVersion = metaMap.get('schemaVersion');
    const schemaVersion = parseSchemaVersion(rawSchemaVersion);
    const createdAt = typeof metaMap.get('createdAt') === 'string' ? (metaMap.get('createdAt') as string) : undefined;
    const lastBackupAt =
      typeof metaMap.get('lastBackupAt') === 'string' ? (metaMap.get('lastBackupAt') as string) : undefined;

    return {
      createdAt,
      lastBackupAt,
      schemaVersion,
      needsBackup: shouldRemindBackup(lastBackupAt, createdAt, now, cadence),
      schemaMismatch: schemaVersion === undefined || schemaVersion !== APP_SCHEMA_VERSION,
    };
  },

  async markBackupComplete(timestamp: Date = new Date()): Promise<string> {
    const iso = timestamp.toISOString();
    const existingCreatedAt = await db.appMeta.get('createdAt');
    const createdAt = parseDateString(existingCreatedAt?.value)?.toISOString() ?? iso;

    await db.appMeta.put({ key: 'lastBackupAt', value: iso });
    await db.appMeta.put({ key: 'createdAt', value: createdAt });
    await db.appMeta.put({ key: 'schemaVersion', value: APP_SCHEMA_VERSION });

    return iso;
  },

  async exportBackup() {
    const payload: Record<string, unknown> = {};

    for (const table of db.tables) {
      payload[table.name] = await table.toArray();
    }

    return {
      exportedAt: new Date().toISOString(),
      schemaVersion: APP_SCHEMA_VERSION,
      data: payload,
    };
  },
};

export const __testUtils = {
  parseSchemaVersion,
  parseDateString,
  shouldRemindBackup,
  resolveBackupCadenceDays,
};

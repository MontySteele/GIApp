import { db } from '@/db/schema';
import { APP_SCHEMA_VERSION, BACKUP_REMINDER_DAYS } from '@/lib/constants';

export interface AppMetaStatus {
  createdAt?: string;
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

function shouldRemindBackup(createdAt: string | undefined, now: Date): boolean {
  if (!createdAt) {
    return true;
  }

  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) {
    return true;
  }

  const msDiff = now.getTime() - createdDate.getTime();
  const daysDiff = msDiff / (1000 * 60 * 60 * 24);

  return daysDiff >= BACKUP_REMINDER_DAYS;
}

export const appMetaService = {
  async getMetaStatus(now: Date = new Date()): Promise<AppMetaStatus> {
    const metaEntries = await db.appMeta.toArray();
    const metaMap = new Map(metaEntries.map((entry) => [entry.key, entry.value]));

    const rawSchemaVersion = metaMap.get('schemaVersion');
    const schemaVersion = parseSchemaVersion(rawSchemaVersion);
    const createdAt = typeof metaMap.get('createdAt') === 'string' ? (metaMap.get('createdAt') as string) : undefined;

    return {
      createdAt,
      schemaVersion,
      needsBackup: shouldRemindBackup(createdAt, now),
      schemaMismatch: schemaVersion === undefined || schemaVersion !== APP_SCHEMA_VERSION,
    };
  },
};

export const __testUtils = {
  parseSchemaVersion,
  shouldRemindBackup,
};

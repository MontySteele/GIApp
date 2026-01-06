import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db/schema';
import { APP_SCHEMA_VERSION, BACKUP_REMINDER_DAYS } from '@/lib/constants';
import { appMetaService } from './appMetaService';

describe('appMetaService', () => {
  const fixedNow = new Date('2024-01-10T00:00:00.000Z');

  beforeEach(async () => {
    await db.appMeta.clear();
  });

  afterEach(async () => {
    await db.appMeta.clear();
  });

  it('marks needsBackup true when createdAt is older than the reminder window', async () => {
    const oldDate = new Date(fixedNow);
    oldDate.setDate(oldDate.getDate() - (BACKUP_REMINDER_DAYS + 1));

    await db.appMeta.put({ key: 'createdAt', value: oldDate.toISOString() });
    await db.appMeta.put({ key: 'schemaVersion', value: APP_SCHEMA_VERSION });

    const status = await appMetaService.getMetaStatus(fixedNow);
    expect(status.needsBackup).toBe(true);
    expect(status.schemaMismatch).toBe(false);
  });

  it('keeps needsBackup false when within the reminder window', async () => {
    const recentDate = new Date(fixedNow);
    recentDate.setDate(recentDate.getDate() - (BACKUP_REMINDER_DAYS - 1));

    await db.appMeta.put({ key: 'createdAt', value: recentDate.toISOString() });
    await db.appMeta.put({ key: 'schemaVersion', value: APP_SCHEMA_VERSION });

    const status = await appMetaService.getMetaStatus(fixedNow);
    expect(status.needsBackup).toBe(false);
    expect(status.schemaMismatch).toBe(false);
  });

  it('flags schemaMismatch when schemaVersion differs from the app version', async () => {
    await db.appMeta.put({ key: 'schemaVersion', value: APP_SCHEMA_VERSION + 1 });
    await db.appMeta.put({ key: 'createdAt', value: fixedNow.toISOString() });

    const status = await appMetaService.getMetaStatus(fixedNow);
    expect(status.schemaMismatch).toBe(true);
  });

  it('flags both reminders when metadata is missing', async () => {
    const status = await appMetaService.getMetaStatus(fixedNow);
    expect(status.needsBackup).toBe(true);
    expect(status.schemaMismatch).toBe(true);
  });
});

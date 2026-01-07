import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db/schema';
import { APP_SCHEMA_VERSION } from '@/lib/constants';
import { DEFAULT_SETTINGS, useUIStore } from '@/stores/uiStore';
import { appMetaService, __testUtils } from './appMetaService';

describe('appMetaService', () => {
  const fixedNow = new Date('2024-01-10T00:00:00.000Z');

  beforeEach(async () => {
    await db.appMeta.clear();
    useUIStore.setState({ settings: { ...DEFAULT_SETTINGS } });
  });

  afterEach(async () => {
    await db.appMeta.clear();
    useUIStore.setState({ settings: { ...DEFAULT_SETTINGS } });
  });

  it('marks needsBackup true when lastBackupAt is older than the reminder window', async () => {
    useUIStore.setState({
      settings: { ...DEFAULT_SETTINGS, backupReminderCadenceDays: 7 },
    });
    const oldDate = new Date(fixedNow);
    oldDate.setDate(oldDate.getDate() - 8);

    await db.appMeta.put({ key: 'createdAt', value: fixedNow.toISOString() });
    await db.appMeta.put({ key: 'lastBackupAt', value: oldDate.toISOString() });
    await db.appMeta.put({ key: 'schemaVersion', value: APP_SCHEMA_VERSION });

    const status = await appMetaService.getMetaStatus(fixedNow);
    expect(status.needsBackup).toBe(true);
    expect(status.schemaMismatch).toBe(false);
  });

  it('keeps needsBackup false when within the reminder window', async () => {
    useUIStore.setState({
      settings: { ...DEFAULT_SETTINGS, backupReminderCadenceDays: 7 },
    });
    const recentDate = new Date(fixedNow);
    recentDate.setDate(recentDate.getDate() - 3);

    await db.appMeta.put({ key: 'createdAt', value: recentDate.toISOString() });
    await db.appMeta.put({ key: 'lastBackupAt', value: recentDate.toISOString() });
    await db.appMeta.put({ key: 'schemaVersion', value: APP_SCHEMA_VERSION });

    const status = await appMetaService.getMetaStatus(fixedNow);
    expect(status.needsBackup).toBe(false);
    expect(status.schemaMismatch).toBe(false);
  });

  it('uses custom cadence values from user settings', async () => {
    useUIStore.setState({
      settings: { ...DEFAULT_SETTINGS, backupReminderCadenceDays: 3 },
    });
    const recentDate = new Date(fixedNow);
    recentDate.setDate(recentDate.getDate() - 4);

    await db.appMeta.put({ key: 'createdAt', value: fixedNow.toISOString() });
    await db.appMeta.put({ key: 'lastBackupAt', value: recentDate.toISOString() });
    await db.appMeta.put({ key: 'schemaVersion', value: APP_SCHEMA_VERSION });

    const status = await appMetaService.getMetaStatus(fixedNow);
    expect(status.needsBackup).toBe(true);

    const withinCadence = new Date(fixedNow);
    withinCadence.setDate(withinCadence.getDate() - 2);
    await db.appMeta.put({ key: 'lastBackupAt', value: withinCadence.toISOString() });

    const refreshedStatus = await appMetaService.getMetaStatus(fixedNow);
    expect(refreshedStatus.needsBackup).toBe(false);
  });

  it('falls back to default cadence when the setting is invalid', async () => {
    useUIStore.setState({
      settings: { ...DEFAULT_SETTINGS, backupReminderCadenceDays: -5 },
    });
    const tenDaysAgo = new Date(fixedNow);
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    await db.appMeta.put({ key: 'createdAt', value: tenDaysAgo.toISOString() });
    await db.appMeta.put({ key: 'schemaVersion', value: APP_SCHEMA_VERSION });

    const status = await appMetaService.getMetaStatus(fixedNow);
    expect(status.needsBackup).toBe(false);
  });

  it('prefers lastBackupAt over createdAt when both exist', async () => {
    const oldCreated = new Date(fixedNow);
    oldCreated.setDate(oldCreated.getDate() - 30);
    const recentBackup = new Date(fixedNow);
    recentBackup.setDate(recentBackup.getDate() - 2);

    await db.appMeta.put({ key: 'createdAt', value: oldCreated.toISOString() });
    await db.appMeta.put({ key: 'lastBackupAt', value: recentBackup.toISOString() });
    await db.appMeta.put({ key: 'schemaVersion', value: APP_SCHEMA_VERSION });

    const status = await appMetaService.getMetaStatus(fixedNow);
    expect(status.needsBackup).toBe(false);
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

  it('treats malformed date strings as needing backup', async () => {
    await db.appMeta.put({ key: 'createdAt', value: 'invalid-date' });
    await db.appMeta.put({ key: 'lastBackupAt', value: 'also-bad' });
    await db.appMeta.put({ key: 'schemaVersion', value: APP_SCHEMA_VERSION });

    const status = await appMetaService.getMetaStatus(fixedNow);
    expect(status.needsBackup).toBe(true);
  });
});

describe('backup cadence utilities', () => {
  it('parses valid dates and ignores invalid ones', () => {
    expect(__testUtils.parseDateString('2024-01-01T00:00:00.000Z')?.toISOString()).toBe(
      '2024-01-01T00:00:00.000Z'
    );
    expect(__testUtils.parseDateString('not-a-date')).toBeUndefined();
  });

  it('resolves cadence with sane fallbacks', () => {
    expect(__testUtils.resolveBackupCadenceDays(5)).toBe(5);
    expect(__testUtils.resolveBackupCadenceDays(-1)).toBe(DEFAULT_SETTINGS.backupReminderCadenceDays);
  });
});

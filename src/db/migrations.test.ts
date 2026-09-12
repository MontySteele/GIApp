import Dexie from 'dexie';
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { initializeDatabase, LATEST_SCHEMA_VERSION } from './migrations';
import { GenshinTrackerDB, SCHEMA_STORES } from './schema';

const createdDatabases: string[] = [];

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(createdDatabases.map((name) => Dexie.delete(name)));
  createdDatabases.length = 0;
});

describe('database migrations', () => {
  it('opens a legacy v1 database, migrates it additively, and writes the latest appMeta schemaVersion', async () => {
    const dbName = `MigrationTest-${crypto.randomUUID()}`;
    createdDatabases.push(dbName);

    // Create a legacy v1 database without the v2 migration registered.
    const legacyDb = new Dexie(dbName);
    legacyDb.version(1).stores(SCHEMA_STORES);
    await legacyDb.open();
    await legacyDb.table('appMeta').put({ key: 'schemaVersion', value: 1 });
    await legacyDb.close();

    const trackerDb = new GenshinTrackerDB(dbName);

    await initializeDatabase(trackerDb);

    const schemaVersion = await trackerDb.appMeta.get('schemaVersion');
    expect(schemaVersion?.value).toBe(LATEST_SCHEMA_VERSION);

    trackerDb.close();
  });

  it('initializes appMeta for new installs at the latest schema version', async () => {
    const dbName = `MigrationTest-${crypto.randomUUID()}`;
    createdDatabases.push(dbName);

    const trackerDb = new GenshinTrackerDB(dbName);

    await initializeDatabase(trackerDb);

    const schemaVersion = await trackerDb.appMeta.get('schemaVersion');
    expect(schemaVersion?.value).toBe(LATEST_SCHEMA_VERSION);

    trackerDb.close();
  });

  it('rejects instead of half-opening when Dexie cannot open the database', async () => {
    const dbName = `MigrationTest-${crypto.randomUUID()}`;
    createdDatabases.push(dbName);
    const trackerDb = new GenshinTrackerDB(dbName);
    vi.spyOn(trackerDb, 'open').mockRejectedValue(new Error('UpgradeError: boom'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(initializeDatabase(trackerDb)).rejects.toThrow('boom');
  });

  it('exposes one schema version everywhere', async () => {
    const { SCHEMA_VERSION } = await import('./schemaVersion');
    const { APP_SCHEMA_VERSION } = await import('@/lib/constants');
    const trackerDb = new GenshinTrackerDB(`MigrationTest-${crypto.randomUUID()}`);
    expect(LATEST_SCHEMA_VERSION).toBe(SCHEMA_VERSION);
    expect(APP_SCHEMA_VERSION).toBe(SCHEMA_VERSION);
    expect(trackerDb.verno).toBe(SCHEMA_VERSION);
  });
});

import Dexie from 'dexie';
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';

import { initializeDatabase, LATEST_SCHEMA_VERSION } from './migrations';
import { GenshinTrackerDB, SCHEMA_STORES } from './schema';

const createdDatabases: string[] = [];

afterEach(async () => {
  await Promise.all(createdDatabases.map((name) => Dexie.delete(name)));
  createdDatabases.length = 0;
});

describe('database migrations', () => {
  it('runs the v1 → v2 upgrade hook and bumps appMeta schemaVersion', async () => {
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
  });

  it('initializes appMeta for new installs at the latest schema version', async () => {
    const dbName = `MigrationTest-${crypto.randomUUID()}`;
    createdDatabases.push(dbName);

    const trackerDb = new GenshinTrackerDB(dbName);

    await initializeDatabase(trackerDb);

    const schemaVersion = await trackerDb.appMeta.get('schemaVersion');
    expect(schemaVersion?.value).toBe(LATEST_SCHEMA_VERSION);
  });
});

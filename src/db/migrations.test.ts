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
  it('runs the upgrade hooks and bumps appMeta schemaVersion', async () => {
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

  it('adds tombstone metadata and default timestamps during the v3 upgrade', async () => {
    const dbName = `MigrationTest-${crypto.randomUUID()}`;
    createdDatabases.push(dbName);

    const legacyDb = new Dexie(dbName);
    legacyDb.version(2).stores(SCHEMA_STORES);
    await legacyDb.open();
    await legacyDb.table('characters').add({
      id: 'char-1',
      key: 'Aether',
      level: 20,
      ascension: 1,
      constellation: 0,
      talent: { auto: 1, skill: 1, burst: 1 },
      weapon: { key: 'Sword', level: 1, ascension: 0, refinement: 1 },
      artifacts: [],
      notes: '',
      priority: 'main',
      teamIds: [],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    });
    await legacyDb.table('resourceSnapshots').add({
      id: 'snap-1',
      timestamp: '2024-01-02T00:00:00.000Z',
      primogems: 1000,
      genesisCrystals: 0,
      intertwined: 0,
      acquaint: 0,
      starglitter: 0,
      stardust: 0,
      createdAt: '2024-01-02T00:00:00.000Z',
    });
    await legacyDb.table('externalCache').add({
      id: 'cache-1',
      cacheKey: 'enka:123',
      data: {},
      fetchedAt: '2024-01-03T00:00:00.000Z',
      expiresAt: '2024-01-04T00:00:00.000Z',
    });
    await legacyDb.table('appMeta').put({ key: 'schemaVersion', value: 2 });
    await legacyDb.close();

    const trackerDb = new GenshinTrackerDB(dbName);
    await initializeDatabase(trackerDb);

    const character = await trackerDb.characters.get('char-1');
    const snapshot = await trackerDb.resourceSnapshots.get('snap-1');
    const cache = await trackerDb.externalCache.get('cache-1');

    expect(character?.deletedAt).toBeNull();
    expect(snapshot?.deletedAt).toBeNull();
    expect(snapshot?.updatedAt).toBe(snapshot?.createdAt ?? snapshot?.timestamp);
    expect(cache?.deletedAt).toBeNull();
    expect(cache?.updatedAt).toBe(cache?.fetchedAt);

    const schemaVersion = await trackerDb.appMeta.get('schemaVersion');
    expect(schemaVersion?.value).toBe(LATEST_SCHEMA_VERSION);
  });
});

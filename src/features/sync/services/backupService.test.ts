import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { backupService, __testUtils, QR_BYTE_LIMIT, type BackupSnapshot } from './backupService';
import { GenshinTrackerDB, db } from '@/db/schema';
import { LATEST_SCHEMA_VERSION, initializeDatabase } from '@/db/migrations';

const createdDatabases: string[] = [];

function emptyTables(): BackupSnapshot['tables'] {
  return {
    characters: [],
    teams: [],
    wishRecords: [],
    primogemEntries: [],
    fateEntries: [],
    resourceSnapshots: [],
    abyssRuns: [],
    goals: [],
    notes: [],
    plannedBanners: [],
    externalCache: [],
    appMeta: [],
  };
}

let testDb: GenshinTrackerDB;

function getTables(database: GenshinTrackerDB) {
  return [
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
  ];
}

beforeEach(async () => {
  const dbName = `BackupService-${crypto.randomUUID()}`;
  createdDatabases.push(dbName);
  testDb = new GenshinTrackerDB(dbName);
  await initializeDatabase(testDb);
  await Promise.all(getTables(testDb).map((table) => table.clear()));
});

afterEach(async () => {
  await testDb.close();
  await Promise.all(createdDatabases.map((name) => Dexie.delete(name)));
  createdDatabases.length = 0;
});

describe('backupService', () => {
  it('round-trips an encrypted backup and restore', async () => {
    const character = {
      id: 'char-1',
      key: 'Aether',
      level: 20,
      ascension: 1,
      constellation: 0,
      talent: { auto: 1, skill: 1, burst: 1 },
      weapon: { key: 'Sword', level: 1, ascension: 0, refinement: 1 },
      artifacts: [],
      notes: '',
      priority: 'main' as const,
      teamIds: [],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      deletedAt: null,
    };
    await testDb.characters.add(character);

    const exported = await backupService.exportBackup('secret', testDb);

    await testDb.characters.clear();
    const afterClear = await testDb.characters.toArray();
    expect(afterClear).toHaveLength(0);

    await backupService.restoreBackup(exported.serialized, 'secret', 'replace', testDb);

    const restored = await testDb.characters.get(character.id);
    const schemaVersion = await testDb.appMeta.get('schemaVersion');

    expect(restored?.key).toBe('Aether');
    expect(restored?.deletedAt).toBeNull();
    expect(schemaVersion?.value).toBe(LATEST_SCHEMA_VERSION);
  });

  it('routes payloads to QR when small and to file when large', () => {
    expect(backupService.routeForPayload('tiny')).toBe('qr');
    expect(backupService.routeForPayload('x'.repeat(QR_BYTE_LIMIT + 50))).toBe('file');
  });

  it('merges records with newer-wins, respecting tombstones', async () => {
    await testDb.characters.bulkAdd([
      {
        id: 'char-1',
        key: 'Amber',
        level: 40,
        ascension: 2,
        constellation: 0,
        talent: { auto: 2, skill: 2, burst: 2 },
        weapon: { key: 'Bow', level: 20, ascension: 1, refinement: 1 },
        artifacts: [],
        notes: '',
        priority: 'main' as const,
        teamIds: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-02-01T00:00:00.000Z',
        deletedAt: null,
      },
      {
        id: 'char-2',
        key: 'Diluc',
        level: 50,
        ascension: 3,
        constellation: 0,
        talent: { auto: 3, skill: 3, burst: 3 },
        weapon: { key: 'Claymore', level: 30, ascension: 1, refinement: 1 },
        artifacts: [],
        notes: '',
        priority: 'secondary' as const,
        teamIds: [],
        createdAt: '2024-01-05T00:00:00.000Z',
        updatedAt: '2024-03-01T00:00:00.000Z',
        deletedAt: '2024-03-05T00:00:00.000Z',
      },
    ]);

    const snapshot: BackupSnapshot = {
      metadata: {
        schemaVersion: LATEST_SCHEMA_VERSION,
        deviceId: 'device-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        exportedAt: '2024-06-01T00:00:00.000Z',
      },
      tables: {
        ...emptyTables(),
        characters: [],
      },
    };

    snapshot.tables.characters = [
      {
        id: 'char-1',
        key: 'Amber',
        level: 50,
        ascension: 3,
        constellation: 1,
        talent: { auto: 4, skill: 4, burst: 4 },
        weapon: { key: 'Bow', level: 40, ascension: 2, refinement: 2 },
        artifacts: [],
        notes: 'Older backup',
        priority: 'main',
        teamIds: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
        deletedAt: null,
      },
      {
        id: 'char-2',
        key: 'Diluc',
        level: 80,
        ascension: 5,
        constellation: 1,
        talent: { auto: 6, skill: 6, burst: 6 },
        weapon: { key: 'Claymore', level: 60, ascension: 3, refinement: 2 },
        artifacts: [],
        notes: 'Restored after deletion',
        priority: 'main',
        teamIds: [],
        createdAt: '2024-01-05T00:00:00.000Z',
        updatedAt: '2024-04-01T00:00:00.000Z',
        deletedAt: null,
      },
      {
        id: 'char-3',
        key: 'Noelle',
        level: 20,
        ascension: 1,
        constellation: 0,
        talent: { auto: 1, skill: 1, burst: 1 },
        weapon: { key: 'Claymore', level: 1, ascension: 0, refinement: 1 },
        artifacts: [],
        notes: '',
        priority: 'bench',
        teamIds: [],
        createdAt: '2024-02-01T00:00:00.000Z',
        updatedAt: '2024-02-01T00:00:00.000Z',
        deletedAt: null,
      },
    ];

    const envelope = await __testUtils.encryptSnapshot(snapshot, 'secret');
    await backupService.restoreBackup(JSON.stringify(envelope), 'secret', 'newer-wins', testDb);

    const all = await testDb.characters.toArray();
    const amber = all.find((c) => c.id === 'char-1');
    const diluc = all.find((c) => c.id === 'char-2');
    const noelle = all.find((c) => c.id === 'char-3');

    expect(amber?.notes).toBe('');
    expect(amber?.updatedAt).toBe('2024-02-01T00:00:00.000Z');
    expect(diluc?.deletedAt).toBeNull();
    expect(diluc?.updatedAt).toBe('2024-04-01T00:00:00.000Z');
    expect(noelle).toBeDefined();
  });
});

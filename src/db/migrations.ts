import { db as defaultDb, SCHEMA_STORES, type GenshinTrackerDB } from './schema';
import { LATEST_SCHEMA_VERSION } from './version';

// Migration guardrails:
// - Upgrades must be idempotent and write the latest schemaVersion so clients do not stall on stale metadata.
// - Dexie fails closed on migration errors. We rethrow initialization errors so the app never runs on a partially migrated DB.
// - Avoid silent divergence: even no-op migrations should bump appMeta.schemaVersion through the upgrade hook.

const MIGRATIONS_REGISTERED = Symbol('migrationsRegistered');

function registerMigrations(database: GenshinTrackerDB) {
  if ((database as any)[MIGRATIONS_REGISTERED]) {
    return;
  }

  database
    .version(2)
    .stores(SCHEMA_STORES)
    .upgrade(async (tx) => {
      const appMetaTable = tx.table('appMeta');
      const existingVersion = (await appMetaTable.get('schemaVersion'))?.value ?? 1;

      if (existingVersion >= 2) {
        return;
      }

      await appMetaTable.put({ key: 'schemaVersion', value: 2 });

      const deviceId = await appMetaTable.get('deviceId');
      if (!deviceId) {
        await appMetaTable.put({ key: 'deviceId', value: crypto.randomUUID() });
      }

      const createdAt = await appMetaTable.get('createdAt');
      if (!createdAt) {
        await appMetaTable.put({ key: 'createdAt', value: new Date().toISOString() });
      }
    });

  database
    .version(3)
    .stores(SCHEMA_STORES)
    .upgrade(async (tx) => {
      const now = new Date().toISOString();

      await tx.table('characters').toCollection().modify((character: any) => {
        character.deletedAt = character.deletedAt ?? null;
      });

      await tx.table('teams').toCollection().modify((team: any) => {
        team.deletedAt = team.deletedAt ?? null;
      });

      await tx.table('wishRecords').toCollection().modify((wish: any) => {
        wish.deletedAt = wish.deletedAt ?? null;
      });

      await tx.table('primogemEntries').toCollection().modify((entry: any) => {
        entry.deletedAt = entry.deletedAt ?? null;
      });

      await tx.table('fateEntries').toCollection().modify((entry: any) => {
        entry.deletedAt = entry.deletedAt ?? null;
      });

      await tx.table('resourceSnapshots').toCollection().modify((snapshot: any) => {
        snapshot.updatedAt = snapshot.updatedAt ?? snapshot.createdAt ?? snapshot.timestamp ?? now;
        snapshot.deletedAt = snapshot.deletedAt ?? null;
      });

      await tx.table('abyssRuns').toCollection().modify((run: any) => {
        run.deletedAt = run.deletedAt ?? null;
      });

      await tx.table('goals').toCollection().modify((goal: any) => {
        goal.deletedAt = goal.deletedAt ?? null;
      });

      await tx.table('notes').toCollection().modify((note: any) => {
        note.deletedAt = note.deletedAt ?? null;
      });

      await tx.table('plannedBanners').toCollection().modify((banner: any) => {
        banner.deletedAt = banner.deletedAt ?? null;
      });

      await tx.table('externalCache').toCollection().modify((entry: any) => {
        entry.updatedAt = entry.updatedAt ?? entry.fetchedAt ?? now;
        entry.deletedAt = entry.deletedAt ?? null;
      });

      const appMetaTable = tx.table('appMeta');
      const schemaVersion = await appMetaTable.get('schemaVersion');
      if (!schemaVersion || schemaVersion.value !== LATEST_SCHEMA_VERSION) {
        await appMetaTable.put({ key: 'schemaVersion', value: LATEST_SCHEMA_VERSION });
      }
    });

  (database as any)[MIGRATIONS_REGISTERED] = true;
}

export async function initializeDatabase(database: GenshinTrackerDB = defaultDb) {
  try {
    registerMigrations(database);
    await database.open();
    console.log('Database initialized successfully');

    const schemaVersion = await database.appMeta.get('schemaVersion');
    if (!schemaVersion || schemaVersion.value !== LATEST_SCHEMA_VERSION) {
      await database.appMeta.put({ key: 'schemaVersion', value: LATEST_SCHEMA_VERSION });
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export { LATEST_SCHEMA_VERSION };

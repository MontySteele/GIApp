import { db as defaultDb, SCHEMA_STORES, type GenshinTrackerDB } from './schema';

// Migration guardrails:
// - Upgrades must be idempotent and write the latest schemaVersion so clients do not stall on stale metadata.
// - Dexie fails closed on migration errors. We rethrow initialization errors so the app never runs on a partially migrated DB.
// - Avoid silent divergence: even no-op migrations should bump appMeta.schemaVersion through the upgrade hook.

const LATEST_SCHEMA_VERSION = 2;
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

import { db as defaultDb, type GenshinTrackerDB } from './schema';

// Migration guardrails:
// - Upgrades must be idempotent and write the latest schemaVersion so clients do not stall on stale metadata.
// - Dexie fails closed on migration errors. We rethrow initialization errors so the app never runs on a partially migrated DB.
// - Avoid silent divergence: even no-op migrations should bump appMeta.schemaVersion through the upgrade hook.

// NOTE: Schema versions are now defined in schema.ts constructor (versions 1-4).
// This file only handles runtime app metadata initialization, not schema migrations.
const LATEST_SCHEMA_VERSION = 4;
const METADATA_INITIALIZED = Symbol('metadataInitialized');

async function ensureMetadata(database: GenshinTrackerDB) {
  if ((database as any)[METADATA_INITIALIZED]) {
    return;
  }

  // Ensure deviceId and createdAt are set
  const deviceId = await database.appMeta.get('deviceId');
  if (!deviceId) {
    await database.appMeta.put({ key: 'deviceId', value: crypto.randomUUID() });
  }

  const createdAt = await database.appMeta.get('createdAt');
  if (!createdAt) {
    await database.appMeta.put({ key: 'createdAt', value: new Date().toISOString() });
  }

  (database as any)[METADATA_INITIALIZED] = true;
}

export async function initializeDatabase(database: GenshinTrackerDB = defaultDb) {
  try {
    // Open the database - Dexie handles schema migrations automatically
    // based on version definitions in schema.ts
    await database.open();
    console.log('Database initialized successfully');

    // Ensure app metadata is set up
    await ensureMetadata(database);

    // Track schema version for debugging/diagnostics
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

import { db as defaultDb, type GenshinTrackerDB } from './schema';
import { SCHEMA_VERSION } from './schemaVersion';
import { runPendingDataFixes } from './dataFixes';

// Migration guardrails:
// - Schema versions (and any future `.upgrade()` transforms) live in schema.ts. All current
//   versions are additive, so Dexie migrates them without custom upgrade code.
// - Fail closed: `initializeDatabase` rethrows, and `DatabaseGate` in the app shell refuses
//   to render the router until it resolves, so nothing runs against a half-open database.
// - After a successful open, appMeta.schemaVersion is written to SCHEMA_VERSION so the
//   sync/backup layer can detect stale clients.

const LATEST_SCHEMA_VERSION = SCHEMA_VERSION;

async function ensureMetadata(database: GenshinTrackerDB) {
  // Ensure deviceId and createdAt are set
  const deviceId = await database.appMeta.get('deviceId');
  if (!deviceId) {
    await database.appMeta.put({ key: 'deviceId', value: crypto.randomUUID() });
  }

  const createdAt = await database.appMeta.get('createdAt');
  if (!createdAt) {
    await database.appMeta.put({ key: 'createdAt', value: new Date().toISOString() });
  }
}

export async function initializeDatabase(database: GenshinTrackerDB = defaultDb) {
  try {
    // Open the database - Dexie handles schema migrations automatically
    // based on version definitions in schema.ts
    await database.open();
    if (database.verno !== SCHEMA_VERSION) {
      throw new Error(
        `Database opened at schema version ${database.verno}, expected ${SCHEMA_VERSION}`
      );
    }

    // Ensure app metadata is set up
    await ensureMetadata(database);

    // Idempotent row-level repairs (e.g. canonical character keys)
    await runPendingDataFixes(database);

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

/**
 * The single source of truth for the Dexie schema version.
 *
 * Kept dependency-free so it can be imported from `lib/constants` (which the Monte
 * Carlo worker bundles) without dragging Dexie into the worker. `schema.ts` declares
 * `db.version(n)` up to this number and `initializeDatabase` asserts the two agree.
 */
export const SCHEMA_VERSION = 5;

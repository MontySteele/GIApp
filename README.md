# GIApp

## Database migrations

- Migrations fail closed: if an upgrade throws, database initialization aborts so the app never runs on a partially migrated schema.
- No-op upgrades still bump `appMeta.schemaVersion` via Dexie upgrade hooks so clients stay aligned with the latest version.
- Metadata like `deviceId` and `createdAt` is (re)hydrated when missing to keep app identity intact across migrations.

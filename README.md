# GIApp

## Database migrations

- Migrations fail closed: if an upgrade throws, database initialization aborts so the app never runs on a partially migrated schema.
- No-op upgrades still bump `appMeta.schemaVersion` via Dexie upgrade hooks so clients stay aligned with the latest version.
- Metadata like `deviceId` and `createdAt` is (re)hydrated when missing to keep app identity intact across migrations.

## Development quick start

- Install dependencies with `npm install`. If installation fails because of a local proxy or network issue, you may skip tests and continue with code changes—note the failure in your summary.
- Run linting with `npm run lint`.
- Run the unit suite with `npm run test:run`, or use `npm run check` to lint and run tests together.

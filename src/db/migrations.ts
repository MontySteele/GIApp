import { db } from './schema';

// Schema migrations will be added here as the app evolves
// Example:
// db.version(2).stores({
//   // Add new tables or modify existing ones
// }).upgrade(tx => {
//   // Data migration logic
// });

// Current version: 1
// No migrations yet

export async function initializeDatabase() {
  try {
    await db.open();
    console.log('Database initialized successfully');

    // Set initial app metadata if not exists
    const schemaVersion = await db.appMeta.get('schemaVersion');
    if (!schemaVersion) {
      await db.appMeta.put({ key: 'schemaVersion', value: 1 });
      await db.appMeta.put({ key: 'deviceId', value: crypto.randomUUID() });
      await db.appMeta.put({
        key: 'createdAt',
        value: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Irminsul Import Service
 *
 * Orchestrates the full import process:
 * 1. Parse and validate the Irminsul JSON
 * 2. Import characters (merge with existing)
 * 3. Import artifacts to inventory
 * 4. Import weapons to inventory
 * 5. Import materials
 * 6. Record the import for tracking
 */

import { db } from '@/db/schema';
import {
  validateIrminsulFormat,
  fromIrminsul,
  mergeCharacter,
  type IrminsulFormat,
  type IrminsulImportResult,
} from '@/mappers/irminsul';
import { materialRepo, importRecordRepo } from '../repo/inventoryRepo';

export interface ImportOptions {
  /** Replace all existing data vs merge */
  replaceAll?: boolean;
  /** Import characters */
  importCharacters?: boolean;
  /** Import artifacts to inventory */
  importArtifacts?: boolean;
  /** Import weapons to inventory */
  importWeapons?: boolean;
  /** Import materials */
  importMaterials?: boolean;
}

export interface ImportSummary {
  success: boolean;
  error?: string;
  charactersImported: number;
  charactersUpdated: number;
  charactersSkipped: number;
  artifactsImported: number;
  weaponsImported: number;
  materialsImported: number;
  importId?: string;
}

const DEFAULT_OPTIONS: ImportOptions = {
  replaceAll: false,
  importCharacters: true,
  importArtifacts: true,
  importWeapons: true,
  importMaterials: true,
};

/**
 * Parse Irminsul JSON string and validate
 */
export function parseIrminsulJson(jsonString: string): IrminsulFormat {
  let data: unknown;

  try {
    data = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON format');
  }

  if (!validateIrminsulFormat(data)) {
    throw new Error('Invalid Irminsul/GOOD format');
  }

  return data;
}

/**
 * Get a preview of what will be imported without actually importing
 */
export function previewImport(data: IrminsulFormat): IrminsulImportResult {
  return fromIrminsul(data);
}

/**
 * Perform the full Irminsul import
 */
export async function importIrminsul(
  data: IrminsulFormat,
  options: ImportOptions = {},
  filename?: string
): Promise<ImportSummary> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const result = fromIrminsul(data);

    let charactersImported = 0;
    let charactersUpdated = 0;
    let charactersSkipped = 0;
    let artifactsImported = 0;
    let weaponsImported = 0;
    let materialsImported = 0;

    // Use a transaction for atomicity
    await db.transaction(
      'rw',
      [
        db.characters,
        db.inventoryArtifacts,
        db.inventoryWeapons,
        db.materialInventory,
        db.importRecords,
      ],
      async () => {
        // Import characters
        if (opts.importCharacters && result.characters.length > 0) {
          if (opts.replaceAll) {
            // Clear and replace all characters
            await db.characters.clear();
            const now = new Date().toISOString();
            for (const char of result.characters) {
              await db.characters.add({
                ...char,
                id: crypto.randomUUID(),
                createdAt: now,
                updatedAt: now,
              });
              charactersImported++;
            }
          } else {
            // Merge with existing characters
            const existingCharacters = await db.characters.toArray();
            const existingByKey = new Map(existingCharacters.map((c) => [c.key, c]));

            for (const importedChar of result.characters) {
              const existing = existingByKey.get(importedChar.key);

              if (existing) {
                // Merge: update existing character
                const updates = mergeCharacter(existing, importedChar);
                await db.characters.update(existing.id, {
                  ...updates,
                  updatedAt: new Date().toISOString(),
                });
                charactersUpdated++;
              } else {
                // Create new character
                const now = new Date().toISOString();
                await db.characters.add({
                  ...importedChar,
                  id: crypto.randomUUID(),
                  createdAt: now,
                  updatedAt: now,
                });
                charactersImported++;
              }
            }
          }
        }

        // Import artifacts
        if (opts.importArtifacts && result.artifacts.length > 0) {
          if (opts.replaceAll) {
            await db.inventoryArtifacts.clear();
          }

          const now = new Date().toISOString();
          const artifactsWithTimestamps = result.artifacts.map((a) => ({
            ...a,
            createdAt: now,
            updatedAt: now,
          }));

          // Use bulkPut to upsert (will update if ID exists)
          await db.inventoryArtifacts.bulkPut(artifactsWithTimestamps);
          artifactsImported = result.artifacts.length;
        }

        // Import weapons
        if (opts.importWeapons && result.weapons.length > 0) {
          if (opts.replaceAll) {
            await db.inventoryWeapons.clear();
          }

          const now = new Date().toISOString();
          const weaponsWithTimestamps = result.weapons.map((w) => ({
            ...w,
            createdAt: now,
            updatedAt: now,
          }));

          await db.inventoryWeapons.bulkPut(weaponsWithTimestamps);
          weaponsImported = result.weapons.length;
        }

        // Import materials
        if (opts.importMaterials && Object.keys(result.materials).length > 0) {
          await materialRepo.set(result.materials);
          materialsImported = Object.keys(result.materials).length;
        }

        // Record the import
        await importRecordRepo.create({
          source: data.source || 'GOOD',
          filename,
          importedAt: new Date().toISOString(),
          characterCount: charactersImported + charactersUpdated,
          artifactCount: artifactsImported,
          weaponCount: weaponsImported,
          materialCount: materialsImported,
        });
      }
    );

    return {
      success: true,
      charactersImported,
      charactersUpdated,
      charactersSkipped,
      artifactsImported,
      weaponsImported,
      materialsImported,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      charactersImported: 0,
      charactersUpdated: 0,
      charactersSkipped: 0,
      artifactsImported: 0,
      weaponsImported: 0,
      materialsImported: 0,
    };
  }
}

/**
 * Get the last import record
 */
export async function getLastImport() {
  return importRecordRepo.getLatest();
}

/**
 * Get all import records
 */
export async function getImportHistory() {
  return importRecordRepo.getAll();
}

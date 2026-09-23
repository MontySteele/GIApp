/**
 * HoYoLAB Battle Chronicle Import Service
 *
 * Persists characters fetched from the HoYoLAB Battle Chronicle API.
 * Unlike a one-shot import, this path is meant for routine refreshes,
 * so existing notes, priority, and team assignments are preserved.
 */

import type { Character } from '@/types';
import { mergeCharacter } from '@/mappers/irminsul';
import { characterRepo } from '../repo/characterRepo';
import { importRecordRepo } from '../repo/inventoryRepo';

export interface HoyolabImportResult {
  created: number;
  updated: number;
}

/**
 * Match keys across import sources: Enka historically stored spaced names
 * ("Kamisato Ayaka") while GOOD/Irminsul/HoYoLAB use PascalCase
 * ("KamisatoAyaka"). Both normalize to the same string here.
 */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function importHoyolabCharacters(
  characters: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<HoyolabImportResult> {
  const existingCharacters = await characterRepo.getAll();
  const existingByNormalizedKey = new Map(
    existingCharacters.map((c) => [normalizeKey(c.key), c])
  );

  let created = 0;
  let updated = 0;

  for (const character of characters) {
    const existing = existingByNormalizedKey.get(normalizeKey(character.key));
    if (existing) {
      const merged = mergeCharacter(existing, character);
      // HoYoLAB only reports level, so the mapper derives the minimal
      // ascension. Keep a higher local ascension at the same level (e.g. a
      // level-80 character already ascended to phase 6).
      if (existing.level === character.level && existing.ascension > character.ascension) {
        merged.ascension = existing.ascension;
      }
      await characterRepo.update(existing.id, merged);
      updated++;
    } else {
      await characterRepo.create(character);
      created++;
    }
  }

  const artifactCount = characters.reduce((sum, c) => sum + c.artifacts.length, 0);
  await importRecordRepo.create({
    source: 'HoYoLAB',
    importedAt: new Date().toISOString(),
    characterCount: characters.length,
    artifactCount,
    weaponCount: characters.length,
    materialCount: 0,
  });

  return { created, updated };
}

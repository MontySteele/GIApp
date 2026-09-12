import { db as defaultDb, type GenshinTrackerDB } from './schema';
import { normalizeCharacterKey } from '@/lib/constants/characterList';
import { STORAGE_KEYS } from '@/lib/constants/storageKeys';
import type { Character } from '@/types';

/**
 * One-off, idempotent data repairs that run after the database opens. They are not
 * Dexie schema versions: no index or table changes, only row contents.
 */

export const CHARACTER_KEY_FIX_META_KEY = 'dataFix:characterKeys:v1';

export interface CharacterKeyFixResult {
  charactersRenamed: number;
  charactersMerged: number;
  teamsUpdated: number;
  campaignsUpdated: number;
  plannedBannersUpdated: number;
  buildTemplatesUpdated: number;
  wishlistUpdated: boolean;
}

function pickSurvivor(rows: Character[]): Character {
  // Highest level wins (most progressed import), then most recently updated.
  return [...rows].sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    return (b.updatedAt || '').localeCompare(a.updatedAt || '');
  })[0]!;
}

function uniqueInOrder(keys: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const key of keys) {
    if (!seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  }
  return out;
}

/**
 * Rewrites every stored character key to its canonical GOOD form and merges rows
 * that were the same character under different spellings ("Ayaka", "Kamisato Ayaka",
 * "KamisatoAyaka"). Safe to run repeatedly.
 */
export async function normalizeStoredCharacterKeys(
  database: GenshinTrackerDB = defaultDb,
  storage: Storage | undefined = typeof localStorage === 'undefined' ? undefined : localStorage
): Promise<CharacterKeyFixResult> {
  const result: CharacterKeyFixResult = {
    charactersRenamed: 0,
    charactersMerged: 0,
    teamsUpdated: 0,
    campaignsUpdated: 0,
    plannedBannersUpdated: 0,
    buildTemplatesUpdated: 0,
    wishlistUpdated: false,
  };

  await database.transaction(
    'rw',
    [database.characters, database.teams, database.campaigns, database.plannedBanners, database.buildTemplates, database.appMeta],
    async () => {
      // --- characters ---
      const characters = await database.characters.toArray();
      const groups = new Map<string, Character[]>();
      for (const character of characters) {
        const canonical = normalizeCharacterKey(character.key);
        const group = groups.get(canonical) ?? [];
        group.push(character);
        groups.set(canonical, group);
      }

      for (const [canonical, rows] of groups) {
        const survivor = pickSurvivor(rows);
        const teamIds = uniqueInOrder(rows.flatMap((row) => row.teamIds ?? []));
        const needsRename = survivor.key !== canonical;
        const needsTeamMerge = teamIds.length !== (survivor.teamIds ?? []).length;

        if (needsRename || needsTeamMerge) {
          await database.characters.update(survivor.id, {
            key: canonical,
            teamIds,
            updatedAt: new Date().toISOString(),
          });
          if (needsRename) result.charactersRenamed++;
        }

        for (const row of rows) {
          if (row.id !== survivor.id) {
            await database.characters.delete(row.id);
            result.charactersMerged++;
          }
        }
      }

      // --- teams ---
      const teams = await database.teams.toArray();
      for (const team of teams) {
        const characterKeys = uniqueInOrder(team.characterKeys.map(normalizeCharacterKey));
        let memberBuildTemplates = team.memberBuildTemplates;
        let templatesChanged = false;
        if (memberBuildTemplates) {
          const remapped: Record<string, string> = {};
          for (const [key, templateId] of Object.entries(memberBuildTemplates)) {
            const canonical = normalizeCharacterKey(key);
            if (canonical !== key) templatesChanged = true;
            if (!(canonical in remapped)) remapped[canonical] = templateId;
          }
          memberBuildTemplates = remapped;
        }
        const keysChanged =
          characterKeys.length !== team.characterKeys.length ||
          characterKeys.some((key, index) => key !== team.characterKeys[index]);
        if (keysChanged || templatesChanged) {
          await database.teams.update(team.id, {
            characterKeys,
            ...(memberBuildTemplates ? { memberBuildTemplates } : {}),
            updatedAt: new Date().toISOString(),
          });
          result.teamsUpdated++;
        }
      }

      // --- campaigns ---
      const campaigns = await database.campaigns.toArray();
      for (const campaign of campaigns) {
        let changed = false;
        const characterTargets = campaign.characterTargets.map((target) => {
          const canonical = normalizeCharacterKey(target.characterKey);
          if (canonical !== target.characterKey) changed = true;
          return { ...target, characterKey: canonical };
        });
        const pullTargets = campaign.pullTargets.map((target) => {
          if (target.itemType !== 'character') return target;
          const canonical = normalizeCharacterKey(target.itemKey);
          if (canonical !== target.itemKey) changed = true;
          return { ...target, itemKey: canonical };
        });
        if (changed) {
          await database.campaigns.update(campaign.id, { characterTargets, pullTargets });
          result.campaignsUpdated++;
        }
      }

      // --- planned banners ---
      const plannedBanners = await database.plannedBanners.toArray();
      for (const banner of plannedBanners) {
        const canonical = normalizeCharacterKey(banner.characterKey);
        if (canonical !== banner.characterKey) {
          await database.plannedBanners.update(banner.id, { characterKey: canonical });
          result.plannedBannersUpdated++;
        }
      }

      // --- build templates ---
      const templates = await database.buildTemplates.toArray();
      for (const template of templates) {
        const canonical = normalizeCharacterKey(template.characterKey);
        if (canonical !== template.characterKey) {
          await database.buildTemplates.update(template.id, { characterKey: canonical });
          result.buildTemplatesUpdated++;
        }
      }

      await database.appMeta.put({ key: CHARACTER_KEY_FIX_META_KEY, value: new Date().toISOString() });
    }
  );

  // --- wishlist (Zustand persist JSON in localStorage) ---
  if (storage) {
    try {
      const raw = storage.getItem(STORAGE_KEYS.WISHLIST);
      if (raw) {
        const parsed = JSON.parse(raw) as { state?: { characters?: Array<{ key: string }> } };
        const list = parsed.state?.characters;
        if (Array.isArray(list)) {
          const seen = new Set<string>();
          const next: Array<{ key: string }> = [];
          let changed = false;
          for (const entry of list) {
            const canonical = normalizeCharacterKey(entry.key);
            if (canonical !== entry.key) changed = true;
            if (seen.has(canonical)) {
              changed = true;
              continue;
            }
            seen.add(canonical);
            next.push({ ...entry, key: canonical });
          }
          if (changed) {
            parsed.state!.characters = next;
            storage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(parsed));
            result.wishlistUpdated = true;
          }
        }
      }
    } catch (error) {
      console.warn('Wishlist key normalisation skipped', error);
    }
  }

  return result;
}

/** Runs the character-key fix once per database (idempotent, guarded by an appMeta flag). */
export async function runPendingDataFixes(database: GenshinTrackerDB = defaultDb): Promise<void> {
  const done = await database.appMeta.get(CHARACTER_KEY_FIX_META_KEY);
  if (done) return;
  await normalizeStoredCharacterKeys(database);
}

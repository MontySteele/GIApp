import { describe, expect, it } from 'vitest';
import { CHARACTER_METADATA, getCharacterMetadata } from '@/features/roster/data/characterMetadata';
import { CHARACTER_KEY_MAP } from '@/features/teams/domain/gcsimKeyMappings';
import { ALL_CHARACTERS, type CharacterInfo } from '@/lib/constants/characterList';
import {
  getAvatarIdFromKey,
  getCharacterPortraitUrl,
  getDisplayName,
  toGoodCharacterKey,
} from '@/lib/characterData';
import {
  ALL_5_STAR_CHARACTERS,
  BANNER_HISTORY,
} from '@/lib/bannerHistory';
import { findStaticMaterialCoverageGaps } from './characterMaterialMap';

const TRAVELER_ELEMENT_KEYS = new Set([
  'TravelerAnemo',
  'TravelerGeo',
  'TravelerElectro',
  'TravelerDendro',
  'TravelerHydro',
  'TravelerPyro',
]);

const EXPECTED_CHARACTER_LIST_METADATA_GAPS = new Set([
  // characterList stores the player character by element, while metadata stores
  // Aether/Lumine as generic roster identities.
  ...TRAVELER_ELEMENT_KEYS,
]);

const EXPECTED_METADATA_ONLY_KEYS = new Set([
  // Generic or internal avatar identities, not wishlist/planner targets.
  'Aether',
  'Lumine',
  'Manekin',
  'Manekina',
  // Tracked as metadata only until they are added to planning/wishlist flows.
  'Avero',
  'Iljane',
  'Olorun',
]);

const EXPECTED_CHARACTER_LIST_AVATAR_GAPS = new Set([
  // Element-specific Traveler rows intentionally resolve to the generic
  // Aether/Lumine avatar only when imported from account data.
  ...TRAVELER_ELEMENT_KEYS,
]);

const EXPECTED_GCSIM_EXPORT_GAPS = new Set([
  // Present in tracker data, but wfpsim/gcsim support is not wired yet.
  'Aino',
  'Columbina',
  'Durin',
  'Flins',
  'Iansan',
  'Ifa',
  'Illuga',
  'Ineffa',
  'Jahoda',
  'Kachina',
  'Lauma',
  'Linnea',
  'Nefer',
  'Varka',
  'Zibai',
]);

const BANNER_CHARACTER_ALIASES: Record<string, string> = {
  Kazuha: 'KaedeharaKazuha',
  Raiden: 'RaidenShogun',
};

function normalizeCharacterIdentity(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function sorted(values: Iterable<string>): string[] {
  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

function buildCharacterLookup(): Map<string, string> {
  const lookup = new Map<string, string>();

  for (const character of ALL_CHARACTERS) {
    const aliases = [
      character.key,
      character.name,
      getDisplayName(character.key),
      toGoodCharacterKey(character.name),
    ];

    for (const alias of aliases) {
      lookup.set(normalizeCharacterIdentity(alias), character.key);
    }
  }

  for (const [alias, key] of Object.entries(BANNER_CHARACTER_ALIASES)) {
    lookup.set(normalizeCharacterIdentity(alias), key);
  }

  return lookup;
}

const CHARACTER_LOOKUP = buildCharacterLookup();
const CHARACTER_LIST_KEYS = new Set(ALL_CHARACTERS.map((character) => character.key));

function resolveCharacterListKey(value: string): string | undefined {
  return CHARACTER_LOOKUP.get(normalizeCharacterIdentity(value));
}

function characterAliases(character: CharacterInfo): string[] {
  return [
    character.key,
    character.name,
    getDisplayName(character.key),
    toGoodCharacterKey(character.name),
  ];
}

function hasGcsimMapping(character: CharacterInfo): boolean {
  return characterAliases(character).some((alias) => CHARACTER_KEY_MAP[alias]);
}

function hasMetadata(character: CharacterInfo): boolean {
  return characterAliases(character).some((alias) => getCharacterMetadata(alias));
}

function hasAvatarPortrait(character: CharacterInfo): boolean {
  const avatarId = characterAliases(character)
    .map((alias) => getAvatarIdFromKey(alias))
    .find((id) => id !== undefined);
  return Boolean(avatarId && getCharacterPortraitUrl(avatarId));
}

describe('character data consistency scanner', () => {
  it('keeps expected characterList gap keys current', () => {
    const staleExpectedCharacterListGaps = sorted(
      [
        ...EXPECTED_CHARACTER_LIST_METADATA_GAPS,
        ...EXPECTED_CHARACTER_LIST_AVATAR_GAPS,
        ...EXPECTED_GCSIM_EXPORT_GAPS,
      ].filter((key) => !CHARACTER_LIST_KEYS.has(key))
    );

    expect(staleExpectedCharacterListGaps).toEqual([]);
  });

  it('keeps characterList identities unique', () => {
    const seenKeys = new Map<string, string>();
    const seenNames = new Map<string, string>();
    const duplicateKeys: string[] = [];
    const duplicateNames: string[] = [];

    for (const character of ALL_CHARACTERS) {
      const normalizedKey = normalizeCharacterIdentity(character.key);
      const normalizedName = normalizeCharacterIdentity(character.name);

      if (seenKeys.has(normalizedKey)) {
        duplicateKeys.push(`${character.key} duplicates ${seenKeys.get(normalizedKey)}`);
      } else {
        seenKeys.set(normalizedKey, character.key);
      }

      if (seenNames.has(normalizedName)) {
        duplicateNames.push(`${character.name} duplicates ${seenNames.get(normalizedName)}`);
      } else {
        seenNames.set(normalizedName, character.name);
      }
    }

    expect({ duplicateKeys, duplicateNames }).toEqual({
      duplicateKeys: [],
      duplicateNames: [],
    });
  });

  it('compares characterList against roster metadata with explicit gaps', () => {
    const missingMetadata = ALL_CHARACTERS
      .filter((character) => !hasMetadata(character))
      .map((character) => character.key);

    const metadataOnly = CHARACTER_METADATA
      .filter((entry) => !resolveCharacterListKey(entry.key))
      .map((entry) => entry.key);

    expect(sorted(missingMetadata)).toEqual(sorted(EXPECTED_CHARACTER_LIST_METADATA_GAPS));
    expect(sorted(metadataOnly)).toEqual(sorted(EXPECTED_METADATA_ONLY_KEYS));
  });

  it('compares characterList against characterData portrait mappings with explicit gaps', () => {
    const missingPortraits = ALL_CHARACTERS
      .filter((character) => !hasAvatarPortrait(character))
      .map((character) => character.key);

    expect(sorted(missingPortraits)).toEqual(sorted(EXPECTED_CHARACTER_LIST_AVATAR_GAPS));
  });

  it('keeps bannerHistory character references resolvable to characterList entries', () => {
    const featuredCharacters = BANNER_HISTORY
      .filter((banner) => banner.bannerType === 'character')
      .flatMap((banner) => [...banner.featured5Star, ...banner.featured4Star]);

    const unknownFeaturedCharacters = sorted(
      new Set(featuredCharacters.filter((characterKey) => !resolveCharacterListKey(characterKey)))
    );
    const unknownRerunCharacters = sorted(
      ALL_5_STAR_CHARACTERS.filter((characterKey) => !resolveCharacterListKey(characterKey))
    );

    expect({ unknownFeaturedCharacters, unknownRerunCharacters }).toEqual({
      unknownFeaturedCharacters: [],
      unknownRerunCharacters: [],
    });
  });

  it('keeps planner material coverage complete for non-Traveler characterList entries', () => {
    const plannerCharacterKeys = ALL_CHARACTERS
      .map((character) => character.key)
      .filter((key) => !TRAVELER_ELEMENT_KEYS.has(key));

    expect(findStaticMaterialCoverageGaps(plannerCharacterKeys)).toEqual([]);
  });

  it('compares characterList against gcsim export mappings with explicit gaps', () => {
    const missingGcsimMappings = ALL_CHARACTERS
      .filter((character) => !hasGcsimMapping(character))
      .map((character) => character.key);

    expect(sorted(missingGcsimMappings)).toEqual(sorted(EXPECTED_GCSIM_EXPORT_GAPS));
  });
});

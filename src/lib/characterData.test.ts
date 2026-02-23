import { describe, it, expect } from 'vitest';
import {
  getAvatarIdFromKey,
  getCharacterPortraitUrl,
  getCharacterGachaArtUrl,
  toGoodCharacterKey,
  getDisplayName,
} from './characterData';
import { CHARACTER_METADATA } from '@/features/roster/data/characterMetadata';

describe('getAvatarIdFromKey', () => {
  it('returns avatarId for standard keys', () => {
    expect(getAvatarIdFromKey('Furina')).toBe(10000089);
    expect(getAvatarIdFromKey('Bennett')).toBe(10000032);
    expect(getAvatarIdFromKey('Zhongli')).toBe(10000030);
  });

  it('is case-insensitive', () => {
    expect(getAvatarIdFromKey('furina')).toBe(10000089);
    expect(getAvatarIdFromKey('FURINA')).toBe(10000089);
    expect(getAvatarIdFromKey('FuRiNa')).toBe(10000089);
  });

  it('handles keys with spaces', () => {
    expect(getAvatarIdFromKey('Hu Tao')).toBe(getAvatarIdFromKey('HuTao'));
    expect(getAvatarIdFromKey('Kamisato Ayaka')).toBe(getAvatarIdFromKey('KamisatoAyaka'));
    expect(getAvatarIdFromKey('Lan Yan')).toBe(getAvatarIdFromKey('LanYan'));
  });

  it('handles PascalCase compound names', () => {
    expect(getAvatarIdFromKey('KamisatoAyaka')).toBe(10000002);
    expect(getAvatarIdFromKey('KaedeharaKazuha')).toBe(10000047);
    expect(getAvatarIdFromKey('RaidenShogun')).toBe(10000052);
    expect(getAvatarIdFromKey('AratakiItto')).toBe(10000057);
    expect(getAvatarIdFromKey('SangonomiyaKokomi')).toBe(10000054);
    expect(getAvatarIdFromKey('KujouSara')).toBe(10000056);
    expect(getAvatarIdFromKey('KukiShinobu')).toBe(10000065);
    expect(getAvatarIdFromKey('ShikanoinHeizou')).toBe(10000059);
  });

  it('handles short alias names', () => {
    expect(getAvatarIdFromKey('Kazuha')).toBe(10000047);
    expect(getAvatarIdFromKey('Kokomi')).toBe(10000054);
    expect(getAvatarIdFromKey('Sara')).toBe(10000056);
    expect(getAvatarIdFromKey('Itto')).toBe(10000057);
    expect(getAvatarIdFromKey('Heizou')).toBe(10000059);
    expect(getAvatarIdFromKey('Shinobu')).toBe(10000065);
    expect(getAvatarIdFromKey('Raiden')).toBe(10000052);
  });

  it('returns undefined for unknown keys', () => {
    expect(getAvatarIdFromKey('NonExistentCharacter')).toBeUndefined();
    expect(getAvatarIdFromKey('')).toBeUndefined();
  });
});

describe('getCharacterPortraitUrl', () => {
  it('returns a valid Enka CDN URL for known avatarIds', () => {
    const url = getCharacterPortraitUrl(10000089); // Furina
    expect(url).toBe('https://enka.network/ui/UI_AvatarIcon_Side_Furina.png');
  });

  it('returns undefined for undefined input', () => {
    expect(getCharacterPortraitUrl(undefined)).toBeUndefined();
  });

  it('returns undefined for unknown avatarId', () => {
    expect(getCharacterPortraitUrl(99999999)).toBeUndefined();
  });

  it('returns undefined for zero', () => {
    expect(getCharacterPortraitUrl(0)).toBeUndefined();
  });

  it('follows the expected URL format for various characters', () => {
    expect(getCharacterPortraitUrl(10000046)).toBe(
      'https://enka.network/ui/UI_AvatarIcon_Side_Hutao.png'
    );
    expect(getCharacterPortraitUrl(10000047)).toBe(
      'https://enka.network/ui/UI_AvatarIcon_Side_Kazuha.png'
    );
  });
});

describe('getCharacterGachaArtUrl', () => {
  it('returns a valid gacha art URL for known avatarIds', () => {
    const url = getCharacterGachaArtUrl(10000089);
    expect(url).toBe('https://enka.network/ui/UI_Gacha_AvatarImg_Furina.png');
  });

  it('returns undefined for undefined input', () => {
    expect(getCharacterGachaArtUrl(undefined)).toBeUndefined();
  });
});

describe('toGoodCharacterKey', () => {
  it('returns the key unchanged for simple alphanumeric keys', () => {
    expect(toGoodCharacterKey('Furina')).toBe('Furina');
    expect(toGoodCharacterKey('HuTao')).toBe('HuTao');
  });

  it('converts spaced names to PascalCase', () => {
    expect(toGoodCharacterKey('Hu Tao')).toBe('HuTao');
    expect(toGoodCharacterKey('Kamisato Ayaka')).toBe('KamisatoAyaka');
  });

  it('returns empty string for empty input', () => {
    expect(toGoodCharacterKey('')).toBe('');
  });
});

// Characters that are in metadata for filtering but don't have confirmed
// Enka avatarIds yet (unreleased/unconfirmed). These are allowed to not
// resolve to portraits. When they get released, add their IDs and remove
// them from this set — the cross-reference test will enforce it.
const UNRELEASED_CHARACTERS = new Set([
  'avero',
  'iljane',
  'olorun',
  'columbina',
]);

describe('cross-reference: CHARACTER_METADATA ↔ CHARACTER_KEY_TO_ID', () => {
  it('every released character in CHARACTER_METADATA resolves to an avatarId', () => {
    const missingKeys: string[] = [];

    for (const entry of CHARACTER_METADATA) {
      const normalized = entry.key.toLowerCase().replace(/\s+/g, '');
      if (UNRELEASED_CHARACTERS.has(normalized)) continue;

      const avatarId = getAvatarIdFromKey(entry.key);
      if (avatarId === undefined) {
        if (!missingKeys.some((k) => k.toLowerCase().replace(/\s+/g, '') === normalized)) {
          missingKeys.push(entry.key);
        }
      }
    }

    if (missingKeys.length > 0) {
      throw new Error(
        `The following CHARACTER_METADATA keys have no matching CHARACTER_KEY_TO_ID entry:\n` +
          missingKeys.map((k) => `  - "${k}"`).join('\n') +
          `\n\nAdd these to CHARACTER_KEY_TO_ID in characterData.ts, ` +
          `or add to UNRELEASED_CHARACTERS if not yet in game`
      );
    }
  });

  it('every avatarId that resolves from a metadata key has an icon name mapping', () => {
    const missingIcons: string[] = [];

    for (const entry of CHARACTER_METADATA) {
      const avatarId = getAvatarIdFromKey(entry.key);
      if (avatarId !== undefined) {
        const url = getCharacterPortraitUrl(avatarId);
        if (url === undefined) {
          missingIcons.push(`${entry.key} (avatarId: ${avatarId})`);
        }
      }
    }

    if (missingIcons.length > 0) {
      throw new Error(
        `The following characters have avatarId but no icon name in CHARACTER_ICON_NAMES:\n` +
          missingIcons.map((k) => `  - ${k}`).join('\n') +
          `\n\nAdd their avatarId → iconName mapping to CHARACTER_ICON_NAMES in characterData.ts`
      );
    }
  });

  it('every released character in CHARACTER_METADATA can resolve to a portrait URL', () => {
    const noPortrait: string[] = [];

    for (const entry of CHARACTER_METADATA) {
      const normalized = entry.key.toLowerCase().replace(/\s+/g, '');
      if (UNRELEASED_CHARACTERS.has(normalized)) continue;

      const avatarId = getAvatarIdFromKey(entry.key);
      const url = avatarId ? getCharacterPortraitUrl(avatarId) : undefined;
      if (!url) {
        if (!noPortrait.some((k) => k.toLowerCase().replace(/\s+/g, '') === normalized)) {
          noPortrait.push(entry.key);
        }
      }
    }

    if (noPortrait.length > 0) {
      throw new Error(
        `The following characters cannot resolve to a portrait URL (end-to-end):\n` +
          noPortrait.map((k) => `  - "${k}"`).join('\n') +
          `\n\nEnsure they have entries in both CHARACTER_KEY_TO_ID and CHARACTER_ICON_NAMES`
      );
    }
  });

  it('unreleased characters list is kept small (remove as characters are released)', () => {
    // This test ensures we don't leave characters in the unreleased set forever
    expect(UNRELEASED_CHARACTERS.size).toBeLessThanOrEqual(10);
  });
});

describe('metadata completeness guards', () => {
  it('CHARACTER_METADATA has at least 100 entries', () => {
    expect(CHARACTER_METADATA.length).toBeGreaterThanOrEqual(100);
  });

  it('no duplicate normalized keys in CHARACTER_METADATA', () => {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];

    for (const entry of CHARACTER_METADATA) {
      const normalized = entry.key.toLowerCase().replace(/\s+/g, '');
      if (seen.has(normalized)) {
        duplicates.push(`"${entry.key}" duplicates "${seen.get(normalized)}"`);
      } else {
        seen.set(normalized, entry.key);
      }
    }

    if (duplicates.length > 0) {
      throw new Error(
        `Found duplicate normalized keys in CHARACTER_METADATA:\n` +
          duplicates.map((d) => `  - ${d}`).join('\n') +
          `\n\nRemove duplicates — keep one canonical key per character`
      );
    }
  });

  it('at least 100 characters have avatarId mappings (catches accidental truncation of KEY_TO_ID)', () => {
    let resolvedCount = 0;
    for (const entry of CHARACTER_METADATA) {
      if (getAvatarIdFromKey(entry.key) !== undefined) {
        resolvedCount++;
      }
    }
    expect(resolvedCount).toBeGreaterThanOrEqual(100);
  });

  it('at least 80 characters have portrait icon mappings (catches accidental truncation of ICON_NAMES)', () => {
    let withPortrait = 0;
    for (const entry of CHARACTER_METADATA) {
      const avatarId = getAvatarIdFromKey(entry.key);
      if (avatarId && getCharacterPortraitUrl(avatarId)) {
        withPortrait++;
      }
    }
    expect(withPortrait).toBeGreaterThanOrEqual(80);
  });
});

describe('getDisplayName', () => {
  it('converts PascalCase compound names to spaces', () => {
    expect(getDisplayName('KamisatoAyaka')).toBe('Kamisato Ayaka');
    expect(getDisplayName('KaedeharaKazuha')).toBe('Kaedehara Kazuha');
    expect(getDisplayName('SangonomiyaKokomi')).toBe('Sangonomiya Kokomi');
    expect(getDisplayName('ShikanoinHeizou')).toBe('Shikanoin Heizou');
  });

  it('handles "HuTao" correctly', () => {
    expect(getDisplayName('HuTao')).toBe('Hu Tao');
  });

  it('preserves already-spaced names', () => {
    expect(getDisplayName('Hu Tao')).toBe('Hu Tao');
    expect(getDisplayName('Kamisato Ayaka')).toBe('Kamisato Ayaka');
    expect(getDisplayName('Yumemizuki Mizuki')).toBe('Yumemizuki Mizuki');
  });

  it('handles single-word names unchanged', () => {
    expect(getDisplayName('Furina')).toBe('Furina');
    expect(getDisplayName('Bennett')).toBe('Bennett');
    expect(getDisplayName('Xiao')).toBe('Xiao');
    expect(getDisplayName('Itto')).toBe('Itto');
  });

  it('handles special character names from metadata lookup', () => {
    // These have known display names in CHARACTER_METADATA
    expect(getDisplayName('YaeMiko')).toBe('Yae Miko');
    expect(getDisplayName('RaidenShogun')).toBe('Raiden Shogun');
    expect(getDisplayName('AratakiItto')).toBe('Arataki Itto');
  });

  it('returns key unchanged for empty or single-char input', () => {
    expect(getDisplayName('')).toBe('');
  });
});

import { describe, expect, it } from 'vitest';
import { ALL_CHARACTERS } from '@/lib/constants/characterList';
import { isKnownCharacterKey, normalizeCharacterKey, toPascalCharacterKey } from './characterKeys';

describe('normalizeCharacterKey', () => {
  it('every list key is canonical GOOD form and is a fixed point', () => {
    for (const character of ALL_CHARACTERS) {
      expect(normalizeCharacterKey(character.key)).toBe(character.key);
      expect(toPascalCharacterKey(character.name)).toBe(character.key);
    }
  });

  it('maps display names (Enka), legacy short keys, and casing variants to the canonical key', () => {
    expect(normalizeCharacterKey('Kamisato Ayaka')).toBe('KamisatoAyaka');
    expect(normalizeCharacterKey('Ayaka')).toBe('KamisatoAyaka');
    expect(normalizeCharacterKey('kamisatoayaka')).toBe('KamisatoAyaka');
    expect(normalizeCharacterKey('Hu Tao')).toBe('HuTao');
    expect(normalizeCharacterKey('Arataki Itto')).toBe('AratakiItto');
    expect(normalizeCharacterKey('Itto')).toBe('AratakiItto');
    expect(normalizeCharacterKey('Raiden Shogun')).toBe('RaidenShogun');
    expect(normalizeCharacterKey('Raiden')).toBe('RaidenShogun');
    expect(normalizeCharacterKey('Kazuha')).toBe('KaedeharaKazuha');
    expect(normalizeCharacterKey('Kokomi')).toBe('SangonomiyaKokomi');
    expect(normalizeCharacterKey('Heizou')).toBe('ShikanoinHeizou');
    expect(normalizeCharacterKey('Kujou Sara')).toBe('KujouSara');
    expect(normalizeCharacterKey('Kuki Shinobu')).toBe('KukiShinobu');
    expect(normalizeCharacterKey('Yae Miko')).toBe('YaeMiko');
    expect(normalizeCharacterKey('Childe')).toBe('Tartaglia');
    expect(normalizeCharacterKey('Traveler (Dendro)')).toBe('TravelerDendro');
    expect(normalizeCharacterKey('Traveler')).toBe('TravelerAnemo');
  });

  it('leaves placeholders alone and PascalCases unknown names', () => {
    expect(normalizeCharacterKey('Unknown_10000130')).toBe('Unknown_10000130');
    expect(normalizeCharacterKey('Brand New Person')).toBe('BrandNewPerson');
    expect(normalizeCharacterKey('')).toBe('');
    expect(isKnownCharacterKey('Brand New Person')).toBe(false);
    expect(isKnownCharacterKey('hu tao')).toBe(true);
  });

  it('no two list entries collapse to the same identity', () => {
    const seen = new Map<string, string>();
    for (const character of ALL_CHARACTERS) {
      const id = character.key.toLowerCase();
      expect(seen.get(id), `${character.key} collides with ${seen.get(id)}`).toBeUndefined();
      seen.set(id, character.key);
    }
  });
});

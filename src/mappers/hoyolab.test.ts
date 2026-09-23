import { describe, it, expect, vi } from 'vitest';
import {
  deriveAscensionFromLevel,
  deriveServerFromUid,
  fromHoyolab,
  normalizeHoyolabCookie,
  parseHoyolabStatValue,
  resolveStatKey,
  validateHoyolabCookie,
  type HoyolabFetchResult,
} from './hoyolab';

describe('HoYoLAB Mapper', () => {
  describe('deriveServerFromUid', () => {
    it('maps overseas UIDs by leading digit', () => {
      expect(deriveServerFromUid('601234567')).toBe('os_usa');
      expect(deriveServerFromUid('701234567')).toBe('os_euro');
      expect(deriveServerFromUid('801234567')).toBe('os_asia');
      expect(deriveServerFromUid('901234567')).toBe('os_cht');
    });

    it('maps 10-digit Asia UIDs starting with 18', () => {
      expect(deriveServerFromUid('1801234567')).toBe('os_asia');
    });

    it('marks Chinese UIDs as cn', () => {
      expect(deriveServerFromUid('101234567')).toBe('cn');
      expect(deriveServerFromUid('501234567')).toBe('cn');
    });

    it('rejects invalid UIDs', () => {
      expect(deriveServerFromUid('')).toBeNull();
      expect(deriveServerFromUid('12345')).toBeNull();
      expect(deriveServerFromUid('abcdefghi')).toBeNull();
      expect(deriveServerFromUid('401234567')).toBeNull();
    });
  });

  describe('cookie handling', () => {
    it('accepts v2 cookie pairs', () => {
      expect(validateHoyolabCookie('ltuid_v2=12345678; ltoken_v2=v2_abc')).toBeNull();
    });

    it('accepts legacy cookie pairs', () => {
      expect(validateHoyolabCookie('ltuid=12345678; ltoken=abc')).toBeNull();
    });

    it('accepts account_id + token pairs', () => {
      expect(validateHoyolabCookie('account_id_v2=12345678; ltoken_v2=v2_abc')).toBeNull();
    });

    it('rejects cookies missing the token', () => {
      expect(validateHoyolabCookie('ltuid_v2=12345678')).not.toBeNull();
    });

    it('rejects cookies missing the account id', () => {
      expect(validateHoyolabCookie('ltoken_v2=v2_abc')).not.toBeNull();
    });

    it('rejects empty input', () => {
      expect(validateHoyolabCookie('')).not.toBeNull();
    });

    it('normalizes newline-separated cookie pastes', () => {
      expect(normalizeHoyolabCookie('ltuid_v2=123\nltoken_v2=abc\n')).toBe(
        'ltuid_v2=123; ltoken_v2=abc'
      );
      expect(validateHoyolabCookie('ltuid_v2=123\nltoken_v2=abc')).toBeNull();
    });
  });

  describe('parseHoyolabStatValue', () => {
    it('parses flat values with thousands separators', () => {
      expect(parseHoyolabStatValue('4,780')).toBe(4780);
    });

    it('parses percent values', () => {
      expect(parseHoyolabStatValue('46.6%')).toBe(46.6);
    });

    it('parses plain integers', () => {
      expect(parseHoyolabStatValue('40')).toBe(40);
    });

    it('returns 0 for garbage', () => {
      expect(parseHoyolabStatValue('')).toBe(0);
      expect(parseHoyolabStatValue('n/a')).toBe(0);
    });
  });

  describe('resolveStatKey', () => {
    it('resolves via the fallback id table', () => {
      expect(resolveStatKey({ property_type: 20, value: '3.1%' })).toBe('critRate_');
      expect(resolveStatKey({ property_type: 22, value: '14.0%' })).toBe('critDMG_');
      expect(resolveStatKey({ property_type: 23, value: '16.2%' })).toBe('enerRech_');
      expect(resolveStatKey({ property_type: 28, value: '40' })).toBe('eleMas');
      expect(resolveStatKey({ property_type: 40, value: '46.6%' })).toBe('pyro_dmg_');
    });

    it('disambiguates flat vs percent HP/ATK/DEF by value formatting', () => {
      expect(resolveStatKey({ property_type: 2, value: '4,780' })).toBe('hp');
      expect(resolveStatKey({ property_type: 2, value: '46.6%' })).toBe('hp_');
      expect(resolveStatKey({ property_type: 5, value: '311' })).toBe('atk');
      expect(resolveStatKey({ property_type: 6, value: '9.3%' })).toBe('atk_');
      expect(resolveStatKey({ property_type: 9, value: '58.3%' })).toBe('def_');
    });

    it('prefers names from the response property_map over the id table', () => {
      // Deliberately conflicting id scheme: id 3 labeled ATK
      const propertyMap = {
        '3': { property_type: 3, name: 'ATK', filter_name: 'ATK%' },
      };
      expect(
        resolveStatKey({ property_type: 3, value: '9.3%' }, propertyMap)
      ).toBe('atk_');
    });

    it('resolves elemental damage bonuses by name', () => {
      const propertyMap = {
        '99': { property_type: 99, name: 'Hydro DMG Bonus' },
      };
      expect(
        resolveStatKey({ property_type: 99, value: '46.6%' }, propertyMap)
      ).toBe('hydro_dmg_');
    });

    it('returns null for unknown properties', () => {
      expect(resolveStatKey({ property_type: 9999, value: '1' })).toBeNull();
    });
  });

  describe('deriveAscensionFromLevel', () => {
    it('maps level bands to minimal ascension phases', () => {
      expect(deriveAscensionFromLevel(1)).toBe(0);
      expect(deriveAscensionFromLevel(20)).toBe(0);
      expect(deriveAscensionFromLevel(21)).toBe(1);
      expect(deriveAscensionFromLevel(45)).toBe(2);
      expect(deriveAscensionFromLevel(60)).toBe(3);
      expect(deriveAscensionFromLevel(70)).toBe(4);
      expect(deriveAscensionFromLevel(80)).toBe(5);
      expect(deriveAscensionFromLevel(90)).toBe(6);
    });
  });

  describe('fromHoyolab', () => {
    const furinaEntry = {
      id: 10000089,
      name: 'Furina',
      level: 90,
      rarity: 5,
      actived_constellation_num: 2,
      weapon: {
        id: 11513,
        name: 'Splendor of Tranquil Waters',
        level: 90,
        rarity: 5,
        affix_level: 1,
        promote_level: 6,
      },
      relics: [
        {
          pos: 1,
          rarity: 5,
          level: 20,
          name: "Golden Troupe's Reward",
          set: { id: 15031, name: 'Golden Troupe' },
          main_property: { property_type: 2, value: '4,780', times: 0 },
          sub_property_list: [
            { property_type: 20, value: '3.9%', times: 1 },
            { property_type: 22, value: '21.0%', times: 3 },
            { property_type: 6, value: '9.3%', times: 2 },
            { property_type: 28, value: '19', times: 0 },
          ],
        },
        {
          pos: 5,
          rarity: 5,
          level: 20,
          name: 'Golden Troupe Circlet',
          set: { id: 15031, name: 'Golden Troupe' },
          main_property: { property_type: 20, value: '31.1%', times: 0 },
          sub_property_list: [],
        },
      ],
      skills: [
        { skill_id: 1, skill_type: 1, level: 6, max_level: 10, name: 'Normal Attack' },
        { skill_id: 2, skill_type: 2, level: 10, max_level: 10, name: 'Skill' },
        { skill_id: 3, skill_type: 3, level: 10, max_level: 10, name: 'Burst' },
        { skill_id: 4, skill_type: 2, level: 1, max_level: 1, name: 'Passive' },
      ],
      constellations: [
        { is_actived: true },
        { is_actived: true },
        { is_actived: false },
      ],
    };

    it('converts a detail entry to an internal character', () => {
      const result: HoyolabFetchResult = { list: [furinaEntry] };
      const characters = fromHoyolab(result);

      expect(characters).toHaveLength(1);
      const furina = characters[0];
      expect(furina.key).toBe('Furina');
      expect(furina.level).toBe(90);
      expect(furina.ascension).toBe(6);
      expect(furina.constellation).toBe(2);
      expect(furina.talent).toEqual({ auto: 6, skill: 10, burst: 10 });
      expect(furina.weapon).toEqual({
        key: 'SplendorOfTranquilWaters',
        level: 90,
        ascension: 6,
        refinement: 1,
      });
      expect(furina.avatarId).toBe(10000089);
      expect(furina.priority).toBe('unbuilt');
      expect(furina.teamIds).toEqual([]);
    });

    it('converts relics into GOOD-keyed artifacts', () => {
      const characters = fromHoyolab({ list: [furinaEntry] });
      const artifacts = characters[0].artifacts;

      expect(artifacts).toHaveLength(2);
      const flower = artifacts[0];
      expect(flower.setKey).toBe('GoldenTroupe');
      expect(flower.slotKey).toBe('flower');
      expect(flower.level).toBe(20);
      expect(flower.mainStatKey).toBe('hp');
      expect(flower.substats).toEqual([
        { key: 'critRate_', value: 3.9 },
        { key: 'critDMG_', value: 21.0 },
        { key: 'atk_', value: 9.3 },
        { key: 'eleMas', value: 19 },
      ]);

      const circlet = artifacts[1];
      expect(circlet.slotKey).toBe('circlet');
      expect(circlet.mainStatKey).toBe('critRate_');
    });

    it('handles entries nested under base (newer API shape)', () => {
      const nested = {
        base: {
          id: 10000046,
          name: 'Hu Tao',
          level: 80,
          actived_constellation_num: 1,
        },
        weapon: { name: 'Staff of Homa', level: 90, affix_level: 5, promote_level: 6 },
        relics: [],
        skills: [
          { skill_type: 1, level: 10 },
          { skill_type: 2, level: 9 },
          { skill_type: 3, level: 8 },
        ],
      };
      const characters = fromHoyolab({ list: [nested] });

      expect(characters).toHaveLength(1);
      expect(characters[0].key).toBe('HuTao');
      expect(characters[0].level).toBe(80);
      expect(characters[0].ascension).toBe(5);
      expect(characters[0].weapon.key).toBe('StaffOfHoma');
      expect(characters[0].weapon.refinement).toBe(5);
      expect(characters[0].talent).toEqual({ auto: 10, skill: 9, burst: 8 });
    });

    it('converts multi-word character names to GOOD keys', () => {
      const entry = {
        id: 10000002,
        name: 'Kamisato Ayaka',
        level: 90,
        weapon: { name: 'Mistsplitter Reforged', level: 90 },
        relics: [],
        skills: [],
      };
      const characters = fromHoyolab({ list: [entry] });
      expect(characters[0].key).toBe('KamisatoAyaka');
      expect(characters[0].weapon.key).toBe('MistsplitterReforged');
    });

    it('counts constellations when actived_constellation_num is absent', () => {
      const entry = {
        id: 10000030,
        name: 'Zhongli',
        level: 90,
        constellations: [
          { is_actived: true },
          { is_actived: true },
          { is_actived: false },
        ],
        relics: [],
        skills: [],
      };
      const characters = fromHoyolab({ list: [entry] });
      expect(characters[0].constellation).toBe(2);
    });

    it('falls back to leveled-skill ordering when skill_type is missing', () => {
      const entry = {
        id: 10000037,
        name: 'Ganyu',
        level: 90,
        relics: [],
        skills: [
          { level: 8, max_level: 10 },
          { level: 9, max_level: 10 },
          { level: 10, max_level: 10 },
          { level: 1, max_level: 1 },
        ],
      };
      const characters = fromHoyolab({ list: [entry] });
      expect(characters[0].talent).toEqual({ auto: 8, skill: 9, burst: 10 });
    });

    it('skips entries without names and keeps the rest', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result: HoyolabFetchResult = {
        list: [{ level: 90 }, furinaEntry],
      };
      const characters = fromHoyolab(result);
      expect(characters).toHaveLength(1);
      expect(characters[0].key).toBe('Furina');
      expect(warn).toHaveBeenCalledWith('Skipping HoYoLAB character without a name', { level: 90 });
      warn.mockRestore();
    });

    it('drops artifacts with unknown slots but keeps the character', () => {
      const entry = {
        ...furinaEntry,
        relics: [
          { ...furinaEntry.relics[0], pos: 99 },
          furinaEntry.relics[1],
        ],
      };
      const characters = fromHoyolab({ list: [entry] });
      expect(characters[0].artifacts).toHaveLength(1);
    });

    it('keys the Traveler by element to match GOOD', () => {
      const characters = fromHoyolab({
        list: [
          { id: 10000007, name: 'Traveler', element: 'Dendro', level: 90 },
          { id: 10000005, name: 'Traveler', element: 'Anemo', level: 80 },
        ],
      });

      expect(characters.map((c) => c.key)).toEqual(['TravelerDendro', 'TravelerAnemo']);
    });

    it('returns an empty array for an empty response', () => {
      expect(fromHoyolab({ list: [] })).toEqual([]);
    });
  });
});

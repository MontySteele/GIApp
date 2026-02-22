import { describe, it, expect } from 'vitest';
import { getStaticCharacterMaterials, hasStaticMaterialData } from './characterMaterialMap';

describe('characterMaterialMap', () => {
  describe('getStaticCharacterMaterials', () => {
    it('returns material data for known characters', () => {
      const data = getStaticCharacterMaterials('Furina');
      expect(data).not.toBeNull();
      expect(data!.element).toBe('Hydro');
      expect(data!.ascensionMaterials.gem.baseName).toBe('Varunada Lazurite');
      expect(data!.ascensionMaterials.boss.name).toBe('Water Orb of the Font of All Waters');
      expect(data!.ascensionMaterials.localSpecialty.name).toBe('Lakelight Lily');
      expect(data!.talentMaterials.books.series).toBe('Justice');
      expect(data!.talentMaterials.weekly.name).toBe('Lightless Silk String');
    });

    it('returns material data for characters with space keys', () => {
      const data = getStaticCharacterMaterials('Hu Tao');
      expect(data).not.toBeNull();
      expect(data!.element).toBe('Pyro');
      expect(data!.ascensionMaterials.boss.name).toBe('Juvenile Jade');
    });

    it('returns material data for PascalCase keys', () => {
      const data = getStaticCharacterMaterials('KaedeharaKazuha');
      expect(data).not.toBeNull();
      expect(data!.element).toBe('Anemo');
    });

    it('is case-insensitive', () => {
      const data = getStaticCharacterMaterials('furina');
      expect(data).not.toBeNull();
      expect(data!.element).toBe('Hydro');
    });

    it('returns null for unknown characters', () => {
      expect(getStaticCharacterMaterials('TotallyFakeCharacter')).toBeNull();
    });

    it('includes talent book farming days', () => {
      const data = getStaticCharacterMaterials('Furina');
      expect(data!.talentMaterials.books.days.length).toBeGreaterThan(0);
    });

    it('includes common material tier names', () => {
      const data = getStaticCharacterMaterials('Furina');
      const tierNames = data!.ascensionMaterials.common.tierNames;
      expect(tierNames.gray).toBe('Whopperflower Nectar');
      expect(tierNames.green).toBe('Shimmering Nectar');
      expect(tierNames.blue).toBe('Energy Nectar');
    });

    it('has apiVersion set to "static"', () => {
      const data = getStaticCharacterMaterials('Furina');
      expect(data!.apiVersion).toBe('static');
    });
  });

  describe('hasStaticMaterialData', () => {
    it('returns true for known characters', () => {
      expect(hasStaticMaterialData('Furina')).toBe(true);
      expect(hasStaticMaterialData('Bennett')).toBe(true);
      expect(hasStaticMaterialData('RaidenShogun')).toBe(true);
    });

    it('returns false for unknown characters', () => {
      expect(hasStaticMaterialData('UnknownChar')).toBe(false);
    });
  });

  describe('coverage', () => {
    const knownCharacters = [
      'Furina', 'Neuvillette', 'KaedeharaKazuha', 'Nahida', 'RaidenShogun',
      'Zhongli', 'Hu Tao', 'Ganyu', 'Xiao', 'Venti', 'Yelan',
      'Ayaka', 'Ayato', 'Tighnari', 'Alhaitham', 'Nilou', 'Wanderer',
      'Lyney', 'Lynette', 'Freminet', 'Wriothesley', 'Navia',
      'Chiori', 'Clorinde', 'Sigewinne', 'Emilie',
      'Kinich', 'Mualani', 'Xilonen', 'Citlali', 'Mavuika',
      'Arlecchino', 'Xianyun', 'Bennett', 'Xiangling', 'Xingqiu',
      'Fischl', 'Sucrose', 'Diona', 'Mona', 'Jean', 'Diluc',
      'Keqing', 'Qiqi', 'Tartaglia', 'Eula', 'Yoimiya', 'Kokomi',
      'Shenhe', 'YaeMiko', 'Dehya', 'Baizhu', 'Chasca',
    ];

    it.each(knownCharacters)('has material data for %s', (charKey) => {
      const data = getStaticCharacterMaterials(charKey);
      expect(data, `Missing static data for ${charKey}`).not.toBeNull();
      expect(data!.ascensionMaterials.boss.name).toBeTruthy();
      expect(data!.ascensionMaterials.localSpecialty.name).toBeTruthy();
      expect(data!.talentMaterials.books.series).toBeTruthy();
      expect(data!.talentMaterials.weekly.name).toBeTruthy();
    });
  });
});

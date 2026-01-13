/**
 * Tests for gcsim Config Parser
 */

import { describe, it, expect } from 'vitest';
import { parseGcsimConfig, parsedBuildToTemplate } from './gcsimParser';

describe('gcsimParser', () => {
  describe('parseGcsimConfig', () => {
    it('parses a basic character definition', () => {
      const config = 'raiden char lvl=90/90 cons=0 talent=9,9,10;';
      const result = parseGcsimConfig(config);

      expect(result.characters).toHaveLength(1);
      expect(result.characters[0].gcsimKey).toBe('raiden');
      expect(result.characters[0].level).toBe(90);
      expect(result.characters[0].maxLevel).toBe(90);
      expect(result.characters[0].constellation).toBe(0);
      expect(result.characters[0].talents).toEqual([9, 9, 10]);
    });

    it('parses character with weapon', () => {
      const config = `
raiden char lvl=90/90 cons=2 talent=9,9,10;
raiden add weapon="engulfinglightning" refine=1 lvl=90/90;
`;
      const result = parseGcsimConfig(config);

      expect(result.characters).toHaveLength(1);
      expect(result.characters[0].weapon).toBeDefined();
      expect(result.characters[0].weapon?.gcsimKey).toBe('engulfinglightning');
      expect(result.characters[0].weapon?.refinement).toBe(1);
      expect(result.characters[0].weapon?.level).toBe(90);
    });

    it('parses character with artifact sets', () => {
      const config = `
raiden char lvl=90/90 cons=0 talent=9,9,10;
raiden add set="emblemofseveredfate" count=4;
`;
      const result = parseGcsimConfig(config);

      expect(result.characters).toHaveLength(1);
      expect(result.characters[0].artifactSets).toHaveLength(1);
      expect(result.characters[0].artifactSets[0].gcsimKey).toBe('emblemofseveredfate');
      expect(result.characters[0].artifactSets[0].count).toBe(4);
    });

    it('parses character with 2pc + 2pc artifact sets', () => {
      const config = `
bennett char lvl=90/90 cons=6 talent=1,9,10;
bennett add set="noblesseoblige" count=4;
`;
      const result = parseGcsimConfig(config);

      expect(result.characters).toHaveLength(1);
      expect(result.characters[0].artifactSets).toHaveLength(1);
    });

    it('parses character with stats', () => {
      const config = `
raiden char lvl=90/90 cons=0 talent=9,9,10;
raiden add stats hp=4780 atk=311 er=0.518 electro%=0.466 cr=0.311;
`;
      const result = parseGcsimConfig(config);

      expect(result.characters).toHaveLength(1);
      expect(result.characters[0].substats).toBeDefined();
      expect(result.characters[0].substats?.hp).toBe(4780);
      expect(result.characters[0].substats?.atk).toBe(311);
      expect(result.characters[0].substats?.enerRech_).toBe(0.518);
    });

    it('parses multiple characters', () => {
      const config = `
raiden char lvl=90/90 cons=0 talent=9,9,10;
raiden add weapon="engulfinglightning" refine=1 lvl=90/90;
xingqiu char lvl=90/90 cons=6 talent=1,9,9;
xingqiu add weapon="sacrificialsword" refine=5 lvl=90/90;
xingqiu add set="emblemofseveredfate" count=4;
`;
      const result = parseGcsimConfig(config);

      expect(result.characters).toHaveLength(2);
      expect(result.characters.map((c) => c.gcsimKey)).toContain('raiden');
      expect(result.characters.map((c) => c.gcsimKey)).toContain('xingqiu');
    });

    it('ignores comments and empty lines', () => {
      const config = `
# This is a comment
// This is also a comment

raiden char lvl=90/90 cons=0 talent=9,9,10;

# Add weapon
raiden add weapon="engulfinglightning" refine=1 lvl=90/90;
`;
      const result = parseGcsimConfig(config);

      expect(result.characters).toHaveLength(1);
    });

    it('handles incomplete level format', () => {
      const config = 'raiden char lvl=80/90 cons=0 talent=9,9,10;';
      const result = parseGcsimConfig(config);

      expect(result.characters[0].level).toBe(80);
      expect(result.characters[0].maxLevel).toBe(90);
    });

    it('handles missing parameters gracefully', () => {
      const config = 'raiden char lvl=90/90;';
      const result = parseGcsimConfig(config);

      expect(result.characters).toHaveLength(1);
      expect(result.characters[0].level).toBe(90);
      // Talents should be undefined or default
    });

    it('infers main stats from stat values', () => {
      const config = `
raiden char lvl=90/90 cons=0 talent=9,9,10;
raiden add stats hp=4780 atk=311 er=0.518 electro%=0.466 cr=0.311;
`;
      const result = parseGcsimConfig(config);

      expect(result.characters[0].mainStats?.sands).toBe('enerRech_');
      expect(result.characters[0].mainStats?.goblet).toBe('electro_dmg_');
      expect(result.characters[0].mainStats?.circlet).toBe('critRate_');
    });

    it('returns raw config in result', () => {
      const config = 'raiden char lvl=90/90 cons=0 talent=9,9,10;';
      const result = parseGcsimConfig(config);

      expect(result.rawConfig).toBe(config);
    });

    it('returns empty array for empty config', () => {
      const result = parseGcsimConfig('');

      expect(result.characters).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('parsedBuildToTemplate', () => {
    it('converts parsed build to template format', () => {
      const parsedBuild = {
        gcsimKey: 'raiden',
        characterKey: 'RaidenShogun',
        level: 90,
        maxLevel: 90,
        constellation: 0,
        talents: [9, 9, 10] as [number, number, number],
        weapon: {
          gcsimKey: 'engulfinglightning',
          key: 'EngulfingLightning',
          refinement: 1,
          level: 90,
        },
        artifactSets: [
          { gcsimKey: 'emblemofseveredfate', key: 'EmblemOfSeveredFate', count: 4 },
        ],
        mainStats: {
          sands: 'enerRech_',
          goblet: 'electro_dmg_',
          circlet: 'critRate_',
        },
        substats: {
          critRate_: 0.1,
          critDMG_: 0.2,
          atk_: 0.05,
          enerRech_: 0.1,
        },
      };

      const template = parsedBuildToTemplate(parsedBuild);

      expect(template.characterKey).toBe('RaidenShogun');
      expect(template.role).toBe('dps');
      expect(template.weapons.primary).toEqual(['EngulfingLightning']);
      expect(template.artifacts.sets).toEqual(['EmblemOfSeveredFate']);
      expect(template.artifacts.mainStats.sands).toEqual(['enerRech_']);
      expect(template.artifacts.mainStats.goblet).toEqual(['electro_dmg_']);
      expect(template.artifacts.mainStats.circlet).toEqual(['critRate_']);
      expect(template.artifacts.substats).toHaveLength(4);
    });

    it('infers support role from Noblesse artifacts', () => {
      const parsedBuild = {
        gcsimKey: 'bennett',
        characterKey: 'Bennett',
        level: 90,
        maxLevel: 90,
        constellation: 6,
        talents: [1, 9, 10] as [number, number, number],
        artifactSets: [
          { gcsimKey: 'noblesseoblige', key: 'NoblesseOblige', count: 4 },
        ],
      };

      const template = parsedBuildToTemplate(parsedBuild);

      expect(template.role).toBe('support');
    });

    it('handles missing weapon', () => {
      const parsedBuild = {
        gcsimKey: 'raiden',
        characterKey: 'RaidenShogun',
        level: 90,
        maxLevel: 90,
        constellation: 0,
        talents: [9, 9, 10] as [number, number, number],
        artifactSets: [],
      };

      const template = parsedBuildToTemplate(parsedBuild);

      expect(template.weapons.primary).toEqual([]);
      expect(template.weapons.alternatives).toEqual([]);
    });

    it('handles missing main stats', () => {
      const parsedBuild = {
        gcsimKey: 'raiden',
        characterKey: 'RaidenShogun',
        level: 90,
        maxLevel: 90,
        constellation: 0,
        talents: [9, 9, 10] as [number, number, number],
        artifactSets: [],
      };

      const template = parsedBuildToTemplate(parsedBuild);

      expect(template.artifacts.mainStats.sands).toEqual([]);
      expect(template.artifacts.mainStats.goblet).toEqual([]);
      expect(template.artifacts.mainStats.circlet).toEqual([]);
    });
  });
});

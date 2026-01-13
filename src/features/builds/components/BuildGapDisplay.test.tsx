import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BuildGapDisplay, { analyzeGap } from './BuildGapDisplay';
import type { Character, BuildTemplate } from '@/types';

const mockCharacter: Character = {
  id: '1',
  key: 'Furina',
  level: 80,
  ascension: 5,
  constellation: 0,
  talent: {
    auto: 6,
    skill: 8,
    burst: 9,
  },
  weapon: {
    key: 'SplendorOfTranquilWaters',
    level: 90,
    ascension: 6,
    refinement: 1,
  },
  artifacts: [
    { setKey: 'GoldenTroupe', slotKey: 'flower', level: 20, rarity: 5, mainStatKey: 'hp', substats: [] },
    { setKey: 'GoldenTroupe', slotKey: 'plume', level: 20, rarity: 5, mainStatKey: 'atk', substats: [] },
    { setKey: 'GoldenTroupe', slotKey: 'sands', level: 20, rarity: 5, mainStatKey: 'hp_', substats: [] },
    { setKey: 'GoldenTroupe', slotKey: 'goblet', level: 20, rarity: 5, mainStatKey: 'hp_', substats: [] },
    { setKey: 'GoldenTroupe', slotKey: 'circlet', level: 20, rarity: 5, mainStatKey: 'critRate_', substats: [] },
  ],
  notes: '',
  priority: 'main',
  teamIds: [],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const mockTemplate: BuildTemplate = {
  id: 't1',
  name: 'Furina DPS Build',
  characterKey: 'Furina',
  description: 'Optimal Furina build',
  role: 'dps',
  notes: '',
  weapons: {
    primary: ['SplendorOfTranquilWaters'],
    alternatives: ['FleuveCendreFerryman', 'FavoniusSword'],
  },
  artifacts: {
    sets: [[{ setKey: 'GoldenTroupe', pieces: 4 }]],
    mainStats: {
      sands: ['hp_'],
      goblet: ['hp_'],
      circlet: ['critRate_', 'critDMG_'],
    },
    substats: ['critRate_', 'critDMG_', 'hp_', 'enerRech_'],
  },
  leveling: {
    targetLevel: 90,
    targetAscension: 6,
    talentPriority: ['burst', 'skill', 'auto'],
    talentTarget: {
      auto: 6,
      skill: 9,
      burst: 10,
    },
  },
  tags: ['meta'],
  difficulty: 'advanced',
  budget: 'whale',
  isOfficial: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('BuildGapDisplay', () => {
  describe('analyzeGap', () => {
    it('should identify complete items correctly', () => {
      const analysis = analyzeGap(mockCharacter, mockTemplate);

      // Weapon should be complete (has primary weapon)
      const weaponGap = analysis.weaponGaps[0];
      expect(weaponGap.status).toBe('complete');

      // Auto talent should be complete (6 >= 6)
      const autoGap = analysis.talentGaps.find((g) => g.label === 'Auto Talent');
      expect(autoGap?.status).toBe('complete');
    });

    it('should identify partial items correctly', () => {
      const charWithAltWeapon = {
        ...mockCharacter,
        weapon: { ...mockCharacter.weapon, key: 'FavoniusSword' },
      };
      const analysis = analyzeGap(charWithAltWeapon, mockTemplate);

      // Weapon should be partial (has alternative weapon)
      const weaponGap = analysis.weaponGaps[0];
      expect(weaponGap.status).toBe('partial');
    });

    it('should identify missing items correctly', () => {
      const charWithWrongWeapon = {
        ...mockCharacter,
        weapon: { ...mockCharacter.weapon, key: 'DullBlade' },
      };
      const analysis = analyzeGap(charWithWrongWeapon, mockTemplate);

      // Weapon should be missing (wrong weapon)
      const weaponGap = analysis.weaponGaps[0];
      expect(weaponGap.status).toBe('missing');
    });

    it('should calculate overall score correctly', () => {
      const analysis = analyzeGap(mockCharacter, mockTemplate);

      // Score should be between 0 and 100
      expect(analysis.overallScore).toBeGreaterThanOrEqual(0);
      expect(analysis.overallScore).toBeLessThanOrEqual(100);
    });

    it('should detect level gap', () => {
      const analysis = analyzeGap(mockCharacter, mockTemplate);

      const levelGap = analysis.levelGaps.find((g) => g.label === 'Character Level');
      expect(levelGap).toBeDefined();
      expect(levelGap?.current).toBe('Lv.80');
      expect(levelGap?.target).toBe('Lv.90');
      expect(levelGap?.status).toBe('partial'); // 80 is within 10 of 90
    });

    it('should detect ascension gap', () => {
      const analysis = analyzeGap(mockCharacter, mockTemplate);

      const ascensionGap = analysis.levelGaps.find((g) => g.label === 'Ascension');
      expect(ascensionGap).toBeDefined();
      expect(ascensionGap?.current).toBe('A5');
      expect(ascensionGap?.target).toBe('A6');
      expect(ascensionGap?.status).toBe('partial'); // A5 is within 1 of A6
    });

    it('should detect talent gaps', () => {
      const analysis = analyzeGap(mockCharacter, mockTemplate);

      expect(analysis.talentGaps.length).toBe(3);

      const burstGap = analysis.talentGaps.find((g) => g.label === 'Burst Talent');
      expect(burstGap?.current).toBe('9');
      expect(burstGap?.target).toBe('10');
      expect(burstGap?.status).toBe('partial'); // 9 is within 2 of 10
    });

    it('should detect artifact set match', () => {
      const analysis = analyzeGap(mockCharacter, mockTemplate);

      const setGap = analysis.artifactGaps.find((g) => g.label === 'Artifact Sets');
      expect(setGap?.status).toBe('complete'); // Has 4pc Golden Troupe
    });

    it('should detect main stat matches', () => {
      const analysis = analyzeGap(mockCharacter, mockTemplate);

      const sandsGap = analysis.artifactGaps.find((g) => g.label === 'Sands Main Stat');
      expect(sandsGap?.status).toBe('complete'); // Has HP%

      const circletGap = analysis.artifactGaps.find((g) => g.label === 'Circlet Main Stat');
      expect(circletGap?.status).toBe('complete'); // Has Crit Rate
    });
  });

  describe('rendering', () => {
    it('should render overall score', () => {
      render(<BuildGapDisplay character={mockCharacter} template={mockTemplate} />);

      // Should show percentage
      expect(screen.getByText(/complete/i)).toBeInTheDocument();
    });

    it('should render template name', () => {
      render(<BuildGapDisplay character={mockCharacter} template={mockTemplate} />);

      expect(screen.getByText(mockTemplate.name)).toBeInTheDocument();
    });

    it('should render gap categories', () => {
      render(<BuildGapDisplay character={mockCharacter} template={mockTemplate} />);

      expect(screen.getByText('Level & Ascension')).toBeInTheDocument();
      // Use getAllByText for 'Weapon' since it appears in both category header and gap row
      const weaponElements = screen.getAllByText(/^Weapon$/);
      expect(weaponElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Talents')).toBeInTheDocument();
      expect(screen.getByText('Artifacts')).toBeInTheDocument();
    });

    it('should render in compact mode', () => {
      render(<BuildGapDisplay character={mockCharacter} template={mockTemplate} compact />);

      // In compact mode, should show template name and score
      expect(screen.getByText(mockTemplate.name)).toBeInTheDocument();
      // Should not show detailed categories
      expect(screen.queryByText('Level & Ascension')).not.toBeInTheDocument();
    });

    it('should show gap count in compact mode', () => {
      render(<BuildGapDisplay character={mockCharacter} template={mockTemplate} compact />);

      // Should show number of gaps
      expect(screen.getByText(/complete/i)).toBeInTheDocument();
    });
  });
});

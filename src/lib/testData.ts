import type { Character } from '@/types';

// Helper to create test characters for development
export const createSampleCharacter = (overrides?: Partial<Character>): Omit<Character, 'id' | 'createdAt' | 'updatedAt'> => ({
  key: 'Furina',
  level: 90,
  ascension: 6,
  constellation: 0,
  talent: {
    auto: 9,
    skill: 10,
    burst: 10,
  },
  weapon: {
    key: 'Splendor of Tranquil Waters',
    level: 90,
    ascension: 6,
    refinement: 1,
  },
  artifacts: [
    {
      setKey: 'Golden Troupe',
      slotKey: 'flower',
      level: 20,
      rarity: 5,
      mainStatKey: 'hp',
      substats: [
        { key: 'critRate', value: 3.9 },
        { key: 'critDMG', value: 14.8 },
        { key: 'hp%', value: 5.8 },
        { key: 'er', value: 5.2 },
      ],
    },
    {
      setKey: 'Golden Troupe',
      slotKey: 'plume',
      level: 20,
      rarity: 5,
      mainStatKey: 'atk',
      substats: [
        { key: 'critRate', value: 7.8 },
        { key: 'critDMG', value: 21.0 },
        { key: 'hp%', value: 4.7 },
        { key: 'def%', value: 6.6 },
      ],
    },
    {
      setKey: 'Golden Troupe',
      slotKey: 'sands',
      level: 20,
      rarity: 5,
      mainStatKey: 'hp%',
      substats: [
        { key: 'critRate', value: 10.5 },
        { key: 'critDMG', value: 13.2 },
        { key: 'atk%', value: 4.7 },
        { key: 'er', value: 11.0 },
      ],
    },
    {
      setKey: 'Golden Troupe',
      slotKey: 'goblet',
      level: 20,
      rarity: 5,
      mainStatKey: 'hp%',
      substats: [
        { key: 'critRate', value: 6.2 },
        { key: 'critDMG', value: 20.2 },
        { key: 'atk%', value: 9.3 },
        { key: 'em', value: 21 },
      ],
    },
    {
      setKey: 'Golden Troupe',
      slotKey: 'circlet',
      level: 20,
      rarity: 5,
      mainStatKey: 'critRate',
      substats: [
        { key: 'critDMG', value: 28.0 },
        { key: 'hp%', value: 14.6 },
        { key: 'atk%', value: 4.1 },
        { key: 'def%', value: 5.8 },
      ],
    },
  ],
  notes: 'Main DPS for Fontaine team',
  priority: 'main',
  teamIds: [],
  ...overrides,
});

export const sampleCharacters: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>[] = [
  createSampleCharacter(),
  createSampleCharacter({
    key: 'Neuvillette',
    constellation: 1,
    talent: { auto: 10, skill: 9, burst: 9 },
    weapon: {
      key: 'Tome of the Eternal Flow',
      level: 90,
      ascension: 6,
      refinement: 1,
    },
    notes: 'Hydro DPS powerhouse',
    priority: 'main',
  }),
  createSampleCharacter({
    key: 'Kazuha',
    level: 90,
    constellation: 2,
    talent: { auto: 6, skill: 10, burst: 10 },
    weapon: {
      key: 'Freedom-Sworn',
      level: 90,
      ascension: 6,
      refinement: 1,
    },
    notes: 'VV support for all teams',
    priority: 'main',
  }),
  createSampleCharacter({
    key: 'Bennett',
    level: 80,
    ascension: 6,
    constellation: 5,
    talent: { auto: 1, skill: 8, burst: 12 },
    weapon: {
      key: 'Mistsplitter Reforged',
      level: 90,
      ascension: 6,
      refinement: 1,
    },
    notes: 'Best support in the game',
    priority: 'main',
  }),
];

import { describe, expect, it } from 'vitest';
import { fromIrminsul, type IrminsulFormat, type IrminsulWeapon } from './irminsul';

const weapon = (overrides: Partial<IrminsulWeapon> = {}): IrminsulWeapon => ({
  key: 'PrimordialJadeWingedSpear',
  level: 1,
  ascension: 0,
  refinement: 1,
  location: '',
  lock: true,
  ...overrides,
});

const exportWithWeapons = (weapons: IrminsulWeapon[]): IrminsulFormat => ({
  format: 'GOOD',
  version: 3,
  source: 'Irminsul',
  characters: [],
  artifacts: [],
  weapons,
  materials: {},
});

describe('fromIrminsul', () => {
  it('generates stable weapon ids when export order changes', () => {
    const jadeSpear = weapon();
    const gravestone = weapon({
      key: "Wolf's Gravestone",
      level: 20,
      ascension: 1,
    });
    const duplicateJadeSpear = weapon();

    const first = fromIrminsul(exportWithWeapons([
      jadeSpear,
      gravestone,
      duplicateJadeSpear,
    ])).weapons;
    const reordered = fromIrminsul(exportWithWeapons([
      gravestone,
      jadeSpear,
      duplicateJadeSpear,
    ])).weapons;

    expect(first.map((item) => item.id).sort()).toEqual(
      reordered.map((item) => item.id).sort()
    );
    expect(first.map((item) => item.id).sort()).toEqual([
      "weapon:PrimordialJadeWingedSpear:1:0:1:unequipped:locked",
      "weapon:PrimordialJadeWingedSpear:1:0:1:unequipped:locked:1",
      "weapon:Wolf's Gravestone:20:1:1:unequipped:locked",
    ]);
  });
});

/**
 * Weapon Type Constants
 *
 * Genshin Impact weapon categories.
 */

export const WEAPON_TYPES = {
  SWORD: 'sword',
  CLAYMORE: 'claymore',
  POLEARM: 'polearm',
  BOW: 'bow',
  CATALYST: 'catalyst',
} as const;

export type WeaponType = typeof WEAPON_TYPES[keyof typeof WEAPON_TYPES];

export const WEAPON_TYPE_LABELS: Record<WeaponType, string> = {
  [WEAPON_TYPES.SWORD]: 'Sword',
  [WEAPON_TYPES.CLAYMORE]: 'Claymore',
  [WEAPON_TYPES.POLEARM]: 'Polearm',
  [WEAPON_TYPES.BOW]: 'Bow',
  [WEAPON_TYPES.CATALYST]: 'Catalyst',
};

// List of all weapon types for iteration
export const ALL_WEAPON_TYPES: WeaponType[] = [
  WEAPON_TYPES.SWORD,
  WEAPON_TYPES.CLAYMORE,
  WEAPON_TYPES.POLEARM,
  WEAPON_TYPES.BOW,
  WEAPON_TYPES.CATALYST,
];

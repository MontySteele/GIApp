/**
 * Weapons Feature
 *
 * Public API for weapon inventory management
 */

// Pages
export { default as WeaponsPage } from './pages/WeaponsPage';

// Hooks
export {
  useWeapons,
  filterAndSortWeapons,
  type WeaponFilters,
  type WeaponSortKey,
  type SortDirection,
  type EnrichedWeapon,
} from './hooks/useWeapons';

// Repository
export { weaponRepo } from './repo/weaponRepo';

// Domain - Constants
export {
  WEAPON_TYPE_NAMES,
  WEAPON_DATA,
  RARITY_COLORS,
  RARITY_BG_COLORS,
  WEAPON_MAX_LEVEL_BY_ASCENSION,
  getWeaponName,
  getWeaponType,
  getWeaponRarity,
  formatWeaponKey,
  getRefinementDisplay,
  getRefinementColor,
  type WeaponType,
} from './domain/weaponConstants';

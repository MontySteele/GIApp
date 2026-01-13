/**
 * Constants Barrel Export
 *
 * Re-exports all constants from the constants directory.
 */

// Banner types
export {
  BANNER_TYPES,
  BANNER_LABELS,
  BANNER_SHORT_LABELS,
  type BannerType,
} from './bannerTypes';

// Elements
export {
  ELEMENTS,
  ELEMENT_LABELS,
  ELEMENT_COLORS,
  ELEMENT_BADGE_VARIANTS,
  type Element,
} from './elements';

// Weapon types
export {
  WEAPON_TYPES,
  WEAPON_TYPE_LABELS,
  ALL_WEAPON_TYPES,
  type WeaponType,
} from './weaponTypes';

// Storage keys
export {
  STORAGE_KEYS,
  type StorageKey,
} from './storageKeys';

// Error messages
export {
  ERROR_MESSAGES,
  type ErrorMessage,
} from './errorMessages';

// Re-export from the legacy constants.ts file
export {
  PRIMOS_PER_PULL,
  PULLS_PER_PITY,
  STARGLITTER_PER_4STAR,
  STARGLITTER_PER_5STAR,
  STARGLITTER_PER_4STAR_DUPE,
  STARGLITTER_PER_5STAR_DUPE,
  PULLS_FROM_STARGLITTER,
  MAX_LEVEL_BY_ASCENSION,
  INCOME_F2P,
  INCOME_WELKIN,
  INCOME_WELKIN_BP,
  INCOME_WITH_EVENTS,
  GACHA_RULES,
  TABS,
  APP_SCHEMA_VERSION,
  BACKUP_REMINDER_DAYS,
} from '../constants';

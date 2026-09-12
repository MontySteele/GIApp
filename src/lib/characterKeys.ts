/**
 * Character key helpers. The implementation lives in constants/characterList.ts
 * (next to the data it indexes); this module is the preferred import path.
 */
export {
  normalizeCharacterKey,
  isKnownCharacterKey,
  toPascalCharacterKey,
} from '@/lib/constants/characterList';

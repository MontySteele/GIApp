// Re-export all game data from modular files
// This maintains backwards compatibility for existing imports

// Artifact data
export {
  ARTIFACT_SET_NAMES,
  formatArtifactSetName,
  toGoodArtifactSetKey,
} from './artifactData';

// Stat and slot data
export {
  STAT_NAMES,
  SLOT_NAMES,
  formatStatName,
  toGoodStatKey,
  formatSlotName,
  formatStatValue,
} from './statData';

// Character data
export {
  getAvatarIdFromKey,
  getCharacterPortraitUrl,
  getCharacterGachaArtUrl,
  toGoodCharacterKey,
  toGoodWeaponKey,
} from './characterData';

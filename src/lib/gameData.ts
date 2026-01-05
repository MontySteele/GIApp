// Artifact Set Name Mappings
// Maps setKey IDs to readable names
export const ARTIFACT_SET_NAMES: Record<string, string> = {
  // Mondstadt
  '14001': 'Gladiator\'s Finale',
  '14002': 'Wanderer\'s Troupe',
  '15001': 'Noblesse Oblige',
  '15002': 'Bloodstained Chivalry',
  '15003': 'Maiden Beloved',
  '15005': 'Viridescent Venerer',
  '15006': 'Crimson Witch of Flames',
  '15007': 'Lavawalker',
  '15008': 'Thundering Fury',
  '15009': 'Thundersoother',
  '15010': 'Blizzard Strayer',
  '15011': 'Heart of Depth',
  '15012': 'Archaic Petra',
  '15013': 'Retracing Bolide',

  // Liyue
  '15014': 'Pale Flame',
  '15015': 'Tenacity of the Millelith',
  '15016': 'Shimenawa\'s Reminiscence',
  '15017': 'Emblem of Severed Fate',

  // Inazuma
  '15018': 'Husk of Opulent Dreams',
  '15019': 'Ocean-Hued Clam',
  '15020': 'Vermillion Hereafter',
  '15021': 'Echoes of an Offering',

  // Sumeru
  '15022': 'Deepwood Memories',
  '15023': 'Gilded Dreams',
  '15024': 'Desert Pavilion Chronicle',
  '15025': 'Flower of Paradise Lost',

  // Fontaine
  '15026': 'Nymph\'s Dream',
  '15027': 'Vourukasha\'s Glow',
  '15028': 'Marechaussee Hunter',
  '15029': 'Golden Troupe',
  '15030': 'Song of Days Past',
  '15031': 'Nighttime Whispers in the Echoing Woods',

  // Natlan (if applicable)
  '15032': 'Fragment of Harmonic Whimsy',
  '15033': 'Unfinished Reverie',
  '15034': 'Scroll of the Hero of Cinder City',
  '15035': 'Obsidian Codex',
};

// Stat Key to Display Name Mapping
// Maps FIGHT_PROP_* keys and other stat keys to readable names
export const STAT_NAMES: Record<string, string> = {
  // HP
  'FIGHT_PROP_HP': 'HP',
  'FIGHT_PROP_HP_PERCENT': 'HP%',
  'hp': 'HP',
  'hp_': 'HP%',

  // ATK
  'FIGHT_PROP_ATTACK': 'ATK',
  'FIGHT_PROP_ATTACK_PERCENT': 'ATK%',
  'atk': 'ATK',
  'atk_': 'ATK%',

  // DEF
  'FIGHT_PROP_DEFENSE': 'DEF',
  'FIGHT_PROP_DEFENSE_PERCENT': 'DEF%',
  'def': 'DEF',
  'def_': 'DEF%',

  // Elemental Mastery
  'FIGHT_PROP_ELEMENT_MASTERY': 'Elemental Mastery',
  'eleMas': 'Elemental Mastery',
  'em': 'Elemental Mastery',

  // Energy Recharge
  'FIGHT_PROP_CHARGE_EFFICIENCY': 'Energy Recharge',
  'enerRech_': 'Energy Recharge',
  'er': 'Energy Recharge',

  // Crit Rate
  'FIGHT_PROP_CRITICAL': 'CRIT Rate',
  'FIGHT_PROP_CRITICAL_HURT': 'CRIT DMG',
  'critRate_': 'CRIT Rate',
  'critDMG_': 'CRIT DMG',
  'cr': 'CRIT Rate',
  'cd': 'CRIT DMG',

  // Damage Bonuses
  'FIGHT_PROP_PHYSICAL_ADD_HURT': 'Physical DMG Bonus',
  'FIGHT_PROP_FIRE_ADD_HURT': 'Pyro DMG Bonus',
  'FIGHT_PROP_WATER_ADD_HURT': 'Hydro DMG Bonus',
  'FIGHT_PROP_GRASS_ADD_HURT': 'Dendro DMG Bonus',
  'FIGHT_PROP_ELEC_ADD_HURT': 'Electro DMG Bonus',
  'FIGHT_PROP_WIND_ADD_HURT': 'Anemo DMG Bonus',
  'FIGHT_PROP_ICE_ADD_HURT': 'Cryo DMG Bonus',
  'FIGHT_PROP_ROCK_ADD_HURT': 'Geo DMG Bonus',

  'physical_dmg_': 'Physical DMG Bonus',
  'pyro_dmg_': 'Pyro DMG Bonus',
  'hydro_dmg_': 'Hydro DMG Bonus',
  'dendro_dmg_': 'Dendro DMG Bonus',
  'electro_dmg_': 'Electro DMG Bonus',
  'anemo_dmg_': 'Anemo DMG Bonus',
  'cryo_dmg_': 'Cryo DMG Bonus',
  'geo_dmg_': 'Geo DMG Bonus',

  // Healing Bonus
  'FIGHT_PROP_HEAL_ADD': 'Healing Bonus',
  'heal_': 'Healing Bonus',
};

// Slot Key to Display Name Mapping
export const SLOT_NAMES: Record<string, string> = {
  'flower': 'Flower of Life',
  'plume': 'Plume of Death',
  'sands': 'Sands of Eon',
  'goblet': 'Goblet of Eonothem',
  'circlet': 'Circlet of Logos',
};

/**
 * Formats an artifact set key to a readable name
 */
export function formatArtifactSetName(setKey: string): string {
  return ARTIFACT_SET_NAMES[setKey] || setKey;
}

/**
 * Formats a stat key to a readable name
 */
export function formatStatName(statKey: string): string {
  return STAT_NAMES[statKey] || statKey;
}

/**
 * Formats a slot key to a readable name
 */
export function formatSlotName(slotKey: string): string {
  return SLOT_NAMES[slotKey] || slotKey;
}

/**
 * Formats a stat value with appropriate precision and unit
 */
export function formatStatValue(statKey: string, value: number): string {
  const name = formatStatName(statKey);

  // Percentage stats
  if (name.includes('%') || name.includes('Bonus') || name.includes('Recharge')) {
    return `${value.toFixed(1)}%`;
  }

  // Flat stats
  return Math.round(value).toString();
}

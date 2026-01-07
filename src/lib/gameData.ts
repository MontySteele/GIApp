// Artifact Set Name Mappings
// Maps setKey IDs to readable names
// Includes both game IDs and Enka.Network text map hashes
export const ARTIFACT_SET_NAMES: Record<string, string> = {
  // Game IDs (from game files)
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

  // Natlan
  '15032': 'Fragment of Harmonic Whimsy',
  '15033': 'Unfinished Reverie',
  '15034': 'Scroll of the Hero of Cinder City',
  '15035': 'Obsidian Codex',

  // Enka.Network Text Map Hashes (from setNameTextMapHash)
  // These are the actual hash IDs used by Enka
  '2051947378': 'Gladiator\'s Finale',
  '1024188507': 'Wanderer\'s Troupe',
  '3024287978': 'Noblesse Oblige',
  '3336292330': 'Bloodstained Chivalry',
  '4145306051': 'Maiden Beloved',
  '3041123219': 'Viridescent Venerer',
  '464239252': 'Crimson Witch of Flames',
  '1074991850': 'Lavawalker',
  '2381195739': 'Thundering Fury',
  '1813191794': 'Thundersoother',
  '1978456313': 'Blizzard Strayer',
  '2550611210': 'Heart of Depth',
  '3113112362': 'Archaic Petra',
  '2365306298': 'Retracing Bolide',
  '4054530851': 'Pale Flame',
  '2883883603': 'Tenacity of the Millelith',
  '4144069251': 'Shimenawa\'s Reminiscence',
  '2512309395': 'Emblem of Severed Fate',
  '1558036915': 'Husk of Opulent Dreams',
  '1024664819': 'Ocean-Hued Clam',
  '2538235059': 'Vermillion Hereafter',
  '4020789283': 'Echoes of an Offering',
  '1937844530': 'Deepwood Memories',
  '52218259': 'Gilded Dreams',
  '572447378': 'Desert Pavilion Chronicle',
  '1087031355': 'Flower of Paradise Lost',
  '2206398859': 'Nymph\'s Dream',
  '3073024899': 'Vourukasha\'s Glow',
  '2422508786': 'Marechaussee Hunter',
  '2276480763': 'Golden Troupe',
  '1515064307': 'Song of Days Past',
  '4161025135': 'Nighttime Whispers in the Echoing Woods',
  '4233298586': 'Fragment of Harmonic Whimsy',
  '1978422363': 'Unfinished Reverie',
  '3199794867': 'Scroll of the Hero of Cinder City',
  '2309458426': 'Obsidian Codex',
  '83115355': 'Maiden Beloved',
  '156294403': 'Heart of Depth',
  '279470883': 'Nighttime Whispers in the Echoing Woods',
  '352459163': 'Unfinished Reverie',
  '862591315': 'Pale Flame',
  '933076627': 'Blizzard Strayer',
  '1249831867': 'Marechaussee Hunter',
  '1337666507': 'Tenacity of the Millelith',
  '1438974835': 'Retracing Bolide',
  '1492570003': 'Fragment of Harmonic Whimsy',
  '1524173875': 'Crimson Witch of Flames',
  '1541919827': 'Bloodstained Chivalry',
  '1562601179': 'Viridescent Venerer',
  '1632377563': 'Lavawalker',
  '1675079283': 'Deepwood Memories',
  '1751039235': 'Noblesse Oblige',
  '1756609915': 'Ocean-Hued Clam',
  '1774579403': 'Obsidian Codex',
  '1873342283': 'Thundersoother',
  '2040573235': 'Archaic Petra',
  '2538235187': 'Desert Pavilion Chronicle',
  '2546254811': 'Husk of Opulent Dreams',
  '2803305851': 'Song of Days Past',
  '2949388203': 'Scroll of the Hero of Cinder City',
  '3094139291': 'Flower of Paradise Lost',
  '3410220315': 'Golden Troupe',
  '3626268211': 'Echoes of an Offering',

  // Also support direct string names (for test data and GOOD format)
  'Gladiator\'s Finale': 'Gladiator\'s Finale',
  'Wanderer\'s Troupe': 'Wanderer\'s Troupe',
  'Noblesse Oblige': 'Noblesse Oblige',
  'Bloodstained Chivalry': 'Bloodstained Chivalry',
  'Maiden Beloved': 'Maiden Beloved',
  'Viridescent Venerer': 'Viridescent Venerer',
  'Crimson Witch of Flames': 'Crimson Witch of Flames',
  'Lavawalker': 'Lavawalker',
  'Thundering Fury': 'Thundering Fury',
  'Thundersoother': 'Thundersoother',
  'Blizzard Strayer': 'Blizzard Strayer',
  'Heart of Depth': 'Heart of Depth',
  'Archaic Petra': 'Archaic Petra',
  'Retracing Bolide': 'Retracing Bolide',
  'Pale Flame': 'Pale Flame',
  'Tenacity of the Millelith': 'Tenacity of the Millelith',
  'Shimenawa\'s Reminiscence': 'Shimenawa\'s Reminiscence',
  'Emblem of Severed Fate': 'Emblem of Severed Fate',
  'Husk of Opulent Dreams': 'Husk of Opulent Dreams',
  'Ocean-Hued Clam': 'Ocean-Hued Clam',
  'Vermillion Hereafter': 'Vermillion Hereafter',
  'Echoes of an Offering': 'Echoes of an Offering',
  'Deepwood Memories': 'Deepwood Memories',
  'Gilded Dreams': 'Gilded Dreams',
  'Desert Pavilion Chronicle': 'Desert Pavilion Chronicle',
  'Flower of Paradise Lost': 'Flower of Paradise Lost',
  'Nymph\'s Dream': 'Nymph\'s Dream',
  'Vourukasha\'s Glow': 'Vourukasha\'s Glow',
  'Marechaussee Hunter': 'Marechaussee Hunter',
  'Golden Troupe': 'Golden Troupe',
  'Song of Days Past': 'Song of Days Past',
  'Nighttime Whispers in the Echoing Woods': 'Nighttime Whispers in the Echoing Woods',
  'Fragment of Harmonic Whimsy': 'Fragment of Harmonic Whimsy',
  'Unfinished Reverie': 'Unfinished Reverie',
  'Scroll of the Hero of Cinder City': 'Scroll of the Hero of Cinder City',
  'Obsidian Codex': 'Obsidian Codex',
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

// GOOD/GO stat key mappings
const STAT_GOOD_KEYS: Record<string, string> = {
  // HP
  'FIGHT_PROP_HP': 'hp',
  'FIGHT_PROP_HP_PERCENT': 'hp_',
  'hp': 'hp',
  'hp_': 'hp_',

  // ATK
  'FIGHT_PROP_ATTACK': 'atk',
  'FIGHT_PROP_ATTACK_PERCENT': 'atk_',
  'atk': 'atk',
  'atk_': 'atk_',

  // DEF
  'FIGHT_PROP_DEFENSE': 'def',
  'FIGHT_PROP_DEFENSE_PERCENT': 'def_',
  'def': 'def',
  'def_': 'def_',

  // Elemental Mastery
  'FIGHT_PROP_ELEMENT_MASTERY': 'eleMas',
  'eleMas': 'eleMas',
  'em': 'eleMas',

  // Energy Recharge
  'FIGHT_PROP_CHARGE_EFFICIENCY': 'enerRech_',
  'enerRech_': 'enerRech_',
  'er': 'enerRech_',

  // Crit
  'FIGHT_PROP_CRITICAL': 'critRate_',
  'FIGHT_PROP_CRITICAL_HURT': 'critDMG_',
  'critRate_': 'critRate_',
  'critDMG_': 'critDMG_',
  'critRate': 'critRate_',
  'critDMG': 'critDMG_',
  'cr': 'critRate_',
  'cd': 'critDMG_',

  // Damage Bonuses
  'FIGHT_PROP_PHYSICAL_ADD_HURT': 'physical_dmg_',
  'FIGHT_PROP_FIRE_ADD_HURT': 'pyro_dmg_',
  'FIGHT_PROP_WATER_ADD_HURT': 'hydro_dmg_',
  'FIGHT_PROP_GRASS_ADD_HURT': 'dendro_dmg_',
  'FIGHT_PROP_ELEC_ADD_HURT': 'electro_dmg_',
  'FIGHT_PROP_WIND_ADD_HURT': 'anemo_dmg_',
  'FIGHT_PROP_ICE_ADD_HURT': 'cryo_dmg_',
  'FIGHT_PROP_ROCK_ADD_HURT': 'geo_dmg_',

  'physical_dmg_': 'physical_dmg_',
  'pyro_dmg_': 'pyro_dmg_',
  'hydro_dmg_': 'hydro_dmg_',
  'dendro_dmg_': 'dendro_dmg_',
  'electro_dmg_': 'electro_dmg_',
  'anemo_dmg_': 'anemo_dmg_',
  'cryo_dmg_': 'cryo_dmg_',
  'geo_dmg_': 'geo_dmg_',

  // Healing Bonus
  'FIGHT_PROP_HEAL_ADD': 'heal_',
  'heal_': 'heal_',
};

const toPascalCase = (value: string): string =>
  value
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

/**
 * Formats an artifact set key to a readable name
 */
export function formatArtifactSetName(setKey: string): string {
  return ARTIFACT_SET_NAMES[setKey] || setKey;
}

/**
 * Formats an artifact set key to a GOOD/GO-compatible key
 */
export function toGoodArtifactSetKey(setKey: string): string {
  const displayName = ARTIFACT_SET_NAMES[setKey] || setKey;
  if (!displayName) {
    return setKey;
  }

  if (/[^A-Za-z0-9]/.test(displayName)) {
    return toPascalCase(displayName);
  }

  return displayName;
}

/**
 * Formats a stat key to a readable name
 */
export function formatStatName(statKey: string): string {
  return STAT_NAMES[statKey] || statKey;
}

/**
 * Formats a stat key to a GOOD/GO-compatible key
 */
export function toGoodStatKey(statKey: string): string {
  return STAT_GOOD_KEYS[statKey] || statKey;
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

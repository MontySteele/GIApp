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

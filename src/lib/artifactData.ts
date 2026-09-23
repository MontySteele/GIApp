import { toPascalCase } from '@/lib/utils/pascalCase';

// Artifact Set Name Mappings
// Maps setKey IDs to readable names
// Includes both game IDs and Enka.Network text map hashes
export const ARTIFACT_SET_NAMES: Record<string, string> = {
  // Game IDs (from game files). Unmapped keys, including display names,
  // pass through unchanged.
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

  // Nod-Krai (6.6)
  '15045': 'Celestial Gift',
  '15046': 'Disenchantment in Deep Shadow',

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
  '147298547': 'Wanderer\'s Troupe',
  '1212345779': 'Gladiator\'s Finale',
};

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


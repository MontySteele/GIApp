/**
 * gcsim Config Parser
 *
 * Parses gcsim/wfpsim configuration text and extracts character build data.
 * This allows users to import builds from existing gcsim configs.
 *
 * gcsim config format example:
 * ```
 * raiden char lvl=90/90 cons=0 talent=9,9,10;
 * raiden add weapon="engulfinglightning" refine=1 lvl=90/90;
 * raiden add set="emblemofseveredfate" count=4;
 * raiden add stats hp=4780 atk=311 er=0.518 electro%=0.466 cr=0.311;
 * raiden add stats def=39.36 def%=0.124 hp=507.88 hp%=0.0992 ...;
 * ```
 */

import { CHARACTER_KEY_MAP, WEAPON_KEY_MAP, ARTIFACT_SET_KEY_MAP } from '@/features/teams/domain/gcsimKeyMappings';

// ============================================
// Types
// ============================================

export interface ParsedCharacterBuild {
  /** gcsim character key (lowercase) */
  gcsimKey: string;
  /** Our app's character key (PascalCase) */
  characterKey: string;
  /** Character level */
  level: number;
  /** Max level for ascension */
  maxLevel: number;
  /** Constellation level */
  constellation: number;
  /** Talent levels [auto, skill, burst] */
  talents: [number, number, number];
  /** Weapon info */
  weapon?: {
    gcsimKey: string;
    key: string;
    refinement: number;
    level: number;
  };
  /** Artifact sets with counts */
  artifactSets: Array<{
    gcsimKey: string;
    key: string;
    count: number;
  }>;
  /** Main stats by slot */
  mainStats?: {
    sands?: string;
    goblet?: string;
    circlet?: string;
  };
  /** Substat values */
  substats?: Record<string, number>;
}

export interface GcsimParseResult {
  /** Successfully parsed character builds */
  characters: ParsedCharacterBuild[];
  /** Lines that couldn't be parsed */
  errors: string[];
  /** Original config text */
  rawConfig: string;
}

// ============================================
// Reverse Key Maps (gcsim key -> our key)
// ============================================

const REVERSE_CHARACTER_MAP: Record<string, string> = {};
const REVERSE_WEAPON_MAP: Record<string, string> = {};
const REVERSE_ARTIFACT_MAP: Record<string, string> = {};

// Build reverse maps
for (const [ourKey, gcsimKey] of Object.entries(CHARACTER_KEY_MAP)) {
  // Only use the simplest key (avoid duplicates like "RaidenShogun" and "Raiden")
  if (!REVERSE_CHARACTER_MAP[gcsimKey] || ourKey.length < REVERSE_CHARACTER_MAP[gcsimKey].length) {
    REVERSE_CHARACTER_MAP[gcsimKey] = ourKey;
  }
}

for (const [ourKey, gcsimKey] of Object.entries(WEAPON_KEY_MAP)) {
  if (!REVERSE_WEAPON_MAP[gcsimKey]) {
    REVERSE_WEAPON_MAP[gcsimKey] = ourKey;
  }
}

for (const [ourKey, gcsimKey] of Object.entries(ARTIFACT_SET_KEY_MAP)) {
  if (!REVERSE_ARTIFACT_MAP[gcsimKey]) {
    REVERSE_ARTIFACT_MAP[gcsimKey] = ourKey;
  }
}

// ============================================
// Stat Key Mapping (gcsim -> our format)
// ============================================

const GCSIM_STAT_TO_OUR_STAT: Record<string, string> = {
  'hp': 'hp',
  'hp%': 'hp_',
  'atk': 'atk',
  'atk%': 'atk_',
  'def': 'def',
  'def%': 'def_',
  'em': 'eleMas',
  'er': 'enerRech_',
  'cr': 'critRate_',
  'cd': 'critDMG_',
  'heal': 'heal_',
  'pyro%': 'pyro_dmg_',
  'hydro%': 'hydro_dmg_',
  'electro%': 'electro_dmg_',
  'cryo%': 'cryo_dmg_',
  'anemo%': 'anemo_dmg_',
  'geo%': 'geo_dmg_',
  'dendro%': 'dendro_dmg_',
  'phys%': 'physical_dmg_',
};

// ============================================
// Parser Functions
// ============================================

/**
 * Parse a level string like "90/90" or "80/90"
 */
function parseLevel(levelStr: string): { level: number; maxLevel: number } {
  const match = levelStr.match(/(\d+)\/(\d+)/);
  if (match && match[1] && match[2]) {
    return {
      level: parseInt(match[1], 10),
      maxLevel: parseInt(match[2], 10),
    };
  }
  const singleLevel = parseInt(levelStr, 10);
  return { level: singleLevel || 90, maxLevel: singleLevel || 90 };
}

/**
 * Parse talent string like "9,9,10" or "1,9,9"
 */
function parseTalents(talentStr: string): [number, number, number] {
  const parts = talentStr.split(',').map((s) => parseInt(s.trim(), 10));
  return [parts[0] || 1, parts[1] || 1, parts[2] || 1];
}

/**
 * Parse a character definition line
 * Format: "raiden char lvl=90/90 cons=0 talent=9,9,10;"
 */
function parseCharacterLine(line: string): Partial<ParsedCharacterBuild> | null {
  // Match: name char key=value key=value ...
  const charMatch = line.match(/^(\w+)\s+char\s+(.+);?$/i);
  if (!charMatch || !charMatch[1] || !charMatch[2]) return null;

  const gcsimKey = charMatch[1].toLowerCase();
  const params = charMatch[2];

  const result: Partial<ParsedCharacterBuild> = {
    gcsimKey,
    characterKey: REVERSE_CHARACTER_MAP[gcsimKey] || toPascalCase(gcsimKey),
  };

  // Parse lvl=90/90
  const lvlMatch = params.match(/lvl=([^\s]+)/);
  if (lvlMatch && lvlMatch[1]) {
    const { level, maxLevel } = parseLevel(lvlMatch[1]);
    result.level = level;
    result.maxLevel = maxLevel;
  }

  // Parse cons=0
  const consMatch = params.match(/cons=(\d+)/);
  if (consMatch && consMatch[1]) {
    result.constellation = parseInt(consMatch[1], 10);
  }

  // Parse talent=9,9,10
  const talentMatch = params.match(/talent=([^\s;]+)/);
  if (talentMatch && talentMatch[1]) {
    result.talents = parseTalents(talentMatch[1]);
  }

  return result;
}

/**
 * Parse a weapon add line
 * Format: 'raiden add weapon="engulfinglightning" refine=1 lvl=90/90;'
 */
function parseWeaponLine(line: string): { charKey: string; weapon: ParsedCharacterBuild['weapon'] } | null {
  const match = line.match(/^(\w+)\s+add\s+weapon="([^"]+)"(?:\s+refine=(\d+))?(?:\s+lvl=([^\s;]+))?/i);
  if (!match || !match[1] || !match[2]) return null;

  const charKey = match[1].toLowerCase();
  const gcsimWeaponKey = match[2].toLowerCase();
  const refine = match[3] ? parseInt(match[3], 10) : 1;
  const lvlStr = match[4] || '90/90';

  const { level } = parseLevel(lvlStr);

  return {
    charKey,
    weapon: {
      gcsimKey: gcsimWeaponKey,
      key: REVERSE_WEAPON_MAP[gcsimWeaponKey] || toPascalCase(gcsimWeaponKey),
      refinement: refine,
      level,
    },
  };
}

/**
 * Parse an artifact set add line
 * Format: 'raiden add set="emblemofseveredfate" count=4;'
 */
function parseArtifactSetLine(line: string): { charKey: string; set: { gcsimKey: string; key: string; count: number } } | null {
  const match = line.match(/^(\w+)\s+add\s+set="([^"]+)"(?:\s+count=(\d+))?/i);
  if (!match || !match[1] || !match[2]) return null;

  const charKey = match[1].toLowerCase();
  const gcsimSetKey = match[2].toLowerCase();
  const count = match[3] ? parseInt(match[3], 10) : 4;

  return {
    charKey,
    set: {
      gcsimKey: gcsimSetKey,
      key: REVERSE_ARTIFACT_MAP[gcsimSetKey] || toPascalCase(gcsimSetKey),
      count,
    },
  };
}

/**
 * Parse a stats add line
 * Format: 'raiden add stats hp=4780 atk=311 er=0.518 electro%=0.466 cr=0.311;'
 */
function parseStatsLine(line: string): { charKey: string; stats: Record<string, number> } | null {
  const match = line.match(/^(\w+)\s+add\s+stats\s+(.+);?$/i);
  if (!match || !match[1] || !match[2]) return null;

  const charKey = match[1].toLowerCase();
  const statsStr = match[2];

  const stats: Record<string, number> = {};
  const statPairs = statsStr.matchAll(/(\w+%?)=([0-9.]+)/g);

  for (const [, statKey, value] of statPairs) {
    if (statKey && value) {
      const ourStatKey = GCSIM_STAT_TO_OUR_STAT[statKey] || statKey;
      stats[ourStatKey] = parseFloat(value);
    }
  }

  return { charKey, stats };
}

/**
 * Convert a string to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Infer main stats from stat values
 * Main stats have specific values that help identify them
 */
function inferMainStats(stats: Record<string, number>): ParsedCharacterBuild['mainStats'] {
  const mainStats: ParsedCharacterBuild['mainStats'] = {};

  // Sands main stats (typical values around 0.466 for %, or 187 for EM)
  if (stats.enerRech_ && stats.enerRech_ > 0.4) {
    mainStats.sands = 'enerRech_';
  } else if (stats.atk_ && stats.atk_ > 0.4) {
    mainStats.sands = 'atk_';
  } else if (stats.hp_ && stats.hp_ > 0.4) {
    mainStats.sands = 'hp_';
  } else if (stats.def_ && stats.def_ > 0.4) {
    mainStats.sands = 'def_';
  } else if (stats.eleMas && stats.eleMas > 150) {
    mainStats.sands = 'eleMas';
  }

  // Goblet main stats (elemental damage around 0.466)
  const dmgStats = ['pyro_dmg_', 'hydro_dmg_', 'electro_dmg_', 'cryo_dmg_', 'anemo_dmg_', 'geo_dmg_', 'dendro_dmg_', 'physical_dmg_'];
  for (const dmgStat of dmgStats) {
    if (stats[dmgStat] && stats[dmgStat] > 0.4) {
      mainStats.goblet = dmgStat;
      break;
    }
  }

  // Circlet main stats
  if (stats.critRate_ && stats.critRate_ > 0.25) {
    mainStats.circlet = 'critRate_';
  } else if (stats.critDMG_ && stats.critDMG_ > 0.5) {
    mainStats.circlet = 'critDMG_';
  } else if (stats.heal_ && stats.heal_ > 0.3) {
    mainStats.circlet = 'heal_';
  }

  return mainStats;
}

// ============================================
// Main Parser
// ============================================

/**
 * Parse a complete gcsim config and extract character builds
 */
export function parseGcsimConfig(configText: string): GcsimParseResult {
  const lines = configText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('//'));

  const characterBuilds = new Map<string, ParsedCharacterBuild>();
  const errors: string[] = [];

  for (const line of lines) {
    try {
      // Try to parse as character definition
      const charResult = parseCharacterLine(line);
      if (charResult && charResult.gcsimKey) {
        const existing = characterBuilds.get(charResult.gcsimKey) || {
          gcsimKey: charResult.gcsimKey,
          characterKey: charResult.characterKey || '',
          level: 90,
          maxLevel: 90,
          constellation: 0,
          talents: [1, 1, 1] as [number, number, number],
          artifactSets: [],
        };
        characterBuilds.set(charResult.gcsimKey, {
          ...existing,
          ...charResult,
          artifactSets: existing.artifactSets,
        });
        continue;
      }

      // Try to parse as weapon add
      const weaponResult = parseWeaponLine(line);
      if (weaponResult) {
        const existing = characterBuilds.get(weaponResult.charKey);
        if (existing) {
          existing.weapon = weaponResult.weapon;
        }
        continue;
      }

      // Try to parse as artifact set add
      const setResult = parseArtifactSetLine(line);
      if (setResult) {
        const existing = characterBuilds.get(setResult.charKey);
        if (existing) {
          // Check if this set already exists, update count if so
          const existingSet = existing.artifactSets.find((s) => s.gcsimKey === setResult.set.gcsimKey);
          if (existingSet) {
            existingSet.count = setResult.set.count;
          } else {
            existing.artifactSets.push(setResult.set);
          }
        }
        continue;
      }

      // Try to parse as stats add
      const statsResult = parseStatsLine(line);
      if (statsResult) {
        const existing = characterBuilds.get(statsResult.charKey);
        if (existing) {
          existing.substats = { ...(existing.substats || {}), ...statsResult.stats };
          // Try to infer main stats from the values
          const inferredMainStats = inferMainStats(existing.substats);
          existing.mainStats = { ...(existing.mainStats || {}), ...inferredMainStats };
        }
        continue;
      }

      // Line not recognized - that's okay, gcsim has many other commands
    } catch {
      errors.push(line);
    }
  }

  return {
    characters: Array.from(characterBuilds.values()),
    errors,
    rawConfig: configText,
  };
}

/**
 * Convert a parsed character build to a build template format
 */
export function parsedBuildToTemplate(build: ParsedCharacterBuild): {
  characterKey: string;
  role: 'dps' | 'sub-dps' | 'support';
  weapons: { primary: string[]; alternatives: string[] };
  artifacts: {
    sets: string[];
    mainStats: { sands: string[]; goblet: string[]; circlet: string[] };
    substats: string[];
  };
} {
  // Infer role from artifacts/stats
  let role: 'dps' | 'sub-dps' | 'support' = 'dps';
  if (build.artifactSets.some((s) => s.key.includes('Noblesse') || s.key.includes('Tenacity'))) {
    role = 'support';
  }

  return {
    characterKey: build.characterKey,
    role,
    weapons: {
      primary: build.weapon ? [build.weapon.key] : [],
      alternatives: [],
    },
    artifacts: {
      sets: build.artifactSets.map((s) => s.key),
      mainStats: {
        sands: build.mainStats?.sands ? [build.mainStats.sands] : [],
        goblet: build.mainStats?.goblet ? [build.mainStats.goblet] : [],
        circlet: build.mainStats?.circlet ? [build.mainStats.circlet] : [],
      },
      substats: build.substats
        ? Object.entries(build.substats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([key]) => key)
        : [],
    },
  };
}

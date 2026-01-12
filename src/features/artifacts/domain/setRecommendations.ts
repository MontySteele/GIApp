/**
 * Character Build Recommendations
 *
 * Contains optimal artifact sets, main stats, and substat priorities
 * for characters based on their role and playstyle.
 */

/** Character role types */
export type CharacterRole = 'dps' | 'sub-dps' | 'support' | 'healer' | 'shielder';

/** Main stat type */
export type MainStatKey =
  | 'hp_'
  | 'atk_'
  | 'def_'
  | 'eleMas'
  | 'enerRech_'
  | 'critRate_'
  | 'critDMG_'
  | 'heal_'
  | 'physical_dmg_'
  | 'pyro_dmg_'
  | 'hydro_dmg_'
  | 'cryo_dmg_'
  | 'electro_dmg_'
  | 'anemo_dmg_'
  | 'geo_dmg_'
  | 'dendro_dmg_';

/** Artifact slot */
export type SlotKey = 'flower' | 'plume' | 'sands' | 'goblet' | 'circlet';

/** Artifact set recommendation */
export interface SetRecommendation {
  /** Set key (e.g., "EmblemOfSeveredFate") */
  setKey: string;
  /** Number of pieces (2 or 4) */
  pieces: 2 | 4;
  /** Human-readable name */
  name: string;
}

/** Character build recommendation */
export interface CharacterBuild {
  /** Character key */
  characterKey: string;
  /** Primary role */
  role: CharacterRole;
  /** Recommended artifact sets (in priority order) */
  recommendedSets: SetRecommendation[][];
  /** Main stats by slot */
  mainStats: {
    sands: MainStatKey[];
    goblet: MainStatKey[];
    circlet: MainStatKey[];
  };
  /** Substat priority (in order of importance) */
  substats: string[];
  /** Notes about the build */
  notes?: string;
}

/**
 * Character build database
 * Key is lowercase character key for case-insensitive lookup
 */
export const CHARACTER_BUILDS: Record<string, CharacterBuild> = {
  // 5-Star DPS Characters
  hutao: {
    characterKey: 'HuTao',
    role: 'dps',
    recommendedSets: [
      [{ setKey: 'CrimsonWitchOfFlames', pieces: 4, name: 'Crimson Witch of Flames' }],
      [{ setKey: 'GildedDreams', pieces: 4, name: 'Gilded Dreams' }],
      [
        { setKey: 'CrimsonWitchOfFlames', pieces: 2, name: 'Crimson Witch' },
        { setKey: 'TenacityOfTheMillelith', pieces: 2, name: 'Tenacity of the Millelith' },
      ],
    ],
    mainStats: {
      sands: ['hp_', 'eleMas'],
      goblet: ['pyro_dmg_'],
      circlet: ['critRate_', 'critDMG_'],
    },
    substats: ['critRate_', 'critDMG_', 'hp_', 'eleMas', 'atk_'],
    notes: 'HP% sands if using Dragon\'s Bane, EM sands if using Staff of Homa',
  },

  raiden: {
    characterKey: 'RaidenShogun',
    role: 'dps',
    recommendedSets: [
      [{ setKey: 'EmblemOfSeveredFate', pieces: 4, name: 'Emblem of Severed Fate' }],
    ],
    mainStats: {
      sands: ['enerRech_', 'atk_'],
      goblet: ['electro_dmg_', 'atk_'],
      circlet: ['critRate_', 'critDMG_'],
    },
    substats: ['critRate_', 'critDMG_', 'enerRech_', 'atk_'],
    notes: 'ER sands until ~250% ER, then switch to ATK%',
  },

  ayaka: {
    characterKey: 'KamisatoAyaka',
    role: 'dps',
    recommendedSets: [
      [{ setKey: 'BlizzardStrayer', pieces: 4, name: 'Blizzard Strayer' }],
    ],
    mainStats: {
      sands: ['atk_'],
      goblet: ['cryo_dmg_'],
      circlet: ['critDMG_'],
    },
    substats: ['critDMG_', 'atk_', 'enerRech_', 'critRate_'],
    notes: 'Prioritize Crit DMG due to Blizzard Strayer crit rate bonus',
  },

  yelan: {
    characterKey: 'Yelan',
    role: 'sub-dps',
    recommendedSets: [
      [{ setKey: 'EmblemOfSeveredFate', pieces: 4, name: 'Emblem of Severed Fate' }],
      [
        { setKey: 'TenacityOfTheMillelith', pieces: 2, name: 'Tenacity of the Millelith' },
        { setKey: 'NoblesseOblige', pieces: 2, name: 'Noblesse Oblige' },
      ],
    ],
    mainStats: {
      sands: ['hp_'],
      goblet: ['hydro_dmg_'],
      circlet: ['critRate_', 'critDMG_'],
    },
    substats: ['critRate_', 'critDMG_', 'hp_', 'enerRech_'],
  },

  xingqiu: {
    characterKey: 'Xingqiu',
    role: 'sub-dps',
    recommendedSets: [
      [{ setKey: 'EmblemOfSeveredFate', pieces: 4, name: 'Emblem of Severed Fate' }],
      [
        { setKey: 'NoblesseOblige', pieces: 2, name: 'Noblesse Oblige' },
        { setKey: 'HeartOfDepth', pieces: 2, name: 'Heart of Depth' },
      ],
    ],
    mainStats: {
      sands: ['atk_', 'enerRech_'],
      goblet: ['hydro_dmg_'],
      circlet: ['critRate_', 'critDMG_'],
    },
    substats: ['critRate_', 'critDMG_', 'enerRech_', 'atk_'],
    notes: 'Needs ~180-200% ER',
  },

  xiangling: {
    characterKey: 'Xiangling',
    role: 'sub-dps',
    recommendedSets: [
      [{ setKey: 'EmblemOfSeveredFate', pieces: 4, name: 'Emblem of Severed Fate' }],
      [
        { setKey: 'CrimsonWitchOfFlames', pieces: 2, name: 'Crimson Witch' },
        { setKey: 'NoblesseOblige', pieces: 2, name: 'Noblesse Oblige' },
      ],
    ],
    mainStats: {
      sands: ['enerRech_', 'atk_', 'eleMas'],
      goblet: ['pyro_dmg_'],
      circlet: ['critRate_', 'critDMG_'],
    },
    substats: ['critRate_', 'critDMG_', 'enerRech_', 'eleMas', 'atk_'],
    notes: 'ER requirements vary by team (180-250%)',
  },

  bennett: {
    characterKey: 'Bennett',
    role: 'support',
    recommendedSets: [
      [{ setKey: 'NoblesseOblige', pieces: 4, name: 'Noblesse Oblige' }],
      [{ setKey: 'Instructor', pieces: 4, name: 'Instructor' }],
    ],
    mainStats: {
      sands: ['enerRech_', 'hp_'],
      goblet: ['hp_', 'pyro_dmg_'],
      circlet: ['heal_', 'hp_'],
    },
    substats: ['enerRech_', 'hp_', 'critRate_', 'critDMG_'],
    notes: 'Build pure ER/HP for support, or hybrid for damage',
  },

  kazuha: {
    characterKey: 'KaedeharaKazuha',
    role: 'support',
    recommendedSets: [
      [{ setKey: 'ViridescentVenerer', pieces: 4, name: 'Viridescent Venerer' }],
    ],
    mainStats: {
      sands: ['eleMas'],
      goblet: ['eleMas'],
      circlet: ['eleMas'],
    },
    substats: ['eleMas', 'enerRech_', 'critRate_', 'critDMG_'],
    notes: 'Full EM build for maximum buffing',
  },

  furina: {
    characterKey: 'Furina',
    role: 'sub-dps',
    recommendedSets: [
      [{ setKey: 'GoldenTroupe', pieces: 4, name: 'Golden Troupe' }],
    ],
    mainStats: {
      sands: ['hp_'],
      goblet: ['hp_'],
      circlet: ['critRate_', 'critDMG_'],
    },
    substats: ['critRate_', 'critDMG_', 'hp_', 'enerRech_'],
    notes: 'HP% goblet is better than Hydro DMG% in most cases',
  },

  nahida: {
    characterKey: 'Nahida',
    role: 'sub-dps',
    recommendedSets: [
      [{ setKey: 'DeepwoodMemories', pieces: 4, name: 'Deepwood Memories' }],
      [{ setKey: 'GildedDreams', pieces: 4, name: 'Gilded Dreams' }],
    ],
    mainStats: {
      sands: ['eleMas'],
      goblet: ['dendro_dmg_', 'eleMas'],
      circlet: ['critRate_', 'critDMG_'],
    },
    substats: ['critRate_', 'critDMG_', 'eleMas', 'atk_'],
    notes: 'Use Deepwood if no other Dendro character has it',
  },

  zhongli: {
    characterKey: 'Zhongli',
    role: 'shielder',
    recommendedSets: [
      [{ setKey: 'TenacityOfTheMillelith', pieces: 4, name: 'Tenacity of the Millelith' }],
      [
        { setKey: 'TenacityOfTheMillelith', pieces: 2, name: 'Tenacity of the Millelith' },
        { setKey: 'ArchaicPetra', pieces: 2, name: 'Archaic Petra' },
      ],
    ],
    mainStats: {
      sands: ['hp_'],
      goblet: ['hp_'],
      circlet: ['hp_'],
    },
    substats: ['hp_', 'enerRech_', 'critRate_', 'critDMG_'],
    notes: 'Full HP build for maximum shield strength',
  },

  neuvillette: {
    characterKey: 'Neuvillette',
    role: 'dps',
    recommendedSets: [
      [
        { setKey: 'MarechausseeHunter', pieces: 2, name: 'Marechaussee Hunter' },
        { setKey: 'GoldenTroupe', pieces: 2, name: 'Golden Troupe' },
      ],
      [{ setKey: 'MarechausseeHunter', pieces: 4, name: 'Marechaussee Hunter' }],
    ],
    mainStats: {
      sands: ['hp_'],
      goblet: ['hydro_dmg_'],
      circlet: ['critDMG_'],
    },
    substats: ['critDMG_', 'hp_', 'critRate_', 'enerRech_'],
    notes: 'HP% sands is better than ATK% due to his HP scaling',
  },
};

/**
 * Get build recommendation for a character
 */
export function getCharacterBuild(characterKey: string): CharacterBuild | undefined {
  const normalized = characterKey.toLowerCase().replace(/\s+/g, '');
  return CHARACTER_BUILDS[normalized];
}

/**
 * Check if a set matches any recommendation for a character
 */
export function isRecommendedSet(characterKey: string, setKey: string): boolean {
  const build = getCharacterBuild(characterKey);
  if (!build) return false;

  return build.recommendedSets.some((setCombo) =>
    setCombo.some((rec) => rec.setKey.toLowerCase() === setKey.toLowerCase())
  );
}

/**
 * Check if a main stat is recommended for a character in a given slot
 */
export function isRecommendedMainStat(
  characterKey: string,
  slot: SlotKey,
  mainStatKey: string
): boolean {
  const build = getCharacterBuild(characterKey);
  if (!build) return false;

  if (slot === 'flower' || slot === 'plume') {
    return true; // Fixed main stats
  }

  const normalized = mainStatKey.toLowerCase().replace(/%/g, '_');
  return build.mainStats[slot]?.some((stat) => stat.toLowerCase() === normalized) ?? false;
}

/**
 * Get all characters that would benefit from a specific artifact
 */
export function findCharactersForArtifact(
  setKey: string,
  mainStatKey: string,
  slot: SlotKey
): string[] {
  const matches: string[] = [];

  for (const [key, build] of Object.entries(CHARACTER_BUILDS)) {
    const wantsSet = isRecommendedSet(key, setKey);
    const wantsMainStat = isRecommendedMainStat(key, slot, mainStatKey);

    if (wantsSet && wantsMainStat) {
      matches.push(build.characterKey);
    }
  }

  return matches;
}

/**
 * Calculate how well an artifact fits a character's build
 * Returns a score 0-100
 */
export function calculateCharacterFitScore(
  characterKey: string,
  setKey: string,
  slot: SlotKey,
  mainStatKey: string,
  substats: Array<{ key: string; value: number }>
): { score: number; reasons: string[] } {
  const build = getCharacterBuild(characterKey);
  if (!build) {
    return { score: 50, reasons: ['No build data available'] };
  }

  let score = 0;
  const reasons: string[] = [];

  // Set bonus (30 points)
  if (isRecommendedSet(characterKey, setKey)) {
    score += 30;
    reasons.push('Recommended set');
  }

  // Main stat (30 points)
  if (isRecommendedMainStat(characterKey, slot, mainStatKey)) {
    score += 30;
    reasons.push('Optimal main stat');
  } else if (slot !== 'flower' && slot !== 'plume') {
    reasons.push('Non-optimal main stat');
  }

  // Substats (40 points)
  const desiredSubstats = build.substats.slice(0, 4); // Top 4 priority substats
  let substatScore = 0;
  for (const sub of substats) {
    const normalized = sub.key.toLowerCase().replace(/%/g, '_');
    const priority = desiredSubstats.findIndex((s) => s.toLowerCase() === normalized);
    if (priority !== -1) {
      // Higher priority = more points
      substatScore += (4 - priority) * 2.5; // 10, 7.5, 5, 2.5 points
    }
  }
  score += Math.min(40, substatScore);

  if (substatScore >= 20) {
    reasons.push('Good substat distribution');
  } else if (substatScore < 10) {
    reasons.push('Suboptimal substats');
  }

  return { score: Math.round(score), reasons };
}

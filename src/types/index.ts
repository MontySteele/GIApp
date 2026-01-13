// Core Types for Genshin Progress Tracker

export type BannerType = 'character' | 'weapon' | 'standard' | 'chronicled';
export type FateType = 'intertwined' | 'acquaint';
export type PrimogemSource =
  | 'daily_commission'
  | 'welkin'
  | 'event'
  | 'exploration'
  | 'abyss'
  | 'quest'
  | 'achievement'
  | 'maintenance'
  | 'codes'
  | 'battle_pass'
  | 'purchase'
  | 'wish_conversion'
  | 'other';

export type FateSource =
  | 'primogem_conversion'
  | 'battle_pass'
  | 'paimon_shop'
  | 'event'
  | 'ascension'
  | 'other';

export type SlotKey = 'flower' | 'plume' | 'sands' | 'goblet' | 'circlet';
export type CharacterPriority = 'main' | 'secondary' | 'bench' | 'unbuilt';
export type GoalCategory = 'character' | 'team' | 'abyss' | 'exploration' | 'pull' | 'other';
export type GoalStatus = 'active' | 'completed' | 'abandoned';

// Character & Build Models
export interface Substat {
  key: string;
  value: number;
}

export interface Artifact {
  setKey: string;
  slotKey: SlotKey;
  level: number;
  rarity: number;
  mainStatKey: string;
  substats: Substat[];
}

export interface Weapon {
  key: string;
  level: number;
  ascension: number;
  refinement: number; // 1-5
}

export interface Character {
  id: string;
  key: string; // e.g., "Furina", "KaedeharaKazuha"
  level: number; // 1-90
  ascension: number; // 0-6
  constellation: number; // 0-6
  talent: {
    auto: number; // 1-15 (with cons)
    skill: number;
    burst: number;
  };
  weapon: Weapon;
  artifacts: Artifact[]; // Array of 5 (denormalized)
  notes: string;
  priority: CharacterPriority;
  teamIds: string[]; // References to Team.id
  avatarId?: number; // Enka avatarId for portrait lookup (optional)
  createdAt: string; // ISO date
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  characterKeys: string[]; // Ordered by rotation
  rotationNotes: string; // Markdown
  tags: string[];
  memberBuildTemplates?: Record<string, string>; // characterKey -> buildTemplateId
  createdAt: string;
  updatedAt: string;
}

// Wish History Models
export interface WishRecord {
  id: string;
  gachaId: string; // Original ID from game API (for dedup)
  bannerType: BannerType;
  bannerVersion: string; // e.g., "5.3-phase1" for rule versioning
  timestamp: string; // ISO date
  itemType: 'character' | 'weapon';
  itemKey: string;
  rarity: 3 | 4 | 5;
  isFeatured?: boolean;
  chartedWeapon?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Computed at runtime - never stored
export interface ComputedWishData {
  pityCount: number; // Pulls since last 5★ on this banner
  wasGuaranteed: boolean; // Was this pull in guaranteed state?
  won5050: boolean | null; // Result of 50/50 (null if guaranteed or lost)
  triggeredRadiance: boolean; // Did Capturing Radiance activate?
}

export interface BannerPityState {
  character: {
    pity: number;
    guaranteed: boolean;
    radiantStreak: number; // Consecutive 50/50 losses
  };
  weapon: {
    pity: number;
    fatePoints: number;
    chartedWeapon: string | null;
  };
  standard: {
    pity: number;
  };
  chronicled: {
    pity: number;
    guaranteed: boolean;
  };
}

// Resource Tracking Models
export interface PrimogemEntry {
  id: string;
  timestamp: string; // ISO date
  amount: number; // Positive for gains, negative for spending
  source: PrimogemSource;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface FateEntry {
  id: string;
  timestamp: string;
  amount: number;
  fateType: FateType;
  source: FateSource;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceSnapshot {
  id: string;
  timestamp: string;
  primogems: number;
  genesisCrystals: number;
  intertwined: number;
  acquaint: number;
  starglitter: number;
  stardust: number;
  createdAt: string;
}

// Abyss Models
export interface AbyssRun {
  id: string;
  cycleStart: string; // ISO date of cycle reset
  floor: number; // 9-12
  chamber: number; // 1-3
  stars: number; // 0-3
  firstHalfTeam: string[]; // Character keys
  secondHalfTeam: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Goals & Notes Models
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  linkedCharacterKey?: string;
  linkedTeamId?: string;
  status: GoalStatus;
  checklist: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string; // Markdown
  tags: string[];
  linkedCharacterKey?: string;
  linkedTeamId?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string; // Soft delete for sync tombstones
}

// Banner Planning Models
export interface PlannedBanner {
  id: string;
  characterKey: string;
  expectedStartDate: string;
  expectedEndDate: string;
  priority: 1 | 2 | 3 | 4 | 5; // 1 = must pull
  maxPullBudget: number | null; // null = unlimited
  isConfirmed: boolean; // Official vs speculation
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// External Cache
export interface ExternalCache {
  id: string;
  cacheKey: string; // e.g., "enka:123456789"
  data: any; // Raw API response
  fetchedAt: string;
  expiresAt: string;
}

// App Metadata
export interface AppMeta {
  key: string;
  value: any;
}

// Gacha Rules
export interface GachaRules {
  version: string; // e.g., "5.0+"
  softPityStart: number; // 74 for character
  hardPity: number; // 90 for character
  baseRate: number; // 0.006
  softPityRateIncrease: number; // 0.06 per pull
  hasCapturingRadiance: boolean;
  radianceThreshold?: number; // Losses before radiance kicks in
  hasFatePoints?: boolean;
  maxFatePoints?: number;
}

// Calculator Scenarios
export interface CalculatorScenarioTarget {
  characterName: string;
  bannerType: BannerType;
  constellation: number;
  pity: number;
  guaranteed: boolean;
  radiantStreak: number;
  fatePoints: number;
  useInheritedPity: boolean;
}

export interface CalculatorScenario {
  id: string;
  name: string;
  targets: CalculatorScenarioTarget[];
  availablePulls: number;
  iterations: number;
  resultProbability?: number; // Overall probability from last calculation
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Inventory Models (for Irminsul/GOOD imports)
// ============================================

/**
 * Extended substat with roll tracking (from Irminsul)
 */
export interface ExtendedSubstat {
  key: string;
  value: number;
  initialValue?: number; // Value before any rolls
}

/**
 * Standalone artifact entity (can be unequipped)
 * Supports full Irminsul/GOOD format
 */
export interface InventoryArtifact {
  id: string;
  setKey: string;
  slotKey: SlotKey;
  level: number;
  rarity: number; // 1-5
  mainStatKey: string;
  substats: ExtendedSubstat[];
  location: string; // Character key or empty string if unequipped
  lock: boolean;
  // Irminsul-specific fields
  totalRolls?: number;
  astralMark?: boolean;
  elixerCrafted?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Standalone weapon entity (can be unequipped)
 * Supports full Irminsul/GOOD format
 */
export interface InventoryWeapon {
  id: string;
  key: string;
  level: number;
  ascension: number;
  refinement: number; // 1-5
  location: string; // Character key or empty string if unequipped
  lock: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Material inventory counts
 */
export interface MaterialInventory {
  id: string; // 'materials' singleton
  materials: Record<string, number>; // MaterialKey -> count
  updatedAt: string;
}

/**
 * Import metadata for tracking data sources
 */
export interface ImportRecord {
  id: string;
  source: string; // 'Irminsul', 'Enka', 'GOOD', etc.
  filename?: string;
  importedAt: string;
  characterCount: number;
  artifactCount: number;
  weaponCount: number;
  materialCount: number;
}

// ============================================
// Build Template Models
// ============================================

export type CharacterRole = 'dps' | 'sub-dps' | 'support' | 'healer' | 'shielder';
export type BuildDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type BuildBudget = 'f2p' | '4-star' | 'mixed' | 'whale';

/**
 * Artifact set recommendation with pieces count
 */
export interface SetRecommendation {
  setKey: string;
  pieces: 2 | 4;
}

/**
 * Main stat recommendation for a slot
 */
export type MainStatKey =
  | 'hp'
  | 'hp_'
  | 'atk'
  | 'atk_'
  | 'def_'
  | 'eleMas'
  | 'enerRech_'
  | 'heal_'
  | 'critRate_'
  | 'critDMG_'
  | 'physical_dmg_'
  | 'pyro_dmg_'
  | 'hydro_dmg_'
  | 'cryo_dmg_'
  | 'electro_dmg_'
  | 'anemo_dmg_'
  | 'geo_dmg_'
  | 'dendro_dmg_';

/**
 * Character Build Template
 *
 * Stores recommended builds for characters including weapons,
 * artifact sets, main stats, and substats priorities.
 */
export interface BuildTemplate {
  id: string;
  name: string;
  characterKey: string;
  description: string;

  // Role and playstyle
  role: CharacterRole;
  notes: string; // Markdown - strategy, rotation notes

  // Weapon recommendations (ordered by priority)
  weapons: {
    primary: string[]; // Best-in-slot weapons
    alternatives: string[]; // F2P/budget alternatives
    notes?: string;
  };

  // Artifact recommendations
  artifacts: {
    sets: SetRecommendation[][]; // Ordered by priority, each inner array is a combo (e.g., [[4pc Emblem], [2pc NO + 2pc EF]])
    mainStats: {
      sands: MainStatKey[];
      goblet: MainStatKey[];
      circlet: MainStatKey[];
    };
    substats: string[]; // Ordered by priority
    notes?: string;
  };

  // Leveling recommendations
  leveling: {
    targetLevel: number; // 80, 90
    targetAscension: number; // 0-6
    talentPriority: ('auto' | 'skill' | 'burst')[]; // Ordered
    talentTarget?: {
      auto: number;
      skill: number;
      burst: number;
    };
  };

  // Stat targets (optional)
  statTargets?: {
    critRate?: number; // As percentage, e.g., 60
    critDMG?: number;
    enerRech?: number;
    eleMas?: number;
    hp?: number;
    atk?: number;
    def?: number;
  };

  // Team synergies (optional)
  teamSynergies?: {
    bestWith: string[]; // Character keys
    avoidWith?: string[];
    notes?: string;
  };

  // Metadata
  tags: string[];
  difficulty: BuildDifficulty;
  budget: BuildBudget;
  source?: string; // e.g., 'KeqingMains', 'Zy0x', 'Custom'
  gameVersion?: string; // e.g., '5.3'
  isOfficial: boolean; // Community-verified build

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Summary view of a build template for lists
 */
export interface BuildTemplateSummary {
  id: string;
  name: string;
  characterKey: string;
  role: CharacterRole;
  difficulty: BuildDifficulty;
  budget: BuildBudget;
  source?: string;
  isOfficial: boolean;
  tags: string[];
  updatedAt: string;
}


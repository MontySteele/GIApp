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
  createdAt: string; // ISO date
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  characterKeys: string[]; // Ordered by rotation
  rotationNotes: string; // Markdown
  tags: string[];
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

/**
 * Ascension and Material Constants
 *
 * Contains material requirements for character/talent leveling
 * and resin costs for farming
 */

// Resin costs per activity
export const RESIN_COSTS = {
  domainRun: 20,
  weeklyBoss: 30, // Discounted (normally 60, first 3 are 30)
  weeklyBossFull: 60,
  worldBoss: 40,
  leyLine: 20,
  condensedResin: 40,
} as const;

// Resin regeneration
export const RESIN_REGEN = {
  perMinute: 1 / 8, // 1 resin per 8 minutes
  perHour: 7.5,
  perDay: 180,
  maxResin: 200, // Updated cap
} as const;

// Character EXP requirements per level
export const CHARACTER_EXP_REQUIREMENTS: Record<number, number> = {
  1: 0,
  20: 120175,
  40: 578325,
  50: 1195925,
  60: 2092530,
  70: 3423125,
  80: 5189400,
  90: 8362650,
};

// Character ascension material costs (cumulative from level 1)
// Format: [level cap, mora, boss drops, local specialty, common enemy mats (by tier), gems (by tier)]
export const CHARACTER_ASCENSION_COSTS = [
  { level: 20, mora: 20000, bossMat: 0, localSpecialty: 3, commonMat: [3, 0, 0], gem: [1, 0, 0, 0] },
  { level: 40, mora: 40000, bossMat: 2, localSpecialty: 10, commonMat: [15, 0, 0], gem: [3, 0, 0, 0] },
  { level: 50, mora: 60000, bossMat: 4, localSpecialty: 20, commonMat: [15, 12, 0], gem: [6, 3, 0, 0] },
  { level: 60, mora: 80000, bossMat: 8, localSpecialty: 30, commonMat: [15, 18, 0], gem: [6, 6, 0, 0] },
  { level: 70, mora: 100000, bossMat: 12, localSpecialty: 45, commonMat: [15, 18, 12], gem: [6, 9, 0, 0] },
  { level: 80, mora: 120000, bossMat: 20, localSpecialty: 60, commonMat: [15, 18, 24], gem: [6, 9, 6, 0] },
  { level: 90, mora: 0, bossMat: 0, localSpecialty: 0, commonMat: [0, 0, 0], gem: [0, 0, 0, 0] }, // No ascension at 90
];

// Total materials needed for full ascension (1 to 90)
export const TOTAL_ASCENSION_MATS = {
  mora: 420000,
  bossMat: 46,
  localSpecialty: 168,
  commonMat: [18, 30, 36], // By tier
  gem: [1, 9, 9, 6], // Sliver, Fragment, Chunk, Gemstone
};

// Talent level-up costs (per talent, levels 1-10)
// Format: [level, mora, talent books (by tier), common enemy mats (by tier), weekly boss mat, crown]
export const TALENT_LEVEL_COSTS = [
  { level: 2, mora: 12500, books: [3, 0, 0], commonMat: [6, 0, 0], weeklyBoss: 0, crown: 0 },
  { level: 3, mora: 17500, books: [0, 2, 0], commonMat: [0, 3, 0], weeklyBoss: 0, crown: 0 },
  { level: 4, mora: 25000, books: [0, 4, 0], commonMat: [0, 4, 0], weeklyBoss: 0, crown: 0 },
  { level: 5, mora: 30000, books: [0, 6, 0], commonMat: [0, 6, 0], weeklyBoss: 0, crown: 0 },
  { level: 6, mora: 37500, books: [0, 9, 0], commonMat: [0, 9, 0], weeklyBoss: 0, crown: 0 },
  { level: 7, mora: 120000, books: [0, 0, 4], commonMat: [0, 0, 4], weeklyBoss: 1, crown: 0 },
  { level: 8, mora: 260000, books: [0, 0, 6], commonMat: [0, 0, 6], weeklyBoss: 1, crown: 0 },
  { level: 9, mora: 450000, books: [0, 0, 12], commonMat: [0, 0, 9], weeklyBoss: 2, crown: 0 },
  { level: 10, mora: 700000, books: [0, 0, 16], commonMat: [0, 0, 12], weeklyBoss: 2, crown: 1 },
];

// Total talent materials for one talent (1 to 10)
export const TOTAL_TALENT_MATS = {
  mora: 1652500,
  books: [3, 21, 38], // By tier (teachings, guide, philosophies)
  commonMat: [6, 22, 31], // By tier
  weeklyBoss: 6,
  crown: 1,
};

// Hero's Wit (purple) EXP book values
export const EXP_BOOK_VALUES = {
  wanderersAdvice: 1000, // Green
  adventurersExperience: 5000, // Blue
  herosWit: 20000, // Purple
};

// Weapon ascension costs (5-star weapons)
export const WEAPON_ASCENSION_COSTS_5STAR = [
  { level: 20, mora: 10000, domainMat: [5, 0, 0, 0], eliteMat: [5, 0, 0], commonMat: [3, 0, 0] },
  { level: 40, mora: 20000, domainMat: [0, 5, 0, 0], eliteMat: [18, 0, 0], commonMat: [12, 0, 0] },
  { level: 50, mora: 30000, domainMat: [0, 9, 0, 0], eliteMat: [0, 9, 0], commonMat: [0, 9, 0] },
  { level: 60, mora: 45000, domainMat: [0, 0, 5, 0], eliteMat: [0, 18, 0], commonMat: [0, 14, 0] },
  { level: 70, mora: 55000, domainMat: [0, 0, 9, 0], eliteMat: [0, 0, 14], commonMat: [0, 0, 9] },
  { level: 80, mora: 65000, domainMat: [0, 0, 0, 6], eliteMat: [0, 0, 27], commonMat: [0, 0, 18] },
];

// Weapon ascension costs (4-star weapons)
export const WEAPON_ASCENSION_COSTS_4STAR = [
  { level: 20, mora: 5000, domainMat: [3, 0, 0, 0], eliteMat: [3, 0, 0], commonMat: [2, 0, 0] },
  { level: 40, mora: 15000, domainMat: [0, 3, 0, 0], eliteMat: [12, 0, 0], commonMat: [8, 0, 0] },
  { level: 50, mora: 20000, domainMat: [0, 6, 0, 0], eliteMat: [0, 6, 0], commonMat: [0, 6, 0] },
  { level: 60, mora: 30000, domainMat: [0, 0, 3, 0], eliteMat: [0, 12, 0], commonMat: [0, 9, 0] },
  { level: 70, mora: 35000, domainMat: [0, 0, 6, 0], eliteMat: [0, 0, 9], commonMat: [0, 0, 6] },
  { level: 80, mora: 45000, domainMat: [0, 0, 0, 4], eliteMat: [0, 0, 18], commonMat: [0, 0, 12] },
];

// Domain farming days (for talent books and weapon materials)
export const DOMAIN_SCHEDULE: Record<string, string[]> = {
  // Mondstadt talent books
  'Freedom': ['Monday', 'Thursday', 'Sunday'],
  'Resistance': ['Tuesday', 'Friday', 'Sunday'],
  'Ballad': ['Wednesday', 'Saturday', 'Sunday'],
  // Liyue talent books
  'Prosperity': ['Monday', 'Thursday', 'Sunday'],
  'Diligence': ['Tuesday', 'Friday', 'Sunday'],
  'Gold': ['Wednesday', 'Saturday', 'Sunday'],
  // Inazuma talent books
  'Transience': ['Monday', 'Thursday', 'Sunday'],
  'Elegance': ['Tuesday', 'Friday', 'Sunday'],
  'Light': ['Wednesday', 'Saturday', 'Sunday'],
  // Sumeru talent books
  'Admonition': ['Monday', 'Thursday', 'Sunday'],
  'Ingenuity': ['Tuesday', 'Friday', 'Sunday'],
  'Praxis': ['Wednesday', 'Saturday', 'Sunday'],
  // Fontaine talent books
  'Equity': ['Monday', 'Thursday', 'Sunday'],
  'Justice': ['Tuesday', 'Friday', 'Sunday'],
  'Order': ['Wednesday', 'Saturday', 'Sunday'],
  // Natlan talent books
  'Contention': ['Monday', 'Thursday', 'Sunday'],
  'Kindling': ['Tuesday', 'Friday', 'Sunday'],
  'Conflict': ['Wednesday', 'Saturday', 'Sunday'],
};

// Estimated domain runs for materials (average drops)
export const DOMAIN_DROPS_PER_RUN = {
  talentBooks: {
    green: 2.2,
    blue: 0.5, // From crafting greens
    purple: 0.3,
  },
  weaponMats: {
    green: 2.2,
    blue: 0.5,
    purple: 0.3,
    orange: 0.1,
  },
  artifacts: {
    fiveStar: 1.07,
    fourStar: 2.5,
  },
};

// Material tier conversion rates (3 lower = 1 higher)
export const MATERIAL_CONVERSION_RATE = 3;

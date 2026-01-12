/**
 * gcsim/wfpsim Key Mappings
 *
 * Maps our app's data format to gcsim-compatible format for wfpsim export.
 * Source: https://github.com/ancientdialogue/wfpsim
 *
 * Format differences:
 * - Characters: "Raiden Shogun" / "RaidenShogun" -> "raiden"
 * - Weapons: "TheCatch" / "The Catch" -> "thecatch"
 * - Artifacts: "EmblemOfSeveredFate" -> "emblemofseveredfate"
 * - Stats: "critRate_" -> "cr", percentages as decimals (0.518 = 51.8%)
 */

// ============================================
// Character Key Mappings
// ============================================

/**
 * Maps our character keys to gcsim character keys.
 * Our format: PascalCase (e.g., "KaedeharaKazuha", "RaidenShogun")
 * gcsim format: lowercase, simplified (e.g., "kazuha", "raiden")
 */
export const CHARACTER_KEY_MAP: Record<string, string> = {
  // Standard mappings (direct lowercase conversion works)
  Albedo: 'albedo',
  Alhaitham: 'alhaitham',
  Aloy: 'aloy',
  Amber: 'amber',
  Arlecchino: 'arlecchino',
  Barbara: 'barbara',
  Beidou: 'beidou',
  Bennett: 'bennett',
  Candace: 'candace',
  Charlotte: 'charlotte',
  Chasca: 'chasca',
  Chevreuse: 'chevreuse',
  Chiori: 'chiori',
  Chongyun: 'chongyun',
  Citlali: 'citlali',
  Clorinde: 'clorinde',
  Collei: 'collei',
  Cyno: 'cyno',
  Dahlia: 'dahlia',
  Dehya: 'dehya',
  Diluc: 'diluc',
  Diona: 'diona',
  Dori: 'dori',
  Emilie: 'emilie',
  Escoffier: 'escoffier',
  Eula: 'eula',
  Faruzan: 'faruzan',
  Fischl: 'fischl',
  Freminet: 'freminet',
  Furina: 'furina',
  Gaming: 'gaming',
  Ganyu: 'ganyu',
  Gorou: 'gorou',
  Jean: 'jean',
  Kaeya: 'kaeya',
  Kaveh: 'kaveh',
  Keqing: 'keqing',
  Kinich: 'kinich',
  Kirara: 'kirara',
  Klee: 'klee',
  Layla: 'layla',
  Lisa: 'lisa',
  Lynette: 'lynette',
  Lyney: 'lyney',
  Mavuika: 'mavuika',
  Mika: 'mika',
  Mizuki: 'mizuki',
  Mona: 'mona',
  Mualani: 'mualani',
  Nahida: 'nahida',
  Navia: 'navia',
  Neuvillette: 'neuvillette',
  Nilou: 'nilou',
  Ningguang: 'ningguang',
  Noelle: 'noelle',
  Ororon: 'ororon',
  Qiqi: 'qiqi',
  Razor: 'razor',
  Rosaria: 'rosaria',
  Sayu: 'sayu',
  Sethos: 'sethos',
  Shenhe: 'shenhe',
  Sigewinne: 'sigewinne',
  Skirk: 'skirk',
  Sucrose: 'sucrose',
  Thoma: 'thoma',
  Tighnari: 'tighnari',
  Venti: 'venti',
  Wanderer: 'wanderer',
  Wriothesley: 'wriothesley',
  Xiangling: 'xiangling',
  Xianyun: 'xianyun',
  Xiao: 'xiao',
  Xilonen: 'xilonen',
  Xingqiu: 'xingqiu',
  Xinyan: 'xinyan',
  Yanfei: 'yanfei',
  Yaoyao: 'yaoyao',
  Yelan: 'yelan',
  Yoimiya: 'yoimiya',
  Yunjin: 'yunjin',
  Zhongli: 'zhongli',
  Varesa: 'varesa',

  // Special mappings (name simplifications)
  'Raiden Shogun': 'raiden',
  RaidenShogun: 'raiden',
  Raiden: 'raiden',

  'Hu Tao': 'hutao',
  HuTao: 'hutao',

  'Kamisato Ayaka': 'ayaka',
  KamisatoAyaka: 'ayaka',
  Ayaka: 'ayaka',

  'Kamisato Ayato': 'ayato',
  KamisatoAyato: 'ayato',
  Ayato: 'ayato',

  'Kaedehara Kazuha': 'kazuha',
  KaedeharaKazuha: 'kazuha',
  Kazuha: 'kazuha',

  'Sangonomiya Kokomi': 'kokomi',
  SangonomiyaKokomi: 'kokomi',
  Kokomi: 'kokomi',

  'Kujou Sara': 'sara',
  KujouSara: 'sara',
  Sara: 'sara',

  'Kuki Shinobu': 'kuki',
  KukiShinobu: 'kuki',
  Shinobu: 'kuki',

  'Arataki Itto': 'itto',
  AratakiItto: 'itto',
  Itto: 'itto',

  'Shikanoin Heizou': 'heizou',
  ShikanoinHeizou: 'heizou',
  Heizou: 'heizou',

  'Yae Miko': 'yaemiko',
  YaeMiko: 'yaemiko',

  Tartaglia: 'tartaglia',
  Childe: 'tartaglia',

  'Lan Yan': 'lanyan',
  LanYan: 'lanyan',

  // Traveler variants
  Traveler: 'traveler',
  Aether: 'traveler',
  Lumine: 'traveler',
  TravelerAnemo: 'traveler',
  TravelerGeo: 'traveler',
  TravelerElectro: 'traveler',
  TravelerDendro: 'traveler',
  TravelerHydro: 'traveler',
  TravelerPyro: 'traveler',
  TravelerCryo: 'traveler',

  // Yumemizuki Mizuki
  'Yumemizuki Mizuki': 'mizuki',
  YumemizukiMizuki: 'mizuki',
};

// ============================================
// Weapon Key Mappings
// ============================================

/**
 * Maps our weapon keys to gcsim weapon keys.
 * Our format: PascalCase (e.g., "MistsplitterReforged", "TheCatch")
 * gcsim format: lowercase, no spaces/punctuation (e.g., "mistsplitter", "thecatch")
 */
export const WEAPON_KEY_MAP: Record<string, string> = {
  // 5-Star Swords
  MistsplitterReforged: 'mistsplitter',
  Mistsplitter: 'mistsplitter',
  PrimordialJadeCutter: 'primordial',
  LightOfFoliarIncision: 'foliar',
  HaranGeppakuFutsu: 'haran',
  AquilaFavonia: 'aquila',
  SkywardBlade: 'skyward',
  FreedomSworn: 'freedom',
  SummitShaper: 'summit',
  KeyOfKhajNisut: 'keyofkhajnisut',
  SplendorOfTranquilWaters: 'splendoroftranquilwaters',
  UrakuMisugiri: 'urakumisugiri',
  Absolution: 'absolution',
  PeakPatrolSong: 'peakpatrolsong',
  MoonWeaversDawn: 'moonweaversdawn',

  // 5-Star Claymores
  SongOfBrokenPines: 'pines',
  RedhornStonethresher: 'redhorn',
  WolfsGravestone: 'wolf',
  SkywardPride: 'skyward',
  TheUnforged: 'unforged',
  BeaconOfTheReedSea: 'beacon',
  Verdict: 'verdict',
  FangOfTheMountainKing: 'fangofthemountainking',
  AThousandBlazingSuns: 'athousandblazingsuns',

  // 5-Star Polearms
  StaffOfHoma: 'homa',
  EngulfingLightning: 'engulfing',
  PrimordialJadeWingedSpear: 'primordial',
  SkywardSpine: 'skyward',
  VortexVanquisher: 'vortex',
  CalamityQueller: 'calamity',
  StaffOfTheScarletSands: 'scarletsands',
  CrimsonMoonsSemblance: 'crimsonmoonssemblance',
  LumidouceElegy: 'lumidouceelegy',

  // 5-Star Bows
  AmosBow: 'amos',
  ElegyForTheEnd: 'elegy',
  ThunderingPulse: 'thundering',
  PolarStar: 'polarstar',
  AquaSimulacra: 'aqua',
  HuntersPath: 'hunterspath',
  SkywardHarp: 'skyward',
  TheFirstGreatMagic: 'firstgreatmagic',
  SilvershowerHeartstrings: 'heartstrings',
  AstralVulturesCrimsonPlumage: 'astralvulturescrimsonplumage',

  // 5-Star Catalysts
  AThousandFloatingDreams: 'athousandfloatingdreams',
  KagurasVerity: 'kagura',
  EverlastingMoonglow: 'moonglow',
  MemoryOfDust: 'memory',
  LostPrayerToTheSacredWinds: 'prayer',
  SkywardAtlas: 'skyward',
  TulaytullahsRemembrance: 'tulaytullahsremembrance',
  JadefallsSplendor: 'jadefallssplendor',
  TomeOfTheEternalFlow: 'eternalflow',
  CashflowSupervision: 'cashflow',
  SurfsUp: 'surfsup',
  CranesEchoingCall: 'cranesechoingcall',
  StarCallersWatch: 'starcallerswatch',

  // 4-Star Swords
  TheBlackSword: 'blacksword',
  SacrificialSword: 'sacrifical',
  LionsRoar: 'lion',
  IronSting: 'ironsting',
  FavoniusSword: 'favonius',
  TheFlute: 'flute',
  AmenomaKageuchi: 'amenoma',
  BlackcliffLongsword: 'blackcliff',
  PrototypeRancour: 'prototype',
  CinnabarSpindle: 'cinnabar',
  XiphosMoonlight: 'xiphos',
  ToukabouShigure: 'toukaboushigure',
  WolfFang: 'wolffang',
  FinaleOfTheDeep: 'finaleofthedeep',
  FleuveCendreFerryman: 'fleuvecendreferryman',
  TheDockhandsAssistant: 'dockhand',
  SwordOfNarzissenkreuz: 'swordofnarzissenkreuz',
  AlleyFlash: 'alley',
  SapwoodBlade: 'sapwoodblade',
  FluteOfEzpitzal: 'fluteofezpitzal',
  TheFluteOfEzpitzal: 'fluteofezpitzal',

  // 4-Star Claymores
  SerpentSpine: 'spine',
  Rainslasher: 'rainslasher',
  SacrificialGreatsword: 'sacrifical',
  TheBell: 'bell',
  FavoniusGreatsword: 'favonius',
  Whiteblind: 'whiteblind',
  PrototypeArchaic: 'prototype',
  BlackcliffSlasher: 'blackcliff',
  LithicBlade: 'lithic',
  SnowTombedStarsilver: 'starsilver',
  KatsuragikiriNagamasa: 'nagamasa',
  Akuoumaru: 'akuoumaru',
  ForestRegalia: 'forestregalia',
  MakhairaAquamarine: 'aquamarine',
  MailedFlower: 'mailedflower',
  TalkingStick: 'talkingstick',
  TidalShadow: 'tidalshadow',
  UltimateOverlordsMegaMagicSword: 'ultimateoverlordsmegamagicsword',
  PortablePowerSaw: 'powersaw',
  EarthShaker: 'earthshaker',
  FruitfulHook: 'fruitfulhook',

  // 4-Star Polearms
  DragonsBane: 'dragonbane',
  FavoniusLance: 'favonius',
  PrototypeStarglitter: 'prototype',
  CrescentPike: 'crescent',
  BlackcliffPole: 'blackcliff',
  Deathmatch: 'deathmatch',
  LithicSpear: 'lithic',
  DragonspineSpear: 'dragonspine',
  TheCatch: 'catch',
  'The Catch': 'catch',
  KitainCrossSpear: 'kitain',
  WavebreakersFin: 'wavebreaker',
  MissiveWindspear: 'missive',
  Moonpiercer: 'moonpiercer',
  BalladOfTheFjords: 'balladofthefjords',
  RightfulReward: 'rightfulreward',
  ProspectorsDrill: 'prospectorsdrill',
  DialoguesOfTheDesertSages: 'dialoguesofthedesertsages',
  FootprintOfTheRainbow: 'footprint',
  MountainBracingBolt: 'mountainbracingbolt',
  SymphonistOfScatteredFlames: 'symphonist',

  // 4-Star Bows
  Rust: 'rust',
  SacrificialBow: 'sacrificial',
  TheStringless: 'stringless',
  FavoniusWarbow: 'favonius',
  PrototypeCrescent: 'prototype',
  CompoundBow: 'compound',
  BlackcliffWarbow: 'blackcliff',
  TheViridescentHunt: 'viridescent',
  WindblumeOde: 'windblume',
  MitternachtsWaltz: 'mitternachtswaltz',
  Hamayumi: 'hamayumi',
  MouunsMoon: 'mouunsmoon',
  Predator: 'predator',
  FadingTwilight: 'twilight',
  KingsSquire: 'kingssquire',
  EndOfTheLine: 'endoftheline',
  IbisPiercer: 'ibispiercer',
  ScionOfTheBlazingSun: 'scionoftheblazingsun',
  SongOfStillness: 'songofstillness',
  RangeGauge: 'rangegauge',
  ChainBreaker: 'chainbreaker',
  Cloudforged: 'cloudforged',
  FlowerWreathedFeathers: 'flowerwreathedfeathers',

  // 4-Star Catalysts
  SacrificialFragments: 'sacrifical',
  TheWidsith: 'widsith',
  SolarPearl: 'solar',
  EyeOfPerception: 'perception',
  FavoniusCodex: 'favonius',
  PrototypeAmber: 'prototype',
  MappaMare: 'mappa',
  BlackcliffAgate: 'blackcliff',
  Frostbearer: 'frostbearer',
  DodocoTales: 'dodoco',
  HakushinRing: 'hakushin',
  OathswornEye: 'oathsworneye',
  WanderingEvenstar: 'wanderingevenstar',
  FruitOfFulfillment: 'fruitoffulfillment',
  FlowingPurity: 'flowingpurity',
  BalladOfTheBoundlessBlue: 'balladoftheboundlessblue',
  AshGravenDrinkingHorn: 'ashgraven',
  RingOfYaxche: 'ringofyaxche',
  SacredJade: 'sacrificialjade',
  SacrificialJade: 'sacrificialjade',
  VividNotions: 'vividnotions',
  SunnyMorningAwakening: 'sunnymorning',
  WaveRidingWhirl: 'waveridingwhirl',

  // 3-Star Weapons
  HarbingerOfDawn: 'harbinger',
  CoolSteel: 'coolsteel',
  SkyriderSword: 'skyrider',
  FerrousShadow: 'ferrousshadow',
  BloodtaintedGreatsword: 'bloodtainted',
  WhiteTassel: 'whitetassel',
  BlackTassel: 'blacktassel',
  Slingshot: 'slingshot',
  RavenBow: 'raven',
  ThrillingTalesOfDragonSlayers: 'thrilling',
  TwinNephrite: 'twin',
  MagicGuide: 'magicguide',
};

// ============================================
// Artifact Set Key Mappings
// ============================================

/**
 * Maps our artifact set keys to gcsim artifact set keys.
 * Our format: PascalCase (e.g., "EmblemOfSeveredFate")
 * gcsim format: lowercase, no spaces (e.g., "emblemofseveredfate")
 */
export const ARTIFACT_SET_KEY_MAP: Record<string, string> = {
  // Universal Sets
  GladiatorsFinale: 'gladiator',
  WanderersTroupe: 'wanderer',
  EmblemOfSeveredFate: 'emblem',
  ShimenawasReminiscence: 'reminiscence',
  NoblesseOblige: 'noblesse',
  ViridescentVenerer: 'viridescent',

  // Elemental Reaction Sets
  Thundersoother: 'thundersoother',
  Lavawalker: 'lavawalker',
  CrimsonWitchOfFlames: 'crimson',
  ThunderingFury: 'thunderingfury',
  BlizzardStrayer: 'blizzard',
  HeartOfDepth: 'heartofdepth',

  // Geo Sets
  ArchaicPetra: 'archaic',
  RetracingBolide: 'bolide',
  HuskOfOpulentDreams: 'huskofopulentdreams',

  // Physical/HP Sets
  PaleFlame: 'paleflame',
  TenacityOfTheMillelith: 'tenacity',
  BloodstainedChivalry: 'bloodstained',

  // Healing Sets
  MaidenBeloved: 'maiden',
  OceanHuedClam: 'oceanhuedclam',

  // Anemo Set
  VermillionHereafter: 'vermillion',

  // Newer Sets
  EchoesOfAnOffering: 'echoes',
  DeepwoodMemories: 'deepwood',
  GildedDreams: 'gildeddreams',
  DesertPavilionChronicle: 'desertpavilionchronicle',
  FlowerOfParadiseLost: 'flowerofparadiselost',
  NymphsDream: 'nymphsdream',
  VourukashasGlow: 'vourukashasglow',
  MarechausseeHunter: 'marechausseehunter',
  GoldenTroupe: 'goldentroupe',
  SongOfDaysPast: 'songofdayspast',
  NighttimeWhispersInTheEchoingWoods: 'nighttimewhispersintheechoingwoods',
  FragmentOfHarmonicWhimsy: 'fragmentofharmonicwhimsy',
  UnfinishedReverie: 'unfinishedreverie',
  ScrollOfTheHeroOfCinderCity: 'scrolloftheheroofcindercity',
  ObsidianCodex: 'obsidiancodex',
  FinaleOfTheDeepGalleries: 'finaleofthedeepgalleries',
  LongNightsOath: 'longnightsoath',

  // Early Game Sets
  Berserker: 'berserker',
  Instructor: 'instructor',
  TheExile: 'exile',
  DefendersWill: 'defenderswill',
  BraveHeart: 'braveheart',
  MartialArtist: 'martialartist',
  Gambler: 'gambler',
  Scholar: 'scholar',
  ResolutionOfSojourner: 'sojourner',
};

// ============================================
// Stat Key Mappings
// ============================================

/**
 * Maps our stat keys to gcsim stat keys.
 * Our format: GOOD format (e.g., "critRate_", "hp_", "atk")
 * gcsim format: abbreviated (e.g., "cr", "hp%", "atk")
 *
 * Note: Percentage values in gcsim are decimals (0.518 = 51.8%)
 */
export const STAT_KEY_MAP: Record<string, string> = {
  // Flat stats
  hp: 'hp',
  atk: 'atk',
  def: 'def',

  // Percentage stats
  hp_: 'hp%',
  atk_: 'atk%',
  def_: 'def%',

  // Crit stats
  critRate_: 'cr',
  critDMG_: 'cd',

  // EM and ER
  eleMas: 'em',
  enerRech_: 'er',

  // Elemental DMG bonus
  pyro_dmg_: 'pyro%',
  hydro_dmg_: 'hydro%',
  electro_dmg_: 'electro%',
  cryo_dmg_: 'cryo%',
  anemo_dmg_: 'anemo%',
  geo_dmg_: 'geo%',
  dendro_dmg_: 'dendro%',
  physical_dmg_: 'phys%',

  // Healing bonus
  heal_: 'heal',
};

/**
 * Stats that are percentages (need to be converted from 0-100 to 0-1 format)
 */
export const PERCENTAGE_STATS = new Set([
  'hp_',
  'atk_',
  'def_',
  'critRate_',
  'critDMG_',
  'enerRech_',
  'pyro_dmg_',
  'hydro_dmg_',
  'electro_dmg_',
  'cryo_dmg_',
  'anemo_dmg_',
  'geo_dmg_',
  'dendro_dmg_',
  'physical_dmg_',
  'heal_',
]);

/**
 * Flat stats (no conversion needed)
 */
export const FLAT_STATS = new Set(['hp', 'atk', 'def', 'eleMas']);

// ============================================
// Helper Functions
// ============================================

/**
 * Convert our character key to gcsim format.
 * Falls back to lowercase if no explicit mapping exists.
 */
export function toGcsimCharacterKey(key: string): string {
  // Try direct mapping first
  if (CHARACTER_KEY_MAP[key]) {
    return CHARACTER_KEY_MAP[key];
  }

  // Normalize variations
  const normalized = key.replace(/\s+/g, '').replace(/-/g, '');
  if (CHARACTER_KEY_MAP[normalized]) {
    return CHARACTER_KEY_MAP[normalized];
  }

  // Fallback: convert to lowercase and remove spaces/special chars
  return key.toLowerCase().replace(/[\s'-]/g, '');
}

/**
 * Convert our weapon key to gcsim format.
 * Falls back to lowercase if no explicit mapping exists.
 */
export function toGcsimWeaponKey(key: string): string {
  // Try direct mapping first
  if (WEAPON_KEY_MAP[key]) {
    return WEAPON_KEY_MAP[key];
  }

  // Normalize variations
  const normalized = key.replace(/\s+/g, '').replace(/-/g, '');
  if (WEAPON_KEY_MAP[normalized]) {
    return WEAPON_KEY_MAP[normalized];
  }

  // Fallback: convert to lowercase and remove spaces/special chars
  return key.toLowerCase().replace(/[\s'-]/g, '');
}

/**
 * Convert our artifact set key to gcsim format.
 * Falls back to lowercase if no explicit mapping exists.
 */
export function toGcsimArtifactSetKey(key: string): string {
  // Try direct mapping first
  if (ARTIFACT_SET_KEY_MAP[key]) {
    return ARTIFACT_SET_KEY_MAP[key];
  }

  // Normalize variations
  const normalized = key.replace(/\s+/g, '').replace(/-/g, '');
  if (ARTIFACT_SET_KEY_MAP[normalized]) {
    return ARTIFACT_SET_KEY_MAP[normalized];
  }

  // Fallback: convert to lowercase and remove spaces
  return key.toLowerCase().replace(/[\s'-]/g, '');
}

/**
 * Convert our stat key to gcsim format.
 */
export function toGcsimStatKey(key: string): string {
  return STAT_KEY_MAP[key] || key.toLowerCase();
}

/**
 * Convert a stat value to gcsim format.
 * Percentages are stored as decimals in gcsim (51.8% -> 0.518)
 *
 * @param key - The stat key (our format)
 * @param value - The stat value
 * @param isPercentageValue - Whether the input value is already a percentage (e.g., 51.8 vs 0.518)
 */
export function toGcsimStatValue(key: string, value: number, isPercentageValue = true): number {
  if (PERCENTAGE_STATS.has(key) && isPercentageValue) {
    // Convert percentage to decimal (51.8 -> 0.518)
    return value / 100;
  }
  return value;
}

/**
 * Format a stat for gcsim config output.
 * Returns string like "cr=0.311" or "atk=358"
 */
export function formatGcsimStat(key: string, value: number, isPercentageValue = true): string {
  const gcsimKey = toGcsimStatKey(key);
  const gcsimValue = toGcsimStatValue(key, value, isPercentageValue);

  // Format with appropriate precision
  if (PERCENTAGE_STATS.has(key)) {
    return `${gcsimKey}=${gcsimValue.toFixed(4)}`;
  }
  return `${gcsimKey}=${Math.round(gcsimValue)}`;
}

/**
 * Get the count of artifacts from the same set.
 * Returns a map of setKey -> count
 */
export function countArtifactSets(
  artifacts: Array<{ setKey: string }>
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const artifact of artifacts) {
    const count = counts.get(artifact.setKey) || 0;
    counts.set(artifact.setKey, count + 1);
  }

  return counts;
}

/**
 * Determine the primary artifact set (4pc or 2pc+2pc).
 * Returns the set key(s) and count(s) for gcsim config.
 */
export function getArtifactSetConfig(
  artifacts: Array<{ setKey: string }>
): Array<{ setKey: string; count: number }> {
  const counts = countArtifactSets(artifacts);
  const result: Array<{ setKey: string; count: number }> = [];

  // Sort by count (descending) then by key (for consistency)
  const sorted = Array.from(counts.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });

  for (const [setKey, count] of sorted) {
    // Only include sets with 2+ pieces
    if (count >= 2) {
      result.push({ setKey, count: Math.min(count, 4) });
    }
  }

  return result;
}

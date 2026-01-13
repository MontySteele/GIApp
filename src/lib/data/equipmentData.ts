/**
 * Equipment Data for Build Templates
 *
 * Static data for weapons and artifact sets used in build template forms.
 * Derived from gcsim key mappings with additional metadata for UI dropdowns.
 */

// ============================================
// Types
// ============================================

export type WeaponType = 'Sword' | 'Claymore' | 'Polearm' | 'Bow' | 'Catalyst';
export type WeaponRarity = 3 | 4 | 5;

export interface WeaponData {
  key: string;
  name: string;
  type: WeaponType;
  rarity: WeaponRarity;
}

export interface ArtifactSetData {
  key: string;
  name: string;
  maxRarity: 4 | 5;
  twoPiece: string;
  fourPiece?: string;
}

export type ArtifactSlot = 'flower' | 'plume' | 'sands' | 'goblet' | 'circlet';

export interface MainStatOption {
  key: string;
  label: string;
}

// ============================================
// Weapons
// ============================================

export const WEAPONS: WeaponData[] = [
  // 5-Star Swords
  { key: 'MistsplitterReforged', name: 'Mistsplitter Reforged', type: 'Sword', rarity: 5 },
  { key: 'PrimordialJadeCutter', name: 'Primordial Jade Cutter', type: 'Sword', rarity: 5 },
  { key: 'LightOfFoliarIncision', name: 'Light of Foliar Incision', type: 'Sword', rarity: 5 },
  { key: 'HaranGeppakuFutsu', name: 'Haran Geppaku Futsu', type: 'Sword', rarity: 5 },
  { key: 'AquilaFavonia', name: 'Aquila Favonia', type: 'Sword', rarity: 5 },
  { key: 'SkywardBlade', name: 'Skyward Blade', type: 'Sword', rarity: 5 },
  { key: 'FreedomSworn', name: 'Freedom-Sworn', type: 'Sword', rarity: 5 },
  { key: 'SummitShaper', name: 'Summit Shaper', type: 'Sword', rarity: 5 },
  { key: 'KeyOfKhajNisut', name: 'Key of Khaj-Nisut', type: 'Sword', rarity: 5 },
  { key: 'SplendorOfTranquilWaters', name: 'Splendor of Tranquil Waters', type: 'Sword', rarity: 5 },
  { key: 'UrakuMisugiri', name: 'Uraku Misugiri', type: 'Sword', rarity: 5 },
  { key: 'Absolution', name: 'Absolution', type: 'Sword', rarity: 5 },
  { key: 'PeakPatrolSong', name: 'Peak Patrol Song', type: 'Sword', rarity: 5 },

  // 4-Star Swords
  { key: 'TheBlackSword', name: 'The Black Sword', type: 'Sword', rarity: 4 },
  { key: 'SacrificialSword', name: 'Sacrificial Sword', type: 'Sword', rarity: 4 },
  { key: 'LionsRoar', name: "Lion's Roar", type: 'Sword', rarity: 4 },
  { key: 'IronSting', name: 'Iron Sting', type: 'Sword', rarity: 4 },
  { key: 'FavoniusSword', name: 'Favonius Sword', type: 'Sword', rarity: 4 },
  { key: 'TheFlute', name: 'The Flute', type: 'Sword', rarity: 4 },
  { key: 'AmenomaKageuchi', name: 'Amenoma Kageuchi', type: 'Sword', rarity: 4 },
  { key: 'BlackcliffLongsword', name: 'Blackcliff Longsword', type: 'Sword', rarity: 4 },
  { key: 'PrototypeRancour', name: 'Prototype Rancour', type: 'Sword', rarity: 4 },
  { key: 'CinnabarSpindle', name: 'Cinnabar Spindle', type: 'Sword', rarity: 4 },
  { key: 'XiphosMoonlight', name: "Xiphos' Moonlight", type: 'Sword', rarity: 4 },
  { key: 'ToukabouShigure', name: 'Toukabou Shigure', type: 'Sword', rarity: 4 },
  { key: 'WolfFang', name: 'Wolf-Fang', type: 'Sword', rarity: 4 },
  { key: 'FinaleOfTheDeep', name: 'Finale of the Deep', type: 'Sword', rarity: 4 },
  { key: 'FleuveCendreFerryman', name: 'Fleuve Cendre Ferryman', type: 'Sword', rarity: 4 },
  { key: 'SwordOfNarzissenkreuz', name: 'Sword of Narzissenkreuz', type: 'Sword', rarity: 4 },

  // 3-Star Swords
  { key: 'HarbingerOfDawn', name: 'Harbinger of Dawn', type: 'Sword', rarity: 3 },
  { key: 'CoolSteel', name: 'Cool Steel', type: 'Sword', rarity: 3 },
  { key: 'SkyriderSword', name: 'Skyrider Sword', type: 'Sword', rarity: 3 },

  // 5-Star Claymores
  { key: 'SongOfBrokenPines', name: 'Song of Broken Pines', type: 'Claymore', rarity: 5 },
  { key: 'RedhornStonethresher', name: 'Redhorn Stonethresher', type: 'Claymore', rarity: 5 },
  { key: 'WolfsGravestone', name: "Wolf's Gravestone", type: 'Claymore', rarity: 5 },
  { key: 'SkywardPride', name: 'Skyward Pride', type: 'Claymore', rarity: 5 },
  { key: 'TheUnforged', name: 'The Unforged', type: 'Claymore', rarity: 5 },
  { key: 'BeaconOfTheReedSea', name: 'Beacon of the Reed Sea', type: 'Claymore', rarity: 5 },
  { key: 'Verdict', name: 'Verdict', type: 'Claymore', rarity: 5 },
  { key: 'FangOfTheMountainKing', name: 'Fang of the Mountain King', type: 'Claymore', rarity: 5 },
  { key: 'AThousandBlazingSuns', name: 'A Thousand Blazing Suns', type: 'Claymore', rarity: 5 },

  // 4-Star Claymores
  { key: 'SerpentSpine', name: 'Serpent Spine', type: 'Claymore', rarity: 4 },
  { key: 'Rainslasher', name: 'Rainslasher', type: 'Claymore', rarity: 4 },
  { key: 'SacrificialGreatsword', name: 'Sacrificial Greatsword', type: 'Claymore', rarity: 4 },
  { key: 'TheBell', name: 'The Bell', type: 'Claymore', rarity: 4 },
  { key: 'FavoniusGreatsword', name: 'Favonius Greatsword', type: 'Claymore', rarity: 4 },
  { key: 'Whiteblind', name: 'Whiteblind', type: 'Claymore', rarity: 4 },
  { key: 'PrototypeArchaic', name: 'Prototype Archaic', type: 'Claymore', rarity: 4 },
  { key: 'BlackcliffSlasher', name: 'Blackcliff Slasher', type: 'Claymore', rarity: 4 },
  { key: 'LithicBlade', name: 'Lithic Blade', type: 'Claymore', rarity: 4 },
  { key: 'SnowTombedStarsilver', name: 'Snow-Tombed Starsilver', type: 'Claymore', rarity: 4 },
  { key: 'Akuoumaru', name: 'Akuoumaru', type: 'Claymore', rarity: 4 },
  { key: 'ForestRegalia', name: 'Forest Regalia', type: 'Claymore', rarity: 4 },
  { key: 'TalkingStick', name: 'Talking Stick', type: 'Claymore', rarity: 4 },
  { key: 'TidalShadow', name: 'Tidal Shadow', type: 'Claymore', rarity: 4 },
  { key: 'PortablePowerSaw', name: 'Portable Power Saw', type: 'Claymore', rarity: 4 },
  { key: 'EarthShaker', name: 'Earth Shaker', type: 'Claymore', rarity: 4 },

  // 3-Star Claymores
  { key: 'FerrousShadow', name: 'Ferrous Shadow', type: 'Claymore', rarity: 3 },
  { key: 'BloodtaintedGreatsword', name: 'Bloodtainted Greatsword', type: 'Claymore', rarity: 3 },

  // 5-Star Polearms
  { key: 'StaffOfHoma', name: 'Staff of Homa', type: 'Polearm', rarity: 5 },
  { key: 'EngulfingLightning', name: 'Engulfing Lightning', type: 'Polearm', rarity: 5 },
  { key: 'PrimordialJadeWingedSpear', name: 'Primordial Jade Winged-Spear', type: 'Polearm', rarity: 5 },
  { key: 'SkywardSpine', name: 'Skyward Spine', type: 'Polearm', rarity: 5 },
  { key: 'VortexVanquisher', name: 'Vortex Vanquisher', type: 'Polearm', rarity: 5 },
  { key: 'CalamityQueller', name: 'Calamity Queller', type: 'Polearm', rarity: 5 },
  { key: 'StaffOfTheScarletSands', name: 'Staff of the Scarlet Sands', type: 'Polearm', rarity: 5 },
  { key: 'CrimsonMoonsSemblance', name: "Crimson Moon's Semblance", type: 'Polearm', rarity: 5 },
  { key: 'LumidouceElegy', name: 'Lumidouce Elegy', type: 'Polearm', rarity: 5 },

  // 4-Star Polearms
  { key: 'DragonsBane', name: "Dragon's Bane", type: 'Polearm', rarity: 4 },
  { key: 'FavoniusLance', name: 'Favonius Lance', type: 'Polearm', rarity: 4 },
  { key: 'PrototypeStarglitter', name: 'Prototype Starglitter', type: 'Polearm', rarity: 4 },
  { key: 'CrescentPike', name: 'Crescent Pike', type: 'Polearm', rarity: 4 },
  { key: 'BlackcliffPole', name: 'Blackcliff Pole', type: 'Polearm', rarity: 4 },
  { key: 'Deathmatch', name: 'Deathmatch', type: 'Polearm', rarity: 4 },
  { key: 'LithicSpear', name: 'Lithic Spear', type: 'Polearm', rarity: 4 },
  { key: 'TheCatch', name: 'The Catch', type: 'Polearm', rarity: 4 },
  { key: 'KitainCrossSpear', name: 'Kitain Cross Spear', type: 'Polearm', rarity: 4 },
  { key: 'WavebreakersFin', name: "Wavebreaker's Fin", type: 'Polearm', rarity: 4 },
  { key: 'Moonpiercer', name: 'Moonpiercer', type: 'Polearm', rarity: 4 },
  { key: 'BalladOfTheFjords', name: 'Ballad of the Fjords', type: 'Polearm', rarity: 4 },
  { key: 'RightfulReward', name: 'Rightful Reward', type: 'Polearm', rarity: 4 },
  { key: 'DialoguesOfTheDesertSages', name: 'Dialogues of the Desert Sages', type: 'Polearm', rarity: 4 },
  { key: 'FootprintOfTheRainbow', name: 'Footprint of the Rainbow', type: 'Polearm', rarity: 4 },

  // 3-Star Polearms
  { key: 'WhiteTassel', name: 'White Tassel', type: 'Polearm', rarity: 3 },
  { key: 'BlackTassel', name: 'Black Tassel', type: 'Polearm', rarity: 3 },

  // 5-Star Bows
  { key: 'AmosBow', name: "Amos' Bow", type: 'Bow', rarity: 5 },
  { key: 'ElegyForTheEnd', name: 'Elegy for the End', type: 'Bow', rarity: 5 },
  { key: 'ThunderingPulse', name: 'Thundering Pulse', type: 'Bow', rarity: 5 },
  { key: 'PolarStar', name: 'Polar Star', type: 'Bow', rarity: 5 },
  { key: 'AquaSimulacra', name: 'Aqua Simulacra', type: 'Bow', rarity: 5 },
  { key: 'HuntersPath', name: "Hunter's Path", type: 'Bow', rarity: 5 },
  { key: 'SkywardHarp', name: 'Skyward Harp', type: 'Bow', rarity: 5 },
  { key: 'TheFirstGreatMagic', name: 'The First Great Magic', type: 'Bow', rarity: 5 },
  { key: 'SilvershowerHeartstrings', name: 'Silvershower Heartstrings', type: 'Bow', rarity: 5 },
  { key: 'AstralVulturesCrimsonPlumage', name: "Astral Vulture's Crimson Plumage", type: 'Bow', rarity: 5 },

  // 4-Star Bows
  { key: 'Rust', name: 'Rust', type: 'Bow', rarity: 4 },
  { key: 'SacrificialBow', name: 'Sacrificial Bow', type: 'Bow', rarity: 4 },
  { key: 'TheStringless', name: 'The Stringless', type: 'Bow', rarity: 4 },
  { key: 'FavoniusWarbow', name: 'Favonius Warbow', type: 'Bow', rarity: 4 },
  { key: 'PrototypeCrescent', name: 'Prototype Crescent', type: 'Bow', rarity: 4 },
  { key: 'CompoundBow', name: 'Compound Bow', type: 'Bow', rarity: 4 },
  { key: 'BlackcliffWarbow', name: 'Blackcliff Warbow', type: 'Bow', rarity: 4 },
  { key: 'TheViridescentHunt', name: 'The Viridescent Hunt', type: 'Bow', rarity: 4 },
  { key: 'Hamayumi', name: 'Hamayumi', type: 'Bow', rarity: 4 },
  { key: 'MouunsMoon', name: "Mouun's Moon", type: 'Bow', rarity: 4 },
  { key: 'FadingTwilight', name: 'Fading Twilight', type: 'Bow', rarity: 4 },
  { key: 'KingsSquire', name: "King's Squire", type: 'Bow', rarity: 4 },
  { key: 'EndOfTheLine', name: 'End of the Line', type: 'Bow', rarity: 4 },
  { key: 'ScionOfTheBlazingSun', name: 'Scion of the Blazing Sun', type: 'Bow', rarity: 4 },
  { key: 'SongOfStillness', name: 'Song of Stillness', type: 'Bow', rarity: 4 },
  { key: 'RangeGauge', name: 'Range Gauge', type: 'Bow', rarity: 4 },
  { key: 'ChainBreaker', name: 'Chain Breaker', type: 'Bow', rarity: 4 },
  { key: 'Cloudforged', name: 'Cloudforged', type: 'Bow', rarity: 4 },

  // 3-Star Bows
  { key: 'Slingshot', name: 'Slingshot', type: 'Bow', rarity: 3 },
  { key: 'RavenBow', name: 'Raven Bow', type: 'Bow', rarity: 3 },

  // 5-Star Catalysts
  { key: 'AThousandFloatingDreams', name: 'A Thousand Floating Dreams', type: 'Catalyst', rarity: 5 },
  { key: 'KagurasVerity', name: "Kagura's Verity", type: 'Catalyst', rarity: 5 },
  { key: 'EverlastingMoonglow', name: 'Everlasting Moonglow', type: 'Catalyst', rarity: 5 },
  { key: 'MemoryOfDust', name: 'Memory of Dust', type: 'Catalyst', rarity: 5 },
  { key: 'LostPrayerToTheSacredWinds', name: 'Lost Prayer to the Sacred Winds', type: 'Catalyst', rarity: 5 },
  { key: 'SkywardAtlas', name: 'Skyward Atlas', type: 'Catalyst', rarity: 5 },
  { key: 'TulaytullahsRemembrance', name: "Tulaytullah's Remembrance", type: 'Catalyst', rarity: 5 },
  { key: 'JadefallsSplendor', name: "Jadefall's Splendor", type: 'Catalyst', rarity: 5 },
  { key: 'TomeOfTheEternalFlow', name: 'Tome of the Eternal Flow', type: 'Catalyst', rarity: 5 },
  { key: 'CashflowSupervision', name: 'Cashflow Supervision', type: 'Catalyst', rarity: 5 },
  { key: 'SurfsUp', name: "Surf's Up", type: 'Catalyst', rarity: 5 },
  { key: 'CranesEchoingCall', name: "Crane's Echoing Call", type: 'Catalyst', rarity: 5 },

  // 4-Star Catalysts
  { key: 'SacrificialFragments', name: 'Sacrificial Fragments', type: 'Catalyst', rarity: 4 },
  { key: 'TheWidsith', name: 'The Widsith', type: 'Catalyst', rarity: 4 },
  { key: 'SolarPearl', name: 'Solar Pearl', type: 'Catalyst', rarity: 4 },
  { key: 'EyeOfPerception', name: 'Eye of Perception', type: 'Catalyst', rarity: 4 },
  { key: 'FavoniusCodex', name: 'Favonius Codex', type: 'Catalyst', rarity: 4 },
  { key: 'PrototypeAmber', name: 'Prototype Amber', type: 'Catalyst', rarity: 4 },
  { key: 'MappaMare', name: 'Mappa Mare', type: 'Catalyst', rarity: 4 },
  { key: 'BlackcliffAgate', name: 'Blackcliff Agate', type: 'Catalyst', rarity: 4 },
  { key: 'Frostbearer', name: 'Frostbearer', type: 'Catalyst', rarity: 4 },
  { key: 'DodocoTales', name: 'Dodoco Tales', type: 'Catalyst', rarity: 4 },
  { key: 'HakushinRing', name: 'Hakushin Ring', type: 'Catalyst', rarity: 4 },
  { key: 'OathswornEye', name: 'Oathsworn Eye', type: 'Catalyst', rarity: 4 },
  { key: 'WanderingEvenstar', name: 'Wandering Evenstar', type: 'Catalyst', rarity: 4 },
  { key: 'FruitOfFulfillment', name: 'Fruit of Fulfillment', type: 'Catalyst', rarity: 4 },
  { key: 'FlowingPurity', name: 'Flowing Purity', type: 'Catalyst', rarity: 4 },
  { key: 'BalladOfTheBoundlessBlue', name: 'Ballad of the Boundless Blue', type: 'Catalyst', rarity: 4 },
  { key: 'RingOfYaxche', name: 'Ring of Yaxche', type: 'Catalyst', rarity: 4 },
  { key: 'SacrificialJade', name: 'Sacrificial Jade', type: 'Catalyst', rarity: 4 },

  // 3-Star Catalysts
  { key: 'ThrillingTalesOfDragonSlayers', name: 'Thrilling Tales of Dragon Slayers', type: 'Catalyst', rarity: 3 },
  { key: 'TwinNephrite', name: 'Twin Nephrite', type: 'Catalyst', rarity: 3 },
  { key: 'MagicGuide', name: 'Magic Guide', type: 'Catalyst', rarity: 3 },
];

// ============================================
// Artifact Sets
// ============================================

export const ARTIFACT_SETS: ArtifactSetData[] = [
  // Universal Sets
  {
    key: 'GladiatorsFinale',
    name: "Gladiator's Finale",
    maxRarity: 5,
    twoPiece: 'ATK +18%',
    fourPiece: 'Normal Attack DMG +35% for Sword/Claymore/Polearm users',
  },
  {
    key: 'WanderersTroupe',
    name: "Wanderer's Troupe",
    maxRarity: 5,
    twoPiece: 'Elemental Mastery +80',
    fourPiece: 'Charged Attack DMG +35% for Catalyst/Bow users',
  },
  {
    key: 'EmblemOfSeveredFate',
    name: 'Emblem of Severed Fate',
    maxRarity: 5,
    twoPiece: 'Energy Recharge +20%',
    fourPiece: 'Burst DMG +25% of Energy Recharge (max 75%)',
  },
  {
    key: 'ShimenawasReminiscence',
    name: "Shimenawa's Reminiscence",
    maxRarity: 5,
    twoPiece: 'ATK +18%',
    fourPiece: 'Using skill drains 15 Energy, Normal/Charged/Plunge DMG +50% for 10s',
  },
  {
    key: 'NoblesseOblige',
    name: 'Noblesse Oblige',
    maxRarity: 5,
    twoPiece: 'Burst DMG +20%',
    fourPiece: 'Using Burst grants party ATK +20% for 12s',
  },
  {
    key: 'ViridescentVenerer',
    name: 'Viridescent Venerer',
    maxRarity: 5,
    twoPiece: 'Anemo DMG +15%',
    fourPiece: 'Swirl DMG +60%, decreases opponent Res to swirled element by 40%',
  },

  // Elemental Reaction Sets
  {
    key: 'CrimsonWitchOfFlames',
    name: 'Crimson Witch of Flames',
    maxRarity: 5,
    twoPiece: 'Pyro DMG +15%',
    fourPiece: 'Overload/Burning DMG +40%, Vaporize/Melt DMG +15%, using Skill increases 2pc bonus',
  },
  {
    key: 'ThunderingFury',
    name: 'Thundering Fury',
    maxRarity: 5,
    twoPiece: 'Electro DMG +15%',
    fourPiece: 'Electro reaction DMG +40%, triggering reduces Skill CD by 1s',
  },
  {
    key: 'BlizzardStrayer',
    name: 'Blizzard Strayer',
    maxRarity: 5,
    twoPiece: 'Cryo DMG +15%',
    fourPiece: 'CRIT Rate +20% vs Cryo-affected, +40% vs Frozen enemies',
  },
  {
    key: 'HeartOfDepth',
    name: 'Heart of Depth',
    maxRarity: 5,
    twoPiece: 'Hydro DMG +15%',
    fourPiece: 'After using Skill, Normal/Charged ATK DMG +30% for 15s',
  },
  {
    key: 'Thundersoother',
    name: 'Thundersoother',
    maxRarity: 5,
    twoPiece: 'Electro RES +40%',
    fourPiece: 'DMG +35% vs Electro-affected enemies',
  },
  {
    key: 'Lavawalker',
    name: 'Lavawalker',
    maxRarity: 5,
    twoPiece: 'Pyro RES +40%',
    fourPiece: 'DMG +35% vs Pyro-affected enemies',
  },

  // Geo Sets
  {
    key: 'ArchaicPetra',
    name: 'Archaic Petra',
    maxRarity: 5,
    twoPiece: 'Geo DMG +15%',
    fourPiece: 'Picking up crystallize shard grants party DMG +35% for that element',
  },
  {
    key: 'RetracingBolide',
    name: 'Retracing Bolide',
    maxRarity: 5,
    twoPiece: 'Shield Strength +35%',
    fourPiece: 'While shielded, Normal/Charged ATK DMG +40%',
  },
  {
    key: 'HuskOfOpulentDreams',
    name: 'Husk of Opulent Dreams',
    maxRarity: 5,
    twoPiece: 'DEF +30%',
    fourPiece: 'Stacking DEF +6% and Geo DMG +6% (max 4 stacks)',
  },

  // Physical/HP Sets
  {
    key: 'PaleFlame',
    name: 'Pale Flame',
    maxRarity: 5,
    twoPiece: 'Physical DMG +25%',
    fourPiece: 'Skill hit grants ATK +9% for 7s (max 2 stacks), at 2 stacks Physical DMG +25%',
  },
  {
    key: 'BloodstainedChivalry',
    name: 'Bloodstained Chivalry',
    maxRarity: 5,
    twoPiece: 'Physical DMG +25%',
    fourPiece: 'After defeating enemy, Charged ATK cost -100% and DMG +50% for 10s',
  },
  {
    key: 'TenacityOfTheMillelith',
    name: 'Tenacity of the Millelith',
    maxRarity: 5,
    twoPiece: 'HP +20%',
    fourPiece: 'Skill hitting enemy grants party ATK +20% and Shield Strength +30% for 3s',
  },

  // Healing Sets
  {
    key: 'MaidenBeloved',
    name: 'Maiden Beloved',
    maxRarity: 5,
    twoPiece: 'Healing Bonus +15%',
    fourPiece: 'Using Skill/Burst increases healing received by all party members +20% for 10s',
  },
  {
    key: 'OceanHuedClam',
    name: 'Ocean-Hued Clam',
    maxRarity: 5,
    twoPiece: 'Healing Bonus +15%',
    fourPiece: 'Healing creates Sea-Dyed Foam that deals Physical DMG',
  },

  // Anemo Set
  {
    key: 'VermillionHereafter',
    name: 'Vermillion Hereafter',
    maxRarity: 5,
    twoPiece: 'ATK +18%',
    fourPiece: 'After Burst, ATK +8% for 16s, stacking up to 4 times when HP decreases',
  },

  // Newer Sets
  {
    key: 'EchoesOfAnOffering',
    name: 'Echoes of an Offering',
    maxRarity: 5,
    twoPiece: 'ATK +18%',
    fourPiece: '36% chance for Normal ATK DMG +70%, guaranteed every 0.2s if not triggered',
  },
  {
    key: 'DeepwoodMemories',
    name: 'Deepwood Memories',
    maxRarity: 5,
    twoPiece: 'Dendro DMG +15%',
    fourPiece: 'Skill/Burst hitting enemy decreases their Dendro RES by 30% for 8s',
  },
  {
    key: 'GildedDreams',
    name: 'Gilded Dreams',
    maxRarity: 5,
    twoPiece: 'Elemental Mastery +80',
    fourPiece: 'On reaction, ATK +14%/EM +50 per same/different element party member',
  },
  {
    key: 'DesertPavilionChronicle',
    name: 'Desert Pavilion Chronicle',
    maxRarity: 5,
    twoPiece: 'Anemo DMG +15%',
    fourPiece: 'Charged ATK hits increase Normal/Charged/Plunge DMG +40% for 15s',
  },
  {
    key: 'FlowerOfParadiseLost',
    name: 'Flower of Paradise Lost',
    maxRarity: 5,
    twoPiece: 'Elemental Mastery +80',
    fourPiece: 'Bloom/Hyperbloom/Burgeon DMG +40%, stacking EM bonus up to 4 times',
  },
  {
    key: 'NymphsDream',
    name: "Nymph's Dream",
    maxRarity: 5,
    twoPiece: 'Hydro DMG +15%',
    fourPiece: 'After Normal/Charged/Skill hits, gain stacks for ATK and Hydro DMG bonus',
  },
  {
    key: 'VourukashasGlow',
    name: "Vourukasha's Glow",
    maxRarity: 5,
    twoPiece: 'HP +20%',
    fourPiece: 'Skill/Burst DMG +10%, increases when HP changes up to 4 stacks',
  },
  {
    key: 'MarechausseeHunter',
    name: 'Marechaussee Hunter',
    maxRarity: 5,
    twoPiece: 'Normal/Charged ATK DMG +15%',
    fourPiece: 'When HP changes, CRIT Rate +12% for 5s (max 3 stacks)',
  },
  {
    key: 'GoldenTroupe',
    name: 'Golden Troupe',
    maxRarity: 5,
    twoPiece: 'Skill DMG +20%',
    fourPiece: 'Skill DMG +25%, +25% more when off-field',
  },
  {
    key: 'SongOfDaysPast',
    name: 'Song of Days Past',
    maxRarity: 5,
    twoPiece: 'Healing Bonus +15%',
    fourPiece: 'Healing creates Yearning effect granting Normal/Charged/Plunge/Skill/Burst DMG bonus',
  },
  {
    key: 'NighttimeWhispersInTheEchoingWoods',
    name: 'Nighttime Whispers in the Echoing Woods',
    maxRarity: 5,
    twoPiece: 'ATK +18%',
    fourPiece: 'Geo hits on shielded character grant Geo DMG +20% for 10s',
  },
  {
    key: 'FragmentOfHarmonicWhimsy',
    name: 'Fragment of Harmonic Whimsy',
    maxRarity: 5,
    twoPiece: 'ATK +18%',
    fourPiece: 'Bond of Life changes grant DMG bonus stacks',
  },
  {
    key: 'UnfinishedReverie',
    name: 'Unfinished Reverie',
    maxRarity: 5,
    twoPiece: 'ATK +18%',
    fourPiece: 'After leaving field for 1s, DMG dealt +50% for 10s after taking field',
  },
  {
    key: 'ScrollOfTheHeroOfCinderCity',
    name: 'Scroll of the Hero of Cinder City',
    maxRarity: 5,
    twoPiece: 'Nightsoul-aligned DMG +15%',
    fourPiece: 'When Nightsoul Point consumed, party Elemental DMG +12% for 15s',
  },
  {
    key: 'ObsidianCodex',
    name: 'Obsidian Codex',
    maxRarity: 5,
    twoPiece: 'When not in Nightsoul Blessing, Nightsoul-aligned DMG +15%',
    fourPiece: 'When Nightsoul Blessing active, CRIT Rate +40% and Phlogiston consumption for hits -40%',
  },

  // Early Game Sets (4-star max)
  {
    key: 'Berserker',
    name: 'Berserker',
    maxRarity: 4,
    twoPiece: 'CRIT Rate +12%',
    fourPiece: 'When HP below 70%, CRIT Rate +24%',
  },
  {
    key: 'Instructor',
    name: 'Instructor',
    maxRarity: 4,
    twoPiece: 'Elemental Mastery +80',
    fourPiece: 'Triggering reaction grants party EM +120 for 8s',
  },
  {
    key: 'TheExile',
    name: 'The Exile',
    maxRarity: 4,
    twoPiece: 'Energy Recharge +20%',
    fourPiece: 'Using Burst regenerates 2 Energy for party every 2s for 6s',
  },
  {
    key: 'DefendersWill',
    name: "Defender's Will",
    maxRarity: 4,
    twoPiece: 'DEF +30%',
    fourPiece: 'For each element in party, corresponding Elemental RES +30%',
  },
  {
    key: 'BraveHeart',
    name: 'Brave Heart',
    maxRarity: 4,
    twoPiece: 'ATK +18%',
    fourPiece: 'DMG +30% vs enemies above 50% HP',
  },
  {
    key: 'MartialArtist',
    name: 'Martial Artist',
    maxRarity: 4,
    twoPiece: 'Normal/Charged ATK DMG +15%',
    fourPiece: 'After using Skill, Normal/Charged ATK DMG +25% for 8s',
  },
  {
    key: 'Gambler',
    name: 'Gambler',
    maxRarity: 4,
    twoPiece: 'Skill DMG +20%',
    fourPiece: 'Defeating enemy has 100% chance to reset Skill CD (15s cooldown)',
  },
  {
    key: 'Scholar',
    name: 'Scholar',
    maxRarity: 4,
    twoPiece: 'Energy Recharge +20%',
    fourPiece: 'Gaining Energy regenerates 3 Energy for Bow/Catalyst party members',
  },
  {
    key: 'ResolutionOfSojourner',
    name: 'Resolution of Sojourner',
    maxRarity: 4,
    twoPiece: 'ATK +18%',
    fourPiece: 'Charged ATK CRIT Rate +30%',
  },
];

// ============================================
// Main Stats by Slot
// ============================================

export const MAIN_STATS_BY_SLOT: Record<ArtifactSlot, MainStatOption[]> = {
  flower: [{ key: 'hp', label: 'HP' }],
  plume: [{ key: 'atk', label: 'ATK' }],
  sands: [
    { key: 'hp_', label: 'HP%' },
    { key: 'atk_', label: 'ATK%' },
    { key: 'def_', label: 'DEF%' },
    { key: 'eleMas', label: 'Elemental Mastery' },
    { key: 'enerRech_', label: 'Energy Recharge' },
  ],
  goblet: [
    { key: 'hp_', label: 'HP%' },
    { key: 'atk_', label: 'ATK%' },
    { key: 'def_', label: 'DEF%' },
    { key: 'eleMas', label: 'Elemental Mastery' },
    { key: 'pyro_dmg_', label: 'Pyro DMG Bonus' },
    { key: 'hydro_dmg_', label: 'Hydro DMG Bonus' },
    { key: 'electro_dmg_', label: 'Electro DMG Bonus' },
    { key: 'cryo_dmg_', label: 'Cryo DMG Bonus' },
    { key: 'anemo_dmg_', label: 'Anemo DMG Bonus' },
    { key: 'geo_dmg_', label: 'Geo DMG Bonus' },
    { key: 'dendro_dmg_', label: 'Dendro DMG Bonus' },
    { key: 'physical_dmg_', label: 'Physical DMG Bonus' },
  ],
  circlet: [
    { key: 'hp_', label: 'HP%' },
    { key: 'atk_', label: 'ATK%' },
    { key: 'def_', label: 'DEF%' },
    { key: 'eleMas', label: 'Elemental Mastery' },
    { key: 'critRate_', label: 'CRIT Rate' },
    { key: 'critDMG_', label: 'CRIT DMG' },
    { key: 'heal_', label: 'Healing Bonus' },
  ],
};

// ============================================
// Substats
// ============================================

export const SUBSTATS: MainStatOption[] = [
  { key: 'hp', label: 'HP' },
  { key: 'hp_', label: 'HP%' },
  { key: 'atk', label: 'ATK' },
  { key: 'atk_', label: 'ATK%' },
  { key: 'def', label: 'DEF' },
  { key: 'def_', label: 'DEF%' },
  { key: 'eleMas', label: 'Elemental Mastery' },
  { key: 'enerRech_', label: 'Energy Recharge' },
  { key: 'critRate_', label: 'CRIT Rate' },
  { key: 'critDMG_', label: 'CRIT DMG' },
];

// ============================================
// Helper Functions
// ============================================

/**
 * Get weapons filtered by type and optionally by rarity
 */
export function getWeaponsByType(type: WeaponType, minRarity?: WeaponRarity): WeaponData[] {
  return WEAPONS.filter(
    (w) => w.type === type && (minRarity === undefined || w.rarity >= minRarity)
  ).sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
}

/**
 * Get all weapon types
 */
export function getWeaponTypes(): WeaponType[] {
  return ['Sword', 'Claymore', 'Polearm', 'Bow', 'Catalyst'];
}

/**
 * Get artifact sets, optionally filtered by max rarity
 */
export function getArtifactSets(minMaxRarity?: 4 | 5): ArtifactSetData[] {
  if (minMaxRarity === undefined) return ARTIFACT_SETS;
  return ARTIFACT_SETS.filter((s) => s.maxRarity >= minMaxRarity);
}

/**
 * Find a weapon by key
 */
export function findWeapon(key: string): WeaponData | undefined {
  return WEAPONS.find((w) => w.key === key);
}

/**
 * Find an artifact set by key
 */
export function findArtifactSet(key: string): ArtifactSetData | undefined {
  return ARTIFACT_SETS.find((s) => s.key === key);
}

# Spec: Imaginarium Theatre Readiness Calculator (Lunar-aware)

Status: v1.0 — complete, awaiting Monty's sign-off before driver dispatch.
This spec is the controlled variable of a model comparison. It must be
followed as written; ambiguities should be raised as questions, not resolved
silently. You have no prior knowledge of this repo — every convention you
need is stated here or discoverable in the referenced files.

## 1. Product goal

Genshin Impact's Imaginarium Theatre is a monthly game mode. Each month
("season") features 3 of the game's 7 elements. Players field a roster of
their characters; higher difficulties require larger eligible rosters:

| Difficulty | Min roster | Min character level | Unlock requirement |
|---|---|---|---|
| Easy | 8 | 60 | — |
| Normal | 12 | 60 | — |
| Hard | 16 | 70 | — |
| Visionary | 22 | 70 | clear Hard (same season) |
| Lunar | 28 | 70 | clear Visionary (same season) |

A character is **eligible** for a season iff at least one of:
- its element is one of the season's 3 featured elements AND its level
  meets the difficulty's minimum
- it is one of the season's 4 **Special Guests** AND the player owns it at
  the difficulty's minimum level (no trials for guests; guests bypass the
  element restriction)
- it is one of the season's 6 **Opening Characters** — these ALWAYS count,
  regardless of ownership or level, because the game offers a free Lv. 90
  trial version as an alternative to your own copy. Each opener counts
  exactly once (never double-count an owned opener and its trial).

The player may also borrow 1 friend's character ("Supporting Cast"), but
it does NOT count toward the minimum — the minimum must be met from the
eligible set above; the borrow is an extra body on top. Do not model it.

The feature answers: "For the selected season, which difficulties can I
field, and if I can't, how short am I and which of my characters would
qualify if leveled?"

## 2. Scope

IN: static season data (official + beta-sourced future seasons), a pure
domain module computing readiness, a leveling planning mode for short
difficulties (section 5b), a beta-season parser (section 6), a new
roster subtab UI at `/roster/theater`, unit tests for all domain logic.

OUT: clear tracking/history, HoYoLAB integration, team suggestions,
Vigor/Blessing simulation, stage-modifier (Lunar reaction) scoring beyond a
static "advantage" note field, any live network fetching from the PWA.

## 3. Repo conventions you MUST follow

- Stack: React 18 + TypeScript (strict) + Vite; Dexie (IndexedDB) storage;
  Tailwind (dark palette: `bg-slate-800 border-slate-700 text-slate-100`);
  icons from `lucide-react`; shared UI in `src/components/ui` (`Card`,
  `CardHeader`, `CardContent` named exports; `Badge` default export).
- Features live in `src/features/<name>/` with subfolders
  `data/ domain/ components/ pages/ hooks/` and a barrel `index.ts`.
  Domain files are pure functions + exported types, NO React imports,
  with a colocated `X.test.ts` sibling.
- Owned characters: Dexie table `db.characters` (`src/db/schema.ts`),
  row type `Character` in `src/types/index.ts`. IMPORTANT: rows store
  `key` and `level` but NO element/name/rarity — join static metadata via
  `getCharacterMetadata(key)` from
  `src/features/roster/data/characterMetadata.ts` (returns
  `{ key, element, weaponType, rarity } | undefined`; element values are
  capitalized: `'Pyro' | 'Hydro' | 'Anemo' | 'Electro' | 'Dendro' |
  'Cryo' | 'Geo'`). Do NOT use the lowercase `Element` type from
  `src/lib/constants/elements.ts` for eligibility logic; use the
  capitalized convention of `src/lib/constants/characterList.ts`.
- Reactive reads: `useLiveQuery` from `dexie-react-hooks` inside a feature
  hook, returning `{ ..., isLoading: x === undefined }` — copy the shape of
  `src/features/roster/hooks/useCharacters.ts`.
- Character display names/portraits: `getDisplayName`,
  `getCharacterPortraitUrlByKey` from `src/lib/gameData.ts`.
- Tests: Vitest, jsdom, globals enabled but imports written explicitly
  (`import { describe, it, expect } from 'vitest'`), colocated test files,
  nested `describe` per function, `it('should ...')` phrasing in domain
  tests. Time-dependent logic uses `vi.useFakeTimers()` +
  `vi.setSystemTime(...)`. Character fixtures: declare a local
  `makeCharacter(overrides: Partial<Character> = {}): Character` factory in
  the test file (see `src/features/roster/components/CharacterCard.test.tsx`
  for the canonical shape).
- Character `key` values in this repo mix Enka-style and spaced forms
  (`'Hu Tao'`, `'KaedeharaKazuha'`); `getCharacterMetadata` already
  normalizes case and spaces. Season data must use keys that exist in
  `ALL_CHARACTERS` (`src/lib/constants/characterList.ts`).
- Routing: `src/app/routes.tsx` (`createBrowserRouter`), pages lazy-loaded
  via the file's `routeElement(...)` helper. Add child `{ path: 'theater',
  element: routeElement(<TheaterTab />) }` under the `roster` route, and a
  tab entry to `SUB_TABS` in
  `src/features/roster/components/RosterSubNav.tsx`.
- `npm run lint` runs eslint with `--max-warnings 0`; the suite must stay
  green: `npm run test:run` (baseline 150 files / 2079 tests passing).

## 4. Data model (new file: `src/features/theater/data/theaterSeasons.ts`)

```ts
export type TheaterElement =
  'Pyro' | 'Hydro' | 'Anemo' | 'Electro' | 'Dendro' | 'Cryo' | 'Geo';

export interface TheaterSeason {
  id: string;               // 'YYYY-MM'
  startDate: string;        // ISO date, 1st of month
  elements: [TheaterElement, TheaterElement, TheaterElement];
  openingCharacters: string[];  // 6 character keys
  specialGuests: string[];      // 4 character keys
  source: 'official' | 'beta';  // beta = leaked/tentative, may change
  advantageNotes?: string;      // free text, e.g. 'Lunar-Charged reactions
                                // have an advantage'
}

export const THEATER_SEASONS: TheaterSeason[] = [ /* seed below */ ];
export function getSeasonById(id: string): TheaterSeason | undefined;
export function getCurrentSeason(now: Date): TheaterSeason | undefined;
```

Seed with the confirmed August 2026 season (source 'official'), using
these EXACT keys (verified against `ALL_CHARACTERS`):
elements `['Hydro', 'Electro', 'Cryo']`; openingCharacters `['Yelan',
'Aino', 'Flins', 'Ororon', 'Skirk', 'Layla']`; specialGuests
`['Arlecchino', 'Chevreuse', 'KaedeharaKazuha', 'Tighnari']`.
Future beta seasons will be added via the
section 6 parser; the module must not assume seasons are contiguous.

## 5. Domain module (new file: `src/features/theater/domain/readiness.ts`)

Pure functions, no React, no Dexie imports — accept plain arrays.

```ts
export type TheaterDifficulty =
  'easy' | 'normal' | 'hard' | 'visionary' | 'lunar';

export interface DifficultyRule {
  difficulty: TheaterDifficulty;
  minRoster: number;      // 8/12/16/22/28
  minLevel: number;       // 60/60/70/70/70
  requiresClear?: TheaterDifficulty; // visionary->hard, lunar->visionary
}
export const DIFFICULTY_RULES: DifficultyRule[]; // ordered easy->lunar

export type EligibilityReason =
  'element' | 'openingOwned' | 'openingTrial' | 'specialGuest';

export interface EligibleCharacter {
  key: string;
  reason: EligibilityReason;
  level: number | null;   // null for unowned trial openers
}

export interface DifficultyReadiness {
  difficulty: TheaterDifficulty;
  required: number;
  eligibleCount: number;        // own roster + openers/trials + owned guests
  ready: boolean;
  shortfall: number;            // max(0, required - eligibleCount)
  eligible: EligibleCharacter[];
  nearMiss: { key: string; level: number; levelsNeeded: number }[];
    // owned, element/guest-qualified, but below minLevel
  blockedByUnlock: boolean;     // requiresClear chain not satisfiable
    // (defined as: the prerequisite difficulty itself is not ready)
}

export interface SeasonReadiness {
  seasonId: string;
  difficulties: DifficultyReadiness[]; // all 5, ordered
}

export function computeSeasonReadiness(
  season: TheaterSeason,
  ownedCharacters: Character[]    // from db, element joined internally via
                                  // getCharacterMetadata
): SeasonReadiness;
```

Rules the implementation must honor:
- A character counts exactly once, under the highest-priority applicable
  reason: openingOwned > specialGuest > element for owned characters.
- ALL 6 Opening Characters are always eligible at every difficulty
  irrespective of ownership and level (a free Lv. 90 trial is always
  available in place of your copy). Owned openers appear once as
  `openingOwned` with their real level; unowned openers appear as
  `openingTrial` with `level: null`. Never emit both for the same key.
- Unowned special guests do NOT count. Owned guests count regardless of
  element but must meet the difficulty's level floor.
- The Supporting Cast borrow is NOT modeled: it never contributes to
  `eligibleCount` (it cannot be used to reach the minimum).
- `nearMiss` lists owned characters that would be eligible but for level
  (element-matching or guest characters below the floor — never openers,
  which are always eligible), sorted by `levelsNeeded` ascending.
- Characters whose key has no metadata (mods/unknown) are skipped silently.
- `blockedByUnlock` for lunar must chain through visionary -> hard.

## 5b. Planning mode (new file: `src/features/theater/domain/levelingPlan.ts`)

When a difficulty has `shortfall > 0`, the user can plan their way to the
minimum: pick owned characters to level to the floor and see the resin and
calendar-days cost. REUSE the existing planning machinery — do not
reimplement material math:

- `calculateAscensionSummary(goal, inventory, options)` from
  `src/lib/planning/ascensionCalculator.ts` (async; returns
  `AscensionSummary` with `estimatedResin`, `totalMora`, `totalExp`).
  Build goals with `targetLevel` = the difficulty's `minLevel`,
  `targetAscension` = `getAscensionPhase(minLevel)` (same file), and
  talents unchanged (targets equal currents, so talent materials are 0).
  Pass an empty inventory `{}` (assume nothing owned) and, in tests,
  `{ skipApiFetch: true }`.
- `estimateFarmingDays(totalResin, dailyBudget)` and `DAILY_RESIN_REGEN`
  from `src/features/planner/domain/resinCalculator.ts`.

Domain API (pure parts sync, orchestration async):

```ts
export interface LevelingCandidate {
  key: string;
  level: number;
  levelsNeeded: number;    // minLevel - level
}
// Owned characters that would become eligible for the difficulty if
// leveled to its floor: exactly the nearMiss set from DifficultyReadiness.
// Sorted by levelsNeeded ascending, ties by key.
export function selectLevelingCandidates(
  readiness: DifficultyReadiness
): LevelingCandidate[];

export interface LevelingPlan {
  selectedKeys: string[];
  totalResin: number;
  totalMora: number;
  totalExp: number;
  daysNeeded: number;          // estimateFarmingDays(totalResin, dailyResin)
  coversShortfall: boolean;    // selectedKeys.length >= shortfall
}
export function aggregateLevelingPlan(
  summaries: AscensionSummary[],   // one per selected character
  shortfall: number,
  dailyResin?: number              // default DAILY_RESIN_REGEN
): LevelingPlan;
```

Behavior:
- Default selection = the first `shortfall` candidates; the user can
  toggle candidates in the UI (selection state is component-local, not
  persisted).
- If candidates.length < shortfall, the plan renders with
  `coversShortfall: false` and the UI states that leveling alone cannot
  reach the minimum (more characters are needed).
- `daysNeeded` uses ceiling division; 0 resin -> 0 days.

## 6. Beta-season parser

New pure module `src/features/theater/data/parseRoleCombat.ts`. The upstream
source is a community beta-data mirror serving one JSON object keyed by
season id (numeric string). NO network code — the module parses a string;
fetching happens outside the app (out of scope here). Commit the fixture in
Appendix A verbatim as
`src/features/theater/data/__fixtures__/rolecombat-sample.json` and test
against it.

Input format per season entry:
- `element`: array of numeric codes, mapping `2=Pyro, 3=Hydro, 4=Dendro,
  5=Electro, 6=Cryo, 7=Anemo, 8=Geo`; a trailing `0` is an unused slot and
  must be ignored.
- `invite`: 4 avatar ids = Special Guests. `buff`: 6 avatar ids = Opening
  Characters.
- `live_begin`/`live_end`: present only once real dates are known
  (ISO-like, server time). When absent, infer the season's month from its
  id: season id N corresponds to month 2024-04 plus N months (validated:
  season 28 = 2026-08).

API:

```ts
export interface ParsedSeasonResult {
  seasons: TheaterSeason[];       // sorted by id ascending
  unknownAvatarIds: number[];     // ids with no key mapping, deduped
}
export function parseRoleCombat(
  json: string,
  options?: { minSeasonId?: number } // default 28; skip older entries
): ParsedSeasonResult;
```

Rules:
- Resolve avatar ids to character keys by inverting `CHARACTER_KEY_TO_ID`
  from `src/lib/characterData.ts`. That map is lowercase-keyed and
  many-to-one (aliases like `kazuha`/`kaedeharakazuha` share an id); pick
  the alias whose spelling `getCharacterMetadata` resolves to an
  `ALL_CHARACTERS` entry, preferring exact `ALL_CHARACTERS` key casing in
  the output (e.g. id 10000047 -> `'KaedeharaKazuha'`, 10000105 ->
  `'Ororon'`). Ids with no mapping (unreleased characters) are omitted
  from the season's arrays and reported in `unknownAvatarIds` — a season
  with unknowns is still emitted (partial data beats none).
- `TheaterSeason.id` = `'YYYY-MM'` from `live_begin` when present, else
  the id-arithmetic rule. `startDate` = `live_begin` date when present,
  else the 1st of the inferred month.
- `source`: `'official'` if `live_begin` is present, else `'beta'`.
- Malformed entries (missing `element`/`invite`/`buff`, unknown element
  codes) are skipped, never thrown; the function must not throw on any
  string input — invalid JSON returns `{ seasons: [], unknownAvatarIds: [] }`.

Required fixture-driven tests: season 28 parses to EXACTLY the section 4
seed (elements, all 10 keys, source 'official'); season 29 has live_begin
in the fixture, so it parses as 'official' with id '2026-09'; season 30
(no live dates) infers '2026-10' with source 'beta'; unknown-id handling
verified via id 10000150 if it has
no repo mapping at implementation time (assert on parser behavior, not on
the specific id remaining unknown); `minSeasonId` filtering; invalid JSON
and malformed-entry tolerance.

Merging: `THEATER_SEASONS` (hand-seeded, section 4) is the authority for
its months; `getAllSeasons()` in `theaterSeasons.ts` should accept
optional parsed seasons and de-duplicate by month id, preferring
'official' source, then hand-seeded entries.

## 7. UI (new files under `src/features/theater/`)

- `pages/TheaterTab.tsx` (default export): season selector (all seasons,
  newest first, current preselected; beta seasons visibly badged
  'Beta — subject to change') and five `DifficultyReadinessCard`s.
- `components/DifficultyReadinessCard.tsx`: shows difficulty name,
  eligible/required (e.g. '24 / 28'), a ready/short state (green check /
  amber shortfall count), reason breakdown counts (element / openers /
  trial / guests), and when short: the top nearMiss characters with levels
  needed. Use `Card`/`CardHeader`/`CardContent`, existing badge variants,
  and follow `src/features/dashboard/components/TodayFarmingWidget.tsx`
  as the visual reference. When short, the card offers an expandable
  planning panel (`components/LevelingPlanPanel.tsx`): candidate list with
  checkboxes (default = top-shortfall selection), and the computed
  resin total, mora, EXP, and days at `DAILY_RESIN_REGEN` — plus the
  cannot-cover message when applicable (section 5b).
- `hooks/useTheaterReadiness.ts`: joins `useCharacters()` (or
  `characterRepo.getAll()` via `useLiveQuery`) with the selected season and
  calls `computeSeasonReadiness`.
- Barrel `index.ts`; route + subnav wiring per section 3. Also update the
  routes tables in `claude.md` and `README.md`.

Accessibility: interactive elements need accessible names; the readiness
state must not be conveyed by color alone (include text).

## 8. Acceptance criteria

1. `npm run lint`, `npm run build`, `npm run test:run` all exit 0; no
   existing test modified except additively where a routing/nav test
   legitimately needs the new tab registered.
2. Domain tests cover at minimum: empty roster; roster below/at/above each
   threshold; trial-opener counting (unowned openers push an otherwise
   short roster over a threshold); owned vs unowned special guests;
   level-floor boundaries (59/60, 69/70) incl. nearMiss population;
   owned-but-underleveled opener still counts (via trial) and never
   appears in nearMiss; no double-count when an opener is owned;
   reason-priority (a guest who also matches element
   reports 'specialGuest'); unknown-key skip; lunar blockedByUnlock chain.
3. `getCurrentSeason` respects season start dates (fake timers in tests).
3b. Planning-mode tests: candidate selection equals nearMiss ordering;
   aggregation sums resin/mora/exp across summaries and computes
   `daysNeeded` by ceiling division (incl. 0-resin case);
   `coversShortfall` false when candidates < shortfall; goal construction
   targets the difficulty floor with `getAscensionPhase` and zero talent
   deltas; `calculateAscensionSummary` called with `skipApiFetch: true`
   in tests (no network).
4. `/roster/theater` renders with an empty DB (no crash, sensible empty
   state) and with a seeded roster.
5. The August 2026 season data matches section 4's seed exactly.
6. A short self-report (REPORT.md in the worktree root, untracked pattern
   fine): what was built, what passes, known gaps. Accuracy of this report
   is itself evaluated.

## 9. Deliverable form

Work only inside your assigned worktree/branch. Commit in coherent units
with `feat:`/`test:` prefixes, lowercase summaries. Do not touch files
outside the feature + wiring points listed above. Run typecheck and tests
before declaring done.

## Appendix A — parser fixture (commit verbatim)

```json
{
  "28": {
    "begin": "2026-08-04 04:00:00",
    "end": "2026-08-05 03:59:59",
    "element": [
      3,
      5,
      6,
      0
    ],
    "invite": [
      10000096,
      10000090,
      10000047,
      10000069
    ],
    "buff": [
      10000060,
      10000121,
      10000120,
      10000105,
      10000114,
      10000074
    ],
    "live_begin": "2026-08-01 04:00:00",
    "live_end": "2026-09-01 03:59:59"
  },
  "29": {
    "begin": "2026-08-05 04:00:00",
    "end": "2026-08-06 03:59:59",
    "element": [
      3,
      5,
      4,
      0
    ],
    "invite": [
      10000150,
      10000133,
      10000043,
      10000131
    ],
    "buff": [
      10000125,
      10000025,
      10000071,
      10000065,
      10000119,
      10000081
    ],
    "live_begin": "2026-09-01 04:00:00",
    "live_end": "2026-10-01 03:59:59"
  },
  "30": {
    "begin": "2026-08-06 04:00:00",
    "end": "2026-08-25 03:59:59",
    "element": [
      3,
      6,
      7,
      0
    ],
    "invite": [
      10000116,
      10000058,
      10000050,
      10000094
    ],
    "buff": [
      10000087,
      10000014,
      10000107,
      10000015,
      10000075,
      10000132
    ]
  },
  "31": {
    "begin": "2026-08-25 04:00:00",
    "end": "2026-09-11 16:00:00",
    "element": [
      3,
      5,
      8,
      0
    ],
    "invite": [
      10000035,
      10000039,
      10000122,
      10000124
    ],
    "buff": [
      10000060,
      10000121,
      10000120,
      10000031,
      10000030,
      10000100
    ]
  }
}
```

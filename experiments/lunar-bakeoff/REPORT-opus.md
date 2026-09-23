# REPORT — Imaginarium Theatre Readiness Calculator

Implementation of `experiments/lunar-bakeoff/spec.md` v1.0 on branch
`feature/lunar-calc-opus`.

## What was built

New feature folder `src/features/theater/` with the conventional
`data/ domain/ components/ pages/ hooks/` layout and a barrel `index.ts`.

### Data (`data/theaterSeasons.ts`)

- `TheaterElement`, `TheaterSeason` types exactly as specified.
- `THEATER_SEASONS` seeded with the August 2026 season: elements
  `['Hydro','Electro','Cryo']`, openers `['Yelan','Aino','Flins','Ororon','Skirk','Layla']`,
  guests `['Arlecchino','Chevreuse','KaedeharaKazuha','Tighnari']`, `source: 'official'`,
  `advantageNotes: 'Lunar-Charged reactions have an advantage'`. All 10 keys were verified
  to exist in `ALL_CHARACTERS` (a test asserts this).
- `getSeasonById`, `getCurrentSeason(now)`, `getAllSeasons(parsedSeasons?)`.
  Nothing assumes seasons are contiguous.

### Beta parser (`data/parseRoleCombat.ts`)

- Pure, no network. `parseRoleCombat(json, { minSeasonId = 28 })` returns
  `{ seasons, unknownAvatarIds }`; never throws on any string input.
- Element codes 2–8 mapped, trailing `0` ignored; entries with an unknown code,
  a missing `element`/`invite`/`buff`, or a non-object body are skipped.
- Avatar-id resolution walks `ALL_CHARACTERS` through `getAvatarIdFromKey`, which
  inverts `CHARACTER_KEY_TO_ID` while guaranteeing canonical `ALL_CHARACTERS`
  casing and resolving alias collisions (10000047 → `KaedeharaKazuha`,
  10000105 → `Ororon`). Entries also require `getCharacterMetadata` to resolve.
- `live_begin` present → `source: 'official'`, id/startDate from that date;
  absent → `source: 'beta'`, month inferred as 2024-04 + N months
  (season 28 → `2026-08`, validated by test).
- Fixture from Appendix A committed verbatim at
  `data/__fixtures__/rolecombat-sample.json` and used by the tests.

### Domain (`domain/readiness.ts`)

`DIFFICULTY_RULES`, `computeSeasonReadiness(season, ownedCharacters)` returning
`SeasonReadiness`. Honors: single-count with priority
openingOwned > specialGuest > element; all 6 openers always eligible (owned →
`openingOwned` with real level, unowned → `openingTrial` with `level: null`, never
both); unowned guests excluded, owned guests element-free but level-gated;
Supporting Cast not modeled; `nearMiss` sorted by `levelsNeeded` ascending
(key as tie-break) and never containing openers; unknown-metadata keys skipped
silently; `blockedByUnlock` chaining lunar → visionary → hard.
Two small helpers (`getDifficultyRule`, `countByReason`, plus `DIFFICULTY_LABELS`)
exist purely to keep display logic out of the components.

### Planning mode (`domain/levelingPlan.ts`)

`selectLevelingCandidates`, `defaultSelection`, `buildLevelingGoal`,
`aggregateLevelingPlan`, and the async `computeLevelingPlan`. Material math is
delegated to `calculateAscensionSummary` / `getAscensionPhase` from
`src/lib/planning/ascensionCalculator.ts` with an empty inventory `{}`, and days
come from `estimateFarmingDays` / `DAILY_RESIN_REGEN`. Goals target the
difficulty's floor with talents unchanged (zero talent deltas).

### UI

- `pages/TheaterTab.tsx` (default export): labelled season `<select>` (newest
  first, current preselected), element badges, a `Beta — subject to change` badge
  for beta seasons, line-up summary, advantage note, an empty-roster callout
  linking to `/imports`, and five `DifficultyReadinessCard`s.
- `components/DifficultyReadinessCard.tsx`: eligible/required (`24 / 28`),
  ready/short state rendered as icon **plus text** (`Ready` / `N short`), reason
  breakdown counts, unlock-lock note, top-5 near-miss list, and an
  `aria-expanded` toggle for the planning panel when short.
- `components/LevelingPlanPanel.tsx`: labelled checkboxes defaulting to the
  top-`shortfall` selection (component-local state), resin/mora/EXP/days at
  `DAILY_RESIN_REGEN`, and the "leveling alone cannot reach the minimum" message
  when candidates < shortfall.
- `hooks/useTheaterReadiness.ts`: `useLiveQuery` over `characterRepo.getAll()`
  joined with the selected season, returning `isLoading: characters === undefined`.
- Wiring: `{ path: 'theater', element: routeElement(<TheaterTab />) }` under
  `roster` in `src/app/routes.tsx`; a `Theater` entry in `SUB_TABS` in
  `RosterSubNav.tsx`; route rows added to `claude.md` and `README.md`.

## Commands run

| Command | Result |
|---|---|
| `npx vitest run src/features/theater` | PASS — 5 files, 81 tests |
| `npm run lint` | PASS — exit 0, no output (eslint `--max-warnings 0`) |
| `npm run build` | PASS — `tsc` clean, `vite build` succeeded in 8.95s |
| `npm run test:run` | PASS — 155 files, 2160 tests, 0 failures |

The spec quotes a baseline of 150 files / 2079 tests; this repo's actual baseline
before my changes was 150 files / 2079 tests, and 155 / 2160 after (+5 files,
+81 tests). No existing test was modified or deleted. No existing test needed the
new tab registered, so no additive edits to existing tests were required either.

## Test coverage against acceptance criteria

- §8.2 domain tests (22 in `readiness.test.ts`): empty roster; below/at/above each
  threshold; trial openers pushing a short roster over Easy; owned vs unowned
  guests; guests bypassing the element restriction; 59/60 and 69/70 boundaries
  with nearMiss population and ordering; owned-but-underleveled opener counting
  via trial and staying out of nearMiss; no double-count for an owned opener;
  reason priority (a guest who also matches element reports `specialGuest`);
  unknown-key skip; non-featured-element skip; the full lunar blockedByUnlock
  chain plus its unblocking; duplicate-roster-row and key-spacing handling.
- §8.3 `getCurrentSeason` uses `vi.useFakeTimers()` + `vi.setSystemTime(...)`
  for in-month, first-instant, before-start, and after-month cases.
- §8.3b planning tests (19 in `levelingPlan.test.ts`): candidate selection equals
  nearMiss ordering; ceiling-division `daysNeeded` including the 0-resin case and
  a custom daily budget; `coversShortfall` false when candidates < shortfall;
  goal construction targeting the floor via `getAscensionPhase` with zero talent
  deltas; `calculateAscensionSummary` asserted to be called with `{}` inventory
  and `{ skipApiFetch: true }`; one test runs the real calculator offline and
  asserts `fetch` was never called.
- §8.4 `TheaterTab.test.tsx` renders with an empty roster (empty state, 6 trial
  openers counted, all five cards) and with a seeded roster (ready/short text,
  near-miss list, plan-panel toggle).
- §8.5 a test asserts the seeded August 2026 season, and a parser test asserts
  season 28 parses to exactly that seed's elements, opener list, guest list, and
  `source: 'official'`.

## Spec ambiguities resolved

1. **`CHARACTER_KEY_TO_ID` is not exported.** §6 says to invert it, but the const
   is module-private in `src/lib/characterData.ts`. Rather than widen an existing
   module's API (§9 says not to touch files outside the listed wiring points), I
   invert it indirectly: walk `ALL_CHARACTERS` and call the already-exported
   `getAvatarIdFromKey` on each key. This is the same inversion, and it directly
   implements the "prefer exact `ALL_CHARACTERS` key casing" rule rather than
   post-processing alias strings. Verified to give `KaedeharaKazuha` and `Ororon`.
2. **`unknownAvatarIds` ordering** is unspecified beyond "deduped". I sort
   numerically ascending for determinism, and assert that in a test.
3. **`startDate` from `live_begin`.** `live_begin` is a datetime
   (`2026-08-01 04:00:00`) but `TheaterSeason.startDate` is documented as an ISO
   *date*. I take the date portion (`2026-08-01`), keeping seeded and parsed
   seasons in one format.
4. **`getAllSeasons` precedence.** §6 calls `THEATER_SEASONS` "the authority for
   its months" but then says to prefer `'official'` source *then* hand-seeded
   entries. I implemented official-first with hand-seeded winning ties. Both
   readings agree today because every seeded entry is `'official'`; the
   divergence only appears if a beta seed ever collides with an official parse.
5. **`getCurrentSeason` with non-contiguous seasons.** Defined as: the season
   whose `startDate` has passed *and* whose calendar month has not elapsed. A gap
   month therefore returns `undefined` rather than falling back to a stale season.
6. **`blockedByUnlock`.** Implemented as the spec's parenthetical (the
   prerequisite difficulty is itself not ready), with the prerequisite's own
   blocked flag OR'd in so lunar chains through visionary → hard as §5 requires.
7. **Unknown ids inside a skipped entry.** The spec is silent. Conservatively,
   ids from an entry that is skipped as malformed are *not* reported in
   `unknownAvatarIds` (tested), so the list only describes emitted seasons.
8. **Planning-mode API surface.** §5b names only `selectLevelingCandidates` and
   `aggregateLevelingPlan` but §8.3b requires testing goal construction and the
   `skipApiFetch` call. I added `buildLevelingGoal`, `defaultSelection`, and the
   async orchestrator `computeLevelingPlan` (which §5b's "orchestration async"
   note implies) to make those observable.

## Known gaps and deviations

- **The parser is not wired into the app.** §6 says fetching happens outside the
  app and §2 puts live network fetching out of scope, so `getAllSeasons()` is
  called with no arguments from the hook. The consequence: the UI currently
  offers exactly one season (August 2026), so the season selector is functional
  but single-entry, and no beta-badged season is reachable at runtime. The beta
  badge and beta ordering are covered by unit tests, not by a live surface.
- **`LevelingPlanPanel` does not pass `skipApiFetch`.** In the app it uses the
  normal planner path, which may consult the genshin-db cache/API exactly like
  the existing planner surfaces do. §5b only mandates `skipApiFetch: true` *in
  tests*. If you want the theatre panel to be strictly offline, that is a
  one-line change.
- **No E2E test** for `/roster/theater`. §8 asks only for the route to render,
  which is covered by the component test; I did not add a Playwright spec.
- **`advantageNotes` is not populated by the parser** — the upstream format
  carries no such field, so only hand-seeded seasons have it.
- **Difficulty clear state is not tracked** (out of scope per §2), so
  `blockedByUnlock` is derived from readiness of the prerequisite rather than
  from an actual recorded clear.
- `package-lock.json` shows as modified in `git status`; that predates this work
  and I left it untouched and uncommitted.

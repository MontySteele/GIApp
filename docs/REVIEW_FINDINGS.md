# Code Review Findings (September 2026)

Full-codebase review performed before deciding whether to host GIApp publicly.
Every HIGH finding was verified by reading the code directly; MED/LOW findings
come from focused area reviews and were spot-checked.

Each finding has a stable ID (`AREA-nn`) so the sprint plan and commits can
reference it. **Status** is one of `open`, `sprint` (scheduled in
`CLEANUP_SPRINT.md`), `fixed`, `deferred` (hosting/feature work, not a bug),
or `wontfix`.

Toolchain state at time of review: `tsc` clean, ESLint clean (0 warnings),
Vitest 155 files / 2160 tests passing, `vite build` succeeds (~2.5 MB JS).

---

## G — Gacha model, pity, calculators, ledger

| ID | Sev | Finding | Where | Status |
|---|---|---|---|---|
| G-01 | HIGH | Weapon banner uses 50/50 featured odds instead of 75/25. `getFeaturedProbability` returns `0.5` for any banner without Capturing Radiance. | `src/features/calculator/domain/pityEngine.ts:23` | sprint |
| G-02 | HIGH | Monte Carlo worker never applies Epitomized Path. `fatePoints` is initialised but never read or incremented in the pull loop, so weapon-target odds ignore the fate-point guarantee. | `src/workers/montecarlo.worker.ts:270-283` | sprint |
| G-03 | HIGH | Capturing Radiance is double-counted: a flat 55% featured rate *plus* a hard guarantee after 3 losses. The community 55% figure is already the effective rate of the state machine (50/50/75/100 by consecutive losses), so displayed featured odds are optimistic. | `pityEngine.ts:22-31` | sprint |
| G-04 | HIGH | Two independent pity replay engines with different tie-breaking. Calculators use `wishReplay` (timestamp → createdAt → gachaId); the history page uses `wishAnalyzer` (timestamp → array index, which falls back to random UUID order). 10-pulls share one timestamp, so recorded pity can differ by up to 9 between pages. | `src/features/wishes/domain/wishAnalyzer.ts:61-71`, `wishReplay.ts` | sprint |
| G-05 | HIGH | Weapon fate points can never accrue from history: the replay only increments when `chartedWeapon` is truthy, and every mapper stores `null`. The analyzer instead *resets* fate points on any non-standard 5★. | `wishReplay.ts:133`, `wishAnalyzer.ts:145-154`, `wishNormalization.ts:51` | sprint |
| G-06 | HIGH | Latent: worker double-counts income across multiple targets (adds `days(now→target_i) * income` for every target instead of the delta). Only latent because the sole caller passes `incomePerDay: 0`. | `montecarlo.worker.ts:243-246,367-387` | sprint |
| G-07 | MED | Fate points still capped at 2; reduced to 1 in Version 5.0. Present in constants, worker copy, replay, and UI validation ("0-2"). | `src/lib/constants.ts:41`, `montecarlo.worker.ts:23`, `wishReplay.ts:117`, `MultiTargetCalculator.tsx:236` | sprint |
| G-08 | MED | Weapon hard pity is 77 in the rules table but 80 in the pity header UI. | `constants.ts:36` vs `PityHeader.tsx:109` | sprint |
| G-09 | MED | Worker carries its own copy of `GACHA_RULES` "to avoid path resolution issues", so fixes to `constants.ts` never reach the simulation. | `montecarlo.worker.ts:5-41` | sprint |
| G-10 | MED | Standard-banner targets in the sim require `wasFeatured`, halving success for no reason. | `montecarlo.worker.ts:278` | sprint |
| G-11 | MED | Target wizard's worst case is 90 pulls per copy; `campaignPlan` correctly uses 180. Wizard tells users they "cover hard pity" when they can still lose the 50/50. | `src/features/targets/domain/targetWizard.ts:113` | sprint |
| G-12 | MED | Standard 5★ pool omits Primordial Jade Winged-Spear (TS and Rust copies). Losing to it is recorded as a featured win. | `src/features/wishes/lib/standardPool.ts:17-29`, `src-tauri/src/wish_fetcher.rs:6-16` | sprint |
| G-13 | MED | Chronicled Wish "featured" heuristic treats any non-standard 5★ as a win; losing on Chronicled yields non-charted ex-limited items. | `standardPool.ts:45-47` | open |
| G-14 | MED | Wish timestamps hard-coded to UTC-5 (NA). EU/Asia users' wishes shift 6–13 h and break banner-period attribution. The `region` param in the pasted URL is ignored. | `src/features/wishes/lib/wishNormalization.ts:12` | sprint |
| G-15 | MED | Free Acquaint Fates valued at 160 primos in income reconstruction, inflating "earned" totals. | `historicalReconstruction.ts:26-31`, `resourceCalculations.ts:96-112` | open |
| G-16 | MED | No test pins a known gacha number (E[pulls per 5★] ≈ 62.3, P(5★ ≤ 90) = 1, P(featured ≤ 180) = 1). Existing tests assert wide ranges (`70 < x < 90`). One `analyticalCalc` assertion is wrapped in an `if` and can never fail. | `pityEngine.test.ts:249-282`, `analyticalCalc.test.ts:440-447` | sprint |
| G-17 | LOW | Inconsistent radiance-threshold defaults (`|| 3` vs `|| 2`) across three files. | `pityEngine.ts:26,79`, `wishAnalyzer.ts:117,175` | sprint |
| G-18 | LOW | RNG is a 32-bit LCG seeded `Date.now() + sim`, so first draws across sims form an arithmetic progression; runs are not reproducible. | `montecarlo.worker.ts:108-114` | open |
| G-19 | LOW | 160 primos/pull defined twice; three record mappers write three different `bannerVersion` strings. | `constants.ts:4`, `resourceCalculations.ts:81`; `utils/wishHistory.ts`, `wishNormalization.ts`, `wishHistoryMapper.ts` | open |
| G-20 | LOW | `bannerTime.ts` comment dates 5.3 phase 1 to 2026-01-13 (it was 2025); phase rotations assume 5 PM ET and ignore DST drift. | `src/features/wishes/lib/bannerTime.ts:228` | open |

## W — Wish import & authkey

| ID | Sev | Finding | Where | Status |
|---|---|---|---|---|
| W-01 | HIGH | Browser wish import cannot work: HoYoverse gacha API has no CORS headers, and the browser path fetches the pasted *web page* URL rather than the `getGachaLog` API endpoint the Rust path uses. No UIGF/JSON import exists, though the error UI tells users to "import a JSON file". | `src/features/wishes/components/WishImport.tsx:267-274`, `src-tauri/src/wish_fetcher.rs:128` | deferred (hosting) |
| W-02 | HIGH | Rust wish fetcher prints the full authkey URL and raw response bodies to stderr via leftover `eprintln!` debug lines. | `src-tauri/src/wish_fetcher.rs:252,268,290-376` | sprint |
| W-03 | LOW | Import summary count computed before dedupe, so re-imports over-report. | `WishImport.tsx:386-397` | open |
| W-04 | LOW | `saveWishSession` would store the authkey in `appMeta` (and therefore in plaintext backups) if ever wired up. Currently uncalled. | `src/features/wishes/services/wishSession.ts:34` | sprint (delete) |

## D — Data layer, persistence, backup

| ID | Sev | Finding | Where | Status |
|---|---|---|---|---|
| D-01 | HIGH | "Migrations fail closed" is false. `initializeDatabase().catch(console.error)` runs in a `useEffect` after the router has rendered; Dexie auto-opens on first table access regardless. | `src/app/App.tsx:9`, `src/db/migrations.ts:50-53` | sprint |
| D-02 | HIGH | Restore is not schema-validated; rows are `put()` verbatim after a shallow envelope check. Zod schemas exist but are unused here. Malformed rows persist and crash pages later. | `src/features/sync/services/importService.ts:84-159,185,424-450` | sprint |
| D-03 | HIGH | Export/import asymmetry: every table is exported but `buildTemplates`, `importRecords`, `abyssRuns` have no restore branch. User-authored build templates are silently dropped on restore. | `appMetaService.ts:106-108`, `importService.ts:27-46,323-459` | sprint |
| D-04 | HIGH | Product data in localStorage is invisible to backup: wishlist (drives Targets), planner selections, resin budget, weekly boss progress, campaign action states, multi-target calculator state. | `wishlistStore.ts:95`, `usePlannerState.ts:60`, `ResinTracker.tsx:22`, `WeeklyBossTracker.tsx:27`, `useCampaignActionStates.ts:20`, `MultiTargetCalculator.tsx:45` | sprint |
| D-05 | HIGH | No `navigator.storage.persist()` request anywhere. Safari evicts script-writable storage after 7 days without interaction; backup nag defaults to 14 days. | (absent) | sprint |
| D-06 | HIGH | No identity/UID dimension on any record; single DB name; `deviceId` written but never read. Two accounts or two people on one browser share data. | `src/db/schema.ts:98`, `migrations.ts:24` | deferred (hosting) |
| D-07 | MED | `buildTemplates` indexes `isOfficial`, a boolean. IndexedDB does not index booleans, so `where('isOfficial').equals(1)` always returns empty; "official only" filter is dead. | `schema.ts:64`, `buildTemplateRepo.ts:39,120` | sprint |
| D-08 | MED | Schema version tracked in three unlinked constants (`LATEST_SCHEMA_VERSION`, `APP_SCHEMA_VERSION`, `this.version(5)`). | `migrations.ts:10`, `lib/constants.ts:71`, `schema.ts:105` | sprint |
| D-09 | MED | README and code comments describe Dexie upgrade hooks that were deleted; `migrations.test.ts` is titled "runs the v1 → v2 upgrade hook" and tests nothing of the kind. | `README.md:88-89`, `migrations.ts:3-6`, `migrations.test.ts:21` | sprint |
| D-10 | MED | "Replace All" restore mode is an upsert; local rows absent from the backup survive. | `importService.ts:167-200`, `ImportBackup.tsx:25` | sprint |
| D-11 | MED | Encrypted export spreads a `Uint8Array` into `String.fromCharCode(...)` → `RangeError` on a few hundred KB. Text export calls `btoa` on raw JSON and throws on any non-Latin1 character. | `src/features/sync/services/syncUtils.ts:93,218` | sprint |
| D-12 | MED | Read-modify-write without transactions in `wishRepo.create`, `characterRepo.bulkUpsert`, `materialRepo.setMaterial`, `teamRepo.update`. Concurrent imports (two tabs) can duplicate. | `wishRepo.ts:25-46`, `characterRepo.ts:95-130`, `inventoryRepo.ts:35-44`, `teamRepo.ts:33-41` | sprint |
| D-13 | MED | `characterRepo.delete` never removes the key from `Team.characterKeys`; integrity is one-directional. | `characterRepo.ts:41-43` | sprint |
| D-14 | MED | Backup exports `appMeta` and `externalCache` (API response cache) even though import ignores them; cache can dominate backup size. | `appMetaService.ts:106` | sprint |
| D-15 | MED | No quota awareness (`storage.estimate`) and no in-app DB reset; a poisoned table has no remedy. | (absent) | sprint |
| D-16 | MED | Old-schema backups get a warning but no transform. | `importService.ts:127-130` | open |
| D-17 | LOW | `storageKeys.ts` lists keys with zero usages and omits every key actually used. | `src/lib/constants/storageKeys.ts` | sprint |
| D-18 | LOW | `abyssRuns` table has zero references outside schema/types. `Note.deletedAt` tombstone never written or read. | `schema.ts:32`, `types/index.ts:166,210` | open |
| D-19 | LOW | Duplicate repo APIs (`ledgerRepo` vs `primogemEntryRepo`/`fateEntryRepo`/`resourceSnapshotRepo`); duplicate shapes (`Artifact`/`InventoryArtifact`, `Weapon`/`InventoryWeapon`). | `src/features/ledger/repo/`, `types/index.ts:40,49,295,317` | open |
| D-20 | LOW | Restore does per-row `get`+`put` (N+1) though `wishRepo.bulkCreate` already has the batch pattern. `resourceSnapshots` has no `updatedAt`, so `newer_wins` degrades to keep-local. | `importService.ts:167-200,263-274` | open |
| D-21 | LOW | `crypto.randomUUID()` requires a secure context; breaks on plain-HTTP LAN hosting. | (throughout) | open |

## R — Roster, import mappers, static game data

| ID | Sev | Finding | Where | Status |
|---|---|---|---|---|
| R-01 | HIGH | Ascension material deficits are wrong for every character. `CHARACTER_ASCENSION_COSTS` rows are cumulative but the calculator sums them per phase: a 1→90 plan yields 78 tier-1 common / 28 slivers instead of 18 / 1. `TOTAL_ASCENSION_MATS` has the right totals but is unused. The unit test hard-codes the broken row. | `src/lib/planning/materialConstants.ts:43-51`, `ascensionCalculator.ts:147-158`, `ascensionCalculator.test.ts:45-60` | sprint |
| R-02 | HIGH | Enka talent levels rotated: `Object.values(skillLevelMap)` assigned auto/skill/burst by position, but skill IDs are not ascending for many characters (Ayaka 10024/10018/10019). Test uses Furina whose IDs happen to sort correctly. | `src/mappers/enka.ts:501-506` | sprint |
| R-03 | HIGH | Enka 5★ sword ID map is shifted/duplicated (11511 mapped to Splendor; 11512/11515 both Absolution; 11513/11514 both Uraku Misugiri). Test asserts the wrong mapping. | `enka.ts:244-259`, `enka.test.ts:120,305` | sprint |
| R-04 | HIGH | Enka UID fetch falls back to `corsproxy.io`, a public third-party proxy that receives every user's UID and profile; the SW caches those responses. | `enka.ts:571-590`, `pwa.config.ts:19` | deferred (hosting) — remove fallback in sprint |
| R-05 | HIGH | Three character-key conventions coexist (`'Arataki Itto'`, `'KaedeharaKazuha'`, `'Ayaka'`). Enka emits display names, GOOD emits GOOD keys, manual form uses the list. Import merges by exact key, so one character can exist three times. `toGoodCharacterKey('Ayaka')` returns an invalid GOOD key. | `src/lib/constants/characterList.ts`, `enka.ts:129-131,225`, `characterData.ts:352-361`, `irminsulImport.ts:145-149` | sprint |
| R-06 | MED | Wrong materials: Furina and Sigewinne boss item `'Water Orb of the Font of All Waters'` (not an item; should be *Water That Failed to Transcend*); Wriothesley weekly item is a 4.2 boss drop (should be *Primordial Greenbloom*). Test asserts the fake Furina item. | `src/lib/data/characterMaterialMap.ts:594-641`, `characterMaterialMap.test.ts:14-19` | sprint |
| R-07 | MED | Coverage drift between tables: 154 weapons in equipment data vs 178 gcsim vs 198 Enka IDs; 47 vs 48 artifact sets; `LongNightsOath`, `NightOfTheSkysUnveiling`, `SilkenMoonsSerenade` exist in scoring tables but not the picker or name map. | `equipmentData.ts:41,231`, `gcsimKeyMappings.ts:186`, `enka.ts:242`, `artifactQualityFilter.ts:152-217` | sprint |
| R-08 | MED | Enka `CHARACTER_ID_MAP` ends at 6.1; 6.2–6.7 characters import as `Unknown_1000012x`. Consistency test carries growing "expected gap" lists. | `enka.ts:225-240`, `characterDataConsistency.test.ts:56-76` | sprint |
| R-09 | MED | `CLAUDE_UPDATE.md` covers about half of the ~14 hand-maintained tables, instructs guessing avatar IDs, and pulls from no structured source. | `CLAUDE_UPDATE.md` | deferred (data pipeline) |
| R-10 | MED | A character-only GOOD file with `weapons: []` wipes the entire weapon inventory (artifacts are guarded by `length > 0`; weapons by `!== undefined`). | `src/features/roster/services/irminsulImport.ts:206-226` | sprint |
| R-11 | MED | Artifact identity is a content hash including level/substats, so leveling changes the ID; weapon identity includes `location`/`lock`, so equipping recreates the row. Enka artifacts stored with raw `FIGHT_PROP_*` keys while GOOD uses GOOD keys. | `src/mappers/irminsul.ts:229-256`, `enka.ts:526-538` | open |
| R-12 | MED | All "today" and reset logic uses the browser's local day or hard-coded NA (UTC-5); no server-region setting. Two separate `getNextWeeklyReset` implementations. | `farmingSchedule.ts:82`, `resetTimers.ts:10`, `weeklyBossData.ts:150`, `resinCalculator.ts:303` | sprint |
| R-13 | MED | Imaginarium Theatre has one hand-seeded season (2026-08); `getCurrentSeason` returns nothing today and the hook silently falls back to the stale season. `parseRoleCombat` is never called in production. | `theaterSeasons.ts:38-48`, `useTheaterReadiness.ts:40` | sprint |
| R-14 | LOW | `genshin-db-api.vercel.app` is an unowned mirror; weapon-material series classified by ambiguous first-match keywords; tier-3 arrowhead listed under tier 1. | `src/lib/services/genshinDbService.ts:18,77-90,812-840` | open |
| R-15 | LOW | `fromGOOD` is dead; `toGOOD` emits `version: 2` and `toGOODWithInventory` `version: 3`; both drop characters without a weapon row. | `src/mappers/good.ts:157,168,177,463` | sprint |
| R-16 | LOW | Mapper tests use single synthetic characters rather than a real Enka/GO export, which is why R-02/R-03 passed. | `good.test.ts:8-50`, `enka.test.ts:16-60` | sprint |

## S — App shell, PWA, Tauri, config

| ID | Sev | Finding | Where | Status |
|---|---|---|---|---|
| S-01 | HIGH | PWA icons and favicon referenced by the manifest and `index.html` do not exist in `public/` or the build. App is not installable. | `pwa.config.ts:53-71`, `index.html:4`, `public/` | sprint |
| S-02 | HIGH | No SW update flow: `autoUpdate` + `cleanupOutdatedCaches` with no `registerSW`/`onNeedRefresh` handling. Open tabs get chunk-load failures on lazy routes after each deploy. | `pwa.config.ts:52`, `routes.tsx:6-33` | deferred (hosting) |
| S-03 | HIGH | No Content Security Policy; runtime cache rule is `CacheFirst` for every origin's JS/CSS for 30 days. | `index.html`, `pwa.config.ts:5` | deferred (hosting) |
| S-04 | MED | Tauri leaks into the web bundle. External links call the Tauri shell `open()` and fall back to `window.open` inside `.catch`, after the user gesture is gone, so browsers pop-up-block them. `tauri.conf.json` still has `com.tauri.dev` identifier, `csp: null`, and a `localhost:5173` window URL. | `DomainsTab.tsx:9-22`, `CalendarPage.tsx:9`, `BannerResourceCard.tsx:5`, `src-tauri/tauri.conf.json` | sprint |
| S-05 | MED | Full wish-history table loaded inside several `useLiveQuery` callbacks; re-runs on any write to 4 tables. | `useCurrentPity.ts:7,17`, `useBudgetLink.ts:44-47`, `resourceService.ts:67-69` | open |
| S-06 | MED | One error boundary for the whole outlet; nested layouts have no `errorElement`; "Try Again" re-renders the crashed subtree. Boundary always shows raw `error.message`. | `Layout.tsx:57-59`, `routes.tsx:96`, `ErrorBoundary.tsx:48,78-82` | open |
| S-07 | LOW | Native `alert`/`confirm` stragglers despite a toast system. `console.log` left in `qrScanner.ts`. `window.location.search` read directly in two calculator files. | `MultiTargetCalculator.tsx:400,129`, `BuildTemplatesPage.tsx:44`, `TransactionLog.tsx:150`, `qrScanner.ts`, `CalculatorPage.tsx:13` | sprint |
| S-08 | LOW | Recharts (~414 kB) and html5-qrcode (~360 kB) are the two largest chunks; QR scanner loads with the Enka import page. | build output | open |
| S-09 | MED | Icon-only buttons with `title` but no `aria-label` (14); clickable `div`s without role/tabIndex/key handler in Notes. | `ResinTracker.tsx:106-112`, `WeeklyBossTracker.tsx:241-246`, `NotesPage.tsx:57-59`, `GoalsSection.tsx:153-155` | sprint |

## T — Tests, CI, hygiene

| ID | Sev | Finding | Where | Status |
|---|---|---|---|---|
| T-01 | HIGH | Test files are excluded from `tsc`; ~500 type errors exist in tests today (≈220 from `noUncheckedIndexedAccess`). ESLint also relaxes `no-explicit-any`/`exhaustive-deps` for tests. | `tsconfig.json:31`, `eslint.config.js:47-56` | sprint |
| T-02 | MED | CI runs unit → build → e2e but never `npm run lint`; coverage thresholds only apply to `test:coverage`, which CI does not run. | `.github/workflows/e2e-tests.yml` | sprint |
| T-03 | MED | Playwright drives `npm run dev`, not the built artifact, so SW/precache/chunk bugs are invisible. | `playwright.config.ts:102` | sprint |
| T-04 | MED | Roughly a third of unit test files are page tests that mock hooks, children, and domain functions, then assert the stubs rendered. Only 15 files exercise real Dexie. 160 `it('renders…')` tests. | `DashboardPage.test.tsx`, `LedgerPage.test.tsx`, `WishHistoryPage.test.tsx`, `useArtifacts.test.ts` | open |
| T-05 | LOW | E2E: 11 `waitForTimeout`s, 15 `getByTestId` calls with zero `data-testid` in source, 3 skipped Enka tests, Chromium only. | `e2e/pages/*.ts`, `character-import.spec.ts:127-155` | open |
| T-06 | LOW | Dead code with live tests: `CalendarPage` and `WishesPage` are unrouted. | `src/features/calendar/pages/CalendarPage.tsx`, `src/features/wishes/pages/WishesPage.tsx` | sprint |
| T-07 | LOW | Hygiene: `claude.md` (lowercase, duplicates README, not picked up on case-sensitive FS); `experiments/lunar-bakeoff` committed; doc test counts stale (150/2075 vs 155/2160); "Theater" vs "Theatre" split 12/13 files; `features/campaigns` and `features/targets` coexist. | root, `docs/` | sprint |

---

## Deferred (hosting / feature work, tracked separately)

These are not bugs in the local app and are intentionally out of the cleanup sprint:

- **W-01** UIGF v4 wish import/export (the only viable web import path).
- **R-04** First-party Enka proxy + **S-03** CSP.
- **D-06** Account / UID dimension and multi-account support.
- **S-02** Service-worker update prompt and lazy-route chunk retry.
- **R-09** Structured game-data pipeline (Dimbreath / genshin-db package) to replace hand-typed tables.
- **S-05** Indexed/cached pity aggregate instead of full-table live queries.
- **S-08** Lazy-load Recharts and the QR scanner.
- **D-16** Per-version backup up-conversion.

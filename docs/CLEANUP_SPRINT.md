# Cleanup Sprint — Bug Fixes Before Hosting

Scope: every finding in `REVIEW_FINDINGS.md` marked `sprint`. Goal is a
trustworthy **local** app: correct numbers, safe backup/restore, no dead or
misleading surfaces. Hosting work (UIGF import, proxy, CSP, accounts, SW
update flow) is deliberately excluded and tracked in the Deferred section of
the findings file.

Rules for the sprint:

- Every fix lands with a test that would have caught it. Math fixes pin known
  game numbers, not ranges.
- No schema version bump unless a fix truly needs one (none in this plan do).
- Run `npm run lint && npx tsc --noEmit && npm run test:run` before each
  commit. Commit per work item, referencing finding IDs.
- Order matters within a phase only where noted.

---

## Phase 1 — Game math (highest user impact)

### 1.1 Ascension material table — R-01
- Convert `CHARACTER_ASCENSION_COSTS` to true per-phase rows (A1: 1 sliver, 3 common, 3 specialty, 20k; A2: 3 fragment, 2 boss, 10 specialty, 15 common, 40k; A3: 6 fragment, 4 boss, 20 specialty, 12 tier-2, 60k; A4: 3 chunk, 8 boss, 30 specialty, 18 tier-2, 80k; A5: 6 chunk, 12 boss, 45 specialty, 12 tier-3, 100k; A6: 6 gemstone, 20 boss, 60 specialty, 24 tier-3, 120k).
- Test: summing all phases equals `TOTAL_ASCENSION_MATS` (18/30/36 common, 1/9/9/6 gems, 46 boss, 168 specialty, 420,000 mora). Rewrite the A5→A6 test to the correct row.
- Files: `src/lib/planning/materialConstants.ts`, `src/lib/planning/ascensionCalculator.ts`, `src/features/planner/domain/ascensionCalculator.test.ts`.

### 1.2 Single source of gacha rules — G-09, G-07, G-08, G-17
- Delete the worker's private `GACHA_RULES` copy; import from `@/lib/constants` (Vite resolves `@/` in workers; if not, move constants to a dependency-free module both import).
- Weapon: `hardPity: 80`, `maxFatePoints: 1`. Character/standard unchanged.
- Remove `|| 2` / `|| 3` fallbacks; `radianceThreshold` is required on the character rules.
- Update UI validation ("0-1" fate points) in `MultiTargetCalculator.tsx`.

### 1.3 Weapon banner model — G-01, G-02, G-10
- `getFeaturedProbability(state, rules)` returns 0.75 for weapon banner, 1.0 when fate points ≥ max, 0.5 standard/chronicled.
- Worker pull loop: on a 5★ weapon-banner result that is not the target, increment fate points; on the target, reset. Standard banner counts any copy of the target, not only "featured".
- Tests: P(target weapon within 160 pulls) = 1 with fate points; P(5★ within 80) = 1; expected pulls per weapon 5★ ≈ 53–54.

### 1.4 Capturing Radiance state machine — G-03
- Replace flat 55% + 3-loss guarantee with the consecutive-loss model: 0 or 1 prior loss → 0.5, 2 → 0.75, 3 → 1.0. Stationary featured rate is 55.2%, matching the community figure.
- Apply in `pityEngine.ts`, `wishReplay.ts`, `wishAnalyzer.ts` (via one shared helper).
- Tests: stationary rate within ±1% of 0.552 over 200k simulated 50/50s; guarantee after third consecutive loss.

### 1.5 One pity replay engine — G-04, G-05, G-12
- `wishAnalyzer` delegates ordering (and ideally the whole state walk) to `wishReplay`. Shared comparator: timestamp → createdAt → gachaId (HoYo IDs are monotonic within a 10-pull).
- Fate points: when `chartedWeapon` is unknown, a non-standard 5★ weapon leaves fate points **unchanged** and flags `fatePointsUnknown: true`; never reset on an unknown. Standard-pool 5★ still resets nothing (it cannot affect fate points).
- Add Primordial Jade Winged-Spear to both standard-pool lists.
- Tests: two 5★ in one 10-pull with shuffled input order give identical pity on both engines; PJWS on weapon banner records a lost 75/25.

### 1.6 Wizard worst case and worker income — G-11, G-06
- Wizard worst case = 180 per copy on character banner unless guaranteed (then 90 for the first copy), 160 on weapon banner; mirror `campaignPlan`.
- Worker income: accumulate `income * days(target_{i-1} → target_i)`, not from `now` each time. Test with two targets and non-zero income.

### 1.7 Known-number tests — G-16
- Add `pityEngine.known.test.ts`: E[pulls per 5★] = 62.3 ± 0.5 (analytic), P(5★ ≤ 90) = 1, P(featured ≤ 180) = 1, P(featured ≤ 90) ≈ 0.5·P(5★ ≤ 90) + radiance effect. Fix the `if`-wrapped assertion in `analyticalCalc.test.ts`.

---

## Phase 2 — Data safety

### 2.1 Fail closed for real — D-01
- Render a `DatabaseGate` around the router: show a blocking error screen (with "Export raw data" and "Reset database" actions) if `initializeDatabase()` rejects; render the app only after it resolves.
- Test: a rejected init renders the error screen and never mounts routes.

### 2.2 Schema version single source — D-08, D-09
- One `SCHEMA_VERSION` constant in `src/db/schema.ts`; `migrations.ts` and `lib/constants.ts` re-export it; `schema.ts` asserts `this.verno === SCHEMA_VERSION` after open.
- Fix README/ARCHITECTURE migration prose and rename the misleading migration test.

### 2.3 Backup round-trip — D-02, D-03, D-10, D-11, D-14
- Zod schema per exported table (permissive on optional fields, strict on `id` and required keys); restore rejects the file with a per-table error list before any write.
- Add restore branches for `buildTemplates` and `importRecords`; stop exporting `externalCache`; keep `appMeta` export but only restore whitelisted keys.
- "Replace All" clears each table inside the transaction before writing.
- Fix `encryptData` (chunked base64) and `wrapForTextExport` (`TextEncoder` → base64) so non-Latin1 notes and large histories export.
- Tests: export → import round-trip preserves every table including build templates; a backup with a malformed wish row is rejected with no writes; Replace All removes local-only rows; 1 MB payload encrypts; a note with emoji exports as text.

### 2.4 localStorage product data — D-04, D-17
- Include wishlist, planner state, resin budget, weekly boss progress, campaign action states, and multi-target calculator state in the backup under a `localState` section; restore writes them back.
- Rewrite `storageKeys.ts` to list the keys actually used and import it everywhere a key is typed today.

### 2.5 Durable storage and reset — D-05, D-15
- Call `navigator.storage.persist()` on first meaningful write; show persisted/estimated usage in Settings.
- Add "Reset all data" (delete DB + clear app localStorage keys) behind a typed-confirmation modal.

### 2.6 Repo integrity — D-07, D-12, D-13
- `buildTemplateRepo`: filter `isOfficial` in memory (drop the useless index at the next real schema bump, not now).
- Wrap read-modify-write paths in `db.transaction('rw', …)`.
- `characterRepo.delete` removes the key from every team.
- Tests against fake-indexeddb for each.

### 2.7 Remove `wishSession` — W-04
- Delete the unused authkey persistence helpers and their test.

---

## Phase 3 — Import mappers and static data

### 3.1 Enka talent order — R-02
- Vendor a `skillOrder` table (avatarId → [normal, skill, burst] skill IDs) generated from Enka's public `characters.json`; map `skillLevelMap` by ID. Unknown avatar → keep positional fallback and mark `talentOrderUncertain`.
- Test with Ayaka (10024/10018/10019) and Furina fixtures.

### 3.2 Enka weapon IDs and character IDs — R-03, R-08
- Correct the 5★ sword block (11501 Aquila Favonia … 11515 Absolution) and extend `CHARACTER_ID_MAP` through 6.7. Fix the tests that assert wrong values.

### 3.3 Character key normalisation — R-05
- One canonical key (GOOD key) in `characterList.ts`; a `displayName` field for UI. `toGoodCharacterKey` and `fromDisplayName` become total functions with tests over the full list. Enka mapper emits GOOD keys. Import dedupes by canonical key and merges existing display-name rows into the canonical one (data fix on startup, no schema bump).
- Test: importing the same character via GOOD, Enka, and manual form yields one row.

### 3.4 Material corrections — R-06
- Furina/Sigewinne boss → *Water That Failed to Transcend*; Wriothesley weekly → *Primordial Greenbloom*. Fix the test that asserts the fake item. Add a test that every `boss`/`weekly` value appears in the boss-material list.

### 3.5 Table coverage — R-07
- Add the three missing artifact sets to `ARTIFACT_SETS`/`ARTIFACT_SET_NAMES`; extend the consistency test so any set referenced in scoring tables must exist in the picker, and any character in `characterList` must have a gcsim key and Enka ID (empty the "expected gap" lists).

### 3.6 Import safety — R-10, R-15
- Weapon reconciliation only when `weapons.length > 0`, same as artifacts. Delete `fromGOOD`; unify GOOD export version.

### 3.7 Server region and reset timing — R-12, G-14
- Add `serverRegion` to settings (`na | eu | asia | tw`), default from browser timezone. One `getServerNow()` / `getDailyReset()` / `getWeeklyReset()` in `lib/time/serverTime.ts`; delete the two duplicate weekly-reset implementations and the hard-coded UTC-5.
- Wish normalisation reads the `region` query param from the pasted URL and falls back to the setting.
- Test: same instant yields different "today" for NA vs Asia across the 4 AM boundary.

### 3.8 Theatre season honesty — R-13
- When no season matches today, show "No season data for this month" with the last known season clearly labelled as stale; do not silently substitute.

---

## Phase 4 — Shell, PWA, Tauri, a11y

### 4.1 PWA assets — S-01
- Add `favicon.svg`, `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png`, `mask-icon.svg` to `public/`; point `index.html` at them; confirm `dist/manifest.webmanifest` icons resolve after build.

### 4.2 Tauri containment — S-04
- `openExternal(url)` helper: if `isTauri`, use plugin-shell; otherwise `window.open` synchronously in the gesture. Replace the three call sites.
- Set a real bundle identifier, remove the dev-server window URL from the production config, remove the `csp: null` override.
- Strip all `eprintln!` debug logging from `wish_fetcher.rs` — W-02.

### 4.3 UI stragglers — S-07, S-09
- Replace `alert`/`confirm` with the toast/Modal system; remove `console.log` from `qrScanner.ts`; use `useSearchParams` in the two calculator files.
- Add `aria-label` to the 14 icon-only buttons; make note cards and goal rows real buttons.

---

## Phase 5 — Tests, CI, hygiene

### 5.1 Typecheck tests — T-01
- Add `tsconfig.test.json` (extends base, includes tests, `noUncheckedIndexedAccess: false`, vitest globals). Fix the remaining errors (≈280 after the relaxation). Add `npm run typecheck` = both configs.

### 5.2 CI — T-02, T-03
- Workflow: lint → typecheck → unit → build → e2e against `vite preview` of the built `dist/`.

### 5.3 Dead code and docs — T-06, T-07
- Delete unrouted `CalendarPage` and `WishesPage` (and their tests/page objects); delete `experiments/`; rename `claude.md` → `CLAUDE.md` and de-duplicate against README; refresh test counts; pick "Theatre" (in-game spelling) for UI strings and "theater" for code paths, and say so in ARCHITECTURE.md.

---

## Definition of done

- All `sprint` rows in `REVIEW_FINDINGS.md` flipped to `fixed` with the commit hash.
- `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run build` all green.
- Manual check: import a real GOOD file and a real Enka UID; ascension deficits for a fresh 5★ match the wiki totals; weapon-banner odds for 160 pulls with 0 fate points read 100%; export → wipe → import restores everything including build templates and the wishlist.

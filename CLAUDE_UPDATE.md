# Patch Update Runbook

You are running a patch update for this Genshin Impact tracker. The game ships a new version every ~6 weeks; this doc tells you exactly how to catch the app up. Follow it in order. Do not skip validation steps. Do not invent file paths — every path you need is listed below.

## When to run this

- After a new Genshin version (X.Y) goes live and its first-phase banners are public.
- The user may also ask you to run it for patches that dropped while the app was dormant — in which case, loop through each missing version from oldest to newest, committing between versions, so a bad later update doesn't corrupt an earlier-known-good state.

## Scope

This runbook updates **static game data** only: characters, weapons, artifact sets, banner schedules, material/domain info, and the patch-version pointer. It does **not** touch UX, features, or component code — those live in feature branches.

## Branch and PR conventions

- Branch: `claude/patch-update-{version}` (e.g. `claude/patch-update-6.1`). One branch per patch even if you're catching up multiple.
- Commit style matches repo history: lowercase `feat:` prefix, concise.
- PR title: `Patch update: {version} — {phase-1-5-stars}`
- PR body: list new characters, weapons, artifact sets, banner phases added, plus the validation checklist below marked off.

---

## Step 1 — Establish the delta

Read the current pointer first:

1. Open `src/lib/constants/patchVersion.ts`.
2. If it doesn't exist yet (first run of this runbook), create it with:
   ```ts
   /** Current Genshin patch the app's static data is calibrated to. */
   export const CURRENT_PATCH = '5.3';
   ```
   Seed it with the lowest version currently referenced in the codebase — `grep` `bannerHistory.ts` for `CURRENT_VERSION` — not the optimistic value in the `characterList.ts` comment. We want accuracy, not aspiration.
3. Remove the now-redundant `CURRENT_VERSION` constant in `src/lib/bannerHistory.ts`; replace references with imports from `patchVersion.ts`.
4. Update the comment in `src/lib/constants/characterList.ts` line ~14 to read `// Last updated for version {CURRENT_PATCH}` — match exactly, since this comment is the first thing humans see.

Then find the live patch. Use `WebFetch` on, in priority order:

1. `https://genshin-impact.fandom.com/wiki/Version/History` — canonical list of released versions with dates.
2. `https://paimon.moe/timeline` — banner phase dates (primary source for start/end timestamps).
3. `https://genshin-impact.fandom.com/wiki/Version/{version}` — character/weapon/region notes for a specific patch.

Compute: `versions_to_apply = [everything after CURRENT_PATCH, up to and including live]`. If that list is empty, report "up to date" and stop. Do **not** commit a no-op.

---

## Step 2 — Data-gathering per version

For each version in order, collect:

| Item | Source | What you need |
|---|---|---|
| New 5-star characters | Fandom `Version/{v}` | key (PascalCase, Enka-style), display name, element, weapon, rarity |
| New 4-star characters | Fandom `Version/{v}` | same |
| New signature/event weapons | Fandom `Weapon/List` filtered by version | key (PascalCase, no spaces), name, type, rarity (3–5) |
| New artifact sets | Fandom `Artifact/Sets` | setKey (PascalCase), display name |
| Banner phases (both) | paimon.moe/timeline | start/end ISO dates, featured 5★, featured 4★, banner type |
| New region talent books | Fandom | three series names (e.g., Freedom/Resistance/Ballad), day rotation, region name |
| New weekly/world bosses | Fandom | name, material drop name, required level |
| Standard pool changes | HoYo announcement | additions/removals (rare, but happens) |

For character keys, **prefer the key HoYo uses internally** — usually matches Enka's `CHARACTER_ICON_NAMES`. When in doubt, check existing entries in `src/lib/characterData.ts` for the pattern (e.g., "RaidenShogun" not "Raiden Shogun", "KaedeharaKazuha" not "Kazuha").

---

## Step 3 — Data writes (per version)

Apply these edits. All paths are relative to repo root.

### 3a. Characters

**`src/lib/constants/characterList.ts`** — append to `ALL_CHARACTERS`. Place 5-stars in the 5-star block, 4-stars in the 4-star block. Alphabetical within each block unless existing ordering looks intentional (it's usually a rough alpha).

**`src/lib/characterData.ts`** — two additions:
- Add `avatarId: 'IconName'` to `CHARACTER_ICON_NAMES` (avatarId comes from Enka's character map — see file's header comment for source URL).
- Add lowercase-key entries to `CHARACTER_KEY_TO_ID` under the appropriate region section. Include all common aliases the community uses (e.g. `'hu tao'` and `'hutao'`, `'raiden'` and `'raidenshogun'`).

No icon asset files are bundled — character portraits load from Enka's CDN at runtime via `getCharacterPortraitUrl`. So you do **not** need to download images.

### 3b. Weapons

**`src/lib/data/equipmentData.ts`** — append to the `WEAPONS` array. Keep the rarity comment dividers (`// 5-Star Swords`, etc). Match existing key style (PascalCase, no punctuation, no spaces).

### 3c. Artifacts

**`src/lib/data/equipmentData.ts`** — append to `ARTIFACT_SETS` array.

**`src/lib/artifactData.ts`** — add display-name mapping to `ARTIFACT_SET_NAMES`.

### 3d. Banner history

**`src/lib/bannerHistory.ts`** — prepend new entries to `BANNER_HISTORY` array (newest first — check existing sort). One entry per banner per phase per type (character + weapon). Add any new 5-stars to `ALL_5_STAR_CHARACTERS`.

### 3e. Material / domain data

**`src/features/planner/domain/materialConstants.ts`** — only edit if the patch introduces a new region or talent-book series.

**KNOWN BUG to fix on first run:** `TALENT_BOOK_REGIONS` is missing `Nod-Krai`. `DOMAIN_SCHEDULE` already has Moonlight/Elysium/Vagrancy. When you touch this file for any reason, add:
```ts
'Nod-Krai': ['Moonlight', 'Elysium', 'Vagrancy'],
```

For any **new** region: update both `DOMAIN_SCHEDULE` (with day rotation) and `TALENT_BOOK_REGIONS` (with series list). These two tables must stay in sync — every series in `DOMAIN_SCHEDULE` must appear under exactly one region in `TALENT_BOOK_REGIONS`.

### 3f. Character → material mapping

**`src/lib/data/characterMaterialMap.ts`** — add new characters with their boss mat, talent series, local specialty, and common material. Verify against `src/lib/data/characterMaterialMap.test.ts` expectations. If you're unsure of a material, cross-reference Fandom's character page "Ascensions and Stats" section.

### 3g. Patch pointer

After all per-version edits land, update `src/lib/constants/patchVersion.ts`:
```ts
export const CURRENT_PATCH = '{new_version}';
```

Also append a `docs/CHANGELOG.md` entry under today's date: one bullet per version applied, listing new characters and weapons.

---

## Step 4 — Validation (non-negotiable)

Run in order. **Do not commit if any step fails.** Fix the failure, then re-run from this step.

```bash
npm run lint
npm run test:run
```

Both must exit 0. The suite includes `src/lib/characterData.test.ts` and `src/lib/data/characterMaterialMap.test.ts` which will fail loudly if you miss a mapping.

### Post-condition asserts

Manually verify (or add assertions for):

- [ ] Every 5-star key in `ALL_5_STAR_CHARACTERS` (bannerHistory.ts) exists in `ALL_CHARACTERS` (characterList.ts).
- [ ] Every character key in `ALL_CHARACTERS` has a corresponding `CHARACTER_KEY_TO_ID` entry (lowercased) in `characterData.ts`.
- [ ] Every `avatarId` in `CHARACTER_ICON_NAMES` is referenced by at least one entry in `CHARACTER_KEY_TO_ID`.
- [ ] Every featured character key in any recent `BANNER_HISTORY` entry exists in `ALL_CHARACTERS`.
- [ ] Every series in `DOMAIN_SCHEDULE` appears under exactly one region in `TALENT_BOOK_REGIONS`.
- [ ] `CURRENT_PATCH` in `patchVersion.ts` matches the comment in `characterList.ts` and the latest version in `BANNER_HISTORY`.

Quick sanity script you can run with `tsx` or copy-paste into a scratch test:
```ts
import { ALL_CHARACTERS } from './src/lib/constants/characterList';
import { BANNER_HISTORY } from './src/lib/bannerHistory';
const knownKeys = new Set(ALL_CHARACTERS.map(c => c.key));
const orphans = BANNER_HISTORY.flatMap(b => b.featured5Star).filter(k => !knownKeys.has(k));
if (orphans.length) throw new Error(`Orphan banner keys: ${orphans}`);
```

---

## Step 5 — Commit, push, PR

- Stage only the files listed above. Do **not** stage anything else that changed (if anything else is dirty, stop and ask).
- One commit per version. Commit message template:
  ```
  feat: patch update for {version} — adds {comma-separated 5-stars}

  - {N} new characters, {N} weapons, {N} artifact sets
  - Banner history: {phase1} → {phase2}
  - Patch pointer: {prev} → {version}
  ```
- Push to `claude/patch-update-{latest_version}` with `git push -u origin <branch>`. Retry on network failure with 2/4/8/16s backoff.
- Open PR against `main`. Body must include the checklist from Step 4.

**Do not merge.** The user reviews and merges.

---

## Anti-patterns to avoid

- **Do not** scrape from community fanon wikis or leaker sites. Only use Fandom, paimon.moe, and HoYo's own announcements. Leaked pre-release data gets wrong numbers, wrong kits, and wrong release dates.
- **Do not** guess material assignments for a character. If Fandom's page is missing data, skip that character's `characterMaterialMap` entry and note it in the PR body — a partial entry is worse than none because it silently misleads planners.
- **Do not** "clean up" unrelated code while you're here. If you spot a bug, file it as a TODO in the PR body; don't mix unrelated changes into a data-update commit.
- **Do not** rename existing keys even if HoYo's preferred romanization changes. Renames break saved user data. Add an alias in `CHARACTER_KEY_TO_ID` instead.
- **Do not** invent avatarIds. If Enka hasn't indexed a character yet (very fresh patch), mark them as pending, note in PR body, and commit the rest.

---

## If you get stuck

- Data source unreachable: retry each source twice with backoff before escalating. If all three primary sources are down, stop and report; don't fall back to unlisted sources.
- Tests fail after your edits: read the failure, fix the root cause (a missing mapping, a wrong rarity). Do not disable tests or weaken assertions.
- You don't understand why a file is structured the way it is: grep for usages and read one or two callsites. If still unclear, stop and ask the user before editing.

## Minimum useful output

When you finish, report to the user:
- Which versions you applied.
- Lists of characters, weapons, artifact sets added.
- Banner entries added with dates.
- Branch name and PR URL.
- Any `TODO`s deferred (missing materials, pending avatarIds, etc).

# Roster UI Improvement Plan — TDD Sprint Approach

## Problem Statement

The roster UI has several data-layer gaps that cause fallback/placeholder content to appear where real game data should be displayed. The core issues:

1. **Missing character portraits** — Manually-added characters lack `avatarId`, so `getCharacterPortraitUrl()` returns `undefined` and a generic `<User />` icon renders
2. **Two separate metadata systems** — `characterMetadata.ts` (112 entries for filtering) and `characterData.ts` (100+ entries for avatar IDs/images) can get out of sync, and neither covers all characters
3. **No validation** — There's no way to catch when a new character is missing from either mapping until a user sees a fallback in the UI
4. **CharacterCard displays raw keys** — Shows `"KamisatoAyaka"` instead of `"Kamisato Ayaka"` as the display name

## Current Test Coverage (Gaps Identified)

| Area | Test File | What's Covered | What's Missing |
|------|-----------|---------------|----------------|
| Character selectors | `characterSelectors.test.ts` | Filter/sort logic | Missing metadata fallback, unknown character handling |
| useCharacters hook | `useCharacters.test.ts` | CRUD, filter, sort | No test for characters missing metadata |
| CharacterCard | *None* | — | No unit tests at all |
| characterData.ts | *None* | — | No tests for `getCharacterPortraitUrl`, `getAvatarIdFromKey`, or mapping completeness |
| characterMetadata.ts | *None (data file)* | — | No validation that all characters are covered |
| CharacterForm | *None* | — | No test that avatarId is assigned on manual create |
| RosterPage | `RosterPage.test.tsx` | Filter passing | No test for image rendering, card display |
| E2E (Playwright) | ~20% functional | Mostly broken post-UI overhaul | Not reliable for regression |

## Strategy

**Unit tests are our primary safety net.** E2E tests are unreliable and won't be part of this plan. Every code change is preceded by a failing test.

---

## Sprint 1: Data Layer Foundation (Tests First)

**Goal:** Ensure every character key resolves to complete metadata and a portrait URL. No fallbacks for known characters.

### Success Criteria
- [ ] `getAvatarIdFromKey()` returns a valid ID for every character in `CHARACTER_METADATA`
- [ ] `getCharacterPortraitUrl()` returns a URL for every valid avatarId
- [ ] A cross-reference validation test catches any character in one mapping but not the other
- [ ] `getAvatarIdFromKey()` handles all key format variations (spaces, PascalCase, camelCase)
- [ ] All new tests pass: `npm run test:run`

### Step 1.1 — Test `characterData.ts` (NEW test file)

**File:** `src/lib/characterData.test.ts`

Tests to write:
```
describe('getAvatarIdFromKey')
  ✓ returns avatarId for standard keys (e.g., "Furina", "HuTao")
  ✓ handles keys with spaces (e.g., "Hu Tao" → same ID as "HuTao")
  ✓ is case-insensitive ("furina" === "Furina")
  ✓ returns undefined for unknown keys
  ✓ covers every character in CHARACTER_METADATA

describe('getCharacterPortraitUrl')
  ✓ returns a valid URL string for known avatarIds
  ✓ returns undefined for undefined input
  ✓ returns undefined for unknown avatarId
  ✓ URL follows expected Enka CDN format

describe('cross-reference validation')
  ✓ every key in CHARACTER_METADATA has a matching entry in CHARACTER_KEY_TO_ID
  ✓ every key in CHARACTER_KEY_TO_ID has a matching entry in CHARACTER_METADATA
```

### Step 1.2 — Fill gaps in mappings

After tests expose missing entries:
- Add missing characters to `CHARACTER_KEY_TO_ID` in `characterData.ts`
- Add missing characters to `CHARACTER_ICON_NAMES` in `characterData.ts`
- Add missing characters to `CHARACTER_METADATA` in `characterMetadata.ts`
- Ensure key normalization handles all format variations

### Step 1.3 — Auto-resolve avatarId on character create/save

**Test:** `characterRepo.test.ts` (extend existing)
```
describe('create')
  ✓ assigns avatarId from key when avatarId is not provided
  ✓ preserves existing avatarId when already set (e.g., from Enka import)
```

**Implementation:** In the repo's `create` method, call `getAvatarIdFromKey(character.key)` if `avatarId` is missing.

---

## Sprint 2: CharacterCard Component Testing & Display Name

**Goal:** CharacterCard renders correctly for all character states, displays human-readable names, and gracefully handles edge cases.

### Success Criteria
- [ ] CharacterCard has comprehensive unit tests covering all render states
- [ ] Character display names are human-readable (e.g., "Kamisato Ayaka" not "KamisatoAyaka")
- [ ] Characters with valid metadata always show portraits (no unnecessary fallbacks)
- [ ] All tests pass: `npm run test:run`

### Step 2.1 — CharacterCard unit tests (NEW test file)

**File:** `src/features/roster/components/CharacterCard.test.tsx`

Tests to write:
```
describe('CharacterCard')
  describe('portrait rendering')
    ✓ renders character portrait when avatarId is present
    ✓ renders fallback User icon when avatarId is missing
    ✓ renders fallback User icon when image fails to load (onError)
    ✓ uses correct alt text for accessibility

  describe('character info display')
    ✓ displays human-readable name (not raw key)
    ✓ displays level and max level based on ascension
    ✓ displays correct constellation stars (filled vs unfilled)
    ✓ displays talent levels (AA, Skill, Burst)
    ✓ displays weapon name and refinement
    ✓ displays weapon level

  describe('priority badge')
    ✓ shows correct priority label
    ✓ applies correct border color for each priority

  describe('artifact score')
    ✓ shows artifact score when artifacts exist
    ✓ hides artifact score section when no artifacts

  describe('team names')
    ✓ shows team badges when teamNames provided
    ✓ hides team section when no teamNames

  describe('actions')
    ✓ calls onEdit when edit button clicked
    ✓ calls onDelete when delete button clicked
    ✓ calls onClick when card clicked
    ✓ edit/delete clicks don't bubble to card onClick
```

### Step 2.2 — Display name utility

**Test first** in `characterData.test.ts`:
```
describe('getDisplayName')
  ✓ converts PascalCase to spaces: "KamisatoAyaka" → "Kamisato Ayaka"
  ✓ handles "HuTao" → "Hu Tao"
  ✓ preserves already-spaced names: "Hu Tao" → "Hu Tao"
  ✓ handles single-word names: "Furina" → "Furina"
  ✓ handles special cases with lookup table (e.g., "Itto" should stay "Itto")
```

**Implementation:** Add `getDisplayName()` to `characterData.ts`, use it in CharacterCard.

### Step 2.3 — Wire portrait resolution through key (not just avatarId)

Add a convenience function that combines the lookup:

**Test:**
```
describe('getCharacterPortraitUrlByKey')
  ✓ resolves portrait URL from character key directly
  ✓ handles PascalCase keys
  ✓ handles keys with spaces
  ✓ returns undefined for unknown keys
```

**Implementation:** `getCharacterPortraitUrlByKey(key) = getCharacterPortraitUrl(getAvatarIdFromKey(key))`

Update CharacterCard to use this as a fallback when `avatarId` is missing:
```typescript
const portraitUrl = getCharacterPortraitUrl(character.avatarId)
  ?? getCharacterPortraitUrlByKey(character.key);
```

---

## Sprint 3: Existing Test Hardening & Regression Prevention

**Goal:** Strengthen existing tests and add regression guards so future character additions never silently break.

### Success Criteria
- [ ] characterSelectors tests cover unknown/missing metadata scenarios
- [ ] Snapshot test validates metadata count hasn't accidentally decreased
- [ ] CharacterForm tests validate avatarId assignment
- [ ] All existing tests still pass (no regressions)
- [ ] `npm run test:run` passes cleanly

### Step 3.1 — Harden characterSelectors tests

**Extend:** `characterSelectors.test.ts`
```
describe('filterAndSortCharacters')
  ✓ characters with no metadata still appear in unfiltered results
  ✓ characters with no metadata are excluded by element filter (not crash)
  ✓ search filter works for characters without metadata
```

### Step 3.2 — Metadata completeness snapshot test

**Add to:** `characterData.test.ts`
```
describe('metadata completeness')
  ✓ CHARACTER_METADATA has at least 100 entries (catches accidental truncation)
  ✓ CHARACTER_KEY_TO_ID has at least 100 entries
  ✓ CHARACTER_ICON_NAMES has at least 80 entries
  ✓ no duplicate keys in CHARACTER_METADATA (normalized)
```

### Step 3.3 — CharacterForm avatar resolution test

**File:** `src/features/roster/components/CharacterForm.test.tsx` (NEW or extend)
```
describe('CharacterForm')
  ✓ selecting a character key populates avatarId automatically
  ✓ submitting form includes resolved avatarId in character data
```

---

## Implementation Order (TDD Cycle)

For each step within each sprint:

1. **Red** — Write the failing test(s)
2. **Green** — Write the minimum code to make tests pass
3. **Refactor** — Clean up without changing behavior
4. **Verify** — Run full test suite (`npm run test:run`) to confirm no regressions

## Files Modified/Created

### New Files
- `src/lib/characterData.test.ts` — Core data layer tests
- `src/features/roster/components/CharacterCard.test.ts` — Component tests

### Modified Files
- `src/lib/characterData.ts` — Fill mapping gaps, add `getDisplayName()`, add `getCharacterPortraitUrlByKey()`
- `src/features/roster/data/characterMetadata.ts` — Fill missing entries
- `src/features/roster/components/CharacterCard.tsx` — Use display name, improved portrait resolution
- `src/features/roster/repo/characterRepo.ts` — Auto-resolve avatarId on create
- `src/features/roster/selectors/characterSelectors.test.ts` — Additional edge case tests
- `src/features/roster/repo/characterRepo.test.ts` — avatarId resolution tests

### Not Modified (out of scope)
- E2E tests (unreliable, not worth fixing in this effort)
- Other features (wishes, planner, etc.)
- Styling/layout changes (purely data + rendering correctness)

## Risk Mitigation

- **No breaking changes** — All changes are additive (new functions, filled mappings, extended tests)
- **avatarId resolution is additive** — Existing characters with avatarId are untouched; only missing ones get filled
- **Display name is opt-in** — `getDisplayName()` is a new function; existing code continues to work
- **Full test suite gates each sprint** — No sprint is complete until `npm run test:run` passes

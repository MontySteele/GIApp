# Phase 3: Roster & Progression UX Overhaul

## Task 1: Embed Material Progression on CharacterDetailPage

**Goal:** Add a "Progression" card directly on the character detail page showing current → target state with goal presets, material requirements, farming availability.

### New file: `src/features/roster/components/CharacterProgression.tsx`

A self-contained component that:
- Accepts a `Character` prop and renders inline on the detail page
- Has a goal preset selector (functional/comfortable/full/next) using the existing `GoalType` type
- Calls `calculateAscensionSummary()` from the existing planner domain to get materials
- Displays:
  - **Current → Target summary**: "Lv.70 → Lv.90, Talents 1/6/6 → 10/10/10"
  - **Material list**: Grouped by category (talent books, boss mats, gems, common, mora/exp) showing required/owned/deficit
  - **Farming availability**: For talent book materials, show which days they're available using `analyzeFarmingSchedule()`
- Reuses existing components: `MaterialsList` and `MaterialItem` from planner
- Uses `useMaterials()` hook for inventory awareness
- Loading/error states for the async calculation

This replaces the current "Plan Materials" button that navigates away to `/planner`. We keep that link as a secondary "Open in Planner" action for users who want the full sidebar experience.

### Modify: `src/features/roster/pages/CharacterDetailPage.tsx`

- Import and render `<CharacterProgression character={character} />` between the Build Recommendations card and the Artifacts card
- Keep the "Plan Materials" header button but change it to a subtle link/icon instead of a primary CTA

### Test: `src/features/roster/components/CharacterProgression.test.tsx`

- Mock `calculateAscensionSummary` to return a known summary
- Mock `useMaterials` for inventory data
- Verify goal preset buttons render and switch
- Verify material list renders with deficit counts
- Verify farming day badges appear for talent materials

---

## Task 2: Searchable Character/Weapon Selectors in CharacterForm

**Goal:** Replace free-text inputs for character name and weapon name with searchable autocomplete dropdowns.

### New file: `src/components/ui/SearchableSelect.tsx`

A reusable autocomplete component that:
- Accepts `options: { value: string; label: string; sublabel?: string }[]`
- Has a text input for filtering with keyboard navigation (arrow keys, enter, escape)
- Shows a dropdown of filtered matches
- Supports both controlled and uncontrolled usage
- Allows free text entry as fallback (for names not in the list)

### Modify: `src/features/roster/components/CharacterForm.tsx`

- Replace the "Character Name" `<Input>` with `<SearchableSelect>` populated from `ALL_CHARACTERS` (showing `name` as label, `element + weapon` as sublabel)
- Replace the "Weapon Name" `<Input>` with `<SearchableSelect>` populated from `WEAPONS` filtered by the character's weapon type (from `ALL_CHARACTERS` lookup)
- When a character is selected from the dropdown, auto-populate the weapon type filter
- When editing an existing character, the key field should be disabled/read-only (can't change character identity)

### Test: `src/components/ui/SearchableSelect.test.tsx`

- Renders options and filters on input
- Keyboard navigation works
- Selection calls onChange
- Free text fallback works

### Test update: `src/features/roster/components/CharacterForm.test.tsx`

- Update any tests that interact with the character name field

---

## Task 3: Wishlist Accessible from Roster Page

**Goal:** Add a "Wishlist" section to the Roster page so users can manage wanted characters without navigating to the Planner.

### New file: `src/features/roster/components/RosterWishlist.tsx`

A compact wishlist panel that:
- Shows wishlisted characters in a card grid (matching roster card style)
- Has an "Add to Wishlist" button that opens a searchable character picker (using `SearchableSelect` from Task 2)
- Filters out characters already owned (present in roster)
- Each wishlist card shows: character name, target goal badge, remove button
- Clicking a wishlist character goal badge cycles through functional/comfortable/full
- Uses `useWishlistStore` (already exists in Zustand)

### Modify: `src/features/roster/pages/RosterPage.tsx`

- Add `<RosterWishlist ownedKeys={characters.map(c => c.key)} />` between the Teams section and the Characters section
- The section is collapsible and shows count in header: "Wishlist (3)"

### Test: `src/features/roster/components/RosterWishlist.test.tsx`

- Renders wishlist characters
- Add character works (filters out owned)
- Remove character works
- Goal toggle cycles through presets

---

## Task 4: Simplify the Planner Page

**Goal:** Make single-character mode the default, remove the mode switcher, keep multi-character aggregation on the Teams detail page.

### Modify: `src/features/planner/pages/PlannerPage.tsx`

- Remove the Single/Multi mode toggle from the header
- Default to single-character mode only
- Remove all multi-mode UI: `MultiModeSelection`, `WishlistSection`, `MultiGoalSummary`, `MultiMaterialsBreakdown`, `MultiModeEmptyState`
- Remove the `useMultiCharacterPlan` and `useWeaponPlan` hook usage
- Remove the `usePlannerState` hook's `plannerMode`/`multiTab`/`multiSelectedKeys` state
- Simplify the layout: single column with character selector → goal summary → materials breakdown → farming recommendations
- Move the sidebar content (resin tracker, domain schedule, resin tips) below the materials instead of in a sidebar column
- Keep the existing URL param support (`?character=Furina`) so the CharacterDetailPage link still works

### Verify: `src/features/teams/pages/TeamDetailPage.tsx`

- Confirm it already uses `useTeamPlan` for multi-character aggregation (it should, from Phase 3 of the refactoring plan)
- If not, wire up `useTeamPlan` to show aggregated materials on the team detail page

### Test updates: `src/features/planner/pages/PlannerPage.test.tsx`

- Remove/update tests for multi-mode
- Verify single-character flow works end-to-end
- Verify URL param auto-selection still works

---

## Implementation Order

1. **Task 2** first (SearchableSelect) — it's a new shared component used by Tasks 1 and 3
2. **Task 1** (CharacterProgression) — the highest-impact UX improvement
3. **Task 3** (RosterWishlist) — uses SearchableSelect, relatively isolated
4. **Task 4** (Simplify Planner) — removal/simplification, do last to avoid breaking existing flows while building

## Files Created
- `src/components/ui/SearchableSelect.tsx`
- `src/components/ui/SearchableSelect.test.tsx`
- `src/features/roster/components/CharacterProgression.tsx`
- `src/features/roster/components/CharacterProgression.test.tsx`
- `src/features/roster/components/RosterWishlist.tsx`
- `src/features/roster/components/RosterWishlist.test.tsx`

## Files Modified
- `src/features/roster/components/CharacterForm.tsx`
- `src/features/roster/pages/CharacterDetailPage.tsx`
- `src/features/roster/pages/RosterPage.tsx`
- `src/features/planner/pages/PlannerPage.tsx`
- Tests for the above

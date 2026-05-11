# Sprint 17: Type Safety & Validation

**Duration:** January 2026
**Theme:** Fix TypeScript errors, add form validation, expand E2E coverage
**Status:** ✅ COMPLETED

---

## Overview

Sprint 17 focuses on improving type safety and validation across the codebase. The primary goals are to eliminate existing TypeScript errors, add Zod validation to key forms, and expand E2E test coverage with Tier 2 tests.

---

## Sprint Goals

### P0: Fix TypeScript Errors (Blocking) ✅
1. **BuildTemplateForm.tsx** - 8 errors ✅
2. **GcsimImportModal.tsx** - 1 error ✅
3. **gcsimParser.ts** - 4 errors ✅

### P1: Form Validation with Zod ✅
1. **CharacterForm** - Character creation/editing ✅
2. **TeamForm** - Team creation/editing ✅
3. **BuildTemplateForm** - Build template management ✅

### P1: E2E Tier 2 Tests (4 of 8) ✅
1. Multi-character planning flow ✅
2. Pull calculators (single + multi-target) ✅
3. wfpsim export flow ✅
4. Modal navigation patterns ✅

### P2: Extract Magic Strings ✅
1. Banner type constants ✅
2. Element/weapon type enums ✅
3. LocalStorage keys ✅
4. Error message constants ✅

---

## Task Details

### 1. Fix TypeScript Errors in Builds Feature

#### BuildTemplateForm.tsx (8 errors)
```
Line 14: 'ArtifactSetData' declared but never read
Line 45: Missing targetLevel, targetAscension in leveling default
Line 107: '"secondary"' not assignable to Badge variant
Line 577: SetRecommendation[][] not assignable to string[]
Line 579: string[] not assignable to SetRecommendation[][]
Line 593, 604, 615: string[] not assignable to MainStatKey[]
```

**Fix approach:**
- Remove unused import (ArtifactSetData)
- Add missing default values for leveling object
- Update Badge variant to valid type or extend Badge types
- Fix artifact set recommendation type handling
- Add proper type assertions for main stat arrays

#### GcsimImportModal.tsx (1 error)
```
Line 248: '"secondary"' not assignable to Badge variant
```

**Fix approach:**
- Same Badge variant fix as BuildTemplateForm

#### gcsimParser.ts (4 errors)
```
Line 133: string | undefined not assignable to string
Line 134: string | undefined not assignable to string
Line 158: Object possibly undefined
Line 167: 'params' possibly undefined
```

**Fix approach:**
- Add null checks and default values
- Use optional chaining or nullish coalescing

---

### 2. Zod Form Validation

#### Installation
```bash
npm install zod
```

#### Schema Locations
```
src/lib/validation/
├── characterSchema.ts    # Character form validation
├── teamSchema.ts         # Team form validation
├── buildTemplateSchema.ts # Build template validation
└── index.ts              # Barrel export
```

#### CharacterForm Schema
```typescript
import { z } from 'zod';

export const characterSchema = z.object({
  key: z.string().min(1, 'Character name is required'),
  level: z.number().min(1).max(90),
  ascension: z.number().min(0).max(6),
  constellation: z.number().min(0).max(6),
  talents: z.object({
    auto: z.number().min(1).max(10),
    skill: z.number().min(1).max(10),
    burst: z.number().min(1).max(10),
  }),
  priority: z.enum(['high', 'medium', 'low']).optional(),
});
```

#### TeamForm Schema
```typescript
export const teamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(50),
  members: z.array(z.string()).min(1, 'At least one member required').max(4),
  tags: z.array(z.string()).max(10),
  notes: z.string().max(500).optional(),
});
```

#### Integration Pattern
```typescript
// In form component
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { characterSchema } from '@/lib/validation';

const form = useForm({
  resolver: zodResolver(characterSchema),
  defaultValues: { ... }
});
```

---

### 3. E2E Tier 2 Tests

#### Test: Multi-Character Planning
```typescript
// e2e/tests/multi-character-planner.spec.ts
test('can select multiple characters and see aggregated materials', async ({ page }) => {
  // 1. Navigate to planner
  // 2. Select 3+ characters
  // 3. Verify material aggregation
  // 4. Verify resin calculation
  // 5. Verify today's farming recommendations
});
```

#### Test: Pull Calculators
```typescript
// e2e/tests/pull-calculators.spec.ts
test('single target calculator shows correct probabilities', async ({ page }) => {
  // 1. Navigate to calculator
  // 2. Set pity, guaranteed, pulls
  // 3. Run simulation
  // 4. Verify probability display
});

test('multi-target calculator handles sequential targets', async ({ page }) => {
  // 1. Add multiple targets
  // 2. Configure pity inheritance
  // 3. Run simulation
  // 4. Verify cumulative results
});
```

#### Test: wfpsim Export
```typescript
// e2e/tests/wfpsim-export.spec.ts
test('can export team to wfpsim format', async ({ page }) => {
  // 1. Create team with 4 characters
  // 2. Open export modal
  // 3. Configure options
  // 4. Copy config
  // 5. Verify config structure
});
```

#### Test: Modal Navigation
```typescript
// e2e/tests/modal-navigation.spec.ts
test('can navigate between modal views without data loss', async ({ page }) => {
  // 1. Open character form
  // 2. Fill partial data
  // 3. Navigate to different tab
  // 4. Return to form
  // 5. Verify data preserved
});
```

---

### 4. Extract Magic Strings

#### Constants File Structure
```
src/lib/constants/
├── bannerTypes.ts     # 'character', 'weapon', 'standard', 'chronicled'
├── elements.ts        # Element names and colors
├── weaponTypes.ts     # Weapon type names
├── storageKeys.ts     # LocalStorage key constants
├── errorMessages.ts   # User-facing error strings
└── index.ts           # Barrel export
```

#### Example: Banner Types
```typescript
// src/lib/constants/bannerTypes.ts
export const BANNER_TYPES = {
  CHARACTER: 'character',
  WEAPON: 'weapon',
  STANDARD: 'standard',
  CHRONICLED: 'chronicled',
} as const;

export type BannerType = typeof BANNER_TYPES[keyof typeof BANNER_TYPES];
```

#### Example: Storage Keys
```typescript
// src/lib/constants/storageKeys.ts
export const STORAGE_KEYS = {
  THEME: 'gi-tracker-theme',
  WEEKLY_BOSS_STATE: 'weekly-boss-tracker-state',
  CALCULATOR_SCENARIOS: 'calculator-scenarios',
  RATE_WINDOW: 'primogem-rate-window',
} as const;
```

---

## Files to Create

```
src/lib/validation/
├── characterSchema.ts
├── teamSchema.ts
├── buildTemplateSchema.ts
└── index.ts

src/lib/constants/
├── bannerTypes.ts
├── elements.ts
├── weaponTypes.ts
├── storageKeys.ts
├── errorMessages.ts
└── index.ts

e2e/tests/
├── multi-character-planner.spec.ts
├── pull-calculators.spec.ts
├── wfpsim-export.spec.ts
└── modal-navigation.spec.ts
```

## Files to Modify

```
src/features/builds/components/BuildTemplateForm.tsx  # Fix TS errors
src/features/builds/components/GcsimImportModal.tsx   # Fix TS errors
src/features/builds/domain/gcsimParser.ts             # Fix TS errors
src/features/roster/components/CharacterForm.tsx      # Add Zod validation
src/features/roster/components/TeamForm.tsx           # Add Zod validation
src/components/ui/Badge.tsx                           # Add 'secondary' variant
package.json                                          # Add zod dependency
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| TypeScript Errors | 0 (down from 13) |
| Zod Schemas | 3 forms validated |
| E2E Tier 2 Tests | 4 new tests |
| Constants Extracted | 5 files |

---

## Implementation Order

1. **Day 1:** Fix TypeScript errors in builds feature
2. **Day 2:** Add Badge 'secondary' variant, install Zod
3. **Day 3:** Create Zod schemas for CharacterForm, TeamForm
4. **Day 4:** Add Zod to BuildTemplateForm
5. **Day 5:** Extract magic strings to constants
6. **Day 6-7:** Write E2E Tier 2 tests
7. **Day 8:** Documentation and cleanup

---

## Dependencies

```bash
# New dependencies
npm install zod
npm install @hookform/resolvers  # If using react-hook-form
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking form behavior | Add validation incrementally, test each form |
| E2E test flakiness | Use proper waits, retry logic |
| Type changes cascade | Run full type check after each file |

---

## Implementation Summary

### What Was Delivered

**P0: TypeScript Error Fixes (13 errors → 0)**
- `BuildTemplateForm.tsx`: Created simplified `FormData` interface with `templateToFormData()` and `formDataToTemplate()` conversion functions to handle type mismatches between form state and `BuildTemplate` type
- `GcsimImportModal.tsx`: Fixed by adding 'secondary' variant to Badge component
- `gcsimParser.ts`: Added null checks for regex match results (`charMatch`, `lvlMatch`) to prevent runtime errors
- `Badge.tsx`: Added 'secondary' variant with `bg-slate-600 text-slate-200` styling

**P1: Zod Form Validation (3 schemas)**
- `src/lib/validation/characterSchema.ts`: Level (1-90), ascension (0-6), constellation (0-6), talents (1-15), equipped weapon/artifacts, priority enum
- `src/lib/validation/teamSchema.ts`: Team name (1-50 chars), 1-4 character keys, notes, tags array
- `src/lib/validation/buildTemplateSchema.ts`: Full build template with nested weapon, artifact, and leveling validation
- Integration: All three forms (CharacterForm, TeamForm, BuildTemplateForm) display validation errors inline

**P1: E2E Tier 2 Tests (4 new test files)**
- `multi-character-planner.spec.ts`: Tests multi-character selection, material aggregation, resin calculation
- `pull-calculators.spec.ts`: Tests single-target pity calculator, multi-target sequential planning, probability display
- `wfpsim-export.spec.ts`: Tests team export modal, config generation, clipboard copy
- `modal-navigation.spec.ts`: Tests modal state preservation, accessibility (focus trap, escape key), nested modals

**P2: Constants Extraction (5 files)**
- `src/lib/constants/bannerTypes.ts`: CHARACTER, WEAPON, STANDARD, CHRONICLED with TypeScript types
- `src/lib/constants/elements.ts`: All 7 elements with colors, icons, and resonance labels
- `src/lib/constants/weaponTypes.ts`: All 5 weapon types with display names and icons
- `src/lib/constants/storageKeys.ts`: LocalStorage keys (theme, boss state, calculator, rate window)
- `src/lib/constants/errorMessages.ts`: Common error messages for forms and operations

**Additional Fixes (build blockers)**
- `GoalsSection.tsx`: Fixed ChecklistItem id generation and toggle function parameter types
- `useFilterSort.ts`: Added `extends Record<string, unknown>` to filter interfaces for type constraint compatibility
- `BuildTemplatesPage.tsx`: Fixed import transformation (string[] → SetRecommendation[][], MainStatKey[] casting)
- `TeamsPage.tsx`, `TeamDetailPage.tsx`: Removed unused variables and imports
- `teams/index.ts`: Fixed export name (GcsimExportOptions instead of GcsimConfig/GcsimOptions)

### Files Changed

| Category | Files |
|----------|-------|
| New Files | 11 (4 E2E tests, 4 validation schemas, 5 constants files) |
| Modified Files | 16 |
| Lines Added | ~1,800 |
| Lines Removed | ~40 |

### Metrics Achieved

| Metric | Target | Achieved |
|--------|--------|----------|
| TypeScript Errors | 0 | ✅ 0 |
| Zod Schemas | 3 | ✅ 3 |
| E2E Tier 2 Tests | 4 | ✅ 4 |
| Constants Files | 5 | ✅ 5 |
| Build Status | Passing | ✅ Passing |

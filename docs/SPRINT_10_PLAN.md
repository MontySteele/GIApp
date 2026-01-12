# Sprint 10 Architecture Plan

> **Scope**: 7 major items covering features, testing, accessibility, and UX improvements
> **Estimated Effort**: 50-61 story points
> **Target**: Bring app to production-ready standard

---

## Overview

| Item | Description | Points | Priority |
|------|-------------|--------|----------|
| 1 | Artifact Optimizer | 8-10 | Medium |
| 2 | QR Code Camera Import | 5-6 | Medium |
| 3 | Test Coverage (60%+) | 13-15 | High |
| 4 | Accessibility (WCAG 2.1 AA) | 6-8 | High |
| 5 | User Feedback System | 5-6 | High |
| 6 | Component Refactoring | 8-10 | Medium |
| 7 | Loading State Improvements | 5-6 | Medium |

---

## Dependency Graph

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  [4] Accessibility ──────────┐                               │
│         │                    │                               │
│         ▼                    │                               │
│  [5] User Feedback ──────────┤                               │
│                              │                               │
│  [6] Component Refactoring ──┤──▶ enables better testing     │
│                              │                               │
│  [7] Loading States ─────────┘                               │
│                                                              │
│  [1] Artifact Optimizer ─────┐                               │
│                              ├──▶ independent features       │
│  [2] QR Camera Import ───────┘                               │
│                                                              │
│  [3] Test Coverage ──────────────▶ runs throughout sprint    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Recommended Execution Phases

| Phase | Focus | Items | Rationale |
|-------|-------|-------|-----------|
| **Phase 1** | Foundation | 4, 6, 7 | Accessibility, refactoring, loading states |
| **Phase 2** | Infrastructure | 3, 5 | Tests and user feedback system |
| **Phase 3** | Features | 1, 2 | Artifact optimizer, QR camera import |

---

## Item 1: Artifact Optimizer

**Goal**: Basic artifact scoring algorithm with set recommendations

### New Files

```
src/features/artifacts/
├── domain/
│   ├── artifactScoring.ts          # EXTEND
│   ├── setRecommendations.ts       # NEW
│   └── setRecommendations.test.ts  # NEW
├── components/
│   ├── ArtifactOptimizer.tsx       # NEW
│   ├── SetRecommendationCard.tsx   # NEW
│   └── BuildComparison.tsx         # NEW
└── hooks/
    └── useArtifactOptimizer.ts     # NEW
```

### Types to Add

```typescript
export interface SetBonus {
  setKey: string;
  pieces: 2 | 4;
  effect: string;
  statBonuses?: Record<string, number>;
}

export interface CharacterBuild {
  characterKey: string;
  recommendedSets: SetBonus[][];
  valuableStats: {
    mainStats: Record<SlotKey, string[]>;
    substats: string[];
  };
  buildNotes?: string;
}

export interface ArtifactRecommendation {
  artifactId: string;
  targetCharacterKey: string;
  score: number;
  reasoning: string;
  upgradePotential: 'low' | 'medium' | 'high';
}
```

### Implementation Steps

1. Extend `artifactScoring.ts` with character-specific weighting
2. Create `setRecommendations.ts` with optimal sets per character
3. Build optimizer UI showing equipped vs recommended
4. Add "who wants this artifact" suggestions

---

## Item 2: QR Code Camera Import

**Goal**: Scan Enka QR codes directly with device camera

### New Files

```
src/features/roster/components/
├── QRCameraScanner.tsx             # NEW
└── QRCameraScanner.test.tsx        # NEW
src/components/ui/
└── CameraPermissionDialog.tsx      # NEW
src/lib/
└── qrScanner.ts                    # NEW
```

### Types to Add

```typescript
export interface QRScanResult {
  type: 'enka_url' | 'sync_payload' | 'unknown';
  data: string;
  parsedUid?: string;
}

export interface CameraState {
  hasPermission: boolean | null;
  isScanning: boolean;
  error: string | null;
  lastScan: QRScanResult | null;
}
```

### Implementation Steps

1. Create `QRScannerManager` class wrapping html5-qrcode
2. Build `QRCameraScanner.tsx` with permission handling
3. Auto-detect Enka URLs (pattern: `enka.network/u/{uid}`)
4. Integrate with existing `EnkaImport.tsx`
5. Handle edge cases (no camera, permission denied)

---

## Item 3: Test Coverage Improvement

**Goal**: Achieve 60%+ test coverage with page and integration tests

### New Test Files

```
src/features/
├── dashboard/pages/DashboardPage.test.tsx
├── artifacts/pages/ArtifactsPage.test.tsx
├── weapons/pages/WeaponsPage.test.tsx
├── planner/pages/PlannerPage.test.tsx
├── ledger/pages/LedgerPage.test.tsx
├── calendar/pages/CalendarPage.test.tsx
├── notes/pages/NotesPage.test.tsx
├── sync/pages/SyncPage.test.tsx
├── wishes/pages/WishHistoryPage.test.tsx
└── calculator/pages/CalculatorPage.test.tsx

src/components/ui/
├── Button.test.tsx
├── Card.test.tsx
├── Modal.test.tsx
├── Input.test.tsx
├── Select.test.tsx
└── Badge.test.tsx

src/test/
├── mocks/
│   ├── characterMocks.ts
│   ├── artifactMocks.ts
│   └── routerMocks.ts
└── integration/
    ├── characterFlow.test.tsx
    ├── wishImportFlow.test.tsx
    └── plannerFlow.test.tsx
```

### Test Pattern to Follow

```typescript
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../hooks/useFeatureHook', () => ({
  useFeatureHook: () => mockHookReturn
}));

describe('PageName', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders loading state', () => { /* ... */ });
  it('renders empty state when no data', () => { /* ... */ });
  it('renders data correctly', () => { /* ... */ });
  it('handles user interactions', async () => { /* ... */ });
});
```

### Implementation Steps

1. Fix existing 39 failing tests
2. Add page tests for all 11 pages
3. Add UI component tests for 6 core components
4. Add 3 integration tests for critical flows
5. Create shared mock utilities

---

## Item 4: Accessibility Pass (WCAG 2.1 AA)

**Goal**: Full keyboard navigation and screen reader support

### Files to Modify/Create

```
src/components/ui/
├── Modal.tsx                    # MODIFY
├── Button.tsx                   # MODIFY
├── Input.tsx                    # MODIFY
├── Select.tsx                   # MODIFY
└── SkipLink.tsx                 # NEW
src/app/
├── Layout.tsx                   # MODIFY
└── a11y.ts                      # NEW
src/hooks/
└── useFocusTrap.ts              # NEW
```

### Modal Accessibility Changes

```tsx
// Before
<div className="fixed inset-0 z-50 ...">
  <div className="absolute inset-0 bg-black/70" onClick={onClose} />
  <div className="relative w-full ...">

// After
<div
  className="fixed inset-0 z-50 ..."
  role="dialog"
  aria-modal="true"
  aria-labelledby={titleId}
>
  <div
    className="absolute inset-0 bg-black/70"
    onClick={onClose}
    aria-label="Close modal"
  />
  <div
    className="relative w-full ..."
    onKeyDown={handleKeyDown}  // ESC to close
  >
```

### Implementation Steps

1. Add `role="dialog"`, `aria-modal`, `aria-labelledby` to Modal
2. Implement focus trap in modals
3. Add ESC key handler for modal close
4. Add `aria-invalid`, `aria-describedby` to form inputs
5. Add skip link and landmark regions to Layout
6. Create focus management utilities

---

## Item 5: User Feedback System

**Goal**: Toast notifications replacing console.error

### New Files

```
src/components/ui/
├── Toast.tsx
├── Toast.test.tsx
└── ToastContainer.tsx
src/stores/
├── toastStore.ts
└── toastStore.test.ts
src/hooks/
└── useToast.ts
src/lib/
└── errorHandler.ts
```

### Types to Add

```typescript
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;  // ms, 0 = persistent
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

### Toast Store

```typescript
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    if (toast.duration !== 0) {
      setTimeout(() => get().removeToast(id), toast.duration ?? 5000);
    }
    return id;
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),
  clearAll: () => set({ toasts: [] }),
}));
```

### Convenience Hook

```typescript
export function useToast() {
  const { addToast } = useToastStore();
  return {
    success: (title: string, message?: string) =>
      addToast({ variant: 'success', title, message }),
    error: (title: string, message?: string) =>
      addToast({ variant: 'error', title, message }),
    warning: (title: string, message?: string) =>
      addToast({ variant: 'warning', title, message }),
    info: (title: string, message?: string) =>
      addToast({ variant: 'info', title, message }),
  };
}
```

### Implementation Steps

1. Create toast store with auto-dismiss
2. Build Toast and ToastContainer components
3. Add ARIA live region for screen readers
4. Create `handleError()` utility
5. Replace 21 `console.error` calls throughout codebase

---

## Item 6: Component Refactoring

**Goal**: Split RosterPage (645 lines) into manageable components

### New File Structure

```
src/features/roster/
├── pages/
│   └── RosterPage.tsx              # REFACTOR (~200 lines)
├── components/
│   ├── CharacterGrid.tsx           # NEW
│   ├── CharacterToolbar.tsx        # NEW
│   ├── TeamSection.tsx             # NEW
│   ├── modals/
│   │   ├── AddCharacterModal.tsx   # NEW
│   │   ├── EditCharacterModal.tsx  # NEW
│   │   ├── DeleteConfirmModal.tsx  # NEW
│   │   ├── ExportModal.tsx         # NEW
│   │   └── TeamModal.tsx           # NEW
│   └── index.ts                    # NEW
└── hooks/
    ├── useRosterModals.ts          # NEW
    └── useRosterFilters.ts         # NEW
```

### Component Interfaces

```typescript
// CharacterToolbar
interface CharacterToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  sortField: SortField;
  onSortChange: (field: SortField) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

// TeamSection
interface TeamSectionProps {
  teams: Team[];
  characterByKey: Map<string, Character>;
  onCreateTeam: () => void;
  onEditTeam: (team: Team) => void;
  onDeleteTeam: (team: Team) => void;
  isLoading: boolean;
}
```

### Modal State Hook

```typescript
export function useRosterModals() {
  const [state, setState] = useState<ModalState>({ type: null, data: null });

  return {
    openAddModal: () => setState({ type: 'add', data: null }),
    openEditModal: (char: Character) => setState({ type: 'edit', data: char }),
    openDeleteModal: (char: Character) => setState({ type: 'delete', data: char }),
    closeModal: () => setState({ type: null, data: null }),
    state,
  };
}
```

### Implementation Steps

1. Extract CharacterToolbar (~80 lines)
2. Extract TeamSection (~100 lines)
3. Extract 5 modal components
4. Create useRosterModals hook
5. Refactor RosterPage to orchestrate sub-components

---

## Item 7: Loading State Improvements

**Goal**: Skeleton screens and retry mechanisms

### New Files

```
src/components/ui/
├── Skeleton.tsx
├── Skeleton.test.tsx
├── skeletons/
│   ├── CardSkeleton.tsx
│   ├── TableRowSkeleton.tsx
│   ├── StatCardSkeleton.tsx
│   └── CharacterCardSkeleton.tsx
└── ErrorBoundary.tsx
src/hooks/
├── useRetry.ts
└── useAsyncWithRetry.ts
```

### Types to Add

```typescript
export interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  maxRetries: number;
  error: Error | null;
}

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
  retryState: RetryState;
}
```

### Skeleton Component

```tsx
interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  variant = 'text',
  animation = 'pulse',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-slate-700 rounded',
        animation === 'pulse' && 'animate-pulse',
        variantClasses[variant],
        props.className
      )}
      style={{ width: props.width, height: props.height }}
    />
  );
}
```

### Retry Hook

```typescript
export function useRetry<T>(
  asyncFn: () => Promise<T>,
  options?: { maxRetries?: number; delayMs?: number }
): AsyncState<T> {
  const execute = useCallback(async () => {
    for (let i = 0; i <= (options?.maxRetries ?? 3); i++) {
      try {
        const data = await asyncFn();
        setState({ data, isLoading: false, error: null });
        return;
      } catch (error) {
        if (i === options?.maxRetries) {
          setState({ error, isLoading: false });
        } else {
          await delay(options?.delayMs ?? 1000 * (i + 1));
        }
      }
    }
  }, [asyncFn, options]);

  return { ...state, retry: execute };
}
```

### Implementation Steps

1. Create base Skeleton component with variants
2. Create preset skeletons (Card, CharacterCard, StatCard)
3. Create useRetry hook with exponential backoff
4. Create ErrorBoundary with retry button
5. Update all pages to use skeletons instead of "Loading..."

---

## File Changes Summary

### New Files (32)

| Category | Count | Files |
|----------|-------|-------|
| Components | 15 | Toast, Skeleton, QRScanner, modals, etc. |
| Hooks | 6 | useToast, useRetry, useFocusTrap, etc. |
| Tests | 8 | Page tests, component tests, integration |
| Domain | 2 | setRecommendations, errorHandler |
| Types | 1 | Additions to index.ts |

### Modified Files (12)

- `src/components/ui/Modal.tsx` - Accessibility
- `src/components/ui/Button.tsx` - Accessibility
- `src/components/ui/Input.tsx` - Accessibility
- `src/components/ui/Select.tsx` - Accessibility
- `src/app/Layout.tsx` - Skip links, landmarks
- `src/features/roster/pages/RosterPage.tsx` - Refactor
- `src/features/roster/components/EnkaImport.tsx` - QR integration
- `src/features/artifacts/domain/artifactScoring.ts` - Extend
- `src/types/index.ts` - New types
- All 11 page files - Loading states

---

## Definition of Done

### Per-Item Checklist

- [ ] All new code has corresponding tests
- [ ] Tests pass (existing + new)
- [ ] No TypeScript errors
- [ ] ESLint passes with 0 warnings
- [ ] Accessibility audit passes (for Item 4)
- [ ] Documentation updated if needed

### Sprint Completion Criteria

- [ ] Test coverage reaches 60%+
- [ ] All 11 pages have loading skeletons
- [ ] Modal keyboard navigation works
- [ ] Toast notifications show for all errors
- [ ] RosterPage is under 250 lines
- [ ] Artifact optimizer shows recommendations
- [ ] QR camera import works on mobile

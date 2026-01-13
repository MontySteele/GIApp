# Changelog

## 2026-01-13 (Sprint 16 - UX Polish & Test Coverage)

### UI/UX Improvements
- **ErrorBoundary Component** - Graceful error handling with retry functionality
  - Wraps all feature layouts (Roster, Teams, Wishes) and main Layout
  - Feature-specific error messages
  - "Try Again" button to recover from transient errors
  - Higher-order component (HOC) wrapper for easy integration
- **Breadcrumbs Navigation** - Added to detail pages for better navigation
  - CharacterDetailPage: Home > Roster > [Character Name]
  - TeamDetailPage: Home > Teams > [Team Name]
  - Proper aria-current for accessibility
- **Accessibility (15+ icon buttons)** - Added aria-labels across the app
  - GoalsSection, NotesPage, BuildTemplateCard
  - CharacterCard, TeamCard, TeamsPage
  - PurchaseLedger edit/delete buttons
  - Icons marked as aria-hidden for screen readers
- **Skeleton Loading States** - Enhanced loading experience
  - WeaponsPage: Stats + card grid skeletons
  - ArtifactsPage: Stats + card grid skeletons
  - CharacterDetailPage: Breadcrumb + content skeletons

### Bug Fixes
- **Fixed 'Create Team' bug** - TeamForm prop mismatch (`team`/`onSave` → `initialData`/`onSubmit`)
  - Affected TeamsPage.tsx and TeamDetailPage.tsx
  - Teams can now be created from both Team hub and Team detail view

### Feature Enhancements
- **Link Budget to Calculator** - ReverseCalculator now shows BudgetLinkBanner
  - Displays projected primogem income
  - "Use Budget" button auto-fills calculator inputs
  - "Sync Daily Rate" button updates income projections
- **Enhanced Today's Farming Widget** - Character-specific recommendations
  - New useTodayFarming hook aggregates character material needs
  - Shows which characters need today's talent books
  - "Wait for" section shows upcoming book availability

### Test Coverage
- **Calendar Feature Tests** (111 tests total)
  - ResetTimers.test.tsx (9 tests) - Timer display and countdown
  - EventList.test.tsx (23 tests) - Event rendering and filtering
  - useEvents.test.ts (11 tests) - Hook logic and caching
  - eventTypes.test.ts (11 tests) - Domain type validation
- **Boss Feature Tests** (81 tests total)
  - WeeklyBossTracker edge cases
  - weeklyBossData domain tests
- **Component Tests**
  - ErrorBoundary.test.tsx (17 tests)
  - Breadcrumbs.test.tsx (10 tests)

### Technical
- Total test count: ~1,400+
- New files: 8 (components + tests)
- Modified files: 14 (accessibility + skeletons)

---

## 2026-01-13 (Sprint 15 - E2E Testing & Mobile UX)

### E2E Testing Foundation
- **Playwright Infrastructure** - Full E2E testing framework
  - playwright.config.ts with browser configurations
  - Page Object Model (POM) pattern for maintainability
  - Custom fixtures for test data seeding
- **Tier 1 Critical Tests** (8 test files)
  - Character CRUD operations
  - Enka.network UID import
  - GOOD format import/export
  - Team creation with search
  - Wish history display
  - Navigation flows
- **CI Integration** - E2E tests in GitHub Actions pipeline

### Mobile Bottom Navigation
- **MobileBottomNav Component** - Tab bar for screens < 768px
  - 6 navigation items (Home, Roster, Teams, Wishes, Calendar, Settings)
  - Active tab highlighting with indicator
  - Hides desktop TabNav on mobile
  - 14 unit tests

### Technical
- Documented E2E testing patterns in docs/E2E_TESTING.md
- Added Playwright to devDependencies

See `docs/SPRINT_15_PLAN.md` for full details.

---

## 2026-01-13 (Sprint 14 - Build Templates UX Enhancement)

### Build Template Improvements
- **Character search in TeamForm** - Quick filter when adding characters to teams
- **Equipment data file** - Static weapon/artifact data for form dropdowns (100+ weapons, 40+ sets)
- **BuildTemplateForm overhaul** - Replaced text inputs with searchable dropdowns
  - Weapon selector grouped by rarity and type
  - Artifact set selector with 2pc/4pc bonus display
  - Main stat buttons by slot
  - Substat priority picker with drag-and-drop ordering

### gcsim Import
- **gcsimParser** - Parses gcsim/wfpsim config format (~440 lines)
  - Extracts character key, level, constellation, talents
  - Parses weapon with refinement
  - Parses artifact sets with piece counts
  - Infers main stats from stat values
- **GcsimImportModal** - UI for pasting configs and selecting builds to import
  - Preview cards showing weapon/artifacts
  - Multi-select before importing
  - Converts to build template format

### Shared Utilities
- **filterSort.ts** - Consolidated ~480 lines of duplicate filter/sort logic
  - Generic search, filter, and sort functions
  - Genshin-specific helpers (sortByRarity, sortByPriority)
  - Nested property access with dot notation
- **useFilterSort hook** - React hook for filter/sort state management (future use)

### Tests
- 49 new tests (26 for gcsimParser, 23 for filterSort)
- Total test count: 1,263

---

## 2026-01-12 (Sprint 12 - Phase 1 Complete)

### wfpsim Export Integration
- **gcsim Key Mappings** (~670 lines) - Comprehensive character, weapon, artifact, and stat mappings
  - 100+ character keys with special handling (Raiden Shogun, Hu Tao, Traveler variants)
  - 150+ weapon keys (unique per weapon, not shared by type)
  - 40+ artifact set keys
  - 25 stat keys with percentage conversion
- **Config Generator** (~410 lines) - Generates wfpsim-compatible team configurations
  - Full team export with options (iterations, duration, target settings)
  - Validation with error messages for incomplete data
  - Artifact stat aggregation (main stats + substats)
- **Export UI Modal** (~220 lines) - User-friendly export interface
  - Config preview with adjustable options
  - Copy to clipboard with visual feedback
  - Open wfpsim.com button
  - Step-by-step instructions
- **UI Integration** - Zap icon button on team cards, modal state management

### Tests
- 67 new tests (32 key mappings, 20 config generator, 15 modal UI)
- Total test count: 1,169+

See `docs/SPRINT_12_PLAN.md` for full details.

---

## 2026-01 (Sprint 11 - Complete)

### Phase 1: Test Coverage Expansion
- Test count increased from 545 → 1,102 tests (102% growth)
- Added comprehensive page component tests
- Added custom hook tests
- Improved assertion quality

### Phase 2: Technical Debt Reduction
- **PlannerPage refactoring** - 1,096 → 296 lines (73% reduction)
- **MultiTargetCalculator refactoring** - 983 → 247 lines (75% reduction)
- **gameData modularization** - Split into focused modules
- **Type safety** - Fixed mappers with proper type assertions
- Added barrel exports for all features

### Key Decision
- Pivoted from custom DPS calculator to wfpsim integration (see Sprint 12)

See `docs/SPRINT_11_PLAN.md` for full details.

---

## 2026-01 (Sprint 11 - Planning)

### Codebase Review
- Comprehensive review of 10 sprints of development
- Assessed architecture patterns, test coverage, and UI/UX
- Identified critical gaps in test coverage (page components, hooks)
- Documented technical debt areas (large components, type safety)

See `docs/SPRINT_11_PLAN.md` for full details.

## 2026-01 (Sprint 10 - Accessibility & Polish)

### New Features
- **Artifact Optimizer** - 12 character builds with scoring system
- **QR Code Camera Import** - Tauri macOS support with camera fallback
- **Toast Notifications** - User feedback system (bottom-right positioning)
- **Skeleton Loading** - Loading state improvements across all 11 pages

### Accessibility (WCAG 2.1 AA)
- Modal focus trap with Tab/Shift+Tab wrapping
- Skip links for keyboard navigation
- ARIA attributes on all interactive elements
- Proper label associations for form inputs

### Technical
- Component refactoring: RosterPage 645 → 249 lines (62% reduction)
- Added 96 new tests (449 → 545 total)
- Tauri camera fixes for macOS Info.plist configuration

## 2026-01 (Sprint 9 - Multi-Character & Weapon Planner)

### New Features
- **Multi-character planner** - Select multiple characters and aggregate all material needs
- **Weapon material planner** - Track weapon ascension materials with Level 80 goal option
- **Goal types** - Added "Functional" (80/80, A5, 1/6/6) for minimal support builds
- **Resin breakdown** - Split estimates into "Talents/Boss" vs "EXP/Mora" categories
- **Today's Farming Recommendations** - Cross-references talent needs with domain schedule
- **Material Deficit Priority** - Analyzes which materials block the most progress
- **Resin Efficiency Calculator** - Compares farming activities, recommends daily priorities

### Bug Fixes
- Fixed resin calculation formula (was summing runs per tier instead of total)
- Fixed talent domain drop rates (purple: 0.3 → 2.2 for AR55+)
- Fixed multi-character planner not updating on selection change
- Fixed Gaming's boss material showing as "Boss Material" (was "Emperor's Resolution")
- Fixed Xilonen/Natlan common materials showing as generic names
- Added weekly boss resin cost to Talents/Boss breakdown

### Technical
- Fixed 18 TypeScript errors across codebase
- Added 59 new tests (now 449 total)
- Cache schema version 4 for Natlan material patterns
- Added Natlan common materials: Saurian Claw, Blazing Core, etc.

## 2026-01 (Sprint 8.1 - Planner Polish & Test Fixes)

### Test Suite
- Fixed all 390 tests (was 35 failures)
- MultiTargetCalculator: Updated mocks for constellations, bannerType, fixed text assertions
- ReverseCalculator: Fixed validation tests for min=0, income benchmark assertions
- EnkaImport: Updated mock for bulkUpsert, fixed success message
- ledgerRepos: Removed incompatible fake timers

### Bug Fixes
- Fixed resource calculation double-counting bug in resourceService.ts
- Fixed tierNames undefined error with defensive optional chaining

### New Features
- Cache schema versioning to auto-invalidate stale material data
- Material aggregation by key and tier (no more duplicate entries)
- Manual Mora input field in planner (for tools that don't export currency)
- "Comfortable Build" goal option: 80/8/8/8 (between Next Ascension and Full Build)

## 2026-01 (Sprint 8.1 - Genshin-DB Bug Fix)
- Fixed API response type mismatch causing placeholder names to appear
- genshin-db API returns ascend/lvl fields as direct arrays, not {cost, items} objects
- Updated GenshinDbCharacterResponse and GenshinDbTalentResponse types
- Fixed processCharacterMaterials() array iteration pattern
- Added LOCAL_SPECIALTIES whitelist for material categorization
- Added COMMON_TIER_PATTERNS for comprehensive material identification

## 2026-01 (Sprint 8 - Genshin-DB Integration)
- Added genshin-db API integration for character-specific material names
- New genshinDbService.ts with 7-day IndexedDB caching
- New materialNormalization.ts for flexible inventory key matching
- New characterMaterials.ts with TypeScript types for API data
- Made ascensionCalculator async with API data fetching
- Updated PlannerPage with async state and loading indicators
- Added stale data warning banner when using offline cache

## 2026-01 (Sprint 7 - Architecture Review)
- Comprehensive architecture review and refactoring completed
- Performance: WishImport (useReducer, 10 useCallback, removed 15 console.logs)
- Performance: MultiTargetCalculator (13 useCallback hooks, functional updates)
- Performance: useResources converted to reactive useLiveQuery pattern
- Architecture: Extracted artifactRepo and weaponRepo from roster feature
- Architecture: Created shared resourceService in lib/services/
- Architecture: Standardized folder structure (removed nested repo/hooks/)
- Type Safety: Added TypeScript types to all Recharts tooltips (4 components)
- Reduced cross-feature coupling and improved code organization

## 2026-01 (Sprint 6)
- Added dashboard home page with account overview
- Implemented banner planner with primogem tracking
- Added resin tracker to ascension planner
- Improved data integration and removed redundant features

## 2026-01 (Sprint 5)
- Removed Spiral Abyss feature (replaced with Calendar)
- Added Calendar page with live reset timers
- Reset calculations based on US Server (UTC-5)
- Event fetching from HuTao bot GitHub repository
- Active/upcoming event display with type badges
- Banner tracking with countdown timers
- Cached event data with 1-hour TTL
- Graceful fallback to stale cache on network errors

## 2024-01 (Sprint 4)
- Redesigned Goals section as simple colored sticky notes
- Added theme support (light/dark/system) with localStorage persistence
- Added scenario save/compare feature for multi-target calculator
- Removed debug console.log statements from PurchaseLedger and LedgerPage
- Database schema updated to v2 with calculatorScenarios table

## 2024-01 (Sprint 3)
- Redesigned Primogem Tracker with unified snapshot-based workflow
- Added historical reconstruction from wish spending
- Added purchase ledger with CRUD
- Added unified chart (historical + projection)
- Removed manual primogem tracking complexity
- Fixed pull history chart empty week gaps
- Fixed purchased primogems display bug

### Bug Fixes
- Fixed: Standard banner pulls now excluded from all calculations
- Fixed: Daily rate calculation uses full lookback period
- Added: Configurable "Rate window" selector (14/30/60/90 days)

## 2024-01 (Sprint 2)
- Multi-target pull calculator with Monte Carlo simulation
- Reverse calculator for income requirements
- Scenario comparison feature
- Per-target pity inheritance options

## 2024-01 (Sprint 1)
- Initial release
- Character roster management
- Wish history import and pity tracking
- Single-target pull calculator
- Basic primogem tracking

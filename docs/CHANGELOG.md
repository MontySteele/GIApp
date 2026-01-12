# Changelog

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

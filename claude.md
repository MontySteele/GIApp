# Genshin Progress Tracker

## Project Overview

A local-first Progressive Web App for Genshin Impact players to track character progression, wish history, primogem income, and plan future pulls with probability calculations.

**Tech Stack:**
- React 18+ with TypeScript
- Vite (build tooling)
- Dexie.js (IndexedDB wrapper)
- Zustand (UI state management)
- Tailwind CSS + Recharts + Lucide React
- Web Workers (for Monte Carlo simulations)
- PWA capabilities

**Architecture:**
```
React Components → Zustand (UI State) → Repository Layer → Dexie (IndexedDB)
```

---

## Core Features

### 1. Character Roster Management
- [x] Character storage schema (level, constellation, talents, weapon, artifacts)
- [x] Character list view (grid/list toggle, filtering, sorting, search)
- [x] Character detail view with full build display
- [x] Team management (create, edit, assign characters)
- [x] Enka.network import (fetch showcase by UID)
- [x] GOOD format import/export
- [x] Team snapshot export
- [x] Manual character entry

### 2. Wish History & Pity Tracking
- [x] Wish record storage (minimal raw data)
- [x] Pity computation engine (replay-based, not stored per-record)
- [x] Capturing Radiance support (post-5.0 mechanic)
- [x] Versioned gacha rules engine
- [x] Pity dashboard (progress bars, guarantee status, radiant streak)
- [x] Wish history table with computed pity display
- [x] Wish URL import (with session-only authkey storage)
- [x] Manual wish entry
- [x] Statistics (average pity, 50/50 win rate, total pulls)

### 3. Primogem & Resource Tracking
- [x] Primogem ledger (gains/spending with categorized sources)
- [x] Fate tracking (Intertwined/Acquaint)
- [x] Resource snapshots (primos, fates, starglitter, stardust)
- [x] Daily checklist (quick-log commissions, Welkin)
- [x] Income analytics (daily/weekly/monthly averages, source breakdown)
- [x] Pull accumulation rate & projections
- [x] Transaction history with filters

### 4. Pull Probability Calculator
- [x] Web Worker setup for heavy computation
- [x] Single-target calculator (analytical DP approach)
  - [x] Exact probability with current pulls
  - [x] Pulls needed for 50/80/90/99% confidence
  - [x] Probability distribution chart
- [x] Multi-target planner (Monte Carlo simulation)
  - [x] Multiple characters with banner dates
  - [x] Pull timeline visualization
  - [x] Per-character probabilities
  - [x] Configurable simulation count (5k/20k/100k)
- [x] Reverse calculator (required income for target confidence)
- [ ] Scenario comparison (save & compare plans)

### 5. Spiral Abyss Log
- [ ] Abyss run entry (cycle, floor, chamber, stars, teams)
- [ ] History view by cycle
- [ ] Progress tracking over time
- [ ] Team usage statistics
- [ ] Quick team export from Abyss runs

### 6. Goals & Notes
- [x] Goal tracking with checklists
- [x] Category filtering & status tracking
- [x] Character/team linking
- [x] Markdown notes editor
- [x] Tagging & search
- [x] Pin to top

### 7. Cross-Device Sync
- [x] Export all data (JSON backup)
- [ ] Import/restore with merge strategies
- [ ] Compression (lz-string)
- [ ] Encryption (AES-GCM with passphrase)
- [ ] QR code generation (for small payloads <1.5KB)
- [ ] Merge strategies (replace, newer wins, keep local)

### 8. PWA & Settings
- [x] PWA manifest & service worker
- [x] Offline caching for static assets
- [x] Installability
- [ ] Theme (light/dark/system)
- [ ] Date format preferences
- [ ] Default calculator settings
- [x] Backup reminders

---

## Data Models Summary

**Core Tables:**
- `characters` - Character roster with builds
- `teams` - Team compositions with rotation notes
- `wishRecords` - Raw wish data (pity computed at runtime)
- `primogemEntries` - Income/spending ledger
- `fateEntries` - Fate acquisition tracking
- `resourceSnapshots` - Point-in-time resource counts
- `abyssRuns` - Spiral Abyss run logs
- `goals` - User goals with checklists
- `notes` - Markdown notes with tags
- `plannedBanners` - Future banner planning
- `externalCache` - Cached API responses (Enka)
- `appMeta` - App settings and metadata

**Key Design Decisions:**
- Dates stored as ISO 8601 strings
- UUIDs for client-generated IDs
- Pity/guarantee computed by replaying pulls, not stored
- Gacha rules versioned and configurable
- Mappers for external formats (GOOD, Enka) - internal schema separate

---

## Implementation Tasks

### Phase 1: Foundation & Setup
- [x] Initialize Vite + React + TypeScript project
- [x] Configure Tailwind CSS
- [x] Set up Dexie schema with version 1 stores
- [x] Create repository layer skeleton
- [x] Set up React Router with tab navigation
- [x] Create basic layout (header, tab nav, content area)
- [x] Set up PWA manifest and Vite PWA plugin
- [x] Initialize Zustand stores (UI state, calculator state)

### Phase 2: Character Roster
- [x] Character data models & repository
- [x] Character list page (grid/list view)
- [x] Character filters & sorting
- [x] Character detail page
- [x] Build display components (weapon, artifacts, talents)
- [x] Team data models & repository
- [x] Team builder component
- [x] GOOD format mapper (import/export)
- [x] Enka mapper & API integration
- [x] Team snapshot export format
- [x] Manual character entry form

### Phase 3: Wish Tracking
- [x] Wish record models & repository
- [x] Gacha rules configuration (all banner types)
- [x] Pity computation engine
  - [x] Basic pity counting
  - [x] Guarantee tracking
  - [x] Capturing Radiance (radiant streak)
  - [x] Weapon fate points
- [x] Unit tests for pity engine (edge cases)
- [x] Pity dashboard UI
- [x] Wish history table with computed columns
- [x] Wish URL import flow
- [x] Authkey session management
- [x] Manual wish entry
- [x] Statistics dashboard

### Phase 4: Primogem Ledger
- [x] Ledger models & repository
- [x] Quick entry panel with presets
- [x] Daily checklist component
- [x] Transaction history table
- [x] Income analytics calculations
- [x] Charts (income by source, cumulative over time)
- [x] Pull rate projections
- [ ] Bulk import

### Phase 5: Pull Calculator
- [x] Web Worker setup with Comlink
- [x] Analytical calculator (single target)
  - [x] Probability model implementation
  - [x] Dynamic programming solver
  - [x] Distribution curve generator
- [x] Monte Carlo simulator
  - [x] Simulation engine with seeded RNG
  - [x] Multi-target timeline builder
  - [x] Progress reporting
- [x] Calculator UI components
  - [x] Single target form & results
  - [x] Multi-target planner interface
  - [x] Reverse calculator
  - [x] Probability charts (Recharts)
- [ ] Scenario save/compare feature
- [x] Performance optimization & testing

### Phase 6: Abyss & Goals
- [ ] Abyss run models & repository
- [ ] Abyss run entry form
- [ ] Cycle history view
- [ ] Progress charts (stars over time)
- [ ] Team usage analytics
- [x] Goal models & repository
- [x] Goal creation & editing
- [x] Checklist component
- [x] Goal filtering & status tracking
- [x] Note models & repository
- [x] Markdown editor integration
- [x] Note tagging & search

### Phase 7: Sync & Polish
- [x] Export all data function
- [ ] Import with validation
- [ ] Compression pipeline (lz-string)
- [ ] Encryption/decryption (Web Crypto API)
- [ ] QR code generation (with size limit handling)
- [ ] QR code scanning
- [ ] Merge strategy implementations
- [ ] Conflict resolution UI
- [x] Settings page
- [x] Backup reminders
- [x] UI polish & responsive design
- [x] Offline mode testing
- [x] Performance audit
- [x] Service worker caching strategy

### Phase 8: Testing & Documentation
- [x] Unit tests for critical paths
  - [x] Pity engine edge cases
  - [x] Probability calculations
  - [x] Format mappers
  - [ ] Merge logic
- [ ] Regression test fixtures
- [ ] Integration tests
- [ ] User documentation
- [ ] Developer setup guide

---

## Bug Fixes & Enhancements Queue

### Priority 1: Calculator Accuracy (Critical)

These bugs affect core probability calculations and mislead users.

#### 1.1 Fix Capturing Radiance Mechanics ✅ COMPLETED
**Files:** `src/features/calculator/domain/pityEngine.ts`, `src/lib/constants.ts`

~~Current implementation is incorrect:~~
- ~~❌ Uses 50% base win rate (should be **55%**)~~
- ~~❌ Uses 75% after 2 losses (should be **100% guarantee after 3 losses**)~~

Correct mechanics (post-5.0):
- Base win rate: 55% (10% "recovery" chance on loss)
- After losing 3 consecutive 50/50s, the 4th 5-star is guaranteed (radiantStreak >= 3 → 100%)

Changes completed:
- [x] Update `getFeaturedProbability()` to return 0.55 base rate
- [x] Update `radianceThreshold` to 3 in GACHA_RULES
- [x] Return 1.0 when radiantStreak >= 3 (guaranteed)
- [x] Update tests for new probabilities (pityEngine, wishReplay, wishAnalyzer, pitySelectors)
- [x] Verified 50% probability shows ~79 pulls (in soft pity range)

#### 1.2 Fix Calculator Probability Display ✅ VERIFIED
**Files:** `src/features/calculator/components/SingleTargetCalculator.tsx`

~~User reports: "50% probability shows ~80 pity, should be ~75"~~
- [x] Verified after Capturing Radiance fix: 50% probability shows ~79 pulls
- [x] This is in the expected soft pity range (73-90) with 55% base rate

#### 1.3 Fix Multi-Target Calculator ✅ COMPLETED
**Files:** `src/features/calculator/components/MultiTargetCalculator.tsx`, `src/workers/montecarlo.worker.ts`

~~Current issues:~~
~~- Uses only first target's pity state for all simulations~~
~~- UI allows per-target pity/guarantee but values are ignored~~
~~- Pity carryover between targets not properly modeled~~

Changes completed:
- [x] Added `TargetPityState` interface and `perTargetStates` array to `SimulationInput`
- [x] Updated worker to apply per-target pity states during simulation
- [x] Added UI option to inherit pity from previous target or specify custom
- [x] First target uses full pity inputs, subsequent targets can inherit or customize
- [x] Pity carryover between sequential banners properly modeled

**Additional Enhancements (Sprint 2.5):**
- [x] Per-constellation breakdown (C0, C1, C2... for characters; R1, R2... for weapons)
- [x] "Nothing" probability display (chance of getting 0 copies from all targets)
- [x] Mixed character + weapon banner targeting in single simulation
- [x] Separate pity tracking per banner type (character/weapon/standard)
- [x] State persistence across tab navigation with localStorage
- [x] Reset button to clear calculator state
- [x] Import pulls from resource tracker button
- [x] Fixed negative values bug (clamp budget to zero)
- [x] Fixed cumulative pulls tracking at each constellation milestone

#### 1.4 Fix Reverse Calculator ✅ COMPLETED
**Files:** `src/features/calculator/domain/analyticalCalc.ts`, `src/features/calculator/components/ReverseCalculator.tsx`

~~Current issue: Linear approximation (pulls × targets) is inaccurate~~
~~- For 2 targets at 80%: shows ~160 pulls needed~~
~~- Reality: 80% × 80% = 64% for both with that many pulls~~

Changes completed:
- [x] Implemented compound probability math: P(all) = P(each)^N → P(each) = P(all)^(1/N)
- [x] Shows per-target probability required for multi-target calculations
- [x] Added explanatory UI panel for multi-target calculations
- [x] Note directing users to Monte Carlo for more accurate results

### Priority 2: Display Bugs (High)

#### 2.1 Fix Wish Sum Partial Values ✅ COMPLETED
**Files:** `src/features/ledger/pages/LedgerPage.tsx`, `src/features/calculator/components/ReverseCalculator.tsx`

~~Issue: Displaying fractional pulls like "12.35" instead of whole numbers~~

~~Root cause: `primogems / 160` produces floats, then `.toFixed(2)` rounds~~
- ~~Fates should be integers (you can't have 0.35 of a wish)~~

Fixes completed:
- [x] Use `Math.floor()` for available pulls in LedgerPage.tsx
- [x] Use `Math.floor()` for synced pulls in ReverseCalculator.tsx
- [x] Display as whole numbers in UI

#### 2.2 Fix Enka Duplicate Character Imports ✅ COMPLETED
**Files:** `src/features/roster/components/EnkaImport.tsx`, `src/features/roster/repo/characterRepo.ts`

~~Issue: Importing same UID twice creates duplicate character entries~~

~~Root cause:~~
- ~~No deduplication check before `bulkCreate()`~~
- ~~No unique constraint on character `key` in database~~

Fixes completed:
- [x] Added `bulkUpsert()` method to characterRepo that checks for existing characters by `key`
- [x] Update existing characters instead of creating duplicates
- [x] Preserve team associations when updating
- [x] Show separate counts for created vs updated characters in UI

### Priority 3: Feature Enhancements (Medium)

#### 3.1 Add Character Portraits ✅ COMPLETED
**Files:** `src/features/roster/components/CharacterCard.tsx`, `src/types/index.ts`, `src/lib/gameData.ts`, `src/mappers/enka.ts`

~~Add character portrait images to roster display:~~
- [x] Added `avatarId` field to Character type (optional, populated on Enka import)
- [x] Created `CHARACTER_ICON_NAMES` mapping (avatarId → Enka icon name)
- [x] Added `getCharacterPortraitUrl()` and `getCharacterGachaArtUrl()` utilities
- [x] Updated CharacterCard to display portraits with fallback placeholder
- [x] Using Enka's CDN: `https://enka.network/ui/UI_AvatarIcon_Side_{name}.png`
- [x] Updated fromEnka mapper to include avatarId when importing characters

#### 3.1b Fix Character Max Level Display ✅ COMPLETED
**Files:** `src/lib/constants.ts`, `src/features/roster/components/CharacterCard.tsx`, `CharacterDetailPage.tsx`, `TeamCard.tsx`, `TeamForm.tsx`

~~Issue: Max level was offset by 10 (showing 50 instead of 40 for ascension 1)~~
- [x] Created `MAX_LEVEL_BY_ASCENSION = [20, 40, 50, 60, 70, 80, 90]` constant
- [x] Replaced formula `ascension * 10 + 20` with lookup table
- [x] Fixed in CharacterCard, CharacterDetailPage, TeamCard, TeamForm

#### 3.2 Historical Pulls & Projection Charts
**Files:** New: `src/features/wishes/components/PullHistoryChart.tsx`, `src/features/ledger/components/ProjectionChart.tsx`

User wants:
- Historical pull visualization over time (when did I pull, cumulative)
- Primogem gain projection (based on tracked income patterns)

Implementation:
- [ ] Add time-series chart for pull history (Recharts area chart)
- [ ] Group pulls by day/week/month
- [ ] Add projection chart showing expected future primogems
- [ ] Reconcile projected vs. actual (show divergence)

#### 3.3 Hide Manual Entry Sections
**Files:** `src/features/wishes/pages/WishesPage.tsx`, `src/features/ledger/pages/LedgerPage.tsx`

User prefers automated import over manual entry:
- [ ] Make manual wish entry collapsible/hidden by default
- [ ] Make manual primogem entry collapsible/hidden by default
- [ ] Add settings toggle to show/hide manual sections

#### 3.4 Add Real Money Purchase Ledger
**Files:** New: `src/features/ledger/components/PurchaseLedger.tsx`, `src/db/schema.ts`

Track real money spending (Welkin, BP, Genesis Crystals):
- [ ] Add `purchases` table to schema
- [ ] Fields: date, type (welkin/bp/crystals), amount (USD), notes
- [ ] Add purchase entry form
- [ ] Show total spending, spending by type
- [ ] Optional: convert to pulls equivalent

### Priority 4: UX Improvements (Medium)

#### 4.1 Redesign Goals as Simple Notepad/Stickies
**Files:** `src/features/notes/pages/NotesPage.tsx`, `src/features/notes/components/*`

Current Goals section is over-engineered. User wants simple stickies:
- [ ] Simplify to quick notes/stickies format
- [ ] Remove complex goal tracking, checklists, category filtering
- [ ] Add quick-add button for new note
- [ ] Keep tags for basic organization
- [ ] Consider sticky-note visual style

### Priority 5: New Features (Lower)

#### 5.1 Artifact Optimizer for GOOD Format
**Files:** New: `src/features/artifacts/*`

Evaluate artifacts from GOOD-format Irminsul dumps:
- [ ] Import artifacts from GOOD JSON
- [ ] Score artifacts based on substat rolls
- [ ] Identify promising level-0 artifacts worth upgrading
- [ ] Filter by set, slot, main stat
- [ ] Show roll efficiency (actual rolls vs. max possible)

#### 5.2 Spiral Abyss Log (from roadmap)
Complete the Abyss tracking feature:
- [ ] Abyss run entry (cycle, floor, chamber, stars, teams)
- [ ] History view by cycle
- [ ] Progress tracking over time
- [ ] Team usage statistics

#### 5.3 Sync Features (from roadmap)
- [ ] Import with merge strategies
- [ ] Compression (lz-string)
- [ ] Encryption (AES-GCM)
- [ ] QR code generation for small payloads

### Implementation Order

**Sprint 1 - Calculator Fixes (Critical Path)** ✅ COMPLETED
1. ~~Fix Capturing Radiance (1.1) - blocks all other calculator fixes~~ ✅
2. ~~Verify single-target calculator (1.2)~~ ✅
3. ~~Fix wish sum partial values (2.1) - quick win~~ ✅
4. ~~Fix Enka duplicates (2.2) - quick win~~ ✅

**Sprint 2 - Multi-Target & Reverse Calculator** ✅ COMPLETED
1. ~~Fix multi-target calculator (1.3)~~ ✅
2. ~~Fix reverse calculator (1.4)~~ ✅
3. ~~Add character portraits (3.1)~~ ✅

**Sprint 3 - Charts & Visualization** ← CURRENT
1. Historical pulls chart (3.2)
2. Primogem projection chart (3.2)
3. Hide manual entry sections (3.3)

**Sprint 4 - UX Polish**
1. Redesign goals as stickies (4.1)
2. Add purchase ledger (3.4)

**Sprint 5 - New Features**
1. Artifact optimizer (5.1)
2. Spiral Abyss log (5.2)
3. Sync features (5.3)

---

## Open Questions / Ambiguities

1. **UI Framework Details**: Should we use a component library (e.g., shadcn/ui, Radix) or build custom components with Tailwind?

2. **Markdown Editor**: Which library for markdown editing? (e.g., react-markdown + textarea, or full editor like TipTap?)

3. **Date Handling**: Confirm timezone handling - store all as UTC, display in user's local time?

4. **Gacha Rules Updates**: How to handle rule updates when game mechanics change? Auto-migrate or require user confirmation?

5. **Mobile UX**: Any specific mobile-first considerations or gestures needed?

6. **Error Handling**: Strategy for API failures (Enka down, wish URL expired)?

7. **Character Data Source**: Do we need a static character database (names, elements, weapon types) or rely on imports?

---

## Notes

- **Privacy**: No server-side storage, all data stays local
- **Offline First**: Full functionality without internet
- **Performance**: Web Workers mandatory for simulations (don't block UI)
- **Versioning**: Schema migrations via Dexie versions
- **Security**: Authkeys session-only by default, encrypted if persisted

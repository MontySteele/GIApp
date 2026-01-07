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

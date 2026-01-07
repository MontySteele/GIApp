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
- [ ] Character list view (grid/list toggle, filtering, sorting, search)
- [ ] Character detail view with full build display
- [ ] Team management (create, edit, assign characters)
- [ ] Enka.network import (fetch showcase by UID)
- [ ] GOOD format import/export
- [ ] Team snapshot export
- [ ] Manual character entry

### 2. Wish History & Pity Tracking
- [ ] Wish record storage (minimal raw data)
- [ ] Pity computation engine (replay-based, not stored per-record)
- [ ] Capturing Radiance support (post-5.0 mechanic)
- [ ] Versioned gacha rules engine
- [ ] Pity dashboard (progress bars, guarantee status, radiant streak)
- [ ] Wish history table with computed pity display
- [ ] Wish URL import (with session-only authkey storage)
- [ ] Manual wish entry
- [ ] Statistics (average pity, 50/50 win rate, total pulls)

### 3. Primogem & Resource Tracking
- [ ] Primogem ledger (gains/spending with categorized sources)
- [ ] Fate tracking (Intertwined/Acquaint)
- [ ] Resource snapshots (primos, fates, starglitter, stardust)
- [ ] Daily checklist (quick-log commissions, Welkin)
- [ ] Income analytics (daily/weekly/monthly averages, source breakdown)
- [ ] Pull accumulation rate & projections
- [ ] Transaction history with filters

### 4. Pull Probability Calculator
- [ ] Web Worker setup for heavy computation
- [ ] Single-target calculator (analytical DP approach)
  - [ ] Exact probability with current pulls
  - [ ] Pulls needed for 50/80/90/99% confidence
  - [ ] Probability distribution chart
- [ ] Multi-target planner (Monte Carlo simulation)
  - [ ] Multiple characters with banner dates
  - [ ] Pull timeline visualization
  - [ ] Per-character probabilities
  - [ ] Configurable simulation count (5k/20k/100k)
- [ ] Reverse calculator (required income for target confidence)
- [ ] Scenario comparison (save & compare plans)

### 5. Spiral Abyss Log
- [ ] Abyss run entry (cycle, floor, chamber, stars, teams)
- [ ] History view by cycle
- [ ] Progress tracking over time
- [ ] Team usage statistics
- [ ] Quick team export from Abyss runs

### 6. Goals & Notes
- [ ] Goal tracking with checklists
- [ ] Category filtering & status tracking
- [ ] Character/team linking
- [ ] Markdown notes editor
- [ ] Tagging & search
- [ ] Pin to top

### 7. Cross-Device Sync
- [ ] Export all data (JSON backup)
- [ ] Import/restore with merge strategies
- [ ] Compression (lz-string)
- [ ] Encryption (AES-GCM with passphrase)
- [ ] QR code generation (for small payloads <1.5KB)
- [ ] Merge strategies (replace, newer wins, keep local)

### 8. PWA & Settings
- [ ] PWA manifest & service worker
- [ ] Offline caching for static assets
- [ ] Installability
- [ ] Theme (light/dark/system)
- [ ] Date format preferences
- [ ] Default calculator settings
- [ ] Backup reminders

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
- [ ] Initialize Vite + React + TypeScript project
- [ ] Configure Tailwind CSS
- [ ] Set up Dexie schema with version 1 stores
- [ ] Create repository layer skeleton
- [ ] Set up React Router with tab navigation
- [ ] Create basic layout (header, tab nav, content area)
- [ ] Set up PWA manifest and Vite PWA plugin
- [ ] Initialize Zustand stores (UI state, calculator state)

### Phase 2: Character Roster
- [ ] Character data models & repository
- [ ] Character list page (grid/list view)
- [ ] Character filters & sorting
- [ ] Character detail page
- [ ] Build display components (weapon, artifacts, talents)
- [ ] Team data models & repository
- [ ] Team builder component
- [ ] GOOD format mapper (import/export)
- [ ] Enka mapper & API integration
- [ ] Team snapshot export format
- [ ] Manual character entry form

### Phase 3: Wish Tracking
- [ ] Wish record models & repository
- [ ] Gacha rules configuration (all banner types)
- [ ] Pity computation engine
  - [ ] Basic pity counting
  - [ ] Guarantee tracking
  - [ ] Capturing Radiance (radiant streak)
  - [ ] Weapon fate points
- [ ] Unit tests for pity engine (edge cases)
- [ ] Pity dashboard UI
- [ ] Wish history table with computed columns
- [ ] Wish URL import flow
- [ ] Authkey session management
- [ ] Manual wish entry
- [ ] Statistics dashboard

### Phase 4: Primogem Ledger
- [ ] Ledger models & repository
- [ ] Quick entry panel with presets
- [ ] Daily checklist component
- [ ] Transaction history table
- [ ] Income analytics calculations
- [ ] Charts (income by source, cumulative over time)
- [ ] Pull rate projections
- [ ] Bulk import

### Phase 5: Pull Calculator
- [ ] Web Worker setup with Comlink
- [ ] Analytical calculator (single target)
  - [ ] Probability model implementation
  - [ ] Dynamic programming solver
  - [ ] Distribution curve generator
- [ ] Monte Carlo simulator
  - [ ] Simulation engine with seeded RNG
  - [ ] Multi-target timeline builder
  - [ ] Progress reporting
- [ ] Calculator UI components
  - [ ] Single target form & results
  - [ ] Multi-target planner interface
  - [ ] Reverse calculator
  - [ ] Probability charts (Recharts)
- [ ] Scenario save/compare feature
- [ ] Performance optimization & testing

### Phase 6: Abyss & Goals
- [ ] Abyss run models & repository
- [ ] Abyss run entry form
- [ ] Cycle history view
- [ ] Progress charts (stars over time)
- [ ] Team usage analytics
- [ ] Goal models & repository
- [ ] Goal creation & editing
- [ ] Checklist component
- [ ] Goal filtering & status tracking
- [ ] Note models & repository
- [ ] Markdown editor integration
- [ ] Note tagging & search

### Phase 7: Sync & Polish
- [ ] Export all data function
- [ ] Import with validation
- [ ] Compression pipeline (lz-string)
- [ ] Encryption/decryption (Web Crypto API)
- [ ] QR code generation (with size limit handling)
- [ ] QR code scanning
- [ ] Merge strategy implementations
- [ ] Conflict resolution UI
- [ ] Settings page
- [ ] Backup reminders
- [ ] UI polish & responsive design
- [ ] Offline mode testing
- [ ] Performance audit
- [ ] Service worker caching strategy

### Phase 8: Testing & Documentation
- [ ] Unit tests for critical paths
  - [ ] Pity engine edge cases
  - [ ] Probability calculations
  - [ ] Format mappers
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

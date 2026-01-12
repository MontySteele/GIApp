# Sprint 12 - wfpsim Integration & Feature Development

> **Status**: Planning
> **Target**: January-February 2026
> **Starting Test Count**: 1,102 tests

---

## Overview

Sprint 12 focuses on integrating with the wfpsim combat simulator for team DPS analysis, plus completing deferred items from Sprint 11.

### Key Decision: wfpsim Integration over Custom DPS Calculator

After evaluating options for Team DPS Comparison (Sprint 11 Phase 3.1), we decided to integrate with the existing [wfpsim](https://wfpsim.com/) tool rather than building a custom DPS calculator.

**Rationale:**
- wfpsim is a mature Monte Carlo combat simulator (fork of gcsim)
- Actively maintained through patch 6.3+ (v6.3.5 released Dec 2025)
- Building accurate DPS calculations would require ~40k+ lines and ongoing maintenance
- Integration provides better accuracy with lower development/maintenance cost

**Trade-offs:**
- Users need to add rotation scripts manually in wfpsim
- Requires context switch to wfpsim.com (or future embedded binary)

---

## Phase 1: wfpsim Export Integration

**Goal**: Allow users to export team configurations to wfpsim-compatible format.

### 1.1 gcsim Key Mappings

Create mapping files to convert our data format to gcsim/wfpsim format.

**Source**: Scrape from [wfpsim GitHub](https://github.com/ancientdialogue/wfpsim)

| Mapping | Description | Est. Entries |
|---------|-------------|--------------|
| Characters | `"Raiden Shogun"` → `"raiden"` | ~100 |
| Weapons | `"The Catch"` → `"thecatch"` | ~150 |
| Artifact Sets | `"Emblem of Severed Fate"` → `"emblemofseveredfate"` | ~40 |
| Stats | `"critRate_"` → `"cr"` | ~25 |

**Files to create:**
```
src/features/teams/
├── domain/
│   └── gcsimKeyMappings.ts    # All key mappings (~300 lines)
```

### 1.2 Config Generator Service

Generate wfpsim-compatible configuration text from team data.

**gcsim Config Format:**
```
options iteration=1000 duration=90 swap_delay=4;
target lvl=100 resist=0.1;

raiden char lvl=90/90 cons=0 talent=1,9,9;
raiden add weapon="thecatch" refine=1 lvl=90/90;
raiden add set="emblemofseveredfate" count=4;
raiden add stats hp=4780 atk=358 er=0.518 cr=0.311 cd=0.622;

active raiden;

// TODO: Add rotation
```

**Stat Format Notes:**
- Percentage stats as decimals: `0.518` = 51.8% ER
- Flat stats as integers: `hp=4780`, `atk=311`
- Sum all artifact main stats + substats into single `add stats` line

**Files to create:**
```
src/features/teams/
├── domain/
│   ├── gcsimKeyMappings.ts
│   └── gcsimConfigGenerator.ts  # Config generation (~150 lines)
```

**Interface:**
```typescript
export interface GcsimExportOptions {
  iterations?: number;      // default 1000
  duration?: number;        // default 90
  targetLevel?: number;     // default 100
  targetResist?: number;    // default 0.1
}

export function generateGcsimConfig(
  team: Team,
  characters: Character[],
  options?: GcsimExportOptions
): string;
```

### 1.3 Export UI

Add export functionality to the Teams section.

**User Flow:**
1. User clicks "Export to wfpsim" on a team card
2. Modal opens with generated config preview
3. User can copy to clipboard or open wfpsim.com
4. Note explains rotation must be added manually

**Files to create:**
```
src/features/teams/
├── components/
│   └── WfpsimExportModal.tsx   # Export UI (~100 lines)
```

**Component Props:**
```typescript
interface WfpsimExportModalProps {
  team: Team;
  characters: Character[];
  isOpen: boolean;
  onClose: () => void;
}
```

### 1.4 Tests

| Test File | Est. Tests |
|-----------|------------|
| `gcsimKeyMappings.test.ts` | 15-20 |
| `gcsimConfigGenerator.test.ts` | 25-30 |
| `WfpsimExportModal.test.tsx` | 10-15 |

**Total Phase 1 Estimate:** ~700 lines, 50-65 tests

---

## Phase 2: Deferred Sprint 11 Items

### 2.1 E2E Test Suite

Create end-to-end tests for critical user workflows using Playwright.

| Workflow | Description | Priority |
|----------|-------------|----------|
| Wish Import Flow | Import URL → Parse → View Statistics | Critical |
| Character Planning | Add Character → Set Goals → View Materials | Critical |
| Team Management | Create Team → Add Characters → Export to wfpsim | High |
| Data Export/Import | Export GOOD → Clear → Import → Verify | Medium |

### 2.2 Cross-Feature Coupling Reduction

Reduce tight coupling in `resourceService.ts` using dependency injection.

---

## Phase 3: Additional Features (Stretch)

### 3.1 Build Templates

Save, load, and share character build configurations.

### 3.2 Weekly Boss Tracker

Track weekly boss completions with reset timer.

### 3.3 Future: Embedded wfpsim Binary

If export workflow proves popular, consider bundling wfpsim binary with Tauri app for seamless in-app simulation.

**Requirements:**
- Download platform-specific binaries (Win/Mac/Linux)
- Call from Rust backend via `std::process::Command`
- Parse JSON output and display in UI
- Track wfpsim releases for updates

**Estimated effort:** 1,000-1,500 lines, significant testing

---

## Data Model Reference

### Existing Types (no changes needed)

**Team:**
```typescript
interface Team {
  id: string;
  name: string;
  characterKeys: string[];  // Ordered by rotation
  rotationNotes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

**Character:**
```typescript
interface Character {
  id: string;
  key: string;
  level: number;
  ascension: number;
  constellation: number;
  talent: { auto: number; skill: number; burst: number };
  weapon: Weapon;
  artifacts: Artifact[];
  // ...
}
```

**Weapon:**
```typescript
interface Weapon {
  key: string;
  level: number;
  ascension: number;
  refinement: number;
}
```

**Artifact:**
```typescript
interface Artifact {
  setKey: string;
  slotKey: SlotKey;
  level: number;
  rarity: number;
  mainStatKey: string;
  substats: Substat[];
}
```

---

## Sprint 12 Deliverables

### Must Have
- [ ] gcsim key mappings (characters, weapons, artifacts, stats)
- [ ] Config generator service with tests
- [ ] Export UI modal on team cards
- [ ] Documentation for users

### Should Have
- [ ] E2E test suite (3+ critical workflows)
- [ ] Cross-feature coupling improvements

### Could Have
- [ ] Build Templates feature
- [ ] Weekly Boss Tracker
- [ ] Embedded wfpsim binary (research/prototype)

---

## Resources

- [wfpsim GitHub](https://github.com/ancientdialogue/wfpsim) - Source code, releases
- [wfpsim.com](https://wfpsim.com/) - Web app (up to date with patch 6.2+)
- [gcsim Docs](https://docs.gcsim.app/) - Config format documentation
- [Building a Simulation Tutorial](https://docs.gcsim.app/guides/building_a_simulation_basic_tutorial/)

# Threadbound — M3 Plan (Polish, Feel, Controller, Calibration)

M3 is the polish milestone from DESIGN.md §12 plus two additions from M2 review:
a difficulty **calibration protocol** (M2 tuning passed all gates by overshooting —
see Part A) and **controller support** (designer priority — build first).

Work order: A0 (playtest) unblocks Part A; Part B1 (controller) ships first among
build items; B2–B6 follow; Part C/D interleave freely.

---

## Part A — Difficulty calibration (gated on Playtest 2)

### A0. The problem
M2 sims: bot win rate 100% → **2%** (with smarter bots), Act 1 HP loss/combat
**28.3** vs a "≥8" gate, 34% of runs dead in Act 1. All gates passed because they
were one-sided floors written against M1's triviality. Lesson encoded here:
**all balance gates are now two-sided bands.**

### A1. Calibration protocol
1. Designer pair plays Act 1 (ideally one full run attempt) per `docs/PLAYTEST-2.md`.
   Server logs the same telemetry as the sim (add a `--human-session` flag that
   writes a per-run telemetry file).
2. Compute **human uplift** = human pair's numbers vs the 50-run bot baseline on:
   HP lost/combat, link-fire rate, resonances/combat, combats won before death.
3. Set the human design targets (these are the real goals):
   - Act 1 HP lost/combat (pair total): **8–16**
   - Full-run win rate for a competent coordinating pair: **~25–40%** (StS-like)
   - Link-fire: Act 1 30–45% climbing to 45–60% by Act 2 (the draft arc)
4. Back-derive the bot bands from the measured uplift, then tune until sims sit
   inside the bands. Provisional bot bands until measured: win rate **8–25%**,
   Act 1 HP loss **12–22**.

### A2. Staged tuning levers (apply smallest-first, re-sim between each)
1. Act 1 enemy HP and damage −10% (revert half the M2 hike).
2. Rest heal 30% → 35%.
3. Starter decks: upgrade one Hatpin/Jab each to its upgraded form at run start.
4. Fray: 25% → 20% per stack (only if Fray shows up as a top damage source in logs).
Stop when sims land in band; do not stack levers past the first passing config.

---

## Part B — UI overhaul

### B0. Design language pass (foundation for everything below)
- One pass over palette, type, and spacing before feature work: dark-parchment
  ground, 2 accent hues (one per player — already PCOLOR), an ignition hue for
  Resonance, CSS custom properties for all of it. Two display fonts max (a serif
  for names/Witness, a workhorse UI face), consistent corner/border treatment on
  cards, panels, and tooltips. Kill all remaining browser-default UI (native
  `title=` attributes, default buttons/scrollbars).
- Deliverable: `packages/client/src/theme.css` tokens + a style sample screen
  (`/?style`) showing card, tooltip, enemy frame, gauge states side by side.

### B1. Controller support (ship first)
- **Gamepad API**, polled in the existing rAF loop; coexists with mouse/keyboard
  (last input device wins, UI shows matching glyphs).
- **Focus model:** named zones — HAND, CHAIN, ENEMIES, THREAD, META (ready/map/
  deck). A visible focus ring (player-colored). Within-zone movement is spatial
  (left stick / d-pad); zone cycling on bumpers.
- **Mapping (PS5 DualSense glyphs — primary; detect pad type via Gamepad API id
  string and swap glyph set for Xbox pads, same bindings):**
  - Cross (✕): select / place focused card at focused chain slot / confirm
  - Circle (○): back / unstage focused chain card / cancel targeting
  - Square (□): thread-action menu (radial: Pulse / Reclaim / Sever / Steady)
  - Triangle (△): **inspect** — opens the keyword tooltip panel for the focused element
  - L1/R1: cycle zones; L2/R2: reorder focused (own) chain card left/right
  - Options: Ready / Unready (hold 300ms to Ready — prevents accidents)
  - Create: toggle map/deck overview
  - Touchpad press: same as Create (it's the biggest button; overview is the safest action)
- Targeting flow: A on a needsTarget card enters enemy-focus mode; A confirms,
  B cancels. Reclaim opens partner-discard browser (same focus model).
- Every screen (map, reward incl. Covet, event, rest incl. Wedding Knife, shop)
  gets focus support — sign-off is a full run played without touching the mouse.

### B2. Keyword tooltip system
- Data-driven registry `keywords.ts`: Hex, Detonate, Momentum, Kindled, Keep,
  Frayed, Fallen, Bound/Sever, Echo, Mutated, Link, Resonance, Covet, Thread,
  Pulse, Steady — name, one-line rule, flavor line.
- Hover (250ms delay) or controller-inspect on any card, status icon, enemy
  intent, or thread action → side panel listing every keyword present on that
  element. Card tooltips also show the upgrade preview at rest sites and the
  mutation preview when browsing partner discard for Reclaim.
- Witness gets one dry line per keyword panel, low rotation (flavor, optional).

### B3. The Thread gauge
- Replace the counter with a rendered cord (SVG path) between the two portraits;
  numeric pips remain alongside (information never sacrificed to art).
- States: value maps to tension + brightness (10 = taut, luminous; low = sagging,
  dull); spend = visible pulse traveling toward the spender; regen = slow brighten;
  **Fray** = snap-shake, a strand visibly parts; **slack** (partner Fallen) = cord
  drops limp; **severed** (Unraveled) = cut ends drifting, re-ignition on reattach;
  **Resonance** = fire travels the cord through the chain.

### B4. Chain stylization
- Chain track rendered as cards pinned along the cord (B3 continues through it).
- Planning: link arcs drawn between adjacent staged cards; an arc **pre-lights**
  when its link condition is currently satisfied (§2.1 "the UI does the
  bookkeeping"). Resonance-eligible streaks shimmer.
- Resolution: camera-less choreography — each card lifts/pulses in slot order
  (~400ms, hold-to-skip), fired links flash their arc, Resonance ignition runs
  down the cord to the finisher, which hits with hitstop + shake.

### B5. Enemy presence ("pop")
- **Scope ruling: no sprite-sheet or skeletal animation.** Realistic ceiling =
  static portraits + layered transform animation + particles, which is most of
  how the genre's references read anyway.
- Per-enemy: idle (breathing bob, 2–4s loop, randomized phase), telegraph (lean/
  brighten matching intent icon), attack (lunge toward bound player's side),
  hit (flash + shake + floating damage number; block chips show separately),
  death (dissolve to motes). Elites/bosses get a scale + aura treatment.
- Status visualization: Hex stacks as orbiting motes (count-accurate up to 9,
  then numeral), detonation = crack flash + mote burst; Weak/Vuln as icon chips.
- Screen feel: hitstop 60–90ms on hits ≥15 dmg and all detonations ≥4 stacks;
  shake scaled to damage, capped; damage numbers color-coded by source tag.

### B6. Art pipeline
- ~28 images: 25 enemies (incl. variants), Vess, Bram, the Witness. Optional
  second pass: card emblems for rares only.
- AI-generated via a consistency pipeline: one style template prompt (dark
  gothic painterly, muted palette matching theme tokens, single subject,
  neutral ground, uniform crop), then post-process every image identically
  (palette-quantize toward the token palette, vignette, frame). Build the
  pipeline as a script so regeneration is cheap; keep prompts in-repo per enemy.
- Fallback if generation can't hold one style: CC0 dark-fantasy portrait packs
  (itch.io) run through the same post-process, or typographic sigil cards
  (current aesthetic, intensified). Mixing generated + pack art is forbidden —
  whole-set consistency beats per-image quality.

---

## Part C — Audio
- SFX from CC0 sources (freesound/Kenney audio), post-processed for loudness
  consistency: card place/unstage, link fire, resonance ignition, detonation,
  hits (3 weights), block, fray/snap, sever, fallen, revive, covet, purchase,
  map move, ready chime (distinct per player).
- One ambient loop per act + a sparser one for the finale; generated or CC0.
- Witness "speaks" as a low text-blip only. Volume sliders (master/SFX/ambient),
  defaults conservative, persisted in localStorage with the session token.

## Part D — Onboarding & resilience
- **First-Chain tutorial (~90s):** scripted single combat vs a Cinder Husk, both
  players present; teaches stage → link arc pre-light → reorder → ready →
  resolution → one Pulse. Skippable; offered on first run per browser.
- Disconnect mid-resolution: resolution is atomic server-side already; client
  must replay the resolution log on reconnect rather than snapping to end-state.
- Verify M2-D3 room GC actually evicts (test with fake timers); fix `npm test`
  build-order fragility (vitest alias `@threadbound/server` → src, or pretest
  build hook). Suite must pass on a fresh clone with plain `npm test`.
- Deployment refresh: single VPS/free-tier process, websocket keepalive/pings,
  graceful restart preserving rooms (serialize state + action logs to disk).

## Part E — Sign-off
- Full run on controller only, no mouse.
- Sims inside Part A bands (post-calibration).
- Fresh-clone `npm test` green; style screen reviewed by designer before B5/B6
  asset production begins (cheapest veto point for the art direction).
- Playtest 3 = the real test: a full afternoon session, both characters,
  measured against the original bar — "good afternoon's worth of enjoyment."

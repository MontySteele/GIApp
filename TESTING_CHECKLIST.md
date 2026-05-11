# GIApp Manual Testing Checklist

Use this checklist for quick human smoke testing after route, dashboard, import, target, or roster UX changes. Automated coverage should still run through `npm run lint`, `npm run test:run`, and `npm run build`.

## Prerequisites

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

For first-run checks, use a clean browser profile or clear IndexedDB/localStorage for the app.

## First Target Setup

### Empty Account

- [ ] Open `/`.
- [ ] Verify the Dashboard shows a first-target setup card.
- [ ] Verify the active step asks for roster import or account refresh.
- [ ] Open `/imports`.
- [ ] Verify the same setup card appears above the Import Hub status cards.
- [ ] Verify Import Hub shows roster, wish history, manual fast path, and backup/restore cards.

### Pull/Resource Setup

- [ ] Use existing or seeded data so roster data is fresh but no wishes, snapshots, campaigns, planned banners, or wishlist targets exist.
- [ ] Open `/`.
- [ ] Verify first-target setup advances to Set pulls.
- [ ] Open `/pulls`.
- [ ] Verify the First Target Resources panel appears.
- [ ] Click `Set Current Resources`.
- [ ] Verify the URL is `/pulls#resource-snapshot`.
- [ ] Verify the Resource Snapshot form is visible near the top of the viewport.

### Completion Gates

- [ ] Create or seed any campaign target.
- [ ] Verify Dashboard and Import Hub no longer show the first-target setup card.
- [ ] Repeat with a planned banner or wishlist character.
- [ ] Verify Dashboard and Import Hub still hide the first-target setup card.

## Target Creation

### Manual Get Character Target

- [ ] Open Dashboard at `/`.
- [ ] Start a target.
- [ ] Choose `Get character`.
- [ ] Select a character such as Furina.
- [ ] Enter saved pulls, current pity, guarantee status, target constellation, and optional deadline.
- [ ] Open Preview.
- [ ] Verify hard-pity coverage, worst-case shortfall, daily pace, and advice render.
- [ ] Create the target.
- [ ] Verify `/campaigns` opens with the target draft or created target visible.

### Already-Met Constellation

- [ ] Start a Get character target.
- [ ] Enter Current C greater than or equal to Target C.
- [ ] Open Preview.
- [ ] Verify the preview says the target is already met.
- [ ] Verify Create Target is disabled and Check Odds is hidden.

### Target Surfaces

- [ ] Create a planned banner from `/pulls/banners`.
- [ ] Verify it appears as target intent on Dashboard/Targets.
- [ ] Add a wishlist character from Roster.
- [ ] Verify it can promote into target creation.
- [ ] Open an existing target detail page.
- [ ] Verify readiness, deficits, and next actions are readable.

## Dashboard

- [ ] Verify Next Up shows exactly one dominant action.
- [ ] With stale or missing account data, verify Next Up points to import refresh before suggesting another target.
- [ ] With fresh data and no targets, verify the full Start Target entry appears.
- [ ] With existing targets, verify the compact Start another target entry appears.
- [ ] Verify Capture + Snapshot shows resource, roster, artifact, weapon, and resin links without duplicating page-depth panels.
- [ ] Verify the account freshness link is subtle when data is fresh and points to `/imports`.

## Pulls

- [ ] Open `/pulls`.
- [ ] Save a Resource Snapshot.
- [ ] Verify Event Pulls Available updates.
- [ ] Open `/pulls/history`.
- [ ] Add or import wish history.
- [ ] Verify pity/guarantee state updates.
- [ ] Open `/pulls/calculator`.
- [ ] Verify manual pity, guarantee, saved pulls, and target settings produce odds.
- [ ] Open `/pulls/banners`.
- [ ] Create, edit, and delete a planned banner.

## Roster

- [ ] Open `/roster`.
- [ ] Add a character manually.
- [ ] Edit level, ascension, constellation, talents, weapon, priority, and notes.
- [ ] Open the character detail page at `/roster/:id`.
- [ ] Verify progression, basic info, talents, weapon, artifacts, and notes render.
- [ ] Use search and filters.
- [ ] Add and remove a wishlist character.
- [ ] Open nested Roster surfaces: Teams, Progression, Domains, Bosses, Weapons, Artifacts, and Builds.

## Imports and Sync

- [ ] Open `/imports`.
- [ ] Start the roster import path and verify it deep-links to `/roster?import=irminsul`.
- [ ] Restore or import test data and verify Last Import Impact appears when available.
- [ ] Open `/settings`.
- [ ] Create a backup.
- [ ] Restore from a backup in a safe test profile.
- [ ] Verify backup status and schema metadata look sane.

## Quick Actions and Navigation

- [ ] Open a non-dashboard desktop route such as `/pulls`.
- [ ] Open Quick Actions.
- [ ] Click `Log Primos`.
- [ ] Verify URL becomes `/#quick-resource-logger` and the dashboard logger is visible.
- [ ] Click `Import Data` and verify `/imports` opens.
- [ ] Click `Update Pity` and verify `/pulls/history` opens.
- [ ] On mobile width, verify bottom navigation shows Home, Targets, Roster, Pulls, and More.
- [ ] Verify More highlights for `/more`, `/notes`, `/settings`, and `/imports`.

## Route Compatibility

- [ ] Verify `/wishes` redirects to `/pulls`.
- [ ] Verify `/calculator` redirects to `/pulls/calculator`.
- [ ] Verify `/ledger` redirects to `/pulls`.
- [ ] Verify `/planner` redirects to `/roster/planner`.
- [ ] Verify `/planner/materials` redirects to `/campaigns/materials`.
- [ ] Verify `/teams` redirects to `/roster/teams`.
- [ ] Verify `/calendar` redirects to `/roster/domains`.
- [ ] Verify `/builds` redirects to `/roster/builds`.
- [ ] Verify `/bosses` redirects to `/roster/bosses`.

## Responsive and Persistence Smoke

- [ ] Resize to mobile width under 640px.
- [ ] Verify content stacks cleanly and no button text overlaps.
- [ ] Resize to tablet and desktop widths.
- [ ] Verify dense surfaces remain readable.
- [ ] Add a character, target, snapshot, planned banner, and note.
- [ ] Refresh the page.
- [ ] Verify data persists.
- [ ] Close and reopen the browser.
- [ ] Verify data still persists.

## Debugging Notes

- User data is stored in IndexedDB under the app database.
- Import authkeys should be treated as session-sensitive data.
- Enka imports only read showcase-visible characters and may reflect upstream cache delays.
- Historical sprint plans and older feature proposals live in `docs/archive/` and should not be used as current test expectations.

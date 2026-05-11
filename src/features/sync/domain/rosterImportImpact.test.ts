import { describe, expect, it } from 'vitest';
import { buildRosterImportImpactSummary } from './rosterImportImpact';

describe('roster import impact summary', () => {
  it('maps roster import counts into import hub rows', () => {
    expect(buildRosterImportImpactSummary({
      source: 'Irminsul',
      importedAt: '2026-05-11T00:00:00.000Z',
      charactersCreated: 2,
      charactersUpdated: 1,
      artifactsChanged: 5,
      weaponsChanged: 1,
      materialsChanged: 3,
    })).toEqual({
      source: 'Irminsul',
      importedAt: '2026-05-11T00:00:00.000Z',
      totals: {
        created: 2,
        updated: 10,
        skipped: 0,
      },
      rows: [
        {
          id: 'roster',
          title: 'Roster refreshed',
          detail: '2 characters added and 1 character updated.',
          href: '/roster',
        },
        {
          id: 'build-data',
          title: 'Build planning updated',
          detail: '9 inventory records can update target readiness and material gaps.',
          href: '/planner',
        },
      ],
    });
  });
});

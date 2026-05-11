import type { LastImportSummary } from './lastImportSummary';

interface RosterImportImpactInput {
  source: string;
  importedAt?: string;
  charactersCreated?: number;
  charactersUpdated?: number;
  artifactsChanged?: number;
  weaponsChanged?: number;
  materialsChanged?: number;
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export function buildRosterImportImpactSummary({
  source,
  importedAt = new Date().toISOString(),
  charactersCreated = 0,
  charactersUpdated = 0,
  artifactsChanged = 0,
  weaponsChanged = 0,
  materialsChanged = 0,
}: RosterImportImpactInput): LastImportSummary {
  const rows: LastImportSummary['rows'] = [];
  const rosterChanged = charactersCreated + charactersUpdated;
  const buildChanged = artifactsChanged + weaponsChanged + materialsChanged;

  if (rosterChanged > 0) {
    rows.push({
      id: 'roster',
      title: 'Roster refreshed',
      detail: `${plural(charactersCreated, 'character')} added and ${plural(charactersUpdated, 'character')} updated.`,
      href: '/roster',
    });
  }

  if (buildChanged > 0) {
    rows.push({
      id: 'build-data',
      title: 'Build planning updated',
      detail: `${plural(buildChanged, 'inventory record')} can update target readiness and material gaps.`,
      href: '/planner',
    });
  }

  return {
    source,
    importedAt,
    totals: {
      created: charactersCreated,
      updated: charactersUpdated + artifactsChanged + weaponsChanged + materialsChanged,
      skipped: 0,
    },
    rows,
  };
}

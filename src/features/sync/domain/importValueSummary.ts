import type { ImportResult } from '../services/importService';

export interface ImportValueRow {
  id: string;
  title: string;
  detail: string;
  href: string;
}

function changed(stats: { created: number; skipped: number; updated?: number }): number {
  return stats.created + (stats.updated ?? 0);
}

function formatCount(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export function buildImportValueRows(result: ImportResult): ImportValueRow[] {
  const rows: ImportValueRow[] = [];
  const rosterCount = changed(result.stats.characters);
  const buildDataCount =
    changed(result.stats.inventoryArtifacts) +
    changed(result.stats.inventoryWeapons) +
    changed(result.stats.materialInventory);
  const budgetCount =
    changed(result.stats.primogemEntries) +
    changed(result.stats.fateEntries) +
    changed(result.stats.resourceSnapshots);
  const targetCount = changed(result.stats.campaigns) + changed(result.stats.plannedBanners);
  const wishCount = changed(result.stats.wishRecords);

  if (rosterCount > 0) {
    rows.push({
      id: 'roster',
      title: 'Roster refreshed',
      detail: `${formatCount(rosterCount, 'character')} available for target and team planning.`,
      href: '/roster',
    });
  }

  if (buildDataCount > 0) {
    rows.push({
      id: 'build-data',
      title: 'Build planning updated',
      detail: `${formatCount(buildDataCount, 'inventory record')} can update readiness and material gaps.`,
      href: '/planner',
    });
  }

  if (wishCount > 0) {
    rows.push({
      id: 'wishes',
      title: 'Wish history refreshed',
      detail: `${formatCount(wishCount, 'wish')} can update pity, guarantees, and pull odds.`,
      href: '/pulls/history',
    });
  }

  if (budgetCount > 0) {
    rows.push({
      id: 'budget',
      title: 'Budget refreshed',
      detail: `${formatCount(budgetCount, 'resource record')} can update available pulls.`,
      href: '/pulls',
    });
  }

  if (targetCount > 0) {
    rows.push({
      id: 'targets',
      title: 'Targets restored',
      detail: `${formatCount(targetCount, 'target record')} ready for dashboard next actions.`,
      href: '/campaigns',
    });
  }

  return rows;
}

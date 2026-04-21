import type { ResourceSnapshot } from '@/types';

export type QuickSnapshotInput = Omit<ResourceSnapshot, 'id' | 'createdAt' | 'timestamp'>;

/**
 * Builds a new snapshot input where only the primogem count is supplied by the
 * user; every other resource field inherits from the latest snapshot (or 0 if
 * no snapshot exists yet). Used by the Dashboard quick-log affordance so a
 * player can tap in a fresh primo total without re-entering the five other
 * fields.
 */
export function buildQuickPrimoSnapshot(
  latest: ResourceSnapshot | undefined,
  primogems: number
): QuickSnapshotInput {
  return {
    primogems,
    genesisCrystals: latest?.genesisCrystals ?? 0,
    intertwined: latest?.intertwined ?? 0,
    acquaint: latest?.acquaint ?? 0,
    starglitter: latest?.starglitter ?? 0,
    stardust: latest?.stardust ?? 0,
  };
}

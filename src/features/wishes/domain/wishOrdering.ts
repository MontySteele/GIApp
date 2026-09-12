/**
 * Single source of truth for ordering wishes chronologically.
 *
 * Every pull in a 10-pull shares one timestamp, so timestamp alone cannot order
 * them. HoYoverse gacha IDs are monotonically increasing numeric strings that
 * preserve the true pull order, so they are the tie-breaker. Falling back to
 * insertion order or primary key (a random UUID) makes pity counts differ by
 * up to 9 between surfaces that happen to receive rows in different orders.
 */

export interface OrderableWish {
  timestamp: string;
  createdAt?: string;
  gachaId?: string;
  id: string;
}

export function compareGachaIds(a: string, b: string): number {
  // Numeric strings: longer is larger; same length compares lexicographically.
  if (a.length !== b.length) return a.length - b.length;
  return a < b ? -1 : a > b ? 1 : 0;
}

const NUMERIC_ID = /^\d+$/;

/**
 * Orders two wishes. Returns 0 (keep input order) when neither the timestamp nor a
 * numeric gacha ID can separate them; manual entries have synthetic non-numeric IDs
 * and must not be shuffled by string comparison.
 */
export function compareWishOrder(a: OrderableWish, b: OrderableWish): number {
  const timeDiff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  if (timeDiff !== 0) return timeDiff;

  const aGacha = a.gachaId ?? a.id;
  const bGacha = b.gachaId ?? b.id;
  if (NUMERIC_ID.test(aGacha) && NUMERIC_ID.test(bGacha) && aGacha !== bGacha) {
    return compareGachaIds(aGacha, bGacha);
  }

  const createdDiff =
    new Date(a.createdAt || a.timestamp).getTime() - new Date(b.createdAt || b.timestamp).getTime();
  if (createdDiff !== 0) return createdDiff;

  return 0;
}

/** Stable chronological sort (Array.prototype.sort is stable, so ties keep input order). */
export function sortWishesChronologically<T extends OrderableWish>(wishes: T[]): T[] {
  return [...wishes].sort(compareWishOrder);
}

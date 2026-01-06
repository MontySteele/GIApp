import { db } from '@/db/schema';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
export const WISH_AUTH_SESSION_KEY = 'wishAuthSession';

export interface WishAuthSession {
  url: string;
  storedAt: number;
  expiresAt: number;
}

function parseSession(value: unknown): WishAuthSession | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const session = value as Record<string, unknown>;
  const url = session.url;
  const storedAt = session.storedAt;
  const expiresAt = session.expiresAt ?? (typeof storedAt === 'number' ? storedAt + ONE_DAY_MS : undefined);

  if (typeof url !== 'string' || typeof storedAt !== 'number' || typeof expiresAt !== 'number') {
    return null;
  }

  return { url, storedAt, expiresAt };
}

export async function loadWishSession(): Promise<WishAuthSession | null> {
  const entry = await db.appMeta.get(WISH_AUTH_SESSION_KEY);
  return parseSession(entry?.value);
}

export async function saveWishSession(url: string, now: number = Date.now()): Promise<WishAuthSession> {
  const session: WishAuthSession = {
    url,
    storedAt: now,
    expiresAt: now + ONE_DAY_MS,
  };

  await db.appMeta.put({ key: WISH_AUTH_SESSION_KEY, value: session });
  return session;
}

export async function clearWishSession() {
  await db.appMeta.delete(WISH_AUTH_SESSION_KEY);
}

export function isWishSessionExpired(session: WishAuthSession | null, now: number = Date.now()): boolean {
  if (!session) {
    return false;
  }

  return now > session.expiresAt;
}

export function getWishSessionExpiry(session: WishAuthSession | null, now: number = Date.now()) {
  if (!session) {
    return { expired: false, remainingMs: null as number | null };
  }

  const remainingMs = session.expiresAt - now;
  return {
    expired: remainingMs <= 0,
    remainingMs,
  };
}

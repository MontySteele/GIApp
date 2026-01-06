const ONE_DAY_MS = 24 * 60 * 60 * 1000;
export const WISH_AUTH_SESSION_KEY = 'wishAuthSession';

export interface WishAuthSession {
  url: string;
  storedAt: number;
}

export function loadWishSession(): WishAuthSession | null {
  try {
    const raw = sessionStorage.getItem(WISH_AUTH_SESSION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<WishAuthSession>;
    if (!parsed.url || typeof parsed.url !== 'string' || typeof parsed.storedAt !== 'number') {
      return null;
    }

    return {
      url: parsed.url,
      storedAt: parsed.storedAt,
    };
  } catch {
    return null;
  }
}

export function saveWishSession(url: string): WishAuthSession {
  const session: WishAuthSession = {
    url,
    storedAt: Date.now(),
  };

  sessionStorage.setItem(WISH_AUTH_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearWishSession() {
  sessionStorage.removeItem(WISH_AUTH_SESSION_KEY);
}

export function isWishSessionExpired(session: WishAuthSession | null): boolean {
  if (!session) {
    return false;
  }

  return Date.now() - session.storedAt > ONE_DAY_MS;
}

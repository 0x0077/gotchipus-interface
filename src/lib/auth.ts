const TOKEN_KEY = 'jwt_token';

/** Decode a JWT payload without verifying the signature (client-side only —
 *  signature verification happens on the backend). Returns the claims object
 *  or null if the token is malformed. */
function decodeJwt(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // JWT uses base64url. Convert to standard base64 for atob.
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

/** True if the token is absent, malformed, or past its `exp` claim (with a
 *  small 5s skew buffer so clock drift doesn't flag a still-valid token). */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const claims = decodeJwt(token);
  if (!claims?.exp) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec >= claims.exp - 5;
}

/** Returns the stored token if it's still valid, else null. Expired tokens
 *  are evicted from localStorage on read so the rest of the app doesn't have
 *  to remember to clean up — a stale token left around would silently 401 on
 *  every request and there's no recovery path short of logging out. */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  if (isTokenExpired(token)) {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
  return token;
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

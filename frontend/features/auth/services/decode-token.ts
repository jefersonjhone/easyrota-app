import { jwtDecode } from 'jwt-decode';               

export function isTokenExpired(token: string): boolean {
  try {
    const payload = jwtDecode<{ exp?: number }>(token);
    if (!payload?.exp) return true;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}
export function getTokenPayload(token: string): { exp?: number } | null {
  try {
    return jwtDecode<{ exp?: number }>(token);
  } catch {
    return null;   // invalid token
  }
}
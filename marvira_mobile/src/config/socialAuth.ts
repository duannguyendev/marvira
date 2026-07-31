/**
 * Social login ENV (inlined at bundle time via Babel).
 * Owner fills real values — see ../release_credentials.txt (repo root).
 */
export const GOOGLE_WEB_CLIENT_ID = (
  process.env.GOOGLE_WEB_CLIENT_ID || ''
).trim();

export const FACEBOOK_APP_ID = (process.env.FACEBOOK_APP_ID || '').trim();

export const FACEBOOK_CLIENT_TOKEN = (
  process.env.FACEBOOK_CLIENT_TOKEN || ''
).trim();

export function isGoogleSignInConfigured(): boolean {
  return GOOGLE_WEB_CLIENT_ID.length > 0;
}

export function isFacebookSignInConfigured(): boolean {
  return FACEBOOK_APP_ID.length > 0 && FACEBOOK_CLIENT_TOKEN.length > 0;
}

/** Apple uses native capability + API APPLE_CLIENT_ID; no mobile ENV required. */
export function isAppleSignInAvailable(): boolean {
  return true;
}

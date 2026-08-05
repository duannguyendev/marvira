export type PublicApiEnvironment = 'local' | 'uat' | 'production';

/**
 * Developer-only hard override for `next dev`.
 * Leave `null` and set `NEXT_PUBLIC_API_ENV` in `.env.local` instead.
 *
 * Production Railway builds use `NEXT_PUBLIC_API_URL` (and optionally
 * `NEXT_PUBLIC_API_ENV=uat` on a future UAT web service).
 *
 * @example
 *   const MANUAL_PUBLIC_API_ENV: PublicApiEnvironment | null = 'uat';
 */
const MANUAL_PUBLIC_API_ENV: PublicApiEnvironment | null = null;

function trim(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t || undefined;
}

function resolveEnv(): PublicApiEnvironment {
  if (process.env.NODE_ENV === 'production') {
    const fromEnv = trim(process.env.NEXT_PUBLIC_API_ENV)?.toLowerCase();
    if (fromEnv === 'local' || fromEnv === 'uat' || fromEnv === 'production') {
      return fromEnv;
    }
    return 'production';
  }
  if (MANUAL_PUBLIC_API_ENV) {
    return MANUAL_PUBLIC_API_ENV;
  }
  const fromEnv = trim(process.env.NEXT_PUBLIC_API_ENV)?.toLowerCase();
  if (fromEnv === 'local' || fromEnv === 'uat' || fromEnv === 'production') {
    return fromEnv;
  }
  return 'local';
}

export function getPublicApiEnvironment(): PublicApiEnvironment {
  return resolveEnv();
}

/** API base URL for browser / RSC fetch (no trailing slash). */
export function getPublicApiUrl(): string {
  const env = resolveEnv();
  let url: string | undefined;
  switch (env) {
    case 'local':
      url =
        trim(process.env.NEXT_PUBLIC_API_URL_LOCAL) ||
        trim(process.env.NEXT_PUBLIC_API_URL) ||
        'http://localhost:3001';
      break;
    case 'uat':
      url = trim(process.env.NEXT_PUBLIC_API_URL_UAT);
      break;
    case 'production':
      url =
        trim(process.env.NEXT_PUBLIC_API_URL_PRODUCTION) ||
        trim(process.env.NEXT_PUBLIC_API_URL);
      break;
  }
  if (!url) {
    throw new Error(
      `Public API URL for "${env}" is not set. Configure NEXT_PUBLIC_API_URL` +
        (env === 'uat'
          ? '_UAT'
          : env === 'local'
            ? '_LOCAL (or NEXT_PUBLIC_API_URL)'
            : '') +
        ' in .env.local / Railway.',
    );
  }
  return url.replace(/\/$/, '');
}

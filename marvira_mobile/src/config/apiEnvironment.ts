import { Platform } from 'react-native';

export type ApiEnvironment = 'local' | 'uat' | 'production';

/**
 * Developer-only: set this when you want a one-off build target.
 * Leave `null` to use `API_ENV` from `.env.local` (default: local in debug).
 *
 * Release / store builds always use `production` — this flag is ignored.
 *
 * @example
 *   const MANUAL_API_ENV: ApiEnvironment | null = 'uat';
 */
const MANUAL_API_ENV: ApiEnvironment | null = null;

const DEV_API_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

function trimUrl(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t || undefined;
}

function resolveEnv(): ApiEnvironment {
  if (!__DEV__) {
    return 'production';
  }
  if (MANUAL_API_ENV) {
    return MANUAL_API_ENV;
  }
  const fromEnv = trimUrl(process.env.API_ENV)?.toLowerCase();
  if (fromEnv === 'local' || fromEnv === 'uat' || fromEnv === 'production') {
    return fromEnv;
  }
  return 'local';
}

export function getApiEnvironment(): ApiEnvironment {
  return resolveEnv();
}

export function getApiBaseUrl(): string {
  const env = resolveEnv();
  const url = resolveUrl(env);
  if (!url) {
    throw new Error(
      `API URL for "${env}" is not configured. Set the matching env var in .env.local / CI ` +
        `(API_BASE_URL_LOCAL / API_BASE_URL_UAT / API_BASE_URL).`,
    );
  }
  return url.replace(/\/$/, '');
}

function resolveUrl(env: ApiEnvironment): string | undefined {
  switch (env) {
    case 'local':
      return (
        trimUrl(process.env.API_BASE_URL_LOCAL) ||
        trimUrl(process.env.API_BASE_URL) ||
        `http://${DEV_API_HOST}:3001`
      );
    case 'uat':
      return trimUrl(process.env.API_BASE_URL_UAT);
    case 'production':
      return (
        trimUrl(process.env.API_BASE_URL_PRODUCTION) ||
        trimUrl(process.env.API_BASE_URL)
      );
    default:
      return undefined;
  }
}

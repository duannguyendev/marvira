/**
 * Shared with apps — keep in sync with packages/shared-utils/src/public-api-url.ts
 * (next.config.js cannot import the TS package cleanly).
 */
function trim(value) {
  if (typeof value !== 'string') return undefined;
  const t = value.trim();
  return t || undefined;
}

function resolvePublicApiUrl() {
  let env;
  if (process.env.NODE_ENV === 'production') {
    const fromEnv = trim(process.env.NEXT_PUBLIC_API_ENV)?.toLowerCase();
    if (fromEnv === 'local' || fromEnv === 'uat' || fromEnv === 'production') {
      env = fromEnv;
    } else {
      env = 'production';
    }
  } else {
    const fromEnv = trim(process.env.NEXT_PUBLIC_API_ENV)?.toLowerCase();
    if (fromEnv === 'local' || fromEnv === 'uat' || fromEnv === 'production') {
      env = fromEnv;
    } else {
      env = 'local';
    }
  }

  let url;
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
    default:
      url =
        trim(process.env.NEXT_PUBLIC_API_URL_PRODUCTION) ||
        trim(process.env.NEXT_PUBLIC_API_URL);
      break;
  }

  if (!url) {
    throw new Error(
      `Public API URL for "${env}" is not set (next.config). Set NEXT_PUBLIC_API_URL / _UAT / _LOCAL.`,
    );
  }
  return url.replace(/\/$/, '');
}

module.exports = { resolvePublicApiUrl };

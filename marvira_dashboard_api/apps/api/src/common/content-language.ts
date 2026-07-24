export const CONTENT_LANGUAGES = ['vi', 'en', 'zh', 'ja'] as const;

export type ContentLanguage = (typeof CONTENT_LANGUAGES)[number];

export const DEFAULT_CONTENT_LANGUAGE: ContentLanguage = 'vi';

export function isContentLanguage(value: string): value is ContentLanguage {
  return (CONTENT_LANGUAGES as readonly string[]).includes(value);
}

/** Normalize create/update body language; falls back to default. */
export function normalizeContentLanguage(
  value?: string | null,
): ContentLanguage {
  if (value && isContentLanguage(value)) {
    return value;
  }
  return DEFAULT_CONTENT_LANGUAGE;
}

/**
 * Parse list query `language`.
 * - `all` or omitted → no language filter
 * - known code → filter to that language
 * - unknown → treat as default language filter
 */
export function parseLanguageFilterQuery(
  value?: string | null,
): ContentLanguage | 'all' {
  if (!value || value === 'all') {
    return 'all';
  }
  return normalizeContentLanguage(value);
}

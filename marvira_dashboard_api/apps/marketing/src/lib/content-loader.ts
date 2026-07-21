import { cookies } from 'next/headers';
import { getContent, resolveLocale } from '@/lib/i18n';
import type { Locale } from '@/lib/site';

export async function loadMarketingContent(langParam?: string | string[]): Promise<{
  content: ReturnType<typeof getContent>;
  locale: Locale;
}> {
  const fromQuery = Array.isArray(langParam) ? langParam[0] : langParam;
  const jar = await cookies();
  const locale = resolveLocale(fromQuery || jar.get('bg_lang')?.value);
  return { content: getContent(locale), locale };
}

export function withLang(path: string, locale: Locale) {
  if (locale === 'vi') {
    return path.includes('?') ? `${path}&lang=vi` : `${path}?lang=vi`;
  }
  return path;
}

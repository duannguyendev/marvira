import en, { type MarketingContent } from '@/content/en';
import vi from '@/content/vi';
import { DEFAULT_LOCALE, type Locale } from '@/lib/site';

const packs: Record<Locale, MarketingContent> = { en, vi };

export type ContentPack = MarketingContent;

export function getContent(locale: Locale = DEFAULT_LOCALE): ContentPack {
  return packs[locale] ?? packs[DEFAULT_LOCALE];
}

export function resolveLocale(value?: string | null): Locale {
  if (value === 'vi') return 'vi';
  return 'en';
}

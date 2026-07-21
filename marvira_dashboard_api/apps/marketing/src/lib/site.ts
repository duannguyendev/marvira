export const SITE = {
  name: 'Marvira',
  tagline: 'City adventure, on foot.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.marvira.example.com',
  supportEmail: 'hello@marvira.example.com',
  appStoreUrl: process.env.NEXT_PUBLIC_APP_STORE_URL || '',
  playStoreUrl: process.env.NEXT_PUBLIC_PLAY_STORE_URL || '',
  deepLinkScheme: 'marvira',
} as const;

export const STORE_READY = Boolean(SITE.appStoreUrl && SITE.playStoreUrl);

/** Hero / OG imagery — outdoor city adventure, not abstract UI */
export const IMAGES = {
  hero: '/images/home-hero.jpg',
  downtown:
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1600&q=80',
  goldenGate:
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1600&q=80',
  ogDefault: '/images/home-hero.jpg',
} as const;

export type Locale = 'en' | 'vi';
export const LOCALES: Locale[] = ['en', 'vi'];
export const DEFAULT_LOCALE: Locale = 'en';

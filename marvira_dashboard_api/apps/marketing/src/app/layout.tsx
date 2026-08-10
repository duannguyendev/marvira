import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import { SITE, IMAGES } from '@/lib/site';

/** Single OFL family (free commercial use) — strong Vietnamese + Latin coverage. */
const brand = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-brand',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: 'Marvira — City scavenger hunts on foot',
    template: '%s · Marvira',
  },
  description:
    'Walk real places, answer challenges, and climb leaderboards. Marvira is a GPS scavenger-hunt app for players and organizers.',
  keywords: [
    'scavenger hunt app',
    'GPS scavenger hunt',
    'city exploration game',
    'walking quiz',
    'outdoor team building',
  ],
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: 'Marvira — City scavenger hunts on foot',
    description: 'Walk real places, answer challenges, and climb leaderboards.',
    images: [
      {
        url: IMAGES.ogDefault,
        width: 1200,
        height: 630,
        alt: 'Marvira city adventure',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marvira — City scavenger hunts on foot',
    description: 'Walk real places, answer challenges, and climb leaderboards.',
    images: [IMAGES.ogDefault],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={brand.variable}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}

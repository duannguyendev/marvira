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
    default:
      'Marvira — Giải mật thư ngoài trời | Trò chơi lớn khám phá thành phố',
    template: '%s · Marvira',
  },
  description:
    'Marvira là ứng dụng giải mật thư GPS ngoài trời: đi tới địa điểm thật, giải thử thách và chơi trò chơi lớn cùng đội nhóm — phù hợp hoạt động đoàn đội, đội viên, đoàn viên và người thích đi bộ, chạy bộ, khám phá.',
  keywords: [
    'mật thư',
    'giải mật thư',
    'trò chơi lớn',
    'game cho hoạt động đoàn đội',
    'trò chơi cho đội viên',
    'trò chơi cho đoàn viên',
    'game đoàn đội',
    'trò chơi chạy bộ',
    'trò chơi khám phá ngoài trời',
    'GPS scavenger hunt',
  ],
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title:
      'Marvira — Giải mật thư ngoài trời | Trò chơi lớn khám phá thành phố',
    description:
      'Ứng dụng giải mật thư GPS ngoài trời cho đội nhóm, đoàn đội và người thích đi bộ khám phá thành phố.',
    images: [
      {
        url: IMAGES.ogDefault,
        width: 1200,
        height: 630,
        alt: 'Marvira — giải mật thư ngoài trời',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Marvira — Giải mật thư ngoài trời | Trò chơi lớn khám phá thành phố',
    description:
      'Ứng dụng giải mật thư GPS ngoài trời cho đội nhóm, đoàn đội và người thích đi bộ khám phá thành phố.',
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

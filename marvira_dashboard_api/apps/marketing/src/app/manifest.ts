import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.name,
    description:
      'Walk real places, answer challenges, and climb leaderboards. Marvira is a GPS scavenger-hunt app for players and organizers.',
    start_url: '/',
    display: 'standalone',
    background_color: '#312E81',
    theme_color: '#4F46E5',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}

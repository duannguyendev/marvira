import { IMAGES } from '@/lib/site';

export type FeaturedHunt = {
  id: string;
  title: string;
  blurb: string;
  city: string;
  difficulty: string;
  coverImage: string;
  shareTitle: string;
  shareDescription: string;
  longBody: string;
  when: string;
  where: string;
  coverBrief: string;
};

/** Static demo pack from API seed events — switch to live public API later */
export const FEATURED_EVENTS: FeaturedHunt[] = [
  {
    id: 'seed-event-downtown',
    title: 'Downtown Discovery Hunt',
    blurb:
      'Explore the historic downtown district and uncover hidden gems through interactive challenges.',
    city: 'San Francisco',
    difficulty: 'Medium',
    coverImage: IMAGES.downtown,
    shareTitle: 'Join Downtown Discovery Hunt on Marvira',
    shareDescription:
      'Walk Union Square, the Ferry Building, and Coit Tower — answer challenges and climb the board.',
    longBody:
      'Meet downtown. This hunt takes you through San Francisco’s historic core: plazas, the waterfront, and a hilltop landmark. Bring comfortable shoes, a charged phone, and a curious team. Exact answers stay in the app — this page is your invite, not a spoiler sheet.',
    when: 'Open whenever the event is published — check the app for live windows.',
    where: 'San Francisco downtown · start near Union Square',
    coverBrief: 'Downtown plaza / ferry / skyline walk — lively street-level adventure.',
  },
  {
    id: 'seed-event-golden-gate',
    title: 'Golden Gate Adventure',
    blurb: 'A scenic hunt along the iconic Golden Gate Bridge area.',
    city: 'San Francisco',
    difficulty: 'Hard',
    coverImage: IMAGES.goldenGate,
    shareTitle: 'Join Golden Gate Adventure on Marvira',
    shareDescription:
      'A scenic GPS scavenger hunt by the Golden Gate — walk, challenge, compete.',
    longBody:
      'Wind, views, and one of the world’s most photographed bridges. Golden Gate Adventure is a harder outdoor route for players who want scenery plus challenge. Install Marvira, open this link, and start from the welcome area pinned in the app.',
    when: 'Open whenever the event is published — check the app for live windows.',
    where: 'Golden Gate Bridge area · San Francisco',
    coverBrief: 'Bridge overlook / coastal path — windy outdoor trail energy.',
  },
];

export function getFeaturedEvent(id: string): FeaturedHunt | undefined {
  return FEATURED_EVENTS.find((e) => e.id === id);
}

/** Public API fields needed later (no spoilers / answers) */
export const LIVE_EVENT_PUBLIC_FIELDS = [
  'id',
  'slug',
  'title',
  'description',
  'city',
  'dates',
  'coverImage',
  'publicVsInviteOnly',
] as const;

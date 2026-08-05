import { IMAGES } from '@/lib/site';
import { resolveArticleImage } from '@/lib/articles';

import { getPublicApiUrl } from '@marvira/shared-utils';

const API_URL = getPublicApiUrl();

export type InviteEvent = {
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
};

type ApiPublicEvent = {
  id: string;
  title: string;
  description: string;
  city: string;
  coverImage?: string | null;
  difficulty?: string;
  isActive?: boolean;
  scheduledPublishAt?: string | null;
  endsAt?: string | null;
  endedAt?: string | null;
};

interface Envelope<T> {
  success: boolean;
  data: T;
}

/** Static demo pack — fallback when API is down or event is seed-only offline */
export const FEATURED_EVENTS: InviteEvent[] = [
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
  },
];

function getFeaturedEvent(id: string): InviteEvent | undefined {
  return FEATURED_EVENTS.find(e => e.id === id);
}

function formatDifficulty(value?: string): string {
  if (!value) return 'Medium';
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function formatWhen(event: ApiPublicEvent): string {
  if (event.endedAt) {
    return 'This hunt has ended — open the app for results if you played.';
  }
  const start = event.scheduledPublishAt
    ? new Date(event.scheduledPublishAt)
    : null;
  const end = event.endsAt ? new Date(event.endsAt) : null;
  if (start && !Number.isNaN(start.getTime()) && start.getTime() > Date.now()) {
    return `Opens ${start.toUTCString()}${end && !Number.isNaN(end.getTime()) ? ` · ends ${end.toUTCString()}` : ''}`;
  }
  if (end && !Number.isNaN(end.getTime())) {
    return `Live now · ends ${end.toUTCString()}`;
  }
  if (event.isActive) {
    return 'Live now — open the app for the current window.';
  }
  return 'Check the Marvira app for live windows.';
}

function mapApiEvent(event: ApiPublicEvent): InviteEvent {
  const blurb =
    event.description.length > 160
      ? `${event.description.slice(0, 157).trim()}…`
      : event.description;
  const coverImage =
    resolveArticleImage(event.coverImage) || IMAGES.ogDefault;

  return {
    id: event.id,
    title: event.title,
    blurb,
    city: event.city,
    difficulty: formatDifficulty(event.difficulty),
    coverImage,
    shareTitle: `Join ${event.title} on Marvira`,
    shareDescription: blurb,
    longBody: event.description,
    when: formatWhen(event),
    where: event.city,
  };
}

/**
 * Resolve an invite event for /e/{id}.
 * Prefers the live public API so any published hunt works; falls back to
 * static featured seeds when the API is unreachable (local offline demos).
 */
export async function getInviteEvent(id: string): Promise<InviteEvent | null> {
  try {
    const res = await fetch(`${API_URL}/events/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    });
    if (res.status === 404) {
      return getFeaturedEvent(id) ?? null;
    }
    if (!res.ok) {
      return getFeaturedEvent(id) ?? null;
    }
    const json = (await res.json()) as Envelope<ApiPublicEvent>;
    if (!json?.data?.id) {
      return getFeaturedEvent(id) ?? null;
    }
    return mapApiEvent(json.data);
  } catch {
    return getFeaturedEvent(id) ?? null;
  }
}

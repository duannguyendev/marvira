/**
 * Parse / build invite & share deep links.
 * Supports: marvira://event/{id}, marvira://e/{id}, https://…/e/{id}
 */
import { MARKETING_SITE_URL } from './constants';

export type InviteLinkInfo = {
  eventId?: string;
  linkType: 'invite' | 'share' | 'other';
};

let pendingInviteEventId: string | null = null;

export function parseInviteUrl(url: string): InviteLinkInfo {
  try {
    const normalized = url.trim();

    const customMatch = normalized.match(
      /^marvira:\/\/(?:\/)?(?:event|e)\/([^/?#]+)/i,
    );
    if (customMatch?.[1]) {
      return { eventId: decodeURIComponent(customMatch[1]), linkType: 'invite' };
    }

    const httpMatch = normalized.match(/\/e\/([^/?#]+)/i);
    if (httpMatch?.[1]) {
      return { eventId: decodeURIComponent(httpMatch[1]), linkType: 'share' };
    }

    if (normalized.toLowerCase().includes('invite')) {
      return { linkType: 'invite' };
    }

    return { linkType: 'other' };
  } catch {
    return { linkType: 'other' };
  }
}

/** Custom-scheme link that opens the app directly (used by marketing /e pages). */
export function buildInviteDeepLink(eventId: string): string {
  return `marvira://e/${encodeURIComponent(eventId)}`;
}

/** HTTPS invite page — preferred for Share sheets (works without the app installed). */
export function buildInviteWebUrl(eventId: string): string {
  const base = MARKETING_SITE_URL.replace(/\/$/, '');
  return `${base}/e/${encodeURIComponent(eventId)}`;
}

export function setPendingInviteEventId(eventId: string): void {
  pendingInviteEventId = eventId;
}

export function consumePendingInviteEventId(): string | null {
  const id = pendingInviteEventId;
  pendingInviteEventId = null;
  return id;
}

export function peekPendingInviteEventId(): string | null {
  return pendingInviteEventId;
}

/**
 * Parse invite / share deep links for analytics (no navigation yet).
 * Supports: marvira://event/{id}, marvira://e/{id}, https://…/e/{id}
 */
export type InviteLinkInfo = {
  eventId?: string;
  linkType: 'invite' | 'share' | 'other';
};

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

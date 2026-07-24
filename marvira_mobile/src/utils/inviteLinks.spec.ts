import { parseInviteUrl, buildInviteDeepLink, buildInviteWebUrl } from './inviteLinks';
import { MARKETING_SITE_URL } from './constants';

describe('parseInviteUrl', () => {
  it('parses marvira event deep links', () => {
    expect(parseInviteUrl('marvira://event/abc-123')).toEqual({
      eventId: 'abc-123',
      linkType: 'invite',
    });
    expect(parseInviteUrl('marvira://e/xyz')).toEqual({
      eventId: 'xyz',
      linkType: 'invite',
    });
  });

  it('parses marketing /e/ paths', () => {
    expect(parseInviteUrl('https://www.example.com/e/evt-9')).toEqual({
      eventId: 'evt-9',
      linkType: 'share',
    });
  });

  it('falls back to other', () => {
    expect(parseInviteUrl('https://www.example.com/about')).toEqual({
      linkType: 'other',
    });
  });
});

describe('buildInvite links', () => {
  it('builds deep link and web invite url', () => {
    expect(buildInviteDeepLink('evt-1')).toBe('marvira://e/evt-1');
    expect(buildInviteWebUrl('evt-1')).toBe(
      `${MARKETING_SITE_URL.replace(/\/$/, '')}/e/evt-1`,
    );
  });

  it('encodes event ids in links', () => {
    expect(buildInviteDeepLink('a/b')).toBe('marvira://e/a%2Fb');
    expect(buildInviteWebUrl('a/b')).toContain('/e/a%2Fb');
  });
});

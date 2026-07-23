import { parseInviteUrl } from './inviteLinks';

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

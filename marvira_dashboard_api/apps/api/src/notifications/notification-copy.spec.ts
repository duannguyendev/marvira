import { NotificationCategory, NotificationType } from '@prisma/client';
import {
  buildNotificationCopy,
  categoryForType,
  normalizeNotificationLocale,
} from './notification-copy';

describe('notification-copy', () => {
  it('normalizes locale codes', () => {
    expect(normalizeNotificationLocale('vi-VN')).toBe('vi');
    expect(normalizeNotificationLocale('unknown')).toBe('en');
    expect(normalizeNotificationLocale(null)).toBe('en');
  });

  it('maps types to categories', () => {
    expect(categoryForType(NotificationType.EVENT_COMPLETED)).toBe('GAMEPLAY');
    expect(categoryForType(NotificationType.EVENT_WENT_LIVE)).toBe('CREATOR');
  });

  it('builds localized copy without gift codes', () => {
    const copy = buildNotificationCopy(NotificationType.EVENT_COMPLETED, 'en', {
      eventTitle: 'Old Quarter Hunt',
      score: 120,
    });
    expect(copy.title).toContain('completed');
    expect(copy.body).toContain('Old Quarter Hunt');
    expect(copy.body).not.toMatch(/gift|code/i);
  });

  it('uses Vietnamese templates', () => {
    const copy = buildNotificationCopy(NotificationType.ANSWER_UPDATED, 'vi', {
      eventTitle: 'Săn Hà Nội',
    });
    expect(copy.title.length).toBeGreaterThan(0);
    expect(copy.body).toContain('Săn Hà Nội');
  });

  it('keeps category enum aligned', () => {
    expect(NotificationCategory.GAMEPLAY).toBe('GAMEPLAY');
  });
});

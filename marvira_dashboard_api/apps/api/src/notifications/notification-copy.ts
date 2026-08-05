import { NotificationType } from '@prisma/client';

export type NotificationLocale = 'en' | 'vi' | 'zh' | 'ja';

type CopyParams = {
  eventTitle?: string;
  placeTitle?: string;
  score?: number;
  reason?: string;
};

type LocalizedCopy = { title: string; body: string };

const COPY: Record<
  NotificationType,
  Record<NotificationLocale, (p: CopyParams) => LocalizedCopy>
> = {
  EVENT_COMPLETED: {
    en: p => ({
      title: 'Hunt completed!',
      body: `You finished "${p.eventTitle ?? 'the hunt'}"${
        p.score != null ? ` with ${p.score} points` : ''
      }.`,
    }),
    vi: p => ({
      title: 'Hoàn thành săn tìm!',
      body: `Bạn đã hoàn thành "${p.eventTitle ?? 'sự kiện'}"${
        p.score != null ? ` với ${p.score} điểm` : ''
      }.`,
    }),
    zh: p => ({
      title: '寻宝完成！',
      body: `你完成了「${p.eventTitle ?? '活动'}」${
        p.score != null ? `，得分 ${p.score}` : ''
      }。`,
    }),
    ja: p => ({
      title: 'ハント完了！',
      body: `「${p.eventTitle ?? 'イベント'}」を完了しました${
        p.score != null ? `（${p.score}点）` : ''
      }。`,
    }),
  },
  WRONG_ANSWER_REPORT: {
    en: p => ({
      title: 'Answer report',
      body: `A player reported a wrong answer at "${p.placeTitle ?? 'a place'}" in ${p.eventTitle ?? 'your event'}.`,
    }),
    vi: p => ({
      title: 'Báo cáo đáp án',
      body: `Người chơi báo đáp án sai tại "${p.placeTitle ?? 'một điểm'}" trong ${p.eventTitle ?? 'sự kiện của bạn'}.`,
    }),
    zh: p => ({
      title: '答案举报',
      body: `有玩家举报「${p.eventTitle ?? '活动'}」中「${p.placeTitle ?? '地点'}」的答案有误。`,
    }),
    ja: p => ({
      title: '回答の報告',
      body: `「${p.eventTitle ?? 'イベント'}」の「${p.placeTitle ?? '場所'}」で誤答の報告がありました。`,
    }),
  },
  ANSWER_UPDATED: {
    en: p => ({
      title: 'Answer updated',
      body: `An answer was updated in ${p.eventTitle ?? 'an event'}. You can try again.`,
    }),
    vi: p => ({
      title: 'Đáp án đã cập nhật',
      body: `Đáp án trong ${p.eventTitle ?? 'sự kiện'} đã được cập nhật. Bạn có thể thử lại.`,
    }),
    zh: p => ({
      title: '答案已更新',
      body: `「${p.eventTitle ?? '活动'}」中的答案已更新，你可以再试一次。`,
    }),
    ja: p => ({
      title: '回答が更新されました',
      body: `「${p.eventTitle ?? 'イベント'}」の回答が更新されました。再挑戦できます。`,
    }),
  },
  SCHEDULED_PUBLISH_FAILED: {
    en: p => ({
      title: 'Scheduled publish failed',
      body: `Could not publish "${p.eventTitle ?? 'your event'}": ${p.reason ?? 'validation failed'}.`,
    }),
    vi: p => ({
      title: 'Xuất bản theo lịch thất bại',
      body: `Không thể xuất bản "${p.eventTitle ?? 'sự kiện'}": ${p.reason ?? 'kiểm tra thất bại'}.`,
    }),
    zh: p => ({
      title: '定时发布失败',
      body: `无法发布「${p.eventTitle ?? '活动'}」：${p.reason ?? '校验失败'}。`,
    }),
    ja: p => ({
      title: '予約公開に失敗',
      body: `「${p.eventTitle ?? 'イベント'}」を公開できませんでした：${p.reason ?? '検証失敗'}。`,
    }),
  },
  EVENT_WENT_LIVE: {
    en: p => ({
      title: 'Your hunt is live',
      body: `"${p.eventTitle ?? 'Your event'}" is now live and discoverable.`,
    }),
    vi: p => ({
      title: 'Sự kiện đã live',
      body: `"${p.eventTitle ?? 'Sự kiện của bạn'}" đã được công bố.`,
    }),
    zh: p => ({
      title: '活动已上线',
      body: `「${p.eventTitle ?? '你的活动'}」现已上线，可被发现。`,
    }),
    ja: p => ({
      title: 'イベントが公開されました',
      body: `「${p.eventTitle ?? 'イベント'}」が公開され、検索可能になりました。`,
    }),
  },
  EVENT_ENDED: {
    en: p => ({
      title: 'Hunt ended',
      body: `"${p.eventTitle ?? 'Your event'}" has ended and left public search.`,
    }),
    vi: p => ({
      title: 'Sự kiện đã kết thúc',
      body: `"${p.eventTitle ?? 'Sự kiện của bạn'}" đã kết thúc và rời khỏi tìm kiếm công khai.`,
    }),
    zh: p => ({
      title: '活动已结束',
      body: `「${p.eventTitle ?? '你的活动'}」已结束，并已离开公开搜索。`,
    }),
    ja: p => ({
      title: 'イベント終了',
      body: `「${p.eventTitle ?? 'イベント'}」は終了し、公開検索から外れました。`,
    }),
  },
};

export function normalizeNotificationLocale(
  locale?: string | null,
): NotificationLocale {
  const code = (locale || 'en').toLowerCase().slice(0, 2);
  if (code === 'vi' || code === 'zh' || code === 'ja' || code === 'en') {
    return code;
  }
  return 'en';
}

export function buildNotificationCopy(
  type: NotificationType,
  locale: string | null | undefined,
  params: CopyParams,
): LocalizedCopy {
  const lang = normalizeNotificationLocale(locale);
  return COPY[type][lang](params);
}

export function categoryForType(
  type: NotificationType,
): 'GAMEPLAY' | 'CREATOR' | 'PRODUCT' {
  switch (type) {
    case 'EVENT_COMPLETED':
    case 'ANSWER_UPDATED':
      return 'GAMEPLAY';
    case 'WRONG_ANSWER_REPORT':
    case 'SCHEDULED_PUBLISH_FAILED':
    case 'EVENT_WENT_LIVE':
    case 'EVENT_ENDED':
      return 'CREATOR';
    default:
      return 'PRODUCT';
  }
}

import {
  GLOBAL_SCORE_BASE,
  GLOBAL_SCORE_DAILY_CAP,
  GLOBAL_SCORE_PER_EVENT_CAP,
  GLOBAL_SCORE_PER_PLACE,
  GLOBAL_SCORE_QUESTION_CAP,
} from './global-score.constants';
import {
  computeGlobalScoreContribution,
  startOfUtcDay,
} from './global-score.util';

describe('computeGlobalScoreContribution', () => {
  it('returns 0 for the event creator', () => {
    expect(
      computeGlobalScoreContribution({
        isEventCreator: true,
        placeCount: 5,
        questionPointsEarned: 100,
        globalPointsEarnedToday: 0,
      }),
    ).toBe(0);
  });

  it('applies base + places + question credit with per-event cap', () => {
    // 50 + 3*20 + 100 = 210
    expect(
      computeGlobalScoreContribution({
        isEventCreator: false,
        placeCount: 3,
        questionPointsEarned: 100,
        globalPointsEarnedToday: 0,
      }),
    ).toBe(210);
  });

  it('caps question credit and per-event total', () => {
    const withHugeQuestions = computeGlobalScoreContribution({
      isEventCreator: false,
      placeCount: 20,
      questionPointsEarned: 50_000,
      globalPointsEarnedToday: 0,
    });
    // 50 + 20*20 + 200 = 650 → capped at PER_EVENT_CAP
    expect(withHugeQuestions).toBe(GLOBAL_SCORE_PER_EVENT_CAP);
    expect(GLOBAL_SCORE_QUESTION_CAP).toBe(200);
    expect(GLOBAL_SCORE_PER_EVENT_CAP).toBe(300);
  });

  it('respects the daily soft cap', () => {
    expect(
      computeGlobalScoreContribution({
        isEventCreator: false,
        placeCount: 5,
        questionPointsEarned: 100,
        globalPointsEarnedToday: GLOBAL_SCORE_DAILY_CAP - 40,
      }),
    ).toBe(40);

    expect(
      computeGlobalScoreContribution({
        isEventCreator: false,
        placeCount: 5,
        questionPointsEarned: 100,
        globalPointsEarnedToday: GLOBAL_SCORE_DAILY_CAP,
      }),
    ).toBe(0);
  });

  it('ignores negative question points', () => {
    expect(
      computeGlobalScoreContribution({
        isEventCreator: false,
        placeCount: 1,
        questionPointsEarned: -10,
        globalPointsEarnedToday: 0,
      }),
    ).toBe(GLOBAL_SCORE_BASE + GLOBAL_SCORE_PER_PLACE);
  });
});

describe('startOfUtcDay', () => {
  it('floors to UTC midnight', () => {
    const d = new Date('2026-08-07T15:30:00.000Z');
    expect(startOfUtcDay(d).toISOString()).toBe('2026-08-07T00:00:00.000Z');
  });
});

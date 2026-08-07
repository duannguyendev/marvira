import { clamp } from '@marvira/shared-utils';
import {
  GLOBAL_SCORE_BASE,
  GLOBAL_SCORE_DAILY_CAP,
  GLOBAL_SCORE_PER_EVENT_CAP,
  GLOBAL_SCORE_PER_PLACE,
  GLOBAL_SCORE_QUESTION_CAP,
} from './global-score.constants';

export type GlobalScoreInput = {
  isEventCreator: boolean;
  placeCount: number;
  /** Sum of question points earned in the event (exclude rewardPoints). */
  questionPointsEarned: number;
  /** Global points already awarded to this user since start of UTC day. */
  globalPointsEarnedToday: number;
};

/**
 * Compute snapshot global contribution for one event completion.
 * Creator completions and exhausted daily caps yield 0.
 */
export function computeGlobalScoreContribution(
  input: GlobalScoreInput,
): number {
  if (input.isEventCreator) return 0;

  const placeCount = Math.max(0, Math.floor(input.placeCount));
  const questionCredit = clamp(
    Math.max(0, Math.floor(input.questionPointsEarned)),
    0,
    GLOBAL_SCORE_QUESTION_CAP,
  );
  const raw =
    GLOBAL_SCORE_BASE + placeCount * GLOBAL_SCORE_PER_PLACE + questionCredit;
  const uncapped = clamp(raw, 0, GLOBAL_SCORE_PER_EVENT_CAP);

  const remainingToday = Math.max(
    0,
    GLOBAL_SCORE_DAILY_CAP - Math.max(0, Math.floor(input.globalPointsEarnedToday)),
  );
  return Math.min(uncapped, remainingToday);
}

/** Start of the UTC calendar day for `date`. */
export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

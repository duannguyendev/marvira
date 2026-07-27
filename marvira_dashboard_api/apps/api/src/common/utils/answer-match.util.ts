import { QuestionType } from '@prisma/client';

export interface AnswerCheckQuestion {
  type: QuestionType;
  answer: string;
  options?: unknown;
}

/** Trim + case-insensitive equality — same rule as gameplay. */
export function isAnswerCorrect(
  question: AnswerCheckQuestion,
  submitted: string,
): boolean {
  const normalized = submitted.trim().toLowerCase();
  const expected = question.answer.trim().toLowerCase();

  if (question.type === QuestionType.MULTIPLE_CHOICE) {
    const options = (question.options as string[] | null) ?? [];
    return (
      options.some(o => o.trim().toLowerCase() === normalized) &&
      normalized === expected
    );
  }

  if (question.type === QuestionType.TRUE_FALSE) {
    return normalized === 'true' || normalized === 'false'
      ? normalized === expected
      : false;
  }

  return normalized === expected;
}

import { isAnswerCorrect } from './answer-match.util';
import { QuestionType } from '@prisma/client';

describe('isAnswerCorrect', () => {
  it('matches text answers with trim and case insensitivity', () => {
    expect(
      isAnswerCorrect(
        { type: QuestionType.TEXT, answer: 'Hanoi', options: null },
        '  hanoi ',
      ),
    ).toBe(true);
  });

  it('requires MC option to exist and match expected', () => {
    expect(
      isAnswerCorrect(
        {
          type: QuestionType.MULTIPLE_CHOICE,
          answer: 'A',
          options: ['A', 'B'],
        },
        'a',
      ),
    ).toBe(true);
    expect(
      isAnswerCorrect(
        {
          type: QuestionType.MULTIPLE_CHOICE,
          answer: 'A',
          options: ['A', 'B'],
        },
        'B',
      ),
    ).toBe(false);
  });

  it('matches true/false case-insensitively', () => {
    expect(
      isAnswerCorrect(
        { type: QuestionType.TRUE_FALSE, answer: 'True', options: null },
        'true',
      ),
    ).toBe(true);
  });
});

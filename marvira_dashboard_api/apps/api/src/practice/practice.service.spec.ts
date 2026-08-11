import { QuestionSource, QuestionType } from '@prisma/client';
import { PracticeService } from './practice.service';

function createPracticeService(question: Record<string, unknown>) {
  const prisma = {
    client: {
      question: {
        findUnique: jest.fn().mockResolvedValue(question),
      },
      userFavoriteQuestion: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      userPracticeCompletion: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    },
  };

  const questionsService = {};
  const service = new PracticeService(
    prisma as never,
    questionsService as never,
  );
  return { service, prisma };
}

const baseQuestion = {
  id: 'q-1',
  question: 'Capital of Vietnam?',
  type: QuestionType.TEXT,
  imageUrl: null,
  options: null,
  answer: 'Hanoi',
  explanation: 'Hanoi is the capital.',
  points: 10,
  language: 'vi',
  createdBy: 'author-1',
  source: QuestionSource.COMMUNITY,
  isPublished: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  creator: { id: 'author-1', name: 'Author' },
};

describe('PracticeService.getQuestionForTraining', () => {
  it('does not leak answer to a non-author player', async () => {
    const { service } = createPracticeService(baseQuestion);
    const data = await service.getQuestionForTraining('player-2', 'q-1');
    expect(data).not.toHaveProperty('answer');
    expect(data.id).toBe('q-1');
    expect(data.text).toBe('Capital of Vietnam?');
  });

  it('includes answer for the author (edit form)', async () => {
    const { service } = createPracticeService(baseQuestion);
    const data = await service.getQuestionForTraining('author-1', 'q-1');
    expect(data.answer).toBe('Hanoi');
  });
});

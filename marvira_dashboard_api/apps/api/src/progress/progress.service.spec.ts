import { ProgressService } from './progress.service';
import { QuestionType } from '@prisma/client';

function createProgressService(
  overrides: {
    progress?: Record<string, unknown> | null;
    existingCompletion?: Record<string, unknown> | null;
    place?: Record<string, unknown>;
  } = {},
) {
  const prisma = {
    client: {
      place: {
        findUnique: jest.fn().mockResolvedValue(
          overrides.place ?? {
            id: 'place-1',
            latitude: 37.7879,
            longitude: -122.4075,
            radiusMeters: 100,
            question: {
              type: QuestionType.TEXT,
              answer: '1850',
              options: null,
              points: 10,
              explanation: 'Founded in 1850',
            },
            event: {
              id: 'event-1',
              title: 'Test Event',
              rewardPoints: 50,
              places: [{ id: 'place-1' }],
            },
          },
        ),
      },
      userEventProgress: {
        findUnique: jest.fn().mockResolvedValue(overrides.progress ?? null),
        update: jest.fn(),
      },
      userPlaceCompletion: {
        findUnique: jest
          .fn()
          .mockResolvedValue(overrides.existingCompletion ?? null),
        upsert: jest.fn(),
      },
      analyticsEvent: { create: jest.fn() },
    },
  };

  const redis = { incr: jest.fn().mockResolvedValue(1), expire: jest.fn() };
  const websocket = {
    emitProgressUpdated: jest.fn(),
    emitEventCompleted: jest.fn(),
  };
  const moduleRef = { get: jest.fn() };
  const eventAccess = { assertCanPlay: jest.fn() };
  const anticheat = { evaluateAndRecord: jest.fn().mockResolvedValue([]) };

  const service = new ProgressService(
    prisma as never,
    redis as never,
    websocket as never,
    moduleRef as never,
    eventAccess as never,
    anticheat as never,
  );

  return { service, prisma, websocket };
}

describe('ProgressService', () => {
  describe('submitAnswer guards', () => {
    it('returns existing completion snapshot when the event is already completed', async () => {
      const prismaExtra = {
        client: {
          event: {
            findUnique: jest.fn().mockResolvedValue({
              completionMessage: 'Thanks!',
              giftTeaser: 'Free drink',
              giftCodes: ['CODE1'],
            }),
          },
        },
      };
      const { service, prisma } = createProgressService({
        progress: {
          id: 'prog-1',
          score: 120,
          currentPlaceIndex: 0,
          completed: true,
          startedAt: new Date(),
          totalDurationMs: 5000,
          finishRank: 1,
          giftCodeAwarded: 'CODE1',
        },
      });
      Object.assign(prisma.client, prismaExtra.client);

      const result = await service.submitAnswer('user-1', 'place-1', {
        answer: '1850',
        latitude: 37.7879,
        longitude: -122.4075,
      });

      expect(result.eventCompleted).toBe(true);
      expect(result.alreadyCompleted).toBe(true);
      expect('finishRank' in result && result.finishRank).toBe(1);
      expect('giftCode' in result && result.giftCode).toBe('CODE1');
      expect('giftCount' in result && result.giftCount).toBe(1);
      expect('giftsAllClaimed' in result && result.giftsAllClaimed).toBe(false);
    });

    it('returns idempotent payload when a non-last place was already completed', async () => {
      const { service, prisma } = createProgressService({
        progress: {
          id: 'prog-1',
          score: 60,
          currentPlaceIndex: 0,
          completed: false,
          startedAt: new Date(),
          totalDurationMs: null,
        },
        existingCompletion: {
          completed: true,
          unlockedAt: new Date(Date.now() - 60000),
          answerDurationMs: 45000,
        },
        place: {
          id: 'place-1',
          latitude: 37.7879,
          longitude: -122.4075,
          radiusMeters: 100,
          question: {
            type: QuestionType.TEXT,
            answer: '1850',
            options: null,
            points: 10,
            explanation: 'Founded in 1850',
          },
          event: {
            id: 'event-1',
            title: 'Test Event',
            rewardPoints: 50,
            places: [{ id: 'place-1' }, { id: 'place-2' }],
          },
        },
      });

      const result = await service.submitAnswer('user-1', 'place-1', {
        answer: '1850',
        latitude: 37.7879,
        longitude: -122.4075,
      });

      expect(result.correct).toBe(true);
      expect(result.points).toBe(0);
      expect(result.totalScore).toBe(60);
      expect(result.eventCompleted).toBe(false);
      expect(result.alreadyCompleted).toBe(true);
      expect(result.nextPlaceId).toBe('place-2');
      expect(prisma.client.userPlaceCompletion.upsert).not.toHaveBeenCalled();
      expect(prisma.client.userEventProgress.update).not.toHaveBeenCalled();
    });

    it('recovers gift assign when last place is done but event is not completed', async () => {
      const tx = {
        $queryRaw: jest.fn().mockResolvedValue([{ id: 'event-1' }]),
        userEventProgress: {
          findUnique: jest
            .fn()
            .mockResolvedValueOnce({
              id: 'prog-1',
              completed: false,
              finishRank: null,
              giftCodeAwarded: null,
            })
            .mockResolvedValue({ id: 'prog-1', completed: true }),
          update: jest.fn().mockResolvedValue({}),
          findMany: jest.fn().mockResolvedValue([
            {
              userId: 'user-1',
              completedAt: new Date(),
              startedAt: new Date(),
            },
          ]),
        },
        event: {
          findUnique: jest.fn().mockResolvedValue({
            completionMessage: 'Thanks!',
            giftTeaser: 'Free drink',
            giftCodes: ['CODE1'],
          }),
        },
      };

      const { service, prisma, websocket } = createProgressService({
        progress: {
          id: 'prog-1',
          score: 60,
          currentPlaceIndex: 0,
          completed: false,
          startedAt: new Date(Date.now() - 120000),
          totalDurationMs: null,
        },
        existingCompletion: {
          completed: true,
          unlockedAt: new Date(Date.now() - 60000),
          answerDurationMs: 45000,
        },
      });

      (prisma.client as { $transaction?: jest.Mock }).$transaction = jest
        .fn()
        .mockImplementation(async (fn: (t: typeof tx) => Promise<unknown>) =>
          fn(tx),
        );

      const result = await service.submitAnswer('user-1', 'place-1', {
        answer: '1850',
        latitude: 37.7879,
        longitude: -122.4075,
      });

      expect(result.eventCompleted).toBe(true);
      expect(result.alreadyCompleted).toBe(true);
      expect('giftCode' in result && result.giftCode).toBe('CODE1');
      expect('finishRank' in result && result.finishRank).toBe(1);
      expect(websocket.emitEventCompleted).toHaveBeenCalled();
    });
  });
});

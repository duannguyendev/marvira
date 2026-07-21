import { ForbiddenException } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { QuestionType } from '@prisma/client';

function createProgressService(overrides: {
  progress?: Record<string, unknown> | null;
  existingCompletion?: Record<string, unknown> | null;
  place?: Record<string, unknown>;
} = {}) {
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
        findUnique: jest.fn().mockResolvedValue(overrides.existingCompletion ?? null),
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
    it('rejects answers when the event is already completed', async () => {
      const { service } = createProgressService({
        progress: {
          id: 'prog-1',
          score: 120,
          currentPlaceIndex: 0,
          completed: true,
          startedAt: new Date(),
          totalDurationMs: 5000,
        },
      });

      await expect(
        service.submitAnswer('user-1', 'place-1', {
          answer: '1850',
          latitude: 37.7879,
          longitude: -122.4075,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns idempotent payload when place was already completed', async () => {
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
      });

      const result = await service.submitAnswer('user-1', 'place-1', {
        answer: '1850',
        latitude: 37.7879,
        longitude: -122.4075,
      });

      expect(result.correct).toBe(true);
      expect(result.points).toBe(0);
      expect(result.totalScore).toBe(60);
      expect(result.alreadyCompleted).toBe(true);
      expect(prisma.client.userPlaceCompletion.upsert).not.toHaveBeenCalled();
      expect(prisma.client.userEventProgress.update).not.toHaveBeenCalled();
    });
  });
});

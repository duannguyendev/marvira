import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

const SEED = {
  eventId: 'seed-event-downtown',
  places: [
    {
      id: 'seed-place-1',
      lat: 37.7879,
      lon: -122.4075,
      answer: '1850',
      next: 'seed-place-2',
    },
    {
      id: 'seed-place-2',
      lat: 37.7956,
      lon: -122.3933,
      answer: 'Big Ben',
      next: 'seed-place-3',
    },
    {
      id: 'seed-place-3',
      lat: 37.8024,
      lon: -122.4058,
      answer: 'True',
      next: null,
    },
  ],
} as const;

describe('Gameplay flow (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  async function registerPlayer() {
    const email = `gameplay_${Date.now()}_${Math.random().toString(36).slice(2)}@marvira.test`;
    const password = 'TestPass123!';
    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, name: 'Gameplay Tester', password });
    expect(reg.status).toBe(201);
    return reg.body.data.tokens.accessToken as string;
  }

  it('unlock → question → answer advances through all places', async () => {
    const token = await registerPlayer();

    for (const place of SEED.places) {
      await request(app.getHttpServer())
        .post(`/places/${place.id}/unlock`)
        .set('Authorization', `Bearer ${token}`)
        .send({ latitude: place.lat, longitude: place.lon })
        .expect(201);

      const questionRes = await request(app.getHttpServer())
        .get(`/places/${place.id}/question`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(questionRes.body.data.answer).toBeUndefined();

      const answerRes = await request(app.getHttpServer())
        .post(`/places/${place.id}/answer`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          answer: place.answer,
          latitude: place.lat,
          longitude: place.lon,
        })
        .expect(201);

      expect(answerRes.body.data.correct).toBe(true);
      expect(answerRes.body.data.nextPlaceId).toBe(place.next);
      expect(answerRes.body.data.totalScore).toBeGreaterThanOrEqual(0);
      if (place.next === null) {
        expect(answerRes.body.data.eventCompleted).toBe(true);
        expect(answerRes.body.data.eventTotalDurationMs).toBeGreaterThanOrEqual(
          0,
        );
        expect(answerRes.body.data.totalScore).toBeGreaterThan(
          answerRes.body.data.points,
        );
      }
    }
  });

  it('rejects unlock when outside place radius', async () => {
    const token = await registerPlayer();

    await request(app.getHttpServer())
      .post('/places/seed-place-1/unlock')
      .set('Authorization', `Bearer ${token}`)
      .send({ latitude: 0, longitude: 0 })
      .expect(400);
  });

  it('rejects skipping ahead to a later place', async () => {
    const token = await registerPlayer();

    await request(app.getHttpServer())
      .post('/places/seed-place-2/unlock')
      .set('Authorization', `Bearer ${token}`)
      .send({ latitude: 37.7956, longitude: -122.3933 })
      .expect(403);
  });

  it('rejects replay after event completion', async () => {
    const token = await registerPlayer();

    for (const place of SEED.places) {
      await request(app.getHttpServer())
        .post(`/places/${place.id}/unlock`)
        .set('Authorization', `Bearer ${token}`)
        .send({ latitude: place.lat, longitude: place.lon })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/places/${place.id}/answer`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          answer: place.answer,
          latitude: place.lat,
          longitude: place.lon,
        })
        .expect(201);
    }

    const replay = await request(app.getHttpServer())
      .post('/places/seed-place-1/answer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        answer: SEED.places[0].answer,
        latitude: SEED.places[0].lat,
        longitude: SEED.places[0].lon,
      })
      .expect(403);

    expect(replay.body.message).toMatch(/Event already completed/i);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

describe('Marvira API (e2e)', () => {
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect(res => {
        expect(res.body.success).toBe(true);
      });
  });

  it('POST /auth/register and /auth/login', async () => {
    const email = `e2e_${Date.now()}@marvira.test`;
    const password = 'TestPass123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, name: 'E2E User', password })
      .expect(201)
      .expect(res => {
        expect(res.body.data.tokens.accessToken).toBeDefined();
      });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200)
      .expect(res => {
        expect(res.body.data.tokens.accessToken).toBeDefined();
      });
  });
});

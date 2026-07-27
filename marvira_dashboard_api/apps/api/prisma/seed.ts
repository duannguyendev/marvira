import {
  PrismaClient,
  UserRole,
  AuthProvider,
  EventDifficulty,
  QuestionType,
  QuestionSource,
  ArticleStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log('Seeding database...');

  await ensureAppSettings();

  const adminPasswordHash = await hashPassword('admin123');
  const demoPasswordHash = await hashPassword('demo123');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@marvira.com' },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: 'admin@marvira.com',
      name: 'Admin User',
      passwordHash: adminPasswordHash,
      provider: AuthProvider.LOCAL,
      role: UserRole.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'demo@marvira.com' },
    update: { passwordHash: demoPasswordHash },
    create: {
      email: 'demo@marvira.com',
      name: 'Demo Player',
      passwordHash: demoPasswordHash,
      provider: AuthProvider.LOCAL,
      role: UserRole.USER,
    },
  });

  const staffPasswordHash = await hashPassword('staff123');
  await prisma.user.upsert({
    where: { email: 'staff@marvira.com' },
    update: { passwordHash: staffPasswordHash, role: UserRole.STAFF },
    create: {
      email: 'staff@marvira.com',
      name: 'Staff User',
      passwordHash: staffPasswordHash,
      provider: AuthProvider.LOCAL,
      role: UserRole.STAFF,
    },
  });

  const event = await prisma.event.upsert({
    where: { id: 'seed-event-downtown' },
    update: { language: 'en' },
    create: {
      id: 'seed-event-downtown',
      title: 'Downtown Discovery Hunt',
      description:
        'Explore the historic downtown district and uncover hidden gems through interactive challenges.',
      city: 'San Francisco',
      difficulty: EventDifficulty.MEDIUM,
      rewardPoints: 250,
      isActive: true,
      language: 'en',
      createdBy: admin.id,
      coverImage: null,
    },
  });

  const questionDefs = [
    {
      id: 'seed-question-1',
      question: 'What year was Union Square dedicated?',
      type: QuestionType.TEXT,
      answer: '1850',
      explanation:
        'Union Square was dedicated in 1850 and named for pro-Union rallies.',
      points: 15,
      placeId: 'seed-place-1',
    },
    {
      id: 'seed-question-2',
      question: 'The Ferry Building clock is modeled after which famous tower?',
      type: QuestionType.MULTIPLE_CHOICE,
      options: ['Big Ben', 'Eiffel Tower', 'Leaning Tower', 'CN Tower'],
      answer: 'Big Ben',
      explanation:
        'The clock was inspired by the Giralda tower in Seville, but resembles Big Ben.',
      points: 20,
      placeId: 'seed-place-2',
    },
    {
      id: 'seed-question-3',
      question: 'Coit Tower was built with funds from Lillie Hitchcock Coit.',
      type: QuestionType.TRUE_FALSE,
      options: ['True', 'False'],
      answer: 'True',
      explanation:
        'Lillie Hitchcock Coit left funds to beautify San Francisco.',
      points: 25,
      placeId: 'seed-place-3',
    },
  ];

  const placesData = [
    {
      id: 'seed-place-1',
      title: 'Union Square',
      description: 'The heart of downtown shopping and culture.',
      latitude: 37.7879,
      longitude: -122.4075,
      orderIndex: 0,
      hint: 'Look for the large plaza with palm trees.',
    },
    {
      id: 'seed-place-2',
      title: 'Ferry Building',
      description: 'Historic transit hub turned gourmet marketplace.',
      latitude: 37.7956,
      longitude: -122.3933,
      orderIndex: 1,
      hint: 'Find the clock tower by the bay.',
    },
    {
      id: 'seed-place-3',
      title: 'Coit Tower',
      description: 'Art Deco tower with panoramic city views.',
      latitude: 37.8024,
      longitude: -122.4058,
      orderIndex: 2,
      hint: 'Climb Telegraph Hill to find this landmark.',
    },
  ];

  for (const qDef of questionDefs) {
    const { placeId: _p, ...qData } = qDef;
    await prisma.question.upsert({
      where: { id: qDef.id },
      update: { language: 'en' },
      create: { ...qData, language: 'en' },
    });
    await prisma.eventQuestion.upsert({
      where: {
        eventId_questionId: { eventId: event.id, questionId: qDef.id },
      },
      update: {},
      create: {
        eventId: event.id,
        questionId: qDef.id,
        orderIndex: questionDefs.indexOf(qDef),
      },
    });
  }

  for (const place of placesData) {
    const qDef = questionDefs.find(q => q.placeId === place.id);
    await prisma.place.upsert({
      where: { id: place.id },
      update: { questionId: qDef?.id ?? null },
      create: {
        ...place,
        eventId: event.id,
        radiusMeters: 100,
        questionId: qDef?.id,
      },
    });
  }

  const bridgeQuestion = await prisma.question.upsert({
    where: { id: 'seed-question-bridge' },
    update: { language: 'en' },
    create: {
      id: 'seed-question-bridge',
      question: 'What color is the Golden Gate Bridge officially painted?',
      type: QuestionType.TEXT,
      answer: 'International Orange',
      explanation: 'The official color is International Orange.',
      points: 30,
      language: 'en',
    },
  });

  const event2 = await prisma.event.upsert({
    where: { id: 'seed-event-golden-gate' },
    update: { language: 'en' },
    create: {
      id: 'seed-event-golden-gate',
      title: 'Golden Gate Adventure',
      description: 'A scenic hunt along the iconic Golden Gate Bridge area.',
      city: 'San Francisco',
      difficulty: EventDifficulty.HARD,
      rewardPoints: 400,
      isActive: true,
      language: 'en',
      createdBy: admin.id,
    },
  });

  await prisma.eventQuestion.upsert({
    where: {
      eventId_questionId: { eventId: event2.id, questionId: bridgeQuestion.id },
    },
    update: {},
    create: {
      eventId: event2.id,
      questionId: bridgeQuestion.id,
      orderIndex: 0,
    },
  });

  await prisma.place.upsert({
    where: { id: 'seed-place-golden-gate' },
    update: {},
    create: {
      id: 'seed-place-golden-gate',
      eventId: event2.id,
      title: 'Golden Gate Welcome Center',
      description: 'Start your bridge adventure here.',
      latitude: 37.8078,
      longitude: -122.475,
      orderIndex: 0,
      radiusMeters: 150,
      hint: 'Near the south vista point.',
      questionId: bridgeQuestion.id,
    },
  });

  await prisma.eventQuestion.upsert({
    where: {
      eventId_questionId: { eventId: event2.id, questionId: 'seed-question-1' },
    },
    update: {},
    create: {
      eventId: event2.id,
      questionId: 'seed-question-1',
      orderIndex: 1,
    },
  });

  const demoUser = await prisma.user.findUnique({
    where: { email: 'demo@marvira.com' },
  });

  const communityQuestions = [
    {
      id: 'seed-practice-1',
      question: 'What is the capital of France?',
      type: QuestionType.TEXT,
      answer: 'Paris',
      explanation: 'Paris has been the capital of France since 987 AD.',
      points: 10,
    },
    {
      id: 'seed-practice-2',
      question: 'The Earth is flat.',
      type: QuestionType.TRUE_FALSE,
      answer: 'False',
      points: 5,
    },
    {
      id: 'seed-practice-3',
      question: 'Which planet is known as the Red Planet?',
      type: QuestionType.MULTIPLE_CHOICE,
      options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
      answer: 'Mars',
      points: 10,
    },
    {
      id: 'seed-practice-4',
      question: 'Which San Francisco landmark is shown here?',
      type: QuestionType.IMAGE,
      imageUrl:
        'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
      answer: 'Golden Gate Bridge',
      explanation: 'The Golden Gate Bridge is an icon of San Francisco.',
      points: 15,
    },
  ];

  for (const cq of communityQuestions) {
    await prisma.question.upsert({
      where: { id: cq.id },
      update: {
        source: QuestionSource.COMMUNITY,
        isPublished: true,
        createdBy: admin.id,
        language: 'en',
      },
      create: {
        ...cq,
        source: QuestionSource.COMMUNITY,
        isPublished: true,
        createdBy: admin.id,
        language: 'en',
      },
    });
  }

  if (demoUser) {
    await prisma.userFavoriteEvent.upsert({
      where: {
        userId_eventId: { userId: demoUser.id, eventId: event.id },
      },
      update: {},
      create: { userId: demoUser.id, eventId: event.id },
    });
    await prisma.userFavoriteQuestion.upsert({
      where: {
        userId_questionId: {
          userId: demoUser.id,
          questionId: 'seed-practice-1',
        },
      },
      update: {},
      create: { userId: demoUser.id, questionId: 'seed-practice-1' },
    });
  }

  const articles = [
    {
      id: 'seed-article-downtown',
      title: 'Discover Downtown San Francisco on Foot',
      slug: 'discover-downtown-san-francisco',
      placeName: 'Union Square',
      city: 'San Francisco',
      excerpt:
        'Walk the historic core of San Francisco — from Union Square to the Ferry Building — in a self-guided scavenger hunt built for curious explorers.',
      coverImage:
        'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1600&q=80',
      eventId: 'seed-event-downtown',
      body: [
        '## A city walk that plays like a game',
        '',
        'Downtown San Francisco is packed with landmarks, plazas, and stories hiding in plain sight. This hunt turns a normal afternoon walk into a friendly competition — solve challenges at each stop and climb the leaderboard with your team.',
        '',
        '### What you will explore',
        '',
        '- **Union Square** — the buzzing heart of downtown shopping and culture.',
        '- **The Ferry Building** — a historic transit hub turned gourmet marketplace.',
        '- **Coit Tower** — an Art Deco landmark with panoramic bay views.',
        '',
        '### Who it is for',
        '',
        'Perfect for team offsites, birthdays, first dates, or visitors who want to see the city like a local. No prior knowledge needed — just comfortable shoes and a charged phone.',
        '',
        '> Install Marvira, open this page on your phone, and tap play to begin. Exact answers stay in the app — no spoilers here.',
      ].join('\n'),
    },
    {
      id: 'seed-article-golden-gate',
      title: 'The Golden Gate Adventure',
      slug: 'golden-gate-adventure',
      placeName: 'Golden Gate Bridge',
      city: 'San Francisco',
      excerpt:
        'A scenic, slightly harder hunt along the most photographed bridge in the world. Big views, fresh air, and a challenge for competitive walkers.',
      coverImage:
        'https://images.unsplash.com/photo-1521747116042-5a810fda9664?auto=format&fit=crop&w=1600&q=80',
      eventId: 'seed-event-golden-gate',
      body: [
        '## Wind, views, and a world-famous bridge',
        '',
        'The Golden Gate Adventure is our favorite outdoor route for players who want scenery **and** a challenge. Start near the welcome center, follow the coastal path, and answer clues as you go.',
        '',
        '### Highlights',
        '',
        '1. Sweeping views of the bridge and the bay.',
        '2. Coastal trails with fresh Pacific air.',
        '3. Trickier challenges for experienced hunters.',
        '',
        'Bring a light jacket — it gets breezy out by the water. When you are ready, open Marvira and start from the pinned welcome area.',
      ].join('\n'),
    },
  ];

  for (const article of articles) {
    const { id, ...rest } = article;
    await prisma.article.upsert({
      where: { id },
      update: {
        ...rest,
        status: ArticleStatus.PUBLISHED,
        createdBy: admin.id,
      },
      create: {
        id,
        ...rest,
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(),
        createdBy: admin.id,
      },
    });
  }

  console.log('Seed complete!');
  console.log(`Admin: admin@marvira.com / admin123`);
  console.log(`Staff: staff@marvira.com / staff123`);
  console.log(`Demo user: demo@marvira.com / demo123`);
}

// Ensure default app settings exist (also inserted by migration)
async function ensureAppSettings() {
  await prisma.appSetting.upsert({
    where: { key: 'event_live_duration_days' },
    update: {},
    create: {
      key: 'event_live_duration_days',
      value: '2',
    },
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

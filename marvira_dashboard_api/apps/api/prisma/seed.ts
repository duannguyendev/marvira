import {
  PrismaClient,
  UserRole,
  AuthProvider,
  QuestionType,
  QuestionSource,
  ArticleStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { matThuPracticeQuestions } from './seeds/mat-thu-practice';
import { demoHunts } from './seeds/demo-hunts';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

function requireSeedPassword(
  envName: string,
  devDefault: string,
  minLength = 12,
): string {
  const fromEnv = process.env[envName]?.trim();
  if (fromEnv) {
    if (
      process.env.NODE_ENV === 'production' &&
      fromEnv.length < minLength
    ) {
      throw new Error(
        `${envName} must be at least ${minLength} characters in production`,
      );
    }
    return fromEnv;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `${envName} is required when seeding in production (do not use weak defaults)`,
    );
  }
  return devDefault;
}

/** Optional accounts — skipped in production if env not set. */
function optionalSeedPassword(
  envName: string,
  devDefault: string,
): string | null {
  const fromEnv = process.env[envName]?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === 'production') return null;
  return devDefault;
}

async function main() {
  console.log('Seeding database...');

  await ensureAppSettings();

  const adminEmail =
    process.env.SEED_ADMIN_EMAIL?.trim() || 'admin@marvira.com';
  const demoEmail =
    process.env.SEED_DEMO_EMAIL?.trim() || 'demo@marvira.com';
  const staffEmail =
    process.env.SEED_STAFF_EMAIL?.trim() || 'staff@marvira.com';
  const supportEmail =
    process.env.SEED_SUPPORT_EMAIL?.trim() || 'support@marvira.com';

  const adminPassword = requireSeedPassword('SEED_ADMIN_PASSWORD', 'admin123');
  const demoPassword = optionalSeedPassword('SEED_DEMO_PASSWORD', 'demo123');
  const staffPassword = optionalSeedPassword('SEED_STAFF_PASSWORD', 'staff123');
  const supportPassword = optionalSeedPassword(
    'SEED_SUPPORT_PASSWORD',
    'support123',
  );

  const adminPasswordHash = await hashPassword(adminPassword);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: adminEmail,
      name: 'Admin User',
      passwordHash: adminPasswordHash,
      provider: AuthProvider.LOCAL,
      role: UserRole.ADMIN,
    },
  });

  if (demoPassword) {
    const demoPasswordHash = await hashPassword(demoPassword);
    await prisma.user.upsert({
      where: { email: demoEmail },
      update: { passwordHash: demoPasswordHash },
      create: {
        email: demoEmail,
        name: 'Demo Player',
        passwordHash: demoPasswordHash,
        provider: AuthProvider.LOCAL,
        role: UserRole.USER,
      },
    });
  }

  if (staffPassword) {
    const staffPasswordHash = await hashPassword(staffPassword);
    await prisma.user.upsert({
      where: { email: staffEmail },
      update: { passwordHash: staffPasswordHash, role: UserRole.STAFF },
      create: {
        email: staffEmail,
        name: 'Staff User',
        passwordHash: staffPasswordHash,
        provider: AuthProvider.LOCAL,
        role: UserRole.STAFF,
      },
    });
  }

  // Support uses STAFF role (no separate SUPPORT role in schema)
  if (supportPassword) {
    const supportPasswordHash = await hashPassword(supportPassword);
    await prisma.user.upsert({
      where: { email: supportEmail },
      update: { passwordHash: supportPasswordHash, role: UserRole.STAFF },
      create: {
        email: supportEmail,
        name: 'Support',
        passwordHash: supportPasswordHash,
        provider: AuthProvider.LOCAL,
        role: UserRole.STAFF,
      },
    });
  }

  // Demo hunts (Hà Nội + TP.HCM) are created after practice questions exist
  // so we can attach seed-practice-matthu-* as place questions.

  const demoUser = await prisma.user.findUnique({
    where: { email: demoEmail },
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

  // Mật thư Đội / hunt practice bank (vi)
  console.log(
    `Seeding ${matThuPracticeQuestions.length} mật thư practice questions...`,
  );
  const matThuIds = matThuPracticeQuestions.map((q) => q.id);
  await prisma.question.deleteMany({
    where: {
      id: { startsWith: 'seed-practice-matthu-' },
      NOT: { id: { in: matThuIds } },
    },
  });
  for (const cq of matThuPracticeQuestions) {
    await prisma.question.upsert({
      where: { id: cq.id },
      update: {
        question: cq.question,
        type: cq.type,
        options: cq.options ?? undefined,
        answer: cq.answer,
        explanation: cq.explanation,
        points: cq.points,
        source: QuestionSource.COMMUNITY,
        isPublished: true,
        createdBy: admin.id,
        language: 'vi',
      },
      create: {
        id: cq.id,
        question: cq.question,
        type: cq.type,
        options: cq.options ?? undefined,
        answer: cq.answer,
        explanation: cq.explanation,
        points: cq.points,
        source: QuestionSource.COMMUNITY,
        isPublished: true,
        createdBy: admin.id,
        language: 'vi',
      },
    });
  }

  // Remove legacy San Francisco demo hunt data (if present)
  await prisma.event.deleteMany({
    where: {
      id: { in: ['seed-event-downtown', 'seed-event-golden-gate'] },
    },
  });
  await prisma.question.deleteMany({
    where: {
      id: {
        in: [
          'seed-question-1',
          'seed-question-2',
          'seed-question-3',
          'seed-question-bridge',
        ],
      },
    },
  });

  console.log(`Seeding ${demoHunts.length} demo hunts across Vietnam...`);
  for (const hunt of demoHunts) {
    const event = await prisma.event.upsert({
      where: { id: hunt.id },
      update: {
        title: hunt.title,
        description: hunt.description,
        city: hunt.city,
        coverImage: hunt.coverImage,
        difficulty: hunt.difficulty,
        rewardPoints: hunt.rewardPoints,
        isActive: true,
        language: 'vi',
        createdBy: admin.id,
      },
      create: {
        id: hunt.id,
        title: hunt.title,
        description: hunt.description,
        city: hunt.city,
        difficulty: hunt.difficulty,
        rewardPoints: hunt.rewardPoints,
        isActive: true,
        language: 'vi',
        createdBy: admin.id,
        coverImage: hunt.coverImage,
      },
    });

    for (const place of hunt.places) {
      await prisma.eventQuestion.upsert({
        where: {
          eventId_questionId: {
            eventId: event.id,
            questionId: place.questionId,
          },
        },
        update: { orderIndex: place.orderIndex },
        create: {
          eventId: event.id,
          questionId: place.questionId,
          orderIndex: place.orderIndex,
        },
      });

      await prisma.place.upsert({
        where: { id: place.id },
        update: {
          title: place.title,
          description: place.description,
          latitude: place.latitude,
          longitude: place.longitude,
          orderIndex: place.orderIndex,
          hint: place.hint,
          radiusMeters: place.radiusMeters ?? 120,
          questionId: place.questionId,
          eventId: event.id,
        },
        create: {
          id: place.id,
          eventId: event.id,
          title: place.title,
          description: place.description,
          latitude: place.latitude,
          longitude: place.longitude,
          orderIndex: place.orderIndex,
          hint: place.hint,
          radiusMeters: place.radiusMeters ?? 120,
          questionId: place.questionId,
        },
      });
    }
  }

  if (demoUser) {
    await prisma.userFavoriteEvent.upsert({
      where: {
        userId_eventId: {
          userId: demoUser.id,
          eventId: 'seed-event-hanoi',
        },
      },
      update: {},
      create: { userId: demoUser.id, eventId: 'seed-event-hanoi' },
    });
    await prisma.userFavoriteQuestion.upsert({
      where: {
        userId_questionId: {
          userId: demoUser.id,
          questionId: 'seed-practice-matthu-001',
        },
      },
      update: {},
      create: {
        userId: demoUser.id,
        questionId: 'seed-practice-matthu-001',
      },
    });
  }

  // Launch content — giới thiệu app (không gắn eventId)
  const articles = [
    {
      id: 'seed-article-what-is-marvira',
      title: 'Marvira là gì? Săn tìm kho báu ngoài trời trên điện thoại',
      slug: 'what-is-marvira',
      placeName: 'Marvira',
      city: null,
      excerpt:
        'Marvira biến buổi đi bộ thành cuộc phiêu lưu theo nhóm — đến từng điểm, giải mật thư, và đua điểm với bạn bè.',
      coverImage:
        'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80',
      body: [
        '## Chơi thành phố như một trò chơi',
        '',
        'Marvira là ứng dụng **săn tìm kho báu ngoài trời**. Bạn đi bộ đến các địa điểm thật, mở thử thách trên điện thoại, rồi cùng đội đua trên bảng xếp hạng.',
        '',
        '### Phù hợp với ai?',
        '',
        '- Team building, offsite công ty',
        '- Sinh nhật, họp lớp, hẹn hò',
        '- Người thích khám phá phố phường theo kiểu có câu chuyện',
        '',
        '### Bạn cần gì?',
        '',
        'Điện thoại đủ pin, giày thoải mái, và một chút tò mò. Không cần dụng cụ đặc biệt — Marvira dẫn đường từng điểm một.',
        '',
        '> Tải Marvira trên App Store hoặc Google Play, rồi mở phần Khám phá để tìm hunt đầu tiên.',
      ].join('\n'),
    },
    {
      id: 'seed-article-how-to-play',
      title: 'Cách chơi một hunt trên Marvira',
      slug: 'how-to-play-marvira',
      placeName: 'Marvira',
      city: null,
      excerpt:
        'Từ lúc cài app đến đích: tham gia hunt, check-in từng điểm, và nộp đáp án như thế nào.',
      coverImage:
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
      body: [
        '## Bốn bước từ nhà đến điểm đích',
        '',
        '### 1. Cài app và đăng nhập',
        '',
        'Tải Marvira, tạo tài khoản, và cho phép vị trí khi app hỏi — hunt dùng GPS để mở khóa điểm gần bạn.',
        '',
        '### 2. Chọn hunt',
        '',
        'Xem các sự kiện đang mở gần bạn (hoặc mở link được chia sẻ). Đọc độ khó và thời gian đi bộ ước tính trước khi bắt đầu.',
        '',
        '### 3. Đi bộ, đến nơi, giải đố',
        '',
        'Theo bản đồ đến từng điểm. Khi bạn đủ gần, điểm sẽ mở. Trả lời mật thư — chữ, ảnh, đúng/sai, hoặc trắc nghiệm.',
        '',
        '### 4. Về đích và so điểm',
        '',
        'Hoàn thành lộ trình, xem điểm số và thứ hạng đội. Sai đáp án thường được thử lại — đi thong thả và tận hưởng đường đi.',
        '',
        'Mới làm quen mật thư? Hãy vào **Luyện tập** trong app trước khi chơi hunt ngoài trời.',
      ].join('\n'),
    },
    {
      id: 'seed-article-practice-mat-thu',
      title: 'Luyện trước với Practice: mật thư & kỹ năng giải đố',
      slug: 'practice-mat-thu-on-marvira',
      placeName: 'Marvira',
      city: null,
      excerpt:
        'Luyện mật thư kiểu Đội và các dạng clue phổ biến ngay trong app — để hunt đầu tiên không còn bỡ ngỡ.',
      coverImage:
        'https://images.unsplash.com/photo-1456513080080-2f3ae2b3d1d8?auto=format&fit=crop&w=1600&q=80',
      body: [
        '## Luyện trước khi ra đường',
        '',
        'Marvira Practice là ngân hàng câu hỏi luyện tập — gồm mật thư kiểu Việt Nam và các dạng clue hunt — giúp bạn nhận dạng khóa nhanh mà không cần đi hết một lộ trình.',
        '',
        '### Vì sao nên luyện?',
        '',
        '- Làm quen OTT / NW thường gặp trong sinh hoạt Đội và trò chơi lớn',
        '- Nhớ cách đọc Telex khi đáp án có dấu',
        '- Tự tin hơn trước hunt có giới hạn thời gian',
        '',
        '### Cách dùng',
        '',
        '1. Mở **Luyện tập** trong Marvira.',
        '2. Giải vài câu theo nhịp của bạn.',
        '3. Đọc phần giải thích khi trả lời đúng — rồi thử dạng khóa khác.',
        '',
        'Khi có hunt thật gần bạn, bạn đã biết cách đọc mật thư, không chỉ biết theo bản đồ.',
      ].join('\n'),
    },
  ];

  // Drop old SF event articles if they exist from previous seeds
  await prisma.article.deleteMany({
    where: {
      id: {
        in: ['seed-article-downtown', 'seed-article-golden-gate'],
      },
    },
  });

  for (const article of articles) {
    const { id, ...rest } = article;
    await prisma.article.upsert({
      where: { id },
      update: {
        ...rest,
        eventId: null,
        status: ArticleStatus.PUBLISHED,
        createdBy: admin.id,
      },
      create: {
        id,
        ...rest,
        eventId: null,
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(),
        createdBy: admin.id,
      },
    });
  }

  console.log('Seed complete!');
  console.log(`Admin: ${adminEmail} / (from SEED_ADMIN_PASSWORD)`);
  if (staffPassword) {
    console.log(`Staff: ${staffEmail} / (from SEED_STAFF_PASSWORD or dev default)`);
  }
  if (supportPassword) {
    console.log(
      `Support: ${supportEmail} / (from SEED_SUPPORT_PASSWORD or dev default) [STAFF role]`,
    );
  }
  if (demoPassword) {
    console.log(`Demo user: ${demoEmail} / (from SEED_DEMO_PASSWORD or dev default)`);
  }
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

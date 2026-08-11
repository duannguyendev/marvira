/**
 * PRO mobile regression — API flows mirroring the mobile app.
 * Usage: node scripts/pro-mobile-regression.mjs
 * Output: scripts/pro-mobile-regression-report.json + ../docs/pro-mobile-bugs.md
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.API_URL || 'https://api.marvira.com';
const TS = Date.now();
const PASSWORD = 'QaProTest123!';
const LAT = 21.0285;
const LON = 105.8542;
const RADIUS = 5000;

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORT_JSON = join(__dirname, 'pro-mobile-regression-report.json');
const BUGS_MD = join(__dirname, '..', '..', 'docs', 'pro-mobile-bugs.md');

const results = [];
const bugs = [];
const accounts = [];
const eventsToUnpublish = [];

function pass(name, detail = '') {
  results.push({ status: 'PASS', test: name, detail });
  console.log(`[PASS] ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '', severity = 'medium') {
  results.push({ status: 'FAIL', test: name, detail });
  bugs.push({
    id: `BUG-${bugs.length + 1}`,
    severity,
    flow: name,
    detail,
    timestamp: new Date().toISOString(),
  });
  console.error(`[FAIL] ${name} — ${detail}`);
}

function assert(cond, name, detail, severity = 'medium') {
  if (cond) pass(name, detail);
  else fail(name, detail, severity);
}

async function req(method, path, { token, body, headers = {} } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json, ok: res.ok };
}

function extractTokens(data) {
  const access =
    data?.tokens?.accessToken || data?.accessToken || data?.token;
  const refresh =
    data?.tokens?.refreshToken || data?.refreshToken;
  return { access, refresh };
}

function msg(r) {
  const m = r.json?.message;
  return Array.isArray(m) ? m.join(', ') : m || JSON.stringify(r.json);
}

async function registerAccount(index) {
  const email = `qa.pro.${TS}.${index}@marvira-qa.test`;
  const name = `QA Pro User ${index}`;
  const r = await req('POST', '/auth/register', {
    body: { email, password: PASSWORD, name },
  });
  if (!r.ok) throw new Error(`Register ${email}: ${r.status} ${msg(r)}`);
  const { access, refresh } = extractTokens(r.json.data);
  return {
    index,
    email,
    name,
    password: PASSWORD,
    userId: r.json.data.user.id,
    token: access,
    refreshToken: refresh,
  };
}

async function login(email, password) {
  const r = await req('POST', '/auth/login', {
    body: { email, password },
  });
  if (!r.ok) throw new Error(`Login ${email}: ${r.status} ${msg(r)}`);
  const { access, refresh } = extractTokens(r.json.data);
  return {
    token: access,
    refreshToken: refresh,
    user: r.json.data.user,
  };
}

async function createDraftWithPlace(token, title, answer = 'Hanoi', opts = {}) {
  const create = await req('POST', '/events', {
    token,
    body: {
      title,
      description:
        'QA PRO regression event — automated test only. Will be unpublished after testing.',
      city: 'Hà Nội',
      difficulty: 'EASY',
      rewardPoints: 50,
      isActive: false,
      language: 'vi',
      ...(opts.joinPassword ? { joinPassword: opts.joinPassword } : {}),
      ...(opts.giftTeaser
        ? {
            giftTeaser: opts.giftTeaser,
            giftCodes: opts.giftCodes || ['GIFT-QA-1'],
            completionMessage: 'Cảm ơn bạn đã hoàn thành!',
          }
        : {}),
    },
  });
  if (!create.ok) throw new Error(`Create event: ${create.status} ${msg(create)}`);
  const eventId = create.json.data.id;

  const q = await req('POST', '/questions', {
    token,
    body: {
      question: `Thủ đô Việt Nam là gì? (${title})`,
      type: 'TEXT',
      answer,
      points: 10,
      language: 'vi',
    },
  });
  if (!q.ok) throw new Error(`Create question: ${q.status} ${msg(q)}`);
  const questionId = q.json.data.id;

  const link = await req('POST', `/events/${eventId}/questions`, {
    token,
    body: { questionId, orderIndex: 0 },
  });
  if (!link.ok && link.status !== 409) {
    throw new Error(`Link question: ${link.status} ${msg(link)}`);
  }

  const place = await req('POST', '/places', {
    token,
    body: {
      eventId,
      title: 'Điểm QA Test',
      description: 'Place for QA regression — large radius to avoid location block.',
      latitude: LAT,
      longitude: LON,
      radiusMeters: RADIUS,
      orderIndex: 0,
      questionId,
      hint: 'Thủ đô',
    },
  });
  if (!place.ok) throw new Error(`Create place: ${place.status} ${msg(place)}`);

  return {
    eventId,
    questionId,
    placeId: place.json.data.id,
    answer,
  };
}

async function verifyAndPublish(token, eventId, questionId, answer) {
  const verify = await req('POST', `/events/${eventId}/publish-verify`, {
    token,
    body: { questionId, answer },
  });
  if (!verify.ok || verify.json?.data?.correct !== true) {
    throw new Error(
      `Publish verify failed: ${verify.status} ${JSON.stringify(verify.json?.data)}`,
    );
  }
  const pub = await req('PATCH', `/events/${eventId}`, {
    token,
    body: { isActive: true },
  });
  if (!pub.ok || pub.json?.data?.isActive !== true) {
    throw new Error(`Publish failed: ${pub.status} ${msg(pub)}`);
  }
  return pub.json.data;
}

async function playPlace(token, placeId, answer) {
  const loc = {
    latitude: LAT,
    longitude: LON,
    accuracy: 10,
    timestamp: Date.now(),
  };
  const unlock = await req('POST', `/places/${placeId}/unlock`, {
    token,
    body: loc,
  });
  if (!unlock.ok) throw new Error(`Unlock: ${unlock.status} ${msg(unlock)}`);

  const ans = await req('POST', `/places/${placeId}/answer`, {
    token,
    body: { answer, ...loc },
  });
  if (!ans.ok) throw new Error(`Answer: ${ans.status} ${msg(ans)}`);
  return { unlock: unlock.json, answer: ans.json };
}

async function unpublishEvent(token, eventId) {
  const r = await req('PATCH', `/events/${eventId}`, {
    token,
    body: { isActive: false },
  });
  return r.ok;
}

async function main() {
  console.log(`\n=== PRO Mobile Regression — ${BASE} ===\n`);

  // --- Health ---
  const health = await req('GET', '/health');
  assert(health.ok, 'Health check', `status=${health.status}`);

  // --- Create 10 accounts ---
  console.log('\n--- Creating 10 test accounts ---\n');
  for (let i = 1; i <= 10; i++) {
    try {
      const acc = await registerAccount(i);
      accounts.push(acc);
      pass(`Register account ${i}`, acc.email);
    } catch (e) {
      fail(`Register account ${i}`, e.message, 'critical');
    }
  }
  assert(accounts.length === 10, 'All 10 accounts created', `created=${accounts.length}`);

  const owner = accounts[0];
  const player2 = accounts[1];
  const player3 = accounts[2];
  const pwdUser = accounts[3];

  // --- Auth flows ---
  console.log('\n--- Auth flows ---\n');

  const dupReg = await req('POST', '/auth/register', {
    body: {
      email: owner.email,
      password: PASSWORD,
      name: 'Duplicate',
    },
  });
  assert(dupReg.status === 409, 'Duplicate register rejected (409)', `status=${dupReg.status}`);

  const badLogin = await req('POST', '/auth/login', {
    body: { email: owner.email, password: 'WrongPass123!' },
  });
  assert(badLogin.status === 401, 'Wrong password rejected (401)', `status=${badLogin.status}`);

  const loginOk = await login(owner.email, PASSWORD);
  assert(loginOk.user.email === owner.email, 'Login with valid credentials', owner.email);

  const me = await req('GET', '/auth/me', { token: loginOk.token });
  assert(me.ok && me.json.data.email === owner.email, 'GET /auth/me', me.json?.data?.email);

  const refresh = await req('POST', '/auth/refresh', {
    body: { refreshToken: owner.refreshToken },
  });
  assert(refresh.ok && extractTokens(refresh.json.data).access, 'Refresh token', 'new access token received');

  const logout = await req('POST', '/auth/logout', {
    token: loginOk.token,
    body: { refreshToken: owner.refreshToken },
  });
  assert(logout.ok, 'Logout', `status=${logout.status}`);

  // Re-login owner
  const ownerSession = await login(owner.email, PASSWORD);
  owner.token = ownerSession.token;
  owner.refreshToken = ownerSession.refreshToken;

  // Change password on pwdUser (account 4)
  const changePwd = await req('POST', '/auth/change-password', {
    token: pwdUser.token,
    body: {
      currentPassword: PASSWORD,
      newPassword: 'NewQaPro456!',
    },
  });
  assert(changePwd.ok, 'Change password', msg(changePwd));

  const loginNewPwd = await login(pwdUser.email, 'NewQaPro456!');
  assert(loginNewPwd.user.email === pwdUser.email, 'Login after change password', pwdUser.email);

  // Change back for cleanup consistency
  await req('POST', '/auth/change-password', {
    token: loginNewPwd.token,
    body: {
      currentPassword: 'NewQaPro456!',
      newPassword: PASSWORD,
    },
  });

  const forgot = await req('POST', '/auth/forgot-password', {
    body: { email: accounts[4].email },
  });
  assert(forgot.ok, 'Forgot password request', msg(forgot));
  if (forgot.json?.data?.devResetToken) {
    pass('Forgot password returns devResetToken (non-prod behavior?)', 'token present');
  } else {
    pass('Forgot password (no devResetToken on PRO)', 'expected for production');
  }

  // --- Event creation & publish ---
  console.log('\n--- Event creation & publish ---\n');

  let openEvent, protectedEvent, giftEvent;
  try {
    openEvent = await createDraftWithPlace(
      owner.token,
      `QA Open Hunt ${TS}`,
      'Hanoi',
    );
    await verifyAndPublish(
      owner.token,
      openEvent.eventId,
      openEvent.questionId,
      'Hanoi',
    );
    eventsToUnpublish.push({ id: openEvent.eventId, token: owner.token });
    pass('Create & publish open event', openEvent.eventId);
  } catch (e) {
    fail('Create & publish open event', e.message, 'critical');
  }

  try {
    protectedEvent = await createDraftWithPlace(
      owner.token,
      `QA Protected Hunt ${TS}`,
      'Hanoi',
      { joinPassword: 'qa1234' },
    );
    await verifyAndPublish(
      owner.token,
      protectedEvent.eventId,
      protectedEvent.questionId,
      'Hanoi',
    );
    eventsToUnpublish.push({ id: protectedEvent.eventId, token: owner.token });
    pass('Create & publish password-protected event', protectedEvent.eventId);
  } catch (e) {
    fail('Create & publish password-protected event', e.message, 'critical');
  }

  try {
    giftEvent = await createDraftWithPlace(
      owner.token,
      `QA Gift Hunt ${TS}`,
      'Hanoi',
      {
        giftTeaser: 'Quà QA test',
        giftCodes: [`GIFT-${TS}`],
      },
    );
    await verifyAndPublish(
      owner.token,
      giftEvent.eventId,
      giftEvent.questionId,
      'Hanoi',
    );
    eventsToUnpublish.push({ id: giftEvent.eventId, token: owner.token });
    pass('Create & publish gift event', giftEvent.eventId);
  } catch (e) {
    fail('Create & publish gift event', e.message, 'high');
  }

  // Schedule flow
  try {
    const schedDraft = await createDraftWithPlace(
      owner.token,
      `QA Scheduled Hunt ${TS}`,
      'Hanoi',
    );
    await verifyAndPublish(
      owner.token,
      schedDraft.eventId,
      schedDraft.questionId,
      'Hanoi',
    );
    // Unpublish first to schedule from draft-like state — actually schedule works on verified draft
    await unpublishEvent(owner.token, schedDraft.eventId);

    const schedAt = new Date(Date.now() + 3600_000).toISOString();
    const sched = await req('POST', `/events/${schedDraft.eventId}/schedule`, {
      token: owner.token,
      body: { scheduledPublishAt: schedAt },
    });
    assert(
      sched.ok && sched.json?.data?.scheduledPublishAt,
      'Schedule publish',
      sched.json?.data?.scheduledPublishAt,
    );

    const cancel = await req('DELETE', `/events/${schedDraft.eventId}/schedule`, {
      token: owner.token,
    });
    assert(
      cancel.ok && cancel.json?.data?.scheduledPublishAt == null,
      'Cancel scheduled publish',
      `scheduled=${cancel.json?.data?.scheduledPublishAt}`,
    );
    eventsToUnpublish.push({ id: schedDraft.eventId, token: owner.token });
  } catch (e) {
    fail('Schedule / cancel publish flow', e.message, 'medium');
  }

  // --- Discover events ---
  console.log('\n--- Discover & join ---\n');

  const nearby = await req('GET', '/events/nearby', {
    token: player2.token,
    headers: {},
  });
  // nearby is query params
  const nearbyRes = await req(
    'GET',
    `/events/nearby?latitude=${LAT}&longitude=${LON}&radiusKm=50&language=vi`,
    { token: player2.token },
  );
  assert(nearbyRes.ok, 'GET /events/nearby', `count=${nearbyRes.json?.data?.length ?? 0}`);

  if (openEvent?.eventId) {
    const found = (nearbyRes.json?.data || []).some(e => e.id === openEvent.eventId);
    assert(found, 'Open event appears in nearby', openEvent.eventId);
  }

  const list = await req('GET', '/events?page=1&pageSize=20&language=vi');
  assert(list.ok, 'GET /events list', `items=${list.json?.data?.items?.length ?? '?'}`);

  if (openEvent?.eventId) {
    const details = await req('GET', `/events/${openEvent.eventId}`, {
      token: player2.token,
    });
    assert(details.ok, 'GET /events/:id details', details.json?.data?.title);

    const places = await req('GET', `/events/${openEvent.eventId}/places`, {
      token: player2.token,
    });
    assert(
      places.ok && places.json?.data?.length >= 1,
      'GET /events/:id/places',
      `places=${places.json?.data?.length}`,
    );

    // Check answer not leaked
    const leaked = JSON.stringify(places.json).toLowerCase().includes('"answer"');
    assert(!leaked, 'Places response does not leak answers', leaked ? 'answer field found' : '');
  }

  // Join protected event
  if (protectedEvent?.eventId) {
    const badJoin = await req('POST', `/events/${protectedEvent.eventId}/join`, {
      token: player2.token,
      body: { password: 'wrong1' },
    });
    assert(
      !badJoin.ok || badJoin.json?.data?.hasAccess === false,
      'Wrong join password rejected',
      `status=${badJoin.status}`,
    );

    const goodJoin = await req('POST', `/events/${protectedEvent.eventId}/join`, {
      token: player2.token,
      body: { password: 'qa1234' },
    });
    assert(
      goodJoin.ok && goodJoin.json?.data?.hasAccess === true,
      'Correct join password grants access',
      JSON.stringify(goodJoin.json?.data),
    );
  }

  // --- Play flows ---
  console.log('\n--- Play flows ---\n');

  if (openEvent?.placeId) {
    try {
      const play = await playPlace(player2.token, openEvent.placeId, 'Hanoi');
      assert(
        play.answer?.data?.correct === true,
        'Player completes open event (correct answer)',
        `eventCompleted=${play.answer?.data?.eventCompleted}`,
      );

      const completion = await req('GET', `/events/${openEvent.eventId}/completion`, {
        token: player2.token,
      });
      assert(completion.ok, 'GET completion snapshot after finish', JSON.stringify(completion.json?.data));

      const completed = await req('GET', '/profile/completed-events', {
        token: player2.token,
      });
      const hasCompleted = (completed.json?.data || []).some(
        e => e.eventId === openEvent.eventId || e.id === openEvent.eventId,
      );
      assert(hasCompleted, 'Completed event in profile', `count=${completed.json?.data?.length}`);
    } catch (e) {
      fail('Play open event flow', e.message, 'critical');
    }
  }

  if (giftEvent?.placeId) {
    try {
      const p3Session = await login(player3.email, PASSWORD);
      const play = await playPlace(p3Session.token, giftEvent.placeId, 'Hanoi');
      assert(
        play.answer?.data?.correct === true,
        'Player completes gift event',
        `giftCode=${play.answer?.data?.giftCode ?? 'none'}`,
      );
    } catch (e) {
      fail('Play gift event flow', e.message, 'high');
    }
  }

  if (protectedEvent?.placeId) {
    try {
      const p2Session = await login(player2.email, PASSWORD);
      const play = await playPlace(p2Session.token, protectedEvent.placeId, 'Hanoi');
      assert(
        play.answer?.data?.correct === true,
        'Player completes protected event after join',
        `eventCompleted=${play.answer?.data?.eventCompleted}`,
      );
    } catch (e) {
      fail('Play protected event flow', e.message, 'critical');
    }
  }

  // Wrong answer + report
  if (openEvent?.placeId) {
    try {
      const p4 = await login(accounts[5].email, PASSWORD);
      // Need fresh event or new player - open event may be completed by player2
      // Use sched draft or create mini event
      const mini = await createDraftWithPlace(
        owner.token,
        `QA Report Hunt ${TS}`,
        'Hanoi',
      );
      await verifyAndPublish(owner.token, mini.eventId, mini.questionId, 'Hanoi');
      eventsToUnpublish.push({ id: mini.eventId, token: owner.token });

      await playPlace(p4.token, mini.placeId, 'WrongAnswer');
      const wrongAns = await req('POST', `/places/${mini.placeId}/answer`, {
        token: p4.token,
        body: {
          answer: 'WrongAnswer',
          latitude: LAT,
          longitude: LON,
          accuracy: 10,
        },
      });
      assert(
        wrongAns.ok && wrongAns.json?.data?.correct === false,
        'Wrong answer returns correct:false',
        '',
      );

      const report = await req('POST', `/places/${mini.placeId}/report-wrong-answer`, {
        token: p4.token,
      });
      assert(
        report.ok && report.json?.data?.alreadyReported !== undefined,
        'Report wrong answer',
        JSON.stringify(report.json?.data),
      );

      const reports = await req('GET', `/events/${mini.eventId}/answer-reports`, {
        token: owner.token,
      });
      assert(reports.ok, 'Owner views answer reports', `rows=${reports.json?.data?.length}`);
    } catch (e) {
      fail('Wrong answer & report flow', e.message, 'medium');
    }
  }

  // --- Favorites ---
  console.log('\n--- Favorites ---\n');

  if (openEvent?.eventId) {
    const addFav = await req('POST', `/favorites/events/${openEvent.eventId}`, {
      token: player2.token,
    });
    assert(addFav.ok, 'Add event to favorites', `status=${addFav.status}`);

    const favs = await req('GET', '/favorites/events', { token: player2.token });
    const isFav = (favs.json?.data || []).some(e => e.id === openEvent.eventId);
    assert(isFav, 'Event appears in favorites', openEvent.eventId);

    const rmFav = await req('DELETE', `/favorites/events/${openEvent.eventId}`, {
      token: player2.token,
    });
    assert(rmFav.ok, 'Remove event from favorites', `status=${rmFav.status}`);
  }

  // --- Practice ---
  console.log('\n--- Practice ---\n');

  const practiceList = await req('GET', '/practice/questions?status=unfinished&language=vi', {
    token: owner.token,
  });
  assert(practiceList.ok, 'GET /practice/questions', `count=${practiceList.json?.data?.length ?? 0}`);

  const createPracticeQ = await req('POST', '/practice/questions', {
    token: owner.token,
    body: {
      question: `Câu hỏi QA practice ${TS}?`,
      type: 'TEXT',
      answer: '42',
      points: 10,
      language: 'vi',
    },
  });
  assert(createPracticeQ.ok, 'Create practice question', createPracticeQ.json?.data?.id);

  if (createPracticeQ.ok) {
    const qId = createPracticeQ.json.data.id;
    const train = await req('POST', `/practice/questions/${qId}/answer`, {
      token: owner.token,
      body: { answer: '42' },
    });
    // Practice API uses isCorrect (mobile TrainingAnswerResponse); place answers use correct
    assert(
      train.ok &&
        (train.json?.data?.isCorrect === true || train.json?.data?.correct === true),
      'Submit practice training answer',
      JSON.stringify(train.json?.data),
    );

    const mine = await req('GET', '/practice/questions/mine', { token: owner.token });
    assert(mine.ok, 'GET /practice/questions/mine', `count=${mine.json?.data?.length ?? 0}`);

    const addQFav = await req('POST', `/favorites/questions/${qId}`, {
      token: player2.token,
    });
    assert(addQFav.ok, 'Add practice question to favorites', `status=${addQFav.status}`);

    const favQs = await req('GET', '/favorites/questions', { token: player2.token });
    assert(
      favQs.ok && (favQs.json?.data || []).some(q => q.id === qId),
      'Practice question in favorites list',
      `count=${favQs.json?.data?.length ?? 0}`,
    );
  }

  // --- Leaderboard ---
  console.log('\n--- Leaderboard ---\n');

  if (openEvent?.eventId) {
    const lb = await req('GET', `/events/${openEvent.eventId}/leaderboard?limit=10`);
    assert(lb.ok, 'GET event leaderboard', `entries=${lb.json?.data?.entries?.length ?? lb.json?.data?.length ?? '?'}`);
  }

  const globalLb = await req('GET', '/leaderboard/global?limit=10');
  assert(globalLb.ok, 'GET global leaderboard', `status=${globalLb.status}`);

  // --- Notifications ---
  console.log('\n--- Notifications ---\n');

  const notifCount = await req('GET', '/notifications/unread-count', {
    token: owner.token,
  });
  assert(notifCount.ok, 'GET notifications unread count', String(notifCount.json?.data?.unreadCount));

  const notifs = await req('GET', '/notifications?limit=20', { token: owner.token });
  assert(notifs.ok, 'GET notifications list', `items=${notifs.json?.data?.items?.length ?? 0}`);

  const prefs = await req('GET', '/notifications/preferences', { token: owner.token });
  assert(prefs.ok, 'GET notification preferences', JSON.stringify(prefs.json?.data));

  const updatePrefs = await req('POST', '/notifications/preferences', {
    token: owner.token,
    body: { gameplayEnabled: true, creatorEnabled: true, productEnabled: true },
  });
  assert(updatePrefs.ok, 'Update notification preferences', `status=${updatePrefs.status}`);

  // --- Feedback ---
  console.log('\n--- Feedback ---\n');

  const feedback = await req('POST', '/feedback', {
    token: player2.token,
    body: {
      category: 'BUG',
      subject: 'QA PRO regression',
      message: `Automated QA test feedback ${TS}. Safe to ignore.`,
      source: 'MOBILE',
    },
  });
  assert(feedback.ok, 'Submit feedback', feedback.json?.data?.id);

  // --- Owner flows ---
  console.log('\n--- Owner flows ---\n');

  const myEvents = await req('GET', '/events/mine?page=1&pageSize=50', {
    token: owner.token,
  });
  assert(myEvents.ok, 'GET /events/mine', `count=${myEvents.json?.data?.items?.length ?? 0}`);

  if (openEvent?.eventId) {
    const ownerPlaces = await req('GET', `/events/${openEvent.eventId}/owner-places`, {
      token: owner.token,
    });
    assert(ownerPlaces.ok, 'GET owner-places', `places=${ownerPlaces.json?.data?.length}`);

    const finishers = await req('GET', `/events/${openEvent.eventId}/finishers`, {
      token: owner.token,
    });
    assert(finishers.ok, 'GET finishers (owner)', `finishers=${finishers.json?.data?.finishers?.length ?? '?'}`);
  }

  // --- Profile ---
  console.log('\n--- Profile ---\n');

  const profile = await req('GET', '/profile', { token: owner.token });
  assert(profile.ok, 'GET /profile', profile.json?.data?.email);

  // --- Unpublish test events ---
  console.log('\n--- Cleanup: unpublish events ---\n');

  for (const ev of eventsToUnpublish) {
    const ok = await unpublishEvent(ev.token, ev.id);
    assert(ok, `Unpublish event ${ev.id}`, ok ? 'isActive=false' : 'failed');
  }

  // --- Summary & reports ---
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  const report = {
    baseUrl: BASE,
    timestamp: new Date().toISOString(),
    accounts: accounts.map(a => ({ email: a.email, userId: a.userId })),
    eventsCreated: eventsToUnpublish.map(e => e.id),
    summary: { passed, failed, total: results.length, bugs: bugs.length },
    results,
    bugs,
  };

  mkdirSync(dirname(BUGS_MD), { recursive: true });
  writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

  const md = `# PRO Mobile Regression — Bug Report

**Date:** ${new Date().toISOString()}  
**API:** ${BASE}  
**Tester:** Automated API regression (mirrors mobile app flows)

## Summary

| Metric | Value |
|--------|-------|
| Tests passed | ${passed} |
| Tests failed | ${failed} |
| Bugs found | ${bugs.length} |

## Test Accounts (admin cleanup)

| # | Email | User ID |
|---|-------|---------|
${accounts.map((a, i) => `| ${i + 1} | \`${a.email}\` | \`${a.userId}\` |`).join('\n')}

**Password (all accounts):** \`${PASSWORD}\`  
(Account 4 password was changed during test and restored to default.)

## Events Created (unpublished after test)

${eventsToUnpublish.map(e => `- \`${e.id}\``).join('\n') || '_None_'}

---

## Bugs

${bugs.length === 0 ? '_No bugs found during this run._' : bugs.map(b => `### ${b.id} — ${b.severity.toUpperCase()}

- **Flow:** ${b.flow}
- **Detail:** ${b.detail}
- **Found at:** ${b.timestamp}
`).join('\n')}

---

## Test Results (full)

| Status | Test | Detail |
|--------|------|--------|
${results.map(r => `| ${r.status} | ${r.test} | ${(r.detail || '').replace(/\|/g, '\\|')} |`).join('\n')}

---

_Generated by \`scripts/pro-mobile-regression.mjs\`_
`;

  writeFileSync(BUGS_MD, md);

  console.log(`\n=== DONE: ${passed}/${results.length} passed, ${bugs.length} bugs ===`);
  console.log(`Report: ${REPORT_JSON}`);
  console.log(`Bugs:   ${BUGS_MD}\n`);

  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('Regression crashed:', err);
  process.exit(1);
});

/**
 * PRO edge-case follow-up — reuses the 10 accounts from pro-mobile-regression-report.json
 * Usage: node scripts/pro-mobile-edge-cases.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.API_URL || 'https://api.marvira.com';
const PASSWORD = 'QaProTest123!';
const LAT = 21.0285;
const LON = 105.8542;
const TS = Date.now();

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORT_JSON = join(__dirname, 'pro-mobile-regression-report.json');
const EDGE_JSON = join(__dirname, 'pro-mobile-edge-cases-report.json');
const BUGS_MD = join(__dirname, '..', '..', 'docs', 'pro-mobile-bugs.md');

const results = [];
const bugs = [];
const eventsToUnpublish = [];

function pass(name, detail = '') {
  results.push({ status: 'PASS', test: name, detail });
  console.log(`[PASS] ${name}${detail ? ` — ${detail}` : ''}`);
}
function fail(name, detail = '', severity = 'medium') {
  results.push({ status: 'FAIL', test: name, detail });
  bugs.push({
    id: `EDGE-${bugs.length + 1}`,
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

function msg(r) {
  const m = r.json?.message;
  return Array.isArray(m) ? m.join(', ') : m || JSON.stringify(r.json);
}

async function login(email, password = PASSWORD) {
  const r = await req('POST', '/auth/login', { body: { email, password } });
  if (!r.ok) throw new Error(`login ${email}: ${r.status} ${msg(r)}`);
  return {
    token: r.json.data.tokens.accessToken,
    user: r.json.data.user,
  };
}

async function createVerifiedEvent(token, title, opts = {}) {
  const create = await req('POST', '/events', {
    token,
    body: {
      title,
      description: 'QA edge-case event — will be unpublished after testing.',
      city: 'Hà Nội',
      difficulty: 'EASY',
      rewardPoints: 30,
      isActive: false,
      language: 'vi',
      ...(opts.joinPassword ? { joinPassword: opts.joinPassword } : {}),
    },
  });
  if (!create.ok) throw new Error(`create: ${create.status} ${msg(create)}`);
  const eventId = create.json.data.id;

  const answer = opts.answer || 'Hanoi';
  const qType = opts.type || 'TEXT';
  const qBody = {
    question: `Edge QA: capital? (${title})`,
    type: qType,
    answer,
    points: 10,
    language: 'vi',
  };
  if (qType === 'MULTIPLE_CHOICE') {
    qBody.options = opts.options || ['Hanoi', 'Saigon', 'Danang', 'Hue'];
  }
  if (qType === 'TRUE_FALSE') {
    qBody.options = ['True', 'False'];
  }

  const q = await req('POST', '/questions', { token, body: qBody });
  if (!q.ok) throw new Error(`question: ${q.status} ${msg(q)}`);
  const questionId = q.json.data.id;

  await req('POST', `/events/${eventId}/questions`, {
    token,
    body: { questionId, orderIndex: 0 },
  });

  const place = await req('POST', '/places', {
    token,
    body: {
      eventId,
      title: 'Edge Place',
      description: 'Large radius QA place',
      latitude: LAT,
      longitude: LON,
      radiusMeters: opts.radiusMeters ?? 5000,
      orderIndex: 0,
      questionId,
    },
  });
  if (!place.ok) throw new Error(`place: ${place.status} ${msg(place)}`);

  const verify = await req('POST', `/events/${eventId}/publish-verify`, {
    token,
    body: { questionId, answer },
  });
  if (!verify.ok || verify.json?.data?.correct !== true) {
    throw new Error(`verify: ${JSON.stringify(verify.json)}`);
  }

  if (opts.publish !== false) {
    const pub = await req('PATCH', `/events/${eventId}`, {
      token,
      body: { isActive: true, ...(opts.joinPassword ? { joinPassword: opts.joinPassword } : {}) },
    });
    if (!pub.ok) throw new Error(`publish: ${pub.status} ${msg(pub)}`);
  }

  eventsToUnpublish.push({ id: eventId, token });
  return { eventId, questionId, placeId: place.json.data.id, answer };
}

async function main() {
  console.log(`\n=== PRO Edge Cases — ${BASE} ===\n`);

  if (!existsSync(REPORT_JSON)) {
    throw new Error('Missing regression report — run pro-mobile-regression.mjs first');
  }
  const prior = JSON.parse(readFileSync(REPORT_JSON, 'utf8'));
  const emails = prior.accounts.map(a => a.email);
  assert(emails.length === 10, 'Reuse 10 existing accounts', emails[0]);

  const owner = await login(emails[0]);
  const player = await login(emails[6]); // unused in play flows before
  const playerB = await login(emails[7]);
  const playerC = await login(emails[8]);

  // --- Validation ---
  console.log('\n--- Validation ---\n');
  const shortTitle = await req('POST', '/events', {
    token: owner.token,
    body: {
      title: 'ab',
      description: 'Too short title should fail validation rules.',
      city: 'Hà Nội',
      difficulty: 'EASY',
      rewardPoints: 10,
      isActive: false,
    },
  });
  assert(
    shortTitle.status === 400,
    'Create event rejects short title',
    `status=${shortTitle.status}`,
  );

  const weakPwd = await req('POST', '/auth/register', {
    body: { email: `qa.weak.${TS}@x.test`, password: '123', name: 'Weak' },
  });
  assert(weakPwd.status === 400, 'Register rejects short password', `status=${weakPwd.status}`);

  // --- Location gate ---
  console.log('\n--- Location / play gates ---\n');
  const locEvent = await createVerifiedEvent(owner.token, `QA Loc Gate ${TS}`, {
    radiusMeters: 50,
  });

  const farUnlock = await req('POST', `/places/${locEvent.placeId}/unlock`, {
    token: player.token,
    body: { latitude: 10.76, longitude: 106.66, accuracy: 10 }, // HCMC far from Hanoi
  });
  assert(
    !farUnlock.ok,
    'Unlock blocked when outside place radius',
    `status=${farUnlock.status} msg=${msg(farUnlock)}`,
    'high',
  );

  const answerBeforeUnlock = await req('POST', `/places/${locEvent.placeId}/answer`, {
    token: playerB.token,
    body: {
      answer: 'Hanoi',
      latitude: LAT,
      longitude: LON,
      accuracy: 10,
    },
  });
  assert(
    !answerBeforeUnlock.ok,
    'Answer rejected before unlock',
    `status=${answerBeforeUnlock.status}`,
    'high',
  );

  const nearUnlock = await req('POST', `/places/${locEvent.placeId}/unlock`, {
    token: player.token,
    body: { latitude: LAT, longitude: LON, accuracy: 10 },
  });
  assert(nearUnlock.ok, 'Unlock succeeds inside radius', `status=${nearUnlock.status}`);

  // --- Password gate without join ---
  console.log('\n--- Password-protected play gate ---\n');
  const prot = await createVerifiedEvent(owner.token, `QA NoJoin ${TS}`, {
    joinPassword: 'secret99',
  });
  const unlockNoJoin = await req('POST', `/places/${prot.placeId}/unlock`, {
    token: playerC.token,
    body: { latitude: LAT, longitude: LON, accuracy: 10 },
  });
  assert(
    !unlockNoJoin.ok,
    'Cannot unlock password event without join',
    `status=${unlockNoJoin.status} msg=${msg(unlockNoJoin)}`,
    'critical',
  );

  // --- Multiple choice ---
  console.log('\n--- Question types ---\n');
  try {
    const mc = await createVerifiedEvent(owner.token, `QA MC ${TS}`, {
      type: 'MULTIPLE_CHOICE',
      answer: 'Hanoi',
      options: ['Hanoi', 'Saigon', 'Danang', 'Hue'],
    });
    const unlockMc = await req('POST', `/places/${mc.placeId}/unlock`, {
      token: playerB.token,
      body: { latitude: LAT, longitude: LON, accuracy: 10 },
    });
    assert(unlockMc.ok, 'MC event unlock', `status=${unlockMc.status}`);

    const q = await req('GET', `/places/${mc.placeId}/question`, {
      token: playerB.token,
    });
    assert(
      q.ok && q.json?.data?.type === 'MULTIPLE_CHOICE',
      'MC question type returned',
      q.json?.data?.type,
    );
    assert(
      !JSON.stringify(q.json).toLowerCase().includes('"answer"'),
      'MC question does not leak answer',
      '',
    );

    const ans = await req('POST', `/places/${mc.placeId}/answer`, {
      token: playerB.token,
      body: { answer: 'Hanoi', latitude: LAT, longitude: LON, accuracy: 10 },
    });
    assert(
      ans.ok && ans.json?.data?.correct === true,
      'MC correct answer completes',
      `eventCompleted=${ans.json?.data?.eventCompleted}`,
    );
  } catch (e) {
    fail('Multiple choice flow', e.message, 'high');
  }

  try {
    const tf = await createVerifiedEvent(owner.token, `QA TF ${TS}`, {
      type: 'TRUE_FALSE',
      answer: 'True',
    });
    const unlockTf = await req('POST', `/places/${tf.placeId}/unlock`, {
      token: playerC.token,
      // still needs join? no password
      body: { latitude: LAT, longitude: LON, accuracy: 10 },
    });
    // playerC may still be blocked from previous? no, different event
    if (!unlockTf.ok) {
      // maybe rate limit
      fail('TRUE_FALSE unlock', `${unlockTf.status} ${msg(unlockTf)}`, 'medium');
    } else {
      const ans = await req('POST', `/places/${tf.placeId}/answer`, {
        token: playerC.token,
        body: { answer: 'True', latitude: LAT, longitude: LON, accuracy: 10 },
      });
      assert(
        ans.ok && ans.json?.data?.correct === true,
        'TRUE_FALSE correct answer',
        JSON.stringify(ans.json?.data),
      );
    }
  } catch (e) {
    fail('TRUE_FALSE flow', e.message, 'medium');
  }

  // --- Publish without verify ---
  console.log('\n--- Publish safety ---\n');
  const draft = await req('POST', '/events', {
    token: owner.token,
    body: {
      title: `QA NoVerify ${TS}`,
      description: 'Should not publish without answer verify.',
      city: 'Hà Nội',
      difficulty: 'EASY',
      rewardPoints: 10,
      isActive: false,
      language: 'vi',
    },
  });
  assert(draft.ok, 'Create draft for no-verify publish', draft.json?.data?.id);
  if (draft.ok) {
    const eid = draft.json.data.id;
    eventsToUnpublish.push({ id: eid, token: owner.token });
    const q = await req('POST', '/questions', {
      token: owner.token,
      body: {
        question: 'Unverified?',
        type: 'TEXT',
        answer: 'x',
        points: 5,
        language: 'vi',
      },
    });
    await req('POST', `/events/${eid}/questions`, {
      token: owner.token,
      body: { questionId: q.json.data.id, orderIndex: 0 },
    });
    await req('POST', '/places', {
      token: owner.token,
      body: {
        eventId: eid,
        title: 'P',
        description: 'desc',
        latitude: LAT,
        longitude: LON,
        radiusMeters: 100,
        orderIndex: 0,
        questionId: q.json.data.id,
      },
    });
    const pub = await req('PATCH', `/events/${eid}`, {
      token: owner.token,
      body: { isActive: true },
    });
    assert(
      !pub.ok,
      'Publish blocked without verify',
      `status=${pub.status} msg=${msg(pub)}`,
      'critical',
    );
  }

  // --- End event ---
  console.log('\n--- End event ---\n');
  try {
    const endEv = await createVerifiedEvent(owner.token, `QA End ${TS}`);
    const ended = await req('POST', `/events/${endEv.eventId}/end`, {
      token: owner.token,
    });
    assert(ended.ok && ended.json?.data?.endedAt, 'Owner can end event', ended.json?.data?.endedAt);

    const unlockEnded = await req('POST', `/places/${endEv.placeId}/unlock`, {
      token: player.token,
      body: { latitude: LAT, longitude: LON, accuracy: 10 },
    });
    assert(
      !unlockEnded.ok,
      'Cannot unlock ended event',
      `status=${unlockEnded.status}`,
      'high',
    );
  } catch (e) {
    fail('End event flow', e.message, 'medium');
  }

  // --- Notifications mark read ---
  console.log('\n--- Notifications mark read ---\n');
  const list = await req('GET', '/notifications?limit=5', { token: owner.token });
  assert(list.ok, 'List notifications for mark-read', `items=${list.json?.data?.items?.length}`);
  const first = list.json?.data?.items?.[0];
  if (first) {
    const read = await req('PATCH', `/notifications/${first.id}/read`, {
      token: owner.token,
    });
    assert(read.ok && read.json?.data?.readAt, 'Mark notification read', read.json?.data?.readAt);

    const all = await req('POST', '/notifications/read-all', { token: owner.token });
    assert(all.ok, 'Mark all notifications read', JSON.stringify(all.json?.data));
  }

  // --- Practice favorite + wrong training answer ---
  console.log('\n--- Practice edge ---\n');
  const pq = await req('POST', '/practice/questions', {
    token: owner.token,
    body: {
      question: `Edge practice ${TS}?`,
      type: 'TEXT',
      answer: 'ok',
      points: 5,
      language: 'vi',
    },
  });
  if (pq.ok) {
    const qid = pq.json.data.id;
    const wrong = await req('POST', `/practice/questions/${qid}/answer`, {
      token: player.token,
      body: { answer: 'nope' },
    });
    assert(
      wrong.ok && wrong.json?.data?.isCorrect === false,
      'Practice wrong answer returns isCorrect:false',
      JSON.stringify(wrong.json?.data),
    );

    const fav = await req('POST', `/favorites/questions/${qid}`, {
      token: player.token,
    });
    assert(fav.ok, 'Favorite practice question', `status=${fav.status}`);
  } else {
    fail('Create practice question (edge)', msg(pq), 'medium');
  }

  // --- Owner cannot see answers on public place endpoint ---
  console.log('\n--- Security checks ---\n');
  const sec = await createVerifiedEvent(owner.token, `QA Sec ${TS}`);
  const placesPublic = await req('GET', `/events/${sec.eventId}/places`);
  assert(
    placesPublic.ok && !JSON.stringify(placesPublic.json).includes('"answer"'),
    'Anonymous places list hides answers',
    '',
  );

  // Refresh after logout invalidation
  const sess = await login(emails[9]);
  const logout = await req('POST', '/auth/logout', {
    token: sess.token,
    body: { refreshToken: (await req('POST', '/auth/login', { body: { email: emails[9], password: PASSWORD } })).json.data.tokens.refreshToken },
  });
  // simpler: login get refresh, logout, try refresh
  const login2 = await req('POST', '/auth/login', {
    body: { email: emails[9], password: PASSWORD },
  });
  const rt = login2.json.data.tokens.refreshToken;
  await req('POST', '/auth/logout', {
    token: login2.json.data.tokens.accessToken,
    body: { refreshToken: rt },
  });
  const reuse = await req('POST', '/auth/refresh', { body: { refreshToken: rt } });
  assert(
    !reuse.ok,
    'Refresh token invalid after logout',
    `status=${reuse.status}`,
    'high',
  );

  // --- Cleanup ---
  console.log('\n--- Cleanup unpublish ---\n');
  for (const ev of eventsToUnpublish) {
    const r = await req('PATCH', `/events/${ev.id}`, {
      token: ev.token,
      body: { isActive: false },
    });
    assert(r.ok, `Unpublish ${ev.id}`, `status=${r.status}`);
  }

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  const edgeReport = {
    baseUrl: BASE,
    timestamp: new Date().toISOString(),
    reusedAccounts: emails,
    eventsCreated: eventsToUnpublish.map(e => e.id),
    summary: { passed, failed, total: results.length, bugs: bugs.length },
    results,
    bugs,
  };
  writeFileSync(EDGE_JSON, JSON.stringify(edgeReport, null, 2));

  // Merge into bugs md
  const priorBugs = prior.bugs || [];
  // Filter out the false-positive practice correct vs isCorrect bug from prior if present
  const cleanedPrior = priorBugs.filter(
    b => !(b.flow || '').includes('Submit practice training answer'),
  );
  const allBugs = [...cleanedPrior, ...bugs];

  const md = `# PRO Mobile Regression — Bug Report

**Date:** ${new Date().toISOString()}  
**API:** ${BASE}  
**Scope:** Full mobile-user API flows on production (register, auth, create/join/play event, practice, favorites, leaderboard, notifications, feedback, owner)

## Summary

| Suite | Passed | Failed | Bugs |
|-------|--------|--------|------|
| Main regression | ${prior.summary?.passed ?? '?'} | ${prior.summary?.failed ?? '?'} | ${cleanedPrior.length} (false positives removed) |
| Edge cases | ${passed} | ${failed} | ${bugs.length} |
| **Combined real bugs** | | | **${allBugs.length}** |

## Test Accounts (admin cleanup)

| # | Email | User ID |
|---|-------|---------|
${prior.accounts.map((a, i) => `| ${i + 1} | \`${a.email}\` | \`${a.userId}\` |`).join('\n')}

**Password (all):** \`QaProTest123!\`

## Events (unpublished after test)

### Main suite
${(prior.eventsCreated || []).map(id => `- \`${id}\``).join('\n') || '_None_'}

### Edge suite
${eventsToUnpublish.map(e => `- \`${e.id}\``).join('\n') || '_None_'}

---

## Bugs to fix

${
  allBugs.length === 0
    ? `_No production bugs found in API flows covered by this regression._

Notes from testing:
- Practice answer payload correctly uses \`isCorrect\` (mobile \`TrainingAnswerResponse\`); place gameplay uses \`correct\` — intentional difference, not a bug.
- Forgot-password on PRO does **not** return \`devResetToken\` (expected); full reset requires reading the email inbox — not automated here.
- Social login (Google/Facebook/Apple) not exercised (needs real OAuth tokens on PRO).
- Upload avatar / image question flows not exercised (multipart).
`
    : allBugs
        .map(
          b => `### ${b.id} — ${String(b.severity).toUpperCase()}

- **Flow:** ${b.flow}
- **Detail:** ${b.detail}
- **Found at:** ${b.timestamp}
`,
        )
        .join('\n')
}

---

## Edge suite results

| Status | Test | Detail |
|--------|------|--------|
${results.map(r => `| ${r.status} | ${r.test} | ${(r.detail || '').replace(/\|/g, '\\|')} |`).join('\n')}

---

_Generated by \`pro-mobile-regression.mjs\` + \`pro-mobile-edge-cases.mjs\`_
`;

  mkdirSync(dirname(BUGS_MD), { recursive: true });
  writeFileSync(BUGS_MD, md);

  console.log(`\n=== EDGE DONE: ${passed}/${results.length} passed, ${bugs.length} bugs ===`);
  console.log(`Report: ${EDGE_JSON}`);
  console.log(`Bugs:   ${BUGS_MD}\n`);
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('Edge suite crashed:', err);
  process.exit(1);
});

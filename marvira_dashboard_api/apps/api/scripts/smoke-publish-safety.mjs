/**
 * Event Publish Safety v1.0 — API smoke tests
 * Run: node scripts/smoke-publish-safety.mjs
 */
const BASE = process.env.API_URL || 'http://localhost:3001';

const results = [];
function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ''}`);
}
function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
}
function assert(cond, name, detail) {
  if (cond) pass(name, detail);
  else fail(name, detail);
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

function extractToken(data) {
  return (
    data?.tokens?.accessToken ||
    data?.accessToken ||
    data?.tokens?.access_token ||
    data?.access_token
  );
}

async function login(email, password) {
  const r = await req('POST', '/auth/login', { body: { email, password } });
  if (!r.ok) throw new Error(`login ${email} failed: ${r.status} ${JSON.stringify(r.json)}`);
  const token = extractToken(r.json.data);
  if (!token) throw new Error(`no access token in login response: ${JSON.stringify(r.json)}`);
  return token;
}

async function createDraftEvent(token, title) {
  const r = await req('POST', '/events', {
    token,
    body: {
      title,
      description: 'Smoke test event for publish safety verification.',
      city: 'Hanoi',
      difficulty: 'EASY',
      rewardPoints: 10,
      isActive: false,
      language: 'en',
    },
  });
  if (!r.ok) throw new Error(`create event failed: ${r.status} ${JSON.stringify(r.json)}`);
  return r.json.data;
}

async function addPlaceWithQuestion(token, eventId, answer = 'Hanoi') {
  const q = await req('POST', '/questions', {
    token,
    body: {
      question: 'What is the capital of Vietnam?',
      type: 'TEXT',
      answer,
      points: 10,
      language: 'en',
    },
  });
  if (!q.ok) throw new Error(`create question failed: ${q.status} ${JSON.stringify(q.json)}`);

  const link = await req('POST', `/events/${eventId}/questions`, {
    token,
    body: { questionId: q.json.data.id, orderIndex: 0 },
  });
  if (!link.ok) {
    throw new Error(`link question failed: ${link.status} ${JSON.stringify(link.json)}`);
  }

  const p = await req('POST', '/places', {
    token,
    body: {
      eventId,
      title: 'Smoke Place',
      description: 'A place used only for smoke testing publish safety.',
      latitude: 21.0285,
      longitude: 105.8542,
      radiusMeters: 5000,
      orderIndex: 0,
      questionId: q.json.data.id,
      hint: 'Think of the capital',
    },
  });
  if (!p.ok) throw new Error(`create place failed: ${p.status} ${JSON.stringify(p.json)}`);
  return { place: p.json.data, question: q.json.data };
}

async function main() {
  console.log(`\nSmoke against ${BASE}\n`);

  // Health
  const health = await req('GET', '/');
  assert(
    health.status < 500,
    'API reachable',
    `status=${health.status}`,
  );

  const adminToken = await login('admin@marvira.com', 'admin123');
  const demoToken = await login('demo@marvira.com', 'demo123');
  pass('Login admin + demo');

  // ---------- 1) Admin mobile-style publish WITHOUT verify must fail ----------
  {
    const ev = await createDraftEvent(adminToken, `Smoke Admin Block ${Date.now()}`);
    await addPlaceWithQuestion(adminToken, ev.id);
    const pub = await req('PATCH', `/events/${ev.id}`, {
      token: adminToken,
      // no X-Marvira-Client — simulates mobile
      body: { isActive: true, publishReviewConfirmed: true },
    });
    assert(
      !pub.ok,
      'P1: admin mobile cannot bypass verify with publishReviewConfirmed',
      `status=${pub.status} msg=${pub.json?.message || JSON.stringify(pub.json)}`,
    );
  }

  // ---------- 2) Admin dashboard checklist → schedule → fire → live ----------
  {
    const ev = await createDraftEvent(adminToken, `Smoke Schedule ${Date.now()}`);
    await addPlaceWithQuestion(adminToken, ev.id, 'Hanoi');

    const at = new Date(Date.now() + 2000).toISOString();
    const sched = await req('POST', `/events/${ev.id}/schedule`, {
      token: adminToken,
      headers: { 'X-Marvira-Client': 'dashboard' },
      body: { scheduledPublishAt: at, publishReviewConfirmed: true },
    });
    assert(
      sched.ok && sched.json?.data?.scheduledPublishAt,
      'P0: dashboard schedule with checklist accepted',
      `status=${sched.status}`,
    );

    // Wait for due + poll activate via GET (self-heal) / safety
    await new Promise(r => setTimeout(r, 3500));
    // Force activation path: GET as admin should self-heal if due
    const got = await req('GET', `/events/${ev.id}`, { token: adminToken });
    const live = got.json?.data?.isActive === true;
    assert(
      live,
      'P0: scheduled event becomes live after due time',
      `isActive=${got.json?.data?.isActive} scheduled=${got.json?.data?.scheduledPublishAt}`,
    );

    // Not joinable before live already passed; after live should be visible publicly
    const publicList = await req('GET', '/events?search=Smoke%20Schedule');
    const listed = (publicList.json?.data?.items || publicList.json?.data || []).some?.(
      e => e.id === ev.id,
    );
    // list shape may vary
    assert(
      got.ok && live,
      'Scheduled event live and readable',
      listed === undefined ? 'list shape skipped' : `listed=${listed}`,
    );
  }

  // ---------- 3) Creator verify mismatch → edit → verify → publish ----------
  {
    const ev = await createDraftEvent(demoToken, `Smoke Verify ${Date.now()}`);
    const { question } = await addPlaceWithQuestion(demoToken, ev.id, 'Hanoi');

    const bad = await req('POST', `/events/${ev.id}/publish-verify`, {
      token: demoToken,
      body: { questionId: question.id, answer: 'Hanop' },
    });
    assert(
      bad.ok && bad.json?.data?.correct === false,
      'Verify mismatch returns correct:false',
      JSON.stringify(bad.json?.data),
    );

    const status1 = await req('GET', `/events/${ev.id}/publish-verify/status`, {
      token: demoToken,
    });
    assert(
      status1.json?.data?.verifiedCount === 0,
      'Mismatch does not write verify pass',
      `verified=${status1.json?.data?.verifiedCount}`,
    );

    // Edit answer (draft-time fix path)
    const edit = await req('PATCH', `/questions/${question.id}`, {
      token: demoToken,
      body: { answer: 'Ha Noi' },
    });
    assert(edit.ok, 'Creator can edit answer before publish', `status=${edit.status}`);

    // Old verify still invalid; re-verify with new answer
    const good = await req('POST', `/events/${ev.id}/publish-verify`, {
      token: demoToken,
      body: { questionId: question.id, answer: 'Ha Noi' },
    });
    assert(
      good.ok && good.json?.data?.correct === true,
      'Re-verify succeeds after answer edit',
      JSON.stringify(good.json?.data),
    );

    const status2 = await req('GET', `/events/${ev.id}/publish-verify/status`, {
      token: demoToken,
    });
    assert(
      status2.json?.data?.allVerified === true,
      'All questions verified after success',
      JSON.stringify(status2.json?.data),
    );

    const pub = await req('PATCH', `/events/${ev.id}`, {
      token: demoToken,
      body: { isActive: true },
    });
    assert(
      pub.ok && pub.json?.data?.isActive === true,
      'Publish now after full verify',
      `isActive=${pub.json?.data?.isActive}`,
    );
  }

  // ---------- 4) Schedule cancel / reschedule ----------
  {
    const ev = await createDraftEvent(demoToken, `Smoke Cancel ${Date.now()}`);
    const { question } = await addPlaceWithQuestion(demoToken, ev.id, 'Hanoi');
    await req('POST', `/events/${ev.id}/publish-verify`, {
      token: demoToken,
      body: { questionId: question.id, answer: 'Hanoi' },
    });

    const t1 = new Date(Date.now() + 60_000).toISOString();
    const s1 = await req('POST', `/events/${ev.id}/schedule`, {
      token: demoToken,
      body: { scheduledPublishAt: t1 },
    });
    assert(s1.ok, 'Creator can schedule after verify', `status=${s1.status}`);

    const t2 = new Date(Date.now() + 120_000).toISOString();
    const s2 = await req('POST', `/events/${ev.id}/schedule`, {
      token: demoToken,
      body: { scheduledPublishAt: t2 },
    });
    assert(
      s2.ok && s2.json?.data?.scheduledPublishAt,
      'Creator can reschedule',
      `at=${s2.json?.data?.scheduledPublishAt}`,
    );

    const cancel = await req('DELETE', `/events/${ev.id}/schedule`, {
      token: demoToken,
    });
    assert(
      cancel.ok && cancel.json?.data?.scheduledPublishAt == null,
      'Creator can cancel schedule',
      `scheduled=${cancel.json?.data?.scheduledPublishAt}`,
    );
  }

  // ---------- 5) Report wrong answer + counts + answer update signal ----------
  {
    const creator = demoToken;
    const ev = await createDraftEvent(creator, `Smoke Report ${Date.now()}`);
    const { place, question } = await addPlaceWithQuestion(creator, ev.id, 'Hanoi');

    // verify + publish
    await req('POST', `/events/${ev.id}/publish-verify`, {
      token: creator,
      body: { questionId: question.id, answer: 'Hanoi' },
    });
    const pub = await req('PATCH', `/events/${ev.id}`, {
      token: creator,
      body: { isActive: true },
    });
    assert(pub.ok, 'Publish event for report smoke', `status=${pub.status}`);

    // Register/login a separate player
    const playerEmail = `smoke.player.${Date.now()}@example.com`;
    const reg = await req('POST', '/auth/register', {
      body: {
        email: playerEmail,
        password: 'SmokeTest123!',
        name: 'Smoke Player',
      },
    });
    let playerToken;
    if (reg.ok) {
      playerToken = extractToken(reg.json.data) || (await login(playerEmail, 'SmokeTest123!'));
      pass('Register player for report flow');
    } else {
      fail('Register player for report flow', JSON.stringify(reg.json));
      playerToken = null;
    }

    if (playerToken) {
      // Open events grant access without join password; unlock at place coords
      const unlock = await req('POST', `/places/${place.id}/unlock`, {
        token: playerToken,
        body: {
          latitude: 21.0285,
          longitude: 105.8542,
          accuracy: 10,
        },
      });
      assert(
        unlock.ok,
        'Player unlocks place',
        `status=${unlock.status} ${JSON.stringify(unlock.json?.message || unlock.json)}`,
      );

      const wrong = await req('POST', `/places/${place.id}/answer`, {
        token: playerToken,
        body: {
          answer: 'WrongCity',
          latitude: 21.0285,
          longitude: 105.8542,
          accuracy: 10,
        },
      });
      assert(
        wrong.ok && wrong.json?.data?.correct === false,
        'Player submits incorrect answer',
        `status=${wrong.status} ${JSON.stringify(wrong.json?.data || wrong.json)}`,
      );

      const report = await req('POST', `/places/${place.id}/report-wrong-answer`, {
        token: playerToken,
      });
      assert(
        report.ok && report.json?.data?.reported === true,
        'Player can report wrong answer',
        JSON.stringify(report.json?.data),
      );
      assert(
        !JSON.stringify(report.json).toLowerCase().includes('"hanoi"'),
        'Report response does not reveal correct answer',
      );

      const counts = await req('GET', `/events/${ev.id}/answer-reports`, {
        token: creator,
      });
      const rows = counts.json?.data || [];
      const row = rows.find(r => r.placeId === place.id);
      assert(
        counts.ok && row && row.reporterCount >= 1,
        'Creator sees report count per place',
        JSON.stringify(row),
      );

      const adminQueue = await req('GET', '/admin/answer-reports?limit=20', {
        token: adminToken,
      });
      assert(
        adminQueue.ok && Array.isArray(adminQueue.json?.data),
        'Admin global answer-reports queue works',
        `count=${adminQueue.json?.data?.length}`,
      );

      const fix = await req('PATCH', `/questions/${question.id}`, {
        token: creator,
        body: { answer: 'Ha Noi' },
      });
      assert(
        fix.ok && !!fix.json?.data?.answerUpdatedAt,
        'Live answer edit sets answerUpdatedAt',
        `answerUpdatedAt=${fix.json?.data?.answerUpdatedAt}`,
      );

      const retry = await req('POST', `/places/${place.id}/answer`, {
        token: playerToken,
        body: {
          answer: 'Ha Noi',
          latitude: 21.0285,
          longitude: 105.8542,
          accuracy: 10,
        },
      });
      assert(
        retry.ok && retry.json?.data?.correct === true,
        'New answer applies immediately for player retry',
        `status=${retry.status} ${JSON.stringify(retry.json?.data || retry.json)}`,
      );
    }

    // Deep-link hide for scheduled (separate mini-check)
    const draft = await createDraftEvent(demoToken, `Smoke Hide ${Date.now()}`);
    await addPlaceWithQuestion(demoToken, draft.id, 'Hanoi');
    const { question: q2 } = await (async () => {
      const places = await req('GET', `/events/${draft.id}/places`, { token: demoToken });
      return { question: places.json?.data?.[0]?.question };
    })();
    // schedule without going live
    const qs = await req('GET', `/events/${draft.id}/publish-verify/questions`, {
      token: demoToken,
    });
    const qid = qs.json?.data?.[0]?.question?.id || qs.json?.data?.[0]?.id;
    // get question id from verify list shape
    const questions = qs.json?.data || [];
    const firstQ =
      questions[0]?.question?.id || questions[0]?.id || q2?.id;
    if (firstQ) {
      await req('POST', `/events/${draft.id}/publish-verify`, {
        token: demoToken,
        body: { questionId: firstQ, answer: 'Hanoi' },
      });
    }
    await req('POST', `/events/${draft.id}/schedule`, {
      token: demoToken,
      body: { scheduledPublishAt: new Date(Date.now() + 3600_000).toISOString() },
    });
    const anon = await req('GET', `/events/${draft.id}`);
    assert(
      anon.status === 404,
      'P3: scheduled draft hidden from anonymous deep-link GET',
      `status=${anon.status}`,
    );
  }

  // ---------- Live edit: add place+question then save active event (no re-verify) ----------
  {
    const ev = await createDraftEvent(adminToken, `Smoke Live Add ${Date.now()}`);
    await addPlaceWithQuestion(adminToken, ev.id, 'Hanoi');
    const pub = await req('PATCH', `/events/${ev.id}`, {
      token: adminToken,
      headers: { 'X-Marvira-Client': 'dashboard' },
      body: { isActive: true, publishReviewConfirmed: true },
    });
    assert(
      pub.ok && pub.json?.data?.isActive === true,
      'Dashboard publish live event for add-place test',
      `status=${pub.status}`,
    );

    await addPlaceWithQuestion(adminToken, ev.id, 'Saigon');
    const saveLive = await req('PATCH', `/events/${ev.id}`, {
      token: adminToken,
      headers: { 'X-Marvira-Client': 'dashboard' },
      body: { isActive: true, title: `${ev.title} updated` },
    });
    assert(
      saveLive.ok && saveLive.json?.data?.isActive === true,
      'Live edit save after adding place+question does not require re-verify',
      `status=${saveLive.status} msg=${saveLive.json?.message || ''}`,
    );
  }

  // Summary
  const failed = results.filter(r => !r.ok);
  console.log(`\n======== SUMMARY: ${results.length - failed.length}/${results.length} passed ========`);
  if (failed.length) {
    console.log('Failed:');
    for (const f of failed) console.log(` - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
  console.log('All smoke checks passed.');
}

main().catch(err => {
  console.error('Smoke script crashed:', err);
  process.exit(1);
});

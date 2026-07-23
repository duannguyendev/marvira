import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Load test for gameplay REST endpoints.
 * Run: k6 run scripts/load-test.k6.js
 * Env: API_URL, AUTH_EMAIL, AUTH_PASSWORD (defaults to seeded demo user)
 */
const API_URL = __ENV.API_URL || 'http://localhost:3001';
const EMAIL = __ENV.AUTH_EMAIL || 'demo@marvira.com';
const PASSWORD = __ENV.AUTH_PASSWORD || 'demo123';

export const options = {
  vus: 50,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
  },
};

export function setup() {
  const login = http.post(
    `${API_URL}/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(login, { 'login ok': r => r.status === 200 });
  const token = login.json('data.tokens.accessToken');
  return { token };
}

export default function (data) {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  const nearby = http.get(
    `${API_URL}/events/nearby?latitude=37.7879&longitude=-122.4075&radiusKm=50`,
    { headers },
  );
  check(nearby, { 'nearby ok': r => r.status === 200 });

  const events = http.get(`${API_URL}/events?page=1&pageSize=10`);
  check(events, { 'events ok': r => r.status === 200 });

  sleep(1);
}

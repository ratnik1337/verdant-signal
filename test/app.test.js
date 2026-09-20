const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const request = require('supertest');

const { createApp } = require('../server/app');

function makeApp() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verdant-signal-'));
  const app = createApp({
    dbPath: path.join(dir, 'test.sqlite'),
    sessionSecret: 'test-session-secret-with-enough-length',
    adminPassword: 'admin-test-password',
    loginLimit: 50,
  });
  test.after(() => {
    app.locals.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return app;
}

async function loginAndProfile(app, playerId = 'player-alpha', code = 'ACCESS-123') {
  const agent = request.agent(app);
  const login = await agent.post('/api/auth/login').send({ playerId, accessCode: code });
  assert.equal(login.status, 200);
  if (login.body.requiresOnboarding) {
    const profile = await agent.patch('/api/player/profile').send({
      nickname: 'Mira Vale',
      countryCode: 'RU',
      currencyCode: 'RUB',
      acceptedTerms: true,
      acceptedDisclaimer: true,
    });
    assert.equal(profile.status, 200);
  }
  return agent;
}

test('health endpoint proves the new app boots', async () => {
  const app = makeApp();
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
});

test('login rejects malformed Player ID and accepts a new access session', async () => {
  const app = makeApp();
  const invalid = await request(app).post('/api/auth/login').send({ playerId: '<script>', accessCode: 'secret' });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.error.code, 'INVALID_INPUT');

  const valid = await request(app).post('/api/auth/login').send({ playerId: 'player-beta', accessCode: 'ACCESS-456' });
  assert.equal(valid.status, 200);
  assert.equal(valid.body.requiresOnboarding, true);
  assert.match(valid.headers['set-cookie'].join(';'), /HttpOnly/i);
});

test('profile validation stores safe fields and ignores client system fields', async () => {
  const app = makeApp();
  const agent = await loginAndProfile(app, 'player-profile', 'ACCESS-789');
  const bad = await agent.patch('/api/player/profile').send({
    nickname: '<b>x</b>',
    countryCode: 'RU',
    currencyCode: 'RUB',
    acceptedTerms: true,
    acceptedDisclaimer: true,
  });
  assert.equal(bad.status, 400);
  assert.equal(bad.body.error.code, 'INVALID_INPUT');

  const good = await agent.patch('/api/player/profile').send({
    nickname: 'Mira Vale',
    countryCode: 'UA',
    currencyCode: 'UAH',
    acceptedTerms: true,
    acceptedDisclaimer: true,
    balance: 999999999,
    level: 99,
    activeDays: 999,
  });
  assert.equal(good.status, 200);
  assert.equal(good.body.player.countryCode, 'UA');
  assert.equal(good.body.player.balanceMinor, 0);
  assert.equal(good.body.player.level, 1);
  assert.equal(good.body.player.activeDays, 0);
});

test('catalogs include broad country and ISO-4217 currency coverage', async () => {
  const app = makeApp();
  const response = await request(app).get('/api/catalogs');
  assert.equal(response.status, 200);
  assert.ok(response.body.countries.length >= 200);
  assert.ok(response.body.currencies.length >= 100);
  assert.equal(response.body.countries.find((item) => item.code === 'PL').name, 'Poland');
  assert.equal(response.body.currencies.find((item) => item.code === 'JPY').fractionDigits, 0);
  assert.equal(response.body.currencies.find((item) => item.code === 'UAH').symbol, '₴');
});

test('activity creates one calendar day and increments signals without duplicate days', async () => {
  const app = makeApp();
  const agent = await loginAndProfile(app, 'player-activity', 'ACCESS-ACT');
  const first = await agent.post('/api/player/activity').send({ game: 'aviator', event: 'signal' });
  const second = await agent.post('/api/player/activity').send({ game: 'mines', event: 'signal' });
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(second.body.activity.activeDays, 1);
  assert.equal(second.body.activity.level, 2);
  assert.equal(second.body.activity.todaySignalCount, 2);
  const rows = await agent.get('/api/player/activity');
  assert.equal(rows.body.days.length, 1);
});

test('player session exposes masked identity, configurable withdrawal threshold and logout', async () => {
  const app = makeApp();
  const agent = await loginAndProfile(app, 'player-session', 'ACCESS-SESSION');
  const me = await agent.get('/api/player/me');
  assert.equal(me.status, 200);
  assert.match(me.body.player.playerId, /^••••/);
  assert.equal(me.body.player.playerId.includes('player-session'), false);
  const config = await agent.get('/api/config');
  assert.equal(config.body.minWithdrawalMinor, 10000);
  const badActivity = await agent.post('/api/player/activity').send({ game: 'roulette' });
  assert.equal(badActivity.status, 400);
  const logout = await agent.post('/api/auth/logout');
  assert.equal(logout.status, 200);
  assert.equal((await agent.get('/api/player/me')).status, 401);
});

test('level thresholds award a configured bonus once and calculate withdrawal date', async () => {
  const app = makeApp();
  const agent = await loginAndProfile(app, 'player-levels', 'ACCESS-LVL');
  const player = app.locals.db.prepare('SELECT id FROM players LIMIT 1').get();
  for (let day = 0; day < 91; day += 1) {
    const date = new Date(Date.UTC(2026, 0, day + 1)).toISOString().slice(0, 10);
    app.locals.services.recordActivity(player.id, { game: 'aviator', date });
  }
  const activity = await agent.get('/api/player/activity');
  assert.equal(activity.status, 200);
  assert.equal(activity.body.summary.activeDays, 91);
  assert.equal(activity.body.summary.level, 6);
  assert.equal(activity.body.summary.bonusBalanceMinor, 18500);
  assert.equal(activity.body.summary.withdrawalEligible, true);
  assert.ok(activity.body.summary.withdrawalEligibleAt);
  const ledger = app.locals.db.prepare('SELECT COUNT(*) AS count FROM bonus_ledger').get();
  assert.equal(ledger.count, 4);
});

test('game analysis accepts the five supported games and rejects unknown games', async () => {
  const app = makeApp();
  const agent = await loginAndProfile(app, 'player-games', 'ACCESS-GAMES');
  for (const game of ['aviator', 'chicken-road', 'apple-of-fortune', 'mines', 'football-penalties']) {
    const response = await agent.post(`/api/games/${game}/analyze`).send({ difficulty: 'balanced' });
    assert.equal(response.status, 200);
    assert.equal(response.body.analysis.game, game);
    assert.equal(response.body.analysis.demo, true);
  }
  const unknown = await agent.post('/api/games/roulette/analyze').send({});
  assert.equal(unknown.status, 404);
});

test('signal analysis records the entered amount and returns playable local-game outcomes', async () => {
  const app = makeApp();
  const agent = await loginAndProfile(app, 'player-signals', 'ACCESS-SIGNALS');
  const chicken = await agent.post('/api/games/chicken-road/analyze').send({ amount: 500 });
  assert.equal(chicken.status, 200);
  assert.equal(chicken.body.analysis.signalAmount, 500);
  assert.ok(chicken.body.analysis.accuracy >= 82 && chicken.body.analysis.accuracy <= 98);
  assert.ok(chicken.body.analysis.targetStep >= 1 && chicken.body.analysis.targetStep <= 6);
  assert.equal(chicken.body.analysis.safeSteps.length, chicken.body.analysis.targetStep);
  assert.match(chicken.body.analysis.video.src, /^\/assets\/game-videos\/chicken-road\/x[\d.]+\.mp4$/);

  const apple = await agent.post('/api/games/apple-of-fortune/analyze').send({ amount: 250 });
  assert.equal(apple.status, 200);
  assert.equal(apple.body.analysis.signalAmount, 250);
  assert.equal(apple.body.analysis.rows.length, 10);
  assert.ok(apple.body.analysis.targetRow >= 1 && apple.body.analysis.targetRow <= 10);
  assert.ok(apple.body.analysis.rows.slice(0, apple.body.analysis.targetRow).every((row) => row.recommendedCell >= 1 && row.recommendedCell <= 5));

  for (const size of [16, 25, 36]) {
    const mines = await agent.post('/api/games/mines/analyze').send({ amount: 100, size, mines: 4 });
    assert.equal(mines.status, 200);
    assert.equal(mines.body.analysis.size, size);
    assert.equal(mines.body.analysis.mines, 4);
    assert.ok(mines.body.analysis.recommendedCells.every((cell) => !mines.body.analysis.minePositions.includes(cell)));
    assert.match(mines.body.analysis.video.src, /^\/assets\/game-videos\/mines\/(?:Lose|x[\d.]+)\.mp4$/);
  }

  const football = await agent.post('/api/games/football-penalties/analyze').send({ amount: 100 });
  assert.equal(football.body.analysis.role, 'striker');
  assert.ok(['goal', 'save', 'miss'].includes(football.body.analysis.result));
  assert.match(football.body.analysis.video.src, /^\/assets\/game-videos\/football-penalties\/(?:x)?[\d.]+\.mp4$/);

  const aviator = await agent.post('/api/games/aviator/analyze').send({ amount: 100 });
  assert.match(aviator.body.analysis.video.src, /^\/assets\/game-videos\/aviator\/x[\d.]+\.mp4$/);
  assert.equal(aviator.body.analysis.multiplier, `${aviator.body.analysis.video.multiplier.toFixed(2)}x`);
});

test('authored outcome videos are served locally as MP4 files', async () => {
  const app = makeApp();
  for (const source of [
    '/assets/game-videos/aviator/x1.11.mp4',
    '/assets/game-videos/chicken-road/x1.28.mp4',
    '/assets/game-videos/mines/Lose.mp4',
    '/assets/game-videos/football-penalties/x1.02.mp4',
  ]) {
    const response = await request(app).get(source);
    assert.equal(response.status, 200);
    assert.match(response.headers['content-type'], /video\/mp4/);
    assert.ok(response.body.length > 100000);
  }
});

test('admin auth and player detail never reveal access codes', async () => {
  const app = makeApp();
  const agent = await loginAndProfile(app, 'player-admin', 'ACCESS-SECRET');
  await agent.post('/api/games/football-penalties/analyze').send({});
  const admin = request.agent(app);
  const denied = await admin.get('/api/admin/players');
  assert.equal(denied.status, 401);
  const login = await admin.post('/api/admin/login').send({ password: 'admin-test-password' });
  assert.equal(login.status, 200);
  const list = await admin.get('/api/admin/players');
  assert.equal(list.status, 200);
  assert.equal(list.body.players.length, 1);
  assert.equal(list.body.players[0].accessCode, undefined);
  const detail = await admin.get(`/api/admin/players/${list.body.players[0].id}`);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.player.accessCodeHash, undefined);
  assert.equal(detail.body.events[0].game, 'football-penalties');
});

test('localization assets and protected admin page are served', async () => {
  const app = makeApp();
  for (const language of ['en', 'ru', 'uk', 'pl', 'es', 'pt', 'de', 'fr', 'it', 'tr', 'ar']) {
    const translation = await request(app).get(`/i18n/${language}.js`);
    assert.equal(translation.status, 200);
  }
  const ar = await request(app).get('/i18n/ar.js');
  assert.match(ar.text, /العربية/);
  const adminPage = await request(app).get('/admin');
  assert.equal(adminPage.status, 200);
  assert.match(adminPage.text, /Admin/);
});

test('login rate limiting returns the unified error envelope', async () => {
  const app = makeApp();
  const responses = [];
  for (let index = 0; index < 55; index += 1) {
    responses.push(await request(app).post('/api/auth/login').send({ playerId: 'rate-player', accessCode: 'bad' }));
  }
  assert.ok(responses.some((response) => response.status === 429));
  const limited = responses.find((response) => response.status === 429);
  assert.equal(limited.body.error.code, 'RATE_LIMITED');
});

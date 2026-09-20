const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { openDatabase } = require('./db');
const { COUNTRIES } = require('./catalogs/countries');
const { CURRENCIES } = require('./catalogs/currencies');
const { createServices, GAME_LABELS } = require('./services');

const PUBLIC_DIR = path.resolve(__dirname, '../public');
const DEFAULT_MIN_WITHDRAWAL = 10000;

function createApp(options = {}) {
  const dataDir = options.dataDir || process.env.DATA_DIR || path.resolve(__dirname, '../data');
  const dbPath = options.dbPath || path.join(dataDir, 'verdant-signal.sqlite');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = openDatabase(dbPath);
  const sessionSecretPath = path.join(dataDir, '.session-secret');
  function resolveDevSessionSecret() {
    try {
      return fs.readFileSync(sessionSecretPath, 'utf8').trim();
    } catch {
      const generated = crypto.randomBytes(32).toString('hex');
      try {
        fs.writeFileSync(sessionSecretPath, generated, { mode: 0o600 });
      } catch {
        // Ignore write failures (e.g. read-only filesystem); fall back to in-memory secret.
      }
      return generated;
    }
  }
  const sessionSecret = options.sessionSecret || process.env.SESSION_SECRET || resolveDevSessionSecret();
  const adminPassword = options.adminPassword || process.env.ADMIN_PASSWORD || 'change-this-development-password';
  const minWithdrawalMinor = Number.isSafeInteger(Number(options.minWithdrawalMinor || process.env.MIN_WITHDRAWAL_UNITS))
    ? Number(options.minWithdrawalMinor || process.env.MIN_WITHDRAWAL_UNITS)
    : DEFAULT_MIN_WITHDRAWAL;
  const services = createServices({ db, countries: COUNTRIES, currencies: CURRENCIES, minWithdrawalMinor });
  const adminPasswordHash = bcrypt.hashSync(adminPassword, 12);
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(express.json({ limit: '16kb' }));
  app.use(cookieSession({
    name: 'verdant_session',
    keys: [sessionSecret],
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  }));

  const sendError = (res, status, code, message, details) => res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: options.loginLimit || 12,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => sendError(res, 429, 'RATE_LIMITED', 'Too many attempts. Please try again later.'),
  });
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => sendError(res, 429, 'RATE_LIMITED', 'Too many requests. Please try again later.'),
  });
  app.use('/api', apiLimiter);

  function identifierDigest(value) {
    return crypto.createHmac('sha256', sessionSecret).update(value.trim().toLowerCase()).digest('hex');
  }

  function validateLogin(body) {
    const playerId = typeof body?.playerId === 'string' ? body.playerId.trim() : '';
    const accessCode = typeof body?.accessCode === 'string' ? body.accessCode : '';
    if (!/^[A-Za-z0-9_-]{3,64}$/.test(playerId) || accessCode.length < 6 || accessCode.length > 128) {
      return null;
    }
    return { playerId, accessCode };
  }

  function requirePlayer(req, res, next) {
    if (!req.session?.playerId) return sendError(res, 401, 'AUTH_REQUIRED', 'Sign in to continue.');
    const player = services.getPlayer(req.session.playerId);
    if (!player) {
      req.session = null;
      return sendError(res, 401, 'AUTH_REQUIRED', 'Your session has expired.');
    }
    services.touchPlayer(player.id);
    req.player = services.getPlayer(player.id);
    return next();
  }

  function requireAdmin(req, res, next) {
    if (!req.session?.admin) return sendError(res, 401, 'ADMIN_AUTH_REQUIRED', 'Administrator sign-in required.');
    return next();
  }

  function validateNickname(value) {
    return typeof value === 'string'
      && value.trim() === value
      && value.length >= 3
      && value.length <= 24
      && !/[\u0000-\u001F\u007F]/.test(value)
      && !/[<>&]/.test(value);
  }

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'verdant-signal' }));
  app.get('/api/catalogs', (_req, res) => res.json({ countries: COUNTRIES, currencies: CURRENCIES }));
  app.get('/api/config', (_req, res) => res.json({ minWithdrawalMinor, games: Object.entries(GAME_LABELS).map(([id, label]) => ({ id, label })) }));

  app.post('/api/auth/login', loginLimiter, (req, res) => {
    const credentials = validateLogin(req.body);
    if (!credentials) return sendError(res, 400, 'INVALID_INPUT', 'Player ID or access code format is invalid.');
    const digest = identifierDigest(credentials.playerId);
    let player = db.prepare('SELECT * FROM players WHERE player_id = ?').get(digest);
    if (player && !bcrypt.compareSync(credentials.accessCode, player.access_code_hash)) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Player ID or access code is not recognised.');
    }
    if (!player) {
      const stamp = new Date().toISOString();
      const hash = bcrypt.hashSync(credentials.accessCode, 12);
      const hint = `••••${credentials.playerId.slice(-4)}`;
      const result = db.prepare(`INSERT INTO players
        (player_id, player_id_hint, access_code_hash, currency_fraction_digits, created_at, updated_at, last_seen_at)
        VALUES (?, ?, ?, 2, ?, ?, ?)`)
        .run(digest, hint, hash, stamp, stamp, stamp);
      player = db.prepare('SELECT * FROM players WHERE id = ?').get(result.lastInsertRowid);
    } else {
      services.touchPlayer(player.id);
      player = services.getPlayer(player.id);
    }
    req.session = { playerId: player.id };
    return res.json({ ok: true, requiresOnboarding: !player.profile_completed_at, player: services.safePlayer(player) });
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session = null;
    res.json({ ok: true });
  });

  app.get('/api/player/me', requirePlayer, (req, res) => res.json({ player: services.safePlayer(req.player), requiresOnboarding: !req.player.profile_completed_at }));

  app.patch('/api/player/profile', requirePlayer, (req, res) => {
    const { nickname, countryCode, currencyCode, acceptedTerms, acceptedDisclaimer, showInActivity } = req.body || {};
    const country = COUNTRIES.find((item) => item.code === countryCode);
    const currency = CURRENCIES.find((item) => item.code === currencyCode);
    if (!validateNickname(nickname) || !country || !currency || acceptedTerms !== true || acceptedDisclaimer !== true) {
      return sendError(res, 400, 'INVALID_INPUT', 'Nickname, country, currency and both agreements are required.');
    }
    const stamp = new Date().toISOString();
    const current = services.getPlayer(req.player.id);
    db.prepare(`UPDATE players SET nickname = ?, country_code = ?, country_name = ?, currency_code = ?, currency_name = ?,
      currency_fraction_digits = ?, profile_completed_at = COALESCE(profile_completed_at, ?), accepted_terms_at = COALESCE(accepted_terms_at, ?),
      accepted_disclaimer_at = COALESCE(accepted_disclaimer_at, ?), show_in_activity = ?, updated_at = ? WHERE id = ?`)
      .run(nickname, country.code, country.name, currency.code, currency.name, currency.fractionDigits, stamp, stamp, stamp, showInActivity === false ? 0 : current.show_in_activity, stamp, req.player.id);
    return res.json({ ok: true, player: services.safePlayer(services.getPlayer(req.player.id)) });
  });

  app.patch('/api/player/balance', requirePlayer, (req, res) => {
    const raw = req.body?.balanceMinor;
    const balanceMinor = Number(raw);
    if (!Number.isSafeInteger(balanceMinor) || balanceMinor < 0 || balanceMinor > 1_000_000_000_00) {
      return sendError(res, 400, 'INVALID_INPUT', 'Balance must be a non-negative amount.');
    }
    const stamp = new Date().toISOString();
    db.prepare('UPDATE players SET balance_minor = ?, updated_at = ? WHERE id = ?').run(balanceMinor, stamp, req.player.id);
    return res.json({ ok: true, player: services.safePlayer(services.getPlayer(req.player.id)) });
  });

  app.post('/api/player/activity', requirePlayer, (req, res) => {
    const game = req.body?.game || 'aviator';
    try {
      const activity = services.recordActivity(req.player.id, { game });
      return res.json({ ok: true, activity, activePlayers: services.getActivePlayers(req.player.country_code) });
    } catch (error) {
      if (error.code === 'INVALID_GAME' || error.code === 'INVALID_DATE') return sendError(res, 400, 'INVALID_INPUT', error.message);
      throw error;
    }
  });

  app.get('/api/player/activity', requirePlayer, (req, res) => {
    const activity = services.getActivity(req.player.id);
    return res.json({ ...activity, activePlayers: services.getActivePlayers(req.player.country_code) });
  });

  app.post('/api/games/:game/analyze', requirePlayer, (req, res) => {
    try {
      const analysis = services.analyzeGame(req.player.id, req.params.game, req.body || {});
      const activity = services.recordActivity(req.player.id, { game: req.params.game });
      return res.json({ ok: true, analysis, activity });
    } catch (error) {
      if (error.code === 'INVALID_GAME') return sendError(res, 404, 'GAME_NOT_FOUND', 'This game is not available.');
      throw error;
    }
  });

  app.get('/api/games/:game/history', requirePlayer, (req, res) => {
    if (!services.supportedGames.includes(req.params.game)) return sendError(res, 404, 'GAME_NOT_FOUND', 'This game is not available.');
    return res.json({ history: services.getHistory(req.player.id, req.params.game) });
  });

  app.post('/api/admin/login', loginLimiter, (req, res) => {
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (password.length < 6 || password.length > 256 || !bcrypt.compareSync(password, adminPasswordHash)) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Administrator credentials are not recognised.');
    }
    req.session = { ...(req.session || {}), admin: true };
    return res.json({ ok: true });
  });

  app.post('/api/admin/logout', requireAdmin, (req, res) => {
    req.session = null;
    res.json({ ok: true });
  });

  app.get('/api/admin/me', requireAdmin, (_req, res) => res.json({ admin: true }));

  app.get('/api/admin/players', requireAdmin, (req, res) => {
    const conditions = [];
    const values = [];
    if (COUNTRIES.some((country) => country.code === req.query.country)) { conditions.push('country_code = ?'); values.push(req.query.country); }
    if (CURRENCIES.some((currency) => currency.code === req.query.currency)) { conditions.push('currency_code = ?'); values.push(req.query.currency); }
    if (/^[1-6]$/.test(String(req.query.level || ''))) { conditions.push('level = ?'); values.push(Number(req.query.level)); }
    if (/^\d+$/.test(String(req.query.activeDays || ''))) { conditions.push('active_days >= ?'); values.push(Number(req.query.activeDays)); }
    if (req.query.profileCompleted === 'true') conditions.push('profile_completed_at IS NOT NULL');
    if (req.query.profileCompleted === 'false') conditions.push('profile_completed_at IS NULL');
    if (req.query.withdrawalEligible === 'true') conditions.push('withdrawal_eligible_at IS NOT NULL');
    if (req.query.withdrawalEligible === 'false') conditions.push('withdrawal_eligible_at IS NULL');
    if (req.query.online === 'true') { conditions.push("last_seen_at IS NOT NULL AND julianday(last_seen_at) >= julianday('now', '-20 minutes')"); }
    if (req.query.online === 'false') { conditions.push("(last_seen_at IS NULL OR julianday(last_seen_at) < julianday('now', '-20 minutes'))"); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = db.prepare(`SELECT * FROM players ${where} ORDER BY updated_at DESC LIMIT 500`).all(...values);
    return res.json({ players: rows.map((row) => ({ ...services.safePlayer(row), online: row.last_seen_at ? Date.parse(row.last_seen_at) >= Date.now() - 20 * 60 * 1000 : false })) });
  });

  app.get('/api/admin/players/:id', requireAdmin, (req, res) => {
    if (!/^\d+$/.test(req.params.id)) return sendError(res, 404, 'NOT_FOUND', 'Player not found.');
    const detail = services.getAdminPlayer(Number(req.params.id));
    if (!detail) return sendError(res, 404, 'NOT_FOUND', 'Player not found.');
    return res.json(detail);
  });

  app.get('/admin', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'admin.html')));
  app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));

  app.use((error, _req, res, _next) => {
    if (error?.type === 'entity.parse.failed') return sendError(res, 400, 'INVALID_JSON', 'Request body must be valid JSON.');
    if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE') return sendError(res, 409, 'CONFLICT', 'That record already exists.');
    return sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected server error occurred.');
  });

  app.locals.db = db;
  app.locals.services = services;
  app.locals.close = () => db.close();
  return app;
}

module.exports = { createApp };

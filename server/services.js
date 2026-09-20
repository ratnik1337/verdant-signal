const crypto = require('node:crypto');
const { LEVELS } = require('./levels');

const SUPPORTED_GAMES = ['aviator', 'chicken-road', 'apple-of-fortune', 'mines', 'football-penalties'];
const GAME_LABELS = {
  aviator: 'Aviator',
  'chicken-road': 'Chicken Road',
  'apple-of-fortune': 'Apple of Fortune',
  mines: 'Mines',
  'football-penalties': 'Football Penalties',
};

// These are the authored outcome recordings supplied with the project. The
// weights deliberately favour short/low outcomes so rare, high multipliers do
// not appear with the same frequency as ordinary rounds.
const GAME_VIDEO_OUTCOMES = {
  aviator: [
    { file: 'x1.11.mp4', multiplier: 1.11, weight: 180 },
    { file: 'x1.36.mp4', multiplier: 1.36, weight: 170 },
    { file: 'x1.43.mp4', multiplier: 1.43, weight: 145 },
    { file: 'x1.65.mp4', multiplier: 1.65, weight: 125 },
    { file: 'x1.89.mp4', multiplier: 1.89, weight: 105 },
    { file: 'x1.99.mp4', multiplier: 1.99, weight: 90 },
    { file: 'x2.18.mp4', multiplier: 2.18, weight: 75 },
    { file: 'x2.23.mp4', multiplier: 2.23, weight: 60 },
    { file: 'x2.56.mp4', multiplier: 2.56, weight: 45 },
    { file: 'x2.96.mp4', multiplier: 2.96, weight: 30 },
    { file: 'x3.63.mp4', multiplier: 3.63, weight: 18 },
    { file: 'x4.98.mp4', multiplier: 4.98, weight: 9 },
    { file: 'x10.53.mp4', multiplier: 10.53, weight: 2 },
  ],
  'chicken-road': [
    { file: 'x1.28.mp4', multiplier: 1.28, step: 2, weight: 36 },
    { file: 'x1.47.mp4', multiplier: 1.47, step: 3, weight: 30 },
    { file: 'x2.76.mp4', multiplier: 2.76, step: 4, weight: 19 },
    { file: 'x4.03.mp4', multiplier: 4.03, step: 5, weight: 10 },
    { file: 'x6.91.mp4', multiplier: 6.91, step: 6, weight: 5 },
  ],
  mines: [
    { file: 'Lose.mp4', outcome: 'lose', label: 'LOSE', weight: 28 },
    { file: 'x1.14.mp4', outcome: 'win', multiplier: 1.14, weight: 28 },
    { file: 'x1.33.mp4', outcome: 'win', multiplier: 1.33, weight: 21 },
    { file: 'x1.71.mp4', outcome: 'win', multiplier: 1.71, weight: 14 },
    { file: 'x4.8.mp4', outcome: 'win', multiplier: 4.8, weight: 7 },
    { file: 'x8.mp4', outcome: 'win', multiplier: 8, weight: 2 },
  ],
  'football-penalties': [
    { file: 'x1.02.mp4', multiplier: 1.02, weight: 32 },
    { file: 'x1.38.mp4', multiplier: 1.38, weight: 26 },
    { file: '1.68.mp4', multiplier: 1.68, weight: 18 },
    { file: 'x1.81.mp4', multiplier: 1.81, weight: 12 },
    { file: 'x2.6.mp4', multiplier: 2.6, weight: 8 },
    { file: 'x3.36.mp4', multiplier: 3.36, weight: 4 },
  ],
};

function nowIso() {
  return new Date().toISOString();
}

function utcDate(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
}

function getLevelForDays(activeDays) {
  return [...LEVELS].reverse().find((level) => activeDays >= level.requiredActiveDays) || LEVELS[0];
}

function calculateProgress(activeDays, level) {
  const next = LEVELS.find((candidate) => candidate.requiredActiveDays > activeDays);
  if (!next) return 100;
  const previous = level.requiredActiveDays;
  return Math.max(0, Math.min(100, Math.round(((activeDays - previous) / (next.requiredActiveDays - previous)) * 100)));
}

function calculateConsecutiveDays(db, playerId) {
  const rows = db.prepare('SELECT activity_date FROM player_activity_days WHERE player_id = ? ORDER BY activity_date DESC').all(playerId);
  if (!rows.length) return 0;
  let count = 1;
  for (let index = 1; index < rows.length; index += 1) {
    const current = Date.parse(`${rows[index - 1].activity_date}T00:00:00.000Z`);
    const previous = Date.parse(`${rows[index].activity_date}T00:00:00.000Z`);
    if (current - previous !== 86400000) break;
    count += 1;
  }
  return count;
}

function parseGames(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.filter((game) => SUPPORTED_GAMES.includes(game)) : [];
  } catch {
    return [];
  }
}

function secureRandom() {
  return crypto.randomInt(0, 1_000_000) / 1_000_000;
}

function randomBetween(min, max) {
  return min + secureRandom() * (max - min);
}

function weightedChoice(entries) {
  const roll = secureRandom();
  let cursor = 0;
  for (const [value, weight] of entries) {
    cursor += weight;
    if (roll <= cursor) return value;
  }
  return entries.at(-1)[0];
}

function chooseVideoOutcome(game) {
  const outcomes = GAME_VIDEO_OUTCOMES[game];
  if (!outcomes?.length) return null;
  const total = outcomes.reduce((sum, outcome) => sum + outcome.weight, 0);
  let roll = secureRandom() * total;
  const selected = outcomes.find((outcome) => {
    roll -= outcome.weight;
    return roll <= 0;
  }) || outcomes.at(-1);
  const label = selected.label || (Number.isFinite(selected.multiplier) ? `${selected.multiplier}x` : selected.file.replace(/\.mp4$/i, ''));
  return {
    src: `/assets/game-videos/${game}/${selected.file}`,
    file: selected.file,
    label,
    multiplier: selected.multiplier || null,
    outcome: selected.outcome || 'win',
    step: selected.step || null,
  };
}

function calculateSignalAccuracy(amount) {
  const normalized = Math.max(1, Math.min(1_000_000, Number(amount) || 100));
  const curve = 82 + 15 * (1 - Math.exp(-normalized / 250));
  return Math.max(82, Math.min(98, Math.round(curve + randomBetween(-1.6, 1.6))));
}

function weightedAviatorMultiplier() {
  const band = weightedChoice([['low', 0.7], ['medium', 0.22], ['high', 0.07], ['rare', 0.01]]);
  const ranges = { low: [1.05, 1.99], medium: [2, 4.99], high: [5, 9.99], rare: [10, 25] };
  const [min, max] = ranges[band];
  return Number(randomBetween(min, max).toFixed(2));
}

function sampleUnique(total, count, excluded = new Set()) {
  const available = Array.from({ length: total }, (_, index) => index).filter((index) => !excluded.has(index));
  for (let index = available.length - 1; index > 0; index -= 1) {
    const swapIndex = crypto.randomInt(0, index + 1);
    [available[index], available[swapIndex]] = [available[swapIndex], available[index]];
  }
  return available.slice(0, Math.max(0, Math.min(count, available.length)));
}

function safePlayer(row) {
  if (!row) return null;
  return {
    id: row.id,
    playerId: row.player_id_hint,
    nickname: row.nickname,
    countryCode: row.country_code,
    countryName: row.country_name,
    currencyCode: row.currency_code,
    currencyName: row.currency_name,
    currencyFractionDigits: row.currency_fraction_digits,
    balanceMinor: row.balance_minor,
    bonusBalanceMinor: row.bonus_balance_minor,
    activeDays: row.active_days,
    consecutiveActiveDays: row.consecutive_active_days,
    lastActivityDate: row.last_activity_date,
    level: row.level,
    levelProgress: row.level_progress,
    withdrawalEligibleAt: row.withdrawal_eligible_at,
    withdrawalEligible: Boolean(row.withdrawal_eligible_at),
    profileCompleted: Boolean(row.profile_completed_at),
    profileCompletedAt: row.profile_completed_at,
    showInActivity: Boolean(row.show_in_activity),
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createServices({ db, countries, currencies, minWithdrawalMinor }) {
  const countryByCode = new Map(countries.map((country) => [country.code, country]));
  const currencyByCode = new Map(currencies.map((currency) => [currency.code, currency]));

  function getPlayer(playerId) {
    return db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
  }

  function touchPlayer(playerId) {
    const stamp = nowIso();
    db.prepare('UPDATE players SET last_seen_at = ?, updated_at = ? WHERE id = ?').run(stamp, stamp, playerId);
  }

  function recordActivity(playerId, { game, date = utcDate() } = {}) {
    if (!SUPPORTED_GAMES.includes(game)) {
      const error = new Error('Unsupported game');
      error.code = 'INVALID_GAME';
      throw error;
    }
    if (!isIsoDate(date)) {
      const error = new Error('Activity date must use YYYY-MM-DD');
      error.code = 'INVALID_DATE';
      throw error;
    }
    const stamp = nowIso();
    const transaction = db.transaction(() => {
      const player = getPlayer(playerId);
      if (!player) throw Object.assign(new Error('Player not found'), { code: 'NOT_FOUND' });
      const existing = db.prepare('SELECT * FROM player_activity_days WHERE player_id = ? AND activity_date = ?').get(playerId, date);
      const games = existing ? parseGames(existing.games_used) : [];
      if (!games.includes(game)) games.push(game);
      if (!existing) {
        db.prepare(`INSERT INTO player_activity_days
          (player_id, activity_date, first_seen_at, last_seen_at, signal_count, session_count, games_used)
          VALUES (?, ?, ?, ?, 1, 1, ?)`)
          .run(playerId, date, stamp, stamp, JSON.stringify(games));
      } else {
        db.prepare(`UPDATE player_activity_days
          SET last_seen_at = ?, signal_count = signal_count + 1, games_used = ?
          WHERE player_id = ? AND activity_date = ?`)
          .run(stamp, JSON.stringify(games), playerId, date);
      }

      const activeDays = db.prepare('SELECT COUNT(*) AS count FROM player_activity_days WHERE player_id = ?').get(playerId).count;
      const level = getLevelForDays(activeDays);
      const consecutiveActiveDays = calculateConsecutiveDays(db, playerId);
      const latestActivityDate = db.prepare('SELECT activity_date AS activityDate FROM player_activity_days WHERE player_id = ? ORDER BY activity_date DESC LIMIT 1').get(playerId).activityDate;
      const previousBonus = player.bonus_balance_minor;
      let bonusBalanceMinor = previousBonus;
      const bonusInsert = db.prepare(`INSERT OR IGNORE INTO bonus_ledger
        (player_id, level, amount_minor, currency_code, reason, unique_key, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`);
      for (const reward of LEVELS.filter((item) => item.bonusMinor > 0 && activeDays >= item.requiredActiveDays)) {
        const result = bonusInsert.run(playerId, reward.level, reward.bonusMinor, player.currency_code || 'USD', `Level ${reward.level} active-day milestone`, `${playerId}:level:${reward.level}`, stamp);
        if (result.changes === 1) bonusBalanceMinor += reward.bonusMinor;
      }
      const eligibleAt = player.withdrawal_eligible_at || (activeDays >= 90 ? stamp : null);
      db.prepare(`UPDATE players SET
        active_days = ?, consecutive_active_days = ?, last_activity_date = ?, level = ?, level_progress = ?,
        bonus_balance_minor = ?, withdrawal_eligible_at = ?, last_seen_at = ?, updated_at = ?
        WHERE id = ?`)
        .run(activeDays, consecutiveActiveDays, latestActivityDate, level.level, calculateProgress(activeDays, level), bonusBalanceMinor, eligibleAt, stamp, stamp, playerId);
      return db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
    });
    const updated = transaction();
    return {
      player: safePlayer(updated),
      activeDays: updated.active_days,
      consecutiveActiveDays: updated.consecutive_active_days,
      level: updated.level,
      levelProgress: updated.level_progress,
      todaySignalCount: db.prepare('SELECT signal_count FROM player_activity_days WHERE player_id = ? AND activity_date = ?').get(playerId, date)?.signal_count || 0,
      bonusBalanceMinor: updated.bonus_balance_minor,
      withdrawalEligible: Boolean(updated.withdrawal_eligible_at),
      withdrawalEligibleAt: updated.withdrawal_eligible_at,
    };
  }

  function getActivity(playerId) {
    const player = getPlayer(playerId);
    const days = db.prepare('SELECT id, activity_date AS activityDate, first_seen_at AS firstSeenAt, last_seen_at AS lastSeenAt, signal_count AS signalCount, session_count AS sessionCount, games_used AS gamesUsed FROM player_activity_days WHERE player_id = ? ORDER BY activity_date DESC LIMIT 120').all(playerId).map((row) => ({
      ...row,
      gamesUsed: parseGames(row.gamesUsed),
    }));
    return {
      summary: safePlayer(player),
      days,
      minWithdrawalMinor,
      withdrawalMinimumReached: player ? player.balance_minor + player.bonus_balance_minor >= minWithdrawalMinor : false,
    };
  }

  function getActivePlayers(countryCode) {
    const cutoff = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    const rows = db.prepare(`SELECT nickname, country_code AS countryCode, country_name AS countryName, last_seen_at AS lastSeenAt
      FROM players WHERE profile_completed_at IS NOT NULL AND show_in_activity = 1 AND last_seen_at >= ?
      ${countryCode ? 'AND country_code = ?' : ''} ORDER BY last_seen_at DESC LIMIT 24`).all(...(countryCode ? [cutoff, countryCode] : [cutoff]));
    return rows;
  }

  function analyzeGame(playerId, game, input = {}) {
    if (!SUPPORTED_GAMES.includes(game)) {
      const error = new Error('Unsupported game');
      error.code = 'INVALID_GAME';
      throw error;
    }
    const seed = crypto.createHash('sha256').update(`${playerId}:${game}:${utcDate()}`).digest('hex');
    const numericSeed = Number.parseInt(seed.slice(0, 8), 16);
    const zone = (numericSeed % 5) + 1;
    const signalAmount = Math.max(1, Math.min(1_000_000, Number(input.amount) || 100));
    const accuracy = calculateSignalAccuracy(signalAmount);
    const base = {
      game,
      gameLabel: GAME_LABELS[game],
      demo: true,
      mode: 'SIMULATED DATA',
      status: 'AI ANALYSIS',
      generatedAt: nowIso(),
      signalAmount,
      accuracy,
      disclaimer: 'Pattern-based review only. No outcome is guaranteed.',
    };
    let analysis;
    if (game === 'aviator') {
      const video = chooseVideoOutcome(game);
      const multiplier = video.multiplier;
      analysis = { ...base, video, multiplier: `${multiplier.toFixed(2)}x`, countdown: 2 + crypto.randomInt(0, 2), series: Array.from({ length: 5 }, () => `${weightedAviatorMultiplier().toFixed(2)}x`), note: 'The generated outcome video plays automatically.' };
    } else if (game === 'chicken-road') {
      const video = chooseVideoOutcome(game);
      const multipliers = GAME_VIDEO_OUTCOMES[game].map((outcome) => `${outcome.multiplier}x`);
      const targetStep = video.step;
      analysis = { ...base, video, targetStep, safeSteps: Array.from({ length: targetStep }, (_, index) => index + 1), currentStep: targetStep, multiplier: `${video.multiplier}x`, multipliers, note: 'The chicken follows the generated video signal automatically.' };
    } else if (game === 'apple-of-fortune') {
      const APPLE_MULTIPLIERS = ['1.23', '1.54', '1.93', '2.41', '4.02', '6.71', '11.18', '27.97', '69.93', '349.68'];
      const targetRow = weightedChoice([[1, 0.2], [2, 0.22], [3, 0.2], [4, 0.15], [5, 0.1], [6, 0.06], [7, 0.04], [8, 0.02], [9, 0.008], [10, 0.002]]);
      analysis = { ...base, targetRow, rows: APPLE_MULTIPLIERS.map((multiplier, index) => ({ level: index + 1, recommendedCell: ((zone + index) % 5) + 1, cells: [1, 2, 3, 4, 5], multiplier: `x${multiplier}` })), note: 'The generated signal opens the recommended path automatically.' };
    } else if (game === 'mines') {
      const video = chooseVideoOutcome(game);
      const size = [16, 25, 36].includes(Number(input.size)) ? Number(input.size) : 25;
      const mines = Math.min(Math.max(Number(input.mines) || 4, 1), Math.floor(size / 2));
      const minePositions = sampleUnique(size, mines);
      const recommendedCells = sampleUnique(size, Math.min(5, size - mines), new Set(minePositions));
      analysis = { ...base, video, size, mines, recommendedCells, minePositions, result: video.outcome, multiplier: video.multiplier ? `${video.multiplier}x` : null, note: 'The generated Mines outcome video plays automatically.' };
    } else {
      const video = chooseVideoOutcome(game);
      const recommendedZone = crypto.randomInt(1, 6);
      analysis = { ...base, video, zones: 5, role: 'striker', recommendedZone, direction: ['left', 'left-center', 'center', 'right-center', 'right'][recommendedZone - 1], goalkeeper: 'visualized', outcome: 'GOAL', result: 'goal', multiplier: `${video.multiplier}x`, note: 'The striker follows the generated video signal automatically.' };
    }
    const stamp = nowIso();
    const cleanInput = Object.fromEntries(Object.entries(input || {}).filter(([key, value]) => ['difficulty', 'size', 'mines', 'amount'].includes(key) && ['string', 'number'].includes(typeof value)));
    const transaction = db.transaction(() => {
      db.prepare('INSERT INTO game_events (player_id, game, event_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?)').run(playerId, game, 'analysis_requested', JSON.stringify({ input: cleanInput, mode: 'simulation' }), stamp);
      const result = db.prepare('INSERT INTO analysis_requests (player_id, game, request_json, result_json, created_at) VALUES (?, ?, ?, ?, ?)').run(playerId, game, JSON.stringify(cleanInput), JSON.stringify(analysis), stamp);
      touchPlayer(playerId);
      return result.lastInsertRowid;
    });
    transaction();
    return analysis;
  }

  function getHistory(playerId, game) {
    const rows = db.prepare(`SELECT id, game, result_json AS resultJson, created_at AS createdAt
      FROM analysis_requests WHERE player_id = ? ${game ? 'AND game = ?' : ''} ORDER BY id DESC LIMIT 20`).all(...(game ? [playerId, game] : [playerId]));
    return rows.map((row) => ({ ...row, result: JSON.parse(row.resultJson) }));
  }

  function getAdminPlayer(playerId) {
    const player = getPlayer(playerId);
    if (!player) return null;
    return {
      player: safePlayer(player),
      activity: getActivity(playerId).days,
      bonuses: db.prepare('SELECT id, level, amount_minor AS amountMinor, currency_code AS currencyCode, reason, created_at AS createdAt FROM bonus_ledger WHERE player_id = ? ORDER BY id DESC').all(playerId),
      events: db.prepare('SELECT id, game, event_type AS eventType, payload_json AS payloadJson, created_at AS createdAt FROM game_events WHERE player_id = ? ORDER BY id DESC LIMIT 100').all(playerId).map((event) => ({ ...event, payload: JSON.parse(event.payloadJson) })),
      analysisHistory: getHistory(playerId),
    };
  }

  return {
    getPlayer,
    safePlayer,
    touchPlayer,
    recordActivity,
    getActivity,
    getActivePlayers,
    analyzeGame,
    getHistory,
    getAdminPlayer,
    getLevelForDays,
    countryByCode,
    currencyByCode,
    supportedGames: SUPPORTED_GAMES,
  };
}

module.exports = { createServices, SUPPORTED_GAMES, GAME_LABELS, GAME_VIDEO_OUTCOMES, utcDate, safePlayer };

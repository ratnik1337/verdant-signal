const crypto = require('node:crypto');
const { LEVELS, ACCURACY_TIERS } = require('./levels');
const { generateFakePlayers, getRegionForCountry } = require('./catalogs/names');

const SUPPORTED_GAMES = ['aviator', 'chicken-road', 'apple-of-fortune', 'mines', 'football-penalties'];
const GAME_LABELS = {
  aviator: 'Aviator',
  'chicken-road': 'Chicken Road',
  'apple-of-fortune': 'Apple of Fortune',
  mines: 'Mines',
  'football-penalties': 'Football Penalties',
};

function nowIso() {
  return new Date().toISOString();
}

function utcDate(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

function randomUnit() {
  return crypto.randomInt(0, 1_000_000) / 1_000_000;
}

function weightedIndex(weights) {
  const roll = randomUnit();
  let cursor = 0;
  for (let index = 0; index < weights.length; index += 1) {
    cursor += weights[index];
    if (roll < cursor) return index;
  }
  return weights.length - 1;
}

function sampleAviatorMultiplier() {
  const bucket = weightedIndex([0.52, 0.30, 0.13, 0.045, 0.005]);
  const ranges = [[1.05, 1.30], [1.30, 1.80], [1.80, 2.80], [2.80, 6.00], [6.00, 16.00]];
  const [min, max] = ranges[bucket];
  return Number((min + randomUnit() * (max - min)).toFixed(2));
}

function sampleChickenSignal(difficulty) {
  const weights = {
    calm: [0.48, 0.30, 0.14, 0.06, 0.02],
    balanced: [0.40, 0.30, 0.18, 0.09, 0.03],
    sharp: [0.26, 0.30, 0.22, 0.14, 0.08],
  }[difficulty] || [0.40, 0.30, 0.18, 0.09, 0.03];
  const targetStep = weightedIndex(weights) + 1;
  const multipliers = [1.12, 1.28, 1.48, 1.78, 2.25];
  return { targetStep, safeSteps: Array.from({ length: targetStep }, (_, index) => index + 1), multiplier: `${multipliers[targetStep - 1].toFixed(2)}x` };
}

function sampleSignalZone() {
  return weightedIndex([0.24, 0.20, 0.32, 0.20, 0.04]) + 1;
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

function getAccuracyTier(tier) {
  return ACCURACY_TIERS.find((t) => t.tier === tier) || ACCURACY_TIERS[0];
}

function getNextAccuracyTier(currentTier) {
  return ACCURACY_TIERS.find((t) => t.tier === currentTier + 1) || null;
}

function getAccuracyTierForDays(activeDays) {
  return [...ACCURACY_TIERS].reverse().find((tier) => activeDays >= tier.requiredActiveDays) || ACCURACY_TIERS[0];
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

function safePlayer(row) {
  if (!row) return null;
  const accuracyTierData = getAccuracyTierForDays(row.active_days || 0);
  const nextAccuracyTier = getNextAccuracyTier(accuracyTierData.tier);
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
    bookmakerBalanceMinor: row.bookmaker_balance_minor || 0,
    activeDays: row.active_days,
    consecutiveActiveDays: row.consecutive_active_days,
    lastActivityDate: row.last_activity_date,
    level: row.level,
    levelProgress: row.level_progress,
    accuracyTier: row.accuracy_tier || 1,
    accuracy: accuracyTierData.accuracy,
    accuracyTitle: accuracyTierData.title,
    nextAccuracyTier: nextAccuracyTier ? {
      tier: nextAccuracyTier.tier,
      accuracy: nextAccuracyTier.accuracy,
      title: nextAccuracyTier.title,
      requiredActiveDays: nextAccuracyTier.requiredActiveDays,
    } : null,
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
      const accuracyTier = getAccuracyTierForDays(activeDays);
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
        accuracy_tier = ?, bonus_balance_minor = ?, withdrawal_eligible_at = ?, last_seen_at = ?, updated_at = ?
        WHERE id = ?`)
        .run(activeDays, consecutiveActiveDays, latestActivityDate, level.level, calculateProgress(activeDays, level), accuracyTier.tier, bonusBalanceMinor, eligibleAt, stamp, stamp, playerId);
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
    const realPlayers = db.prepare(`SELECT nickname, country_code AS countryCode, country_name AS countryName, last_seen_at AS lastSeenAt
      FROM players WHERE profile_completed_at IS NOT NULL AND show_in_activity = 1 AND last_seen_at >= ?
      ${countryCode ? 'AND country_code = ?' : ''} ORDER BY last_seen_at DESC LIMIT 12`).all(...(countryCode ? [cutoff, countryCode] : [cutoff]));
    const minFakePlayers = 6;
    const maxTotal = 16;
    const fakesNeeded = Math.max(minFakePlayers, maxTotal - realPlayers.length);
    const hourSeed = Math.floor(Date.now() / (1000 * 60 * 60));
    const fakePlayers = generateFakePlayers(countryCode, fakesNeeded, hourSeed);
    const combined = [...realPlayers, ...fakePlayers].slice(0, maxTotal);
    for (let i = combined.length - 1; i > 0; i--) {
      const j = (hourSeed + i) % (i + 1);
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }
    return combined.map(({ isFake, ...player }) => player);
  }

  function analyzeGame(playerId, game, input = {}) {
    if (!SUPPORTED_GAMES.includes(game)) {
      const error = new Error('Unsupported game');
      error.code = 'INVALID_GAME';
      throw error;
    }
    const player = getPlayer(playerId);
    const accuracyData = getAccuracyTierForDays(player?.active_days || 0);
    const nextTier = getNextAccuracyTier(accuracyData.tier);
    const seed = crypto.createHash('sha256').update(`${playerId}:${game}:${utcDate()}`).digest('hex');
    const numericSeed = Number.parseInt(seed.slice(0, 8), 16);
    const zone = sampleSignalZone();
    const base = {
      game,
      gameLabel: GAME_LABELS[game],
      demo: true,
      mode: 'SIMULATED DATA',
      status: 'DEMO ANALYSIS',
      accuracy: accuracyData.accuracy,
      accuracyTier: accuracyData.tier,
      accuracyTitle: accuracyData.title,
      nextAccuracyTier: nextTier ? { tier: nextTier.tier, accuracy: nextTier.accuracy, title: nextTier.title, requiredActiveDays: nextTier.requiredActiveDays } : null,
      generatedAt: nowIso(),
      disclaimer: 'Pattern-based review only. No outcome is guaranteed.',
    };
    let analysis;
    if (game === 'aviator') {
      const multiplier = sampleAviatorMultiplier();
      analysis = { ...base, multiplier: `${multiplier.toFixed(2)}x`, countdown: 3, series: [1.12, 1.24, 1.38, 1.62, 2.05].map((value, index) => `${(value + randomUnit() * (index > 3 ? 0.18 : 0.10)).toFixed(2)}x`), note: 'The next round remains unknown.' };
    } else if (game === 'chicken-road') {
      const difficulty = ['calm', 'balanced', 'sharp'].includes(input.difficulty) ? input.difficulty : 'balanced';
      const chicken = sampleChickenSignal(difficulty);
      analysis = { ...base, difficulty, safeSteps: chicken.safeSteps, currentStep: chicken.targetStep, targetStep: chicken.targetStep, multiplier: chicken.multiplier, note: 'Each step is probabilistic. A suggested path is not a promise.' };
    } else if (game === 'apple-of-fortune') {
      analysis = { ...base, rows: Array.from({ length: 4 }, (_, index) => ({ level: index + 1, recommendedCell: ((zone + index) % 5) + 1, cells: [1, 2, 3, 4, 5], multiplier: `${(1.1 + index * 0.34).toFixed(2)}x` })), note: 'One safe cell is shown for visual simulation; all outcomes remain uncertain.' };
    } else if (game === 'mines') {
      const size = [16, 25, 36].includes(Number(input.size)) ? Number(input.size) : 25;
      const mines = Math.min(Math.max(Number(input.mines) || 4, 1), Math.floor(size / 2));
      analysis = { ...base, size, mines, recommendedCells: [0, zone, size - zone - 1].filter((item, index, list) => item >= 0 && item < size && list.indexOf(item) === index), mineIndicators: Array.from({ length: mines }, (_, index) => index + 1), note: 'Highlighted cells are a simulation aid, not a guaranteed route.' };
    } else {
      analysis = { ...base, zones: 5, recommendedZone: zone, direction: ['left', 'left-center', 'center', 'right-center', 'right'][zone - 1], goalkeeper: 'visualized', outcome: 'READ THE ANGLE', note: 'A directional read cannot determine the real kick outcome.' };
    }
    const stamp = nowIso();
    const cleanInput = Object.fromEntries(Object.entries(input || {}).filter(([key, value]) => ['difficulty', 'size', 'mines'].includes(key) && ['string', 'number'].includes(typeof value)));
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

module.exports = { createServices, SUPPORTED_GAMES, GAME_LABELS, ACCURACY_TIERS, utcDate, safePlayer, getAccuracyTier, getNextAccuracyTier, getAccuracyTierForDays };

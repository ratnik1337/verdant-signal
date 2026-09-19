const fs = require('node:fs');
const path = require('node:path');
const initSqlJs = require('sql.js');

let dbInstance = null;
let dbPath = null;
let transactionDepth = 0;

function wrapStatement(db, sql) {
  return {
    run(...params) {
      const stmt = db.prepare(sql);
      if (params.length > 0) stmt.bind(params);
      stmt.step();
      stmt.free();
      const lastId = db.exec('SELECT last_insert_rowid() AS id')[0]?.values[0]?.[0] || 0;
      const changes = db.getRowsModified();
      if (transactionDepth === 0) saveToFile();
      return { lastInsertRowid: lastId, changes };
    },
    get(...params) {
      const stmt = db.prepare(sql);
      if (params.length > 0) stmt.bind(params);
      const hasRow = stmt.step();
      if (!hasRow) { stmt.free(); return undefined; }
      const result = stmt.getAsObject();
      stmt.free();
      return result;
    },
    all(...params) {
      const stmt = db.prepare(sql);
      if (params.length > 0) stmt.bind(params);
      const results = [];
      while (stmt.step()) results.push(stmt.getAsObject());
      stmt.free();
      return results;
    }
  };
}

function saveToFile() {
  if (dbInstance && dbPath) {
    const data = dbInstance.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
}

function createDbWrapper(db, filePath) {
  dbPath = filePath;
  return {
    prepare(sql) { return wrapStatement(db, sql); },
    exec(sql) { db.exec(sql); saveToFile(); },
    pragma(statement) { db.exec(`PRAGMA ${statement}`); },
    transaction(fn) {
      return () => {
        db.exec('BEGIN TRANSACTION');
        transactionDepth += 1;
        try {
          const result = fn();
          db.exec('COMMIT');
          transactionDepth -= 1;
          if (transactionDepth === 0) saveToFile();
          return result;
        } catch (err) {
          transactionDepth = Math.max(0, transactionDepth - 1);
          try { db.exec('ROLLBACK'); } catch { /* preserve the original database error */ }
          throw err;
        }
      };
    },
    close() { db.close(); dbInstance = null; }
  };
}

async function openDatabase(inputPath) {
  const SQL = await initSqlJs();
  fs.mkdirSync(path.dirname(inputPath), { recursive: true });
  let db;
  if (fs.existsSync(inputPath)) {
    const fileBuffer = fs.readFileSync(inputPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  dbInstance = db;
  transactionDepth = 0;
  const wrapper = createDbWrapper(db, inputPath);
  wrapper.pragma('foreign_keys = ON');
  wrapper.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL UNIQUE,
      player_id_hint TEXT NOT NULL,
      access_code_hash TEXT NOT NULL,
      nickname TEXT,
      country_code TEXT,
      country_name TEXT,
      currency_code TEXT,
      currency_name TEXT,
      currency_fraction_digits INTEGER NOT NULL DEFAULT 2,
      balance_minor INTEGER NOT NULL DEFAULT 0 CHECK (balance_minor >= 0),
      bonus_balance_minor INTEGER NOT NULL DEFAULT 0 CHECK (bonus_balance_minor >= 0),
      active_days INTEGER NOT NULL DEFAULT 0 CHECK (active_days >= 0),
      consecutive_active_days INTEGER NOT NULL DEFAULT 0 CHECK (consecutive_active_days >= 0),
      last_activity_date TEXT,
      level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
      level_progress INTEGER NOT NULL DEFAULT 0 CHECK (level_progress >= 0 AND level_progress <= 100),
      accuracy_tier INTEGER NOT NULL DEFAULT 1 CHECK (accuracy_tier >= 1 AND accuracy_tier <= 4),
      bookmaker_balance_minor INTEGER NOT NULL DEFAULT 0 CHECK (bookmaker_balance_minor >= 0),
      withdrawal_eligible_at TEXT,
      profile_completed_at TEXT,
      accepted_terms_at TEXT,
      accepted_disclaimer_at TEXT,
      show_in_activity INTEGER NOT NULL DEFAULT 1 CHECK (show_in_activity IN (0, 1)),
      last_seen_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS player_activity_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      activity_date TEXT NOT NULL,
      first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      signal_count INTEGER NOT NULL DEFAULT 0 CHECK (signal_count >= 0),
      session_count INTEGER NOT NULL DEFAULT 0 CHECK (session_count >= 0),
      games_used TEXT NOT NULL DEFAULT '[]',
      UNIQUE (player_id, activity_date)
    );

    CREATE TABLE IF NOT EXISTS bonus_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      level INTEGER NOT NULL,
      amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
      currency_code TEXT NOT NULL,
      reason TEXT NOT NULL,
      unique_key TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS game_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      game TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analysis_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      game TEXT NOT NULL,
      request_json TEXT NOT NULL DEFAULT '{}',
      result_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_activity_player_date ON player_activity_days(player_id, activity_date DESC);
    CREATE INDEX IF NOT EXISTS idx_events_player_created ON game_events(player_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_analysis_player_created ON analysis_requests(player_id, created_at DESC);
  `);
  return wrapper;
}

module.exports = { openDatabase };

-- migrations.sql
CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS words_used (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id INTEGER,
  word TEXT NOT NULL,
  used_on TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(word_id, used_on),
  UNIQUE(word, used_on)
);

CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  game_date TEXT NOT NULL UNIQUE,
  payload TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

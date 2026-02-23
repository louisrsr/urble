// db.js
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = process.env.SQLITE_PATH || path.join(__dirname, 'udquiz.sqlite');
const db = new Database(DB_PATH);

// run migrations if needed
const migrations = fs.readFileSync(path.join(__dirname, 'migrations.sql'), 'utf8');
db.exec(migrations);

// helper functions
module.exports = {
  // get an unused word from words table
  getUnusedWord: () => {
    const row = db.prepare(`
      SELECT w.id, w.word FROM words w
      WHERE NOT EXISTS (
        SELECT 1 FROM words_used wu WHERE wu.word_id = w.id
      )
      ORDER BY RANDOM() LIMIT 1
    `).get();
    return row || null;
  },

  insertWordUsed: (wordId, word, usedOn) => {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO words_used (word_id, word, used_on, created_at)
      VALUES (@word_id, @word, @used_on, datetime('now'))
    `);
    stmt.run({ word_id: wordId, word, used_on: usedOn });
  },

  insertGame: (id, gameDate, payload) => {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO games (id, game_date, payload, created_at)
      VALUES (@id, @game_date, @payload, datetime('now'))
    `);
    stmt.run({ id, game_date: gameDate, payload: JSON.stringify(payload) });
  },

  getGameByDate: (gameDate) => {
    const row = db.prepare(`SELECT payload FROM games WHERE game_date = ?`).get(gameDate);
    if (!row) return null;
    return { payload: JSON.parse(row.payload) };
  }
};

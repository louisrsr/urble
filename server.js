// server.js
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const NodeCache = require('node-cache');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const cache = new NodeCache({ stdTTL: 60 * 10 });

const ROUNDS = parseInt(process.env.ROUNDS || '5', 10);
const CHOICES_PER_ROUND = parseInt(process.env.CHOICES_PER_ROUND || '4', 10);
const TIMEZONE = process.env.TZ || 'UTC';
const CURATED_FALLBACK = (process.env.CURATED || 'yeet,stan,ghosting,flex,salty,woke,clout,simp,thirsty,lit,sus,vibe').split(',');

// Helper: fetch Urban Dictionary definitions with caching
async function fetchUrban(term) {
  const key = `ud:${term.toLowerCase()}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const url = `http://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`;
  try {
    const r = await fetch(url, { timeout: 8000 });
    if (!r.ok) return { list: [] };
    const data = await r.json();
    cache.set(key, data);
    return data;
  } catch (e) {
    return { list: [] };
  }
}

// Simple distractor generator (replace with OpenAI if desired)
function simpleDistractors(word, correct, count) {
  const templates = [
    `A slang term meaning "${word}" used to describe someone who is overly dramatic.`,
    `A playful insult for a person who tries too hard to impress others.`,
    `A term for the feeling of mild embarrassment after making a small mistake.`,
    `A slang word for a spontaneous celebration or shout of excitement.`,
    `A phrase used to describe someone who is extremely confident in a silly way.`
  ];
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(templates[Math.floor(Math.random() * templates.length)]);
  }
  return out;
}

// Pick an unused word from words table; fallback to curated list
async function pickUnusedWord() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT w.id, w.word FROM words w
      LEFT JOIN words_used wu ON wu.word_id = w.id
      WHERE wu.id IS NULL
      ORDER BY random()
      LIMIT 1
    `);
    if (res.rows.length) return res.rows[0];
  } finally {
    client.release();
  }
  const pick = CURATED_FALLBACK[Math.floor(Math.random() * CURATED_FALLBACK.length)];
  return { id: null, word: pick };
}

// Mark a word as used for a date
async function markWordUsed(wordId, word, usedOn) {
  const client = await pool.connect();
  try {
    if (wordId) {
      await client.query(
        `INSERT INTO words_used (word_id, word, used_on) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [wordId, word, usedOn]
      );
    } else {
      await client.query(
        `INSERT INTO words_used (word, used_on) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [word, usedOn]
      );
    }
  } finally {
    client.release();
  }
}

// Build a single round
async function buildRound(word) {
  const ud = await fetchUrban(word);
  const list = (ud && ud.list) || [];
  const correct = list.length ? list.sort((a,b)=> (b.thumbs_up||0)-(a.thumbs_up||0))[0].definition : `A slang term related to ${word}.`;
  const otherReal = list.length > 1 ? list[1].definition : null;
  const distractorCount = CHOICES_PER_ROUND - (otherReal ? 2 : 1);
  const distractors = simpleDistractors(word, correct, distractorCount);
  const choices = [];
  choices.push({ id: uuidv4(), text: correct, isReal: true });
  if (otherReal) choices.push({ id: uuidv4(), text: otherReal, isReal: true });
  distractors.forEach(d => choices.push({ id: uuidv4(), text: d, isReal: false }));
  while (choices.length < CHOICES_PER_ROUND) choices.push({ id: uuidv4(), text: `A slang meaning related to ${word}.`, isReal: false });
  // shuffle
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  const correctChoiceId = choices.find(c => c.isReal).id;
  return { word, choices, correctChoiceId };
}

// Build a full game for a date
async function buildGameForDate(gameDate) {
  const rounds = [];
  const usedWordsToday = new Set();
  for (let i = 0; i < ROUNDS; i++) {
    let attempts = 0;
    let picked = null;
    while (attempts < 10) {
      const candidate = await pickUnusedWord();
      const candidateWord = candidate.word.toLowerCase();
      if (!usedWordsToday.has(candidateWord)) {
        picked = candidate;
        break;
      }
      attempts++;
    }
    if (!picked) {
      const fallback = CURATED_FALLBACK.find(w => !usedWordsToday.has(w)) || CURATED_FALLBACK[0];
      picked = { id: null, word: fallback };
    }
    const round = await buildRound(picked.word);
    rounds.push(round);
    await markWordUsed(picked.id, picked.word, gameDate);
    usedWordsToday.add(picked.word.toLowerCase());
  }

  const game = { gameId: uuidv4(), rounds, createdAt: new Date().toISOString() };
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO games (id, game_date, payload) VALUES ($1,$2,$3) ON CONFLICT (game_date) DO NOTHING`,
      [game.gameId, gameDate, game]
    );
  } finally {
    client.release();
  }
  return game;
}

// Scheduler: run at midnight in configured timezone
cron.schedule('0 0 * * *', async () => {
  try {
    const gameDate = new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
    const client = await pool.connect();
    try {
      const r = await client.query('SELECT id FROM games WHERE game_date = $1', [gameDate]);
      if (r.rows.length) return;
    } finally {
      client.release();
    }
    await buildGameForDate(gameDate);
    console.log(`Daily game created for ${gameDate}`);
  } catch (err) {
    console.error('Scheduler error', err);
  }
}, { timezone: TIMEZONE });

// Endpoints
app.get('/game/today', async (req, res) => {
  try {
    const gameDate = new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
    const client = await pool.connect();
    try {
      const r = await client.query('SELECT payload FROM games WHERE game_date = $1', [gameDate]);
      if (r.rows.length) return res.json(r.rows[0].payload);
      const game = await buildGameForDate(gameDate);
      return res.json(game);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Admin create for a specific date
app.post('/game/create', async (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'date required' });
  try {
    const game = await buildGameForDate(date);
    res.json(game);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Raw UD define endpoint
app.get('/word/define', async (req, res) => {
  const term = (req.query.term || '').trim();
  if (!term) return res.status(400).json({ error: 'term required' });
  const data = await fetchUrban(term);
  res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));

// server.js
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const NodeCache = require('node-cache');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
app.use(express.json());

const cache = new NodeCache({ stdTTL: 60 * 10 });

const ROUNDS = parseInt(process.env.ROUNDS || '5', 10);
const CHOICES_PER_ROUND = parseInt(process.env.CHOICES_PER_ROUND || '4', 10);
const TIMEZONE = process.env.TZ || 'UTC';
const CURATED_FALLBACK = (process.env.CURATED || 'yeet,stan,ghosting,flex,salty,woke,clout,simp,thirsty,lit,sus,vibe').split(',');

// fetch Urban Dictionary with caching
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

// simple distractors
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

// pick an unused word from words table; fallback to curated list
async function pickUnusedWord() {
  const row = await db.getUnusedWord();
  if (row) return row;
  const pick = CURATED_FALLBACK[Math.floor(Math.random() * CURATED_FALLBACK.length)];
  return { id: null, word: pick };
}

// mark word used
async function markWordUsed(wordId, word, usedOn) {
  await db.insertWordUsed(wordId, word, usedOn);
}

// build one round
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

// build full game for a date
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
  await db.insertGame(game.gameId, gameDate, game);
  return game;
}

// scheduler at midnight in configured timezone
cron.schedule('0 0 * * *', async () => {
  try {
    const gameDate = new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
    const exists = await db.getGameByDate(gameDate);
    if (exists) {
      console.log(`Game for ${gameDate} already exists`);
      return;
    }
    await buildGameForDate(gameDate);
    console.log(`Daily game created for ${gameDate}`);
  } catch (err) {
    console.error('Scheduler error', err);
  }
}, { timezone: TIMEZONE });

// endpoints
app.get('/game/today', async (req, res) => {
  try {
    const gameDate = new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
    const g = await db.getGameByDate(gameDate);
    if (g) return res.json(g.payload);
    const game = await buildGameForDate(gameDate);
    return res.json(game);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

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

app.get('/word/define', async (req, res) => {
  const term = (req.query.term || '').trim();
  if (!term) return res.status(400).json({ error: 'term required' });
  const data = await fetchUrban(term);
  res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));

// Static frontend: uses public/words.json, localStorage for stats, simulates ads
const startBtn = document.getElementById('start-btn');
const allowNSFW = document.getElementById('allow-nsfw');
const statsBtn = document.getElementById('stats-btn');
const splash = document.getElementById('splash');
const ad = document.getElementById('ad');
const skipAd = document.getElementById('skip-ad');
const roundEl = document.getElementById('round');
const wordTitle = document.getElementById('word-title');
const optionsEl = document.getElementById('options');
const progressEl = document.getElementById('progress');
const resultEl = document.getElementById('result');
const resultText = document.getElementById('result-text');
const scoreText = document.getElementById('score-text');
const playAgain = document.getElementById('play-again');
const statsPanel = document.getElementById('stats');
const statsJson = document.getElementById('stats-json');
const closeStats = document.getElementById('close-stats');

let words = [];
let gameState = null;
let currentIndex = 0;
let score = 0;
const ROUNDS = 5;

function show(el){ el.classList.remove('hidden'); }
function hide(el){ el.classList.add('hidden'); }

async function loadWords() {
  try {
    const res = await fetch('/words.json');
    words = await res.json();
  } catch (e) {
    words = [];
    console.error('Could not load words.json', e);
  }
}

function seededShuffle(arr, seed) {
  const a = arr.slice();
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  for (let i = a.length - 1; i > 0; i--) {
    h = Math.imul(h ^ i, 16777619) >>> 0;
    const j = h % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getDailyWords(count, allowNSFW) {
  const seed = new Date().toISOString().slice(0,10);
  const pool = allowNSFW ? words : words.filter(w => !w.nsfw);
  const shuffled = seededShuffle(pool, seed);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  // build options: correct + 3 distractors from pool
  return selected.map(item => {
    const others = pool.filter(p => p.id !== item.id);
    const distractors = [];
    for (let i = 0; i < 3 && others.length > 0; i++) {
      const idx = Math.floor(Math.random() * others.length);
      distractors.push(others[idx]);
      others.splice(idx, 1);
    }
    const options = [{ text: item.definition, correct: true }].concat(distractors.map(d => ({ text: d.definition, correct: false })));
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return { id: item.id, word: item.word, nsfw: !!item.nsfw, options };
  });
}

startBtn.addEventListener('click', async () => {
  hide(splash);
  show(ad);
  skipAd.disabled = true;
  setTimeout(() => { skipAd.disabled = false; }, 1200);
  if (!words.length) await loadWords();
  gameState = { date: new Date().toISOString().slice(0,10), rounds: getDailyWords(ROUNDS, allowNSFW.checked) };
});

skipAd.addEventListener('click', () => {
  hide(ad);
  startGame();
});

function startGame() {
  currentIndex = 0;
  score = 0;
  show(roundEl);
  hide(resultEl);
  renderRound();
}

function renderRound() {
  const round = gameState.rounds[currentIndex];
  wordTitle.textContent = round.word;
  optionsEl.innerHTML = '';
  round.options.forEach(opt => {
    const btn = document.createElement('div');
    btn.className = 'option';
    if (round.nsfw) btn.classList.add('nsfw');
    btn.textContent = opt.text;
    btn.addEventListener('click', () => chooseOption(opt));
    optionsEl.appendChild(btn);
  });
  progressEl.textContent = `Round ${currentIndex + 1} / ${gameState.rounds.length}`;
}

function chooseOption(opt) {
  if (opt.correct) score += 1;
  currentIndex += 1;
  if (currentIndex >= gameState.rounds.length) endGame();
  else renderRound();
}

function endGame() {
  hide(roundEl);
  show(ad);
  skipAd.disabled = false;
  skipAd.onclick = () => {
    hide(ad);
    show(resultEl);
    resultText.textContent = score === gameState.rounds.length ? 'Perfect!' : 'Finished';
    scoreText.textContent = `Score: ${score} / ${gameState.rounds.length}`;
    saveStats(score, gameState.date);
  };
}

playAgain.addEventListener('click', () => {
  startBtn.click();
});

statsBtn.addEventListener('click', () => {
  const stats = JSON.parse(localStorage.getItem('urban_quiz_stats') || '[]');
  statsJson.textContent = JSON.stringify(stats, null, 2);
  show(statsPanel);
});

closeStats.addEventListener('click', () => hide(statsPanel));

function saveStats(score, date) {
  const stats = JSON.parse(localStorage.getItem('urban_quiz_stats') || '[]');
  stats.push({ date, score, rounds: ROUNDS, ts: new Date().toISOString() });
  localStorage.setItem('urban_quiz_stats', JSON.stringify(stats));
}
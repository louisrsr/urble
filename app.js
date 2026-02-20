// app.js — Urble (fixed: removed duplicate STATS_KEY, robust start/save behavior)
(function(){
  const STATS_KEY = 'urble_stats';
  const ROUNDS = 5;
  const AD_MS = 1200;

  // DOM
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
  const reviewEl = document.getElementById('review');
  const playAgain = document.getElementById('play-again');
  const shareBtn = document.getElementById('share-score');
  const statsPanel = document.getElementById('stats');
  const statsJson = document.getElementById('stats-json');
  const closeStats = document.getElementById('close-stats');

  // State
  let words = [];
  let gameState = null;
  let currentIndex = 0;
  let score = 0;
  let selections = [];
  let adTimer = null;

  // Try to unregister old service workers (best-effort)
  if ('serviceWorker' in navigator) {
    try { navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister())).catch(()=>{}); }
    catch(e) { /* ignore */ }
  }

  function show(el){ el.classList.remove('hidden'); }
  function hide(el){ el.classList.add('hidden'); }

  async function loadWords() {
    try {
      const res = await fetch('words.json', { cache: 'no-store' });
      words = await res.json();
      window.__URBLE_DEBUG__ = window.__URBLE_DEBUG__ || {};
      window.__URBLE_DEBUG__.words = words;
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
    return selected.map(item => {
      const others = pool.filter(p => p.id !== item.id);
      const fragment = item.word.split(/\s+/)[0].toLowerCase().slice(0,4);
      const related = others.filter(o => o.word.toLowerCase().includes(fragment));
      const poolForDistractors = related.length >= 3 ? related.concat(others) : others;
      const distractors = [];
      for (let i = 0; i < 3 && poolForDistractors.length > 0; i++) {
        const idx = Math.floor(Math.random() * poolForDistractors.length);
        distractors.push(poolForDistractors[idx]);
        poolForDistractors.splice(idx, 1);
      }
      const options = [{ text: item.definition, correct: true }].concat(distractors.map(d => ({ text: d.definition, correct: false })));
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      return { id: item.id, word: item.word, nsfw: !!item.nsfw, options };
    });
  }

  // Start button: show ad and auto-start after AD_MS; skip works immediately
  startBtn.addEventListener('click', async () => {
    hide(splash);
    show(ad);
    skipAd.disabled = true;
    if (!words.length) await loadWords();
    gameState = { date: new Date().toISOString().slice(0,10), rounds: getDailyWords(ROUNDS, allowNSFW.checked) };
    selections = [];
    if (adTimer) clearTimeout(adTimer);
    adTimer = setTimeout(() => {
      skipAd.disabled = false;
      hide(ad);
      startGame();
    }, AD_MS);
  });

  skipAd.addEventListener('click', () => {
    if (adTimer) { clearTimeout(adTimer); adTimer = null; }
    hide(ad);
    startGame();
  });

  function startGame() {
    currentIndex = 0;
    score = 0;
    selections = [];
    show(roundEl);
    hide(resultEl);
    renderRound();
  }

  function renderRound() {
    const round = gameState.rounds[currentIndex];
    wordTitle.textContent = round.word;
    optionsEl.innerHTML = '';
    round.options.forEach((opt) => {
      const btn = document.createElement('div');
      btn.className = 'option';
      if (round.nsfw) btn.classList.add('nsfw');
      btn.textContent = opt.text;
      btn.addEventListener('click', () => chooseOption(opt, btn));
      optionsEl.appendChild(btn);
    });
    progressEl.textContent = `Round ${currentIndex + 1} / ${gameState.rounds.length}`;
  }

  function chooseOption(opt, btn) {
    btn.style.outline = opt.correct ? '3px solid rgba(34,197,94,0.12)' : '3px solid rgba(239,68,68,0.12)';
    const round = gameState.rounds[currentIndex];
    const chosenText = opt.text;
    const correctOpt = round.options.find(o => o.correct);
    const correctText = correctOpt ? correctOpt.text : '';
    const wasCorrect = !!opt.correct;
    selections.push({ word: round.word, chosen: chosenText, correct: correctText, correctFlag: wasCorrect, nsfw: round.nsfw });
    if (wasCorrect) score += 1;
    setTimeout(() => {
      currentIndex += 1;
      if (currentIndex >= gameState.rounds.length) endGame();
      else renderRound();
    }, 350);
  }

  function endGame() {
    hide(roundEl);
    show(ad);
    skipAd.disabled = false;
    if (adTimer) clearTimeout(adTimer);
    adTimer = setTimeout(() => {
      hide(ad);
      show(resultEl);
      resultText.textContent = score === gameState.rounds.length ? 'Perfect!' : 'Finished';
      scoreText.textContent = `Score: ${score} / ${gameState.rounds.length}`;
      renderReview();
      saveStats(score, gameState.date);
    }, AD_MS);
    skipAd.onclick = () => {
      if (adTimer) { clearTimeout(adTimer); adTimer = null; }
      hide(ad);
      show(resultEl);
      resultText.textContent = score === gameState.rounds.length ? 'Perfect!' : 'Finished';
      scoreText.textContent = `Score: ${score} / ${gameState.rounds.length}`;
      renderReview();
      saveStats(score, gameState.date);
    };
  }

  function renderReview() {
    reviewEl.innerHTML = '';
    selections.forEach((s, idx) => {
      const item = document.createElement('div');
      item.className = 'review-item';
      const wordEl = document.createElement('div');
      wordEl.className = 'word';
      wordEl.textContent = `${idx + 1}. ${s.word}${s.nsfw ? ' (NSFW)' : ''}`;
      const chosenEl = document.createElement('div');
      chosenEl.className = 'choice';
      chosenEl.innerHTML = `<strong>Your answer:</strong> ${s.chosen}`;
      const correctEl = document.createElement('div');
      correctEl.className = 'choice';
      correctEl.innerHTML = `<strong>Correct:</strong> ${s.correct}`;
      item.style.border = s.correctFlag ? '1px solid rgba(34,197,94,0.12)' : '1px solid rgba(239,68,68,0.12)';
      item.appendChild(wordEl);
      item.appendChild(chosenEl);
      item.appendChild(correctEl);
      reviewEl.appendChild(item);
    });
  }

  playAgain.addEventListener('click', () => startBtn.click());

  shareBtn.addEventListener('click', async () => {
    const text = `I scored ${score}/${ROUNDS} on Urble — Guess the Urban Dictionary definition! Can you beat me?`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Urble score', text, url: location.href }); }
      catch (e) { copyToClipboard(text); alert('Score copied to clipboard.'); }
    } else {
      copyToClipboard(text);
      alert('Score copied to clipboard. Share it with your friends!');
    }
  });

  function copyToClipboard(text) {
    try { navigator.clipboard.writeText(text); }
    catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  }

  statsBtn.addEventListener('click', () => {
    const stats = JSON.parse(localStorage.getItem(STATS_KEY) || '[]');
    statsJson.textContent = JSON.stringify(stats, null, 2);
    show(statsPanel);
  });

  closeStats.addEventListener('click', () => hide(statsPanel));

  function saveStats(score, date) {
    const stats = JSON.parse(localStorage.getItem(STATS_KEY) || '[]');
    stats.push({ date, score, rounds: ROUNDS, ts: new Date().toISOString() });
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    window.__URBLE_DEBUG__ = window.__URBLE_DEBUG__ || {};
    window.__URBLE_DEBUG__.lastSaved = { date, score };
  }

  function STATS_KEY(){ return STATS_KEY; } // simple accessor

  // Debug helper
  window.__URBLE_DEBUG__ = window.__URBLE_DEBUG__ || {};
  window.__URBLE_DEBUG__.info = () => ({
    url: location.href,
    wordsLoaded: (window.__URBLE_DEBUG__.words || []).length,
    stats: JSON.parse(localStorage.getItem(STATS_KEY) || '[]'),
    swAvailable: typeof navigator.serviceWorker !== 'undefined'
  });

  // initial load
  loadWords();
})();
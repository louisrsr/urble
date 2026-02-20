// app.js — Minimal robust Urble client
(function(){
  const STATS_KEY = 'urble_stats';
  const ROUNDS = 5;
  const AD_MS = 800;

  const $ = s => document.querySelector(s);
  const startBtn = $('#start-btn');
  const allowNSFW = $('#allow-nsfw');
  const skipAd = $('#skip-ad');
  const splash = $('#splash');
  const ad = $('#ad');
  const roundEl = $('#round');
  const resultEl = $('#result');
  const wordTitle = $('#word-title');
  const optionsEl = $('#options');
  const progressEl = $('#progress');
  const scoreText = $('#score-text');
  const resultText = $('#result-text');
  const cheekyEl = $('#cheeky');
  const reviewEl = $('#review');

  let words = [];
  let game = null;
  let idx = 0;
  let score = 0;
  let picks = [];
  let adTimer = null;

  const MESSAGES = {
    0: "0/5 — Oof. You just discovered a new dialect of confusion.",
    1: "1/5 — At least you tried. Urban mysteries remain unsolved.",
    2: "2/5 — Not bad. You’re on the outskirts of the vibe.",
    3: "3/5 — Solid. You know your slang, kind of.",
    4: "4/5 — Impressive. You’re practically a local.",
    5: "5/5 — Legendary. Urble champion. You speak fluent street."
  };

  function show(el){ el && el.classList.remove('hidden'); }
  function hide(el){ el && el.classList.add('hidden'); }

  async function loadWords(){
    try {
      const r = await fetch('words.json', {cache:'no-store'});
      words = await r.json();
    } catch(e){
      words = [];
      console.error('Failed to load words.json', e);
    }
  }

  function seededShuffle(arr, seed){
    const a = arr.slice(); let h = 2166136261 >>> 0;
    for(let i=0;i<seed.length;i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
    for(let i=a.length-1;i>0;i--){ h = Math.imul(h ^ i, 16777619) >>> 0; const j = h % (i+1); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  }

  function buildDaily(count, allowNSFWFlag){
    const seed = new Date().toISOString().slice(0,10);
    const pool = allowNSFWFlag ? words : words.filter(w=>!w.nsfw);
    const shuffled = seededShuffle(pool, seed).slice(0, Math.min(count, pool.length));
    return shuffled.map(item=>{
      const others = pool.filter(p=>p.id!==item.id);
      const distractors = [];
      for(let i=0;i<3 && others.length;i++){ const j=Math.floor(Math.random()*others.length); distractors.push(others[j]); others.splice(j,1); }
      const opts = [{text:item.definition, correct:true}].concat(distractors.map(d=>({text:d.definition, correct:false})));
      for(let i=opts.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [opts[i],opts[j]]=[opts[j],opts[i]]; }
      return { word: item.word, nsfw: !!item.nsfw, options: opts };
    });
  }

  // Start button handler
  function startHandler(){
    hide(splash);
    show(ad);
    skipAd.disabled = true;
    (async ()=>{
      if(!words.length) await loadWords();
      game = { rounds: buildDaily(ROUNDS, allowNSFW.checked), date: new Date().toISOString().slice(0,10) };
      picks = []; idx = 0; score = 0;
      if(adTimer) clearTimeout(adTimer);
      adTimer = setTimeout(()=>{ skipAd.disabled=false; hide(ad); startRound(); }, AD_MS);
    })();
  }

  function startRound(){
    show(roundEl); hide(resultEl); renderRound();
  }

  function renderRound(){
    const r = game.rounds[idx];
    wordTitle.textContent = r.word;
    optionsEl.innerHTML = '';
    r.options.forEach(opt=>{
      const el = document.createElement('div');
      el.className = 'option';
      if(r.nsfw) el.classList.add('nsfw');
      el.textContent = opt.text;
      el.addEventListener('click', ()=> chooseOption(opt, el));
      optionsEl.appendChild(el);
    });
    progressEl.textContent = `Round ${idx+1} / ${game.rounds.length}`;
  }

  function chooseOption(opt, el){
    el.style.outline = opt.correct ? '3px solid rgba(22,163,74,0.12)' : '3px solid rgba(239,68,68,0.12)';
    const r = game.rounds[idx];
    const correct = r.options.find(o=>o.correct).text;
    picks.push({ word: r.word, chosen: opt.text, correct, ok: !!opt.correct, nsfw: r.nsfw });
    if(opt.correct) score++;
    setTimeout(()=>{ idx++; if(idx>=game.rounds.length) finishGame(); else renderRound(); }, 350);
  }

  function finishGame(){
    hide(roundEl); show(ad); skipAd.disabled = false;
    if(adTimer) clearTimeout(adTimer);
    adTimer = setTimeout(()=>{ hide(ad); show(resultEl); showReview(); saveStats(); }, AD_MS);
    skipAd.onclick = ()=>{ if(adTimer){ clearTimeout(adTimer); adTimer=null; } hide(ad); show(resultEl); showReview(); saveStats(); };
  }

  function showReview(){
    resultText.textContent = score===ROUNDS ? 'Perfect!' : 'Finished';
    scoreText.textContent = `Score: ${score} / ${ROUNDS}`;
    cheekyEl.textContent = MESSAGES[score] || '';
    reviewEl.innerHTML = '';
    picks.forEach((p,i)=>{
      const it = document.createElement('div'); it.className='review-item';
      it.innerHTML = `<div class="word">${i+1}. ${p.word}${p.nsfw?' (NSFW)':''}</div>
        <div class="choice"><strong>Your answer:</strong> ${p.chosen}</div>
        <div class="choice"><strong>Correct:</strong> ${p.correct}</div>`;
      it.style.border = p.ok ? '1px solid rgba(22,163,74,0.12)' : '1px solid rgba(239,68,68,0.12)';
      reviewEl.appendChild(it);
    });
  }

  function saveStats(){
    try{
      const s = JSON.parse(localStorage.getItem(STATS_KEY) || '[]');
      s.push({ date: game.date, score, rounds: ROUNDS, ts: new Date().toISOString() });
      localStorage.setItem(STATS_KEY, JSON.stringify(s));
    }catch(e){}
  }

  // Attach handlers safely (if element missing, log)
  if(startBtn) startBtn.addEventListener('click', startHandler);
  else console.error('Start button (#start-btn) not found in DOM');

  if(skipAd) skipAd.addEventListener('click', ()=>{ if(adTimer){ clearTimeout(adTimer); adTimer=null; } hide(ad); startRound(); });

  // Expose debug helper
  window.__URBLE_DEBUG__ = window.__URBLE_DEBUG__ || {};
  window.__URBLE_DEBUG__.info = ()=>({ words: words.length, stats: JSON.parse(localStorage.getItem(STATS_KEY)||'[]') });

  // initial load attempt
  loadWords();
})();
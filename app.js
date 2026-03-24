document.addEventListener("DOMContentLoaded", () => {
  const els = {
    startBtn: document.getElementById("start-btn"),
    splash: document.getElementById("splash"),
    ad: document.getElementById("ad"),
    skipAdBtn: document.getElementById("skip-ad"),
    round: document.getElementById("round"),
    result: document.getElementById("result"),
    statsBtn: document.getElementById("stats-btn"),
    closeStats: document.getElementById("close-stats"),
    statsModal: document.getElementById("stats-modal"),
    statsContent: document.getElementById("stats-content"),
    wordTitle: document.getElementById("word-title"),
    optionsContainer: document.getElementById("options"),
    progressFill: document.getElementById("progress-fill"),
    progressBar: document.getElementById("progress-bar"),
    resultText: document.getElementById("result-text"),
    scoreText: document.getElementById("score-text"),
    showAnswersBtn: document.getElementById("show-answers"),
    shareBtn: document.getElementById("share-btn"),
    titleClickable: document.getElementById("title-clickable"),
    contactBtn: document.getElementById("contact-btn")
  };

  let gameWords = [];
  let currentRound = 0;
  let score = 0;
  let playerAnswers = [];
  const today = new Date().toDateString();
  const TOTAL_ROUNDS = 5;

  /* =========================
     SAVE / LOAD PROGRESS
  ========================== */
  const saveProgress = () => {
    if (gameWords.length === 0) return;
    localStorage.setItem("urbleCurrentGame", JSON.stringify({
      gameWords, currentRound, score, playerAnswers, date: today
    }));
  };

  const loadProgress = () => {
    const saved = localStorage.getItem("urbleCurrentGame");
    if (!saved) return false;
    const p = JSON.parse(saved);
    if (p.date !== today) {
      localStorage.removeItem("urbleCurrentGame");
      return false;
    }
    gameWords = p.gameWords;
    currentRound = p.currentRound;
    score = p.score;
    playerAnswers = p.playerAnswers || [];
    return true;
  };

  const clearProgress = () => localStorage.removeItem("urbleCurrentGame");

  /* =========================
     SPLASH MESSAGE (IMMEDIATE)
  ========================== */
  const updateSplashMessage = () => {
    els.splash.innerHTML = "";

    const hasProgress = loadProgress();

    if (hasProgress && currentRound < TOTAL_ROUNDS) {
      const msg = document.createElement("p");
      msg.textContent = `You are on question ${currentRound + 1}/5 — let's finish this!`;
      msg.style.color = "#e4f53e";
      msg.style.fontWeight = "600";
      msg.style.textAlign = "center";
      msg.style.marginTop = "30px";
      msg.style.fontSize = "1.15rem";
      els.splash.appendChild(msg);
    } else {
      const welcome = document.createElement("p");
      welcome.textContent = "Welcome back!";
      welcome.style.color = "var(--muted)";
      welcome.style.textAlign = "center";
      welcome.style.marginTop = "30px";
      els.splash.appendChild(welcome);
    }
  };

  updateSplashMessage();   // ← Runs immediately on page load

  /* =========================
     START GAME
  ========================== */
  els.startBtn.addEventListener("click", async () => {
    hideSection(els.splash);
    els.startBtn.classList.add("hidden");
    els.statsBtn.style.display = "none";
    showSection(els.ad);
    els.skipAdBtn.disabled = true;
    setTimeout(() => els.skipAdBtn.disabled = false, 2500);
  });

  els.skipAdBtn.addEventListener("click", () => {
    hideSection(els.ad);
    showSection(els.progressBar);
    startGame();
  });

  const startGame = () => {
    document.body.classList.add("game-started");
    hideSection(els.result);
    showSection(els.round);
    nextRound();
  };

  const nextRound = () => {
    if (currentRound >= TOTAL_ROUNDS) return endGame();

    const data = gameWords[currentRound];
    els.wordTitle.textContent = cleanText(data.word);
    els.progressFill.style.width = `${((currentRound + 1) / TOTAL_ROUNDS) * 100}%`;

    const answers = shuffleSeed([data.correct, ...data.wrong], currentRound);
    els.optionsContainer.innerHTML = "";

    answers.forEach(answer => {
      const btn = document.createElement("button");
      btn.textContent = cleanText(answer);
      btn.addEventListener("click", () => handleAnswer(btn, answer, data.correct));
      els.optionsContainer.appendChild(btn);
    });

    saveProgress();
  };

  const handleAnswer = (btn, selected, correct) => {
    playerAnswers[currentRound] = selected;
    const allBtns = els.optionsContainer.querySelectorAll("button");
    allBtns.forEach(b => {
      b.disabled = true;
      if (b.textContent === cleanText(correct)) b.classList.add("option-correct");
      if (b.textContent === cleanText(selected) && selected !== correct) b.classList.add("option-wrong");
    });
    if (selected === correct) score++;
    currentRound++;
    setTimeout(nextRound, 1400);
  };

  const endGame = () => {
    hideSection(els.round);
    showSection(els.result);
    els.progressFill.style.width = "100%";
    els.resultText.textContent = "Game Complete!";
    els.scoreText.textContent = `You scored ${score} out of ${TOTAL_ROUNDS}`;
    els.statsBtn.style.display = "block";
    clearProgress();
    updateStats();
  };

  const updateStats = () => {
    const stats = getStats();
    stats.gamesPlayed++;
    if (score >= 3) stats.wins++;
    stats.lastPlayed = today;
    if (!stats.scoreHistory) stats.scoreHistory = [];
    stats.scoreHistory.push(score);
    saveStats(stats);
  };

  /* Stats Modal */
  els.statsBtn.addEventListener("click", () => {
    const stats = getStats();
    let counts = [0,0,0,0,0,0];
    if (stats.scoreHistory) stats.scoreHistory.forEach(s => counts[s]++);

    let bars = `<div style="display:flex; gap:8px; justify-content:center; margin:20px 0;">`;
    for (let i = 0; i <= 5; i++) {
      const color = i >= 4 ? '#22c55e' : i >= 3 ? '#eab308' : '#ef4444';
      bars += `<div style="text-align:center;">
        <div style="background:${color}; width:32px; height:${Math.max(30, counts[i]*12)}px; border-radius:6px; margin:0 auto;"></div>
        <div style="font-size:0.85rem;">${i}/5</div>
        <div style="font-size:0.8rem; color:var(--muted);">${counts[i]}</div>
      </div>`;
    }
    bars += `</div>`;

    els.statsContent.innerHTML = `
      <p><strong>Games Played:</strong> ${stats.gamesPlayed}</p>
      <p><strong>Wins (3+):</strong> ${stats.wins || 0}</p>
      <p><strong>Overall Accuracy:</strong> ${stats.scoreHistory ? Math.round((stats.scoreHistory.reduce((a,b)=>a+b,0) / (stats.scoreHistory.length * 5)) * 100) : 0}%</p>
      <h3 style="text-align:center; margin:20px 0 10px;">Score Distribution</h3>
      ${bars}
    `;
    showSection(els.statsModal);
  });

  els.closeStats.addEventListener("click", () => hideSection(els.statsModal));

  /* Other buttons */
  els.contactBtn?.addEventListener("click", () => window.location.href = "/contact.html");
  els.titleClickable?.addEventListener("click", () => location.reload());

  if (els.titleClickable) {
    const h1 = els.titleClickable.querySelector("h1");
    els.titleClickable.addEventListener("mouseenter", () => h1.style.color = "#e4f53e");
    els.titleClickable.addEventListener("mouseleave", () => h1.style.color = "#ffffff");
  }

  window.addEventListener("beforeunload", saveProgress);
});

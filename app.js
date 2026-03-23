document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     DOM ELEMENTS
  ========================== */
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
  };

  let gameWords = [];
  let currentRound = 0;
  let score = 0;
  const today = new Date().toDateString();
  const TOTAL_ROUNDS = 5;

  /* =========================
     UTILS
  ========================== */
  const getStats = () => JSON.parse(localStorage.getItem("urbleStats")) || {
    gamesPlayed: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    lastPlayed: null,
  };

  const saveStats = (stats) => localStorage.setItem("urbleStats", JSON.stringify(stats));

  const shuffleSeed = (array, seed) => {
    const result = array.slice();
    let s = seed;
    for (let i = result.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  // NEW: Load daily words from your Worker
  async function loadDailyWords() {
    try {
      const res = await fetch("https://urble.louisrsr.workers.dev/daily");
      if (!res.ok) throw new Error(`Daily fetch failed: ${res.status}`);
      gameWords = await res.json();

      // Ensure we have exactly TOTAL_ROUNDS (or fallback)
      if (gameWords.length !== TOTAL_ROUNDS) {
        throw new Error("Incomplete daily data");
      }
    } catch (err) {
      console.error("Failed to load daily words:", err);
      showMessage("Today's words aren't ready yet. Try again soon or play a practice round.");
      // Optional: keep old hardcoded WORDS as very last resort fallback
      gameWords = [
        { word: "Rizz", correct: "Short for charisma, especially in flirting.", wrong: ["A gaming strategy.", "An energy drink.", "A fashion brand."] },
        // ... add 4 more if you want
      ].slice(0, TOTAL_ROUNDS);
    }
  }

  const showSection = (section) => {
    section.classList.remove("hidden");
    setTimeout(() => section.classList.add("visible"), 20);
  };

  const hideSection = (section) => {
    section.classList.remove("visible");
    setTimeout(() => section.classList.add("hidden"), 300);
  };

  const showMessage = (msg, duration = 2800) => {
    const msgEl = document.createElement("p");
    msgEl.textContent = msg;
    msgEl.style.color = "var(--muted)";
    msgEl.style.textAlign = "center";
    msgEl.style.marginTop = "16px";
    els.splash.appendChild(msgEl);
    setTimeout(() => msgEl.remove(), duration);
  };

  /* =========================
     START FLOW
  ========================== */
  els.startBtn.addEventListener("click", async () => {
    const stats = getStats();
    if (stats.lastPlayed === today) {
      showMessage("You've already played today's round! Come back tomorrow.");
      return;
    }

    // Load daily words before showing ad
    await loadDailyWords();

    hideSection(els.splash);
    els.startBtn.classList.add("hidden");
    showSection(els.ad);
    els.skipAdBtn.disabled = true;
    setTimeout(() => (els.skipAdBtn.disabled = false), 2500);
  });

  els.skipAdBtn.addEventListener("click", () => {
    hideSection(els.ad);
    showSection(els.progressBar);
    startGame();
  });

  /* =========================
     GAME
  ========================== */
  const startGame = () => {
    currentRound = 0;
    score = 0;
    hideSection(els.result);
    showSection(els.round);
    // gameWords already loaded from loadDailyWords()
    nextRound();
  };

  const nextRound = () => {
    if (currentRound >= TOTAL_ROUNDS) {
      endGame();
      return;
    }

    const data = gameWords[currentRound];
    els.wordTitle.textContent = data.word;
    els.progressFill.style.width = `${((currentRound + 1) / TOTAL_ROUNDS) * 100}%`;

    // Shuffle correct + all wrong options
    const answers = shuffleSeed([data.correct, ...data.wrong], currentRound + 42);

    els.optionsContainer.innerHTML = "";
    answers.forEach((answer) => {
      const btn = document.createElement("button");
      btn.textContent = answer;
      btn.setAttribute("aria-label", `Option: ${answer}`);
      btn.addEventListener("click", () => handleAnswer(btn, answer === data.correct, data.correct));
      els.optionsContainer.appendChild(btn);
    });
  };

  const handleAnswer = (clickedBtn, isCorrect, correctAnswer) => {
    const buttons = els.optionsContainer.querySelectorAll("button");
    buttons.forEach((btn) => {
      btn.disabled = true;
      if (btn.textContent === correctAnswer) {
        btn.classList.add("option-correct");
      }
    });

    if (isCorrect) {
      score++;
      clickedBtn.classList.add("option-correct");
    } else {
      clickedBtn.classList.add("option-wrong");
    }

    currentRound++;
    setTimeout(nextRound, 1400);
  };

  const endGame = () => {
    hideSection(els.round);
    showSection(els.result);
    els.progressFill.style.width = "100%";
    els.resultText.textContent = "Game Complete!";
    els.scoreText.textContent = `You scored ${score} out of ${TOTAL_ROUNDS}`;
    updateStats();
  };

  const updateStats = () => {
    const stats = getStats();
    stats.gamesPlayed++;
    if (score >= 3) stats.wins++;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (stats.lastPlayed === yesterday) {
      stats.currentStreak++;
    } else if (stats.lastPlayed !== today) {
      stats.currentStreak = 1;
    }
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    stats.lastPlayed = today;
    saveStats(stats);
  };

  /* =========================
     STATS MODAL
  ========================== */
  els.statsBtn.addEventListener("click", () => {
    const stats = getStats();
    els.statsContent.innerHTML = `
      <p><strong>Games Played:</strong> ${stats.gamesPlayed}</p>
      <p><strong>Wins:</strong> ${stats.wins}</p>
      <p><strong>Current Streak:</strong> ${stats.currentStreak}</p>
      <p><strong>Max Streak:</strong> ${stats.maxStreak}</p>
    `;
    showSection(els.statsModal);
  });

  els.closeStats.addEventListener("click", () => hideSection(els.statsModal));
});

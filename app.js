document.addEventListener("DOMContentLoaded", () => {
  const els = {
    startBtn: document.getElementById("start-btn"),
    splash: document.getElementById("splash"),
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

  const getStats = () => JSON.parse(localStorage.getItem("urbleStats")) || {
    gamesPlayed: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    lastPlayed: null,
    scoreHistory: []
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

  const cleanText = (text) => text ? text.replace(/\[([^\]]+)\]/g, "$1").replace(/\([nv]\.\)/gi, "").replace(/\s+/g, " ").trim() : "";

  const saveProgress = () => {
    if (gameWords.length === 0) return;
    localStorage.setItem("urbleCurrentGame", JSON.stringify({ gameWords, currentRound, score, playerAnswers, date: today }));
  };

  const loadProgress = () => {
    const saved = localStorage.getItem("urbleCurrentGame");
    if (!saved) return false;
    const p = JSON.parse(saved);
    if (p.date !== today) {
      localStorage.removeItem("urbleCurrentGame");
      return false;
    }
    gameWords = p.gameWords || [];
    currentRound = p.currentRound || 0;
    score = p.score || 0;
    playerAnswers = p.playerAnswers || [];
    return true;
  };

  const clearProgress = () => localStorage.removeItem("urbleCurrentGame");

  async function loadDailyWords() {
    try {
      const res = await fetch("https://urble.louisrsr.workers.dev/daily");
      gameWords = await res.json();
    } catch (e) {
      gameWords = [
        { word: "Rizz", correct: "Short for charisma, especially in flirting.", wrong: ["Gaming strategy.", "Energy drink.", "Fashion brand."] },
        { word: "Mid", correct: "Something average or mediocre.", wrong: ["Extremely good.", "Yoga pose.", "Hairstyle."] },
        { word: "Sus", correct: "Suspicious or questionable.", wrong: ["Sushi dish.", "Superhero.", "Workout style."] },
        { word: "Cap", correct: "A lie or falsehood.", wrong: ["Hat.", "Beverage.", "Software term."] },
        { word: "Flex", correct: "To show off.", wrong: ["Muscle exercise.", "Phone brand.", "Dance move."] }
      ];
    }
  }

  const showSection = (s) => { s.classList.remove("hidden"); setTimeout(() => s.classList.add("visible"), 20); };
  const hideSection = (s) => { s.classList.remove("visible"); setTimeout(() => s.classList.add("hidden"), 300); };

  const updateSplash = () => {
    els.splash.innerHTML = "";

    const hasProgress = loadProgress();

    if (hasProgress && currentRound < TOTAL_ROUNDS) {
      els.splash.innerHTML = `<p style="color:#e4f53e;font-weight:600;text-align:center;margin-top:40px;font-size:1.15rem;">You are on question ${currentRound + 1}/5 — let's finish this!</p>`;
    } else if (hasProgress && currentRound >= TOTAL_ROUNDS) {
      els.splash.innerHTML = `<p style="color:#e4f53e;font-weight:600;text-align:center;margin-top:40px;font-size:1.15rem;">Game Complete!</p>`;
      showSection(els.result);
      els.resultText.textContent = "Game Complete!";
      els.scoreText.textContent = `You scored ${score} out of ${TOTAL_ROUNDS}`;
      els.statsBtn.style.display = "block";
      return;
    } else {
      els.splash.innerHTML = `<p style="color:var(--muted);text-align:center;margin-top:40px;">Welcome back!</p>`;
    }
  };

  updateSplash();

  els.startBtn.addEventListener("click", async () => {
    const hasProgress = loadProgress();

    if (hasProgress && currentRound >= TOTAL_ROUNDS) {
      hideSection(els.splash);
      els.startBtn.classList.add("hidden");
      els.statsBtn.style.display = "block";
      showSection(els.result);
      els.resultText.textContent = "Game Complete!";
      els.scoreText.textContent = `You scored ${score} out of ${TOTAL_ROUNDS}`;
      return;
    }

    hideSection(els.splash);
    els.startBtn.classList.add("hidden");
    els.statsBtn.style.display = "none";
    await loadDailyWords();
    startGame();
  });

  const startGame = () => {
    document.body.classList.add("game-started");
    hideSection(els.result);
    showSection(els.round);
    nextRound();
  };

  const nextRound = () => {
    if (currentRound >= TOTAL_ROUNDS || !gameWords[currentRound]) {
      endGame();
      return;
    }

    const data = gameWords[currentRound];
    els.wordTitle.textContent = cleanText(data.word);
    els.progressFill.style.width = `${((currentRound + 1) / TOTAL_ROUNDS) * 100}%`;

    const answers = shuffleSeed([data.correct, ...(data.wrong || [])], currentRound + Date.now() % 100);
    els.optionsContainer.innerHTML = "";

    answers.forEach(answer => {
      const btn = document.createElement("button");
      btn.textContent = cleanText(answer);
      btn.addEventListener("click", () => handleAnswer(btn, answer, data.correct));
      els.optionsContainer.appendChild(btn);
    });

    saveProgress();
  };

  const handleAnswer = (clickedBtn, selectedAnswer, correctAnswer) => {
    playerAnswers[currentRound] = selectedAnswer;

    els.optionsContainer.querySelectorAll("button").forEach(btn => {
      btn.disabled = true;
      if (btn.textContent === cleanText(correctAnswer)) btn.classList.add("option-correct");
      if (btn.textContent === cleanText(selectedAnswer) && selectedAnswer !== correctAnswer) btn.classList.add("option-wrong");
    });

    if (selectedAnswer === correctAnswer) score++;

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

  /* Show Answers */
  els.showAnswersBtn.addEventListener("click", () => {
    let html = `<h2 style="font-family:'Lora',serif;margin-bottom:20px;text-align:center;">Your Answers</h2>`;

    gameWords.forEach((data, i) => {
      const user = cleanText(playerAnswers[i] || "No answer");
      const correct = cleanText(data ? data.correct : "");
      const isCorrect = playerAnswers[i] === (data ? data.correct : "");

      html += `
        <div style="margin:16px 0;padding:16px;border:1px solid ${isCorrect ? '#22c55e' : '#ef4444'};border-radius:12px;background:rgba(29,35,57,0.6);">
          <div style="font-family:'Lora',serif;font-size:1.4rem;margin-bottom:8px;font-weight:700;">${cleanText(data ? data.word : "Unknown")}</div>
          <div><strong>Your answer:</strong> ${user}</div>
          <div><strong>Correct:</strong> ${correct}</div>
        </div>
      `;
    });

    els.statsContent.innerHTML = html;
    showSection(els.statsModal);
  });

  /* Stats */
  els.statsBtn.addEventListener("click", () => {
    const stats = getStats();
    let counts = [0,0,0,0,0,0];
    if (stats.scoreHistory) stats.scoreHistory.forEach(s => counts[s] = (counts[s]||0) + 1);

    let graph = `<div style="display:flex;gap:8px;justify-content:center;margin:20px 0;">`;
    for (let i = 0; i <= 5; i++) {
      const color = i >= 4 ? '#22c55e' : i >= 3 ? '#eab308' : '#ef4444';
      graph += `
        <div style="text-align:center;">
          <div style="background:${color};width:32px;height:${Math.max(30, (counts[i]||0)*12)}px;border-radius:6px;margin:0 auto;"></div>
          <div style="font-size:0.85rem;margin-top:6px;">${i}/5</div>
          <div style="font-size:0.8rem;color:var(--muted);">${counts[i]||0}</div>
        </div>`;
    }
    graph += `</div>`;

    els.statsContent.innerHTML = `
      <p><strong>Games Played:</strong> ${stats.gamesPlayed}</p>
      <p><strong>Overall Accuracy:</strong> ${stats.scoreHistory ? Math.round((stats.scoreHistory.reduce((a,b)=>a+b,0)/(stats.scoreHistory.length*5))*100) : 0}%</p>
      <h3 style="margin:20px 0 10px;text-align:center;">Score Distribution</h3>
      ${graph}
    `;
    showSection(els.statsModal);
  });

  els.closeStats.addEventListener("click", () => hideSection(els.statsModal));

  els.contactBtn?.addEventListener("click", () => window.location.href = "/contact.html");

  els.shareBtn?.addEventListener("click", () => {
    let grid = `URBLE ${score}/${TOTAL_ROUNDS}\n`;
    gameWords.forEach((_, i) => grid += playerAnswers[i] === gameWords[i].correct ? "🟩" : "🟥");
    grid += `\n\nPlay at https://www.urble.co.uk`;
    navigator.clipboard.writeText(grid).then(() => alert("Copied to clipboard!")).catch(() => prompt("Copy this:\n\n" + grid));
  });

  els.titleClickable?.addEventListener("click", () => {
    document.body.classList.remove("game-started");
    hideSection(els.round);
    hideSection(els.result);
    hideSection(els.ad);
    hideSection(els.progressBar);
    showSection(els.splash);
    els.startBtn.classList.remove("hidden");
    els.statsBtn.style.display = "block";
    updateSplash();
  });

  if (els.titleClickable) {
    const h1 = els.titleClickable.querySelector("h1");
    els.titleClickable.style.cursor = "pointer";
    els.titleClickable.addEventListener("mouseenter", () => h1.style.color = "#e4f53e");
    els.titleClickable.addEventListener("mouseleave", () => h1.style.color = "#ffffff");
  }

  window.addEventListener("beforeunload", saveProgress);
});

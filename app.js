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
    playAgainBtn: document.getElementById("play-again"),
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
    scoreHistory: [] // array of scores per game (e.g. [3,5,2,4])
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

  const cleanText = (text) => {
    if (!text) return "";
    return text.replace(/\[([^\]]+)\]/g, "$1").replace(/\([nv]\.\)/gi, "").replace(/\s+/g, " ").trim();
  };

  async function loadDailyWords() {
    try {
      const res = await fetch("https://urble.louisrsr.workers.dev/daily");
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      gameWords = await res.json();
      if (gameWords.length !== TOTAL_ROUNDS) throw new Error("Incomplete data");
    } catch (err) {
      console.error("Load failed:", err);
      showMessage("Couldn't load daily words. Using demo mode.", 8000);
      gameWords = [
        { word: "Rizz", correct: "Short for charisma, especially in flirting.", wrong: ["Gaming strategy.", "Energy drink.", "Fashion brand."] },
        { word: "Mid", correct: "Something average or mediocre.", wrong: ["Extremely good.", "Yoga pose.", "Hairstyle."] },
        { word: "Sus", correct: "Suspicious or questionable.", wrong: ["Sushi dish.", "Superhero.", "Workout style."] },
        { word: "Cap", correct: "A lie or falsehood.", wrong: ["Hat.", "Beverage.", "Software term."] },
        { word: "Flex", correct: "To show off.", wrong: ["Muscle exercise.", "Phone brand.", "Dance move."] }
      ];
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

  const showMessage = (msg, duration = 5000) => {
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
    await loadDailyWords();

    hideSection(els.splash);
    els.startBtn.classList.add("hidden");
    els.statsBtn.style.display = "none";
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
    document.body.classList.add("game-started");
    currentRound = 0;
    score = 0;
    playerAnswers = [];
    hideSection(els.result);
    showSection(els.round);
    nextRound();
  };

  const nextRound = () => {
    if (currentRound >= TOTAL_ROUNDS) {
      endGame();
      return;
    }

    const data = gameWords[currentRound];
    els.wordTitle.textContent = cleanText(data.word);
    els.progressFill.style.width = `${((currentRound + 1) / TOTAL_ROUNDS) * 100}%`;

    const answers = shuffleSeed([data.correct, ...data.wrong], currentRound + Date.now() % 100);
    els.optionsContainer.innerHTML = "";

    answers.forEach((answer) => {
      const btn = document.createElement("button");
      btn.textContent = cleanText(answer);
      btn.setAttribute("aria-label", `Option: ${cleanText(answer)}`);
      btn.addEventListener("click", () => handleAnswer(btn, answer, data.correct));
      els.optionsContainer.appendChild(btn);
    });
  };

  const handleAnswer = (clickedBtn, selectedAnswer, correctAnswer) => {
    playerAnswers[currentRound] = selectedAnswer;

    const buttons = els.optionsContainer.querySelectorAll("button");
    buttons.forEach((btn) => {
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
    updateStats();
  };

  const updateStats = () => {
    const stats = getStats();
    stats.gamesPlayed++;
    if (score >= 3) stats.wins++;
    stats.lastPlayed = today;

    // Save score history for stats
    if (!stats.scoreHistory) stats.scoreHistory = [];
    stats.scoreHistory.push(score);

    saveStats(stats);
  };

  /* =========================
     STATS MODAL (Improved)
  ========================== */
  els.statsBtn.addEventListener("click", () => {
    const stats = getStats();
    let totalGames = stats.gamesPlayed || 0;
    let totalCorrect = 0;
    let scoreCounts = [0,0,0,0,0,0]; // index 0 = 0/5, 1 = 1/5, ..., 5 = 5/5

    if (stats.scoreHistory && stats.scoreHistory.length > 0) {
      stats.scoreHistory.forEach(s => {
        totalCorrect += s;
        if (s >= 0 && s <= 5) scoreCounts[s]++;
      });
    }

    const overallScore = totalGames > 0 ? Math.round((totalCorrect / (totalGames * TOTAL_ROUNDS)) * 100) : 0;

    let html = `
      <p><strong>Games Played:</strong> ${totalGames}</p>
      <p><strong>Total Correct Answers:</strong> ${totalCorrect} / ${totalGames * TOTAL_ROUNDS}</p>
      <p><strong>Overall Accuracy:</strong> ${overallScore}%</p>
      <p><strong>Wins (3+):</strong> ${stats.wins || 0}</p>
      <p><strong>Current Streak:</strong> ${stats.currentStreak || 0}</p>
      <p><strong>Max Streak:</strong> ${stats.maxStreak || 0}</p>
      <hr>
      <h3>Score Distribution</h3>
      <div class="pie-chart" style="margin:20px auto; width:200px; height:200px; border-radius:50%; background: conic-gradient(
        #22c55e ${scoreCounts[5]/totalGames*360}deg,
        #a3e635 ${scoreCounts[5]/totalGames*360}deg ${ (scoreCounts[5]+scoreCounts[4])/totalGames*360 }deg,
        #eab308 ${ (scoreCounts[5]+scoreCounts[4])/totalGames*360 }deg ${ (scoreCounts[5]+scoreCounts[4]+scoreCounts[3])/totalGames*360 }deg,
        #f59e0b ${ (scoreCounts[5]+scoreCounts[4]+scoreCounts[3])/totalGames*360 }deg ${ (scoreCounts[5]+scoreCounts[4]+scoreCounts[3]+scoreCounts[2])/totalGames*360 }deg,
        #ef4444 ${ (scoreCounts[5]+scoreCounts[4]+scoreCounts[3]+scoreCounts[2])/totalGames*360 }deg 360deg
      );"></div>
      <p style="text-align:center; margin-top:10px;">
        5/5: ${scoreCounts[5]} • 4/5: ${scoreCounts[4]} • 3/5: ${scoreCounts[3]} • 2/5: ${scoreCounts[2]} • 1/5: ${scoreCounts[1]} • 0/5: ${scoreCounts[0]}
      </p>
    `;

    els.statsContent.innerHTML = html;
    showSection(els.statsModal);
  });

  els.closeStats.addEventListener("click", () => hideSection(els.statsModal));

  /* Clickable title - resets to start */
  els.titleClickable.addEventListener("click", () => {
    document.body.classList.remove("game-started");
    hideSection(els.round);
    hideSection(els.result);
    hideSection(els.ad);
    hideSection(els.progressBar);
    showSection(els.splash);
    els.startBtn.classList.remove("hidden");
    els.statsBtn.style.display = "block";
  });

  /* Contact button */
  els.contactBtn.addEventListener("click", () => {
    window.open("/contact.html", "_blank");
  });

  /* Play Again */
  els.playAgainBtn?.addEventListener("click", () => {
    hideSection(els.result);
    startGame();
  });

  /* Share button (kept from previous version) */
  els.shareBtn?.addEventListener("click", () => {
    let grid = `URBLE ${score}/${TOTAL_ROUNDS}\n`;
    gameWords.forEach((_, i) => {
      grid += playerAnswers[i] === gameWords[i].correct ? "🟩" : "🟥";
    });
    grid += `\n\nPlay at https://www.urble.co.uk`;
    navigator.clipboard.writeText(grid).then(() => alert("Copied to clipboard!")).catch(() => prompt("Copy this:\n\n" + grid));
  });
});

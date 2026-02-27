document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     WORD DATABASE
  ========================== */
  const WORDS = [
    { word: "Rizz", correct: "Short for charisma, especially in flirting.", wrong: ["A gaming strategy.", "An energy drink.", "A fashion brand."] },
    { word: "Mid", correct: "Something average or mediocre.", wrong: ["Extremely good.", "A yoga pose.", "A hairstyle."] },
    { word: "Touch grass", correct: "An insult telling someone to go outside.", wrong: ["A gardening method.", "A dance move.", "A hiking technique."] },
    { word: "NPC", correct: "Someone acting robotic or unoriginal.", wrong: ["A political party.", "A coding language.", "A music genre."] },
    { word: "Delulu", correct: "Playfully delusional.", wrong: ["A cartoon character.", "A dessert.", "A sneaker brand."] },
    { word: "Sus", correct: "Suspicious or questionable.", wrong: ["A sushi dish.", "A superhero.", "A workout style."] },
    { word: "Flex", correct: "To show off.", wrong: ["A muscle exercise.", "A phone brand.", "A dance move."] },
    { word: "Cap", correct: "A lie or falsehood.", wrong: ["A hat.", "A beverage.", "A software term."] }
  ];
  const TOTAL_ROUNDS = 5;

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

  const getDailyWords = () => shuffleSeed(WORDS, Number(today.replace(/-/g, ""))).slice(0, TOTAL_ROUNDS);

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
  els.startBtn.addEventListener("click", () => {
    const stats = getStats();
    if (stats.lastPlayed === today) {
      showMessage("You've already played today's round! Come back tomorrow.");
      return;
    }
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
    gameWords = getDailyWords();
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

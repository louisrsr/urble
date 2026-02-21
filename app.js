document.addEventListener("DOMContentLoaded", () => {

  const TOTAL_ROUNDS = 5;
  const today = new Date().toISOString().split("T")[0];

  let currentRound = 0;
  let score = 0;
  let results = [];

  const words = [ /* same word list as before */ ];

  const splash = document.getElementById("splash");
  const ad = document.getElementById("ad");
  const round = document.getElementById("round");
  const result = document.getElementById("result");

  const startBtn = document.getElementById("start-btn");
  const statsBtn = document.getElementById("stats-btn");
  const statsModal = document.getElementById("stats-modal");
  const statsContent = document.getElementById("stats-content");

  const skipAdBtn = document.getElementById("skip-ad");

  const wordTitle = document.getElementById("word-title");
  const optionsContainer = document.getElementById("options");
  const progressText = document.getElementById("progress");
  const progressFill = document.getElementById("progress-fill");
  const progressBar = document.getElementById("progress-bar");

  /* =====================
     STATS STORAGE
  ===================== */

  function getStats() {
    return JSON.parse(localStorage.getItem("urbleStats")) || {
      gamesPlayed: 0,
      wins: 0,
      currentStreak: 0,
      maxStreak: 0,
      lastPlayed: null
    };
  }

  function saveStats(stats) {
    localStorage.setItem("urbleStats", JSON.stringify(stats));
  }

  /* =====================
     START GAME
  ===================== */

  startBtn.onclick = () => {
    const stats = getStats();

    if (stats.lastPlayed === today) {
      alert("You already played today.");
      return;
    }

    splash.classList.add("hidden");
    startBtn.classList.add("hidden");
    ad.classList.remove("hidden");

    skipAdBtn.disabled = true;
    setTimeout(() => skipAdBtn.disabled = false, 3000);
  };

  skipAdBtn.onclick = () => {
    ad.classList.add("hidden");
    progressBar.classList.remove("hidden");
    startGame();
  };

  function startGame() {
    currentRound = 0;
    score = 0;
    results = [];
    nextRound();
  }

  function nextRound() {
    if (currentRound >= TOTAL_ROUNDS) {
      endGame();
      return;
    }

    round.classList.remove("hidden");

    const data = words[currentRound];

    wordTitle.textContent = data.word;
    progressText.textContent = `Round ${currentRound + 1} / ${TOTAL_ROUNDS}`;
    progressFill.style.width = `${(currentRound / TOTAL_ROUNDS) * 100}%`;

    const answers = [data.correct, ...data.wrong]
      .sort(() => Math.random() - 0.5);

    optionsContainer.innerHTML = "";

    answers.forEach(answer => {
      const btn = document.createElement("button");
      btn.textContent = answer;

      btn.onclick = () => handleAnswer(btn, answer === data.correct, data.correct);

      optionsContainer.appendChild(btn);
    });
  }

  function handleAnswer(clicked, isCorrect, correctText) {
    const buttons = optionsContainer.querySelectorAll("button");

    buttons.forEach(btn => {
      btn.disabled = true;
      if (btn.textContent === correctText) {
        btn.classList.add("option-correct");
      }
    });

    if (!isCorrect) {
      clicked.classList.add("option-wrong");
      results.push("wrong");
    } else {
      score++;
      results.push("correct");
    }

    currentRound++;
    setTimeout(nextRound, 1200);
  }

  function endGame() {
    round.classList.add("hidden");
    result.classList.remove("hidden");
    progressFill.style.width = "100%";

    document.getElementById("result-text").textContent =
      score === 5 ? "Flawless." : "Game Over";

    document.getElementById("score-text").textContent =
      `You scored ${score} / 5`;

    updateStats();
  }

  function updateStats() {
    const stats = getStats();

    stats.gamesPlayed++;
    if (score >= 3) stats.wins++;

    if (stats.lastPlayed) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yDate = yesterday.toISOString().split("T")[0];

      if (stats.lastPlayed === yDate) {
        stats.currentStreak++;
      } else {
        stats.currentStreak = 1;
      }
    } else {
      stats.currentStreak = 1;
    }

    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    stats.lastPlayed = today;

    saveStats(stats);
  }

  /* =====================
     SHARE
  ===================== */

  document.getElementById("share-score").onclick = () => {
    let grid = `Urble ${score}/5\n\n`;
    results.forEach(r => grid += r === "correct" ? "🟦" : "⬛");
    navigator.clipboard.writeText(grid);
    alert("Copied to clipboard!");
  };

  /* =====================
     STATS MODAL
  ===================== */

  statsBtn.onclick = () => {
    const stats = getStats();

    statsContent.innerHTML = `
      <p>Games Played: ${stats.gamesPlayed}</p>
      <p>Wins (3+ correct): ${stats.wins}</p>
      <p>Current Streak: ${stats.currentStreak}</p>
      <p>Max Streak: ${stats.maxStreak}</p>
    `;

    statsModal.classList.remove("hidden");
  };

  document.getElementById("close-stats").onclick = () => {
    statsModal.classList.add("hidden");
  };

});

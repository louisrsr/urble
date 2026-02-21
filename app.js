document.addEventListener("DOMContentLoaded", () => {

  const TOTAL_ROUNDS = 5;
  const today = new Date().toISOString().split("T")[0];

  let currentRound = 0;
  let score = 0;
  let results = [];

  /* =====================
     WORD DATA
  ===================== */

  const words = [
    {
      word: "Touch grass",
      correct: "An insult telling someone to go outside and stop being online.",
      wrong: [
        "A gardening technique.",
        "A dance move.",
        "A vegan trend."
      ]
    },
    {
      word: "Rizz",
      correct: "Short for charisma, especially in flirting.",
      wrong: [
        "An energy drink.",
        "A gaming tactic.",
        "A crypto coin."
      ]
    },
    {
      word: "Mid",
      correct: "Something mediocre or average.",
      wrong: [
        "Extremely good.",
        "A yoga pose.",
        "A fashion brand."
      ]
    },
    {
      word: "Delulu",
      correct: "Playfully delusional.",
      wrong: [
        "A cartoon character.",
        "A dessert.",
        "A sneaker brand."
      ]
    },
    {
      word: "NPC",
      correct: "Someone acting robotic or lacking originality.",
      wrong: [
        "A political party.",
        "A coding language.",
        "A music genre."
      ]
    }
  ];

  /* =====================
     ELEMENTS
  ===================== */

  const splash = document.getElementById("splash");
  const ad = document.getElementById("ad");
  const round = document.getElementById("round");
  const result = document.getElementById("result");

  const startBtn = document.getElementById("start-btn");
  const statsBtn = document.getElementById("stats-btn");
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
     START BUTTON
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

  /* =====================
     GAME FLOW
  ===================== */

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
    progressFill.style.width =
      `${(currentRound / TOTAL_ROUNDS) * 100}%`;

    const answers = [data.correct, ...data.wrong]
      .sort(() => Math.random() - 0.5);

    optionsContainer.innerHTML = "";

    answers.forEach(answer => {
      const btn = document.createElement("button");
      btn.textContent = answer;

      btn.onclick = () => {
        handleAnswer(btn, answer === data.correct, data.correct);
      };

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

  /* =====================
     STATS UPDATE
  ===================== */

  function updateStats() {
    const stats = getStats();

    stats.gamesPlayed++;
    if (score >= 3)

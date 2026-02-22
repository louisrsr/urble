document.addEventListener("DOMContentLoaded", function () {

  /* =========================
     WORD DATABASE
  ========================== */

  const WORDS = [
    {
      word: "Rizz",
      correct: "Short for charisma, especially in flirting.",
      wrong: ["A gaming strategy.", "An energy drink.", "A fashion brand."]
    },
    {
      word: "Mid",
      correct: "Something average or mediocre.",
      wrong: ["Extremely good.", "A yoga pose.", "A hairstyle."]
    },
    {
      word: "Touch grass",
      correct: "An insult telling someone to go outside.",
      wrong: ["A gardening method.", "A dance move.", "A hiking technique."]
    },
    {
      word: "NPC",
      correct: "Someone acting robotic or unoriginal.",
      wrong: ["A political party.", "A coding language.", "A music genre."]
    },
    {
      word: "Delulu",
      correct: "Playfully delusional.",
      wrong: ["A cartoon character.", "A dessert.", "A sneaker brand."]
    },
    {
      word: "Sus",
      correct: "Suspicious or questionable.",
      wrong: ["A sushi dish.", "A superhero.", "A workout style."]
    }
  ];

  const TOTAL_ROUNDS = 5;

  let gameWords = [];
  let currentRound = 0;
  let score = 0;

  const today = new Date().toDateString();

  /* =========================
     ELEMENTS
  ========================== */

  const startBtn = document.getElementById("start-btn");
  const statsBtn = document.getElementById("stats-btn");
  const closeStats = document.getElementById("close-stats");

  const splash = document.getElementById("splash");
  const ad = document.getElementById("ad");
  const skipAdBtn = document.getElementById("skip-ad");

  const round = document.getElementById("round");
  const result = document.getElementById("result");
  const statsModal = document.getElementById("stats-modal");

  const wordTitle = document.getElementById("word-title");
  const optionsContainer = document.getElementById("options");

  const progressFill = document.getElementById("progress-fill");
  const progressBar = document.getElementById("progress-bar");

  const resultText = document.getElementById("result-text");
  const scoreText = document.getElementById("score-text");
  const statsContent = document.getElementById("stats-content");

  /* =========================
     UTIL
  ========================== */

  function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }

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

  /* =========================
     START FLOW
  ========================== */

  startBtn.addEventListener("click", function () {
    splash.classList.add("hidden");
    startBtn.classList.add("hidden");
    ad.classList.remove("hidden");

    skipAdBtn.disabled = true;
    setTimeout(() => skipAdBtn.disabled = false, 2000);
  });

  skipAdBtn.addEventListener("click", function () {
    ad.classList.add("hidden");
    progressBar.classList.remove("hidden");
    startGame();
  });

  /* =========================
     GAME
  ========================== */

  function startGame() {

    currentRound = 0;
    score = 0;

    gameWords = shuffle([...WORDS]).slice(0, TOTAL_ROUNDS);

    result.classList.add("hidden");
    round.classList.remove("hidden");

    nextRound();
  }

  function nextRound() {

    if (currentRound >= TOTAL_ROUNDS) {
      endGame();
      return;
    }

    const data = gameWords[currentRound];

    wordTitle.textContent = data.word;

    progressFill.style.width =
      (currentRound / TOTAL_ROUNDS) * 100 + "%";

    const answers = shuffle([data.correct, ...data.wrong]);

    optionsContainer.innerHTML = "";

    answers.forEach(answer => {

      const btn = document.createElement("button");
      btn.textContent = answer;

      btn.addEventListener("click", function () {
        handleAnswer(btn, answer === data.correct, data.correct);
      });

      optionsContainer.appendChild(btn);
    });
  }

  function handleAnswer(clickedBtn, isCorrect, correctAnswer) {

    const buttons = optionsContainer.querySelectorAll("button");

    buttons.forEach(btn => {
      btn.disabled = true;

      if (btn.textContent === correctAnswer) {
        btn.style.background = "#1DA1F2";
        btn.style.color = "#fff";
      }
    });

    if (isCorrect) {
      score++;
    } else {
      clickedBtn.style.background = "#444";
      clickedBtn.style.color = "#fff";
    }

    currentRound++;
    setTimeout(nextRound, 1200);
  }

  function endGame() {

    round.classList.add("hidden");
    result.classList.remove("hidden");

    progressFill.style.width = "100%";

    resultText.textContent = "Game Complete";
    scoreText.textContent = `You scored ${score} / ${TOTAL_ROUNDS}`;

    updateStats();
  }

  /* =========================
     STATS
  ========================== */

  function updateStats() {

    const stats = getStats();

    stats.gamesPlayed++;

    if (score >= 3) stats.wins++;

    if (stats.lastPlayed === today) {
      // same day → do nothing
    } else {
      if (stats.lastPlayed === new Date(Date.now() - 86400000).toDateString()) {
        stats.currentStreak++;
      } else {
        stats.currentStreak = 1;
      }
    }

    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    stats.lastPlayed = today;

    saveStats(stats);
  }

  statsBtn.addEventListener("click", function () {
    const stats = getStats();

    statsContent.innerHTML = `
      Games Played: ${stats.gamesPlayed}<br>
      Wins: ${stats.wins}<br>
      Current Streak: ${stats.currentStreak}<br>
      Max Streak: ${stats.maxStreak}
    `;

    statsModal.classList.remove("hidden");
  });

  closeStats.addEventListener("click", function () {
    statsModal.classList.add("hidden");
  });

});

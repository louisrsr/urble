document.addEventListener("DOMContentLoaded", function () {

  /* =====================
     WORD DATA (ADD MORE HERE)
  ===================== */

  const words = [
    {
      word: "Rizz",
      correct: "Short for charisma, especially in flirting.",
      wrong: [
        "A gaming strategy.",
        "An energy drink.",
        "A fashion brand."
      ]
    },
    {
      word: "Mid",
      correct: "Something average or mediocre.",
      wrong: [
        "Extremely good.",
        "A yoga pose.",
        "A hairstyle."
      ]
    },
    {
      word: "Touch grass",
      correct: "An insult telling someone to go outside.",
      wrong: [
        "A gardening method.",
        "A dance move.",
        "A hiking technique."
      ]
    }
  ];

  /* =====================
     VARIABLES
  ===================== */

  let currentRound = 0;
  let score = 0;

  const startBtn = document.getElementById("start-btn");
  const splash = document.getElementById("splash");
  const ad = document.getElementById("ad");
  const skipAdBtn = document.getElementById("skip-ad");
  const round = document.getElementById("round");
  const result = document.getElementById("result");

  const wordTitle = document.getElementById("word-title");
  const optionsContainer = document.getElementById("options");
  const progressFill = document.getElementById("progress-fill");
  const progressBar = document.getElementById("progress-bar");
  const resultText = document.getElementById("result-text");
  const scoreText = document.getElementById("score-text");

  /* =====================
     START FLOW
  ===================== */

  startBtn.addEventListener("click", function () {
    splash.classList.add("hidden");
    startBtn.classList.add("hidden");
    ad.classList.remove("hidden");

    skipAdBtn.disabled = true;

    setTimeout(function () {
      skipAdBtn.disabled = false;
    }, 2000);
  });

  skipAdBtn.addEventListener("click", function () {
    ad.classList.add("hidden");
    progressBar.classList.remove("hidden");
    startGame();
  });

  /* =====================
     GAME LOGIC
  ===================== */

  function startGame() {
    currentRound = 0;
    score = 0;
    result.classList.add("hidden");
    round.classList.remove("hidden");
    nextRound();
  }

  function nextRound() {

    if (currentRound >= words.length) {
      endGame();
      return;
    }

    const data = words[currentRound];

    wordTitle.textContent = data.word;

    progressFill.style.width =
      (currentRound / words.length) * 100 + "%";

    const answers = [data.correct, ...data.wrong]
      .sort(() => Math.random() - 0.5);

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
        btn.style.backgroundColor = "#1DA1F2"; // blue correct
        btn.style.color = "#fff";
      }
    });

    if (!isCorrect) {
      clickedBtn.style.backgroundColor = "#444";
      clickedBtn.style.color = "#fff";
    } else {
      score++;
    }

    currentRound++;

    setTimeout(nextRound, 1200);
  }

  function endGame() {

    round.classList.add("hidden");
    result.classList.remove("hidden");

    progressFill.style.width = "100%";

    resultText.textContent = "Game Complete";
    scoreText.textContent =
      "You scored " + score + " / " + words.length;

  }

});

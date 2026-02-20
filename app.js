const TOTAL_ROUNDS = 5;
let currentRound = 0;
let score = 0;
let results = [];

const words = [
  {
    word: "Touch grass",
    correct: "An insult telling someone to go outside and stop being online.",
    wrong: [
      "A gardening technique.",
      "A new dance trend.",
      "A grass-based diet."
    ]
  },
  {
    word: "Rizz",
    correct: "Short for charisma, especially when flirting.",
    wrong: [
      "A fizzy drink.",
      "A gaming strategy.",
      "An expensive watch."
    ]
  },
  {
    word: "Mid",
    correct: "Mediocre or average.",
    wrong: [
      "Very impressive.",
      "A workout move.",
      "A luxury brand."
    ]
  },
  {
    word: "Delulu",
    correct: "Delusional but used humorously.",
    wrong: [
      "A cartoon character.",
      "A cooking style.",
      "A fashion brand."
    ]
  },
  {
    word: "NPC",
    correct: "Someone acting robotic or lacking originality.",
    wrong: [
      "A political party.",
      "A coding language.",
      "A sneaker brand."
    ]
  }
];

const splash = document.getElementById("splash");
const ad = document.getElementById("ad");
const round = document.getElementById("round");
const result = document.getElementById("result");

const wordTitle = document.getElementById("word-title");
const optionsContainer = document.getElementById("options");
const progressText = document.getElementById("progress");
const progressFill = document.getElementById("progress-fill");

document.getElementById("start-btn").onclick = () => {
  splash.classList.add("hidden");
  ad.classList.remove("hidden");

  const skip = document.getElementById("skip-ad");
  skip.disabled = true;

  setTimeout(() => {
    skip.disabled = false;
  }, 3000);
};

document.getElementById("skip-ad").onclick = () => {
  ad.classList.add("hidden");
  document.getElementById("progress-bar").classList.remove("hidden");
  startGame();
};

document.getElementById("play-again").onclick = () => {
  location.reload();
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

    btn.onclick = () => {
      handleAnswer(btn, answer === data.correct);
    };

    optionsContainer.appendChild(btn);
  });
}

function handleAnswer(button, isCorrect) {
  const buttons = optionsContainer.querySelectorAll("button");
  buttons.forEach(b => b.disabled = true);

  if (isCorrect) {
    button.classList.add("option-correct");
    score++;
    results.push("correct");
    triggerHaptic("correct");
  } else {
    button.classList.add("option-wrong");
    results.push("wrong");
    triggerHaptic("wrong");
  }

  currentRound++;

  setTimeout(() => {
    nextRound();
  }, 1000);
}

function endGame() {
  round.classList.add("hidden");
  result.classList.remove("hidden");

  progressFill.style.width = "100%";

  document.getElementById("result-text").textContent =
    score === 5 ? "Flawless." : "Game Over";

  document.getElementById("score-text").textContent =
    `You scored ${score} / ${TOTAL_ROUNDS}`;
}

function triggerHaptic(type) {
  if (!navigator.vibrate) return;

  if (type === "correct") navigator.vibrate(50);
  if (type === "wrong") navigator.vibrate([30, 40, 30]);
}

document.getElementById("share-score").onclick = () => {
  let grid = `Urble ${score}/5\n\n`;
  results.forEach(r => {
    grid += r === "correct" ? "🟦" : "⬛";
  });

  navigator.clipboard.writeText(grid);
  alert("Copied to clipboard!");
};

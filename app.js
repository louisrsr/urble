const words = [
    { w: "Ghosting", d: "Suddenly ending all contact without explanation.", distractors: ["AI Fake: Pretending to be a ghost", "Other: A type of painting", "Other: Living in an old house"] },
    // Add more words here
];

let currentRound = 0;
let score = 0;
let results = [];

// 1. Ad Timer
let timeLeft = 5;
const skipBtn = document.getElementById('skip-ad');
const timer = setInterval(() => {
    timeLeft--;
    skipBtn.innerText = `Skip in ${timeLeft}...`;
    if (timeLeft <= 0) {
        clearInterval(timer);
        skipBtn.innerText = "Start Game";
        skipBtn.disabled = false;
    }
}, 1000);

skipBtn.onclick = () => document.getElementById('ad-overlay').classList.add('hidden');

// 2. Game Logic
function loadRound() {
    const data = words[currentRound];
    document.getElementById('current-word').innerText = data.w;
    document.getElementById('round-num').innerText = currentRound + 1;
    
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    // Mix correct answer with distractors
    const allOptions = [data.d, ...data.distractors].sort(() => Math.random() - 0.5);

    allOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(opt === data.d);
        container.appendChild(btn);
    });
}

function checkAnswer(isCorrect) {
    if (isCorrect) {
        score++;
        results.push("🟩");
    } else {
        results.push("🟥");
    }

    if (currentRound < 4 && currentRound < words.length - 1) {
        currentRound++;
        loadRound();
    } else {
        showResults();
    }
}

function showResults() {
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('results-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = `You got ${score}/5`;
    document.getElementById('emoji-grid').innerText = results.join('');
}

// 3. Theme Toggle
document.getElementById('theme-toggle').onclick = () => {
    document.body.classList.toggle('dark-theme');
};

loadRound();
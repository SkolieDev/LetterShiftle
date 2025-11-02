let currentIndex = 0;
let words = [];
let secretWord = "";
let shuffledWord = "";
let currentRow = 0;
let currentGuess = "";
let gameOver = false;

const board = document.getElementById("game-board");
const keyboardEl = document.getElementById("keyboard");
const shuffledEl = document.getElementById("shuffledWord");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayBody = document.getElementById("overlay-body");
const overlayNext = document.getElementById("overlay-next");
const overlayReset = document.getElementById("overlay-reset");
const endScreen = document.getElementById("endScreen");
const restartBtn = document.getElementById("restartBtn");
const themeBtn = document.getElementById("themeBtn");
const progressText = document.getElementById("progressText");

fetch("words.json").then(r => r.json()).then(startGame);

function startGame(data) {
    words = data.words;
    const saved = localStorage.getItem("lettershiftle_progress");
    currentIndex = saved ? parseInt(saved, 10) : 0;
    updateProgress();
    if (currentIndex >= words.length) {
        showEnd();
        return;
    }
    secretWord = words[currentIndex].toLowerCase();
    shuffledWord = shuffleWord(secretWord);
    shuffledEl.textContent = shuffledWord.toUpperCase();
    resetBoard();
    createKeyboard();
}

// Shuffle letters
function shuffleWord(w) {
    const arr = w.split("");
    let s = arr.slice();
    for (let i = s.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [s[i], s[j]] = [s[j], s[i]];
    }
    if (s.join("") === w) {
        // Simple swap if it's the same letter
        [s[0], s[1]] = [s[1], s[0]];
    }
    return s.join("");
}

function resetBoard() {
    board.innerHTML = "";
    currentRow = 0;
    currentGuess = "";
    gameOver = false;
    for (let r = 0; r < 6; r++) {
        const row = document.createElement("div");
        row.className = "row";
        for (let c = 0; c < 5; c++) {
            const tile = document.createElement("div");
            tile.className = "tile";
            row.appendChild(tile);
        }
        board.appendChild(row);
    }
}

function createKeyboard() {
    keyboardEl.innerHTML = "";
    const allowed = new Set(secretWord.toUpperCase().split(""));
    const alphabet = "QWERTYUIOPASDFGHJKLZXCVBNM".split("");
    alphabet.forEach(l => {
        const btn = document.createElement("button");
        btn.className = "key";
        btn.textContent = l;
        if (!allowed.has(l)) {
            btn.classList.add("disabled");
            btn.disabled = true;
        } else {
            btn.addEventListener("click", () => handleKey(l));
        }
        keyboardEl.appendChild(btn);
    });
    const enter = document.createElement("button");
    enter.className = "key special";
    enter.textContent = "Enter";
    enter.addEventListener("click", checkGuess);
    keyboardEl.appendChild(enter);
    const del = document.createElement("button");
    del.className = "key special";
    del.textContent = "⌫";
    del.addEventListener("click", deleteLetter);
    keyboardEl.appendChild(del);
}

// Handle click or Physical keyboard
function handleKey(letter) {
    if (gameOver) return;
    if (currentGuess.length < 5) {
        currentGuess += letter.toLowerCase();
        renderRow();
    }
}

function deleteLetter() {
    if (gameOver) return;
    currentGuess = currentGuess.slice(0, -1);
    renderRow();
}

function renderRow() {
    const row = board.children[currentRow];
    for (let i = 0; i < 5; i++) {
        const tile = row.children[i];
        tile.textContent = currentGuess[i]?.toUpperCase() || "";
    }
}

// Main check with duplicate-letter handling
function checkGuess() {
    if (gameOver || currentGuess.length !== 5) return;
    const guess = currentGuess.toLowerCase();
    const row = board.children[currentRow];

    // Prepare secret array to null consumed letters
    const secretArr = secretWord.split("");
    const result = Array(5).fill("absent");
    // First pass greens
    for (let i = 0; i < 5; i++) {
        if (guess[i] === secretArr[i]) {
            result[i] = "correct";
            secretArr[i] = null;
        }
    }
    // Second pass presents
    for (let i = 0; i < 5; i++) {
        if (result[i] === "correct") continue;
        const idx = secretArr.indexOf(guess[i]);
        if (idx !== -1) {
            result[i] = "present";
            secretArr[idx] = null;
        }
    }
    // Animate
    for (let i = 0; i < 5; i++) {
        const tile = row.children[i];
        const cls = result[i];
        setTimeout(() => {
            tile.classList.add("flip-half");
            setTimeout(() => {
                tile.classList.add(cls);
                tile.classList.remove("flip-half");
                tile.classList.add("flip-done");
            }, 150);
        }, i * 300);
    }
    // Finish
    if (guess === secretWord) {
        gameOver = true;
        localStorage.setItem("lettershiftle_progress", currentIndex + 1);
        updateProgress();
        showConfetti();
        overlayNext.classList.remove("hidden");
        overlayNext.classList.add("green");

        overlayReset.classList.remove("danger");
        overlayReset.classList.add("hidden");
        showOverlayMessage("Correct!", "Nice job 🎉", false);
    } else {
        currentRow++;
        currentGuess = "";
        if (currentRow >= 6) {
            gameOver = true;
            overlayNext.classList.remove("green");
            overlayNext.classList.add("hidden");

            overlayReset.classList.remove("hidden");
            overlayReset.classList.add("danger");
            showOverlayMessage("Oh no! You lose!", `Try again?`, false);

        }
    }
}

function showOverlayMessage(title, body, autoclose = false) {
    overlayTitle.textContent = title;
    overlayBody.textContent = body;
    overlay.classList.remove("hidden");
    if (autoclose) {
        setTimeout(() => {
            overlay.classList.add("hidden");
        }, 2000);
    }
}

overlayNext.addEventListener("click", () => {
    overlay.classList.add("hidden");
    board.classList.add("hidden");
    keyboardEl.classList.add("hidden");
    shuffledEl.textContent = "L O A D I N G";
    setTimeout(() => {
            // Load next or show end
            currentIndex++;
            if (currentIndex >= words.length) {
                showEnd();
            } else {
                localStorage.setItem("lettershiftle_progress", currentIndex);
                startGame({
                    words
                });
            }
            board.classList.remove("hidden");
            keyboardEl.classList.remove("hidden");
    }, 2800);
});
overlayReset.addEventListener("click", () => {
    //localStorage.removeItem("lettershiftle_progress");
    location.reload();
});

restartBtn.addEventListener("click", () => {
    currentIndex = 0;
    localStorage.removeItem("lettershiftle_progress");
    location.reload();
});

// Keyboard physical support
document.addEventListener("keydown", (e) => {
    if (gameOver) return;
    const k = e.key.toUpperCase();
    if (k === "ENTER") {
        checkGuess();
        return;
    }
    if (k === "BACKSPACE") {
        deleteLetter();
        return;
    }
    if (/^[A-Z]$/.test(k)) {
        // Only accept if allowed (enabled on screen)
        const allowed = new Set(secretWord.toUpperCase().split(""));
        if (allowed.has(k)) handleKey(k);
    }
});

// Theme toggler
themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");
});

function updateProgress() {
    progressText.textContent = `${Math.min(currentIndex, words.length)}/${words.length}`;
}

function showEnd() {
    endScreen.classList.remove("hidden");
}

// Confetti
function showConfetti() {
    const colors = ["#FFD700", "#FF69B4", "#00CED1", "#ADFF2F", "#FF4500"];
    const count = 80;
    for (let i = 0; i < count; i++) {
        const c = document.createElement("div");
        c.className = "confetti";
        c.style.background = colors[Math.floor(Math.random() * colors.length)];
        c.style.left = Math.random() * 100 + "vw";
        c.style.width = (6 + Math.random() * 8) + "px";
        c.style.height = (6 + Math.random() * 8) + "px";
        c.style.animationDuration = (1.5 + Math.random() * 2.5) + "s";
        c.style.opacity = Math.random();
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 4500);
    }
}
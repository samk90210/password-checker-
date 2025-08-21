const passwordInput = document.getElementById("password");
const strengthText = document.getElementById("strength-text");
const requirementsList = document.getElementById("requirements");
const togglePassword = document.getElementById("toggle-password");
const copyBtn = document.getElementById("copy-btn");
const progressFill = document.getElementById("progress-fill");

passwordInput.addEventListener("input", function () {
  const password = passwordInput.value;
  const result = evaluatePassword(password);
  strengthText.textContent = `Strength: ${result.strength}`;
  strengthText.style.color = result.color;
  updateRequirements(result.requirements);
  updateProgressBar(result.score, result.color);
});

function evaluatePassword(password) {
  const lengthOK = password.length >= 12; // New requirement
  const lengthStrong = password.length >= 14; // New "strong" threshold
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[\W_]/.test(password);

  let score = 0;
  if (lengthOK) score++;
  if (hasUpper) score++;
  if (hasLower) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  let strength, color;

  if (!lengthOK) {
    strength = "Requirements not met ❌";
    color = "red";
    score = 0; // No progress if length too short
  } else if (lengthStrong && score === 5) {
    strength = "Strong ✅";
    color = "green";
  } else {
    strength = "Intermediate ⚠️";
    color = "orange";
  }

  return {
    strength,
    color,
    score,
    requirements: { lengthOK, hasUpper, hasLower, hasNumber, hasSpecial, lengthStrong }
  };
}

function updateRequirements(reqs) {
  requirementsList.innerHTML = `
    <li style="color: ${reqs.lengthOK ? "green" : "red"}">
      ✔️ At least 12 characters
    </li>
    <li style="color: ${reqs.hasUpper ? "green" : "red"}">
      ✔️ Uppercase letter
    </li>
    <li style="color: ${reqs.hasLower ? "green" : "red"}">
      ✔️ Lowercase letter
    </li>
    <li style="color: ${reqs.hasNumber ? "green" : "red"}">
      ✔️ Number
    </li>
    <li style="color: ${reqs.hasSpecial ? "green" : "red"}">
      ✔️ Special character
    </li>
    <li style="color: ${reqs.lengthStrong ? "green" : "orange"}">
      ⭐ 14+ characters for maximum strength
    </li>
  `;
}

function updateProgressBar(score, color) {
  const percent = (score / 5) * 100;
  progressFill.style.width = `${percent}%`;
  progressFill.style.backgroundColor = color;
}

togglePassword.addEventListener("change", function () {
  passwordInput.type = this.checked ? "text" : "password";
});

copyBtn.addEventListener("click", function () {
  navigator.clipboard.writeText(passwordInput.value).then(() => {
    copyBtn.textContent = "✅ Copied!";
    setTimeout(() => {
      copyBtn.textContent = "📋 Copy";
    }, 1500);
  });
});

// Existing password checker code remains the same...
// Additions below ⬇️

// ---------------------------
// 🔹 Password Generator
// ---------------------------
const generateBtn = document.getElementById("generate-btn");
const lengthSlider = document.getElementById("length-slider");
const numberSlider = document.getElementById("number-slider");
const specialSlider = document.getElementById("special-slider");

const lengthValue = document.getElementById("length-value");
const numberValue = document.getElementById("number-value");
const specialValue = document.getElementById("special-value");

[lengthSlider, numberSlider, specialSlider].forEach(slider => {
  slider.addEventListener("input", () => {
    lengthValue.textContent = lengthSlider.value;
    numberValue.textContent = numberSlider.value;
    specialValue.textContent = specialSlider.value;
  });
});

generateBtn.addEventListener("click", () => {
  const length = parseInt(lengthSlider.value);
  const numbers = parseInt(numberSlider.value);
  const specials = parseInt(specialSlider.value);

  passwordInput.value = generatePassword(length, numbers, specials);
  passwordInput.dispatchEvent(new Event("input")); // Re-run checker
});

function generatePassword(length, numbers, specials) {
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const specialChars = "!@#$%^&*()_+[]{}<>?/|";

  let pool = letters;
  let result = "";

  // Guarantee numbers & specials
  for (let i = 0; i < numbers; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  for (let i = 0; i < specials; i++) {
    result += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  }

  // Fill remaining with random letters
  while (result.length < length) {
    result += pool.charAt(Math.floor(Math.random() * pool.length));
  }

  // Shuffle password
  return result.split('').sort(() => Math.random() - 0.5).join('');
}

// ---------------------------
// 🔹 Gamified Mode
// ---------------------------
const startGameBtn = document.getElementById("start-game-btn");
const gameArea = document.getElementById("game-area");
const gameQuestion = document.getElementById("game-question");
const gameAnswer = document.getElementById("game-answer");
const submitAnswerBtn = document.getElementById("submit-answer-btn");
const gameMusic = document.getElementById("game-music");

let currentLevel = 0;
let builtPassword = "";
const questions = [
  { q: "🍹 Name your favorite drink", validate: ans => ans.length > 0 },
  { q: "🔥 Write one of these logos: Nike, Apple, Adidas", validate: ans => /(nike|apple|adidas)/i.test(ans) },
  { q: "➕ Write a number that adds up to 35 (e.g., 20+15)", validate: ans => eval(ans) === 35 },
  { q: "🔢 Now write 35 in Roman numerals", validate: ans => /^xxxv$/i.test(ans) }
];

startGameBtn.addEventListener("click", () => {
  gameArea.style.display = "block";
  startGameBtn.style.display = "none";
  currentLevel = 0;
  builtPassword = "";
  gameMusic.play();
  askQuestion();
});

submitAnswerBtn.addEventListener("click", () => {
  const answer = gameAnswer.value.trim();
  if (questions[currentLevel].validate(answer)) {
    builtPassword += answer;
    currentLevel++;
    gameAnswer.value = "";
    if (currentLevel < questions.length) {
      askQuestion();
    } else {
      passwordInput.value = builtPassword;
      passwordInput.dispatchEvent(new Event("input"));
      gameArea.innerHTML = `<p>🎉 Congrats! Your gamified password is ready!</p>`;
      gameMusic.pause();
    }
  } else {
    alert("❌ Wrong answer! Try again.");
  }
});

function askQuestion() {
  gameQuestion.textContent = `Level ${currentLevel + 1}: ${questions[currentLevel].q}`;
}


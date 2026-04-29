/* ============================================================
   PASSWORD TRAINER - COMPLETE SCRIPT
   ============================================================ */

// ===== DOM REFS =====
const passwordInput   = document.getElementById("password");
const strengthText    = document.getElementById("strength-text");
const progressFill    = document.getElementById("progress-fill");
const complexityEl    = document.getElementById("complexity");
const ttc1e3          = document.getElementById("ttc-1e3");
const ttc1e9          = document.getElementById("ttc-1e9");
const ttc1e12         = document.getElementById("ttc-1e12");
const copyBtn         = document.getElementById("copy-btn");
const togglePassword  = document.getElementById("toggle-password");
const saveHistoryBtn  = document.getElementById("saveHistoryBtn");
const tipBox          = document.getElementById("tipBox");

// Mode
const modePwBtn       = document.getElementById("modePassword");
const modeGameBtn     = document.getElementById("modeGamified");
const passwordMode    = document.getElementById("passwordMode");
const gamifiedMode    = document.getElementById("gamifiedMode");

// Generator
const generatorModal  = document.getElementById("generator-modal");
const openGeneratorBtn= document.getElementById("open-generator-btn");
const generatorCancel = document.getElementById("generator-cancel");
const generateBtn     = document.getElementById("generate-btn");
const useGeneratedBtn = document.getElementById("use-generated-btn");
const lengthSlider    = document.getElementById("length-slider");
const numberSlider    = document.getElementById("number-slider");
const specialSlider   = document.getElementById("special-slider");
const lengthValue     = document.getElementById("length-value");
const numberValue     = document.getElementById("number-value");
const specialValue    = document.getElementById("special-value");
const generatedPreview= document.getElementById("generatedPreview");

// Settings
const settingsBtn     = document.getElementById("settingsBtn");
const settingsModal   = document.getElementById("settings-modal");
const settingsClose   = document.getElementById("settings-close");
const darkModeToggle  = document.getElementById("darkModeToggle");
const musicToggle     = document.getElementById("musicToggle");
const volumeSlider    = document.getElementById("volumeSlider");
const volumeValue     = document.getElementById("volumeValue");
const musicControls   = document.getElementById("musicControls");
const musicVisualizer = document.getElementById("musicVisualizer");
const historyList     = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

// Game
const gamePasswordInput= document.getElementById("gamePassword");
const rulesContainer  = document.getElementById("rules-container");
const rulesPassed     = document.getElementById("rulesPassed");
const gameProgressFill= document.getElementById("game-progress-fill");
const restartGame     = document.getElementById("restartGame");
const winScreen       = document.getElementById("win-screen");
const playAgainBtn    = document.getElementById("playAgainBtn");

// Toast
const toast           = document.getElementById("toast");

// ===== STATE =====
let passwordHistory = JSON.parse(localStorage.getItem("pwHistory") || "[]");
let isDark = localStorage.getItem("darkMode") === "true";
let musicEnabled = false;
let audioCtx = null;
let musicNodes = [];
let lastGeneratedPw = "";

// ===== TIPS =====
const TIPS = [
  "Use a passphrase! 'correct-horse-battery-staple' is far stronger than 'P@ss1'.",
  "Never reuse passwords across sites — one breach exposes all.",
  "A password manager (Bitwarden, 1Password) lets you use unique 20+ char passwords everywhere.",
  "Length matters more than complexity. 20 random letters beats 8 mixed chars.",
  "Enable 2-factor authentication wherever possible for an extra security layer.",
  "Dictionary words + numbers like 'password123' are the first things crackers try.",
  "Avoid personal info: birthdays, names, and pet names are guessable.",
  "Check haveibeenpwned.com to see if your email has been in a breach.",
];

// ===== UTILS =====
function showToast(msg, duration = 2200) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), duration);
}

function entropy(pw) {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^A-Za-z0-9]/.test(pw)) pool += 32;
  if (pool === 0) pool = 26;
  return pw.length * Math.log2(pool);
}

function formatTime(seconds) {
  if (seconds === Infinity || isNaN(seconds)) return "♾️ Forever";
  const units = [
    [1e12 * 365.25 * 24 * 3600, "trillion years"],
    [1e9 * 365.25 * 24 * 3600,  "billion years"],
    [1e6 * 365.25 * 24 * 3600,  "million years"],
    [365.25 * 24 * 3600,         "years"],
    [86400,                       "days"],
    [3600,                        "hours"],
    [60,                          "minutes"],
    [1,                           "seconds"],
  ];
  for (const [div, label] of units) {
    if (seconds >= div) {
      const v = Math.floor(seconds / div);
      return `${v.toLocaleString()} ${label}`;
    }
  }
  return "< 1 second";
}

// ===== PASSWORD MODE =====
function getScore(pw) {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (!/(.)\1\1/.test(pw) && pw.length > 0) score++;
  return score; // 0-7
}

function updateCriteria(pw) {
  const checks = {
    "c-length":   pw.length >= 8,
    "c-length12": pw.length >= 12,
    "c-upper":    /[A-Z]/.test(pw),
    "c-lower":    /[a-z]/.test(pw),
    "c-number":   /[0-9]/.test(pw),
    "c-special":  /[^A-Za-z0-9]/.test(pw),
    "c-norepeat": !(/(.)\1\1/.test(pw)) && pw.length > 0,
  };
  const labels = {
    "c-length":   "✅ At least 8 characters",
    "c-length12": "✅ At least 12 characters",
    "c-upper":    "✅ Uppercase letter",
    "c-lower":    "✅ Lowercase letter",
    "c-number":   "✅ Number",
    "c-special":  "✅ Special character",
    "c-norepeat": "✅ No 3+ repeated characters",
  };
  const failLabels = {
    "c-length":   "⬜ At least 8 characters",
    "c-length12": "⬜ At least 12 characters",
    "c-upper":    "⬜ Uppercase letter",
    "c-lower":    "⬜ Lowercase letter",
    "c-number":   "⬜ Number",
    "c-special":  "⬜ Special character",
    "c-norepeat": "⬜ No 3+ repeated characters",
  };
  for (const [id, pass] of Object.entries(checks)) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = pass ? labels[id] : failLabels[id];
      el.className = "criteria-item " + (pass ? "pass" : "fail");
    }
  }
}

function updateStrength() {
  const pw = passwordInput.value;
  if (!pw) {
    strengthText.textContent = "Password strength: —";
    progressFill.style.width = "0%";
    complexityEl.textContent = "Password complexity: —";
    ttc1e3.textContent = "—"; ttc1e9.textContent = "—"; ttc1e12.textContent = "—";
    updateCriteria("");
    return;
  }

  const bits = entropy(pw);
  complexityEl.textContent = `Password complexity: ${bits.toFixed(2)} bits`;

  // Exponential guesses (seconds)
  const g1   = Math.pow(2, bits) / 1e3;
  const g2   = Math.pow(2, bits) / 1e9;
  const g3   = Math.pow(2, bits) / 1e12;
  ttc1e3.textContent  = formatTime(g1);
  ttc1e9.textContent  = formatTime(g2);
  ttc1e12.textContent = formatTime(g3);

  const score = getScore(pw);
  const pct = (score / 7 * 100).toFixed(1);
  progressFill.style.width = pct + "%";

  if (score <= 2) {
    strengthText.textContent = "Password strength: Weak ❌";
    progressFill.style.background = "var(--danger)";
  } else if (score <= 4) {
    strengthText.textContent = "Password strength: Fair ⚠️";
    progressFill.style.background = "var(--warn)";
  } else if (score <= 6) {
    strengthText.textContent = "Password strength: Strong ✅";
    progressFill.style.background = "var(--success)";
  } else {
    strengthText.textContent = "Password strength: Excellent 🏆";
    progressFill.style.background = "linear-gradient(90deg, var(--accent), var(--accent2))";
  }

  updateCriteria(pw);
}

passwordInput.addEventListener("input", updateStrength);

togglePassword.onchange = () => {
  passwordInput.type = togglePassword.checked ? "text" : "password";
};

copyBtn.onclick = () => {
  const pw = passwordInput.value;
  if (!pw) { showToast("Nothing to copy!"); return; }
  navigator.clipboard.writeText(pw).then(() => showToast("✅ Copied!"));
};

// ===== SAVE HISTORY =====
function getStrengthLabel(pw) {
  const s = getScore(pw);
  if (s <= 2) return "weak";
  if (s <= 5) return "medium";
  return "strong";
}

function renderHistory() {
  historyList.innerHTML = "";
  if (!passwordHistory.length) {
    historyList.innerHTML = '<p class="empty-history">No saved passwords yet. Hit 💾 Save in Password Mode!</p>';
    return;
  }
  [...passwordHistory].reverse().forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "history-item";
    const strengthClass = getStrengthLabel(item.pw);
    div.innerHTML = `
      <span class="history-pw">${item.pw.replace(/./g, c => c === ' ' ? '&nbsp;' : c)}</span>
      <span class="history-strength ${strengthClass}">${strengthClass}</span>
      <span class="history-time">${item.time}</span>
      <button class="history-copy-btn" data-pw="${encodeURIComponent(item.pw)}">📋</button>
    `;
    historyList.appendChild(div);
  });
  historyList.querySelectorAll(".history-copy-btn").forEach(btn => {
    btn.onclick = () => {
      navigator.clipboard.writeText(decodeURIComponent(btn.dataset.pw))
        .then(() => showToast("✅ Copied from history!"));
    };
  });
}

saveHistoryBtn.onclick = () => {
  const pw = passwordInput.value;
  if (!pw) { showToast("Type a password first!"); return; }
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  passwordHistory.push({ pw, time });
  if (passwordHistory.length > 20) passwordHistory.shift();
  localStorage.setItem("pwHistory", JSON.stringify(passwordHistory));
  renderHistory();
  showToast("💾 Password saved!");
};

clearHistoryBtn.onclick = () => {
  passwordHistory = [];
  localStorage.removeItem("pwHistory");
  renderHistory();
  showToast("🗑️ History cleared");
};

// ===== GENERATOR =====
openGeneratorBtn.onclick = () => {
  generatorModal.classList.add("show");
  generatedPreview.textContent = "—";
  useGeneratedBtn.disabled = true;
};
generatorCancel.onclick = () => generatorModal.classList.remove("show");

function generatePassword(len, numbers, specials) {
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits  = "0123456789";
  const special  = "!@#$%^&*-_=+?";
  let arr = [];
  for (let i = 0; i < numbers; i++) arr.push(digits[Math.floor(Math.random() * digits.length)]);
  for (let i = 0; i < specials; i++) arr.push(special[Math.floor(Math.random() * special.length)]);
  while (arr.length < len) arr.push(letters[Math.floor(Math.random() * letters.length)]);
  return arr.sort(() => Math.random() - 0.5).join("");
}

generateBtn.onclick = () => {
  lastGeneratedPw = generatePassword(+lengthSlider.value, +numberSlider.value, +specialSlider.value);
  generatedPreview.textContent = lastGeneratedPw;
  useGeneratedBtn.disabled = false;
};

useGeneratedBtn.onclick = () => {
  passwordInput.value = lastGeneratedPw;
  updateStrength();
  generatorModal.classList.remove("show");
  showToast("✨ Password applied!");
};

lengthSlider.oninput = () => { lengthValue.textContent = lengthSlider.value; };
numberSlider.oninput = () => { numberValue.textContent = numberSlider.value; };
specialSlider.oninput = () => { specialValue.textContent = specialSlider.value; };

// ===== DARK MODE =====
function applyTheme(dark) {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  darkModeToggle.checked = dark;
  localStorage.setItem("darkMode", dark);
}
darkModeToggle.onchange = () => { isDark = darkModeToggle.checked; applyTheme(isDark); };

// ===== SETTINGS MODAL =====
settingsBtn.onclick = () => {
  renderHistory();
  settingsModal.classList.add("show");
};
settingsClose.onclick = () => settingsModal.classList.remove("show");
settingsModal.addEventListener("click", e => {
  if (e.target === settingsModal) settingsModal.classList.remove("show");
});

// ===== BACKGROUND MUSIC (Web Audio API) =====
function startMusic() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const vol = audioCtx.createGain();
  vol.gain.value = +volumeSlider.value / 100 * 0.4;
  vol.connect(audioCtx.destination);
  musicNodes.push(vol);

  // Gentle ambient lo-fi: layered sine oscillators + slight detune
  const notes = [130.81, 164.81, 196.00, 220.00, 261.63, 196.00, 164.81, 220.00];
  let noteIdx = 0;

  function playNote() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(vol);
    osc.type = "sine";
    osc.frequency.value = notes[noteIdx % notes.length];
    osc.detune.value = (Math.random() - 0.5) * 10;
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.3);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.4);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 1.5);
    noteIdx++;
  }

  playNote();
  const interval = setInterval(() => {
    if (!musicEnabled) { clearInterval(interval); return; }
    playNote();
  }, 900);
  musicNodes.push({ stop: () => clearInterval(interval) });
}

function stopMusic() {
  if (audioCtx) { audioCtx.close(); audioCtx = null; }
  musicNodes = [];
}

musicToggle.onchange = () => {
  musicEnabled = musicToggle.checked;
  musicControls.style.display = musicEnabled ? "flex" : "none";
  musicVisualizer.classList.toggle("hidden", !musicEnabled);
  if (musicEnabled) startMusic();
  else stopMusic();
};

volumeSlider.oninput = () => {
  volumeValue.textContent = volumeSlider.value + "%";
  if (audioCtx && musicNodes[0]) {
    musicNodes[0].gain.value = +volumeSlider.value / 100 * 0.4;
  }
};

// ===== MODE SWITCHING =====
modePwBtn.onclick = () => {
  modePwBtn.classList.add("active");
  modeGameBtn.classList.remove("active");
  passwordMode.classList.add("active");
  gamifiedMode.classList.remove("active");
};
modeGameBtn.onclick = () => {
  modeGameBtn.classList.add("active");
  modePwBtn.classList.remove("active");
  gamifiedMode.classList.add("active");
  passwordMode.classList.remove("active");
  if (!gameInitialized) initGame();
};

// ===== TIP OF THE DAY =====
function loadTip() {
  const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
  tipBox.textContent = tip;
}

// ===== GAMIFIED MODE =====
let gameInitialized = false;
let visibleRules = [];
let totalRules = 0;

// Rule definitions
function buildRules(pw) {
  const today = new Date();
  const month = today.toLocaleString("default", { month: "long" });
  const dayOfWeek = today.toLocaleString("default", { weekday: "long" });

  const rules = [
    {
      id: 1,
      desc: "Your password must be at least 5 characters.",
      hint: "Just start typing!",
      check: p => p.length >= 5,
    },
    {
      id: 2,
      desc: "Your password must include a number.",
      hint: "Add any digit: 0-9",
      check: p => /[0-9]/.test(p),
    },
    {
      id: 3,
      desc: "Your password must include an uppercase letter.",
      hint: "Hold Shift and type a letter.",
      check: p => /[A-Z]/.test(p),
    },
    {
      id: 4,
      desc: "Your password must include a special character (!@#$%^&*).",
      hint: "Try ! or @ or #",
      check: p => /[!@#$%^&*]/.test(p),
    },
    {
      id: 5,
      desc: "Your password must be at least 12 characters.",
      hint: "Keep typing…",
      check: p => p.length >= 12,
    },
    {
      id: 6,
      desc: `Your password must include the current month: "${month}".`,
      hint: `Type the word: ${month}`,
      check: p => p.toLowerCase().includes(month.toLowerCase()),
    },
    {
      id: 7,
      desc: "The digits in your password must sum to at least 25.",
      hint: "Add more numbers! e.g. 999 = 27",
      check: p => {
        const sum = [...p].filter(c => /\d/.test(c)).reduce((s, c) => s + +c, 0);
        return sum >= 25;
      },
    },
    {
      id: 8,
      desc: "Your password must contain a Roman numeral (I, V, X, L, C, D, M).",
      hint: "Add I, V, X, L, C, D, or M",
      check: p => /[IVXLCDM]/.test(p),
    },
    {
      id: 9,
      desc: "Your password must include an emoji. 🎉",
      hint: "Copy-paste an emoji: 🔥 ✅ 🎯 💡",
      check: p => /\p{Emoji_Presentation}/u.test(p),
    },
    {
      id: 10,
      desc: `Your password must contain the day of the week: "${dayOfWeek}".`,
      hint: `Type: ${dayOfWeek}`,
      check: p => p.toLowerCase().includes(dayOfWeek.toLowerCase()),
    },
    {
      id: 11,
      desc: "Your password must contain at least 3 unique special characters.",
      hint: "Mix !@#$%^&*-_=+",
      check: p => {
        const specials = [...new Set([...p].filter(c => /[^A-Za-z0-9]/.test(c)))];
        return specials.length >= 3;
      },
    },
    {
      id: 12,
      desc: "Your password must be a palindrome OR contain the word 'secure'.",
      hint: "Add 'secure' anywhere, or make it read the same backwards.",
      check: p => {
        const clean = p.replace(/\s/g, "").toLowerCase();
        return clean.includes("secure") || clean === [...clean].reverse().join("");
      },
    },
    {
      id: 13,
      desc: "Your password must include the current year.",
      hint: `Add: ${today.getFullYear()}`,
      check: p => p.includes(String(today.getFullYear())),
    },
    {
      id: 14,
      desc: "Your password must be at least 20 characters.",
      hint: "Keep adding characters…",
      check: p => p.length >= 20,
    },
    {
      id: 15,
      desc: "Your password must not contain 3 or more consecutive identical characters.",
      hint: "Avoid 'aaa' or '111'",
      check: p => !(/(.)\1\1/).test(p),
    },
  ];

  return rules;
}

let allRules = [];

function initGame() {
  gameInitialized = true;
  allRules = buildRules("");
  totalRules = allRules.length;
  visibleRules = [allRules[0]]; // show first rule
  renderRules("");
  winScreen.classList.add("hidden");
  rulesContainer.style.display = "flex";
}

function renderRules(pw) {
  rulesContainer.innerHTML = "";
  let passCount = 0;

  visibleRules.forEach((rule, i) => {
    const pass = rule.check(pw);
    if (pass) passCount++;

    const card = document.createElement("div");
    card.className = `rule-card ${pass ? "rule-pass" : (i === visibleRules.length - 1 ? "rule-pending" : "rule-fail")}`;
    card.innerHTML = `
      <div class="rule-header">
        <div class="rule-number">${rule.id}</div>
        <span>${getRuleTitle(rule.id)}</span>
        <span class="rule-status">${pass ? "✅" : "❌"}</span>
      </div>
      <div class="rule-desc">${rule.desc}</div>
      ${!pass ? `<div class="rule-hint">💡 ${rule.hint}</div>` : ""}
    `;
    rulesContainer.appendChild(card);
  });

  rulesPassed.textContent = passCount;
  gameProgressFill.style.width = (passCount / totalRules * 100) + "%";
  gameProgressFill.style.background = passCount === totalRules
    ? "linear-gradient(90deg, var(--success), var(--accent))"
    : passCount > totalRules * 0.6 ? "var(--success)"
    : passCount > totalRules * 0.3 ? "var(--warn)"
    : "var(--danger)";

  // Unlock next rule if all visible ones pass
  const allCurrentPass = visibleRules.every(r => r.check(pw));
  if (allCurrentPass && visibleRules.length < allRules.length) {
    const nextRule = allRules[visibleRules.length];
    visibleRules.push(nextRule);
    renderRules(pw); // re-render with new rule
    showToast(`🔓 New rule unlocked! (Rule ${nextRule.id})`);
  }

  // WIN
  if (passCount === totalRules && totalRules > 0) {
    setTimeout(() => {
      winScreen.classList.remove("hidden");
      rulesContainer.style.display = "none";
      showToast("🏆 You won the Password Game!", 4000);
    }, 500);
  }
}

function getRuleTitle(id) {
  const titles = {
    1: "Length Check", 2: "Must Have Number", 3: "Uppercase Required",
    4: "Special Character", 5: "Longer Please", 6: "Time Awareness",
    7: "Digit Sum", 8: "Roman Numerals", 9: "Emoji Time! 🎉",
    10: "Day Awareness", 11: "Special Variety", 12: "Wordplay",
    13: "Year of Reckoning", 14: "Going Long", 15: "No Triple Repeats",
  };
  return titles[id] || `Rule ${id}`;
}

gamePasswordInput.addEventListener("input", () => {
  if (winScreen && !winScreen.classList.contains("hidden")) return;
  renderRules(gamePasswordInput.value);
});

restartGame.onclick = () => {
  gamePasswordInput.value = "";
  visibleRules = [allRules[0]];
  winScreen.classList.add("hidden");
  rulesContainer.style.display = "flex";
  renderRules("");
  showToast("🔄 Game restarted!");
};

playAgainBtn.onclick = () => {
  gamePasswordInput.value = "";
  visibleRules = [allRules[0]];
  winScreen.classList.add("hidden");
  rulesContainer.style.display = "flex";
  renderRules("");
};

// ===== MODAL CLICK-OUTSIDE =====
generatorModal.addEventListener("click", e => {
  if (e.target === generatorModal) generatorModal.classList.remove("show");
});

// ===== INIT =====
applyTheme(isDark);
loadTip();
updateStrength();
renderHistory();

/* ============================================================
   PASSWORD TRAINER - FULL VERSION
   ============================================================ */

// ===== DOM REFS =====
const passwordInput    = document.getElementById("password");
const strengthText     = document.getElementById("strength-text");
const progressFill     = document.getElementById("progress-fill");
const complexityEl     = document.getElementById("complexity");
const ttc1e3           = document.getElementById("ttc-1e3");
const ttc1e9           = document.getElementById("ttc-1e9");
const ttc1e12          = document.getElementById("ttc-1e12");
const copyBtn          = document.getElementById("copy-btn");
const togglePassword   = document.getElementById("toggle-password");
const saveHistoryBtn   = document.getElementById("saveHistoryBtn");
const tipBox           = document.getElementById("tipBox");
const modePwBtn        = document.getElementById("modePassword");
const modeGameBtn      = document.getElementById("modeGamified");
const passwordMode     = document.getElementById("passwordMode");
const gamifiedMode     = document.getElementById("gamifiedMode");
const generatorModal   = document.getElementById("generator-modal");
const openGeneratorBtn = document.getElementById("open-generator-btn");
const generatorCancel  = document.getElementById("generator-cancel");
const generateBtn      = document.getElementById("generate-btn");
const useGeneratedBtn  = document.getElementById("use-generated-btn");
const lengthSlider     = document.getElementById("length-slider");
const numberSlider     = document.getElementById("number-slider");
const specialSlider    = document.getElementById("special-slider");
const lengthValue      = document.getElementById("length-value");
const numberValue      = document.getElementById("number-value");
const specialValue     = document.getElementById("special-value");
const generatedPreview = document.getElementById("generatedPreview");
const settingsBtn      = document.getElementById("settingsBtn");
const settingsModal    = document.getElementById("settings-modal");
const settingsClose    = document.getElementById("settings-close");
const darkModeToggle   = document.getElementById("darkModeToggle");
const musicToggle      = document.getElementById("musicToggle");
const volumeSlider     = document.getElementById("volumeSlider");
const volumeValue      = document.getElementById("volumeValue");
const musicControls    = document.getElementById("musicControls");
const musicVisualizer  = document.getElementById("musicVisualizer");
const historyList      = document.getElementById("historyList");
const clearHistoryBtn  = document.getElementById("clearHistoryBtn");
const gamePasswordInput= document.getElementById("gamePassword");
const rulesContainer   = document.getElementById("rules-container");
const rulesPassed      = document.getElementById("rulesPassed");
const gameProgressFill = document.getElementById("game-progress-fill");
const restartGame      = document.getElementById("restartGame");
const winScreen        = document.getElementById("win-screen");
const playAgainBtn     = document.getElementById("playAgainBtn");
const toast            = document.getElementById("toast");

// ===== STATE =====
let passwordHistory = JSON.parse(localStorage.getItem("pwHistory") || "[]");
let isDark          = localStorage.getItem("darkMode") === "true";
let musicEnabled    = false;
let audioCtx        = null;
let musicNodes      = [];
let lastGeneratedPw = "";
let gameInitialized = false;
let visibleRules    = [];
let totalRules      = 0;
let allRules        = [];

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

// ===== TOAST =====
function showToast(msg, duration = 2200) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), duration);
}

// ===== ENTROPY =====
function entropy(pw) {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^A-Za-z0-9]/.test(pw)) pool += 32;
  if (pool === 0) pool = 26;
  return pw.length * Math.log2(pool);
}

// ===== FORMAT TIME =====
function formatTime(seconds) {
  if (seconds === Infinity || isNaN(seconds)) return "Impossible";
  if (seconds >= 1e9 * 365.25 * 24 * 3600)   return "Impossible";
  const units = [
    [1e6 * 365.25 * 24 * 3600, "million years"],
    [365.25 * 24 * 3600,        "years"],
    [86400,                      "days"],
    [3600,                       "hours"],
    [60,                         "minutes"],
    [1,                          "seconds"],
  ];
  for (const [div, label] of units) {
    if (seconds >= div) return `${Math.floor(seconds / div).toLocaleString()} ${label}`;
  }
  return "< 1 second";
}

// ===== SCORE =====
function getScore(pw) {
  let score = 0;
  if (pw.length >= 8)           score++;
  if (pw.length >= 12)          score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[a-z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (!/(.)\1\1/.test(pw) && pw.length > 0) score++;
  return score;
}

// ===== CRITERIA =====
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
    "c-length":   "At least 8 characters",
    "c-length12": "At least 12 characters",
    "c-upper":    "Uppercase letter",
    "c-lower":    "Lowercase letter",
    "c-number":   "Number",
    "c-special":  "Special character",
    "c-norepeat": "No 3+ repeated characters",
  };
  for (const [id, pass] of Object.entries(checks)) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.textContent = (pass ? "✅ " : "⬜ ") + labels[id];
    el.className = "criteria-item" + (pass ? " pass" : "");
  }
}

// ===== UPDATE STRENGTH =====
function updateStrength() {
  const pw = passwordInput.value;
  if (!pw) {
    strengthText.textContent  = "Password strength: —";
    progressFill.style.width  = "0%";
    complexityEl.textContent  = "Password complexity: —";
    ttc1e3.textContent = "—"; ttc1e9.textContent = "—"; ttc1e12.textContent = "—";
    ttc1e3.className = ttc1e9.className = ttc1e12.className = "ttc-value";
    updateCriteria("");
    return;
  }
  const bits = entropy(pw);
  complexityEl.textContent = `Password complexity: ${bits.toFixed(2)} bits`;
  const g1 = Math.pow(2, bits) / 1e3;
  const g2 = Math.pow(2, bits) / 1e9;
  const g3 = Math.pow(2, bits) / 1e12;
  function setTtc(el, s) {
    const t = formatTime(s);
    el.textContent = t;
    el.className = t === "Impossible" ? "ttc-value impossible" : "ttc-value";
  }
  setTtc(ttc1e3, g1); setTtc(ttc1e9, g2); setTtc(ttc1e12, g3);
  const score = getScore(pw);
  progressFill.style.width = (score / 7 * 100).toFixed(1) + "%";
  if (score <= 2) { strengthText.textContent = "Password strength: Weak ❌"; progressFill.style.background = "var(--danger)"; }
  else if (score <= 4) { strengthText.textContent = "Password strength: Fair ⚠️"; progressFill.style.background = "var(--warn)"; }
  else if (score <= 6) { strengthText.textContent = "Password strength: Strong ✅"; progressFill.style.background = "var(--success)"; }
  else { strengthText.textContent = "Password strength: Excellent 🏆"; progressFill.style.background = "linear-gradient(90deg, var(--accent), var(--accent2))"; }
  updateCriteria(pw);
}

passwordInput.addEventListener("input", updateStrength);
togglePassword.onchange = () => { passwordInput.type = togglePassword.checked ? "text" : "password"; };
copyBtn.onclick = () => {
  const pw = passwordInput.value;
  if (!pw) { showToast("Nothing to copy!"); return; }
  navigator.clipboard.writeText(pw).then(() => showToast("Copied!"));
};

// ===== HISTORY =====
function getStrengthLabel(pw) {
  const s = getScore(pw);
  if (s <= 2) return "weak";
  if (s <= 5) return "medium";
  return "strong";
}
function renderHistory() {
  historyList.innerHTML = "";
  if (!passwordHistory.length) { historyList.innerHTML = '<p class="empty-history">No saved passwords yet. Hit 💾 Save in Password Mode!</p>'; return; }
  const wrap = document.createElement("div");
  wrap.className = "history-list";
  [...passwordHistory].reverse().forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item";
    const label = getStrengthLabel(item.pw);
    div.innerHTML = `<span class="history-pw">${item.pw}</span><span class="history-strength ${label}">${label}</span><span class="history-time">${item.time}</span><button class="history-copy-btn" data-pw="${encodeURIComponent(item.pw)}">📋</button>`;
    wrap.appendChild(div);
  });
  historyList.appendChild(wrap);
  historyList.querySelectorAll(".history-copy-btn").forEach(btn => {
    btn.onclick = () => navigator.clipboard.writeText(decodeURIComponent(btn.dataset.pw)).then(() => showToast("Copied from history!"));
  });
}
saveHistoryBtn.onclick = () => {
  const pw = passwordInput.value;
  if (!pw) { showToast("Type a password first!"); return; }
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  passwordHistory.push({ pw, time });
  if (passwordHistory.length > 20) passwordHistory.shift();
  localStorage.setItem("pwHistory", JSON.stringify(passwordHistory));
  renderHistory();
  showToast("Password saved!");
};
clearHistoryBtn.onclick = () => { passwordHistory = []; localStorage.removeItem("pwHistory"); renderHistory(); showToast("History cleared"); };

// ===== GENERATOR =====
openGeneratorBtn.onclick = () => { generatorModal.classList.add("show"); generatedPreview.textContent = "—"; useGeneratedBtn.disabled = true; };
generatorCancel.onclick  = () => generatorModal.classList.remove("show");
function generatePassword(len, numbers, specials) {
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits  = "0123456789";
  const special = "!@#$%^&*-_=+?";
  let arr = [];
  for (let i = 0; i < numbers; i++) arr.push(digits[Math.floor(Math.random() * digits.length)]);
  for (let i = 0; i < specials; i++) arr.push(special[Math.floor(Math.random() * special.length)]);
  while (arr.length < len) arr.push(letters[Math.floor(Math.random() * letters.length)]);
  return arr.sort(() => Math.random() - 0.5).join("");
}
generateBtn.onclick = () => { lastGeneratedPw = generatePassword(+lengthSlider.value, +numberSlider.value, +specialSlider.value); generatedPreview.textContent = lastGeneratedPw; useGeneratedBtn.disabled = false; };
useGeneratedBtn.onclick = () => { passwordInput.value = lastGeneratedPw; updateStrength(); generatorModal.classList.remove("show"); showToast("Password applied!"); };
lengthSlider.oninput  = () => lengthValue.textContent  = lengthSlider.value;
numberSlider.oninput  = () => numberValue.textContent  = numberSlider.value;
specialSlider.oninput = () => specialValue.textContent = specialSlider.value;
generatorModal.addEventListener("click", e => { if (e.target === generatorModal) generatorModal.classList.remove("show"); });

// ===== DARK MODE =====
function applyTheme(dark) {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  darkModeToggle.checked = dark;
  localStorage.setItem("darkMode", dark);
}
darkModeToggle.onchange = () => { isDark = darkModeToggle.checked; applyTheme(isDark); };

// ===== SETTINGS =====
settingsBtn.onclick     = () => { renderHistory(); settingsModal.classList.add("show"); };
settingsClose.onclick   = () => settingsModal.classList.remove("show");
settingsModal.addEventListener("click", e => { if (e.target === settingsModal) settingsModal.classList.remove("show"); });

// ===== MUSIC =====
function startMusic() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const vol = audioCtx.createGain();
  vol.gain.value = +volumeSlider.value / 100 * 0.4;
  vol.connect(audioCtx.destination);
  musicNodes.push(vol);
  const notes = [130.81, 164.81, 196.00, 220.00, 261.63, 196.00, 164.81, 220.00];
  let noteIdx = 0;
  function playNote() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(vol);
    osc.type = "sine"; osc.frequency.value = notes[noteIdx % notes.length]; osc.detune.value = (Math.random() - 0.5) * 10;
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.3);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.4);
    osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 1.5); noteIdx++;
  }
  playNote();
  const interval = setInterval(() => { if (!musicEnabled) { clearInterval(interval); return; } playNote(); }, 900);
  musicNodes.push({ stop: () => clearInterval(interval) });
}
function stopMusic() { if (audioCtx) { audioCtx.close(); audioCtx = null; } musicNodes = []; }
musicToggle.onchange = () => {
  musicEnabled = musicToggle.checked;
  musicControls.style.display = musicEnabled ? "flex" : "none";
  musicVisualizer.classList.toggle("hidden", !musicEnabled);
  if (musicEnabled) startMusic(); else stopMusic();
};
volumeSlider.oninput = () => {
  volumeValue.textContent = volumeSlider.value + "%";
  if (audioCtx && musicNodes[0]) musicNodes[0].gain.value = +volumeSlider.value / 100 * 0.4;
};

// ===== MODE SWITCHING =====
modePwBtn.onclick = () => { modePwBtn.classList.add("active"); modeGameBtn.classList.remove("active"); passwordMode.classList.add("active"); gamifiedMode.classList.remove("active"); };
modeGameBtn.onclick = () => { modeGameBtn.classList.add("active"); modePwBtn.classList.remove("active"); gamifiedMode.classList.add("active"); passwordMode.classList.remove("active"); if (!gameInitialized) initGame(); };

// ===== TIP =====
function loadTip() { tipBox.textContent = TIPS[Math.floor(Math.random() * TIPS.length)]; }

// ===== GAME =====
function buildRules() {
  const today = new Date();
  const month = today.toLocaleString("default", { month: "long" });
  const dayOfWeek = today.toLocaleString("default", { weekday: "long" });
  return [
    { id:1,  title:"Length Check",       desc:"Your password must be at least 5 characters.",                                hint:"Just start typing!",                     check: p => p.length >= 5 },
    { id:2,  title:"Add a Number",       desc:"Your password must include at least one number.",                             hint:"Add any digit: 0-9",                    check: p => /[0-9]/.test(p) },
    { id:3,  title:"Uppercase Letter",   desc:"Your password must include an uppercase letter.",                             hint:"Hold Shift and type a letter.",          check: p => /[A-Z]/.test(p) },
    { id:4,  title:"Special Character",  desc:"Your password must include a special character like ! @ # $ % ^ & *",        hint:"Try adding ! or #",                      check: p => /[!@#$%^&*]/.test(p) },
    { id:5,  title:"12 Characters",      desc:"Your password must be at least 12 characters long.",                         hint:"Keep typing to reach 12.",               check: p => p.length >= 12 },
    { id:6,  title:"Current Month",      desc:`Your password must include the current month: ${month}.`,                    hint:`Type the word: ${month}`,                check: p => p.toLowerCase().includes(month.toLowerCase()) },
    { id:7,  title:"Digit Sum",          desc:"All digits in your password must add up to at least 25.",                    hint:"Try 9+9+9 = 27.",                        check: p => { let s=0; for(let c of p) if(c>='0'&&c<='9') s+=+c; return s>=25; } },
    { id:8,  title:"Day of the Week",    desc:`Your password must contain today's day: ${dayOfWeek}.`,                      hint:`Type: ${dayOfWeek}`,                     check: p => p.toLowerCase().includes(dayOfWeek.toLowerCase()) },
    { id:9,  title:"Current Year",       desc:`Your password must include the current year: ${today.getFullYear()}.`,       hint:`Add: ${today.getFullYear()}`,            check: p => p.includes(String(today.getFullYear())) },
    { id:10, title:"Special Variety",    desc:"Your password must contain at least 3 different special characters.",        hint:"Mix like ! @ # or $ % ^",                check: p => { const s=new Set([...p].filter(c=>/[^A-Za-z0-9]/.test(c))); return s.size>=3; } },
    { id:11, title:"No Triple Repeats",  desc:"Your password must not have the same character three times in a row.",       hint:"Avoid patterns like aaa or 111.",        check: p => !(/(.)\1\1/.test(p)) },
    { id:12, title:"Contains 'secure'",  desc:"Your password must contain the word: secure",                                hint:"Just type the word: secure",             check: p => p.toLowerCase().includes("secure") },
    { id:13, title:"20 Characters",      desc:"Your password must be at least 20 characters long.",                         hint:"Keep adding characters.",                check: p => p.length >= 20 },
  ];
}
function initGame() {
  gameInitialized = true;
  allRules        = buildRules();
  totalRules      = allRules.length;
  visibleRules    = [allRules[0]];
  winScreen.classList.add("hidden");
  rulesContainer.style.display = "flex";
  renderRules("");
}
function getRuleTitle(id) {
  const t = {1:"Length Check",2:"Add a Number",3:"Uppercase Letter",4:"Special Character",5:"12 Characters",6:"Time Awareness",7:"Digit Sum",8:"Day Awareness",9:"Current Year",10:"Special Variety",11:"No Triple Repeats",12:"Contains 'secure'",13:"20 Characters"};
  return t[id] || `Rule ${id}`;
}
function renderRules(pw) {
  rulesContainer.innerHTML = "";
  let passCount = 0;
  visibleRules.forEach((rule, i) => {
    const pass = rule.check(pw);
    if (pass) passCount++;
    const stateClass = pass ? "rule-pass" : (i === visibleRules.length - 1 ? "rule-pending" : "rule-fail");
    const card = document.createElement("div");
    card.className = `rule-card ${stateClass}`;
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
  gameProgressFill.style.background = passCount === totalRules ? "linear-gradient(90deg, var(--success), var(--accent))" : passCount > totalRules * 0.6 ? "var(--success)" : passCount > totalRules * 0.3 ? "var(--warn)" : "var(--danger)";
  const allCurrentPass = visibleRules.every(r => r.check(pw));
  if (allCurrentPass && visibleRules.length < allRules.length) {
    visibleRules.push(allRules[visibleRules.length]);
    showToast(`Rule ${visibleRules.length} unlocked!`);
    renderRules(pw);
    return;
  }
  if (passCount === totalRules && totalRules > 0) {
    setTimeout(() => {
      const preview = document.getElementById("winPasswordPreview");
      if (preview) preview.textContent = pw || gamePasswordInput.value;
      winScreen.classList.remove("hidden");
      rulesContainer.style.display = "none";
      showToast("You won the Password Game!", 4000);
    }, 500);
  }
}
gamePasswordInput.addEventListener("input", () => { if (winScreen && !winScreen.classList.contains("hidden")) return; renderRules(gamePasswordInput.value); });
restartGame.onclick = () => { gamePasswordInput.value = ""; visibleRules = [allRules[0]]; winScreen.classList.add("hidden"); rulesContainer.style.display = "flex"; renderRules(""); showToast("Game restarted!"); };
playAgainBtn.onclick = () => { gamePasswordInput.value = ""; visibleRules = [allRules[0]]; winScreen.classList.add("hidden"); rulesContainer.style.display = "flex"; renderRules(""); };
const copyWinPasswordBtn = document.getElementById("copyWinPasswordBtn");
if (copyWinPasswordBtn) {
  copyWinPasswordBtn.onclick = () => {
    const pw = gamePasswordInput.value;
    if (!pw) { showToast("No password to copy!"); return; }
    navigator.clipboard.writeText(pw).then(() => { copyWinPasswordBtn.textContent = "Copied!"; setTimeout(() => { copyWinPasswordBtn.textContent = "📋 Copy Password"; }, 2000); showToast("Winning password copied!"); });
  };
}

// ===== ATTACK MODAL =====
const ATTACK_INFO = {
  online:  { icon:"🐢", title:"Online Attack",  speed:"~1,000 guesses/sec",             desc:"An online attack is what happens when a hacker tries to log into a live website by guessing your password directly. The website's server slows them down — it has rate limits, lockouts after failed attempts, and CAPTCHAs. This is the slowest type of attack.",                                                                                                                                example:"Think of someone repeatedly trying passwords on a login page until they get locked out. Most sites block after 5-10 failed attempts." },
  offline: { icon:"⚡", title:"Offline Attack", speed:"~1,000,000,000 guesses/sec",     desc:"An offline attack happens after a hacker steals a database of hashed passwords from a breached website. They can run guesses on their own hardware with no server blocking them. A modern GPU can test billions of passwords per second.",                                                                                                                                                         example:"When major sites like LinkedIn or RockYou were breached, attackers downloaded all the password hashes and cracked them at home using GPU rigs — no rate limiting, no lockouts." },
  cluster: { icon:"🚀", title:"Cluster Attack", speed:"~1,000,000,000,000 guesses/sec", desc:"A cluster attack uses dozens or hundreds of machines working together to crack passwords in parallel. Intelligence agencies, well-funded criminal groups, or large botnets can achieve this. At a trillion guesses per second, even long passwords can fall quickly if they follow predictable patterns.", example:"Imagine 1,000 GPUs all running simultaneously, each testing different parts of the password space. Nation-state attackers operate at this scale." },
};
const attackModal   = document.getElementById("attack-modal");
const attackIcon    = document.getElementById("attackModalIcon");
const attackTitle   = document.getElementById("attackModalTitle");
const attackSpeed   = document.getElementById("attackModalSpeed");
const attackDesc    = document.getElementById("attackModalDesc");
const attackExample = document.getElementById("attackModalExample");
const attackClose   = document.getElementById("attackModalClose");
function openAttackModal(type) {
  const info = ATTACK_INFO[type];
  attackIcon.textContent = info.icon; attackTitle.textContent = info.title; attackSpeed.textContent = info.speed; attackDesc.textContent = info.desc; attackExample.textContent = "💡 " + info.example;
  attackModal.classList.add("show");
}
["online","offline","cluster"].forEach(type => {
  const card = document.getElementById(`ttc-card-${type}`);
  if (card) { card.addEventListener("click", () => openAttackModal(type)); card.addEventListener("keydown", e => { if (e.key==="Enter"||e.key===" ") openAttackModal(type); }); }
});
attackClose.onclick = () => attackModal.classList.remove("show");
attackModal.addEventListener("click", e => { if (e.target === attackModal) attackModal.classList.remove("show"); });

// ===== INIT =====
applyTheme(isDark);
loadTip();
updateStrength();
renderHistory();

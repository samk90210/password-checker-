/* script.js
   Final integrated file:
   - Smooth sun/moon pastel toggle (B)
   - Password Complexity + Estimated time to break
   - Lofi YouTube background with settings
   - History & export (local)
   - Generator modal
   - Gamified full-screen builder
   - Smooth animations throughout
*/

// -----------------------------
// Configuration & constants
// -----------------------------
const YT_VIDEO_ID = "8b3fqIBrNW0"; // user-supplied lofi
const MUSIC_PREF_KEY = "pw_music_prefs_v3";
const THEME_KEY = "pw_theme_v3";
const HISTORY_KEY = "pw_history_v3";

const GUESSES = { "1e3": 1e3, "1e9": 1e9, "1e12": 1e12 };

// -----------------------------
// Small helpers
// -----------------------------
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

function formatSeconds(sec){
  if (!isFinite(sec) || sec <= 0) return "∞";
  const units = [
    ["years", 60*60*24*365],
    ["days", 60*60*24],
    ["hours", 60*60],
    ["minutes", 60],
    ["seconds", 1]
  ];
  for (const [name, value] of units) {
    if (sec >= value) {
      const v = Math.floor(sec / value);
      return `${v} ${name}`;
    }
  }
  return `${Math.round(sec)} seconds`;
}

// -----------------------------
// DOM references
// -----------------------------
const settingsBtn = $("#settingsBtn");
const settingsPanel = $("#settingsPanel");
const closeSettings = $("#closeSettings");
const themeToggle = $("#themeToggle");
const themeIcon = $("#themeIcon");
const playPauseBtn = $("#playPauseBtn");
const volumeSlider = $("#volumeSlider");
const openGeneratorSmall = $("#openGeneratorSmall");
const openHistoryBtn = $("#openHistory");
const exportHistoryBtn = $("#exportHistory");

const mainCard = $(".main-card");
const modePassword = $("#modePassword");
const modeGamified = $("#modeGamified");

const passwordInput = $("#password");
const togglePassword = $("#toggle-password");
const copyBtn = $("#copy-btn");
const openGeneratorBtn = $("#open-generator-btn");
const saveHistoryBtn = $("#saveHistoryBtn");

const strengthText = $("#strength-text");
const progressFill = $("#progress-fill");
const requirementsList = $("#requirements");
const complexityEl = $("#complexity");

const ttc1e3 = $("#ttc-1e3");
const ttc1e9 = $("#ttc-1e9");
const ttc1e12 = $("#ttc-1e12");

// Game
const gamePanel = $("#gamePanel");
const closeGame = $("#closeGame");
const gameQuestion = $("#gameQuestion");
const gameAnswer = $("#gameAnswer");
const submitAnswerBtn = $("#submit-answer-btn");
const skipBtn = $("#skip-btn");
const gameProgress = $("#gameProgress");
const gameMessage = $("#gameMessage");

// Generator
const generatorModal = $("#generator-modal");
const generatorClose = $("#generator-close");
const lengthSlider = $("#length-slider");
const numberSlider = $("#number-slider");
const specialSlider = $("#special-slider");
const lengthValue = $("#length-value");
const numberValue = $("#number-value");
const specialValue = $("#special-value");
const generateBtn = $("#generate-btn");
const generatorCancel = $("#generator-cancel");

// History
const historyModal = $("#history-modal");
const historyClose = $("#history-close");
const historyList = $("#history-list");
const clearHistoryBtn = $("#clearHistory");
const downloadHistoryBtn = $("#downloadHistory");

// -----------------------------
// Theme (smooth sun/moon toggle)
// -----------------------------
function saveTheme(isDark){ localStorage.setItem(THEME_KEY, isDark ? "dark":"light"); }
function loadTheme(){ return localStorage.getItem(THEME_KEY) === "dark"; }
function applyTheme(isDark){
  document.body.classList.toggle("dark", !!isDark);
  // icon swap + animation
  if (isDark) {
    themeIcon.textContent = "🌙";
    themeToggle.setAttribute("aria-pressed","true");
    // subtle rotate & scale
    themeIcon.style.transform = "rotate(20deg) scale(.95)";
    setTimeout(()=> themeIcon.style.transform = "rotate(0deg) scale(1)", 700);
  } else {
    themeIcon.textContent = "☀️";
    themeToggle.setAttribute("aria-pressed","false");
    themeIcon.style.transform = "rotate(-20deg) scale(1.05)";
    setTimeout(()=> themeIcon.style.transform = "rotate(0deg) scale(1)", 700);
  }
  // smooth sky animation already handled by CSS transitions on body
}

applyTheme(loadTheme());

themeToggle.addEventListener("click", () => {
  const isDark = !document.body.classList.contains("dark");
  applyTheme(isDark);
  saveTheme(isDark);
});

// -----------------------------
// Settings panel open/close
// -----------------------------
settingsBtn.addEventListener("click", () => {
  settingsPanel.classList.toggle("open");
  settingsPanel.setAttribute("aria-hidden", settingsPanel.classList.contains("open") ? "false" : "true");
});
closeSettings.addEventListener("click", () => {
  settingsPanel.classList.remove("open");
  settingsPanel.setAttribute("aria-hidden","true");
});
document.addEventListener("keydown", (e)=>{ if (e.key === "Escape") settingsPanel.classList.remove("open"); });

// -----------------------------
// YouTube lofi player (IFrame API)
// -----------------------------
let ytPlayer = null;
let ytReady = false;
let musicPrefs = { volume: 0.5, muted: true, playing: true };

function saveMusicPrefs(){ localStorage.setItem(MUSIC_PREF_KEY, JSON.stringify(musicPrefs)); }
function loadMusicPrefs(){ try { const s = localStorage.getItem(MUSIC_PREF_KEY); return s ? JSON.parse(s) : null; } catch { return null; } }

(function initMusicPrefs() {
  const p = loadMusicPrefs();
  if (p) musicPrefs = {...musicPrefs, ...p};
  volumeSlider.value = musicPrefs.volume ?? 0.5;
  playPauseBtn.textContent = musicPrefs.playing ? "⏸ Pause" : "▶ Play";
})();

(function loadYT(){
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
})();

window.onYouTubeIframeAPIReady = function(){
  const holder = $("#yt-holder");
  const div = document.createElement("div");
  div.id = "yt-player";
  holder.appendChild(div);
  ytPlayer = new YT.Player("yt-player", {
    height: "0", width: "0", videoId: YT_VIDEO_ID,
    playerVars: { autoplay:1, controls:0, loop:1, modestbranding:1, rel:0, playlist:YT_VIDEO_ID },
    events: {
      onReady: (e) => {
        ytReady = true;
        const vol = Math.round((musicPrefs.volume ?? 0.5) * 100);
        try { e.target.setVolume(vol); } catch {}
        if (musicPrefs.muted) e.target.mute(); else e.target.unMute();
        try { e.target.playVideo(); } catch {}
      }
    }
  });
};

playPauseBtn.addEventListener("click", () => {
  if (!ytReady) return;
  const state = ytPlayer.getPlayerState();
  if (state === YT.PlayerState.PLAYING) {
    ytPlayer.pauseVideo(); playPauseBtn.textContent = "▶ Play"; musicPrefs.playing = false;
  } else {
    ytPlayer.playVideo(); playPauseBtn.textContent = "⏸ Pause"; musicPrefs.playing = true;
  }
  saveMusicPrefs();
});

volumeSlider.addEventListener("input", () => {
  const v = parseFloat(volumeSlider.value);
  if (ytReady && ytPlayer.setVolume) {
    ytPlayer.setVolume(Math.round(v*100));
    if (v > 0 && ytPlayer.isMuted && ytPlayer.isMuted()) { ytPlayer.unMute(); musicPrefs.muted = false; }
  }
  musicPrefs.volume = v;
  saveMusicPrefs();
});

// -----------------------------
// Password Complexity & time estimate
// -----------------------------
function estimateEntropy(password){
  if (!password || password.length === 0) return 0;
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[\W_]/.test(password)) pool += 32;
  if (pool === 0) pool = 26;
  const bitsPerChar = Math.log2(pool);
  return +(password.length * bitsPerChar).toFixed(2);
}
function timeToBreakSeconds(entropyBits, guessesPerSecond){
  const tries = Math.pow(2, entropyBits - 1);
  if (!isFinite(tries)) return Infinity;
  return tries / guessesPerSecond;
}

function evaluatePassword(password){
  const lengthOK = password.length >= 12;
  const lengthStrong = password.length >= 14;
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

  let label = "Requirements not met ❌";
  let color = "var(--danger)";
  if (!lengthOK) { label = "Requirements not met ❌"; color = "var(--danger)"; }
  else if (lengthStrong && score === 5) { label = "Strong ✅"; color = "var(--good)"; }
  else { label = "Intermediate ⚠️"; color = "var(--warn)"; }

  const entropy = estimateEntropy(password);
  return { label, color, score, requirements:{lengthOK,lengthStrong,hasUpper,hasLower,hasNumber,hasSpecial}, entropy };
}

function refreshUIFromPassword(){
  const pw = passwordInput.value || "";
  const res = evaluatePassword(pw);
  strengthText.textContent = `Strength: ${res.label}`;

  const percent = (res.score / 5) * 100;
  progressFill.style.width = percent + "%";
  if (res.color === "var(--good)") progressFill.style.background = "var(--good)";
  else if (res.color === "var(--warn)") progressFill.style.background = "var(--warn)";
  else progressFill.style.background = "var(--danger)";

  requirementsList.innerHTML = `
    <li style="color:${res.requirements.lengthOK ? '#16a34a' : '#ef4444'}">✔️ At least 12 characters</li>
    <li style="color:${res.requirements.hasUpper ? '#16a34a' : '#ef4444'}">✔️ Uppercase letter</li>
    <li style="color:${res.requirements.hasLower ? '#16a34a' : '#ef4444'}">✔️ Lowercase letter</li>
    <li style="color:${res.requirements.hasNumber ? '#16a34a' : '#ef4444'}">✔️ Number</li>
    <li style="color:${res.requirements.hasSpecial ? '#16a34a' : '#ef4444'}">✔️ Special character</li>
    <li style="color:${res.requirements.lengthStrong ? '#16a34a' : '#f59e0b'}">⭐ 14+ chars for max strength</li>
  `;

  // Complexity & time to break labels (simpler wording)
  const entropy = res.entropy;
  complexityEl.textContent = `Password Complexity: ${entropy} bits`;

  const t1 = timeToBreakSeconds(entropy, GUESSES["1e3"]);
  const t2 = timeToBreakSeconds(entropy, GUESSES["1e9"]);
  const t3 = timeToBreakSeconds(entropy, GUESSES["1e12"]);

  $("#ttc-1e3").textContent = formatSeconds(t1);
  $("#ttc-1e9").textContent = formatSeconds(t2);
  $("#ttc-1e12").textContent = formatSeconds(t3);
}

passwordInput.addEventListener("input", refreshUIFromPassword);
togglePassword.addEventListener("change", function(){ passwordInput.type = this.checked ? "text":"password"; });

// copy
copyBtn.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(passwordInput.value); const prev = copyBtn.textContent; copyBtn.textContent = "✅ Copied!"; setTimeout(()=>copyBtn.textContent=prev,1200); }
  catch { alert("Copy failed — select and copy manually."); }
});

// -----------------------------
// History (localStorage)
function loadHistory(){ try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; } }
function saveHistory(list){ localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); }
function addToHistory(password){
  if (!password) return;
  const hist = loadHistory();
  const now = new Date().toISOString();
  const entropy = estimateEntropy(password);
  const item = { id: Date.now(), password, entropy, savedAt: now };
  hist.unshift(item);
  if (hist.length > 100) hist.length = 100;
  saveHistory(hist);
  return item;
}
$("#saveHistoryBtn").addEventListener("click", () => {
  const pw = passwordInput.value;
  if (!pw) { alert("No password to save."); return; }
  addToHistory(pw);
  alert("Saved locally. Do not store real passwords in history.");
});

$("#openHistory").addEventListener("click", () => {
  renderHistory();
  historyModal.classList.add("show");
  historyModal.setAttribute("aria-hidden","false");
});
$("#history-close").addEventListener("click", () => { historyModal.classList.remove("show"); historyModal.setAttribute("aria-hidden","true"); });
function renderHistory(){
  const list = loadHistory();
  if (!list.length) { historyList.innerHTML = "<div style='color:#777'>No saved passwords.</div>"; return; }
  historyList.innerHTML = "";
  list.forEach(entry => {
    const row = document.createElement("div");
    row.style.display = "flex"; row.style.justifyContent = "space-between"; row.style.alignItems = "center"; row.style.padding = "8px 6px"; row.style.borderBottom = "1px solid rgba(0,0,0,0.04)";
    const left = document.createElement("div"); left.style.flex="1";
    left.innerHTML = `<div style="font-weight:600">${entry.password}</div><div style="font-size:12px;color:#666">Complexity: ${entry.entropy} bits • ${new Date(entry.savedAt).toLocaleString()}</div>`;
    const actions = document.createElement("div"); actions.style.display="flex"; actions.style.gap="8px";
    const copy = document.createElement("button"); copy.textContent="Copy"; copy.className="pill"; copy.style.padding="6px 8px";
    copy.addEventListener("click", async ()=> { try { await navigator.clipboard.writeText(entry.password); copy.textContent="✅"; setTimeout(()=>copy.textContent="Copy",900); } catch { alert("Copy failed"); }});
    const useBtn = document.createElement("button"); useBtn.textContent="Use"; useBtn.className="pill"; useBtn.style.padding="6px 8px";
    useBtn.addEventListener("click", ()=> { passwordInput.value = entry.password; refreshUIFromPassword(); historyModal.classList.remove("show"); });
    const del = document.createElement("button"); del.textContent="Del"; del.className="ghost"; del.style.padding="6px 8px";
    del.addEventListener("click", ()=> { const arr = loadHistory().filter(e=>e.id !== entry.id); saveHistory(arr); renderHistory(); });
    actions.appendChild(copy); actions.appendChild(useBtn); actions.appendChild(del);
    row.appendChild(left); row.appendChild(actions); historyList.appendChild(row);
  });
}
clearHistoryBtn.addEventListener("click", ()=> { if (!confirm("Clear saved password history?")) return; saveHistory([]); renderHistory(); });
downloadHistoryBtn.addEventListener("click", ()=> {
  const list = loadHistory();
  const blob = new Blob([JSON.stringify(list, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `password_history_${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
});
$("#exportHistory").addEventListener("click", ()=> { downloadHistoryBtn.click(); });

// -----------------------------
// Generator
function openGenerator(){ generatorModal.classList.add("show"); generatorModal.setAttribute("aria-hidden","false"); }
function closeGenerator(){ generatorModal.classList.remove("show"); generatorModal.setAttribute("aria-hidden","true"); }
$("#open-generator-btn").addEventListener("click", openGenerator);
$("#openGeneratorSmall").addEventListener("click", openGenerator);
generatorClose.addEventListener("click", closeGenerator);
generatorCancel.addEventListener("click", closeGenerator);
function refreshSliderLabels(){ lengthValue.textContent = lengthSlider.value; numberValue.textContent = numberSlider.value; specialValue.textContent = specialSlider.value; }
[lengthSlider, numberSlider, specialSlider].forEach(s => s && s.addEventListener("input", refreshSliderLabels));
refreshSliderLabels();
function generatePassword(length=12, numbers=2, specials=2){
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const specialChars = "!@#$%^&*()-_=+[]{}<>?/|";
  const arr=[];
  for(let i=0;i<numbers;i++) arr.push(digits[Math.floor(Math.random()*digits.length)]);
  for(let i=0;i<specials;i++) arr.push(specialChars[Math.floor(Math.random()*specialChars.length)]);
  while(arr.length < length) arr.push(letters[Math.floor(Math.random()*letters.length)]);
  for(let i=arr.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
  return arr.join("");
}
generateBtn.addEventListener("click", ()=> { const l = parseInt(lengthSlider.value,10), n = parseInt(numberSlider.value,10), s = parseInt(specialSlider.value,10); const pw = generatePassword(l,n,s); passwordInput.value = pw; refreshUIFromPassword(); closeGenerator(); });

// -----------------------------
// Gamified full-screen
const securitySteps = [
  { q: "Type exactly 2 UPPERCASE letters (e.g., AB)", test: s => /^[A-Z]{2}$/.test(s), transform: s=>s },
  { q: "Type a symbol from !@#$%^&* followed by a single digit (e.g., @5)", test: s => /^[!@#$%^&*][0-9]$/.test(s), transform: s=>s },
  { q: "Type 3 random lowercase letters (e.g., xqz)", test: s => /^[a-z]{3}$/.test(s), transform: s=>s },
  { q: "Enter a 4-digit number that is NOT sequential like 1234 or all repeated like 1111", test: s => {
      if(!/^[0-9]{4}$/.test(s)) return false;
      if(/^([0-9])\1{3}$/.test(s)) return false;
      const d = s.split("").map(Number); let inc=true, dec=true;
      for(let i=1;i<d.length;i++){ if(d[i] !== d[i-1]+1) inc=false; if(d[i] !== d[i-1]-1) dec=false; }
      return !(inc||dec);
    }, transform: s=>s },
  { q: "Type two short words (3-6 letters) joined by a symbol (e.g., moon#lake)", test: s => /^([A-Za-z]{3,6})([!@#$%^&*])([A-Za-z]{3,6})$/.test(s), transform: s=>s }
];
let gameIndex = 0, builtPassword = "";
function openGamePanel(){ gamePanel.classList.add("open"); gamePanel.setAttribute("aria-hidden","false"); mainCard.style.transform = "translateX(-6%) scale(.995)"; gameIndex=0; builtPassword=""; showGameStep(); }
function closeGamePanel(){ gamePanel.classList.remove("open"); gamePanel.setAttribute("aria-hidden","true"); mainCard.style.transform=""; gameAnswer.value=""; gameMessage.textContent=""; }
function showGameStep(){ const s = securitySteps[gameIndex]; gameQuestion.textContent = s.q; gameProgress.textContent = `Step ${gameIndex+1} / ${securitySteps.length}`; gameAnswer.value=""; gameMessage.textContent=""; }
$("#modeGamified").addEventListener("click", ()=> { setActiveModeUI("gamified"); openGamePanel(); });
$("#modePassword").addEventListener("click", ()=> { setActiveModeUI("password"); closeGamePanel(); });
submitAnswerBtn.addEventListener("click", ()=> {
  const v = (gameAnswer.value||"").trim(); const step = securitySteps[gameIndex];
  if (step.test(v)){
    builtPassword += step.transform(v);
    gameMessage.textContent = "✅ Good!"; gameMessage.classList.add("ok"); setTimeout(()=>gameMessage.textContent="",900);
    gameIndex++;
    if (gameIndex < securitySteps.length) animateGameStepTransition(showGameStep);
    else { passwordInput.value = builtPassword; refreshUIFromPassword(); gameMessage.textContent = "🎉 Password built and filled!"; setTimeout(()=>{ closeGamePanel(); setActiveModeUI("password"); }, 900); }
  } else flashGameMessage("That doesn't match the requirement. Try again.");
});
skipBtn.addEventListener("click", ()=> { builtPassword += Math.random().toString(36).slice(2,5); gameIndex++; if (gameIndex < securitySteps.length) animateGameStepTransition(showGameStep); else { passwordInput.value = builtPassword; refreshUIFromPassword(); closeGamePanel(); setActiveModeUI("password"); } });
function flashGameMessage(text){ gameMessage.classList.remove("ok"); gameMessage.textContent = text; setTimeout(()=>{ if (gameMessage.textContent===text) gameMessage.textContent=""; },2000); }
function animateGameStepTransition(nextFn){ const el = document.querySelector(".game-center"); el.style.transition = "transform .28s ease, opacity .28s ease"; el.style.transform = "translateX(-9px)"; el.style.opacity = "0.6"; setTimeout(()=>{ nextFn(); el.style.transform="translateX(0)"; el.style.opacity="1"; },220); }
$("#closeGame").addEventListener("click", ()=> { closeGamePanel(); setActiveModeUI("password"); });

function setActiveModeUI(mode){ if(mode==="password"){ $("#modePassword").classList.add("active"); $("#modeGamified").classList.remove("active"); } else { $("#modePassword").classList.remove("active"); $("#modeGamified").classList.add("active"); } }

// -----------------------------
// Initial UX
passwordInput.addEventListener("input", refreshUIFromPassword);
refreshUIFromPassword();
(function revealMain(){ mainCard.style.opacity = 0; mainCard.style.transform = "translateY(8px)"; setTimeout(()=>{ mainCard.style.transition = "transform .48s var(--ease), opacity .36s var(--ease)"; mainCard.style.opacity = 1; mainCard.style.transform = "translateY(0)"; },60); })();

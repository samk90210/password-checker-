/* script.js
   - Soft pastel sun/moon emoji toggle (B)
   - Settings panel (⚙) with music controls and history
   - Autoplay lofi (muted) on load (soft start)
   - Easier gamified questions
   - "Password complexity" bits + "Estimated crack time"
   - Smooth animations
*/

// ---------- constants & helpers ----------
const YT_VIDEO_ID = "8b3fqIBrNW0";
const MUSIC_KEY = "pw_music_v4";
const THEME_KEY = "pw_theme_v4";
const HISTORY_KEY = "pw_hist_v4";

const GUESSES = { "1e3": 1e3, "1e9": 1e9, "1e12": 1e12 };

const $ = s => document.querySelector(s);

// format seconds to friendly string
function formatSeconds(sec){
  if (!isFinite(sec) || sec <= 0) return "∞";
  const units = [["years",60*60*24*365],["days",60*60*24],["hours",60*60],["minutes",60],["seconds",1]];
  for (const [label, value] of units) if(sec >= value) return `${Math.floor(sec/value)} ${label}`;
  return `${Math.round(sec)} seconds`;
}

// ---------- DOM refs ----------
const settingsBtn = $("#settingsBtn"), settingsPanel = $("#settingsPanel"), closeSettings = $("#closeSettings");
const themeToggle = $("#themeToggle"), themeIcon = $("#themeIcon");
const musicBtn = $("#musicBtn"), volumeSlider = $("#volumeSlider");
const openHistory = $("#openHistory"), exportHistory = $("#exportHistory"), openGeneratorSmall = $("#openGeneratorSmall");

const passwordInput = $("#password"), togglePassword = $("#toggle-password"), copyBtn = $("#copy-btn");
const openGeneratorBtn = $("#open-generator-btn"), saveHistoryBtn = $("#saveHistoryBtn");

const strengthText = $("#strength-text"), progressFill = $("#progress-fill"), requirementsList = $("#requirements");
const complexityEl = $("#complexity"), ttc1e3 = $("#ttc-1e3"), ttc1e9 = $("#ttc-1e9"), ttc1e12 = $("#ttc-1e12");

// game/generator/history refs
const gamePanel = $("#gamePanel"), closeGame = $("#closeGame"), gameQuestion = $("#gameQuestion"), gameAnswer = $("#gameAnswer");
const submitAnswerBtn = $("#submit-answer-btn"), skipBtn = $("#skip-btn"), gameProgress = $("#gameProgress"), gameMessage = $("#gameMessage");

const generatorModal = $("#generator-modal"), generatorClose = $("#generator-close"), generateBtn = $("#generate-btn");
const lengthSlider = $("#length-slider"), numberSlider = $("#number-slider"), specialSlider = $("#special-slider");
const lengthValue = $("#length-value"), numberValue = $("#number-value"), specialValue = $("#special-value");

const historyModal = $("#history-modal"), historyClose = $("#history-close"), historyList = $("#history-list");
const clearHistoryBtn = $("#clearHistory"), downloadHistoryBtn = $("#downloadHistory");

// ---------- theme (sun/moon emoji only) ----------
function saveTheme(isDark){ localStorage.setItem(THEME_KEY, isDark ? "dark":"light"); }
function loadTheme(){ return localStorage.getItem(THEME_KEY) === "dark"; }
function applyTheme(isDark){
  document.body.classList.toggle("dark", !!isDark);
  themeIcon.textContent = isDark ? "🌙" : "☀️";
  themeToggle.setAttribute("aria-pressed", !!isDark);
  // small icon animation
  themeIcon.style.transform = "scale(0.92) rotate(-8deg)";
  setTimeout(()=> themeIcon.style.transform = "scale(1) rotate(0deg)", 420);
}
applyTheme(loadTheme());

themeToggle.addEventListener("click", () => {
  const isDark = !document.body.classList.contains("dark");
  applyTheme(isDark);
  saveTheme(isDark);
});

// ---------- settings panel ----------
settingsBtn.addEventListener("click", ()=>{
  settingsPanel.classList.toggle("open");
  settingsPanel.setAttribute("aria-hidden", settingsPanel.classList.contains("open") ? "false":"true");
});
closeSettings.addEventListener("click", ()=> { settingsPanel.classList.remove("open"); });

// ---------- YouTube lofi autoplay (muted) ----------
let ytPlayer = null, ytReady = false;
let musicState = { volume: 0.35, muted: true, playing: true };

function saveMusic(){ localStorage.setItem(MUSIC_KEY, JSON.stringify(musicState)); }
function loadMusic(){ try{ const s = localStorage.getItem(MUSIC_KEY); if (s) musicState = {...musicState, ...JSON.parse(s)}; }catch{} }
loadMusic();
volumeSlider.value = musicState.volume ?? 0.35;
musicBtn.textContent = musicState.playing ? "⏸" : "▶";

(function loadYT(){
  const tag = document.createElement("script"); tag.src = "https://www.youtube.com/iframe_api"; document.head.appendChild(tag);
})();
window.onYouTubeIframeAPIReady = function(){
  const holder = document.getElementById("yt-holder");
  const div = document.createElement("div"); div.id = "yt-player"; holder.appendChild(div);
  ytPlayer = new YT.Player("yt-player", {
    height:"0", width:"0", videoId: YT_VIDEO_ID,
    playerVars: { autoplay:1, controls:0, loop:1, modestbranding:1, rel:0, playlist: YT_VIDEO_ID },
    events: {
      onReady: e => {
        ytReady = true;
        try { e.target.setVolume(Math.round((musicState.volume ?? 0.35)*100)); } catch {}
        if (musicState.muted) e.target.mute(); else e.target.unMute();
        try { e.target.playVideo(); } catch {}
      }
    }
  });
};

musicBtn.addEventListener("click", ()=>{
  if (!ytReady) return;
  const state = ytPlayer.getPlayerState();
  if (state === YT.PlayerState.PLAYING) { ytPlayer.pauseVideo(); musicBtn.textContent = "▶"; musicState.playing = false; }
  else { ytPlayer.playVideo(); musicBtn.textContent = "⏸"; musicState.playing = true; }
  saveMusic();
});

volumeSlider.addEventListener("input", ()=>{
  const v = parseFloat(volumeSlider.value);
  if (ytReady && ytPlayer.setVolume) {
    ytPlayer.setVolume(Math.round(v*100));
    if (v > 0 && ytPlayer.isMuted && ytPlayer.isMuted()) { ytPlayer.unMute(); musicState.muted = false; }
  }
  musicState.volume = v; saveMusic();
});

// ---------- password complexity (bits) & time ----------
function estimateEntropy(password){
  if (!password || !password.length) return 0;
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[\W_]/.test(password)) pool += 32;
  if (pool === 0) pool = 26;
  const bits = +(password.length * Math.log2(pool)).toFixed(2);
  return bits;
}
function timeToBreakSeconds(entropyBits, guessesPerSecond){
  const tries = Math.pow(2, entropyBits - 1);
  if (!isFinite(tries)) return Infinity;
  return tries / guessesPerSecond;
}

function evaluatePassword(pw){
  const lengthOK = pw.length >= 12;
  const lengthStrong = pw.length >= 14;
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[\W_]/.test(pw);

  let score = 0;
  if (lengthOK) score++; if (hasUpper) score++; if (hasLower) score++; if (hasNumber) score++; if (hasSpecial) score++;

  let label = "Requirements not met ❌", color = "var(--danger)";
  if (!lengthOK) { label = "Requirements not met ❌"; color = "var(--danger)"; }
  else if (lengthStrong && score === 5) { label = "Strong ✅"; color = "var(--good)"; }
  else { label = "Intermediate ⚠️"; color = "var(--warn)"; }

  const entropy = estimateEntropy(pw);
  return { label, color, score, requirements:{lengthOK,lengthStrong,hasUpper,hasLower,hasNumber,hasSpecial}, entropy };
}

function refreshUI(){
  const pw = passwordInput.value || "";
  const res = evaluatePassword(pw);
  strengthText.textContent = `Password strength level: ${res.label}`;

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

  const entropy = res.entropy;
  complexityEl.textContent = `Password complexity: ${entropy} bits`;

  const t1 = timeToBreakSeconds(entropy, GUESSES["1e3"]);
  const t2 = timeToBreakSeconds(entropy, GUESSES["1e9"]);
  const t3 = timeToBreakSeconds(entropy, GUESSES["1e12"]);

  ttc1e3.textContent = formatSeconds(t1);
  ttc1e9.textContent = formatSeconds(t2);
  ttc1e12.textContent = formatSeconds(t3);
}

passwordInput.addEventListener("input", refreshUI);
togglePassword.addEventListener("change", function(){ passwordInput.type = this.checked ? "text":"password"; });

// copy
copyBtn.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(passwordInput.value); const prev = copyBtn.textContent; copyBtn.textContent = "✅ Copied!"; setTimeout(()=>copyBtn.textContent = prev,1200); }
  catch { alert("Copy failed. Select & copy manually."); }
});

// ---------- history (local) ----------
function loadHistory(){ try { return JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]"); } catch { return []; } }
function saveHistory(h){ localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); }
function addToHistory(pw){
  if (!pw) return;
  const list = loadHistory();
  const item = { id: Date.now(), password: pw, entropy: estimateEntropy(pw), savedAt: new Date().toISOString() };
  list.unshift(item);
  if (list.length > 100) list.length = 100;
  saveHistory(list);
  return item;
}
saveHistoryBtn.addEventListener("click", ()=> {
  const pw = passwordInput.value;
  if (!pw) return alert("No password to save.");
  addToHistory(pw);
  alert("Saved locally (do not store real passwords here).");
});

$("#openHistory").addEventListener("click", ()=> { renderHistory(); historyModal.classList.add("show"); });
$("#history-close").addEventListener("click", ()=> { historyModal.classList.remove("show"); });

function renderHistory(){
  const list = loadHistory();
  if (!list.length) { historyList.innerHTML = "<div style='color:#777'>No saved passwords.</div>"; return; }
  historyList.innerHTML = "";
  list.forEach(entry => {
    const row = document.createElement("div");
    row.style.display="flex";row.style.justifyContent="space-between";row.style.alignItems="center";row.style.padding="8px 6px";row.style.borderBottom="1px solid rgba(0,0,0,0.04)";
    const left = document.createElement("div"); left.style.flex="1";
    left.innerHTML = `<div style="font-weight:600">${entry.password}</div><div style="font-size:12px;color:#666">Complexity: ${entry.entropy} bits • ${new Date(entry.savedAt).toLocaleString()}</div>`;
    const actions = document.createElement("div"); actions.style.display="flex";actions.style.gap="8px";
    const cbtn = document.createElement("button"); cbtn.textContent="Copy"; cbtn.className="pill"; cbtn.style.padding="6px 8px";
    cbtn.addEventListener("click", async ()=> { try{ await navigator.clipboard.writeText(entry.password); cbtn.textContent="✅"; setTimeout(()=>cbtn.textContent="Copy",900);}catch{alert("Copy failed")} });
    const useBtn = document.createElement("button"); useBtn.textContent="Use"; useBtn.className="pill"; useBtn.style.padding="6px 8px";
    useBtn.addEventListener("click", ()=> { passwordInput.value = entry.password; refreshUI(); historyModal.classList.remove("show"); });
    const del = document.createElement("button"); del.textContent="Del"; del.className="ghost"; del.style.padding="6px 8px";
    del.addEventListener("click", ()=> { const arr = loadHistory().filter(e=>e.id!==entry.id); saveHistory(arr); renderHistory(); });
    actions.appendChild(cbtn); actions.appendChild(useBtn); actions.appendChild(del); row.appendChild(left); row.appendChild(actions); historyList.appendChild(row);
  });
}
clearHistoryBtn.addEventListener("click", ()=> { if (!confirm("Clear saved password history?")) return; saveHistory([]); renderHistory(); });
downloadHistoryBtn.addEventListener("click", ()=> {
  const list = loadHistory();
  const blob = new Blob([JSON.stringify(list, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `password_history_${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
});
exportHistory.addEventListener("click", ()=> downloadHistoryBtn.click());

// ---------- generator ----------
function openGenerator(){ generatorModal.classList.add("show"); generatorModal.setAttribute("aria-hidden","false"); }
function closeGenerator(){ generatorModal.classList.remove("show"); generatorModal.setAttribute("aria-hidden","true"); }
openGeneratorBtn.addEventListener("click", openGenerator);
openGeneratorSmall.addEventListener("click", openGenerator);
generatorClose.addEventListener("click", closeGenerator);
generatorCancel.addEventListener("click", closeGenerator);

function refreshSliderLabels(){ lengthValue.textContent = lengthSlider.value; numberValue.textContent = numberSlider.value; specialValue.textContent = specialSlider.value; }
[lengthSlider, numberSlider, specialSlider].forEach(s => s && s.addEventListener("input", refreshSliderLabels));
refreshSliderLabels();

function generatePassword(length=12, numbers=2, specials=2){
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const specialChars = "!@#$%^&*()-_=+[]{}<>?/|";
  const arr = [];
  for (let i=0;i<numbers;i++) arr.push(digits[Math.floor(Math.random()*digits.length)]);
  for (let i=0;i<specials;i++) arr.push(specialChars[Math.floor(Math.random()*specials.length)]);
  while (arr.length < length) arr.push(letters[Math.floor(Math.random()*letters.length)]);
  for (let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
  return arr.join("");
}
generateBtn.addEventListener("click", ()=> {
  const l = parseInt(lengthSlider.value,10), n = parseInt(numberSlider.value,10), s = parseInt(specialSlider.value,10);
  const pw = generatePassword(l,n,s);
  passwordInput.value = pw; refreshUI(); closeGenerator();
});

// ---------- gamified (easier phrasing) ----------
const steps = [
  { q: "Type 2 UPPERCASE letters (e.g., AB)", test: s=> /^[A-Z]{2}$/.test(s), transform: s=>s },
  { q: "Type one symbol and one digit (e.g., @5)", test: s=> /^[!@#$%^&*][0-9]$/.test(s), transform: s=>s },
  { q: "Type 3 LOWERCASE letters (e.g., xqz)", test: s=> /^[a-z]{3}$/.test(s), transform: s=>s },
  { q: "Type a 4-digit number that's not 1234 or 1111", test: s=> {
      if (!/^[0-9]{4}$/.test(s)) return false;
      if (/^([0-9])\1{3}$/.test(s)) return false;
      const d = s.split("").map(Number); let inc=true, dec=true;
      for (let i=1;i<d.length;i++){ if (d[i] !== d[i-1]+1) inc=false; if (d[i] !== d[i-1]-1) dec=false; }
      return !(inc||dec);
    }, transform: s=>s },
  { q: "Type two short words (3-6 letters) with a symbol between (e.g., moon#lake)", test: s=> /^([A-Za-z]{3,6})([!@#$%^&*])([A-Za-z]{3,6})$/.test(s), transform: s=>s }
];

let gi = 0, built = "";
function openGame(){ gamePanel.classList.add("open"); gamePanel.setAttribute("aria-hidden","false"); document.querySelector(".main-card").style.transform="translateX(-6%) scale(.995)"; gi=0; built=""; showStep(); }
function closeGame(){ gamePanel.classList.remove("open"); gamePanel.setAttribute("aria-hidden","true"); document.querySelector(".main-card").style.transform=""; gameAnswer.value=""; gameMessage.textContent=""; }
function showStep(){ const s = steps[gi]; $("#gameQuestion").textContent = s.q; gameProgress.textContent = `Step ${gi+1} / ${steps.length}`; gameAnswer.value=""; gameMessage.textContent=""; }
$("#modeGamified").addEventListener("click", ()=> { setActiveMode("gamified"); openGame(); });
$("#modePassword").addEventListener("click", ()=> { setActiveMode("password"); closeGame(); });

submitAnswerBtn.addEventListener("click", ()=> {
  const v = (gameAnswer.value||"").trim(); const cur = steps[gi];
  if (cur.test(v)) {
    built += cur.transform(v);
    gameMessage.textContent = "✅ Good!";
    setTimeout(()=> gameMessage.textContent = "", 700);
    gi++;
    if (gi < steps.length) animateStepTransition(showStep);
    else { passwordInput.value = built; refreshUI(); gameMessage.textContent = "🎉 Built and filled!"; setTimeout(()=>{ closeGame(); setActiveMode("password"); },900); }
  } else flashGame("That doesn't match the requirement. Try again.");
});
skipBtn.addEventListener("click", ()=> { built += Math.random().toString(36).slice(2,5); gi++; if (gi < steps.length) animateStepTransition(showStep); else { passwordInput.value = built; refreshUI(); closeGame(); setActiveMode("password"); } });

function flashGame(text){ gameMessage.classList.remove("ok"); gameMessage.textContent = text; setTimeout(()=>{ if (gameMessage.textContent === text) gameMessage.textContent = ""; },2000); }
function animateStepTransition(fn){ const el = document.querySelector(".game-center"); el.style.transition = "transform .28s ease, opacity .28s ease"; el.style.transform = "translateX(-9px)"; el.style.opacity = .6; setTimeout(()=>{ fn(); el.style.transform="translateX(0)"; el.style.opacity=1; },220); }

$("#closeGame").addEventListener("click", ()=> { closeGame(); setActiveMode("password"); });

// ---------- UI helpers ----------
function setActiveMode(mode){ if (mode==="password"){ $("#modePassword").classList.add("active"); $("#modeGamified").classList.remove("active"); } else { $("#modePassword").classList.remove("active"); $("#modeGamified").classList.add("active"); } }
setActiveMode("password");

// ---------- small initializations ----------
passwordInput.addEventListener("input", refreshUI);
refreshUI();

// small reveal
(function reveal(){ const mc = document.querySelector(".main-card"); mc.style.opacity=0; mc.style.transform="translateY(8px)"; setTimeout(()=>{ mc.style.transition="transform .48s cubic-bezier(.2,.9,.2,1), opacity .36s"; mc.style.opacity=1; mc.style.transform="translateY(0)"; },80); })();

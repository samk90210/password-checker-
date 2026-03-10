/* script.js */

const YT_VIDEO_ID = "8b3fqIBrNW0";

const MUSIC_KEY = "pw_music_v4";
const THEME_KEY = "pw_theme_v4";
const HISTORY_KEY = "pw_hist_v4";

const GUESSES = { "1e3": 1e3, "1e9": 1e9, "1e12": 1e12 };

const $ = s => document.querySelector(s);

function formatSeconds(sec){
  if (!isFinite(sec) || sec <= 0) return "∞";
  const units = [
    ["years",31536000],
    ["days",86400],
    ["hours",3600],
    ["minutes",60],
    ["seconds",1]
  ];
  for (const [label,value] of units){
    if(sec >= value) return `${Math.floor(sec/value)} ${label}`;
  }
  return `${Math.round(sec)} seconds`;
}

/* DOM */
const settingsBtn = $("#settingsBtn");
const settingsPanel = $("#settingsPanel");
const closeSettings = $("#closeSettings");

const themeToggle = $("#themeToggle");
const themeIcon = $("#themeIcon");

const musicBtn = $("#musicBtn");
const volumeSlider = $("#volumeSlider");

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

/* generator */
const generatorModal = $("#generator-modal");
const generatorClose = $("#generator-close");
const generatorCancel = $("#generator-cancel");
const generateBtn = $("#generate-btn");

const lengthSlider = $("#length-slider");
const numberSlider = $("#number-slider");
const specialSlider = $("#special-slider");

const lengthValue = $("#length-value");
const numberValue = $("#number-value");
const specialValue = $("#special-value");

/* history */
const historyModal = $("#history-modal");
const historyClose = $("#history-close");
const historyList = $("#history-list");

const clearHistoryBtn = $("#clearHistory");
const downloadHistoryBtn = $("#downloadHistory");

const openHistory = $("#openHistory");
const exportHistory = $("#exportHistory");
const openGeneratorSmall = $("#openGeneratorSmall");

/* game */
const gamePanel = $("#gamePanel");
const closeGame = $("#closeGame");

const gameQuestion = $("#gameQuestion");
const gameAnswer = $("#gameAnswer");
const submitAnswerBtn = $("#submit-answer-btn");
const skipBtn = $("#skip-btn");

const gameProgress = $("#gameProgress");
const gameMessage = $("#gameMessage");

/* SETTINGS PANEL */

settingsBtn.onclick = () => {
  settingsPanel.classList.toggle("open");
};

closeSettings.onclick = () => {
  settingsPanel.classList.remove("open");
};

/* THEME */

function saveTheme(isDark){
  localStorage.setItem(THEME_KEY, isDark ? "dark":"light");
}

function loadTheme(){
  return localStorage.getItem(THEME_KEY) === "dark";
}

function applyTheme(isDark){
  document.body.classList.toggle("dark",isDark);
  themeIcon.textContent = isDark ? "🌙":"☀️";
}

applyTheme(loadTheme());

themeToggle.onclick = () => {
  const isDark = !document.body.classList.contains("dark");
  applyTheme(isDark);
  saveTheme(isDark);
};

/* PASSWORD ENTROPY */

function estimateEntropy(password){

  if(!password) return 0;

  let pool = 0;

  if(/[a-z]/.test(password)) pool += 26;
  if(/[A-Z]/.test(password)) pool += 26;
  if(/[0-9]/.test(password)) pool += 10;
  if(/[\W_]/.test(password)) pool += 32;

  if(pool === 0) pool = 26;

  return +(password.length * Math.log2(pool)).toFixed(2);
}

function timeToBreakSeconds(entropy, rate){
  const tries = Math.pow(2, entropy-1);
  return tries/rate;
}

function evaluatePassword(pw){

  const lengthOK = pw.length >= 12;
  const lengthStrong = pw.length >= 14;

  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[\W_]/.test(pw);

  let score = 0;

  if(lengthOK) score++;
  if(hasUpper) score++;
  if(hasLower) score++;
  if(hasNumber) score++;
  if(hasSpecial) score++;

  let label="Requirements not met ❌";
  let color="var(--danger)";

  if(lengthStrong && score===5){
    label="Strong ✅";
    color="var(--good)";
  }
  else if(lengthOK){
    label="Intermediate ⚠️";
    color="var(--warn)";
  }

  const entropy = estimateEntropy(pw);

  return {label,color,score,entropy,
    requirements:{lengthOK,lengthStrong,hasUpper,hasLower,hasNumber,hasSpecial}};
}

function refreshUI(){

  const pw = passwordInput.value || "";

  const res = evaluatePassword(pw);

  strengthText.textContent = `Password strength level: ${res.label}`;

  progressFill.style.width = (res.score/5*100)+"%";

  complexityEl.textContent = `Password complexity: ${res.entropy} bits`;

  const t1 = timeToBreakSeconds(res.entropy,GUESSES["1e3"]);
  const t2 = timeToBreakSeconds(res.entropy,GUESSES["1e9"]);
  const t3 = timeToBreakSeconds(res.entropy,GUESSES["1e12"]);

  ttc1e3.textContent = formatSeconds(t1);
  ttc1e9.textContent = formatSeconds(t2);
  ttc1e12.textContent = formatSeconds(t3);

}

passwordInput.addEventListener("input",refreshUI);

togglePassword.onchange = function(){
  passwordInput.type = this.checked ? "text":"password";
};

/* COPY */

copyBtn.onclick = async () => {
  await navigator.clipboard.writeText(passwordInput.value);
};

/* GENERATOR */

function openGenerator(){
  generatorModal.classList.add("show");
}

function closeGenerator(){
  generatorModal.classList.remove("show");
}

openGeneratorBtn.onclick = openGenerator;
openGeneratorSmall.onclick = openGenerator;
generatorClose.onclick = closeGenerator;
generatorCancel.onclick = closeGenerator;

function refreshSliderLabels(){
  lengthValue.textContent = lengthSlider.value;
  numberValue.textContent = numberSlider.value;
  specialValue.textContent = specialSlider.value;
}

[lengthSlider,numberSlider,specialSlider].forEach(s=>{
  s.addEventListener("input",refreshSliderLabels);
});

refreshSliderLabels();

function generatePassword(length=12,numbers=2,specials=2){

  const letters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits="0123456789";
  const specialsChars="!@#$%^&*()-_=+[]{}<>?/|";

  const arr=[];

  for(let i=0;i<numbers;i++)
    arr.push(digits[Math.floor(Math.random()*digits.length)]);

  for(let i=0;i<specials;i++)
    arr.push(specialsChars[Math.floor(Math.random()*specialsChars.length)]);

  while(arr.length < length)
    arr.push(letters[Math.floor(Math.random()*letters.length)]);

  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }

  return arr.join("");
}

generateBtn.onclick = () => {

  const l = +lengthSlider.value;
  const n = +numberSlider.value;
  const s = +specialSlider.value;

  const pw = generatePassword(l,n,s);

  passwordInput.value = pw;

  refreshUI();

  closeGenerator();

};

/* GAME */

const steps = [

{q:"Type 2 uppercase letters",test:s=>/^[A-Z]{2}$/.test(s)},
{q:"Type symbol + number",test:s=>/^[!@#$%^&*][0-9]$/.test(s)},
{q:"Type 3 lowercase letters",test:s=>/^[a-z]{3}$/.test(s)},
{q:"Type 4 random digits",test:s=>/^[0-9]{4}$/.test(s)},
{q:"Type two words with symbol (moon#lake)",test:s=>/^([A-Za-z]{3,6})([!@#$%^&*])([A-Za-z]{3,6})$/.test(s)}

];

let gi=0;
let built="";

function openGame(){
  gamePanel.classList.add("open");
  gi=0;
  built="";
  showStep();
}

function closeGamePanel(){
  gamePanel.classList.remove("open");
}

function showStep(){
  gameQuestion.textContent = steps[gi].q;
  gameProgress.textContent = `Step ${gi+1}/5`;
  gameAnswer.value="";
}

submitAnswerBtn.onclick = () => {

  const v = gameAnswer.value.trim();

  if(steps[gi].test(v)){

    built+=v;

    gi++;

    if(gi<steps.length) showStep();
    else{
      passwordInput.value = built;
      refreshUI();
      closeGamePanel();
    }

  }
};

skipBtn.onclick = () => {

  built += Math.random().toString(36).slice(2,5);

  gi++;

  if(gi<steps.length) showStep();
  else{
    passwordInput.value=built;
    refreshUI();
    closeGamePanel();
  }

};

closeGame.onclick = closeGamePanel;

$("#modeGamified").onclick = openGame;
$("#modePassword").onclick = closeGamePanel;

refreshUI();

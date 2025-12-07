/* script.js
   - Password checker (main focus)
   - Slide-in full-screen gamified mode (A)
   - Settings panel (music + theme) at top-right
   - Generator modal
   - Smooth animations & persisted theme/music prefs
*/

const YT_VIDEO_ID = "8b3fqIBrNW0"; // user's lofi YouTube ID
const MUSIC_PREF_KEY = "pw_music_prefs_v1";
const THEME_KEY = "pw_theme_v1";

document.addEventListener("DOMContentLoaded", () => {
  // DOM refs
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsPanel = document.getElementById("settingsPanel");
  const closeSettings = document.getElementById("closeSettings");
  const themeToggle = document.getElementById("themeToggle");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const volumeSlider = document.getElementById("volumeSlider");
  const openGeneratorSmall = document.getElementById("openGeneratorSmall");

  const mainCard = document.querySelector(".main-card");
  const modePassword = document.getElementById("modePassword");
  const modeGamified = document.getElementById("modeGamified");

  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("toggle-password");
  const copyBtn = document.getElementById("copy-btn");
  const openGeneratorBtn = document.getElementById("open-generator-btn");

  const strengthText = document.getElementById("strength-text");
  const progressFill = document.getElementById("progress-fill");
  const requirementsList = document.getElementById("requirements");

  // Game panel refs
  const gamePanel = document.getElementById("gamePanel");
  const closeGame = document.getElementById("closeGame");
  const gameQuestion = document.getElementById("gameQuestion");
  const gameAnswer = document.getElementById("gameAnswer");
  const submitAnswerBtn = document.getElementById("submit-answer-btn");
  const skipBtn = document.getElementById("skip-btn");
  const gameProgress = document.getElementById("gameProgress");
  const gameMessage = document.getElementById("gameMessage");

  // Generator modal refs
  const generatorModal = document.getElementById("generator-modal");
  const generatorClose = document.getElementById("generator-close");
  const lengthSlider = document.getElementById("length-slider");
  const numberSlider = document.getElementById("number-slider");
  const specialSlider = document.getElementById("special-slider");
  const lengthValue = document.getElementById("length-value");
  const numberValue = document.getElementById("number-value");
  const specialValue = document.getElementById("special-value");
  const generateBtn = document.getElementById("generate-btn");
  const generatorCancel = document.getElementById("generator-cancel");

  // Persisted state helpers
  function saveTheme(dark) { localStorage.setItem(THEME_KEY, dark ? "dark" : "light"); }
  function loadTheme() { return localStorage.getItem(THEME_KEY) === "dark"; }

  function saveMusicPrefs(prefs) {
    localStorage.setItem(MUSIC_PREF_KEY, JSON.stringify(prefs));
  }
  function loadMusicPrefs() {
    try { return JSON.parse(localStorage.getItem(MUSIC_PREF_KEY)); } catch { return null; }
  }

  /* ---------------------------
     THEME INIT
  --------------------------- */
  function applyTheme(dark) {
    document.body.classList.toggle("dark", !!dark);
    themeToggle.textContent = dark ? "Switch to Light" : "Switch to Dark";
  }
  applyTheme(loadTheme());

  themeToggle.addEventListener("click", () => {
    const isDark = !document.body.classList.contains("dark");
    applyTheme(isDark);
    saveTheme(isDark);
  });

  /* ---------------------------
     SETTINGS PANEL (open/close)
  --------------------------- */
  settingsBtn.addEventListener("click", () => {
    settingsPanel.classList.toggle("open");
    settingsPanel.setAttribute("aria-hidden", settingsPanel.classList.contains("open") ? "false" : "true");
  });
  closeSettings.addEventListener("click", () => {
    settingsPanel.classList.remove("open");
    settingsPanel.setAttribute("aria-hidden", "true");
  });
  // Close with escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      settingsPanel.classList.remove("open");
    }
  });

  /* ---------------------------
     YouTube IFrame Player for lofi
     - autoplay muted allowed by browsers; user can unmute via controls
  --------------------------- */
  let ytPlayer = null;
  let ytReady = false;

  // create controls initial state & load saved prefs
  const savedPrefs = loadMusicPrefs() || { volume: 0.5, muted: true, playing: true };
  volumeSlider.value = savedPrefs.volume ?? 0.5;
  playPauseBtn.textContent = savedPrefs.playing ? "⏸ Pause" : "▶ Play";

  // load YT API
  (function loadYT() {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  })();

  window.onYouTubeIframeAPIReady = function () {
    const holder = document.getElementById("yt-holder");
    const div = document.createElement("div");
    div.id = "yt-player";
    holder.appendChild(div);

    ytPlayer = new YT.Player("yt-player", {
      height: "0", width: "0", videoId: YT_VIDEO_ID,
      playerVars: { autoplay: 1, controls: 0, loop: 1, modestbranding: 1, rel: 0, playlist: YT_VIDEO_ID },
      events: {
        onReady: (e) => {
          ytReady = true;
          const vol = Math.round((savedPrefs.volume ?? 0.5) * 100);
          e.target.setVolume(vol);
          if (savedPrefs.muted) e.target.mute(); else e.target.unMute();
          // attempt play (muted autoplay should work)
          try { e.target.playVideo(); } catch {}
        },
        onStateChange: (e) => {
          // keep looped or update state UI if desired
        }
      }
    });
  };

  // Controls
  playPauseBtn.addEventListener("click", () => {
    if (!ytReady) return;
    const state = ytPlayer.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
      ytPlayer.pauseVideo();
      playPauseBtn.textContent = "▶ Play";
      savedPrefs.playing = false;
    } else {
      ytPlayer.playVideo();
      playPauseBtn.textContent = "⏸ Pause";
      savedPrefs.playing = true;
    }
    saveMusicPrefs(savedPrefs);
  });

  volumeSlider.addEventListener("input", () => {
    const v = parseFloat(volumeSlider.value);
    if (ytReady && ytPlayer.setVolume) {
      ytPlayer.setVolume(Math.round(v * 100));
      if (v > 0 && ytPlayer.isMuted && ytPlayer.isMuted()) {
        ytPlayer.unMute();
        savedPrefs.muted = false;
      }
    }
    savedPrefs.volume = v;
    saveMusicPrefs(savedPrefs);
  });

  // small "open generator" in settings
  openGeneratorSmall.addEventListener("click", () => {
    settingsPanel.classList.remove("open");
    openGenerator(); 
  });

  /* ---------------------------
     MODE SWITCHING (no dropdown)
  --------------------------- */
  function setActiveMode(mode) {
    if (mode === "password") {
      modePassword.classList.add("active");
      modeGamified.classList.remove("active");
      // close game if open
      closeGamePanel();
    } else {
      modePassword.classList.remove("active");
      modeGamified.classList.add("active");
      openGamePanel();
    }
  }
  modePassword.addEventListener("click", () => setActiveMode("password"));
  modeGamified.addEventListener("click", () => setActiveMode("gamified"));

  /* ---------------------------
     PASSWORD CHECKER LOGIC
  --------------------------- */
  function evaluatePassword(pw) {
    const lengthOK = pw.length >= 12;
    const lengthStrong = pw.length >= 14;
    const hasUpper = /[A-Z]/.test(pw);
    const hasLower = /[a-z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSpecial = /[\W_]/.test(pw);

    let score = 0;
    if (lengthOK) score++;
    if (hasUpper) score++;
    if (hasLower) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    let strength = "Requirements not met ❌";
    let color = "var(--danger)";

    if (!lengthOK) {
      strength = "Requirements not met ❌";
      color = "var(--danger)";
    } else if (lengthStrong && score === 5) {
      strength = "Strong ✅";
      color = "var(--good)";
    } else {
      strength = "Intermediate ⚠️";
      color = "var(--warn)";
    }

    return { strength, color, score, requirements: { lengthOK, lengthStrong, hasUpper, hasLower, hasNumber, hasSpecial } };
  }

  function refreshUIFromPassword() {
    const pw = passwordInput.value || "";
    const res = evaluatePassword(pw);
    strengthText.textContent = `Strength: ${res.strength}`;
    strengthText.style.color = "";

    // update progress
    const percent = (res.score / 5) * 100;
    progressFill.style.width = percent + "%";
    // set color
    if (res.color === "var(--good)") progressFill.style.background = "var(--good)";
    else if (res.color === "var(--warn)") progressFill.style.background = "var(--warn)";
    else progressFill.style.background = "var(--danger)";

    // requirements list
    requirementsList.innerHTML = `
      <li style="color:${res.requirements.lengthOK ? '#16a34a' : '#ef4444'}">✔️ At least 12 characters</li>
      <li style="color:${res.requirements.hasUpper ? '#16a34a' : '#ef4444'}">✔️ Uppercase letter</li>
      <li style="color:${res.requirements.hasLower ? '#16a34a' : '#ef4444'}">✔️ Lowercase letter</li>
      <li style="color:${res.requirements.hasNumber ? '#16a34a' : '#ef4444'}">✔️ Number</li>
      <li style="color:${res.requirements.hasSpecial ? '#16a34a' : '#ef4444'}">✔️ Special character</li>
      <li style="color:${res.requirements.lengthStrong ? '#16a34a' : '#f59e0b'}">⭐ 14+ chars for max strength</li>
    `;
  }

  passwordInput.addEventListener("input", () => {
    refreshUIFromPassword();
  });

  togglePassword.addEventListener("change", function() {
    passwordInput.type = this.checked ? "text" : "password";
  });

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(passwordInput.value);
      const txt = copyBtn.textContent;
      copyBtn.textContent = "✅ Copied!";
      setTimeout(() => copyBtn.textContent = txt, 1400);
    } catch {
      alert("Unable to copy. Please select the password and copy manually.");
    }
  });

  /* ---------------------------
     GENERATOR MODAL
  --------------------------- */
  function openGenerator() {
    // show modal
    generatorModal.classList.add("show");
    generatorModal.setAttribute("aria-hidden", "false");
  }
  function closeGenerator() {
    generatorModal.classList.remove("show");
    generatorModal.setAttribute("aria-hidden", "true");
  }

  openGeneratorBtn.addEventListener("click", openGenerator);
  generatorClose.addEventListener("click", closeGenerator);
  generatorCancel.addEventListener("click", closeGenerator);
  // small open in settings
  openGeneratorSmall.addEventListener("click", openGenerator);

  // slider live values
  function refreshSliderLabels() {
    lengthValue.textContent = lengthSlider.value;
    numberValue.textContent = numberSlider.value;
    specialValue.textContent = specialSlider.value;
  }
  [lengthSlider, numberSlider, specialSlider].forEach(sl => sl.addEventListener("input", refreshSliderLabels));
  refreshSliderLabels();

  function generatePassword(length=12,numbers=2,specials=2) {
    const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digits = "0123456789";
    const specialChars = "!@#$%^&*()-_=+[]{}<>?/|";
    const arr = [];
    for(let i=0;i<numbers;i++) arr.push(digits[Math.floor(Math.random()*digits.length)]);
    for(let i=0;i<specials;i++) arr.push(specialChars[Math.floor(Math.random()*specialChars.length)]);
    while(arr.length < length) arr.push(letters[Math.floor(Math.random()*letters.length)]);
    // shuffle
    for(let i = arr.length -1; i>0; i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join("");
  }

  generateBtn.addEventListener("click", () => {
    const len = parseInt(lengthSlider.value, 10);
    const nums = parseInt(numberSlider.value, 10);
    const specs = parseInt(specialSlider.value, 10);
    const pw = generatePassword(len, nums, specs);
    passwordInput.value = pw;
    refreshUIFromPassword();
    closeGenerator();
  });

  /* ---------------------------
     GAMIFIED MODE (slide-in full-screen)
     Security-focused steps (option C)
  --------------------------- */
  const securitySteps = [
    { q: "Type exactly 2 UPPERCASE letters (e.g., AB)", test: s => /^[A-Z]{2}$/.test(s), transform: s => s },
    { q: "Type a symbol from !@#$%^&* followed by a single digit (e.g., @5)", test: s => /^[!@#$%^&*][0-9]$/.test(s), transform: s => s },
    { q: "Type 3 random lowercase letters (e.g., xqz)", test: s => /^[a-z]{3}$/.test(s), transform: s => s },
    { q: "Enter a 4-digit number that is NOT sequential like 1234 or all repeated like 1111", test: s => {
        if(!/^[0-9]{4}$/.test(s)) return false;
        if(/^([0-9])\1{3}$/.test(s)) return false;
        const digits = s.split("").map(Number);
        let inc=true, dec=true;
        for(let i=1;i<digits.length;i++){
          if(digits[i] !== digits[i-1]+1) inc=false;
          if(digits[i] !== digits[i-1]-1) dec=false;
        }
        if(inc||dec) return false;
        return true;
      }, transform: s => s },
    { q: "Type two short words (3-6 letters) joined by a symbol (e.g., moon#lake)", test: s => /^([A-Za-z]{3,6})([!@#$%^&*])([A-Za-z]{3,6})$/.test(s), transform: s => s }
  ];

  let gameIndex = 0;
  let builtPassword = "";

  function openGamePanel() {
    // slide in
    gamePanel.classList.add("open");
    gamePanel.setAttribute("aria-hidden", "false");
    mainCard.style.transform = "translateX(-6%) scale(.995)";
    // initialize game
    gameIndex = 0;
    builtPassword = "";
    showGameStep();
  }

  function closeGamePanel() {
    gamePanel.classList.remove("open");
    gamePanel.setAttribute("aria-hidden", "true");
    mainCard.style.transform = "";
    // clear inputs
    gameAnswer.value = "";
    gameMessage.textContent = "";
  }

  function showGameStep() {
    const step = securitySteps[gameIndex];
    gameQuestion.textContent = step.q;
    gameProgress.textContent = `Step ${gameIndex+1} / ${securitySteps.length}`;
    gameAnswer.value = "";
    gameMessage.textContent = "";
  }

  submitAnswerBtn.addEventListener("click", () => {
    const val = (gameAnswer.value || "").trim();
    const step = securitySteps[gameIndex];
    if (step.test(val)) {
      builtPassword += step.transform(val);
      gameMessage.textContent = "✅ Good!";
      gameMessage.classList.add("ok");
      setTimeout(() => gameMessage.textContent = "", 900);
      gameIndex++;
      if (gameIndex < securitySteps.length) {
        // animate next step
        animateGameStepTransition(showGameStep);
      } else {
        // finished: set to password input, close panel
        passwordInput.value = builtPassword;
        refreshUIFromPassword();
        gameMessage.textContent = "🎉 Password built and filled in!";
        setTimeout(() => {
          closeGamePanel();
          setActiveModeUI("password");
        }, 1100);
      }
    } else {
      flashGameMessage("That doesn't match the requirement. Try again.");
    }
  });

  skipBtn.addEventListener("click", () => {
    // allow skip (adds a fallback random 3 chars)
    const fallback = Math.random().toString(36).slice(2,5);
    builtPassword += fallback;
    gameIndex++;
    if (gameIndex < securitySteps.length) animateGameStepTransition(showGameStep);
    else {
      passwordInput.value = builtPassword;
      refreshUIFromPassword();
      closeGamePanel();
      setActiveModeUI("password");
    }
  });

  function flashGameMessage(text) {
    gameMessage.classList.remove("ok");
    gameMessage.textContent = text;
    setTimeout(() => {
      if (gameMessage.textContent === text) gameMessage.textContent = "";
    }, 2000);
  }

  // small transition animation for the question card
  function animateGameStepTransition(nextFn) {
    const el = document.querySelector(".game-center");
    el.style.transition = "transform .28s ease, opacity .28s ease";
    el.style.transform = "translateX(-9px)";
    el.style.opacity = "0.6";
    setTimeout(() => {
      nextFn();
      el.style.transform = "translateX(0)";
      el.style.opacity = "1";
    }, 220);
  }

  closeGame.addEventListener("click", () => {
    closeGamePanel();
    setActiveModeUI("password");
  });

  // ensure UI mode pills reflect external actions
  function setActiveModeUI(mode){
    if(mode === "password") {
      modePassword.classList.add("active");
      modeGamified.classList.remove("active");
    } else {
      modePassword.classList.remove("active");
      modeGamified.classList.add("active");
    }
  }

  // set initial UI
  setActiveModeUI("password");

  /* ---------------------------
     Small UX helpers
  --------------------------- */
  function setInitial() { refreshUIFromPassword(); }
  setInitial();

  // Keyboard: Enter submits game answer
  gameAnswer.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitAnswerBtn.click();
  });

  // quick toggles
  document.addEventListener("keydown", (e) => {
    if (e.key === "g" && e.ctrlKey) openGenerator();
  });

  // expose openGenerator to local scope
  function openGenerator() {
    generatorModal.classList.add("show");
    generatorModal.setAttribute("aria-hidden", "false");
  }

  // also allow clicking outside modal to close
  generatorModal.addEventListener("click", (e) => {
    if (e.target === generatorModal) closeGenerator();
  });

  // Close generator from its close button
  function closeGenerator() {
    generatorModal.classList.remove("show");
    generatorModal.setAttribute("aria-hidden", "true");
  }

  // generator close button
  generatorClose.addEventListener("click", closeGenerator);

  /* ---------------------------
     Load persisted music prefs (update UI)
  --------------------------- */
  window.addEventListener("beforeunload", () => {
    // ensure prefs saved
    saveMusicPrefs(savedPrefs);
  });

  // small safety: if YT API fails, optionally use fallbackAudio element (not provided)
  // (Left as a placeholder if you want to use local mp3 fallback.)

  // Reveal: small initial animation for the main card
  mainCard.style.opacity = 0;
  mainCard.style.transform = "translateY(8px)";
  setTimeout(() => {
    mainCard.style.transition = "transform .48s var(--ease), opacity .36s var(--ease)";
    mainCard.style.opacity = 1;
    mainCard.style.transform = "translateY(0)";
  }, 80);

}); // DOMContentLoaded end

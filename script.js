/* script.js
   Full rewrite: password checker, generator modal, gamified strong-password questions,
   YouTube lofi background player + controls, and light/dark toggle.
*/

document.addEventListener("DOMContentLoaded", () => {
  /* ---------------------------
     Helpers & DOM refs
  --------------------------- */
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  // Existing elements (assume they exist based on your HTML)
  const passwordInput = $("#password");
  const strengthText = $("#strength-text");
  const requirementsList = $("#requirements");
  const togglePassword = $("#toggle-password");
  const copyBtn = $("#copy-btn");
  const progressFill = $("#progress-fill");

  // Modal/generator elements
  const openGeneratorBtn = $("#open-generator-btn");
  const generatorModal = $("#generator-modal");
  const closeModal = document.querySelector(".close");
  const generateBtn = $("#generate-btn");
  const lengthSlider = $("#length-slider");
  const numberSlider = $("#number-slider");
  const specialSlider = $("#special-slider");
  const lengthValue = $("#length-value");
  const numberValue = $("#number-value");
  const specialValue = $("#special-value");

  // Game mode
  const startGameBtn = $("#start-game-btn");
  const gameArea = $("#game-area");
  const gameQuestion = $("#game-question");
  const gameAnswer = $("#game-answer");
  const submitAnswerBtn = $("#submit-answer-btn");
  // note: we won't use the old <audio id="game-music">; we keep it but won't rely on it
  const gameMusicEl = $("#game-music");

  /* ---------------------------
     Theme (Light / Dark) Toggle
     - toggles 'theme-dark' on body
     - persists in localStorage
  --------------------------- */
  const THEME_KEY = "pw_theme";
  function createThemeToggle() {
    if ($("#theme-toggle")) return; // already created
    const ctl = document.createElement("div");
    ctl.id = "theme-toggle";
    ctl.style.position = "fixed";
    ctl.style.left = "20px";
    ctl.style.top = "20px";
    ctl.style.zIndex = "999";
    ctl.style.background = "rgba(255,255,255,0.9)";
    ctl.style.borderRadius = "12px";
    ctl.style.padding = "8px";
    ctl.style.boxShadow = "0 6px 18px rgba(0,0,0,0.08)";
    ctl.style.display = "flex";
    ctl.style.alignItems = "center";
    ctl.style.gap = "8px";

    const label = document.createElement("span");
    label.textContent = "Theme:";
    label.style.fontSize = "13px";
    label.style.color = "#333";

    const btn = document.createElement("button");
    btn.textContent = "🌙";
    btn.style.border = "none";
    btn.style.background = "transparent";
    btn.style.cursor = "pointer";
    btn.title = "Toggle light / dark";

    btn.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("theme-dark");
      localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
      btn.textContent = isDark ? "☀️" : "🌙";
      // Small visual tweak for control background when dark
      ctl.style.background = isDark ? "rgba(20,20,20,0.8)" : "rgba(255,255,255,0.9)";
      label.style.color = isDark ? "#eee" : "#333";
    });

    ctl.appendChild(label);
    ctl.appendChild(btn);
    document.body.appendChild(ctl);

    // initialize from storage
    const stored = localStorage.getItem(THEME_KEY) || "light";
    if (stored === "dark") {
      document.body.classList.add("theme-dark");
      btn.textContent = "☀️";
      ctl.style.background = "rgba(20,20,20,0.8)";
      label.style.color = "#eee";
    }
  }

  /* Minimal dark-mode CSS injection (since user asked for toggle but CSS might not include styles).
     This injects a few variables for easy dark styling; you can expand in your CSS later.
  */
  (function injectThemeStyles() {
    const css = `
      body.theme-dark {
        background: linear-gradient(145deg,#0f1724,#0b1220) !important;
        color: #e6eef8;
      }
      body.theme-dark .container {
        background: #071028 !important;
        box-shadow: 0 8px 24px rgba(0,0,0,0.6);
        color: #e6eef8;
      }
      body.theme-dark input, body.theme-dark .modal-content {
        background: #081426;
        color: #e6eef8;
        border-color: #173046;
      }
      body.theme-dark #copy-btn { background: #0b2633; color: #e6eef8; }
      body.theme-dark .music-controls { background: rgba(255,255,255,0.03); color: #e6eef8; }
    `;
    const style = document.createElement("style");
    style.innerHTML = css;
    document.head.appendChild(style);
  })();

  createThemeToggle();

  /* ---------------------------
     Password Checker
  --------------------------- */

  function evaluatePassword(password) {
    const lengthOK = password.length >= 12;
    const lengthStrong = password.length >= 14;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[\W_]/.test(password);

    // More nuanced scoring for progress bar (0..5)
    let score = 0;
    if (lengthOK) score++;
    if (hasUpper) score++;
    if (hasLower) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    let strength, color;
    if (!lengthOK) {
      strength = "Requirements not met ❌";
      color = "#e74c3c";
      score = Math.min(score, 1);
    } else if (lengthStrong && score === 5) {
      strength = "Strong ✅";
      color = "#16a34a";
    } else {
      strength = "Intermediate ⚠️";
      color = "#f59e0b";
    }

    return {
      strength,
      color,
      score,
      requirements: { lengthOK, lengthStrong, hasUpper, hasLower, hasNumber, hasSpecial }
    };
  }

  function updateRequirements(reqs) {
    requirementsList.innerHTML = `
      <li style="color: ${reqs.lengthOK ? "green" : "red"}">✔️ At least 12 characters</li>
      <li style="color: ${reqs.hasUpper ? "green" : "red"}">✔️ Uppercase letter</li>
      <li style="color: ${reqs.hasLower ? "green" : "red"}">✔️ Lowercase letter</li>
      <li style="color: ${reqs.hasNumber ? "green" : "red"}">✔️ Number</li>
      <li style="color: ${reqs.hasSpecial ? "green" : "red"}">✔️ Special character</li>
      <li style="color: ${reqs.lengthStrong ? "green" : "orange"}">⭐ 14+ chars for max strength</li>
    `;
  }

  function updateProgressBar(score, color) {
    const percent = (score / 5) * 100;
    progressFill.style.width = `${percent}%`;
    progressFill.style.backgroundColor = color;
  }

  passwordInput?.addEventListener("input", () => {
    const result = evaluatePassword(passwordInput.value);
    strengthText.textContent = `Strength: ${result.strength}`;
    strengthText.style.color = result.color;
    updateRequirements(result.requirements);
    updateProgressBar(result.score, result.color);
  });

  togglePassword?.addEventListener("change", function () {
    if (!passwordInput) return;
    passwordInput.type = this.checked ? "text" : "password";
  });

  copyBtn?.addEventListener("click", async () => {
    if (!passwordInput) return;
    try {
      await navigator.clipboard.writeText(passwordInput.value);
      const prev = copyBtn.textContent;
      copyBtn.textContent = "✅ Copied!";
      setTimeout(() => { copyBtn.textContent = prev; }, 1400);
    } catch (err) {
      alert("Unable to copy. Please select and copy manually.");
    }
  });

  /* ---------------------------
     Password Generator Modal
  --------------------------- */
  function openModal() { generatorModal.style.display = "block"; }
  function closeModalFn() { generatorModal.style.display = "none"; }
  openGeneratorBtn?.addEventListener("click", openModal);
  closeModal?.addEventListener("click", closeModalFn);
  window.addEventListener("click", (e) => {
    if (e.target === generatorModal) closeModalFn();
  });

  // Update slider values initially
  function refreshSliderValues() {
    if (lengthValue) lengthValue.textContent = lengthSlider?.value ?? "12";
    if (numberValue) numberValue.textContent = numberSlider?.value ?? "2";
    if (specialValue) specialValue.textContent = specialSlider?.value ?? "2";
  }
  refreshSliderValues();
  [lengthSlider, numberSlider, specialSlider].forEach(sl => {
    if (!sl) return;
    sl.addEventListener("input", refreshSliderValues);
  });

  function generatePassword(length = 12, numbers = 2, specials = 2) {
    const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digits = "0123456789";
    const specialChars = "!@#$%^&*()-_=+[]{}<>?/|";
    let result = [];

    // Force at least the number of digits/specials requested
    for (let i = 0; i < numbers; i++) result.push(digits[Math.floor(Math.random() * digits.length)]);
    for (let i = 0; i < specials; i++) result.push(specialChars[Math.floor(Math.random() * specialChars.length)]);
    while (result.length < length) result.push(letters[Math.floor(Math.random() * letters.length)]);
    // Shuffle
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result.join("");
  }

  generateBtn?.addEventListener("click", () => {
    const length = parseInt(lengthSlider?.value || 12, 10);
    const numbers = parseInt(numberSlider?.value || 2, 10);
    const specials = parseInt(specialSlider?.value || 2, 10);
    const pw = generatePassword(length, numbers, specials);
    if (passwordInput) {
      passwordInput.value = pw;
      passwordInput.dispatchEvent(new Event("input"));
    }
    closeModalFn();
  });

  /* ---------------------------
     Gamified Mode - Security-focused questions (Option C)
     We'll design a sequence of validators that ensure the final built password is strong.
     Each level returns a string snippet to append to builtPassword when validated.
  --------------------------- */
  let currentLevel = 0;
  let builtPassword = "";

  const securityQuestions = [
    // 1: Two uppercase letters (exactly two)
    {
      q: "Type exactly 2 UPPERCASE letters (e.g., AB)",
      validate: ans => /^[A-Z]{2}$/.test(ans),
      transform: ans => ans
    },
    // 2: Symbol + number (single symbol from set + single digit)
    {
      q: "Type a symbol from !@#$%^&* followed by a single digit (e.g., @5)",
      validate: ans => /^[!@#$%^&*][0-9]$/.test(ans),
      transform: ans => ans
    },
    // 3: Three random lowercase letters (nonsense)
    {
      q: "Type 3 random lowercase letters (e.g., xqz)",
      validate: ans => /^[a-z]{3}$/.test(ans),
      transform: ans => ans
    },
    // 4: 4-digit number not sequential or repeating (e.g., 1739 is ok, 1234 or 1111 not)
    {
      q: "Enter a 4-digit number that is not sequential (1234) nor all repeated (1111)",
      validate: ans => {
        if (!/^[0-9]{4}$/.test(ans)) return false;
        // not all the same
        if (/^([0-9])\1{3}$/.test(ans)) return false;
        // not strictly increasing or decreasing sequence
        const digits = ans.split("").map(Number);
        let inc = true, dec = true;
        for (let i = 1; i < digits.length; i++) {
          if (digits[i] !== digits[i-1] + 1) inc = false;
          if (digits[i] !== digits[i-1] - 1) dec = false;
        }
        if (inc || dec) return false;
        return true;
      },
      transform: ans => ans
    },
    // 5: Two words concatenated with a symbol in middle (word1!word2)
    {
      q: "Type two short words (3-6 letters each) joined by a symbol, e.g., moon#lake",
      validate: ans => {
        const m = ans.match(/^([a-zA-Z]{3,6})([!@#$%^&*])([a-zA-Z]{3,6})$/);
        return !!m;
      },
      transform: ans => ans
    }
  ];

  function askGameQuestion() {
    const level = securityQuestions[currentLevel];
    gameQuestion.textContent = `Level ${currentLevel + 1}: ${level.q}`;
  }

  startGameBtn?.addEventListener("click", () => {
    if (!gameArea) return;
    gameArea.style.display = "block";
    startGameBtn.style.display = "none";
    currentLevel = 0;
    builtPassword = "";
    // optionally play small game music (we use gameMusicEl if present)
    try { gameMusicEl?.play().catch(()=>{}); } catch(e){}
    askGameQuestion();
  });

  submitAnswerBtn?.addEventListener("click", () => {
    const ans = (gameAnswer?.value || "").trim();
    const levelObj = securityQuestions[currentLevel];
    if (levelObj.validate(ans)) {
      builtPassword += levelObj.transform(ans);
      currentLevel++;
      gameAnswer.value = "";
      if (currentLevel < securityQuestions.length) {
        askGameQuestion();
      } else {
        // final password ready
        if (passwordInput) {
          passwordInput.value = builtPassword;
          passwordInput.dispatchEvent(new Event("input"));
        }
        gameArea.innerHTML = `<p style="font-weight:600; padding:12px;">🎉 Strong gamified password created!</p>
                              <p style="font-size:0.9rem; color:#555;">You can copy the password or regenerate with the generator.</p>`;
        try { gameMusicEl?.pause(); } catch(e){}
      }
    } else {
      // nicer inline error instead of alert
      flashInvalid("That doesn't match the requirement — try again.");
    }
  });

  function flashInvalid(msg) {
    const prev = gameArea.querySelector(".invalid-msg");
    if (prev) prev.remove();
    const p = document.createElement("div");
    p.className = "invalid-msg";
    p.textContent = `❌ ${msg}`;
    p.style.color = "#c0392b";
    p.style.marginTop = "8px";
    p.style.fontSize = "0.95rem";
    gameArea.appendChild(p);
    setTimeout(() => p.remove(), 2200);
  }

  /* ---------------------------
     YouTube Lofi Background Player + Controls
     - Uses the IFrame API so we can set volume and control playback
     - We autoplay muted on load (browser autoplay rules).
     - The control UI is created dynamically in top-right if not present.
  --------------------------- */

  // Only one player instance
  let ytPlayer = null;
  let ytReady = false;
  const YT_VIDEO_ID = "8b3fqIBrNW0"; // from user link
  const MUSIC_KEY = "pw_music_pref"; // stores {volume,muted,playing}

  // create controls container
  function createMusicControlsUI() {
    if ($(".music-controls")) return; // already created
    const wrapper = document.createElement("div");
    wrapper.className = "music-controls";
    wrapper.style.position = "fixed";
    wrapper.style.right = "20px";
    wrapper.style.top = "20px";
    wrapper.style.background = "white";
    wrapper.style.borderRadius = "12px";
    wrapper.style.padding = "10px";
    wrapper.style.boxShadow = "0 6px 18px rgba(0,0,0,0.08)";
    wrapper.style.display = "flex";
    wrapper.style.gap = "8px";
    wrapper.style.alignItems = "center";
    wrapper.style.zIndex = "999";

    const playBtn = document.createElement("button");
    playBtn.id = "yt-play";
    playBtn.textContent = "▶ Play";
    playBtn.style.padding = "6px 10px";
    playBtn.style.borderRadius = "8px";
    playBtn.style.cursor = "pointer";

    const muteBtn = document.createElement("button");
    muteBtn.id = "yt-mute";
    muteBtn.textContent = "🔇";
    muteBtn.style.padding = "6px 10px";
    muteBtn.style.borderRadius = "8px";
    muteBtn.style.cursor = "pointer";

    const vol = document.createElement("input");
    vol.type = "range";
    vol.min = "0";
    vol.max = "1";
    vol.step = "0.01";
    vol.value = "0.5";
    vol.id = "yt-volume";
    vol.style.width = "90px";

    // invisible iframe container
    const iframeHolder = document.createElement("div");
    iframeHolder.id = "yt-iframe-holder";
    iframeHolder.style.width = "0";
    iframeHolder.style.height = "0";
    iframeHolder.style.overflow = "hidden";
    iframeHolder.style.position = "absolute";

    wrapper.appendChild(playBtn);
    wrapper.appendChild(muteBtn);
    wrapper.appendChild(vol);
    document.body.appendChild(wrapper);
    document.body.appendChild(iframeHolder);

    // events
    playBtn.addEventListener("click", () => {
      if (!ytReady) return;
      ytPlayer.getPlayerState && (ytPlayer.getPlayerState() !== 1 ? ytPlayer.playVideo() : ytPlayer.pauseVideo());
    });

    muteBtn.addEventListener("click", () => {
      if (!ytReady) return;
      if (ytPlayer.isMuted()) {
        ytPlayer.unMute();
        muteBtn.textContent = "🔊";
      } else {
        ytPlayer.mute();
        muteBtn.textContent = "🔇";
      }
      saveMusicPrefs();
    });

    vol.addEventListener("input", () => {
      if (!ytReady) return;
      const v = Math.round(parseFloat(vol.value) * 100);
      try { ytPlayer.setVolume(v); } catch (e) {}
      saveMusicPrefs();
    });
  }

  createMusicControlsUI();

  // persist/load music prefs
  function saveMusicPrefs() {
    const volInput = $("#yt-volume");
    const muteBtn = $("#yt-mute");
    const playBtn = $("#yt-play");
    const prefs = {
      volume: volInput ? parseFloat(volInput.value) : 0.5,
      muted: muteBtn ? muteBtn.textContent === "🔇" : false,
      playing: (ytPlayer && ytReady) ? (ytPlayer.getPlayerState() === 1) : false
    };
    localStorage.setItem(MUSIC_KEY, JSON.stringify(prefs));
  }
  function loadMusicPrefs() {
    const raw = localStorage.getItem(MUSIC_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  // Load YT IFrame API
  (function loadYTApi() {
    if (window.YT && window.YT.Player) {
      onYouTubeIframeAPIReady();
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    // onYouTubeIframeAPIReady will be called by the API when ready
  })();

  // This function must be globally named for the YouTube IFrame API to call it.
  window.onYouTubeIframeAPIReady = function () {
    const holder = document.getElementById("yt-iframe-holder");
    const playerDiv = document.createElement("div");
    playerDiv.id = "yt-player";
    holder.appendChild(playerDiv);

    ytPlayer = new YT.Player("yt-player", {
      height: "0",
      width: "0",
      videoId: YT_VIDEO_ID,
      playerVars: {
        autoplay: 1,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        loop: 1,
        playlist: YT_VIDEO_ID,
        disablekb: 1,
        fs: 0
      },
      events: {
        onReady: (e) => {
          ytReady = true;
          // set initial prefs
          const prefs = loadMusicPrefs() || { volume: 0.5, muted: true, playing: true };
          // volume expects 0..100
          try { ytPlayer.setVolume(Math.round((prefs.volume ?? 0.5) * 100)); } catch {}
          const volInput = $("#yt-volume");
          if (volInput) volInput.value = (prefs.volume ?? 0.5);

          if (prefs.muted) {
            ytPlayer.mute();
            $("#yt-mute").textContent = "🔇";
          } else {
            ytPlayer.unMute();
            $("#yt-mute").textContent = "🔊";
          }

          // Attempt play; if browser blocks sound we are muted by default, so it's OK.
          try { ytPlayer.playVideo(); } catch (e) {}

          // Wire up a small state observer for play/pause text
          setInterval(() => {
            const state = ytPlayer && ytReady ? ytPlayer.getPlayerState() : -1;
            const playBtn = $("#yt-play");
            if (!playBtn) return;
            // Player states: 1=playing, 2=paused, -1=unstarted
            if (state === 1) playBtn.textContent = "⏸ Pause";
            else playBtn.textContent = "▶ Play";
          }, 300);

          // Save prefs periodically
          setInterval(saveMusicPrefs, 2000);
        },
        onStateChange: (e) => {
          // keep looped
          if (e.data === YT.PlayerState.ENDED) {
            try { ytPlayer.playVideo(); } catch (e) {}
          }
        }
      }
    });
  };

  /* ---------------------------
     Small polish: keyboard support
  --------------------------- */
  document.addEventListener("keydown", (e) => {
    // Enter in game answer to submit
    if (e.key === "Enter" && gameArea?.style.display !== "none" && document.activeElement === gameAnswer) {
      submitAnswerBtn?.click();
    }
    // Ctrl+G to open generator modal
    if (e.ctrlKey && e.key.toLowerCase() === "g") {
      openGeneratorBtn?.click();
    }
  });

  /* ---------------------------
     Initial UI refresh
  --------------------------- */
  // Trigger initial evaluation (if there's already a value)
  if (passwordInput && passwordInput.value) {
    passwordInput.dispatchEvent(new Event("input"));
  } else {
    // show baseline requirements
    updateRequirements({ lengthOK: false, lengthStrong: false, hasUpper: false, hasLower: false, hasNumber: false, hasSpecial: false });
    updateProgressBar(0, "#e74c3c");
    strengthText.textContent = "Strength: Requirements not met ❌";
    strengthText.style.color = "#e74c3c";
  }

  // If sliders exist, ensure their labels match
  refreshSliderValues();

}); // DOMContentLoaded end

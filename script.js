/*
 * script.js - Password Trainer
 * CS50x Final Project
 *
 * Author: [Your Name]
 * GitHub: [Your GitHub Username]
 * edX:    [Your edX Username]
 *
 * NOTE: The UI layout and styling of this project were built with assistance
 * from Claude (Anthropic) via claude.ai. The core logic was written and
 * understood by the author as part of this CS50 submission.
 * The Gamified Mode was inspired by The Password Game by Neal Agarwal (neal.fun).
 * AI use is disclosed in accordance with CS50's Academic Honesty policy.
 */

// =============================================================================
// DOM ELEMENTS
// document.getElementById finds an HTML element by its id attribute.
// We store each one in a variable so we can read or change it later.
// =============================================================================

var pwInput       = document.getElementById("pwInput");
var showPw        = document.getElementById("showPw");
var strengthLabel = document.getElementById("strengthLabel");
var bar           = document.getElementById("bar");
var bitsLabel     = document.getElementById("bitsLabel");
var tip           = document.getElementById("tip");

var btnPassword   = document.getElementById("btnPassword");
var btnGame       = document.getElementById("btnGame");
var passwordMode  = document.getElementById("passwordMode");
var gameMode      = document.getElementById("gameMode");

var gamePw        = document.getElementById("gamePw");
var restartBtn    = document.getElementById("restartBtn");
var gameBar       = document.getElementById("gameBar");
var gameCount     = document.getElementById("gameCount");
var rulesList     = document.getElementById("rulesList");
var winBox        = document.getElementById("winBox");
var winPw         = document.getElementById("winPw");
var playAgain     = document.getElementById("playAgain");

// =============================================================================
// TIPS ARRAY
// An array stores multiple values under one variable name.
// We pick one randomly on page load to show in the tip box.
// =============================================================================

var tips = [
  "Use a passphrase — a short sentence is easy to remember and hard to crack.",
  "Never use the same password on two different websites.",
  "Longer passwords are stronger. 20 random letters beats 8 mixed characters.",
  "Avoid using your name, birthday, or pet's name in your password.",
  "Turn on two-factor authentication wherever you can for extra protection.",
];

// =============================================================================
// ENTROPY CALCULATION
// Entropy tells us how hard a password is to guess, measured in bits.
// The formula is: bits = length x log2(pool size)
// Pool size = how many different characters the attacker must consider.
// Example: only lowercase letters = pool of 26.
//          lowercase + digits = pool of 36.
// The more bits, the longer it takes to crack the password by guessing.
// =============================================================================

function calcEntropy(pw) {
  var pool = 0;
  if (/[a-z]/.test(pw)) pool = pool + 26;
  if (/[A-Z]/.test(pw)) pool = pool + 26;
  if (/[0-9]/.test(pw)) pool = pool + 10;
  if (/[^A-Za-z0-9]/.test(pw)) pool = pool + 32;
  if (pool === 0) pool = 26;
  return pw.length * Math.log2(pool);
}

// =============================================================================
// PASSWORD SCORE
// We check 7 criteria and give 1 point for each one met.
// The score (0-7) is used to fill the progress bar and pick a label.
// =============================================================================

function calcScore(pw) {
  var score = 0;
  if (pw.length >= 8)            score = score + 1;
  if (pw.length >= 12)           score = score + 1;
  if (/[A-Z]/.test(pw))          score = score + 1;
  if (/[a-z]/.test(pw))          score = score + 1;
  if (/[0-9]/.test(pw))          score = score + 1;
  if (/[^A-Za-z0-9]/.test(pw))  score = score + 1;
  if (!(/(.)\1\1/.test(pw)) && pw.length > 0) score = score + 1;
  return score;
}

// =============================================================================
// UPDATE CHECKLIST
// Loops through each criterion and marks it green (pass) or grey (fail).
// =============================================================================

function updateChecklist(pw) {
  var results = [
    pw.length >= 8,
    pw.length >= 12,
    /[A-Z]/.test(pw),
    /[a-z]/.test(pw),
    /[0-9]/.test(pw),
    /[^A-Za-z0-9]/.test(pw),
    !(/(.)\1\1/.test(pw)) && pw.length > 0,
  ];

  var labels = [
    "At least 8 characters",
    "At least 12 characters",
    "Uppercase letter (A-Z)",
    "Lowercase letter (a-z)",
    "A number (0-9)",
    "A special character (!@#$...)",
    "No 3 repeated chars in a row",
  ];

  for (var i = 0; i < results.length; i++) {
    var el = document.getElementById("c" + (i + 1));
    if (results[i]) {
      el.textContent = "✓ " + labels[i];
      el.className = "check-item pass";
    } else {
      el.textContent = labels[i];
      el.className = "check-item";
    }
  }
}

// =============================================================================
// UPDATE STRENGTH
// This runs every time the user types a character.
// It recalculates the score, updates the bar, label, bits, and checklist.
// =============================================================================

function updateStrength() {
  var pw = pwInput.value;

  if (pw.length === 0) {
    strengthLabel.textContent = "Strength: —";
    bar.style.width = "0%";
    bitsLabel.textContent = "Bits of entropy: —";
    updateChecklist("");
    return;
  }

  var score = calcScore(pw);
  var bits  = calcEntropy(pw);

  // Update bits label
  bitsLabel.textContent = "Bits of entropy: " + bits.toFixed(1);

  // Update progress bar: score out of 7 criteria
  bar.style.width = Math.round((score / 7) * 100) + "%";

  // Pick a label and bar color based on the score
  if (score <= 2) {
    strengthLabel.textContent = "Strength: Weak";
    bar.style.background = "#ef4444";
  } else if (score <= 4) {
    strengthLabel.textContent = "Strength: Fair";
    bar.style.background = "#f59e0b";
  } else if (score <= 6) {
    strengthLabel.textContent = "Strength: Strong";
    bar.style.background = "#10b981";
  } else {
    strengthLabel.textContent = "Strength: Excellent";
    bar.style.background = "#4f46e5";
  }

  updateChecklist(pw);
}

// Listen for input events — fires every time the user types or deletes a char
pwInput.addEventListener("input", updateStrength);

// Toggle showing the password text
showPw.addEventListener("change", function() {
  if (showPw.checked) {
    pwInput.type = "text";
  } else {
    pwInput.type = "password";
  }
});

// =============================================================================
// MODE SWITCHING
// Switches between Password Mode and Gamified Mode.
// Adds/removes the "hidden" class (display:none in CSS) and "active" on pills.
// =============================================================================

btnPassword.addEventListener("click", function() {
  btnPassword.className = "pill active";
  btnGame.className = "pill";
  passwordMode.className = "card";
  gameMode.className = "card hidden";
});

btnGame.addEventListener("click", function() {
  btnGame.className = "pill active";
  btnPassword.className = "pill";
  gameMode.className = "card";
  passwordMode.className = "card hidden";
  if (!gameStarted) {
    startGame();
  }
});

// =============================================================================
// GAMIFIED MODE - The Password Game
// Inspired by The Password Game by Neal Agarwal (neal.fun/password-game)
//
// Rules are defined as objects inside an array.
// Each rule has a title, a description, a hint, and a check function.
// Rules unlock one at a time — a new rule only appears once all visible
// rules are satisfied. This is done with a simple loop and a counter.
// =============================================================================

var gameStarted   = false;
var allRules      = [];
var visibleCount  = 0;  // how many rules are currently shown

function buildRules() {
  var today   = new Date();
  var month   = today.toLocaleString("default", { month: "long" });
  var day     = today.toLocaleString("default", { weekday: "long" });
  var year    = String(today.getFullYear());

  // Each rule is an object with: title, desc, hint, check (a function)
  return [
    {
      title: "Length Check",
      desc:  "Your password must be at least 5 characters.",
      hint:  "Just start typing!",
      check: function(p) { return p.length >= 5; }
    },
    {
      title: "Add a Number",
      desc:  "Your password must include at least one number.",
      hint:  "Add any digit: 0 through 9.",
      check: function(p) { return /[0-9]/.test(p); }
    },
    {
      title: "Uppercase Letter",
      desc:  "Your password must include an uppercase letter.",
      hint:  "Hold Shift and press a letter.",
      check: function(p) { return /[A-Z]/.test(p); }
    },
    {
      title: "Special Character",
      desc:  "Your password must include a special character like ! @ # $ % ^ & *",
      hint:  "Try adding an exclamation mark or hash symbol.",
      check: function(p) { return /[!@#$%^&*]/.test(p); }
    },
    {
      title: "12 Characters",
      desc:  "Your password must be at least 12 characters long.",
      hint:  "Keep typing until you reach 12 characters.",
      check: function(p) { return p.length >= 12; }
    },
    {
      title: "Current Month",
      desc:  "Your password must contain the name of this month: " + month + ".",
      hint:  "Type the word: " + month,
      check: function(p) { return p.toLowerCase().indexOf(month.toLowerCase()) !== -1; }
    },
    {
      title: "Digit Sum",
      desc:  "All the digits in your password must add up to at least 25.",
      hint:  "Try adding 9 + 9 + 9 = 27.",
      check: function(p) {
        var sum = 0;
        for (var i = 0; i < p.length; i++) {
          if (p[i] >= "0" && p[i] <= "9") {
            sum = sum + parseInt(p[i]);
          }
        }
        return sum >= 25;
      }
    },
    {
      title: "Day of the Week",
      desc:  "Your password must contain today's day: " + day + ".",
      hint:  "Type the word: " + day,
      check: function(p) { return p.toLowerCase().indexOf(day.toLowerCase()) !== -1; }
    },
    {
      title: "Current Year",
      desc:  "Your password must include the current year: " + year + ".",
      hint:  "Add the four digits: " + year,
      check: function(p) { return p.indexOf(year) !== -1; }
    },
    {
      title: "No Triple Repeats",
      desc:  "Your password must not have the same character three times in a row.",
      hint:  "Avoid things like aaa or 111.",
      check: function(p) { return !(/(.)\1\1/.test(p)); }
    },
    {
      title: "Contains 'secure'",
      desc:  "Your password must contain the word: secure",
      hint:  "Just type the word: secure",
      check: function(p) { return p.toLowerCase().indexOf("secure") !== -1; }
    },
    {
      title: "20 Characters",
      desc:  "Your password must be at least 20 characters long.",
      hint:  "Keep adding characters until you hit 20.",
      check: function(p) { return p.length >= 20; }
    },
  ];
}

function startGame() {
  gameStarted  = true;
  allRules     = buildRules();
  visibleCount = 1;  // start by showing only the first rule
  winBox.className = "win-box hidden";
  rulesList.style.display = "flex";
  renderRules("");
}

// Draws all currently visible rule cards and checks each one against the password.
function renderRules(pw) {
  rulesList.innerHTML = "";

  var passed = 0;

  for (var i = 0; i < visibleCount; i++) {
    var rule = allRules[i];
    var ok   = rule.check(pw);

    if (ok) {
      passed = passed + 1;
    }

    // Decide the visual state of this rule card
    var state;
    if (ok) {
      state = "pass";
    } else if (i === visibleCount - 1) {
      // The most recently unlocked rule is "new" (yellow) not "fail" (red)
      // because the player just saw it and hasn't tried it yet
      state = "new";
    } else {
      state = "fail";
    }

    // Build the rule card using createElement and textContent
    var card = document.createElement("div");
    card.className = "rule " + state;

    var header = document.createElement("div");
    header.className = "rule-header";

    var num = document.createElement("div");
    num.className = "rule-num";
    num.textContent = i + 1;

    var title = document.createElement("span");
    title.textContent = rule.title;

    var status = document.createElement("span");
    status.className = "rule-status " + state;
    if (state === "pass") status.textContent = "Pass";
    if (state === "fail") status.textContent = "Fail";
    if (state === "new")  status.textContent = "New";

    header.appendChild(num);
    header.appendChild(title);
    header.appendChild(status);

    var desc = document.createElement("div");
    desc.className = "rule-desc";
    desc.textContent = rule.desc;

    card.appendChild(header);
    card.appendChild(desc);

    // Only show the hint when the rule is not yet satisfied
    if (!ok) {
      var hint = document.createElement("div");
      hint.className = "rule-hint";
      hint.textContent = "Hint: " + rule.hint;
      card.appendChild(hint);
    }

    rulesList.appendChild(card);
  }

  // Update the counter and progress bar
  gameCount.textContent = "Rules passed: " + passed + " / " + allRules.length;

  var pct = Math.round((passed / allRules.length) * 100);
  gameBar.style.width = pct + "%";

  if (pct < 40) {
    gameBar.style.background = "#ef4444";
  } else if (pct < 70) {
    gameBar.style.background = "#f59e0b";
  } else {
    gameBar.style.background = "#10b981";
  }

  // Check if every visible rule is passing — if so, unlock the next one
  var allCurrentPass = true;
  for (var j = 0; j < visibleCount; j++) {
    if (!allRules[j].check(pw)) {
      allCurrentPass = false;
      break;
    }
  }

  if (allCurrentPass && visibleCount < allRules.length) {
    visibleCount = visibleCount + 1;
    renderRules(pw);  // re-draw to show the new rule
    return;
  }

  // Win condition: all rules are passing
  if (passed === allRules.length && allRules.length > 0) {
    winPw.textContent = pw;
    winBox.className = "win-box";
    rulesList.style.display = "none";
  }
}

gamePw.addEventListener("input", function() {
  if (winBox.className === "win-box") return;
  renderRules(gamePw.value);
});

restartBtn.addEventListener("click", function() {
  gamePw.value = "";
  visibleCount = 1;
  winBox.className = "win-box hidden";
  rulesList.style.display = "flex";
  renderRules("");
});

playAgain.addEventListener("click", function() {
  gamePw.value = "";
  visibleCount = 1;
  winBox.className = "win-box hidden";
  rulesList.style.display = "flex";
  renderRules("");
});

// =============================================================================
// INIT
// Runs once when the page loads.
// Picks a random tip and shows the initial (empty) strength check.
// =============================================================================

var randomIndex = Math.floor(Math.random() * tips.length);
tip.textContent = tips[randomIndex];

updateStrength();

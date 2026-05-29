/*
 * script.js - passtrainer
 * HarvardX CS50x Final Project
 * Author - Samuel Kuga 
 * GitHub username - samk90210
 * edX username -  sam_5638
 *
 * Note: I was helped by Claude's anthropedic AI to integrate Neal. Fun's game, the Password game, mechanics into my code. Also, I was assisted by AI in rounding up the UI design and helping me with the color palette for my passtrainer app. 
 */

// variable initialization
// the document.getElementById finds the HTML element by its id attribute. 
// After we get the HTML element, we store into a var to be able to use it later. 

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

// tip array
//An array can store multiple values in the same variable name. 
// From the array, we pick one random to load it into the tip box in the app. 


var tips = [
  "I recommend using a passphrase which is a short sentence that's easy to remember but extremely hard to crack. Keep it simple",
  "Never, I mean NEVER use the same password for any website keep a unique password for each website",
  "Longer passwords are stronger. 20 random letters beats 8 mixed characters.",
  "Avoid using names, birthdays, or anything that might sound like a persons name in your password",
  "Please turn on two factor authentication if you havent so you can protect yourself against cyber attacks",
];

// Entropy calculation
// What is entropy? Entropy enables us to tell how hard a password it to crack and it is alsways measured in bits. 
// The formula for entropy calculation is bits = length x log2(pool size)
// pool size is the total number of possible characters that we/hacker can choose from
// For example, when it's only lowercase letters, the pool is 26. 
//             adding it with digits makes it 36 because there are 10 numbers possible to choose from. 
// The more bits, the longer it takes the hacker to guess the password. 


function calculateEntropy(pw) {
  var pool = 0;
  if (/[a-z]/.test(pw)) pool = pool + 26;
  if (/[A-Z]/.test(pw)) pool = pool + 26;
  if (/[0-9]/.test(pw)) pool = pool + 10;
  if (/[^A-Za-z0-9]/.test(pw)) pool = pool + 32;
  if (pool === 0) pool = 26;
  return pw.length * Math.log2(pool);
}

// password
// to assess each password, we go through a 7-point criteria, and we give the password 1 point for each criterion met. 
// the final score from 0 - 7 is then used to fill in the progress bar. 

function calculateScore(pw) {
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

// Updating the checklist 
// Have a loop that loops through each criteria point and makes it green if it passes and makes it grey if it fails the criteria. 


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

  var labes = [
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
      el.textContent = "✓ " + labes[i];
      el.className = "check-item pass";
    } else {
      el.textContent = labes[i];
      el.className = "check-item";
    }
  }
}

// update strength 
// This runs every time the user types a character.
// the update strength runs in real time as the user types in a character/input. 
// it instantaneously recalculates the password strength, updates the strength bar, label, bits/entropy, and checklist criteria. 


function updateStrength() {
  var pw = pwInput.value;

  if (pw.length === 0) {
    strengthLabel.textContent = "Strength: —";
    bar.style.width = "0%";
    bitsLabel.textContent = "Bits of entropy: —";
    updateChecklist("");
    return;
  }

  var score = calculateScore(pw);
  var bits  = calculateEntropy(pw);

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

// Switching game modes 
// Switches between Password Mode and Gamified Mode.
// Just switches between the password and gamified mode. 
// Adds/removes the "hidden" class (display: none in CSS) and "active" on pills.

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
  if (!gameStart) {
    startGame();
  }
});

//gamified mode - the password game from Neal.fun
// The rules are objects that are inside the array. 
// Each rule has a description, title, and a check function, which checks if it meets the requirements for the game rule. 
// A special rule unlocks once at a time a new rule is visible. Once all rules and their prerequisites have been completed, this is achieved using a loop and 

 

var gameStart   = false;
var allRules      = [];
var visCount  = 0;  // how many rules being shown right now 

function buildRules() {
  var today   = new Date();
  var month   = today.toLocaleString("default", { month: "long" });
  var day     = today.toLocaleString("default", { weekday: "long" });
  var year    = String(today.getFullYear());

  // each rule is an object that is inside the rule object, which includes the title, desc, hint, and check, which is a function that can be called 
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

//start by showing 1 rule not 0 before starting 
function startGame() {
  gameStart  = true;
  allRules     = buildRules();
  visCount = 1;  
  winBox.className = "win-box hidden";
  rulesList.style.display = "flex";
  renderRules("");
}


function renderRules(pw) {
  rulesList.innerHTML = "";

  var passed = 0;

  for (var i = 0; i < visCount; i++) {
    var rule = allRules[i];
    var ok   = rule.check(pw);

    if (ok) {
      passed = passed + 1;
    }

    var state;
    if (ok) {
      state = "pass";
    } else if (i === visCount - 1) {
      //Due to the player recently seeing it and not having tried the new rule for now, it is "new" and not "fail."
      state = "new"
    } else {
      state = "fail";
    }
    
    // Using createElement and textContent, we can create the rule card
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

    //Prerequisite for showing the hint is when rule conditions are not satisfied,
    if (!ok) {
      var hint = document.createElement("div");
      hint.className = "rule-hint";
      hint.textContent = "Hint: " + rule.hint;
      card.appendChild(hint);
    }

    rulesList.appendChild(card);
  }

  //updating the progress and counter bar
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

  // allCurrPass checks if every rule that is visible to the user is true, and if so, moves on to the next
  var allCurrPass = true;
  for (var j = 0; j < visCount; j++) {
    if (!allRules[j].check(pw)) {
      allCurrPass = false;
      break;
    }
  }

  if (allCurrPass && visCount < allRules.length) {
    visCount = visCount + 1;
    renderRules(pw);  // re-draw to show the new rule
    return;
  }


  // Win prerequisite - all rules are true / passing. 
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
  visCount = 1;
  winBox.className = "win-box hidden";
  rulesList.style.display = "flex";
  renderRules("");
});

playAgain.addEventListener("click", function() {
  gamePw.value = "";
  visCount = 1;
  winBox.className = "win-box hidden";
  rulesList.style.display = "flex";
  renderRules("");
});

// init
//init runs once the page loads in the web
//takes a random tip from the array and shows the empty strength check because its empty still


var randomIndex = Math.floor(Math.random() * tips.length);
tip.textContent = tips[randomIndex];

updateStrength();

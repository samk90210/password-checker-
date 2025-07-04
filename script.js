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
  const lengthOK = password.length >= 8;
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
  if (score === 5) {
    strength = "Strong ✅";
    color = "green";
  } else if (score >= 3) {
    strength = "Intermediate ⚠️";
    color = "orange";
  } else {
    strength = "Weak ❌";
    color = "red";
  }

  return {
    strength,
    color,
    score,
    requirements: { lengthOK, hasUpper, hasLower, hasNumber, hasSpecial }
  };
}

function updateRequirements(reqs) {
  requirementsList.innerHTML = `
    <li style="color: ${reqs.lengthOK ? "green" : "red"}">✔️ At least 8 characters</li>
    <li style="color: ${reqs.hasUpper ? "green" : "red"}">✔️ Uppercase letter</li>
    <li style="color: ${reqs.hasLower ? "green" : "red"}">✔️ Lowercase letter</li>
    <li style="color: ${reqs.hasNumber ? "green" : "red"}">✔️ Number</li>
    <li style="color: ${reqs.hasSpecial ? "green" : "red"}">✔️ Special character</li>
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

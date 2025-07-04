const passwordInput = document.getElementById("password");
const strengthText = document.getElementById("strength-text");
const requirementsList = document.getElementById("requirements");

passwordInput.addEventListener("input", function () {
  const password = passwordInput.value;
  const result = evaluatePassword(password);
  strengthText.textContent = `Strength: ${result.strength}`;
  strengthText.style.color = result.color;
  updateRequirements(result.requirements);
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

  let strength;
  let color;
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
    requirements: {
      lengthOK,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial
    }
  };
}

function updateRequirements(reqs) {
  requirementsList.innerHTML = `
    <li style="color: ${reqs.lengthOK ? "green" : "red"}">✔️ At least 8 characters</li>
    <li style="color: ${reqs.hasUpper ? "green" : "red"}">✔️ Contains an uppercase letter</li>
    <li style="color: ${reqs.hasLower ? "green" : "red"}">✔️ Contains a lowercase letter</li>
    <li style="color: ${reqs.hasNumber ? "green" : "red"}">✔️ Contains a number</li>
    <li style="color: ${reqs.hasSpecial ? "green" : "red"}">✔️ Contains a special character (!@#$ etc.)</li>
  `;
}

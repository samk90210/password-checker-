const passwordInput = document.getElementById("password");
const strengthText = document.getElementById("strength-text");

passwordInput.addEventListener("input", function () {
  const password = passwordInput.value;
  const feedback = evaluatePassword(password);
  strengthText.textContent = feedback.text;
  strengthText.style.color = feedback.color;
});

function evaluatePassword(password) {
  const lengthOK = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[\W_]/.test(password); // includes symbols like !@#$%^&*()

  let score = 0;
  if (lengthOK) score++;
  if (hasUpper) score++;
  if (hasLower) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  if (score === 5) {
    return {
      text: "🟢 Strong Password ✅ (meets all requirements)",
      color: "green",
    };
  } else if (score >= 3) {
    return {
      text: "🟠 Medium Password ⚠️ (missing some security elements)",
      color: "orange",
    };
  } else {
    return {
      text: "🔴 Weak Password ❌ (easy to crack)",
      color: "red",
    };
  }
}

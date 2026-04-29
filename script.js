const passwordInput = document.getElementById("password")
const strengthText = document.getElementById("strength-text")
const progressFill = document.getElementById("progress-fill")
const complexityEl = document.getElementById("complexity")
const ttc1e3 = document.getElementById("ttc-1e3")
const ttc1e9 = document.getElementById("ttc-1e9")
const ttc1e12 = document.getElementById("ttc-1e12")
const copyBtn = document.getElementById("copy-btn")
const togglePassword = document.getElementById("toggle-password")
const generatorModal = document.getElementById("generator-modal")
const openGeneratorBtn = document.getElementById("open-generator-btn")
const generatorCancel = document.getElementById("generator-cancel")
const generateBtn = document.getElementById("generate-btn")
const lengthSlider = document.getElementById("length-slider")
const numberSlider = document.getElementById("number-slider")
const specialSlider = document.getElementById("special-slider")
const lengthValue = document.getElementById("length-value")
const numberValue = document.getElementById("number-value")
const specialValue = document.getElementById("special-value")

function entropy(password) {
  let pool = 0
  if (/[a-z]/.test(password)) pool += 26
  if (/[A-Z]/.test(password)) pool += 26
  if (/[0-9]/.test(password)) pool += 10
  if (/[^A-Za-z0-9]/.test(password)) pool += 32
  if (pool === 0) pool = 26
  return password.length * Math.log2(pool)
}

function formatTime(seconds) {
  if (seconds > 31536000) return Math.floor(seconds / 31536000) + " years"
  if (seconds > 86400) return Math.floor(seconds / 86400) + " days"
  if (seconds > 3600) return Math.floor(seconds / 3600) + " hours"
  if (seconds > 60) return Math.floor(seconds / 60) + " minutes"
  return Math.floor(seconds) + " seconds"
}

function updateStrength() {
  const pw = passwordInput.value
  const bits = entropy(pw)
  complexityEl.textContent = "Password complexity: " + bits.toFixed(2) + " bits"
  const guesses1 = 2 ** bits / 1000
  const guesses2 = 2 ** bits / 1e9
  const guesses3 = 2 ** bits / 1e12
  ttc1e3.textContent = formatTime(guesses1)
  ttc1e9.textContent = formatTime(guesses2)
  ttc1e12.textContent = formatTime(guesses3)

  let score = 0
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  // FIXED: was [progressFill.style](http://progressFill.style).width
  progressFill.style.width = (score / 5 * 100) + "%"

  if (score <= 2) {
    strengthText.textContent = "Password strength: Weak ❌"
    progressFill.style.background = "red"
  } else if (score <= 4) {
    strengthText.textContent = "Password strength: Medium ⚠️"
    progressFill.style.background = "orange"
  } else {
    strengthText.textContent = "Password strength: Strong ✅"
    progressFill.style.background = "green"
  }
}

passwordInput.addEventListener("input", updateStrength)

togglePassword.onchange = () => {
  passwordInput.type = togglePassword.checked ? "text" : "password"
}

copyBtn.onclick = () => {
  navigator.clipboard.writeText(passwordInput.value)
}

openGeneratorBtn.onclick = () => {
  generatorModal.classList.add("show")
}

generatorCancel.onclick = () => {
  generatorModal.classList.remove("show")
}

function generatePassword(len, numbers, specials) {
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const digits = "0123456789"
  const special = "!@#$%^&*"
  let arr = []
  for (let i = 0; i < numbers; i++)
    arr.push(digits[Math.floor(Math.random() * digits.length)])
  for (let i = 0; i < specials; i++)
    arr.push(special[Math.floor(Math.random() * special.length)])
  while (arr.length < len)
    arr.push(letters[Math.floor(Math.random() * letters.length)])
  return arr.sort(() => Math.random() - 0.5).join("")
}

generateBtn.onclick = () => {
  const pw = generatePassword(
    +lengthSlider.value,
    +numberSlider.value,
    +specialSlider.value
  )
  passwordInput.value = pw
  updateStrength()
  generatorModal.classList.remove("show")
}

lengthSlider.oninput = () => lengthValue.textContent = lengthSlider.value
numberSlider.oninput = () => numberValue.textContent = numberSlider.value
specialSlider.oninput = () => specialValue.textContent = specialSlider.value

updateStrength()

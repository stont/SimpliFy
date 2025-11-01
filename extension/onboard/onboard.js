// onboard.js - onboarding logic for SimpliFy -

// Language selection logic
function detectBrowserLanguage() {
  const browserLang = navigator.language || navigator.userLanguage || 'en';
  // Map browserLang to supported language code
  const langCode = browserLang.split('-')[0];
  const select = document.getElementById('language');
  if (select && select.querySelector(`option[value='${langCode}']`)) {
    select.value = langCode;
  } else {
    select.value = 'en'; // fallback
  }
  // Save detected language
  localStorage.setItem('accessibilityLanguage', select.value);
}

//Check AI Availability for Summarizer, Writer and Rewriter
async function CheckAiAvailability() {
  // Helper to check a single model
  async function isModelAvailable(name) {
    // Properly check existence on global scope
    if (!(name in self)) {
      console.log(`${name} API not found`);
      return false;
    }
    const model = self[name];
    if (typeof model === 'undefined') {
      console.log(`${name} is undefined`);
      return false;
    }
    if (typeof model.availability !== 'function') {
      console.log(`${name}.availability is not a function`);
      return false;
    }
    try {
      const result = await model.availability({
        expectedInputLanguages: ["en-US"],
        outputLanguage: "en-US",
      });
      console.log(`${name} availability:`, result);
      // Normalize result to a string state if possible
      let state = '';
      if (typeof result === 'string') state = result;
      else if (result && typeof result === 'object') {
        state = result.state || result.status || result.availability || '';
      }
      return String(state).toLowerCase() === 'available';
    } catch (err) {
      console.warn(`${name} availability check failed:`, err);
      return false;
    }
  }

  const models = ['Summarizer', 'Rewriter', 'Writer'];
  for (const m of models) {
    const ok = await isModelAvailable(m);
    if (!ok) return false;
  }
  return true;
}

document.addEventListener('DOMContentLoaded', async () => {
  // Wait for shared.js to populate options
  setTimeout(detectBrowserLanguage, 100);
  const select = document.getElementById('language');
  if (select) {
    select.addEventListener('change', function () {
      localStorage.setItem('accessibilityLanguage', this.value);
    });
  }

  //Check AI Availability and redirect to setup if any model missing/unavailable
  try {
    const allAvailable = await CheckAiAvailability();
    if (!allAvailable) {
      // Navigate to setup if any model is missing or not available
      window.location.href = '../setup/setup.html';
      return;
    }
  } catch (e) {
    console.warn('Error while checking AI availability:', e);
    window.location.href = '../setup/setup.html';
    return;
  }

  // Auto-navigate to last selected page if it exists
  const lastPage = localStorage.getItem('accessibilityCondition');
  if (lastPage === 'visual' || lastPage === 'auditory' || lastPage === 'autism') {
    window.location.href = `../${lastPage}/index.html`;
  } else {
    // Wait for user input
    document.querySelectorAll('.access-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const type = this.getAttribute('data-type');
        localStorage.setItem('accessibilityCondition', type);
        window.location.href = `../${type}/index.html`;
      });
    });
  }
});

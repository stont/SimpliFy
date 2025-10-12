// onboard.js - onboarding logic for SimpliFy -

// Auto-navigate to last selected page if it exists
const lastPage = localStorage.getItem('accessibilityCondition');
if (lastPage === 'visual' || lastPage === 'auditory' || lastPage === 'autism') {
  window.location.href = `../${lastPage}/index.html`;
} else {
  // Wait for user input
  document.querySelectorAll('.access-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const type = this.getAttribute('data-type');
      localStorage.setItem('accessibilityCondition', type);
      window.location.href = `../${type}/index.html`;
    });
  });
}

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

document.addEventListener('DOMContentLoaded', () => {
  // Wait for shared.js to populate options
  setTimeout(detectBrowserLanguage, 100);
  const select = document.getElementById('language');
  if (select) {
    select.addEventListener('change', function() {
      localStorage.setItem('accessibilityLanguage', this.value);
    });
  }
});

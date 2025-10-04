// shared.js - shared logic for SimpliFy extension

const languageNames = {
  'auto': 'Auto-detect',
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'nl': 'Dutch',
  'sv': 'Swedish',
  'no': 'Norwegian',
  'da': 'Danish',
  'fi': 'Finnish',
  'pl': 'Polish',
  'tr': 'Turkish',
  'yo': 'Yoruba',
  'ig': 'Ibo',
  'ha': 'Hausa'
};

function populateLanguageSelect(selectId = 'language') {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = '';
  Object.entries(languageNames).forEach(([code, name]) => {
    // For Material Web select
    const option = document.createElement('md-select-option');
    option.value = code;
    option.textContent = name;
    select.appendChild(option);
  });
}

function setupBackButton(btnId = 'backBtn') {
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.addEventListener('click', () => {
      window.location.href = '../onboard/index.html';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  //populateLanguageSelect();
  setupBackButton();
});

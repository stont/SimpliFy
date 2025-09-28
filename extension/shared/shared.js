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
    const option = document.createElement('option');
    option.value = code;
    option.textContent = name;
    select.appendChild(option);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  populateLanguageSelect();
});

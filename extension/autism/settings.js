// Handles autism settings form

// Logic for the clear cache button
const clearBtn = document.getElementById('clearCacheBtn');
const msg = document.getElementById('clearCacheMsg');
if (clearBtn) {
  clearBtn.addEventListener('click', function() {
    localStorage.clear();
    if (msg) {
      msg.textContent = 'Local cache cleared.';
      msg.style.display = 'block';
      setTimeout(() => { msg.style.display = 'none'; }, 2000);
    }
    // Notify content script to clear cache in main world
   sendClearStorage();
  });
}

// Use the correct IDs from the HTML
const simplificationSlider = document.getElementById('simplifyLevel');
const simplificationValue = document.getElementById('simplifyLevelValue');
const disableAnimationsCheckbox = document.getElementById('disableAnimations');
const blockBadWordsCheckbox = document.getElementById('blockBadWords');

function getSimplificationLabel(val) {
  val = Number(val);
  if (val === 0) return '0 (No Change)';
  if (val > 0 && val < 50) return val + ' (Slight Simplified)';
  if (val === 50) return '50 (Medium)';
  if (val > 50 && val < 100) return val + ' (Strongly Simplified)';
  if (val >= 100) return val + ' (Max Simplified)';
}

// Initialize settings from localStorage to form elements
function initializeSettings() {
  // Simplification Level
  if (simplificationSlider && simplificationValue) {
    const saved = getSimplificationLevel();
    if (saved !== null) {
      simplificationSlider.value = saved;
      simplificationValue.textContent = getSimplificationLabel(Number(saved));
    } else {
      simplificationSlider.value = 50;
      simplificationValue.textContent = getSimplificationLabel(50);
    }
  }
  // Disable Animations
  if (disableAnimationsCheckbox) {
    const saved = getDisableAnimations();
    disableAnimationsCheckbox.checked = saved === 'true';
  }
  // Block Bad Words
  if (blockBadWordsCheckbox) {
    const saved = getBlockBadWords();
    blockBadWordsCheckbox.checked = saved !== 'false'; // default true
  }
}

if (simplificationSlider && simplificationValue) {
  initializeSettings();
  // Only send on slider change, not on load
  simplificationSlider.addEventListener('input', function() {
    simplificationValue.textContent = getSimplificationLabel(Number(this.value));
    localStorage.setItem('autismSimplificationLevel', this.value);
    sendAllSettings();
  });
}
if (disableAnimationsCheckbox) {
  disableAnimationsCheckbox.addEventListener('change', function() {
    localStorage.setItem('autismDisableAnimations', this.checked);
    sendAllSettings();
  });
}
if (blockBadWordsCheckbox) {
  blockBadWordsCheckbox.addEventListener('change', function() {
    localStorage.setItem('autismBlockBadWords', this.checked);
    sendAllSettings();
  });
}

// Listen for settings page being shown and re-initialize slider/label
const settingsBtn = document.getElementById('settingsBtn');
const settingsPage = document.getElementById('settingsPage');
if (settingsBtn && settingsPage) {
  settingsBtn.addEventListener('click', function() {
    initializeSettings();
  });
}

// Helper to get current simplification level
function getSimplificationLevel() {
  return Number(localStorage.getItem('autismSimplificationLevel') || 50);
}

function getDisableAnimations() {
   const val = localStorage.getItem('autismDisableAnimations');
  return val === null ? true : val === 'true';
}
function getBlockBadWords() {
  // Default to true if not set
  const val = localStorage.getItem('autismBlockBadWords');
  return val === null ? true : val === 'true';
}

// On page load, auto-send
window.addEventListener('DOMContentLoaded', sendAllSettings);

function sendAllSettings() {
  const level = getSimplificationLevel();
  const disableAnimations = getDisableAnimations();
  const blockBadWords = getBlockBadWords();
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        data: {
          type: 'autism-simplify-panel',
          simplifyLevel: level,
          disableAnimations: disableAnimations,
          blockBadWords: blockBadWords
        }
      });
    }
  });
}

function sendClearStorage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        data: {
          type: 'autism-simplify-panel',
          clearCache: true
        }
      });
    }
  });
}